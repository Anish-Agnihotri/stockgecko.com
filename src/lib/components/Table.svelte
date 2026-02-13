<script lang="ts">
	import * as Table from "$shadcn/table";
	import tickers from "$config/tickers.json";
	import Icon from "$components/Icon.svelte";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";

	let { snapshot }: { snapshot: DiffedSnapshot } = $props();
</script>

<div class="overflow-x-auto">
	<Table.Root class="w-full min-w-3xl table-fixed">
		<Table.Header class="bg-gecko-black">
			<Table.Row class="border-b-gecko-shade text-xs font-light">
				<!-- Ranking change -->
				<Table.Head class="w-8 px-0"></Table.Head>
				<!-- Ranking -->
				<Table.Head class="w-8 px-0"></Table.Head>
				<!-- Asset details -->
				<Table.Head class="px-0">Asset</Table.Head>
				<!-- Mid px -->
				<Table.Head class="w-24 px-0">Mid Price</Table.Head>
				<!-- Mid px change -->
				<Table.Head class="w-20 px-0">24h</Table.Head>
				<!-- Volume -->
				<Table.Head class="w-24 px-0">Volume</Table.Head>
				<!-- Volume change -->
				<Table.Head class="w-20 px-0">24h</Table.Head>
				<!-- Venues -->
				<Table.Head class="w-30 px-0">Venues</Table.Head>
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#each snapshot.index.assetsByVolume as { asset, previousIndex }, i}
				{@const assetData = snapshot.assets[asset]}
				{@const assetMetadata = tickers.perps[assetData.category][asset].meta}

				<Table.Row
					class="h-10 border-b-gecko-shade text-xs transition-none hover:bg-gecko-black-hover"
				>
					<!-- Ranking change -->
					<Table.Cell class="w-8 px-0 text-center align-middle">
						<Numeric value={previousIndex ? previousIndex - i : 0} change />
					</Table.Cell>

					<!-- Current ranking -->
					<Table.Cell class="w-8 px-0 text-center align-middle"
						><Numeric value={i + 1} /></Table.Cell
					>

					<!-- Asset -->
					<Table.Cell class="pr-0 pl-2 text-left align-middle">
						<span class="flex items-center">
							<Icon src={assetMetadata.icon} alt={assetMetadata.name} />
							<span class="ml-2 text-gecko-white">{assetMetadata.name}</span>
							<span class="ml-1 text-gecko-gray">{asset.toUpperCase()}</span>
						</span>
					</Table.Cell>

					<!-- Mid price -->
					<Table.Cell class="w-24 px-0 text-left align-middle"
						><Numeric
							value={assetData.medianMidPx}
							format="numeric"
							dollar
							class="text-gecko-white"
						/></Table.Cell
					>

					<!-- Mid price change -->
					<Table.Cell class="w-20 px-0 text-left align-middle">
						<Numeric value={assetData.medianMidPxChange * 100} format="numeric" change percentage />
					</Table.Cell>

					<!-- Volume -->
					<Table.Cell class="w-24 px-0 text-left align-middle">
						<Numeric value={assetData.volume} format="currency" dollar class="text-gecko-white" />
					</Table.Cell>

					<!-- Volume change -->
					<Table.Cell class="w-20 px-0 text-left align-middle">
						<Numeric value={assetData.volumeChange * 100} format="numeric" change percentage />
					</Table.Cell>

					<!-- Venues -->
					<Table.Cell class="w-30 px-0 text-left align-middle">
						<span class="flex flex-row items-center space-x-0.5">
							{#each assetData.marketIds as marketId}
								{@const market = snapshot.markets[marketId]}
								{@const venueMetadata = exchanges[`${market.venue}:${market.namespace}`]}

								<Icon
									src={venueMetadata.icon}
									alt={venueMetadata.name}
									nested={true}
									tooltip={venueMetadata.name}
								/>
							{/each}
						</span>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
