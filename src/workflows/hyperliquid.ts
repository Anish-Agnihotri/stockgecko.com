import tickers from "$config/tickers.json";
import { fetch, getWorkflowMetadata } from "workflow";
import type { MarketEntryCreateInput } from "$prisma/models";
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { stepInsertMarketEntries } from "$workflows/shared/insert";
import type { AsyncReturn, MethodKeys, MethodAt } from "$lib/types";

// Find and `hyperliquid:` prefixed markets in config
// Drop `hyperliquid:` prefix and collect just market ticker (e.g., `xyz:XYZ100`)
const LOCAL_MARKETS: ReadonlySet<string> = new Set(
	JSON.stringify(tickers)
		// Match all tickers starting with `hyperliquid:`
		.match(/hyperliquid:[^"\\]+/g)
		// Drop `hyperliquid:` prefix to do direct check
		?.map((s) => s.replace("hyperliquid:", "")) ?? []
);

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
export async function collectHyperliquidMarkets(): Promise<{
	batchId: string;
	collectedDexs: readonly string[];
	insertedMarkets: number;
	failures: { dex: string; error: string }[];
}> {
	"use workflow";

	// Collect unique workflow execution ID
	const { workflowRunId: batchId } = getWorkflowMetadata();

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

	// Compare the `LOCAL_MARKETS` we want to capture (stocks, indices, etc.)
	// Against the full set of valid markets to ensure it is a strict subset
	if (!LOCAL_MARKETS.isSubsetOf(validMarkets)) {
		// Throw error tracking missing markets
		const missing: readonly string[] = [...LOCAL_MARKETS].filter((m) => !validMarkets.has(m));
		throw new Error(`Hyperliquid config not strict subset: ${missing.join(", ")}`);
	}

	// At this point, we have a set of valid markets we would like to collect
	// The effecient mechanism is to collect the full DEX data for relevant DEXES
	//
	// Optionally, we could further filter for relevant markets against `LOCAL_MARKETS`,
	// but this is probably a pre-mature optimization and it helps us to keep unrelated
	// market data in the event that a new, relevant market is added to the config (and
	// then we have pre-existing, historic data if it was subset of a tracked DEX).
	//
	// So, we filter for relevant DEXs to collect by grabbing the `dex` component
	// of `hyperliquid:dex:market`
	const relevantDexNames: readonly string[] = [
		...new Set([...LOCAL_MARKETS].map((market) => market.split(":")[0]))
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
		batchId,
		collectedDexs: relevantDexNames,
		insertedMarkets: insertedCount,
		failures
	};
}
