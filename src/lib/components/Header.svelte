<script lang="ts">
	import { getContext } from "svelte";
	import Numeric from "$components/Numeric.svelte";
	import type { DiffedSnapshot } from "$lib/transform";

	// Collect data snapshot
	const getSnapshot = getContext<() => DiffedSnapshot>("snapshot");
	const snapshot = $derived(getSnapshot());
	const assets = Object.values(snapshot.assets);
	const markets = Object.values(snapshot.markets);

	// Compute statistics
	// FIXME: these are common enough, we should do them in E(T)L
	const volume = assets.reduce((acc, asset) => acc + asset.volume, 0);
	const prevVolume = assets.reduce(
		(acc, asset) =>
			acc + (asset.volumeChange ? asset.volume / (1 + asset.volumeChange) : asset.volume),
		0
	);
	const volumeChange = (volume - prevVolume) / prevVolume;
</script>

<header class="flex flex-col bg-black lg:flex-col-reverse">
	<!-- Main header -->
	<section
		class="flex h-12 flex-row items-center justify-center border-b border-b-gecko-shade lg:h-16"
	>
		<div
			class="flex h-full w-full max-w-7xl items-center justify-between border-x border-gecko-shade px-4"
		>
			<!-- Logo -->
			<div>
				<a href="/">
					<!-- TODO: change gecko symbol: technically copyright is on old gecko but CoinGecko are good people and we're not trying to cause problems -->
					<img src="/assets/brand/logo.svg" alt="StockGecko logo" class="h-6 w-auto lg:h-8" />
				</a>
			</div>

			<!-- Nav, search -->
			<div></div>
		</div>
	</section>

	<!-- Subheader -->
	<section
		class="flex h-8 flex-row items-center justify-center border-b border-gecko-shade lg:h-11"
	>
		<div
			class="flex h-full w-full max-w-7xl items-center justify-between overflow-x-auto border-x border-gecko-shade px-4 text-xs"
		>
			<!-- Statistics -->
			<div class="flex min-w-xl flex-row space-x-4">
				<span>Assets: <Numeric value={assets.length} class="text-gecko-white" /></span>
				<span>Markets: <Numeric value={markets.length} class="text-gecko-white" /></span>
				<span
					>24h Volume: <Numeric
						value={volume}
						format="currency"
						dollar
						class="text-gecko-white"
					/><Numeric
						value={volumeChange * 100}
						format="numeric"
						class="ml-1"
						change
						percentage
					/></span
				>
				<span>Dominance: <span></span></span>
			</div>

			<!-- Source -->
			<div class="hidden lg:inline">
				<a
					href="https://github.com/anish-agnihotri/stockgecko.com"
					target="_blank"
					rel="noopener noreferrer"
					class="font-mono uppercase hover:text-gecko-white">View source on github</a
				>
			</div>
		</div>
	</section>
</header>
