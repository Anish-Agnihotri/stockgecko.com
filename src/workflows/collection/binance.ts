import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Binance USD{T,C}-margined futures API base url
const B_BASE_URL = "https://fapi.binance.com/fapi/v1";

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

/**
 * Collects relevant QFEX market data
 * @returns execution diagnostics
 */
export async function collectBinanceMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch Binance Futures API pairs
	const { symbols } = await stepFetchJSON<ExchangeInfoResponse>(`${B_BASE_URL}/exchangeInfo`);

	// Filter for actively-`TRADING` symbols only and `TradFi` perps only
	// In the case of Binance, we must pre-filter effectively given expansive perp set
	const tradSymbols = symbols.filter(
		({ status, underlyingSubType }) => status === "TRADING" && underlyingSubType.includes("TradFi")
	);

	// Validate config
	await stepValidateMarkets("binance", new Set(tradSymbols.map(({ symbol }) => symbol)));

	// Collect 24hr historic ticker data and create lookup
	const historic = await stepFetchJSON<HistoricTickerResponse>(`${B_BASE_URL}/ticker/24hr`);
	const symbolToHistoricData = new Map(
		historic.map((x) => [x.symbol, { lastPx: Number(x.lastPrice), volume: Number(x.quoteVolume) }])
	);

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Collect data only for TradFi-subtype markets
	tradSymbols.forEach((sym) => {
		rows.push({
			batchId,

			// Market parameters
			venue: "binance",
			namespace: "",
			ticker: sym.symbol,

			// Price data
			// @dev: again not really mid price, but I imagine these markets are trading often
			midPx: symbolToHistoricData.get(sym.symbol)?.lastPx ?? 0,

			// Volume
			volume: symbolToHistoricData.get(sym.symbol)?.volume ?? 0,

			// Leverage
			maxLeverage: new Decimal(100).div(new Decimal(sym.requiredMarginPercent)).toNumber()
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
