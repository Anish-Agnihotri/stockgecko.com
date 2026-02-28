import { error } from "@sveltejs/kit";
import tickers from "$config/tickers.json";
import type { TickerCfg } from "$lib/types";
import type { DiffedSnapshot } from "$lib/transform";
import type { PageLoad, EntryGenerator } from "./$types";
import { getNormalizedCurrency } from "$components/Numeric.svelte";
import type { MarketRow } from "$lib/components/table/MarketTable.svelte";

// Valid asset slugs (`gold`, `nvidia`, etc.)
const VALID_ASSETS = Object.values(tickers.perps).flatMap((x) => Object.keys(x));

// Statically generate all possible asset pages
export const entries: EntryGenerator = () => {
	return VALID_ASSETS.map((asset) => ({ asset }));
};

export const load: PageLoad = async ({ fetch, params }) => {
	// Validate asset slug is supported asset
	if (!VALID_ASSETS.includes(params.asset)) {
		error(404, "Asset not found");
	}

	// Collect cached snapshot
	const req = await fetch("/api/snapshot");
	const snapshot: DiffedSnapshot = await req.json();

	// Collect asset data
	const { marketIds, ...asset } = snapshot.assets[params.asset];

	// Collect asset metadata
	const { meta } = (tickers.perps as TickerCfg)[asset.category][params.asset];

	// Filter for relevant markets, by this asset
	const markets = marketIds
		.filter((id) => marketIds.includes(id))
		.map((id) => ({ id, ...snapshot.markets[id] }));

	// Augment markets minimally with asset, currency metadata
	const rows: MarketRow[] = markets.map((market) => {
		return {
			...market,
			asset: { name: meta.name },
			currency: getNormalizedCurrency(
				`${market.venue}:${market.namespace}`,
				meta.quote,
				meta.quotes
			)
		};
	});

	return { asset, meta, rows };
};
