<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types";
	import Meta from "$components/Meta.svelte";
	import Grid from "$components/Grid.svelte";
	import Icon from "$components/Icon.svelte";
	import Card from "$components/Card.svelte";
	import metaConfig from "$config/meta.json";
	import exchanges from "$config/exchanges.json";
	import type { Meta as MetaT } from "$lib/types";
	import Numeric from "$components/Numeric.svelte";
	import type { WithContext, Organization } from "schema-dts";
	import MarketTable from "$components/table/MarketTable.svelte";

	let { data }: PageProps = $props();

	// Collect exchange meta
	const meta: MetaT = $derived(
		exchanges[`${data.venue}:${data.dex ?? ""}` as keyof typeof exchanges]
	);

	// Filter markets by optimized ID search
	const snapshot = $derived(data.snapshot);
	const marketIds = $derived.by(() => {
		const ids = snapshot.index.marketsByVenue[data.venue] ?? [];
		return data.dex ? ids.filter((id) => snapshot.markets[id].namespace === data.dex) : ids;
	});

	// Aggregate statistics
	const stats = $derived.by(() => {
		let count = 0,
			vol = 0,
			oi = 0,
			volX = 0,
			oiX = 0;

		for (const id of marketIds) {
			const market = snapshot.markets[id];

			// Aggregate statistics
			count += 1;
			vol += market.volume;
			oi += market.oi;
			volX += market.volume * market.volumeChange;
			oiX += market.oi + market.oiChange;
		}

		return { count, vol, oi, volChg: vol ? volX / vol : 0, oiChg: oi ? oiX / oi : 0 };
	});

	// Structured schema
	// @dev: Doesn't have to be derived given pageload properties but added
	// 			 for page change posterity
	const title = $derived(`StockGecko | ${meta.name}`);
	const schema: WithContext<Organization> = $derived({
		"@context": "https://schema.org",
		"@type": "Organization",
		name: meta.name,
		url: metaConfig.url + page.url.pathname,
		makesOffer: {
			"@type": "AggregateOffer",
			priceCurrency: "USD",
			offerCount: stats.count,
			description: `${meta.name} offers ${stats.count} real-world asset markets`
		},
		parentOrganization: {
			"@type": "Organization",
			name: metaConfig.title,
			url: metaConfig.url,
			logo: metaConfig.favicon
		}
	});
</script>

<Meta {title} {schema} />

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
				<Numeric value={stats.count} class="text-gecko-white" />
			</div>
		</Card>

		<Card title="Aggregate Volume">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={stats.vol} format="currency" currency="USD" class="text-gecko-white" />
				<Numeric value={stats.volChg * 100} format="numeric" change percentage />
			</div>
		</Card>

		<Card title="Aggregate Open Interest">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={stats.oi} format="currency" currency="USD" class="text-gecko-white" />
				<Numeric value={stats.oiChg * 100} format="numeric" change percentage />
			</div>
		</Card>
	</Grid>
</div>

<!-- Market table -->
<div class="flex flex-1 flex-col md:border-t md:border-t-gecko-shade">
	<MarketTable
		filter={{ venue: data.venue, ...(data.dex ? { namespace: data.dex } : {}) }}
		{snapshot}
	/>
</div>
