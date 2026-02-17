<script lang="ts">
	import { getContext } from "svelte";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";
	import AssetTable from "$components/AssetTable.svelte";
	import DitherHero from "$components/DitherHero.svelte";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());
</script>

<!-- Hero -->
<div class="flex min-h-96 flex-row justify-center border-b border-b-gecko-shade">
	<DitherHero class="flex flex-1 flex-col">
		<!-- CTA -->
		<div class="flex flex-1 items-center justify-center">
			<div class="flex max-w-lg flex-col items-center justify-center px-8 text-center lg:px-4">
				<h1 class="text-3xl font-bold text-gecko-white sm:text-5xl">TradFi lives on crypto.</h1>
				<p class="pt-2 text-sm">
					<Numeric
						value={snapshot.aggregates.volume}
						currency="USD"
						format="numeric"
						class="text-gecko-gray!"
					/> and counting of real-world assets have changed hands, entirely on-chain, in the last day
					alone.
				</p>
			</div>
		</div>
	</DitherHero>
</div>

<!-- Tabular data -->
<section class="flex max-w-full flex-1 flex-row justify-center">
	<AssetTable />
</section>
