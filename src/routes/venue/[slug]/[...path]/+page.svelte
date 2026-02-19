<script lang="ts">
	import type { Meta } from "$lib/types";
	import type { PageProps } from "./$types";
	import Grid from "$components/Grid.svelte";
	import Icon from "$components/Icon.svelte";
	import Card from "$components/Card.svelte";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import MarketTable from "$components/table/MarketTable.svelte";

	let { data }: PageProps = $props();

	// Collect exchange meta
	const meta: Meta = $derived(
		exchanges[`${data.venue}:${data.dex ?? ""}` as keyof typeof exchanges]
	);

	// Filter markets
	const filtered = $derived(
		Object.values(data.snapshot.markets).filter(
			(x) => x.venue === data.venue && (data.dex ? x.namespace === data.dex : true)
		)
	);

	// Aggregate statistics
	const marketCount = $derived(filtered.length);
	const aggVol = $derived(filtered.reduce((s, x) => s + x.volume, 0));
	const aggVolChange = $derived(
		aggVol ? filtered.reduce((s, x) => s + x.volume * x.volumeChange, 0) / aggVol : 0
	);
	const aggOI = $derived(filtered.reduce((s, x) => s + x.oi, 0));
	const aggOIChange = $derived(
		aggOI ? filtered.reduce((s, x) => s + x.oi * x.oiChange, 0) / aggOI : 0
	);
</script>

<!-- Asset header -->
<div>
	<Grid bottom={false}>
		<div class="flex flex-1 flex-col px-4 py-6">
			<!-- Icon, name -->
			<div class="flex flex-row items-center gap-2">
				<Icon
					src={meta.icon}
					alt={meta.name}
					class="{meta.icon.length > 1 ? 'size-10' : ''} [&_img]:first:size-7 [&_img]:last:size-6"
					nested
				/>
				<h1 class="text-lg text-gecko-white md:text-xl">{meta.name}</h1>
			</div>

			<!-- Description -->
			<p class="mt-3 text-xs text-gecko-gray/75 md:text-sm">{meta.description}</p>
		</div>
	</Grid>
</div>

<!-- Aggregate statistics -->
<div>
	<Grid>
		<Card title="Market Count">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={marketCount} class="text-gecko-white" />
			</div>
		</Card>

		<Card title="Aggregate Volume">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={aggVol} format="currency" currency="USD" class="text-gecko-white" />
				<Numeric value={aggVolChange * 100} format="numeric" change percentage />
			</div>
		</Card>

		<Card title="Aggregate Open Interest">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={aggOI} format="currency" currency="USD" class="text-gecko-white" />
				<Numeric value={aggOIChange * 100} format="numeric" change percentage />
			</div>
		</Card>
	</Grid>
</div>

<!-- Market table -->
<div class="flex flex-1 flex-col md:border-t md:border-t-gecko-shade">
	<MarketTable filter={{ venue: data.venue, ...(data.dex ? { namespace: data.dex } : {}) }} />
</div>
