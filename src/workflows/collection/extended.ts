import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Extended public API url
const E_API_URL = "https://api.starknet.extended.exchange/api/v1/info";

// `/markets` response subset
type MarketsResponse = {
	data: {
		uiName: string;
		category: string;
		active: boolean;
		marketStats: {
			dailyVolume: string;
			lastPrice: string;
			markPrice: string;
			openInterest: string;
		};
		tradingConfig: {
			maxLeverage: string;
		};
	}[];
};

/**
 * Collects relevant Extended market data
 */
export async function collectExtendedMarkets(batchId: string) {
	"use workflow";

	// Fetch all Extended markets
	const { data } = await stepFetchJSON<MarketsResponse>(`${E_API_URL}/markets`);

	// Filter for active, TradFi markets
	const filtered = data.filter((mkt) => mkt.category === "TradFi" && mkt.active);

	// Validate config
	await stepValidateMarkets("extended", new Set(filtered.map(({ uiName }) => uiName)));

	// Iterate over filtered, active, TradFi markets
	const rows: MarketEntryCreateInput[] = filtered.map((mkt) => ({
		batchId,
		venue: "extended",
		namespace: "",
		ticker: mkt.uiName,
		refPx: Number(mkt.marketStats.lastPrice),
		volume: Number(mkt.marketStats.dailyVolume),
		oi: Number(mkt.marketStats.openInterest),
		maxLeverage: Number(mkt.tradingConfig.maxLeverage)
	}));

	// Insert collected data to database
	await stepInsertMarketEntries(rows);
}
