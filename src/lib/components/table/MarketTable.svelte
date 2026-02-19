<script lang="ts">
	import { getContext } from "svelte";
	import * as Table from "$shadcn/table";
	import { marketToURL } from "$lib/utils";
	import Icon from "$components/Icon.svelte";
	import tickers from "$config/tickers.json";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import type { TickerCfg, ExchangeCfg } from "$lib/types";
	import BaseTable from "$components/table/BaseTable.svelte";
	import { MARKET_TO_ASSET, type DiffedSnapshot } from "$lib/transform";
	import { createSortState, sortRows, type Column } from "$components/table/table.svelte";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());

	// Setup sortable table
	type MarketKey = keyof DiffedSnapshot["markets"][0];
	const sort = createSortState<MarketKey>("volume");

	// Preserve market ID and enrich with assetId
	type MarketRow = DiffedSnapshot["markets"][string] & { id: string; assetId: string };

	// Custom market filters
	let { filter }: { filter?: Partial<MarketRow> } = $props();

	// Derive available markets w/ filter
	const entries: MarketRow[] = $derived(
		Object.entries(snapshot.markets)
			.map(([id, m]) => ({ id, assetId: MARKET_TO_ASSET.get(id)!.asset, ...m }))
			.filter((row) =>
				filter ? Object.entries(filter).every(([k, v]) => row[k as keyof MarketRow] === v) : true
			)
	);

	// Sorted rows
	const rows = $derived(() => {
		return sortRows(
			entries,
			(row, key: MarketKey) => row[key] as string | number,
			sort.key,
			sort.direction
		);
	});

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
	minWidth={870}
>
	<!-- Purposefully leave rank not fixed to volume for market table -->
	{#each rows() as row, rank}
		{@const asset = snapshot.assets[row.assetId]}
		{@const { name: assetName, quote } = (tickers.perps as TickerCfg)[asset.category][
			row.assetId
		].meta}
		{@const exchange = (exchanges as ExchangeCfg)[`${row.venue}:${row.namespace}`]}

		<Table.Row
			onclick={() => window.open(marketToURL(row.venue, row.namespace, row.ticker), "_blank")}
			class="h-10 cursor-pointer border-b-gecko-shade text-xs transition-none hover:bg-gecko-black-hover [&_td]:px-0 [&_td]:text-left [&_td]:align-middle"
		>
			<!-- Rank -->
			<Table.Cell class="w-10 text-center!"><Numeric value={rank + 1} /></Table.Cell>

			<!-- Market -->
			<Table.Cell>
				<span class="flex items-center">
					<!-- Venue icon -->
					<div class="flex w-7 items-center justify-center">
						<Icon src={exchange.icon} alt={exchange.name} nested />
					</div>

					<!-- Asset name -->
					<span class="ml-2 text-gecko-white">{assetName}</span>

					<!-- Spacer -->
					<span class="mx-1">/</span>

					<!-- Exchange human name -->
					<span class="font-mono text-gecko-gray">{exchange.name.toUpperCase()}</span>

					<!-- Spacer -->
					<span class="mx-1 hidden text-gecko-gray/30 lg:inline">/</span>

					<!-- Full market identifier -->
					<span class="hidden font-mono text-gecko-gray/30 lg:inline">{row.id.toUpperCase()}</span>
				</span>
			</Table.Cell>

			<!-- Volume -->
			<Table.Cell class="w-20">
				<Numeric value={row.volume} format="currency" currency="USD" class="text-gecko-white" />
			</Table.Cell>

			<!-- Volume change -->
			<Table.Cell class="w-24">
				<Numeric value={row.volumeChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- OI -->
			<Table.Cell class="w-20">
				<Numeric value={row.oi} format="currency" currency="USD" class="text-gecko-white" />
			</Table.Cell>

			<!-- OI change -->
			<Table.Cell class="w-24">
				<Numeric value={row.oiChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- Ref price -->
			<Table.Cell class="w-26">
				<Numeric
					value={row.refPx}
					format="numeric"
					currency={quote ?? "USD"}
					class="text-gecko-white"
				/>
			</Table.Cell>

			<!-- Mid price change -->
			<Table.Cell class="w-20">
				<Numeric value={row.refPxChange * 100} format="numeric" change percentage />
			</Table.Cell>
		</Table.Row>
	{/each}
</BaseTable>
