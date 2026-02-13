<script lang="ts">
	import "../app.css";
	import "../shadcn.css";
	import { setContext } from "svelte";
	import * as Tooltip from "$shadcn/tooltip";
	import Header from "$components/Header.svelte";
	import Footer from "$components/Footer.svelte";

	// Injected data, page children
	let { data, children } = $props();

	// Set snapshot reference in Svelte component tree context to prevent drilling
	setContext("snapshot", () => data.snapshot);
</script>

<!-- Global tooltip provider -->
<Tooltip.Provider delayDuration={0}>
	<!-- Setup layout -->
	<div class="flex flex-col">
		<!-- Header -->
		<Header />

		<!-- Content -->
		{@render children()}

		<!-- Footer -->
		<Footer />
	</div>
</Tooltip.Provider>
