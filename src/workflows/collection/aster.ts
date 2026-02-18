import { collectBinanceLikeMarkets } from "$workflows/collection/binance";

// Aster Futures API url
const A_API_URL = "https://fapi.asterdex.com/fapi/v1";

/**
 * Collects relevant Aster market data
 * @returns execution diagnostics
 */
export async function collectAsterMarkets(batchId: string): Promise<{
	insertedMarkets: number;
}> {
	"use workflow";

	return await collectBinanceLikeMarkets(
		batchId,
		"aster",
		A_API_URL,
		new Set(["STOCK", "RWA", "Metals"]),
		false
	);
}
