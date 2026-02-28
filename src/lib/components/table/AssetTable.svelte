<script module>
	import type { Meta } from "$lib/types";
	import type { DiffedSnapshot } from "$lib/transform";

	export type AssetRow = DiffedSnapshot["assets"][string] & {
		// ID
		id: string;
		// Asset meta
		meta: Meta;
		// Volume-weighted rank
		rank: number;
		// Previous rank
		previousRank: number | null;
	};
</script>

<script lang="ts">
	import * as Table from "$shadcn/table";
	import { goto } from "$app/navigation";
	import Icon from "$components/Icon.svelte";
	import type { ExchangeCfg } from "$lib/types";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import IconScroll from "$components/IconScroll.svelte";
	import BaseTable from "$components/table/BaseTable.svelte";
	import { createSortState, sortRows, type Column } from "$components/table/table.svelte";

	let { rows }: { rows: AssetRow[] } = $props();

	// Setup sortable table
	type AssetKey = keyof DiffedSnapshot["assets"][0];
	const sort = createSortState<AssetKey>("volume");

	// Sorted rows
	const sorted = $derived(
		sortRows(rows, (row, key: AssetKey) => row[key] as string | number, sort.key, sort.direction)
	);

	// Setup columns/headers
	const columns: Column<AssetKey>[] = [
		{ width: 10, title: "", sortKey: null },
		{ width: 6, title: "", sortKey: null },
		{ width: null, title: "Asset", sortKey: null },
		{ width: 20, title: "Volume", sortKey: "volume" },
		{ width: 24, title: "24h", sortKey: "volumeChange" },
		{ width: 20, title: "OI", sortKey: "oi" },
		{ width: 24, title: "24h", sortKey: "oiChange" },
		{ width: 26, title: "Price", sortKey: null },
		{ width: 20, title: "24h", sortKey: "medianRefPxChange" },
		{ width: 28, title: "Class", sortKey: "category" },
		{ width: 25, title: "Venues", sortKey: null },
		{ width: 3, title: "", sortKey: null }
	];
</script>

<BaseTable
	{columns}
	sortKey={sort.key}
	sortDirection={sort.direction}
	onSort={sort.toggle}
	minWidth={1100}
	rowCount={rows.length}
>
	{#snippet row(index)}
		<!-- Collect asset data + metadata -->
		{@const asset = sorted[index]}

		<Table.Row
			onclick={() => goto(`/asset/${asset.id}`)}
			class="h-10 cursor-pointer border-b-gecko-shade text-xs transition-none hover:bg-gecko-black-hover [&_td]:px-0 [&_td]:text-left [&_td]:align-middle"
		>
			<!-- Ranking change -->
			<Table.Cell class="w-10 text-center!"
				><Numeric value={asset.rank - (asset.previousRank ?? 0)} change /></Table.Cell
			>

			<!-- Current ranking -->
			<Table.Cell class="w-6">
				{@const rank = asset.rank + 1}

				{#if rank <= 3}
					<img
						src={`/assets/icons/medals/medal-${rank}.svg`}
						alt={`#${rank} place medal`}
						height="16px"
						width="16px"
						class="-translate-x-1"
					/>
				{:else}
					<Numeric value={rank} />
				{/if}
			</Table.Cell>

			<!-- Asset -->
			<Table.Cell class="py-0 pr-0">
				<span class="flex items-center">
					<div class="flex w-7 items-center justify-center">
						<Icon src={asset.meta.icon} alt={asset.meta.name} />
					</div>
					<span class="ml-2 text-gecko-white">{asset.meta.name}</span>
					<span class="ml-1 text-gecko-gray">{asset.id.toUpperCase()}</span>
				</span>
			</Table.Cell>

			<!-- Volume -->
			<Table.Cell class="w-20">
				<Numeric value={asset.volume} format="currency" currency="USD" class="text-gecko-white" />
			</Table.Cell>

			<!-- Volume change -->
			<Table.Cell class="w-24">
				<Numeric value={asset.volumeChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- OI -->
			<Table.Cell class="w-20">
				<Numeric value={asset.oi} format="currency" currency="USD" class="text-gecko-white" />
			</Table.Cell>

			<!-- OI change -->
			<Table.Cell class="w-24">
				<Numeric value={asset.oiChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- Ref price -->
			<!-- Always prefer base quote currency -->
			<Table.Cell class="w-26">
				<Numeric
					value={asset.medianRefPx}
					format="numeric"
					currency={asset.meta.quote ?? "USD"}
					class="text-gecko-white"
				/>
			</Table.Cell>

			<!-- Mid price change -->
			<Table.Cell class="w-20">
				<Numeric value={asset.medianRefPxChange * 100} format="numeric" change percentage />
			</Table.Cell>

			<!-- Class -->
			<Table.Cell class="w-28">
				<span class="font-mono uppercase">{asset.category}</span>
			</Table.Cell>

			<!-- Venues -->
			<Table.Cell class="w-25">
				<IconScroll>
					{#each asset.marketIds as marketId}
						{@const [venue, dex] = marketId.split(":")}
						{@const { name, icon } = (exchanges as ExchangeCfg)[
							marketId.split(":").length == 3 ? `${venue}:${dex}` : `${venue}:`
						]}

						<Icon src={icon} alt={name} nested />
					{/each}
				</IconScroll>
			</Table.Cell>

			<!-- Empty sizer -->
			<Table.Cell class="w-3"></Table.Cell>
		</Table.Row>
	{/snippet}
</BaseTable>
