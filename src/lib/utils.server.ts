import crypto from "node:crypto";

/**
 * Compares two strings `a`, `b` via `timingSafeEqual`
 * @param {string} a first string
 * @param {string} b second string
 * @returns {boolean} strings match
 */
export function strTimingSafeEqual(a: string, b: string): boolean {
	// Convert strings to compareable buffers
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);

	// Pre-check length else `timingSafeEqual` will throw
	return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}
