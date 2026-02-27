// Frontend helpers for config parsing
// Weaker types for ease (indexing configs)
export type Meta = {
	name: string;
	description: string;
	icon: string[];
	// Base (+ preferred) quote currency
	quote?: string;
	// Venue-specific quote handling
	quotes?: Record<string, string>;
};
export type ExchangeCfg = Record<string, Meta>;
export type TickerCfg = Record<string, Record<string, { meta: Meta }>>;
