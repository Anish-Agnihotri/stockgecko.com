import fs from "fs";
import tls from "tls";
import path from "path";
import type { Handle } from "@sveltejs/kit";

// Read Comodo AAA root CA file
const extraCA = fs.readFileSync(path.join(process.cwd(), "certs", "comodo-aaa.pem"), "utf-8");

// Patch Node TLS
const originalCreateSecureContext = tls.createSecureContext;
tls.createSecureContext = (options: tls.SecureContextOptions = {}) => {
	const ctx = originalCreateSecureContext.call(this, options);
	ctx.context.addCACert(extraCA);
	return ctx;
};

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
