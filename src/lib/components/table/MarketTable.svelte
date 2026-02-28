<script lang="ts">
	import * as Table from "$shadcn/table";
	import { marketToURL } from "$lib/utils";
	import Icon from "$components/Icon.svelte";
	import tickers from "$config/tickers.json";
	import exchanges from "$config/exchanges.json";
	import type { TickerCfg, ExchangeCfg } from "$lib/types";
	import BaseTable from "$components/table/BaseTable.svelte";
	import { MARKET_TO_ASSET, type DiffedSnapshot } from "$lib/transform";
	import Numeric, { getNormalizedCurrency } from "$components/Numeric.svelte";
	import { createSortState, sortRows, type Column } from "$components/table/table.svelte";

	// Setup sortable table
	type MarketKey = keyof DiffedSnapshot["markets"][0];
	const sort = createSortState<MarketKey>("volume");

	// Minimally-optimized filter
	type Filter = { assetId?: string; venue?: string; namespace?: string };

	// Collect snapshot, custom market filters
	let { snapshot, filter }: { snapshot: DiffedSnapshot; filter?: Filter } = $props();

	// Filter over just market ID candidate set
	const marketIds = $derived.by(() => {
		// Collect marketIDs by specific assetID (asset pages)
		if (filter?.assetId) return snapshot.assets[filter.assetId]?.marketIds ?? [];

		// Collect marketIDs by {venue, namespace}-filtering over full set
		if (filter?.venue) {
			const ids = snapshot.index.marketsByVenue[filter.venue] ?? [];
			return filter.namespace
				? ids.filter((id) => snapshot.markets[id].namespace === filter.namespace)
				: ids;
		}

		// Else, return all market IDs
		return Object.keys(snapshot.markets);
	});

	// Sort IDs via lookup (don't prematurely allocate `MarketRow` via `map`)
	const sortedIds = $derived(
		sortRows(
			marketIds,
			(row, key: MarketKey) => snapshot.markets[row][key] as string | number,
			sort.key,
			sort.direction
		)
	);

	// Setup columns/headers
	const columns: Column<MarketKey>[] = [
		{ width: 10, title: "", sortKey: null },
		{ width: null, title: "Market", sortKey: null },
		{ width: 20, title: "Volume", sortKey: "volume" },
		{ width: 24, title: "24h", sortKey: "volumeChange" },
		{ width: 20, title: "OI", sortKey: "oi" },
		{ width: 24, title: "24h", sortKey: "oiChange" },
		{ width: 26, title: "Price", sortKey: null },
		{ width: 24, title: "24h", sortKey: "refPxChange" }
	];
</script>

<!-- Triggers scrollable flag a tad early, but that's fine -->
<BaseTable
	{columns}
	sortKey={sort.key}
	sortDirection={sort.direction}
	onSort={sort.toggle}
	minWidth={940}
	rowCount={sortedIds.length}
>
	<!-- Purposefully leave rank not fixed to volume for market table -->
	{#snippet row(index)}
		{@const id = sortedIds[index]}
		{@const market = snapshot.markets[id]}
		{@const { name, quote, venueQuote } = MARKET_TO_ASSET.get(id)!}
		{@const exchange = (exchanges as ExchangeCfg)[`${market.venue}:${market.namespace}`]}

		<Table.Row
			onclick={() =>
				window.open(marketToURL(market.venue, market.namespace, market.ticker), "_blank")}
			class="h-10 cursor-pointer border-b-gecko-shade text-xs transition-none hover:bg-gecko-black-hover [&_td]:px-0 [&_td]:text-left [&_td]:align-middle"
		>
			<!-- Rank -->
			<Table.Cell class="w-10 text-center!"><Numeric value={index + 1} /></Table.Cell>

			<!-- Market -->
			<Table.Cell>
				<span class="flex items-center">
					<!-- Venue icon -->
					<div class="flex w-7 items-center justify-center">
						<Icon src={exchange.icon} alt={exchange.name} nested />
					</div>

					<!-- Asset name -->
					<span class="ml-2 text-gecko-white">{name}</span>

					<!-- Spacer -->
					<span class="mx-1">/</span>

					<!-- Exchange human name -->
					<span class="font-mono text-gecko-gray">{exchange.name.toUpperCase()}</span>

					<!-- Spacer -->
					<span class="mx-1 hidden text-gecko-gray/30 lg:inline">/</span>

					<!-- Full market identifier -->
					<span class="hidden font-mono text-gecko-gray/30 lg:inline">{id.toUpperCase()}</span>
				</span>
			</Table.Cell>

			<!-- Volume -->
			<Table.Cell class="w-20">
				<Numeric value={market.volume} format="currency" currency="USD" class="text-gecko-white" />
			</Table.Cell>

			<!-- Volume change -->
			<Table.Cell class="w-24">
				<Numeric value={market.volumeChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- OI -->
			<Table.Cell class="w-20">
				<Numeric value={market.oi} format="currency" currency="USD" class="text-gecko-white" />
			</Table.Cell>

			<!-- OI change -->
			<Table.Cell class="w-24">
				<Numeric value={market.oiChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- Ref price -->
			<Table.Cell class="w-26">
				<Numeric
					value={market.refPx}
					format="numeric"
					currency={venueQuote ? venueQuote : quote ? quote : "USD"}
					class="text-gecko-white"
				/>
			</Table.Cell>

			<!-- Mid price change -->
			<Table.Cell class="w-20">
				<Numeric value={market.refPxChange * 100} format="numeric" change percentage />
			</Table.Cell>
		</Table.Row>
	{/snippet}
</BaseTable>
