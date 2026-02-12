// @dev Interesting quirk, at least with the Workflow intellisense
// 		  and how it uses `tsconfig` defined aliases, that the glob
// 			matching (a la `$lib/*`) works, but the direct (a la `$db`) doesn't.
import db from "$lib/db";
import type { MarketEntryCreateInput } from "$prisma/models";
import { plainifyEntries, type PlainMarketEntry } from "$lib/serialize";

/**
 * Shared workflow step: insert `MarketEntry[]` records to database via Prisma
 * @param {MarketEntryCreateInput[]} rows to insert
 * @returns {Promise<number>} inserted row count
 */
export async function stepInsertMarketEntries(rows: MarketEntryCreateInput[]): Promise<number> {
	"use step";

	// If no work to perform, return early
	if (rows.length === 0) return 0;

	// Else, append to database and return appended count
	return (await db.marketEntry.createMany({ data: rows })).count;
}

/**
 * Shared workflow step: collect latest batch of inserted `MarketEntry[]` data as `PlainMarketEntry[]`
 * @returns {Promise<PlainMarketEntry[]>} latest batch of inserted data
 */
export async function stepGetLatestMarketEntries(): Promise<PlainMarketEntry[]> {
	"use step";

	// Collect most recent `batchId`
	const { batchId } = await db.marketEntry.findFirstOrThrow({
		orderBy: { createdAt: "desc" },
		select: { batchId: true }
	});

	// Fetch all entries in this batch
	const entries = await db.marketEntry.findMany({ where: { batchId } });

	// Return serializeable entries (`Decimal` => `number`) for step data persistance
	return plainifyEntries(entries);
}
