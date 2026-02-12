import type { Snapshot } from "$lib/transform";
import { createClient } from "@vercel/edge-config";
import { EDGE_CONFIG, ISR_BYPASS_TOKEN } from "$env/static/private";

// Setup Vercel ECS client
const client = createClient(EDGE_CONFIG);

/**
 * Collect `snapshot` state from ECS at load
 * @returns {Promise<{snapshot: Snapshot}>} snapshot state
 */
export async function load(): Promise<{ snapshot: Snapshot }> {
	const snapshot = await client.get<Snapshot>("snapshot");
	if (!snapshot) throw new Error("Snapshot not found in ECS");
	return { snapshot };
}

/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	isr: {
		// 1 hour expiration but we will keep data warm via workflow
		// TODO: add aggregate workflow step to trigger ISR bypass
		expiration: 3600,
		bypassToken: ISR_BYPASS_TOKEN
	}
};
