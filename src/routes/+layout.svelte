<script lang="ts">
	import "../app.css";
	import * as Tooltip from "$shadcn/tooltip";

	let { children } = $props();
</script>

<!-- Global tooltip provider -->
<Tooltip.Provider delayDuration={0}>
	{@render children()}
</Tooltip.Provider>
