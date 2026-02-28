import { loadSnapshot } from "$lib/load";
import { json, type RequestHandler } from "@sveltejs/kit";

// Prerender cached route: return full snapshot data
export const GET: RequestHandler = async () => {
	return json(await loadSnapshot());
};

// @dev: By default, this route will already be cached because
//       it is referenced by pages that are pre-rendered, but
//       we do it here anyways, just to be explicit.
export const prerender = true;
