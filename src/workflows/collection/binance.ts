import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Binance USD{T,C}-margined futures API base url
export const B_BASE_URL = "https://fapi.binance.com";
const B_API_URL = `${B_BASE_URL}/fapi/v1`;

// `/exchangeInfo` response subset
type ExchangeInfoResponse = {
	symbols: {
		symbol: string;
		status: string;
		requiredMarginPercent: string;
		underlyingSubType: string[];
	}[];
};

// `/ticker/24hr` response subset
type HistoricTickerResponse = {
	symbol: string;
	lastPrice: string;
	quoteVolume: string;
}[];

// `/openInterest` response subset
type OpenInterestResponse = {
	symbol: string;
	openInterest: string;
};

/**
 * Executes workflow collection for BinanceLike markets (following USD-margined futures API format)
 * @dev Mostly useful to de-duplicate implementation across Aster, which follows identical API format
 * @param {string} batchId workflow batchId to drill
 * @param {string} venuePrefix to match markets
 * @param {string} apiURL API base URL to query
 * @param {ReadonlySet<string>} subTypes to filter `/exchangeInfo` response for
 * @param {boolean} proxy if proxying through non-geoblocked locale
 * @returns {Promise<{ insertedMarkets: number }>} standard execution diagnostics
 */
export async function collectBinanceLikeMarkets(
	batchId: string,
	venuePrefix: string,
	apiURL: string,
	subTypes: ReadonlySet<string>,
	proxy: boolean
): Promise<{
	insertedMarkets: number;
}> {
	"use step";

	// Fetch Futures API pairs
	const { symbols } = await stepFetchJSON<ExchangeInfoResponse>(`${apiURL}/exchangeInfo`, proxy);

	// Filter for actively-`TRADING` symbols only and only of the `subTypes` to collect
	// Predominantly, this is useful for `Binance` itself, where we have to pre-filter effectively given expansive perp set
	const filteredSymbols = symbols.filter(
		({ status, underlyingSubType }) =>
			status === "TRADING" && new Set(underlyingSubType).intersection(subTypes).size > 0
	);

	// Validate config
	await stepValidateMarkets(venuePrefix, new Set(filteredSymbols.map(({ symbol }) => symbol)));

	// Collect 24hr historic ticker data and create lookup
	const historic = await stepFetchJSON<HistoricTickerResponse>(`${apiURL}/ticker/24hr`, proxy);
	const symbolToHistoricData = new Map(
		historic.map((x) => [x.symbol, { lastPx: Number(x.lastPrice), volume: Number(x.quoteVolume) }])
	);

	// Fanout: open interest collection, by market
	// Then, create OI lookup
	const response = await Promise.all(
		filteredSymbols.map(({ symbol }) =>
			stepFetchJSON<OpenInterestResponse>(`${apiURL}/openInterest?symbol=${symbol}`, proxy)
		)
	);
	const symbolToOI = new Map(response.map(({ symbol, openInterest }) => [symbol, openInterest]));

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Collect data only for filtered-subtype markets
	filteredSymbols.forEach((sym) => {
		// @dev: again not really mid price, but I imagine these markets are trading often
		const midPx = symbolToHistoricData.get(sym.symbol)?.lastPx ?? 0;

		rows.push({
			batchId,

			// Market parameters
			venue: venuePrefix,
			namespace: "",
			ticker: sym.symbol,

			// Price data
			midPx,

			// Volume
			volume: symbolToHistoricData.get(sym.symbol)?.volume ?? 0,

			// OI
			oi: new Decimal(symbolToOI.get(sym.symbol) ?? 0).mul(new Decimal(midPx)).toNumber(),

			// Leverage
			maxLeverage: new Decimal(100).div(new Decimal(sym.requiredMarginPercent)).toNumber()
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}

/**
 * Collects relevant Binance market data
 * @returns execution diagnostics
 */
export async function collectBinanceMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	return await collectBinanceLikeMarkets(batchId, "binance", B_API_URL, new Set(["TradFi"]), true);
}
