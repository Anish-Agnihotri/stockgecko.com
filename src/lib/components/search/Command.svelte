<script lang="ts">
	import { tick } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import Icon from "$components/Icon.svelte";
	import * as Command from "$shadcn/command";
	import tickers from "$config/tickers.json";
	import exchanges from "$config/exchanges.json";
	import Numeric from "$components/Numeric.svelte";
	import type { ExchangeCfg, TickerCfg } from "$lib/types";

	// Collect menu close fn
	let { close }: { close: () => void } = $props();

	// Steal focus from hidden proxy input to search bar
	let inputEl: HTMLElement | undefined = $state();
	$effect(() => {
		if (inputEl) {
			tick().then(() => inputEl?.focus());
		}
		return () => inputEl?.blur();
	});

	/**
	 * Handle element selection
	 * @param {string} path to navigate to
	 */
	function onSelect(path: string) {
		// Goto relevant page
		goto(path);
		// Drop any input focus
		inputEl?.blur();
		// Close modal
		close();
	}

	// Unified styling
	const groupClass =
		"p-0 **:data-command-group-heading:border-b **:data-command-group-heading:border-b-gecko-shade **:data-command-group-heading:bg-gecko-black **:data-command-group-heading:px-3";
	const itemClass =
		"flex h-10 cursor-pointer flex-row justify-between rounded-none border-b border-b-gecko-shade px-3 text-xs font-light aria-selected:bg-gecko-black-hover";
</script>

<Command.Root
	class="flex flex-col rounded-none **:data-[slot=command-input-wrapper]:h-10 **:data-[slot=command-input-wrapper]:border-gecko-shade [&_svg:first-child]:hidden"
>
	<!-- Input field -->
	<Command.Input placeholder="Search assets, categories, venues..." ref={inputEl} autofocus />

	<!-- Items list -->
	<Command.List class="max-h-full lg:max-h-80 lg:min-h-80">
		<!-- No items found -->
		<Command.Empty class="text-gecko-gray/50">No results found.</Command.Empty>

		<!-- Iterate asset groups -->
		{#each Object.entries(page.data.assets) as [category, assets]}
			<Command.Group heading={category.toUpperCase()} class={groupClass}>
				<!-- Iterate assets -->
				{#each assets as { id, meta, volume }}
					<Command.Item
						onSelect={() => onSelect(`/asset/${id}`)}
						value="{meta.name} {id} {category}"
						class={itemClass}
					>
						<div class="flex items-center" inert>
							<Icon src={meta.icon} alt={meta.name} />
							<h5 class="ml-2 text-gecko-white">{meta.name}</h5>
							<span class="ml-1 text-gecko-gray">({id.toUpperCase()})</span>
						</div>

						{#if volume.value}
							<div class="flex items-center [&_span]:w-22 [&_span]:text-right">
								<div>
									<span class="font-mono text-gecko-muted">VOL:</span>
									<Numeric
										value={volume.value}
										currency="USD"
										format="currency"
										class="text-white"
									/>
								</div>
								<Numeric
									value={volume.change * 100}
									format="numeric"
									class="ml-1"
									change
									percentage
								/>
							</div>
						{/if}
					</Command.Item>
				{/each}
			</Command.Group>
		{/each}

		<!-- Iterate venues -->
		<Command.Group heading="VENUES" class={groupClass}>
			{#each Object.entries(exchanges as ExchangeCfg) as [id, meta]}
				{@const [venue, namespace] = id.split(":")}

				<Command.Item
					onSelect={() => onSelect(`/venue/${venue}${namespace && `/dex/${namespace}`}`)}
					value="{meta.name} {id}"
					class={itemClass}
				>
					<div class="flex items-center" inert>
						<Icon src={meta.icon} alt={meta.name} nested />
						<h5 class="ml-2 text-gecko-white">{meta.name}</h5>
					</div>

					<div class="flex items-center">
						<span class="ml-1 font-mono text-gecko-gray uppercase"
							>{namespace ? `${venue}:${namespace}` : venue}</span
						>
					</div>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Root>
