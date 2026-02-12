import db from "$lib/db";
import { plainifyEntries } from "$lib/serialize";
import { CRON_SECRET } from "$env/static/private";
import { buildSnapshot, type Snapshot } from "$lib/transform";

/**
 * Collect `snapshot` state from database
 * @dev Hot cached via ISR
 * @returns {Promise<{snapshot: Snapshot}>} snapshot state
 */
export async function load(): Promise<{ snapshot: Snapshot }> {
	// Collect latest batch ID
	const { batchId } = await db.marketEntry.findFirstOrThrow({
		orderBy: { updatedAt: "desc" },
		select: { batchId: true }
	});

	// Collect full batch of data via batch ID
	const entries = await db.marketEntry.findMany({ where: { batchId } });

	// Parse and return snapshot data
	return { snapshot: buildSnapshot(plainifyEntries(entries)) };
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
