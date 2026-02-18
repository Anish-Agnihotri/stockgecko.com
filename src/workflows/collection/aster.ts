import { collectBinanceLikeMarkets } from "$workflows/collection/binance";

// Aster Futures API url
const A_API_URL = "https://fapi.asterdex.com/fapi/v1";

/**
 * Collects relevant Aster market data
 */
export async function collectAsterMarkets(batchId: string) {
	"use workflow";

	await collectBinanceLikeMarkets(
		batchId,
		"aster",
		A_API_URL,
		new Set(["STOCK", "RWA", "Metals"]),
		false
	);
}
