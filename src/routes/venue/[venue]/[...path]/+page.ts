import { error } from "@sveltejs/kit";
import exchanges from "$config/exchanges.json";
import type { PageLoad, EntryGenerator } from "./$types";

// Valid exchanges (`hyperliquid:`, `hyperliquid:xyz`)
const VALID_EXCHANGES: readonly string[] = Object.keys(exchanges);

// Statically generate all possible venue pages
export const entries: EntryGenerator = () => {
	return VALID_EXCHANGES.map((exchange) => {
		const [venue, dex] = exchange.split(":");
		return dex !== "" ? { venue, path: `dex/${dex}` } : { venue, path: "" };
	});
};

export const load: PageLoad = ({ params }) => {
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

	// Return venue, dex
	return { venue, dex };
};
