import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Hyperliquid Info API url
const H_API_URL = "https://api.hyperliquid.xyz/info";

// `"type": "allPerpMetas"` response subset
type AllPerpMetas = {
	universe: {
		name: string;
	}[];
}[];

// `"type": "metaAndAssetCtxs"` response subset
type MetaAndAssetCtxsResponse = [
	{
		universe: {
			name: string;
			maxLeverage: number;
		}[];
	},
	{
		openInterest: string;
		dayNtlVlm: string;
		oraclePx: string;
		markPx: string;
		midPx: string | null;
	}[]
];

/**
 * Collect relevant Hyperliquid market data
 * @returns execution diagnostics
 */
export async function collectHyperliquidMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch perp meta info
	const meta = await stepFetchJSON<AllPerpMetas>(H_API_URL, false, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "allPerpMetas" })
	});

	// Setup set of valid markets
	const validMarkets = meta.flatMap(({ universe }) => universe.map(({ name }) => name));

	// Validate config
	await stepValidateMarkets("hyperliquid", new Set(validMarkets));

	// We filter over all valid DEXes and collect data optimisticaly,
	// even if said DEXes do not contain relevant tracked data.
	//
	// This way, in the future where they add new markets, we can drop in
	// add with historic data.
	const dexs: readonly string[] = [
		...new Set(
			[...validMarkets]
				// Ignore non-HIP-3 dex data
				.filter((market) => market.includes(":"))
				// Grab just HIP-3 dex name
				.map((market) => market.split(":")[0])
		)
	];

	// Fanout: fetch data for each dex in parallel
	const response = await Promise.all(
		dexs.map((dex) =>
			stepFetchJSON<MetaAndAssetCtxsResponse>(H_API_URL, false, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "metaAndAssetCtxs", dex })
			})
		)
	);

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Iterate over response
	response.forEach(([{ universe }, metrics]) => {
		// If no values, continue
		if (universe.length == 0) {
			return;
		}

		// Grab dex name
		const dex = universe[0].name.split(":")[0];

		// In a well structured response, the `universe` of all available markets
		// corresponds 1:1 with the set of all available market `metrics`
		if (universe.length !== metrics.length) {
			throw new Error(`Markets length does not match metrics length (dex: ${dex})`);
		}

		rows.push(
			...universe.map((market, i) => ({
				batchId,

				// Market parameters
				venue: "hyperliquid",
				namespace: dex,
				ticker: market.name.split(":")[1],
				maxLeverage: market.maxLeverage,

				// Market metrics
				midPx: metrics[i].midPx ?? 0,
				markPx: metrics[i].markPx,
				oraclePx: metrics[i].oraclePx,
				volume: metrics[i].dayNtlVlm,

				// OI (default denominated in units not dollar notional)
				oi: new Decimal(metrics[i].openInterest).mul(metrics[i].midPx ?? 0).toNumber()
			}))
		);
	});

	// Insert collected data to database
	const insertedMarkets = await stepInsertMarketEntries(rows);

	// Return execution diagnostics
	return { insertedMarkets };
}
