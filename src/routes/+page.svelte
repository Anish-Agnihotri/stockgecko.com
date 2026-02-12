<script lang="ts">
	import tickers from "$config/tickers.json";
	import exchanges from "$config/exchanges.json";
	import Icon from "$lib/components/Icon.svelte";
</script>

<div class="bg-amber-50 p-10">
	<!-- Icons -->
	<h2 class="text-2xl font-bold">Icons</h2>
	{#each Object.entries(tickers.perps) as [category, assets]}
		<h3 class="mt-4 pt-2 font-semibold">{category.toUpperCase()}</h3>
		<div class="flex flex-row space-x-2">
			{#each Object.entries(assets) as [name, asset]}
				<Icon src={asset.meta.icon} alt={asset.meta.name} />
			{/each}
		</div>
	{/each}

	<h3 class="mt-4 pt-2 font-semibold">EXCHANGES</h3>
	<div class="flex flex-row space-x-2">
		{#each exchanges as exchange}
			<Icon
				src={exchange.meta.icon}
				alt={exchange.meta.name}
				nested={true}
				tooltip={exchange.meta.name}
			/>
		{/each}
	</div>
</div>
