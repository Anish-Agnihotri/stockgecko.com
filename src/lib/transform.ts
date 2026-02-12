import tickers from "$config/tickers.json";
import type { MarketEntry } from "$prisma/client";

// Reverse index (marketKey => {asset, category})
// "hyperliquid:xyz:NVDA" → { asset: "nvda", category: "stocks" }
const MARKET_TO_ASSET = new Map(
	Object.entries(tickers.perps).flatMap(([category, assets]) =>
		Object.entries(assets).flatMap(([asset, markets]) =>
			markets.map((market) => [market, { asset, category }] as const)
		)
	)
);

// Generated data snapshot
export type Snapshot = {
	// Snapshot meta details
	meta: {
		// Shared execution batch ID
		batchId: string;
		// Snapshot data staleness
		updatedAt: Date;
	};

	// Individual assets
	assets: Record<
		string,
		{
			// Asset category
			category: string;
			// Median midPx
			medianMidPx: number;
			// Total volume
			volume: number;
			// Indices of associated markets
			marketIds: string[];
		}
	>;

	// Individual markets
	markets: Record<
		string,
		{
			// Exchange
			venue: string;
			// Sub-DEX
			namespace: string;
			// Asset ticker
			ticker: string;
			// midPx
			midPx: number;
			// Market volume
			volume: number;
		}
	>;

	// Hot lookup indices
	index: {
		assetsByVolume: string[];
		marketsByVenue: Record<string, string[]>;
	};
};

/**
 * Format market `key` based on if `venue` exists (e.g., HIP-3 DEX name)
 * @param {MarketEntry} e data entry
 * @returns {string} key
 */
function marketKey(e: MarketEntry): string {
	return `${e.venue}${e.namespace ? `:${e.namespace}` : ""}:${e.ticker}`;
}

/**
 * Given input `markets` data, produces a `Snapshot` to cache (and render)
 * @dev Not the most efficient implementation, but readable and meant to
 *      run in an async workflow, so fine as part of broader E(T)L pipeline.
 * @param {MarketEntry[]} markets batch market information
 * @returns {Snapshot} generated snapshot data
 */
export function buildSnapshot(markets: MarketEntry[]): Snapshot {
	// Quick safety check
	if (markets.length == 0) {
		throw new Error("Cannot build snapshot over empty market data");
	}

	// Setup meta (shared, batch collected)
	const snapshotMeta: Snapshot["meta"] = {
		batchId: markets[0].batchId,
		updatedAt: markets[0].updatedAt
	};

	// Setup assets, markets, market-by-venue index
	const snapshotAssets: Snapshot["assets"] = {};
	const snapshotMarkets: Snapshot["markets"] = {};
	const marketsByVenue: Snapshot["index"]["marketsByVenue"] = {};

	// Track markets
	for (const market of markets) {
		const key = marketKey(market);

		// --- 1: Pre-validation ---
		// We only want to track a market if it is relevant to our config
		if (!MARKET_TO_ASSET.has(key)) continue;

		// --- 2: Populate market data ---
		// Parse midPx, volume to dollar value
		const midPx = market.midPx.toNumber();
		const volume = market.volume.toNumber();

		// Track market
		const { venue, namespace, ticker } = market;
		snapshotMarkets[key] = { venue, namespace, ticker, midPx, volume };

		// --- 3: Augment overall asset from market data ---
		// Collect, must exist given above validation
		const { asset: assetId, category } = MARKET_TO_ASSET.get(key)!;

		// Collect or initialize asset details
		const asset = (snapshotAssets[assetId] ??= {
			category,

			// If initializing, we simply empty setup
			medianMidPx: 0,
			volume: 0,
			marketIds: []
		});

		// Then, increment volume, track current market
		// Notw: we cannot calculate the median price
		asset.volume += volume;
		asset.marketIds.push(key);

		// --- 4: Populate relevant indexes while we're at it ---
		(marketsByVenue[market.venue] ??= []).push(key);
	}

	// With markets setup, we can sort by volume
	const assetsByVolume = Object.keys(snapshotAssets).sort(
		(a, b) => snapshotAssets[b].volume - snapshotAssets[a].volume
	);

	// Finally, we can compute median price for each asset
	for (const asset of Object.values(snapshotAssets)) {
		// Collect `midPx` of each market, filter out zeroes, sort
		const prices = asset.marketIds
			.map((id) => snapshotMarkets[id].midPx)
			.filter((p) => p > 0)
			.sort((a, b) => a - b);

		// Calculate and store median
		if (prices.length > 0) {
			const mid = prices.length >> 1;
			asset.medianMidPx = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
		}
	}

	return {
		meta: snapshotMeta,
		assets: snapshotAssets,
		markets: snapshotMarkets,
		index: { assetsByVolume, marketsByVenue }
	};
}
