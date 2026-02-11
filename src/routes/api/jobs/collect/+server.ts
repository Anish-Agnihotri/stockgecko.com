import { start } from "workflow/api";
import { strTimingSafeEqual } from "$lib/utils";
import { JOB_AUTH_KEY } from "$env/static/private";
import { json, error, type RequestHandler } from "@sveltejs/kit";
import { collectHyperliquidMarkets } from "$workflows/hyperliquid";

/**
 * Initiate authenticated collection job
 */
export const GET: RequestHandler = async ({ url }) => {
	// Collect job authentication key
	// Force non-"" empty string to prevent default `JOB_AUTH_KEY`
	const key = url.searchParams.get("key") ?? "EMPTY";

	// Match job authentication key
	if (!strTimingSafeEqual(key, JOB_AUTH_KEY)) {
		throw error(401, "Missing `key` auth");
	}

	// Kick off collection and return
	await start(collectHyperliquidMarkets);
	return json({ success: true });
};
