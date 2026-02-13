<script lang="ts">
	import "../app.css";
	import "../shadcn.css";
	import { setContext } from "svelte";
	import * as Tooltip from "$shadcn/tooltip";
	import Header from "$components/Header.svelte";
	import Footer from "$components/Footer.svelte";
	import Subheader from "$components/Subheader.svelte";

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
		<Header class="order-1 lg:order-2" />

		<!-- Subheader -->
		<Subheader class="order-2 lg:order-1" />

		<!-- Content -->
		<main class="order-3 flex flex-1 flex-col">
			{@render children()}
		</main>

		<!-- Footer -->
		<Footer class="order-4" />
	</div>
</Tooltip.Provider>
