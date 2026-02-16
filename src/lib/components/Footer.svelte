<script lang="ts">
	let { class: extraClass }: { class?: string } = $props();
</script>

<footer class="flex flex-col bg-black {extraClass}">
	<section class="flex items-center justify-center border-t border-t-gecko-shade">
		<div
			class="flex w-full max-w-7xl flex-col border-gecko-shade px-4 py-10 text-center lg:border-x"
		>
			<!-- Logo -->
			<div class="flex flex-row lg:justify-center">
				<a href="/">
					<!-- TODO: change gecko symbol: technically copyright is on old gecko but CoinGecko are good people and we're not trying to cause problems -->
					<img src="/assets/brand/logo.svg" alt="StockGecko logo" class="h-6 lg:h-10" />
				</a>
			</div>

			<!-- Terms -->
			<div class="pt-5">
				<p class="text-left text-xs text-gecko-muted lg:text-center">
					StockGecko is an independent, <a
						href="https://github.com/anish-agnihotri/stockgecko.com"
						target="_blank"
						rel="noopener noreferrer"
						class="text-gecko-white/30 hover:text-gecko-white/50">open-source</a
					>
					project, and is not affiliated with, endorsed by, or connected to CoinGecko in any way. All
					data presented on this site is provided on an as-is basis for information purposes only and
					should not be construed as financial advice. While we strive for accuracy, StockGecko makes
					no warranties or guarantees regarding the completeness, reliability, or timelines of any data
					displayed. Use of this site and its data is entirely at your own risk.
				</p>
			</div>
		</div>
	</section>
</footer>
