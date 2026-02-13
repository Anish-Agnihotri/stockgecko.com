// N.B.: this was previously implemented for Workflow `devalue`
// handling, but ironically also applies to SvelteKit given
// `devalue` dependency. Choosing to keep out of convenience and
// not implementing a custom hook and handling `Decimal` again.
//
// ----------------------------------------------------------------
//
// Prisma uses `Decimal` for all Postgres numeric types.
//
// For data persistance across workflow steps, Workflow uses `devalue`
// to serialize types, of which the Prisma (`decimal.js`) implementation
// is not a supported type.
//
// While the easy way to solve this is to just store currency data as
// `float`, I consider this generally sacrilegious with financial math.
//
// Instead, given we already convert `toNumber()` during E(T)L, I am
// okay to compromise with a quick, explicit serialized type.
//
// Note: we could totally do this by making a new object too (at expense
// of keeping updated in two places*), but I am just having fun.
import type { MarketEntry } from "$prisma/client";

// `MarketEntry` with `Decimal`-types converted to `number`
export type PlainMarketEntry = {
	// For keys in `MarketEntry` defined as `Decimal` (existance of a `toNumber()` method)
	[K in keyof MarketEntry]: MarketEntry[K] extends { toNumber(): number }
		? // Return as number
			number
		: // Else, for keys in `MarketEntry` defined as `Decimal?`
			MarketEntry[K] extends { toNumber(): number } | null
			? // Return as number if exists or null (optional)
					number | null
			: // Else, return key (non-Decimal)
				MarketEntry[K];
};

/**
 * `MarketEntry` to `PlainMarketEntry`
 * @dev However it pains you to look at this, know I it pains me more
 * @param {MarketEntry[]} entries to plainify (serialize `Decimal` to `number`)
 * @returns {PlainMarketEntry[]} plainifed output data
 */
export function plainifyEntries(entries: MarketEntry[]): PlainMarketEntry[] {
	// For each `MarketEntry`:
	return entries.map(
		(entry) =>
			Object.fromEntries(
				// Iterate each key-value of a single `MarketEntry`
				Object.entries(entry).map(([k, v]) => [
					k,
					// If the `v`(alue) has a `toNumber()` method, return the `number` else just the `v`(alue)
					v != null && typeof v === "object" && "toNumber" in v ? v.toNumber() : v
				])
			) as PlainMarketEntry
	);
}
