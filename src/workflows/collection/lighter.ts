import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Lighter API base url
const L_BASE_URL = "https://mainnet.zklighter.elliot.ai/api/v1";

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

// `/orderBookDetails` response data subset
type OrderBookDetailsResponse = {
	code: number;
	order_book_details: {
		symbol: string;
		open_interest: number;
	}[];
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

	// Validate config
	await stepValidateMarkets("lighter", new Set([...stats.order_book_stats.map((s) => s.symbol)]));

	// Fetch Lighter order book details for OI
	const obd = await stepFetchJSON<OrderBookDetailsResponse>(`${L_BASE_URL}/orderBookDetails`);

	// Ensure returned Lighter response code validates, even if
	// request itself suceeded
	if (obd.code !== 200) {
		throw new Error(`Lighter orderBookDetails failed with code: ${obd.code}`);
	}

	// Setup OI lookup
	const symbolToOI = new Map(
		obd.order_book_details.map(({ symbol, open_interest }) => [symbol, open_interest])
	);

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Similarly to Hyperliquid, we should just store all of the Lighter data
	// irrespective of filtering by `LOCAL_MARKETS` to ensure we can retain
	// history as new pairs are added and config drifts.
	stats.order_book_stats.forEach((mkt) => {
		const midPx = mkt.last_trade_price;

		rows.push({
			batchId,

			// Market parameters
			venue: "lighter",
			namespace: "",
			ticker: mkt.symbol,

			// FIXME: this is not true, but we assume that Lighter has a
			// sufficient count of trades for now where it's probably
			// a good enough approximation w/o N market book calls
			midPx,

			// Other stats
			// TODO: verify that this is in fact a valid mechanism for FX pairs a la USDCAD
			volume: mkt.daily_quote_token_volume,

			// OI
			// Lighter OI is (long+short)/2 by default
			oi: new Decimal(symbolToOI.get(mkt.symbol) ?? 0).mul(2).mul(new Decimal(midPx)).toNumber()
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
