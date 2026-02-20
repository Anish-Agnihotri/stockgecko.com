<script lang="ts">
	import Grid from "$components/Grid.svelte";
	import Meta from "$components/Meta.svelte";
</script>

<Meta title="StockGecko | Venues" />

<div class="flex flex-1 flex-col">
	<!-- Landing header (title, description) -->
	<div>
		<Grid>
			<div class="flex flex-1 flex-col gap-0.5 px-4 py-6">
				<h1 class="text-lg text-gecko-white md:text-xl">Venues</h1>
				<p class="text-sm text-gecko-gray/75">OI-weighted treemap across venues.</p>
			</div>
		</Grid>
	</div>

	<!-- Venue treemap -->
	<!-- FIXME: double border at bottom on mobile -->
	<div
		class="flex flex-1 items-center justify-center border-t-gecko-shade text-xs text-gecko-muted md:border-t"
	>
		<span>TODO</span>
	</div>
</div>
