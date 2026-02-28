import type { PageLoad } from "./$types";
import tickers from "$config/tickers.json";
import type { TickerCfg } from "$lib/types";
import type { MarketRow } from "$components/table/MarketTable.svelte";
import { type DiffedSnapshot, MARKET_TO_ASSET } from "$lib/transform";

export const load: PageLoad = async ({ fetch }) => {
	// Collect snapshot
	const data = await fetch("/api/snapshot");
	const snapshot: DiffedSnapshot = await data.json();

	// Collect all markets
	const markets = Object.values(snapshot.markets);

	// Augment markets w/ asset data
	const rows: MarketRow[] = markets.map((mkt) => {
		// Setup full market id
		const id = `${mkt.venue}${mkt.namespace ? `:${mkt.namespace}` : ""}:${mkt.ticker}`;

		// Collect asset by ID
		const { asset: assetId, category, quote, venueQuote } = MARKET_TO_ASSET.get(id)!;

		// Collect asset name
		const { name, icon } = (tickers.perps as TickerCfg)[category][assetId].meta;

		// Parse currency
		const currency = venueQuote ? venueQuote : quote ? quote : "USD";

		return { ...mkt, id, asset: { name, icon }, currency };
	});

	return {
		rows,
		venueCount: snapshot.aggregates.exchangeStats.length,
		oiByVenue: snapshot.aggregates.oiByVenue
	};
};
