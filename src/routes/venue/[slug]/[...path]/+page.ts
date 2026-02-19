import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import exchanges from "$config/exchanges.json";

// Valid exchanges (`hyperliquid:`, `hyperliquid:xyz`)
const VALID_EXCHANGES: readonly string[] = Object.keys(exchanges);

export const load: PageLoad = ({ params }) => {
	// Collect path
	const { slug, path } = params;

	// `path` is undefined for `/venue/<venue>`
	// `path` is `dex/<dex>` for `/venue/<venue>/dex/<dex>`
	const segments = path?.split("/") ?? [];

	// If segment provided, must be `dex`
	if (segments[0] !== "" && segments[0] !== "dex") {
		error(404, "Venue not found");
	}
	const dex = segments[0] === "dex" ? segments[1] : null;

	// Setup fully-qual'd exchange name
	const exchange = `${slug}:${dex ? dex : ""}`;
	console.log(exchange);

	// Validate against exchanges
	if (!VALID_EXCHANGES.includes(exchange)) {
		error(404, "Venue not found");
	}

	// Return venue, dex
	return { venue: slug, dex };
};
