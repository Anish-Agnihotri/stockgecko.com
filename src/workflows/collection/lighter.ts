import tickers from "$config/tickers.json";
import { getWorkflowMetadata } from "workflow";
import { stepFetchJSON } from "$workflows/shared/fetch";
import { stepInsertMarketEntries } from "$workflows/shared/insert";
import type { MarketEntryCreateInput } from "$prisma/models";

// Lighter API base url
const L_BASE_URL = "https://mainnet.zklighter.elliot.ai/api/v1";

// Find and extract `lighter:` prefixed markets in config
const LOCAL_MARKETS: ReadonlySet<string> = new Set(
	JSON.stringify(tickers)
		// Match all tickers starting with `lighter:`
		.match(/lighter:[^"\\]+/g)
		// Drop `lighter:` prefix
		?.map((s) => s.replace("lighter:", "")) ?? []
);

// `/exchangeStats` response data
// https://apidocs.lighter.xyz/reference/exchangestats
type ExchangeStatsResponse = {
	code: number;
	total: number;
	order_book_stats: {
		symbol: string;
		last_trade_price: number;
		daily_trades_count: number;
		daily_base_token_volume: number;
		daily_quote_token_volume: number;
		daily_price_change: number;
	}[];
	daily_usd_volume: number;
	daily_trades_count: number;
};

/**
 * Collects relevant Lighter market data
 * @returns execution diagnostics
 */
export async function collectLighterMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch Lighter exchange statistics
	const stats = await stepFetchJSON<ExchangeStatsResponse>(`${L_BASE_URL}/exchangeStats`);

	// Ensure returned Lighter response code validates, even if
	// request itself succeeded
	if (stats.code !== 200) {
		throw new Error(`Lighter exchangeStats failed with code: ${stats.code}`);
	}

	// Build set of valid lighter markets
	const validMarkets: ReadonlySet<string> = new Set([
		...stats.order_book_stats.map((s) => s.symbol)
	]);

	// Validate local configuration is subset of valid markets
	if (!LOCAL_MARKETS.isSubsetOf(validMarkets)) {
		// Throw error tracking missing markets
		const missing: readonly string[] = [...LOCAL_MARKETS].filter((m) => !validMarkets.has(m));
		throw new Error(`Lighter config not strict subset: ${missing.join(", ")}`);
	}

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Similarly to Hyperliquid, we should just store all of the Lighter data
	// irrespective of filtering by `LOCAL_MARKETS` to ensure we can retain
	// history as new pairs are added and config drifts.
	stats.order_book_stats.forEach((mkt) =>
		rows.push({
			batchId,

			// Market parameters
			venue: "lighter",
			namespace: "",
			ticker: mkt.symbol,

			// FIXME: this is not true, but we assume that Lighter has a
			// sufficient count of trades for now where it's probably
			// a good enough approximation w/o N market book calls
			midPx: mkt.last_trade_price,

			// Other stats
			volume: mkt.daily_base_token_volume

			// In theory we can capture more statistics here, at least: more price data,
			// oi, and funding, but it would involve at least N parallel requests, so we
			// can circle back if necessary.
		})
	);

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
