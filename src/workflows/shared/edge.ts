import { fetch } from "workflow";
import { EDGE_CONFIG_ID, VERCEL_API_TOKEN } from "$env/static/private";

/**
 * Edge Config authenticated upsert over arbitrary k/v data (single item body)
 * @param {string} key to update
 * @param {T} value to JSON serialize and update
 * @returns {Promise<{ status: number }>} response status code if success (200-299)
 */
export async function stepEdgeConfigUpsert<T>(key: string, value: T): Promise<{ status: number }> {
	"use step";

	// Execute upsert `PATCH` request
	const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${VERCEL_API_TOKEN}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ items: [{ operation: "upsert", key, value }] })
	});

	// If request fails, throw
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Edge config update failed (${res.status}): ${body}`);
	}

	// Return response status
	return { status: res.status };
}
