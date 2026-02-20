<script lang="ts">
	import { chunks } from "$lib/utils";
	import { goto } from "$app/navigation";
	import Grid from "$components/Grid.svelte";
	import Meta from "$components/Meta.svelte";
	import type { PageProps } from "../$types";
	import exchanges from "$config/exchanges.json";
	import Icon from "$components/Icon.svelte";
	import Numeric from "$components/Numeric.svelte";

	let { data }: PageProps = $props();

	// Venue count
	const venueCount = $derived(data.snapshot.aggregates.exchangeStats.length);

	// Setup venue with additional metadata
	const venues = $derived(
		data.snapshot.aggregates.exchangeStats.map((x) => ({
			...x,
			...exchanges[x.id as keyof typeof exchanges]
		}))
	);

	// Setup chunks for rendered rows
	const rows = $derived([...chunks(venues, 3)]);
</script>

<Meta title="StockGecko | Venues" />

<div class="flex flex-1 flex-col">
	<!-- Landing header (title, description) -->
	<div>
		<Grid bottom={false}>
			<div class="flex flex-1 flex-col gap-0.5 px-4 py-6">
				<h1 class="text-lg text-gecko-white md:text-xl">Venues</h1>
				<p class="text-sm text-gecko-gray/75">Tracking {venueCount} venues and counting.</p>
			</div>
		</Grid>
	</div>

	<!-- Venue list -->
	<div class="flex flex-1 flex-col">
		{#each rows as row, i}
			<Grid
				bottom={i === rows.length - 1}
				class={i === rows.length - 1 ? "[&>div:last-child]:border-b-0" : ""}
			>
				{#each row as venue}
					<div
						role="button"
						tabindex="0"
						aria-label={venue.name}
						onclick={() => {
							const [v, dex] = venue.id.split(":");
							goto(`/venue/${v}${dex ? `/dex/${dex}` : ""}`);
						}}
						onkeydown={(e) => {
							// Simple handling to not have to deal w/ button styling in `Grid`
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.currentTarget.click();
							}
						}}
						class="relative min-h-20 flex-1 cursor-pointer hover:bg-gecko-black-hover md:max-w-[calc(33.33%-20px)]"
					>
						<div class="flex h-full flex-row items-center">
							<div class="flex items-center px-4">
								<Icon
									src={venue.icon}
									alt={venue.name}
									nested
									class="{venue.icon.length > 1
										? 'size-11.5'
										: ''} [&_img]:first:size-9! [&_img]:last:size-6"
								/>
							</div>

							<div class="flex flex-col">
								<!-- Venue meta -->
								<h3 class="text-white">{venue.name}</h3>

								<!-- Venue stats -->
								<div
									class="flex items-center gap-2 pt-0.5 text-xs md:flex-col md:items-start md:gap-0 lg:flex-row lg:items-center lg:gap-2 [&_div]:flex [&_div]:items-center [&_div]:gap-1"
								>
									<div>
										<h5>OI:</h5>
										<Numeric
											value={venue.oi}
											currency="USD"
											format="currency"
											class="text-gecko-white"
										/>
									</div>
									<div>
										<h5>Volume:</h5>
										<Numeric
											value={venue.volume}
											currency="USD"
											format="currency"
											class="text-gecko-white"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</Grid>
		{/each}
	</div>
</div>
