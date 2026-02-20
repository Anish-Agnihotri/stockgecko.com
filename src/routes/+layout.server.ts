import { loadSnapshot } from "$lib/load";
import type { DiffedSnapshot } from "$lib/transform";

// Collect `snapshot` state from database; hot-cached via ISR
export async function load(): Promise<{ snapshot: DiffedSnapshot }> {
	return await loadSnapshot();
}

// Prerender all pages
// @dev: careful not to reference API routes in
// 			 `load`(s) else it will prerender those too
export const prerender = true;
