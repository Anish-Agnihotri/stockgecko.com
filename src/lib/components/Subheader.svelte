<script lang="ts">
	import { page } from "$app/state";
	import Numeric from "$components/Numeric.svelte";

	let { class: extraClass }: { class?: string } = $props();
</script>

<section
	class="flex h-8 flex-row items-center justify-center border-b border-gecko-shade lg:h-11 {extraClass}"
>
	<div
		class="flex h-full w-full max-w-7xl items-center justify-between overflow-x-auto border-gecko-shade px-4 text-xs lg:border-x"
	>
		<!-- Statistics -->
		<div class="flex min-w-3xl flex-row space-x-4">
			<span>Assets: <Numeric value={page.data.stats.assets} class="text-gecko-white" /></span>
			<span>Markets: <Numeric value={page.data.stats.markets} class="text-gecko-white" /></span>
			<span
				>OI: <Numeric
					value={page.data.stats.oi.value}
					format="currency"
					currency="USD"
					class="text-gecko-white"
				/><Numeric
					value={page.data.stats.oi.change * 100}
					format="numeric"
					class="ml-1"
					change
					percentage
				/></span
			>
			<span
				>Volume: <Numeric
					value={page.data.stats.volume.value}
					format="currency"
					currency="USD"
					class="text-gecko-white"
				/><Numeric
					value={page.data.stats.volume.change * 100}
					format="numeric"
					class="ml-1"
					change
					percentage
				/></span
			>

			<!-- @dev: Requires at least two distinct venues -->
			<span
				>OI Dominance: <span class="ml-1 inline-flex gap-2"
					>{#each page.data.stats.oi.dominance as { venue, oiShare }}
						<!-- Tad ugly but proper capitalization -->
						<span class="text-gecko-white"
							>{venue.at(0)?.toUpperCase() + venue.slice(1)}
							<Numeric
								value={oiShare * 100}
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
