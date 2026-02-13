<script lang="ts">
	import "../app.css";
	import * as Tooltip from "$shadcn/tooltip";

	// Injected data, page children
	let { data, children } = $props();
	console.log(data.snapshot);
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
