<script lang="ts">
	let { class: extraClass }: { class?: string } = $props();
</script>

<header
	class="sticky top-0 z-30 order-2 flex h-12 flex-row items-center justify-center border-b border-b-gecko-shade lg:h-16 {extraClass} bg-black"
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
</header>
