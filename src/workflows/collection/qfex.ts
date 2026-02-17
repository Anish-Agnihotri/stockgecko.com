import { Decimal } from "decimal.js";
import tickers from "$config/tickers.json";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";

// QFEX API base url
const Q_BASE_URL = "https://api.qfex.com";

// Find and extract `qfex:` prefixed markets in config
const LOCAL_MARKETS: ReadonlySet<string> = new Set(
	JSON.stringify(tickers)
		// Match all tickers starting with `qfex:`
		.match(/qfex:[^"\\]+/g)
		// Drop `qfex:` prefix
		?.map((s) => s.replace("qfex:", "")) ?? []
);

// API: `/symbols/metrics` response data subset
type SymbolsMetricsResponse = {
	data: {
		symbol: string;
		current_mark_price: number;
		volume_24h_usd_notional: number;
		open_interest: number;
	}[];
};

/**
 * Collects relevant QFEX market data
 * @returns execution diagnostics
 */
export async function collectQFEXMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch all QFEX pairs and metrics
	const { data } = await stepFetchJSON<SymbolsMetricsResponse>(`${Q_BASE_URL}/symbols/metrics`);

	// Build set of valid QFEX markets
	const validMarkets: ReadonlySet<string> = new Set(data.map(({ symbol }) => symbol));

	// Validate local configuration is subset of valid markets
	if (!LOCAL_MARKETS.isSubsetOf(validMarkets)) {
		// Throw error tracking missing markets
		const missing: readonly string[] = [...LOCAL_MARKETS].filter((m) => !validMarkets.has(m));
		throw new Error(`QFEX config not strict subset: ${missing.join(", ")}`);
	}

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Store all data, irrespective of config filtering
	data.forEach((mkt) => {
		rows.push({
			batchId,

			// Market parameters
			venue: "qfex",
			namespace: "",
			ticker: mkt.symbol,

			// Price data
			midPx: mkt.current_mark_price,

			// Volume, OI
			volume: mkt.volume_24h_usd_notional,
			oi: new Decimal(mkt.current_mark_price).mul(new Decimal(mkt.open_interest)).toNumber()

			// We can collect `maxLeverage`, etc. from other endpoints, but
			// can circle back later when we augment additional data.
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
