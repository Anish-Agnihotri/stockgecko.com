import { error } from "@sveltejs/kit";
import tickers from "$config/tickers.json";
import exchanges from "$config/exchanges.json";
import type { PageLoad, EntryGenerator } from "./$types";
import type { ExchangeCfg, TickerCfg } from "$lib/types";
import type { MarketRow } from "$components/table/MarketTable.svelte";
import { type DiffedSnapshot, MARKET_TO_ASSET } from "$lib/transform";

// Valid exchanges (`hyperliquid:`, `hyperliquid:xyz`)
const VALID_EXCHANGES: readonly string[] = Object.keys(exchanges);

// Statically generate all possible venue pages
export const entries: EntryGenerator = () => {
	return VALID_EXCHANGES.map((exchange) => {
		const [venue, dex] = exchange.split(":");
		return dex !== "" ? { venue, path: `dex/${dex}` } : { venue, path: "" };
	});
};

export const load: PageLoad = async ({ fetch, params }) => {
	// Collect path
	const { venue, path } = params;

	// `path` is undefined for `/venue/<venue>`
	// `path` is `dex/<dex>` for `/venue/<venue>/dex/<dex>`
	const segments = path?.split("/") ?? [];

	// If segment provided, must be `dex`
	if (segments[0] !== "" && segments[0] !== "dex") {
		error(404, "Venue not found");
	}
	const dex = segments[0] === "dex" ? segments[1] : null;

	// Setup fully-qual'd exchange name
	const exchange = `${venue}:${dex ? dex : ""}`;

	// Validate against exchanges
	if (!VALID_EXCHANGES.includes(exchange)) {
		error(404, "Venue not found");
	}

	// Collect snapshot
	const data = await fetch("/api/snapshot");
	const snapshot: DiffedSnapshot = await data.json();

	// Collect exchange meta
	const meta = (exchanges as ExchangeCfg)[exchange];

	// Filter for relevant markets to exchange
	const markets = Object.values(snapshot.markets).filter(
		(mkt) => mkt.venue === venue && (dex ? mkt.namespace === dex : true)
	);

	// Augment markets w/ asset data
	const rows: MarketRow[] = markets.map((mkt) => {
		// Setup full market id
		const id = `${mkt.venue}${mkt.namespace ? `:${mkt.namespace}` : ""}:${mkt.ticker}`;

		// Collect asset by ID
		const { asset: assetId, category, quote, venueQuote } = MARKET_TO_ASSET.get(id)!;

		// Collect asset name
		const { name } = (tickers.perps as TickerCfg)[category][assetId].meta;

		// Parse currency
		const currency = venueQuote ? venueQuote : quote ? quote : "USD";

		return { ...mkt, id, asset: { name }, currency };
	});

	// Calculate aggregate statistics
	const aggVol = rows.reduce((s, x) => s + x.volume, 0);
	const aggVolChange = aggVol
		? rows.reduce((s, x) => s + x.volume * x.volumeChange, 0) / aggVol
		: 0;
	const aggOI = rows.reduce((s, x) => s + x.oi, 0);
	const aggOIChange = aggOI ? rows.reduce((s, x) => s + x.oi * x.oiChange, 0) / aggOI : 0;

	return {
		meta,
		rows,
		aggregate: {
			volume: {
				value: aggVol,
				change: aggVolChange
			},
			oi: {
				value: aggOI,
				change: aggOIChange
			}
		}
	};
};
