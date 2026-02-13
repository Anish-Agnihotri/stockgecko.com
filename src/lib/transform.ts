import tickers from "$config/tickers.json";
import type { PlainMarketEntry } from "$lib/serialize";

// Reverse index (marketKey => {asset, category})
// "hyperliquid:xyz:NVDA" → { asset: "nvda", category: "stocks" }
const MARKET_TO_ASSET = new Map(
	Object.entries(tickers.perps).flatMap(([category, assets]) =>
		Object.entries(assets).flatMap(([asset, markets]) =>
			markets.ref.map((market) => [market, { asset, category }] as const)
		)
	)
);

// Statistics for batch of data
type Snapshot = {
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

// Statistics w/ diffed change across two `Snapshot`(s) of data
export type DiffedSnapshot = {
	meta: Snapshot["meta"] & {
		// Batch ID of historic batch diffed against
		diffBatchId: string;
		// Staleness of historic batch
		diffUpdatedAt: Date;
	};

	assets: Record<
		string,
		Snapshot["assets"][string] & {
			// Change across two snapshots in asset median midPx
			medianMidPxChange: number;
			// Change across two snapshots in asset volume
			volumeChange: number;
		}
	>;

	markets: Record<
		string,
		Snapshot["markets"][string] & {
			// Change across two snapshots in market midPx
			midPxChange: number;
			// Change across two snapshots in market volume
			volumeChange: number;
		}
	>;

	// Updated to include historic index lookup
	index: {
		assetsByVolume: { asset: string; previousIndex: number | null }[];
		marketsByVenue: Record<string, string[]>;
	};
};

/**
 * Format market `key` based on if `venue` exists (e.g., HIP-3 DEX name)
 * @param {PlainMarketEntry} e data entry
 * @returns {string} key
 */
function marketKey(e: PlainMarketEntry): string {
	return `${e.venue}${e.namespace ? `:${e.namespace}` : ""}:${e.ticker}`;
}

/**
 * Simple decimal change where `previous` can be non-existent
 * @dev Useful in case where calculating `change` for a new market
 * @param {number | undefined} previous old value
 * @param {number} current new value
 * @returns {number} decimal change (`*100` in UI)
 */
function change(previous: number | undefined, current: number): number {
	return previous ? (current - previous) / previous : 0;
}

/**
 * Given input `markets` data, produces a `Snapshot` of metrics
 * @dev Not the most efficient implementation, but readable and meant to
 *      run in an async workflow, so fine as part of broader E(T)L pipeline.
 * @param {PlainMarketEntry[]} markets batch of data
 * @returns {Snapshot} snapshot of metrics
 */
export function buildSnapshot(markets: PlainMarketEntry[]): Snapshot {
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
		const { venue, namespace, ticker, midPx, volume } = market;
		snapshotMarkets[key] = { venue, namespace, ticker, midPx, volume };

		// --- 3: Augment overall asset from market data ---
		// Collect, must exist given above validation
		const { asset: assetId, category } = MARKET_TO_ASSET.get(key)!;

		// Collect or initialize asset details
		// @dev: Note that in a real, production application I would be a tad sketched
		// 			 by the prospect of using a nullish coalescing assignment operator, but
		//			 I get to have fun when writing code for myself innit.
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

/**
 * Given two sets of `Snapshot`(s), `previous` and `current` return a `DiffedSnapshot`,
 * containing additional change in various values from `previous` to `current`
 * @dev Most useful for tracking {price, volume, ranked position} changes over time
 * @param {Snapshot} previous old snapshot
 * @param {Snapshot} current new snapshot
 * @returns {DiffedSnapshot} base `Snapshot` augmented with change data
 */
export function buildDiffedSnapshot(previous: Snapshot, current: Snapshot): DiffedSnapshot {
	// --- 1: Setup new meta w/ tracked historic `old` batch ---
	const meta: DiffedSnapshot["meta"] = {
		...current.meta,
		diffBatchId: previous.meta.batchId,
		diffUpdatedAt: previous.meta.updatedAt
	};

	// --- 2: Diff market data ---
	const markets: DiffedSnapshot["markets"] = {};
	for (const [key, market] of Object.entries(current.markets)) {
		// Note: market may not exist in previous snapshot (new market)
		const previousMarket = previous.markets[key];

		markets[key] = {
			...market,
			midPxChange: change(previousMarket?.midPx, market.midPx),
			volumeChange: change(previousMarket?.volume, market.volume)
		};
	}

	// --- 3: Diff asset data ---
	const assets: DiffedSnapshot["assets"] = {};
	for (const [id, asset] of Object.entries(current.assets)) {
		// Note: asset may not exist in previous snapshot (new asset)
		const previousAsset = previous.assets[id];

		assets[id] = {
			...asset,
			medianMidPxChange: change(previousAsset?.medianMidPx, asset.medianMidPx),
			volumeChange: change(previousAsset?.volume, asset.volume)
		};
	}

	// --- 4: Produce diff-aware indexes ---
	// No change to `marketsByVenue`, we keep latest markets=>venues indexed
	const index: DiffedSnapshot["index"] = {
		marketsByVenue: current.index.marketsByVenue,
		assetsByVolume: []
	};

	// But, we do setup a new `assetsByVolume` aware of previous index positions
	// Previous `assetId` => volume-weighted index mapping
	const previousRanking = new Map(previous.index.assetsByVolume.map((id, i) => [id, i]));
	for (const asset of current.index.assetsByVolume) {
		index.assetsByVolume.push({
			asset,
			previousIndex: previousRanking.get(asset) ?? null
		});
	}

	return { meta, assets, markets, index };
}
