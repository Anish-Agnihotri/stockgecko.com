// Frontend helpers for config parsing
// Weaker types for ease (indexing configs)
type Meta = { name: string; icon: string[]; quote?: string };
export type ExchangeCfg = Record<string, Meta>;
export type TickerCfg = Record<string, Record<string, { meta: Meta }>>;
