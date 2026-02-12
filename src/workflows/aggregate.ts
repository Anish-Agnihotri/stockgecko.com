import { buildSnapshot, type Snapshot } from "$lib/transform";
import { stepEdgeConfigUpsert } from "$workflows/shared/edge";
import { stepGetLatestMarketEntries } from "$workflows/shared/db";

/**
 * Standard ETL business:
 * - Extract latest batch of market data
 * - Transform to `Snapshot`
 * - Load into edge config
 */
export async function aggregateMarkets(): Promise<void> {
	"use workflow";

	// (E)TL: Collect latest batch of markets inserted to DB
	const markets = await stepGetLatestMarketEntries();

	// E(T)L: transform market data to snapshot to serialize
	const snapshot: Snapshot = buildSnapshot(markets);

	// ET(L): store snapshot in edge config
	await stepEdgeConfigUpsert("snapshot", snapshot);
}
