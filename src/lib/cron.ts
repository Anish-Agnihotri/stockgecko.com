import { start } from "workflow/api";
import { strTimingSafeEqual } from "$lib/utils";
import { CRON_SECRET } from "$env/static/private";
import { json, error, type RequestHandler } from "@sveltejs/kit";

/**
 * Helper: exports a pre-loaded `RequestHandler` for authenticated Cron-invocation of workflows via serverless fn
 * @param {F} workflow to execute
 * @returns {RequestHandler} auth-loaded workflow kickoff request handler
 */
export function authenticatedCronWorkflow<F extends Parameters<typeof start>[0]>(
	workflow: F
): RequestHandler {
	return async ({ request }) => {
		// Collect job authentication header
		const authHeader = request.headers.get("Authorization") ?? "";

		// Check for authenticated status
		if (!strTimingSafeEqual(authHeader, `Bearer ${CRON_SECRET}`)) {
			throw error(401, "Missing `Authorization` header");
		}

		// Kick off collection and return
		const { runId } = await start(workflow);
		return json({ runId });
	};
}
