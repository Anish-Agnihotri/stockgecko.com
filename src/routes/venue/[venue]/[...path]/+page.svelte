<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types";
	import Meta from "$components/Meta.svelte";
	import Grid from "$components/Grid.svelte";
	import Icon from "$components/Icon.svelte";
	import Card from "$components/Card.svelte";
	import metaConfig from "$config/meta.json";
	import Numeric from "$components/Numeric.svelte";
	import type { WithContext, Organization } from "schema-dts";
	import MarketTable from "$components/table/MarketTable.svelte";

	let { data }: PageProps = $props();
	const { meta, rows, aggregate } = $derived(data);

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
			offerCount: rows.length,
			description: `${meta.name} offers ${rows.length} real-world asset markets`
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
				<Numeric value={rows.length} class="text-gecko-white" />
			</div>
		</Card>

		<Card title="Aggregate Volume">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric
					value={aggregate.volume.value}
					format="currency"
					currency="USD"
					class="text-gecko-white"
				/>
				<Numeric value={aggregate.volume.change * 100} format="numeric" change percentage />
			</div>
		</Card>

		<Card title="Aggregate Open Interest">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric
					value={aggregate.oi.value}
					format="currency"
					currency="USD"
					class="text-gecko-white"
				/>
				<Numeric value={aggregate.oi.change * 100} format="numeric" change percentage />
			</div>
		</Card>
	</Grid>
</div>

<!-- Market table -->
<div class="flex flex-1 flex-col md:border-t md:border-t-gecko-shade">
	<MarketTable {rows} />
</div>
