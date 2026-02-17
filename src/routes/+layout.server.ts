import { loadSnapshot } from "$lib/load";
import { CRON_SECRET } from "$env/static/private";
import type { DiffedSnapshot } from "$lib/transform";

// Collect `snapshot` state from database; hot-cached via ISR
export async function load(): Promise<{ snapshot: DiffedSnapshot }> {
	return await loadSnapshot();
}

/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	isr: {
		// 1 hour expiration but we will keep data warm via workflow
		// TODO: add workflow step to trigger ISR bypass
		expiration: 3600,
		bypassToken: CRON_SECRET
	}
};
