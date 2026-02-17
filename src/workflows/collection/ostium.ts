import { Decimal } from "decimal.js";
import tickers from "$config/tickers.json";
import { stepFetchJSON } from "$workflows/shared/fetch";
import type { MarketEntryCreateInput } from "$prisma/models";
import { stepInsertMarketEntries } from "$workflows/shared/db";

// Setup proxy base URL
const PROXY_BASE = process.env.VERCEL_PROJECT_PRODUCTION_URL
	? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
	: `http://localhost:5173`;

// Ostium API base URL
const O_BASE_URL = "https://app.ostium.com/api";

// Ostium metadata backend base URL
export const OM_BASE_URL = "https://metadata-backend.ostium.io";

// Find and extract `ostium:` prefixed markets in config
const LOCAL_MARKETS: ReadonlySet<string> = new Set(
	JSON.stringify(tickers)
		// Match all tickers starting with `ostium:`
		.match(/ostium:[^"\\]+/g)
		// Drop `ostium:` prefix
		?.map((s) => s.replace("ostium:", "")) ?? []
);

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

	// Build set of valid Ostium markets
	const validMarkets: ReadonlySet<string> = new Set([...pairs.map((p) => p.id)]);

	// Validate local configuration is subset of valid markets
	if (!LOCAL_MARKETS.isSubsetOf(validMarkets)) {
		// Throw error tracking missing markets
		const missing: readonly string[] = [...LOCAL_MARKETS].filter((m) => !validMarkets.has(m));
		throw new Error(`Ostium config not strict subset: ${missing.join(", ")}`);
	}

	// Also collect volume and price data for all markets
	// Proxy via internal `/api/proxy` endpoint which loads extra Comodo AAA CA
	const vol = await stepFetchJSON<VolumeResponse>(
		`${PROXY_BASE}/api/proxy?url=${encodeURIComponent(OM_BASE_URL + "/volume/all")}`
	);
	const px = await stepFetchJSON<LatestPricesResponse>(
		`${PROXY_BASE}/api/proxy?url=${encodeURIComponent(OM_BASE_URL + "/PricePublish/latest-prices")}`
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
