<script lang="ts">
	import { getContext } from "svelte";
	import * as Table from "$shadcn/table";
	import tickers from "$config/tickers.json";
	import Icon from "$components/Icon.svelte";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());

	// Weaker types for ease (indexing configs)
	type Meta = { name: string; icon: string[] };
	type ExchangeCfg = Record<string, Meta>;
	type TickerCfg = Record<string, Record<string, { meta: Meta }>>;
</script>

<Table.Root class="w-full min-w-3xl table-fixed">
	<!-- Ranking chg., ranking, asset, midPx, midPx change, vol, vol change, venues -->
	<Table.Header class="bg-gecko-black">
		<Table.Row class="border-b-gecko-shade text-xs font-light [&_th]:px-0">
			<Table.Head class="w-10"></Table.Head>
			<Table.Head class="w-6"></Table.Head>
			<Table.Head>Asset</Table.Head>
			<Table.Head class="w-24">Mid Price</Table.Head>
			<Table.Head class="w-24">24h</Table.Head>
			<Table.Head class="w-24">Volume</Table.Head>
			<Table.Head class="w-24">24h</Table.Head>
			<Table.Head class="w-30">Venues</Table.Head>
		</Table.Row>
	</Table.Header>

	<Table.Body>
		{#each snapshot.index.assetsByVolume as { asset: assetId, previousIndex }, i}
			<!-- Collect asset data + metadata -->
			{@const asset = snapshot.assets[assetId]}
			{@const { name, icon } = (tickers.perps as TickerCfg)[asset.category][assetId].meta}
			{@const rankDelta = previousIndex != null ? previousIndex - i : 0}

			<Table.Row
				class="h-10 border-b-gecko-shade text-xs transition-none hover:bg-gecko-black-hover [&_td]:px-0 [&_td]:text-left [&_td]:align-middle"
			>
				<!-- Ranking change -->
				<Table.Cell class="w-10 text-center!"><Numeric value={rankDelta} change /></Table.Cell>

				<!-- Current ranking -->
				<Table.Cell class="w-6"><Numeric value={i + 1} /></Table.Cell>

				<!-- Asset -->
				<Table.Cell class="pr-0 pl-2">
					<span class="flex items-center">
						<Icon src={icon} alt={name} />
						<span class="ml-2 text-gecko-white">{name}</span>
						<span class="ml-1 text-gecko-gray">{assetId.toUpperCase()}</span>
					</span>
				</Table.Cell>

				<!-- Mid price -->
				<Table.Cell class="w-24">
					<Numeric value={asset.medianMidPx} format="numeric" dollar class="text-gecko-white" />
				</Table.Cell>

				<!-- Mid price change -->
				<Table.Cell class="w-20">
					<Numeric value={asset.medianMidPxChange * 100} format="numeric" change percentage />
				</Table.Cell>

				<!-- Volume -->
				<Table.Cell class="w-24">
					<Numeric value={asset.volume} format="currency" dollar class="text-gecko-white" />
				</Table.Cell>

				<!-- Volume change -->
				<Table.Cell class="w-20">
					<Numeric value={asset.volumeChange * 100} format="numeric" change percentage />
				</Table.Cell>

				<!-- Venues -->
				<Table.Cell class="w-30">
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
