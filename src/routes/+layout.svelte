<script lang="ts">
	import "../app.css";
	import { setContext } from "svelte";
	import * as Tooltip from "$shadcn/tooltip";
	import type { Snapshot } from "$lib/transform";

	// Injected data, page children
	let { data, children } = $props();

	// Inject Svelte context to access data directly from components
	setContext<Snapshot>("snapshot", data.snapshot);
</script>

<!-- Global tooltip provider -->
<Tooltip.Provider delayDuration={0}>
	<!-- Setup layout -->
	<div class="flex flex-col">
		<!-- Content -->
		<main>
			{@render children()}
		</main>
	</div>
</Tooltip.Provider>
