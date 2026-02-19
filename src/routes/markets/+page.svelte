<script lang="ts">
	import { getContext } from "svelte";
	import Icon from "$components/Icon.svelte";
	import Grid from "$components/Grid.svelte";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";
	import MarketTable from "$components/table/MarketTable.svelte";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());

	// Stats
	const venueCount = Object.keys(exchanges).length;
	const marketCount = Object.keys(snapshot.markets).length;
</script>

<!-- Landing header (title, description) -->
<Grid bottom={false}>
	<div class="flex flex-1 flex-col gap-0.5 px-4 py-6">
		<h1 class="text-lg text-gecko-white md:text-xl">Markets</h1>
		<p class="text-sm text-gecko-gray/75">
			Aggregating {marketCount} markets across {venueCount} venues.
		</p>
	</div>
</Grid>

<!-- Statistics row -->
<Grid>
	<div class="flex flex-1 flex-col md:flex-6 lg:flex-9">
		<!-- Chart header -->
		<div
			class="flex h-10 items-center border-b border-b-gecko-shade bg-gecko-black px-4 text-xs font-medium"
		>
			<h3>Volume vs. Open Interest</h3>
		</div>

		<!-- Chart body -->
		<div class="flex min-h-30 flex-1 flex-col items-center justify-center text-xs text-gecko-muted">
			<span>TODO</span>
		</div>
	</div>

	<!-- Exchange dominance by OI -->
	<div class="flex flex-1 flex-col md:flex-3">
		<!-- Table header -->
		<div class="flex h-10 items-center bg-gecko-black px-4 text-xs font-medium">
			<h3>Open Interest Dominance</h3>
		</div>

		<!-- Table content -->
		<div class="flex flex-col">
			{#each snapshot.aggregates.oiByVenue as { venue, oiShare }, i}
				{@const { name, icon } = exchanges[`${venue}:` as keyof typeof exchanges]}

				<a
					href="/venue/{venue}"
					class="flex h-10 items-center justify-between border-t border-t-gecko-shade text-xs hover:bg-gecko-black-hover"
				>
					<div class="flex items-center">
						<!-- Rank -->
						<span class="w-10 text-center"><Numeric value={i + 1} /></span>

						<!-- Exchange -->
						<div class="flex items-center">
							<div class="flex w-7 items-center justify-center">
								<Icon src={icon} alt={name} />
							</div>
							<span class="ml-2 text-gecko-white">{name}</span>
						</div>
					</div>

					<!-- OI share -->
					<span class="pr-4"
						><Numeric
							value={oiShare * 100}
							format="numeric"
							percentage
							class="text-gecko-gray!"
						/></span
					>
				</a>
			{/each}
		</div>
	</div>
</Grid>

<!-- Table of all markets -->
<MarketTable />
