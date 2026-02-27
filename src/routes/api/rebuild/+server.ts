import { strTimingSafeEqual } from "$lib/utils.server";
import { json, error, type RequestHandler } from "@sveltejs/kit";
import { CRON_SECRET, VERCEL_DEPLOY_HOOK } from "$env/static/private";

// Allow force-rebuilding static pages
export const GET: RequestHandler = async ({ request }) => {
	// Collect auth header
	const authHeader = request.headers.get("Authorization") ?? "";

	// Validate authenticated status
	if (!strTimingSafeEqual(authHeader, `Bearer ${CRON_SECRET}`)) {
		throw error(401, "Missing `Authorization` header");
	}

	// Trigger rebuild, validate success
	const response = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
	if (!response.ok) {
		throw error(502, "Failed to trigger rebuild");
	}

	return json({ triggered: true, ts: new Date().toISOString() });
};
