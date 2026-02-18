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

// API: `/refdata` response data subset
type RefdataResponse = {
	data: {
		symbol: string;
		default_max_leverage: number;
	}[];
};

/**
 * Collects relevant QFEX market data
 */
export async function collectQFEXMarkets(batchId: string) {
	"use workflow";

	// Fetch all QFEX pairs and metrics
	const { data } = await stepFetchJSON<SymbolsMetricsResponse>(`${Q_BASE_URL}/symbols/metrics`);

	// Validate config
	await stepValidateMarkets("qfex", new Set(data.map(({ symbol }) => symbol)));

	// Fetch ref data to collect `maxLeverage`
	const { data: ref } = await stepFetchJSON<RefdataResponse>(`${Q_BASE_URL}/refdata`);
	const lev = new Map(ref.map(({ symbol, default_max_leverage: l }) => [symbol, l]));

	// Store all data, irrespective of config filtering
	const rows: MarketEntryCreateInput[] = data.map((mkt) => ({
		batchId,
		venue: "qfex",
		namespace: "",
		ticker: mkt.symbol,
		refPx: mkt.current_mark_price,
		volume: mkt.volume_24h_usd_notional,
		oi: mkt.current_mark_price * mkt.open_interest,
		maxLeverage: lev.get(mkt.symbol) ?? 0
	}));

	// Insert collected data to database
	await stepInsertMarketEntries(rows);
}
