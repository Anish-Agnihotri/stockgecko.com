import { fetch } from "workflow";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { stepValidateMarkets } from "$workflows/shared/validate";
import type { AsyncReturn, MethodKeys, MethodAt } from "$lib/types";

/**
 * Generic Hyperliquid API `/info` call via typed `@nktas/hyperliquid.InfoClient` method
 * @param {M} Method to call (e.g, `perpDexs`)
 * @param {Parameters<MethodAt<InfoClient, M>>} args strongly-typed parameters of the method call
 * @returns {Promise<AsyncReturn<MethodAt<InfoClient, M>>>} inferred async method response
 */
async function stepCollectHLInfo<M extends MethodKeys<InfoClient>>(
	method: M,
	...args: Parameters<MethodAt<InfoClient, M>>
): Promise<AsyncReturn<MethodAt<InfoClient, M>>> {
	"use step";

	// Setup client library
	const transport = new HttpTransport();
	const info = new InfoClient({ transport });

	// Collect and run function
	// @dev: not particularly happy camper by this type definition, but we
	// 			 are effectively just constraining the function type
	const fn = info[method].bind(info) as (
		...a: Parameters<MethodAt<InfoClient, M>>
	) => ReturnType<MethodAt<InfoClient, M>>;
	return await fn(...args);
}

/**
 * Collect relevant Hyperliquid market data
 * @returns workflow execution diagnostics
 */
export async function collectHyperliquidMarkets(batchId: string): Promise<{
	collectedDexs: readonly string[];
	insertedMarkets: number;
	failures: { dex: string; error: string }[];
}> {
	"use workflow";

	// `@nktas/hyperliquid.HttpTransport` uses `fetch`
	// Patch `fetch` globally to make workflow-safe
	globalThis.fetch = fetch;

	// Fetch Hyperliquid perp dex info
	const dexInfo = await stepCollectHLInfo("perpDexs");

	// Using fetched data, build a set of all valid Hyperliquid markets
	const validMarkets: ReadonlySet<string> = dexInfo.reduce((acc, cat) => {
		cat?.assetToStreamingOiCap?.forEach((asset) => acc.add(asset[0]));
		return acc;
	}, new Set<string>());

	// Validate config
	await stepValidateMarkets("hyperliquid", validMarkets);

	// We filter over all valid DEXes and collect data optimisticaly,
	// even if said DEXes do not contain relevant tracked data.
	//
	// This way, in the future where they add new markets, we can drop in
	// add with historic data.
	const relevantDexNames: readonly string[] = [
		...new Set([...validMarkets].map((market) => market.split(":")[0]))
	];

	// Fanout: fetch data for each dex in parallel
	const settled = await Promise.allSettled(
		relevantDexNames.map((dex) => stepCollectHLInfo("metaAndAssetCtxs", { dex }))
	);

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];
	const failures: { dex: string; error: string }[] = [];

	for (let i = 0; i < settled.length; i++) {
		// Collect `dex` name and associated settled response
		const dex = relevantDexNames[i];
		const res = settled[i];

		// If response failed, track failure
		if (res.status === "rejected") {
			failures.push({ dex, error: String(res.reason) });
			continue;
		}

		// Destructure relevant data
		const [{ universe }, metrics] = res.value;

		// Associate market metrics to relevant market details
		// First, ensure sufficient metrics for each market
		//
		// In a well structured response, the `universe` of all available markets
		// corresponds 1:1 with the set of all available market `metrics`
		if (universe.length !== metrics.length) {
			failures.push({ dex, error: "Markets length does not match metrics length" });
			continue;
		}

		// Append market data for this `dex` to inserted `rows`
		rows.push(
			...universe.map((market, i) => ({
				batchId,

				// Market parameters
				venue: "hyperliquid",
				namespace: dex,
				ticker: market.name.split(":")[1],
				maxLeverage: market.maxLeverage,

				// Market metrics
				midPx: metrics[i].midPx ?? "0",
				markPx: metrics[i].markPx,
				oraclePx: metrics[i].oraclePx,
				prevDayPx: metrics[i].prevDayPx,
				oi: metrics[i].openInterest,
				funding: metrics[i].funding,
				volume: metrics[i].dayNtlVlm
			}))
		);
	}

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return {
		collectedDexs: relevantDexNames,
		insertedMarkets: insertedCount,
		failures
	};
}
