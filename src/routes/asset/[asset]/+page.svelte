<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types";
	import Meta from "$components/Meta.svelte";
	import Grid from "$components/Grid.svelte";
	import Icon from "$components/Icon.svelte";
	import Card from "$components/Card.svelte";
	import metaConfig from "$config/meta.json";
	import Numeric from "$components/Numeric.svelte";
	import MarketTable from "$components/table/MarketTable.svelte";
	import type { WithContext, FinancialProduct } from "schema-dts";

	let { data }: PageProps = $props();
	const { asset, meta, rows } = $derived(data);

	// Structured schema
	// @dev: Doesn't have to be derived given pageload properties but added
	// 			 for page change posterity
	const title = $derived(`StockGecko | ${data.meta.name}`);
	const schema: WithContext<FinancialProduct> = $derived({
		"@context": "https://schema.org",
		"@type": "FinancialProduct",
		name: title,
		url: metaConfig.url + page.url.pathname,
		category: data.asset.category,
		offers: {
			"@type": "AggregateOffer",
			priceCurrency: meta.quote,
			price: asset.medianRefPx.toString(),
			offerCount: rows.length
		},
		isRelatedTo: {
			"@type": "FinancialProduct",
			name: meta.name
		},
		provider: {
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
					class="{meta.icon.length > 1
						? 'size-9.5 md:size-11'
						: ''} [&_img]:size-6 md:[&_img]:size-7"
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
		<Card title="Price">
			<div class="flex gap-2 p-4 text-lg">
				<!-- Always prefer base quote currency -->
				<Numeric
					value={asset.medianRefPx}
					format="numeric"
					currency={meta.quote ?? "USD"}
					class="text-gecko-white"
				/>
				<Numeric value={asset.medianRefPxChange * 100} format="numeric" change percentage />
			</div>
		</Card>

		<Card title="Volume">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={asset.volume} format="currency" currency="USD" class="text-gecko-white" />
				<Numeric value={asset.volumeChange * 100} format="numeric" change percentage />
			</div>
		</Card>

		<Card title="Open Interest">
			<div class="flex gap-2 p-4 text-lg">
				<Numeric value={asset.oi} format="currency" currency="USD" class="text-gecko-white" />
				<Numeric value={asset.oiChange * 100} format="numeric" change percentage />
			</div>
		</Card>
	</Grid>
</div>

<!-- Market table -->
<div class="flex flex-1 flex-col md:border-t md:border-t-gecko-shade">
	<MarketTable {rows} />
</div>
