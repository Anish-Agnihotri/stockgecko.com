<script module>
	import type { DiffedSnapshot } from "$lib/transform";

	// Minimally-optimized `MarketRow` to reduce config inlining
	// @dev: venue lookup left to per-iteration (smaller static config)
	export type MarketRow = DiffedSnapshot["markets"][string] & {
		// Market ID
		id: string;
		// Market currency
		currency: string;
		// Asset name
		asset: { name: string };
	};
</script>

<script lang="ts">
	import * as Table from "$shadcn/table";
	import { marketToURL } from "$lib/utils";
	import Icon from "$components/Icon.svelte";
	import type { ExchangeCfg } from "$lib/types";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import BaseTable from "$components/table/BaseTable.svelte";
	import { createSortState, sortRows, type Column } from "$components/table/table.svelte";

	// Setup sortable table
	type MarketKey = keyof MarketRow;
	const sort = createSortState<MarketKey>("volume");

	// Collect rows to render
	let { rows }: { rows: MarketRow[] } = $props();

	// Sort rows
	const sorted = $derived(
		sortRows(rows, (row, key: MarketKey) => row[key] as string | number, sort.key, sort.direction)
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
	rowCount={sorted.length}
>
	<!-- Purposefully leave rank not fixed to volume for market table -->
	{#snippet row(index)}
		{@const market = sorted[index]}
		{@const { name, icon } = (exchanges as ExchangeCfg)[`${market.venue}:${market.namespace}`]}

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
						<Icon src={icon} alt={name} nested />
					</div>

					<!-- Asset name -->
					<span class="ml-2 text-gecko-white">{market.asset.name}</span>

					<!-- Spacer -->
					<span class="mx-1">/</span>

					<!-- Exchange human name -->
					<span class="font-mono text-gecko-gray">{name.toUpperCase()}</span>

					<!-- Spacer -->
					<span class="mx-1 hidden text-gecko-gray/30 lg:inline">/</span>

					<!-- Full market identifier -->
					<span class="hidden font-mono text-gecko-gray/30 lg:inline"
						>{market.id.toUpperCase()}</span
					>
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
					currency={market.currency}
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
