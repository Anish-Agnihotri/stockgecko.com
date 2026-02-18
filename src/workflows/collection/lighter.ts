import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Lighter API base url
const L_BASE_URL = "https://mainnet.zklighter.elliot.ai/api/v1";

// `/exchangeStats` response data subset
// https://apidocs.lighter.xyz/reference/exchangestats
type ExchangeStatsResponse = {
	code: number;
	order_book_stats: {
		symbol: string;
		last_trade_price: number;
		daily_quote_token_volume: number;
	}[];
	daily_usd_volume: number;
};

// `/orderBookDetails` response data subset
type OrderBookDetailsResponse = {
	code: number;
	order_book_details: {
		symbol: string;
		open_interest: number;
		min_initial_margin_fraction: string;
	}[];
};

/**
 * Collects relevant Lighter market data
 */
export async function collectLighterMarkets(batchId: string) {
	"use workflow";

	// Fetch Lighter exchange statistics
	const stats = await stepFetchJSON<ExchangeStatsResponse>(`${L_BASE_URL}/exchangeStats`);

	// Ensure returned Lighter response code validates, even if
	// request itself succeeded
	if (stats.code !== 200) {
		throw new Error(`Lighter exchangeStats failed with code: ${stats.code}`);
	}

	// Validate config
	await stepValidateMarkets("lighter", new Set(stats.order_book_stats.map((s) => s.symbol)));

	// Fetch Lighter order book details for OI
	const obd = await stepFetchJSON<OrderBookDetailsResponse>(`${L_BASE_URL}/orderBookDetails`);

	// Ensure returned Lighter response code validates, even if
	// request itself suceeded
	if (obd.code !== 200) {
		throw new Error(`Lighter orderBookDetails failed with code: ${obd.code}`);
	}

	// Setup order book data lookup
	const symbolToOBD = new Map(
		obd.order_book_details.map(({ symbol, open_interest, min_initial_margin_fraction }) => [
			symbol,
			{ oi: open_interest, m: min_initial_margin_fraction }
		])
	);

	// Similarly to Hyperliquid, we should just store all of the Lighter data
	// irrespective of filtering by `LOCAL_MARKETS` to ensure we can retain
	// history as new pairs are added and config drifts.
	const rows: MarketEntryCreateInput[] = stats.order_book_stats.map((mkt) => {
		const refPx = mkt.last_trade_price;
		const margin = symbolToOBD.get(mkt.symbol)?.m;

		return {
			batchId,
			venue: "lighter",
			namespace: "",
			ticker: mkt.symbol,
			refPx,
			// Lighter OI is (long+short)/2 by default
			oi: new Decimal(symbolToOBD.get(mkt.symbol)?.oi ?? 0)
				.mul(2)
				.mul(new Decimal(refPx))
				.toNumber(),
			volume: Number(mkt.daily_quote_token_volume),
			maxLeverage: margin && margin !== "0" ? new Decimal(10000).div(margin).toNumber() : undefined
		};
	});

	// Insert collected data to database
	await stepInsertMarketEntries(rows);
}
