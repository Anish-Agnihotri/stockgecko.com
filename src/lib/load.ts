import db from "$lib/db";
import { plainifyEntries } from "$lib/serialize";
import { buildSnapshot, buildDiffedSnapshot, type DiffedSnapshot } from "$lib/transform";

// One day in milliseconds
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Loads and returns `DiffedSnapshot` w/ 24h change if exists (else no change) from DB
 * @returns {Promise<DiffedSnapshot>} aggregated snapshot data
 */
export async function loadSnapshot(): Promise<DiffedSnapshot> {
	// Running as a transaction to naively minimize serverless function roundtrips
	const { prevEntries, currEntries } = await db.$transaction(async (tx) => {
		// Collect latest batch ID
		// This will fail if collection workflow has not run for first time yet
		const { batchId: currBatchId, createdAt: currCreatedAt } =
			await tx.marketEntry.findFirstOrThrow({
				orderBy: { createdAt: "desc" },
				select: { batchId: true, createdAt: true }
			});

		// Collect batch ID closest to 24 hours ago
		const lte = new Date(currCreatedAt.getTime() - ONE_DAY_MS);
		const prev = await tx.marketEntry.findFirst({
			where: { createdAt: { lte } },
			orderBy: { createdAt: "desc" },
			select: { batchId: true }
		});

		// Collect current entries
		const currEntries = await tx.marketEntry.findMany({ where: { batchId: currBatchId } });

		// If batchId found for `prev`, collect, else just use `currEntries` as `prevEntries`
		// In this way, we naively just build a diff between the same current data and change is `0`
		const prevEntries = prev
			? await tx.marketEntry.findMany({ where: { batchId: prev.batchId } })
			: currEntries;

		return { prevEntries, currEntries };
	});

	// Build and return diffed snapshot
	return buildDiffedSnapshot(
		buildSnapshot(plainifyEntries(prevEntries)),
		buildSnapshot(plainifyEntries(currEntries))
	);
}
