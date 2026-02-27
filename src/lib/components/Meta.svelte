<script lang="ts">
	import { page } from "$app/state";
	import meta from "$config/meta.json";
	import inter from "$lib/fonts/Inter-subset.woff2";
	import { type Schema, DEFAULT_SCHEMA, serializeSchema } from "$lib/schema";

	// Load optional props (w/ defaults from config)
	export let title: string = meta.title;
	export let description: string = meta.description;
	export let url = meta.url + page.url.pathname;
	export let image = meta.image;
	export let schema: Schema = DEFAULT_SCHEMA;
</script>

<svelte:head>
	<!-- SEO: General -->
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<!-- X -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={url} />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={image} />

	<!-- Preload font -->
	<link rel="preload" href={inter} as="font" type="font/woff2" crossorigin="anonymous" />

	<!-- Inject structured schema script -->
	{@html serializeSchema(schema)}
</svelte:head>
