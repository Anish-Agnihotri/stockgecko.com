<script lang="ts">
	import "../app.css";
	import "../shadcn.css";
	import * as Tooltip from "$shadcn/tooltip";
	import Header from "$components/Header.svelte";

	// Injected data, page children
	let { children } = $props();
</script>

<!-- Global tooltip provider -->
<Tooltip.Provider delayDuration={0}>
	<!-- Setup layout -->
	<div class="flex flex-col">
		<!-- Header -->
		<Header />

		<!-- Content -->
		{@render children()}
	</div>
</Tooltip.Provider>
