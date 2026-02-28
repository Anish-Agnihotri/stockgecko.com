import tickers from "$config/tickers.json";
import type { TickerCfg } from "$lib/types";
import type { DiffedSnapshot } from "$lib/transform";

// Collect `snapshot` state from database; hot-cached via ISR
export async function load({ fetch }) {
	const data = await fetch("/api/snapshot");
	const snapshot: DiffedSnapshot = await data.json();

	// Search index
	const assets = Object.groupBy(
		Object.entries(snapshot.assets).map(([id, asset]) => {
			const { name, icon } = (tickers.perps as TickerCfg)[asset.category][id].meta;

			return {
				id,
				meta: { name, icon, category: asset.category },
				volume: {
					value: asset.volume,
					change: asset.volumeChange
				}
			};
		}),
		(asset) => asset.meta.category
	);

	return {
		stats: {
			assets: Object.keys(snapshot.assets).length,
			markets: Object.keys(snapshot.markets).length,
			oi: {
				value: snapshot.aggregates.oi,
				change: snapshot.aggregates.oiChange,
				dominance: snapshot.aggregates.oiByVenue.slice(0, 2)
			},
			volume: {
				value: snapshot.aggregates.volume,
				change: snapshot.aggregates.volumeChange
			}
		},
		assets
	};
}

// Prerender all pages
// @dev: careful not to reference API routes in
// 			 `load`(s) else it will prerender those too
export const prerender = true;
