import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import tickers from "$config/tickers.json";

// Valid asset slugs (`gold`, `nvidia`, etc.)
const VALID_ASSETS = Object.values(tickers.perps).flatMap((x) => Object.keys(x));

export const load: PageLoad = ({ params }) => {
	// Validate asset slug is supported asset
	if (!VALID_ASSETS.includes(params.slug)) {
		error(404, "Asset not found");
	}

	// Return asset name
	return { asset: params.slug };
};
