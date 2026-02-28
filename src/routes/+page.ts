import type { PageLoad } from "./$types";
import tickers from "$config/tickers.json";
import type { TickerCfg } from "$lib/types";
import type { DiffedSnapshot } from "$lib/transform";
import type { AssetRow } from "$components/table/AssetTable.svelte";

export const load: PageLoad = async ({ fetch }) => {
	const data = await fetch("/api/snapshot");
	const snapshot: DiffedSnapshot = await data.json();

	// Setup assets
	const rows: AssetRow[] = snapshot.index.assetsByVolume.map(
		({ asset, previousIndex: previousRank }, i) => ({
			id: asset,
			...snapshot.assets[asset],
			rank: i,
			previousRank,
			meta: (tickers.perps as TickerCfg)[snapshot.assets[asset].category][asset].meta
		})
	);

	return {
		volume: snapshot.aggregates.volume,
		rows
	};
};
