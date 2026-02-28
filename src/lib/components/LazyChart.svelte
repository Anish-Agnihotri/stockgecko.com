<script lang="ts">
	import type { EChartsOption } from "echarts";
	import { onMount, type Component } from "svelte";
	import type { init as InitType } from "$lib/echarts";

	// Collect chart render options
	let { options }: { options: EChartsOption } = $props();

	// Setup dynamic loading
	let container: HTMLDivElement;
	let ChartComponent: Component<{ init: typeof InitType; options: EChartsOption }> | null =
		$state(null);
	let initFn: typeof InitType | null = $state(null);
	let visible = $state(false);

	// Observe chart visibility
	onMount(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: "200px" }
		);
		observer.observe(container);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (visible && !ChartComponent) {
			// Dynamically load component
			import("$lib/echarts").then((mod) => {
				initFn = mod.init;
				ChartComponent = mod.Chart;
			});
		}
	});
</script>

<div bind:this={container} class="h-full w-full">
	{#if ChartComponent && initFn}
		<!-- Render dynamically imported chart -->
		<ChartComponent init={initFn} {options} />
	{:else}
		<!-- Pulse loading state -->
		<div class="flex h-full w-full animate-pulse rounded bg-gecko-shade/5"></div>
	{/if}
</div>
