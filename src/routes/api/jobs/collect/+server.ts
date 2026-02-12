import { start } from "workflow/api";
import { strTimingSafeEqual } from "$lib/utils";
import { CRON_SECRET } from "$env/static/private";
import { collectMarkets } from "$workflows/collect";
import { json, error, type RequestHandler } from "@sveltejs/kit";

/**
 * Initiate authenticated collection job
 */
export const GET: RequestHandler = async ({ request }) => {
	// Collect job authentication header
	const authHeader = request.headers.get("Authorization") ?? "";

	// Check for authenticated status
	if (!strTimingSafeEqual(authHeader, `Bearer ${CRON_SECRET}`)) {
		throw error(401, "Missing `Authorization` header");
	}

	// Kick off collection and return
	const { runId } = await start(collectMarkets);
	return json({ runId });
};
