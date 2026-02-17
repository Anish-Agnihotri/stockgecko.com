import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// QFEX API base url
const Q_BASE_URL = "https://api.qfex.com";

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

	// Validate config
	await stepValidateMarkets("qfex", new Set(data.map(({ symbol }) => symbol)));

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
