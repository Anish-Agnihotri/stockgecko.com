import { error } from "@sveltejs/kit";
import tickers from "$config/tickers.json";
import type { PageLoad, EntryGenerator } from "./$types";

// Valid asset slugs (`gold`, `nvidia`, etc.)
const VALID_ASSETS = Object.values(tickers.perps).flatMap((x) => Object.keys(x));

// Statically generate all possible asset pages
export const entries: EntryGenerator = () => {
	return VALID_ASSETS.map((asset) => ({ asset }));
};

export const load: PageLoad = ({ params }) => {
	// Validate asset slug is supported asset
	if (!VALID_ASSETS.includes(params.asset)) {
		error(404, "Asset not found");
	}

	// Return asset name
	return { asset: params.asset };
};
