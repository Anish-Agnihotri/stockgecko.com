<script lang="ts">
	import { getContext } from "svelte";
	import * as Table from "$shadcn/table";
	import { goto } from "$app/navigation";
	import tickers from "$config/tickers.json";
	import Icon from "$components/Icon.svelte";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";
	import type { ExchangeCfg, TickerCfg } from "$lib/types";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());

	// Setup sortable table
	type AssetKey = keyof DiffedSnapshot["assets"][0];
	let sortKey: AssetKey = $state("volume");
	let sortDirection: 1 | -1 = $state(-1);

	/**
	 * Toggle column sort direction
	 * @param {AssetKey} key to sort on
	 */
	function toggleSort(key: AssetKey) {
		if (sortKey === key) {
			// Reverse direction
			sortDirection *= -1;
		} else {
			// Else, set new sort key
			sortKey = key;
			sortDirection = -1;
		}
	}

	// Sorted rows
	const rows = $derived(() => {
		// Sort by `sortKey`
		return [...snapshot.index.assetsByVolume].sort((a, b) => {
			const valA = snapshot.assets[a.asset][sortKey!];
			const valB = snapshot.assets[b.asset][sortKey!];
			const cmp =
				typeof valA === "string"
					? // String sort (category)
						(valA as string).localeCompare(valB as string)
					: // Numeric value sort
						(valA as number) - (valB as number);
			return cmp * sortDirection;
		});
	});

	// Setup columns/headers
	const COLUMNS: { width: number | null; title: string; sortKey: AssetKey | null }[] = [
		{ width: 10, title: "", sortKey: null },
		{ width: 6, title: "", sortKey: null },
		{ width: null, title: "Asset", sortKey: null },
		{ width: 26, title: "Mid Price", sortKey: null },
		{ width: 20, title: "24h", sortKey: "medianMidPxChange" },
		{ width: 20, title: "Volume", sortKey: "volume" },
		{ width: 24, title: "24h", sortKey: "volumeChange" },
		{ width: 28, title: "Class", sortKey: "category" },
		{ width: 36, title: "Venues", sortKey: null }
	];
</script>

<div class="flex w-full flex-col">
	<!-- Scrollable handler on mobile -->
	<div
		class="flex items-center justify-end border-b border-b-gecko-shade bg-gecko-black px-2 py-0.5 font-mono text-xs text-gecko-gray/30 uppercase md:hidden"
	>
		<span>Scrollable</span>
		<span class="ml-1 -translate-y-px text-lg">↔</span>
	</div>

	<!-- FIXME: look into overscroll prevention along x-axis -->
	<Table.Root class="w-full min-w-230 table-fixed">
		<Table.Header class="bg-gecko-black">
			<Table.Row class="border-b-gecko-shade text-xs font-light [&_th]:px-0">
				{#each COLUMNS as { width, title, sortKey: key }}
					<Table.Head
						class="{width ? `w-${width}` : ''}{key ? ' cursor-pointer select-none' : ''}"
						onclick={key ? () => toggleSort(key) : undefined}
						>{title} {sortKey === key ? (sortDirection === 1 ? "↑" : "↓") : ""}</Table.Head
					>
				{/each}
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#each rows() as { asset: assetId, previousIndex }}
				<!-- Collect asset data + metadata -->
				{@const asset = snapshot.assets[assetId]}
				{@const { name, icon, quote } = (tickers.perps as TickerCfg)[asset.category][assetId].meta}
				{@const volumeRank = snapshot.index.assetsByVolume.findIndex((r) => r.asset === assetId)}
				{@const rankDelta = previousIndex != null ? previousIndex - volumeRank : 0}

				<Table.Row
					onclick={() => goto(`/asset/${assetId}`)}
					class="h-10 cursor-pointer border-b-gecko-shade text-xs transition-none hover:bg-gecko-black-hover [&_td]:px-0 [&_td]:text-left [&_td]:align-middle"
				>
					<!-- Ranking change -->
					<Table.Cell class="w-10 text-center!"><Numeric value={rankDelta} change /></Table.Cell>

					<!-- Current ranking -->
					<Table.Cell class="w-6">
						{@const rank = volumeRank + 1}

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
								<Icon src={icon} alt={name} />
							</div>
							<span class="ml-2 text-gecko-white">{name}</span>
							<span class="ml-1 text-gecko-gray">{assetId.toUpperCase()}</span>
						</span>
					</Table.Cell>

					<!-- Mid price -->
					<Table.Cell class="w-26">
						<Numeric
							value={asset.medianMidPx}
							format="numeric"
							currency={quote ?? "USD"}
							class="text-gecko-white"
						/>
					</Table.Cell>

					<!-- Mid price change -->
					<Table.Cell class="w-20">
						<Numeric value={asset.medianMidPxChange * 100} format="numeric" change percentage />
					</Table.Cell>

					<!-- Volume -->
					<Table.Cell class="w-20">
						<Numeric
							value={asset.volume}
							format="currency"
							currency="USD"
							class="text-gecko-white"
						/>
					</Table.Cell>

					<!-- Volume change -->
					<Table.Cell class="w-24">
						<Numeric value={asset.volumeChange * 100} format="numeric" change percentage />
					</Table.Cell>

					<!-- Class -->
					<Table.Cell class="w-28">
						<span class="font-mono uppercase">{asset.category}</span>
					</Table.Cell>

					<!-- Venues -->
					<Table.Cell class="w-36">
						<span class="flex flex-row items-center gap-0.5">
							{#each asset.marketIds as marketId}
								{@const { venue, namespace } = snapshot.markets[marketId]}
								{@const { name, icon } = (exchanges as ExchangeCfg)[`${venue}:${namespace}`]}

								<Icon src={icon} alt={name} tooltip={name} nested />
							{/each}
						</span>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
