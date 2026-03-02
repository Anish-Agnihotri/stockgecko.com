<script lang="ts">
	import type { PageProps } from "./$types";
	import Meta from "$components/Meta.svelte";
	import Numeric from "$components/Numeric.svelte";
	import DitherHero from "$components/DitherHero.svelte";
	import AssetTable from "$components/table/AssetTable.svelte";

	let { data }: PageProps = $props();
	const snapshot = $derived(data.snapshot);
</script>

<Meta />

<!-- Hero -->
<div class="flex min-h-96 flex-row justify-center border-b border-b-gecko-shade">
	<DitherHero class="flex flex-1 flex-col">
		<!-- CTA -->
		<div class="flex flex-1 items-center justify-center">
			<div class="flex max-w-xl flex-col items-center justify-center px-8 text-center lg:px-4">
				<h1 class="text-3xl font-bold text-gecko-white sm:text-5xl">TradFi lives on-chain.</h1>
				<p class="max-w-sm pt-2 text-sm">
					<Numeric
						value={data.snapshot.aggregates.volume}
						currency="USD"
						format="currency"
						class="text-gecko-gray!"
					/> and counting of real-world assets have traded on crypto venues in the last 24 hours.
				</p>
			</div>
		</div>
	</DitherHero>
</div>

<!-- Tabular data -->
<section class="flex max-w-full flex-1 flex-row justify-center">
	<AssetTable {snapshot} />
</section>
