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
 * @returns execution diagnostics
 */
export async function collectExtendedMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch all Extended markets
	const { data } = await stepFetchJSON<MarketsResponse>(`${E_API_URL}/markets`);

	// Filter for active, TradFi markets
	const filtered = data.filter((mkt) => mkt.category === "TradFi" && mkt.active);

	// Validate config
	await stepValidateMarkets("extended", new Set(filtered.map(({ uiName }) => uiName)));

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Iterate over filtered, active, TradFi markets
	filtered.forEach((mkt) => {
		rows.push({
			batchId,

			// Market data
			venue: "extended",
			namespace: "",
			ticker: mkt.uiName,

			// Price ref
			midPx: Number(mkt.marketStats.lastPrice),
			markPx: Number(mkt.marketStats.markPrice),

			// Volume
			volume: Number(mkt.marketStats.dailyVolume),

			// Stats
			oi: Number(mkt.marketStats.openInterest),
			maxLeverage: Number(mkt.tradingConfig.maxLeverage)
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
