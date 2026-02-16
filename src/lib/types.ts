// Reuseable "any function" shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

// @dev promise this is not as complex as it looks
//
// By default, `Parameters<T>`, `ReturnType<T>` see just the last
// overloaded call signature. E.g.:
// 		- Input: `fn test(a)`, `fn test(a, b)`
// 		- Output: `fn test(a, b)`
//
// We instead want to write a union type that is a union of *all*
// of the overloaded call signatures. E.g.:
// 		- Input: `fn test(a)`, `fn test(a, b)`
// 		- Output: `fn test(a)`, `fn test(a, b)`
//
// This first checks for overloading: `{ (...a: infer A1): infer R1; (...a: infer A2): infer R2 }`
// Then, if exists, it returns a union type: `((...a: A1) => R1) | ((...a: A2) => R2)`
// Else, it checks for a single fn `(...a: infer A) => infer R`, and returns or does nothing
type OverloadUnion<F> = F extends { (...a: infer A1): infer R1; (...a: infer A2): infer R2 }
	? ((...a: A1) => R1) | ((...a: A2) => R2)
	: F extends (...a: infer A) => infer R
		? (...a: A) => R
		: never;

// Give me the union of keys whose values are functions
export type MethodKeys<T> = {
	// `[K in keyof T]`: mapping over each key
	// `-?:`: remove optional properties while mapping
	// `T[K] extends AnyFn`: if value is a fn, keep value (fn) else return ignore
	[K in keyof T]-?: T[K] extends AnyFn ? K : never;
	// [keyof T]: collect just the values (`{a: "a", b: "never"}` => "a")
}[keyof T];

// Given an object `T` and key `K` which is known to be a method key,
// return the actual function type at that key, and force its treatment as a function.
export type MethodAt<T, K extends MethodKeys<T>> = OverloadUnion<Extract<T[K], AnyFn>>;

// Get the resolved return type of an async function
export type AsyncReturn<F extends AnyFn> = Awaited<ReturnType<F>>;

// Frontend helpers for config parsing
// Weaker types for ease (indexing configs)
type Meta = { name: string; icon: string[] };
export type ExchangeCfg = Record<string, Meta>;
export type TickerCfg = Record<string, Record<string, { meta: Meta }>>;
