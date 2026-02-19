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

/**
 * Given market parameters, returns formatted front-end URL to market
 * @param {string} venue exchange
 * @param {string} namespace sub-DEX
 * @param {string} ticker market symbol
 * @returns {string} front-end URL
 */
export function marketToURL(venue: string, namespace: string, ticker: string): string {
	switch (venue) {
		case "hyperliquid":
			return `https://app.hyperliquid.xyz/trade/${namespace}:${ticker}`;
		case "lighter":
			return `https://app.lighter.xyz/trade/${ticker}`;
		case "ostium": {
			const [from, to] = ticker.split("-");
			return `https://app.ostium.com?from=${from}&to=${to}`;
		}
		case "qfex":
			return `https://qfex.com/trade/${ticker}`;
		case "binance":
			return `https://binance.com/en/futures/${ticker}`;
		case "aster":
			return `https://asterdex.com/en/trade/pro/futures/${ticker}`;
		case "edgex":
			return `https://pro.edgex.exchange/en-US/trade/${ticker}`;
		case "extended":
			return `https://app.extended.exchange/perp/${ticker}`;
		case "vest":
			return `https://trade.vestmarkets.com/trade/${ticker}`;
		default:
			throw new Error(`Unknown venue: ${venue}`);
	}
}
