import parse from "html-react-parser";
import { render } from "svelte/server";
import type { RequestHandler } from "@sveltejs/kit";
import OpenGraph from "$components/OpenGraph.svelte";
import { ImageResponse } from "@takumi-rs/image-response";

// Load Inter subset font
export const GET: RequestHandler = async ({ fetch, url }) => {
	// Setup required parameters
	// Simply collect injected data from query parameters
	const {
		markets,
		volume,
		oi,
		name,
		logo
	}: { markets?: string; volume?: string; oi?: string; name?: string; logo?: string } =
		Object.fromEntries(url.searchParams);

	// If missing parameters for meta image generation
	if ([markets, volume, oi, name, logo].some((x) => x == undefined)) {
		// Simply fail with default meta image
		const image = await fetch("/assets/brand/meta.webp");
		const buffer = await image.arrayBuffer();
		return new Response(buffer, { headers: { "Content-Type": "image/webp" } });
	}

	// Else, first, render OpenGraph Svelte component with injected data
	const rendered = await render(OpenGraph, { props: { markets, volume, oi, name, logo } });

	// Clean HTML produced by Svelte
	// Update `class=` attributes to `tw=` for `takumi`
	const cleaned = rendered.body
		.replace(/<!--.*?-->/g, "")
		.replace(/>\s+</g, "><")
		.replace(/class="/g, 'tw="');

	// Parse to React DOM
	const dom = parse(cleaned);

	// Return rendered image
	return new ImageResponse(dom, {
		// Scale: 2x
		width: 2400,
		height: 1256,
		format: "webp"
	});
};
