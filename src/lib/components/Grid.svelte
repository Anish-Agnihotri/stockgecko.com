<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		children,
		class: extraClass = "",
		bottom = true
	}: { children: Snippet; class?: string; bottom?: boolean } = $props();
</script>

<div class="flex flex-1 flex-col">
	<!-- Top section border -->
	<div class="hidden h-5 w-full justify-between border-b border-b-gecko-shade md:flex md:h-8">
		<div class="h-5 w-5.25 border-r border-r-gecko-shade md:h-8 md:w-8.25"></div>
		<div class="h-5 w-5.25 border-l border-l-gecko-shade md:h-8 md:w-8.25"></div>
	</div>

	<!-- Content section -->
	<div
		class="flex flex-1 flex-col px-0 md:flex-row md:gap-8 md:px-8 [&>div]:border-b [&>div]:border-b-gecko-shade [&>div]:bg-gecko-shade/25 md:[&>div]:border-x md:[&>div]:border-b-0 md:[&>div]:border-x-gecko-shade {extraClass}"
	>
		{@render children()}
	</div>

	<!-- Bottom section border -->
	{#if bottom}
		<!-- If visible, standard to top-->
		<div class="hidden h-5 w-full justify-between border-t border-t-gecko-shade md:flex md:h-8">
			<div class="h-5 w-5.25 border-r border-r-gecko-shade md:h-8 md:w-8.25"></div>
			<div class="h-5 w-5.25 border-l border-l-gecko-shade md:h-8 md:w-8.25"></div>
		</div>
	{:else}
		<!-- If not visible, on large displays, make sure to handle "bottom" border -->
		<div class="hidden border-t border-t-gecko-shade md:flex"></div>
	{/if}
</div>
