import tickers from "$config/tickers.json";

/**
 * Validates local `tickers` config against remote set of valid markets
 * @dev No async work, but step functions must be async/return a promise
 * @param {string} venuePrefix venue name to filter `tickers` for
 * @param {ReadonlySet<string>} validMarkets to check against
 * @return {Promise<ReadonlySet<string>>} validated, filtered local set
 */
export async function stepValidateMarkets(
	venuePrefix: string,
	validMarkets: ReadonlySet<string>
): Promise<ReadonlySet<string>> {
	"use step";

	// Find and extract prefixed markets in config
	const localMarkets: ReadonlySet<string> = new Set(
		JSON.stringify(tickers)
			// Match all tickers starting with `venuePrefix:`
			.match(new RegExp(`\\b${venuePrefix}:[^"\\\\]+`, "g"))
			// Drop `venuePrefix:` prefix
			?.map((s) => s.replace(`${venuePrefix}:`, "")) ?? []
	);

	// Validate local configuration is subset of valid markets
	if (!localMarkets.isSubsetOf(validMarkets)) {
		// Throw error tracking missing markets
		const missing: readonly string[] = [...localMarkets].filter((m) => !validMarkets.has(m));
		throw new Error(`${venuePrefix} config not strict subset: ${missing.join(", ")}`);
	}

	return localMarkets;
}
