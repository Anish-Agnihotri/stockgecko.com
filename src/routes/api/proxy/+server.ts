import COMODO_CERT from "$lib/certs/comodo-aaa.pem?raw";
import { json, type RequestHandler } from "@sveltejs/kit";
import { OM_BASE_URL } from "$workflows/collection/ostium";

// Allowed proxyable origins
const ALLOWED_ORIGINS = new Set([OM_BASE_URL]);

// Response headers to strip (hop-by-hop, compression encoding)
const STRIP_HEADERS = new Set([
	"transfer-encoding",
	"connection",
	"keep-alive",
	"content-encoding"
]);

const handler: RequestHandler = async ({ request, url }) => {
	const target = url.searchParams.get("url");

	// Validate proxy target exists
	if (!target) {
		return json({ error: "Missing ?url= parameter" }, { status: 400 });
	}

	// Validate proxy target is real URL
	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		return json({ error: "Invalid URL" }, { status: 400 });
	}

	// Validate allowed origin
	if (!ALLOWED_ORIGINS.has(parsed.origin)) {
		return json({ error: "Origin not allowed" }, { status: 403 });
	}

	// Forward headers
	const headers = new Headers(request.headers);
	headers.delete("host");
	headers.delete("accept-encoding");

	// Execute request
	const hasBody = request.method !== "GET" && request.method !== "HEAD";

	const res = await Bun.fetch(parsed.toString(), {
		method: request.method,
		headers,
		body: hasBody ? await request.arrayBuffer() : undefined,
		// Override allowed CA's
		tls: {
			ca: COMODO_CERT
		}
	});

	// Filter response headers
	const respHeaders = new Headers();
	for (const [key, value] of res.headers) {
		if (!STRIP_HEADERS.has(key.toLowerCase())) {
			respHeaders.set(key, value);
		}
	}

	return new Response(await res.arrayBuffer(), { status: res.status, headers: respHeaders });
};

// Setup proxy handler across all
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
