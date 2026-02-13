<script lang="ts">
	import { getContext } from "svelte";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());

	// Quick metrics helpers
	const assets = Object.keys(snapshot.assets).length;
	const markets = Object.keys(snapshot.markets).length;

	let { class: extraClass }: { class?: string } = $props();
</script>

<section
	class="flex h-8 flex-row items-center justify-center border-b border-gecko-shade lg:h-11 {extraClass}"
>
	<div
		class="flex h-full w-full max-w-7xl items-center justify-between overflow-x-auto border-x border-gecko-shade px-4 text-xs"
	>
		<!-- Statistics -->
		<div class="flex min-w-2xl flex-row space-x-4">
			<span>Assets: <Numeric value={assets} class="text-gecko-white" /></span>
			<span>Markets: <Numeric value={markets} class="text-gecko-white" /></span>
			<span
				>24h Volume: <Numeric
					value={snapshot.aggregates.volume}
					format="currency"
					dollar
					class="text-gecko-white"
				/><Numeric
					value={snapshot.aggregates.volumeChange * 100}
					format="numeric"
					class="ml-1"
					change
					percentage
				/></span
			>

			<!-- @dev: Requires at least two distinct venues -->
			<span
				>Dominance: <span class="ml-1 inline-flex gap-2"
					>{#each snapshot.aggregates.volumeByVenue.slice(0, 2) as { venue, volumeShare }}
						<!-- Tad ugly but proper capitalization -->
						<span class="text-gecko-white"
							>{venue.at(0)?.toUpperCase() + venue.slice(1)}
							<Numeric
								value={volumeShare * 100}
								format="numeric"
								percentage
								class="text-gecko-gray!"
							/></span
						>
					{/each}</span
				></span
			>
		</div>

		<!-- Source -->
		<div class="hidden lg:inline">
			<a
				href="https://github.com/anish-agnihotri/stockgecko.com"
				target="_blank"
				rel="noopener noreferrer"
				class="font-mono uppercase hover:text-gecko-white">View source on github</a
			>
		</div>
	</div>
</section>
