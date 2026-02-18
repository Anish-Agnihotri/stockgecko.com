import { Decimal } from "decimal.js";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";
import { stepValidateMarkets } from "$workflows/shared/validate";

// Ostium API base URL
const O_BASE_URL = "https://app.ostium.com/api";

// Ostium metadata backend base URL
export const OM_BASE_URL = "https://metadata-backend.ostium.io";

// API: `/pairs` response data subset
type PairsResponse = {
	id: string;
	feed: string;
	longOI: string; // 1e18
	shortOI: string; // 1e18
	group: {
		maxLeverage: string; // 1e2
	};
	lastTradePrice: string; // 1e18
}[];

// Metadata: `/volume/all` response data
type VolumeResponse = {
	data: {
		pair_id: string;
		// @dev: Thank you Ostium for normalizing to USD
		last_24h_volume: number;
	}[];
};

// Metadata: `/PricePublish/latest-prices` response data subset
type LatestPricesResponse = {
	feed_id: string;
	mid: number;
}[];

/**
 * Collects relevant Ostium market data
 * @returns execution diagnostics
 */
export async function collectOstiumMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	// Fetch all Ostium pairs
	const pairs = await stepFetchJSON<PairsResponse>(`${O_BASE_URL}/pairs`);

	// Validate config
	await stepValidateMarkets("ostium", new Set([...pairs.map((p) => p.id)]));

	// Also collect volume and price data for all markets
	// Proxy via internal `/api/proxy` endpoint which loads extra Comodo AAA CA
	const vol = await stepFetchJSON<VolumeResponse>(OM_BASE_URL + "/volume/all", true);
	const px = await stepFetchJSON<LatestPricesResponse>(
		OM_BASE_URL + "/PricePublish/latest-prices",
		true
	);

	// Setup lookup tables from volume, price data
	const pairIdToVolume = new Map(
		Object.values(vol.data).map((x) => [x.pair_id, x.last_24h_volume])
	);
	const feedIdToMidPx = new Map(px.map((x) => [x.feed_id, x.mid]));

	// Parse collected responses
	const rows: MarketEntryCreateInput[] = [];

	// Store all data, irrespective of config filtering
	pairs.forEach((pair) => {
		rows.push({
			batchId,

			// Market parameters
			venue: "ostium",
			namespace: "",
			ticker: pair.id,

			// Mid price
			midPx: feedIdToMidPx.get(pair.feed) ?? 0,

			// Market stats, data
			oi: new Decimal(pair.longOI)
				.add(new Decimal(pair.shortOI))
				.mul(new Decimal(pair.lastTradePrice))
				// ((longOI + shortOI) * lastTradePrice) / normalized by (1e18 + 1e18)
				.div(1e36)
				.toNumber(),
			volume: pairIdToVolume.get(pair.id) ?? 0,
			maxLeverage: new Decimal(pair.group.maxLeverage).div(100).toNumber()
		});
	});

	// Insert collected data to database
	const insertedCount = await stepInsertMarketEntries(rows);

	// Return workflow execution diagnostics
	return { insertedMarkets: insertedCount };
}
