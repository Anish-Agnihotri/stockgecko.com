import { FatalError, fetch, getStepMetadata, RetryableError } from "workflow";

// Proxy base URL (bypasses cert limitations + non-US execution)
const PROXY_BASE = process.env.VERCEL_PROJECT_PRODUCTION_URL
	? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
	: `http://localhost:5173`;

/**
 * `fetch` helper for typed requests with custom step failure retry logic
 * @param {string} url to fetch
 * @param {boolean} proxy `true` if proxying through `/api/proxy`
 * @param {RequestInit} init Optional request parameters
 * @returns {Promise<T>} fetched JSON response
 */
export async function stepFetchJSON<T>(
	url: string,
	proxy: boolean = false,
	init?: RequestInit
): Promise<T> {
	"use step";

	// Collect attempt metadata
	const { attempt } = getStepMetadata();

	// Setup proxied url
	const reqURL = proxy ? `${PROXY_BASE}/api/proxy?url=${encodeURIComponent(url)}` : url;

	// Execute request
	const res = await fetch(reqURL, init);

	// If rate-limited, sane logic for workflow retry
	if (res.status === 429) {
		// Default retry to exponential backoff of attempt
		let retryAfter = attempt ** 2 * 1000;

		// But, also check to see if API returns a retry header
		// If header does exist and is valid, set retry to that duration
		const ra = res.headers.get("Retry-After") ?? res.headers.get("retry-after");
		if (ra && /^\d+$/.test(ra)) {
			retryAfter = parseInt(ra, 10) * 1000;
		}

		// Throw retryable error
		throw new RetryableError(`Rated limited: ${url}`, { retryAfter });
	}

	// Else, if transient error, retry with exponential backoff only
	if (res.status >= 500 && res.status < 600) {
		const retryAfter = attempt ** 2 * 1000;
		throw new RetryableError(`Upstream error ${res.status}: ${url}`, { retryAfter });
	}

	// Treat all other 4xx as fatal and don't retry
	if (res.status >= 400) {
		throw new FatalError(`Client error ${res.status}: ${url}`);
	}

	// Else, return parsed JSON response as strict type
	return (await res.json()) as T;
}
