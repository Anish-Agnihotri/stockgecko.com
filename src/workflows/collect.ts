import { start } from "workflow/api";
import { getWorkflowMetadata } from "workflow";

// Collectors
//
// Note: you actually can't make the background job generic because
// of the way serialization is handled between steps (your `collect*Markets`
// function fails to serialize).
import { collectOstiumMarkets } from "$workflows/collection/ostium";
import { collectLighterMarkets } from "$workflows/collection/lighter";
import { collectHyperliquidMarkets } from "$workflows/collection/hyperliquid";

// Background runner: Ostium
async function backgroundOstium(batchId: string): Promise<string> {
	"use step";
	return (await start(collectOstiumMarkets, [batchId])).runId;
}

// Background runner: Lighter
async function backgroundLighter(batchId: string): Promise<string> {
	"use step";
	return (await start(collectLighterMarkets, [batchId])).runId;
}

// Background runner: Hyperliquid
async function backgroundHyperliquid(batchId: string): Promise<string> {
	"use step";
	return (await start(collectHyperliquidMarkets, [batchId])).runId;
}

/**
 * Execute market collection jobs in parallel, background
 */
export async function collectMarkets() {
	"use workflow";

	// Collect shared `batchId` from parent workflow
	const { workflowRunId: batchId } = getWorkflowMetadata();

	// Run in parallel
	await backgroundOstium(batchId);
	await backgroundLighter(batchId);
	await backgroundHyperliquid(batchId);
}
