import { start } from "workflow/api";
import { getWorkflowMetadata } from "workflow";

// Collectors
//
// Note: you actually can't make the background job generic because
// of the way serialization is handled between steps (your `collect*Markets`
// function fails to serialize).
import { collectQFEXMarkets } from "$workflows/collection/qfex";
import { collectEdgeXMarkets } from "$workflows/collection/edgex";
import { collectAsterMarkets } from "$workflows/collection/aster";
import { collectOstiumMarkets } from "$workflows/collection/ostium";
import { collectBinanceMarkets } from "$workflows/collection/binance";
import { collectLighterMarkets } from "$workflows/collection/lighter";
import { collectHyperliquidMarkets } from "$workflows/collection/hyperliquid";

// Background runner: QFEX
async function backgroundQFEX(batchId: string): Promise<string> {
	"use step";
	return (await start(collectQFEXMarkets, [batchId])).runId;
}

// Background runner: edgeX
async function backgroundEdgeX(batchId: string): Promise<string> {
	"use step";
	return (await start(collectEdgeXMarkets, [batchId])).runId;
}

// Background runner: Aster
async function backgroundAster(batchId: string): Promise<string> {
	"use step";
	return (await start(collectAsterMarkets, [batchId])).runId;
}

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

// Background runner: Binance
async function backgroundBinance(batchId: string): Promise<string> {
	"use step";
	return (await start(collectBinanceMarkets, [batchId])).runId;
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
	await backgroundQFEX(batchId);
	await backgroundEdgeX(batchId);
	await backgroundAster(batchId);
	await backgroundOstium(batchId);
	await backgroundLighter(batchId);
	await backgroundBinance(batchId);
	await backgroundHyperliquid(batchId);
}
