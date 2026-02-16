<script lang="ts">
	import AssetTable from "$components/AssetTable.svelte";
	import DitherHero from "$components/DitherHero.svelte";
</script>

<!-- Hero -->
<div class="flex min-h-96 flex-row justify-center border-b border-b-gecko-shade">
	<DitherHero class="flex flex-1 flex-col">
		<!-- CTA -->
		<div class="flex flex-1 items-center justify-center">
			<div class="flex max-w-lg flex-col items-center justify-center px-8 text-center lg:px-4">
				<h1 class="text-3xl font-bold text-gecko-white sm:text-5xl">TradFi lives on crypto.</h1>
				<p class="pt-2 text-sm">
					<!-- FIXME: need number here -->
					<span>$123,456,789,000</span> and counting of real-world assets have made their way to trading
					entirely on-chain, 24/7.
				</p>
			</div>
		</div>
	</DitherHero>
</div>

<!-- Tabular data -->
<section class="flex max-w-full flex-1 flex-row justify-center">
	<AssetTable />
</section>
