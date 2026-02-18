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

// API: `/oi` response data subset
// @dev: undocumented API endpoint
type OIResponse = {
	ois: {
		symbol: string;
		longOi: string;
		shortOi: string;
	}[];
};

/**
 * Collects relevant Vest market data
 */
export async function collectVestMarkets(batchId: string) {
	"use workflow";

	// Fetch Vest exchange info
	const { symbols } = await stepFetchJSON<ExchangeInfoResponse>(`${V_BASE_URL}/exchangeInfo`);

	// Filter for only trading pairs
	const trading = symbols.filter(({ tradingStatus }) => tradingStatus === "TRADING");

	// Validate config
	await stepValidateMarkets("vest", new Set(trading.map((s) => s.symbol)));

	// Fetch Vest latest + 24hr ticker + OI data
	const [historic, latest, oi] = await Promise.all([
		stepFetchJSON<Ticker24hrResponse>(`${V_BASE_URL}/ticker/24hr`),
		stepFetchJSON<TickerLatestResponse>(`${V_BASE_URL}/ticker/latest`),
		stepFetchJSON<OIResponse>(`${V_BASE_URL}/oi`)
	]);

	// Setup lookup tables from ticker data
	const symbolToVolume = new Map(historic.tickers.map((t) => [t.symbol, Number(t.quoteVolume)]));
	const symbolToPrice = new Map(
		latest.tickers.map((t) => [
			t.symbol,
			{ mark: Number(t.markPrice), index: Number(t.indexPrice) }
		])
	);
	const symbolToOI = new Map(oi.ois.map((o) => [o.symbol, { long: o.longOi, short: o.shortOi }]));

	// Iterate over all filtered markets
	const rows: MarketEntryCreateInput[] = trading.map((market) => {
		const refPx = symbolToPrice.get(market.symbol)?.mark ?? 0;

		return {
			batchId,
			venue: "vest",
			namespace: "",
			ticker: market.symbol,
			refPx,
			volume: symbolToVolume.get(market.symbol) ?? 0,
			oi: new Decimal(symbolToOI.get(market.symbol)?.long ?? 0)
				.add(new Decimal(symbolToOI.get(market.symbol)?.short ?? 0))
				.mul(new Decimal(refPx))
				.toNumber(),
			// Max leverage: 1 / initMarginRatio
			maxLeverage: new Decimal(1).div(new Decimal(market.initMarginRatio)).toNumber()
		};
	});

	// Insert collected data to database
	await stepInsertMarketEntries(rows);
}
