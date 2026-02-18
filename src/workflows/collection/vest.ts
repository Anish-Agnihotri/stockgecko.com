/*
Vest is one of the few where we do not track all the markets,
given a majority of them are de minimis volume.
*/
import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Vest API url
const V_BASE_URL = "https://server-prod.hz.vestmarkets.com/v2";

// API: `/exchangeInfo` response data subset
type ExchangeInfoResponse = {
	symbols: {
		symbol: string;
		initMarginRatio: string;
		tradingStatus: string;
	}[];
};

// API: `/ticker/24hr` response data subset
type Ticker24hrResponse = {
	tickers: {
		symbol: string;
		quoteVolume: string;
	}[];
};

// API: `/ticker/latest` response data subset
type TickerLatestResponse = {
	tickers: {
		symbol: string;
		markPrice: string;
		indexPrice: string;
	}[];
};

/**
 * Collects relevant Vest market data
 * @returns execution diagnostics
 */
export async function collectVestMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch Vest exchange info
	const { symbols } = await stepFetchJSON<ExchangeInfoResponse>(`${V_BASE_URL}/exchangeInfo`);

	// Filter for only trading pairs
	const trading = symbols.filter(({ tradingStatus }) => tradingStatus === "TRADING");

	// Validate config
	await stepValidateMarkets("vest", new Set(trading.map((s) => s.symbol)));

	// Fetch Vest latest + 24hr ticker data
	const historic = await stepFetchJSON<Ticker24hrResponse>(`${V_BASE_URL}/ticker/24hr`);
	const latest = await stepFetchJSON<TickerLatestResponse>(`${V_BASE_URL}/ticker/latest`);

	// Setup lookup tables from ticker data
	const symbolToVolume = new Map(historic.tickers.map((t) => [t.symbol, Number(t.quoteVolume)]));
	const symbolToPrice = new Map(
		latest.tickers.map((t) => [
			t.symbol,
			{ mark: Number(t.markPrice), index: Number(t.indexPrice) }
		])
	);

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Iterate over all filtered markets
	trading.forEach((market) => {
		rows.push({
			batchId,

			// Market parameters
			venue: "vest",
			namespace: "",
			ticker: market.symbol,

			// Price data
			midPx: symbolToPrice.get(market.symbol)?.mark ?? 0,
			oraclePx: symbolToPrice.get(market.symbol)?.index,

			// Volume
			volume: symbolToVolume.get(market.symbol) ?? 0,

			// Max leverage: 1 / initMarginRatio
			maxLeverage: new Decimal(1).div(new Decimal(market.initMarginRatio)).toNumber()
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
