<script lang="ts" generics="K extends string">
	import type { Snippet } from "svelte";
	import * as Table from "$shadcn/table";
	import { browser } from "$app/environment";
	import type { Column } from "$components/table/table.svelte";
	import { createWindowVirtualizer } from "@tanstack/svelte-virtual";

	// Collect data table properties
	type Props = {
		// Columns
		columns: Column<K>[];
		// Sort setup
		sortKey: K;
		sortDirection: 1 | -1;
		onSort: (key: K) => void;
		// Table width handler
		minWidth: number;
		// Virtualized row snippet to render
		row: Snippet<[index: number]>;
		// Number of total rows
		rowCount: number;
		// Row size in pixels
		rowSizePx?: number;
		// Number of rows to overscan during virtualization
		overscan?: number;
	};

	// Collect props
	let {
		columns,
		sortKey,
		sortDirection,
		onSort,
		minWidth,
		row,
		rowCount,
		rowSizePx = 40,
		overscan = 30
	}: Props = $props();

	// Dynamically add table bottom border if page does not scroll
	let showBorder = $state(true);
	$effect(() => {
		const check = () => {
			showBorder = document.documentElement.scrollHeight <= window.innerHeight;
		};

		// Initial check + keep track
		check();
		const observer = new ResizeObserver(check);
		observer.observe(document.body);
		return () => observer.disconnect();
	});

	// Setup virtualizer
	const virtualizer = $derived(
		createWindowVirtualizer({
			get count() {
				return rowCount;
			},
			get estimateSize() {
				return () => rowSizePx;
			},
			get overscan() {
				return overscan;
			},
			// Prevent 0 height table flashing on page first load
			initialRect: { width: 0, height: browser ? window.innerHeight : 800 }
		})
	);
</script>

<div class="flex w-full flex-col {showBorder ? 'border-b border-b-gecko-shade ' : ''}">
	<!-- Scrollable handler on mobile (defaults to `lg` breakpoint) -->
	<div
		class="flex items-center justify-end border-b border-b-gecko-shade bg-gecko-black px-2 py-0.5 font-mono text-xs text-gecko-gray/50 uppercase lg:hidden"
	>
		<span>Scrollable</span>
		<span class="ml-1 -translate-y-px text-lg">↔</span>
	</div>

	<!-- Render table (responsive to min width) -->
	<Table.Root class="w-full table-fixed" style="min-width:{minWidth}px;">
		<!-- Table header a la columns -->
		<Table.Header class="bg-gecko-black">
			<Table.Row class="border-b-gecko-shade text-xs font-light [&_th]:px-0">
				{#each columns as { width, title, sortKey: key }}
					<Table.Head
						class="{width ? `w-${width}` : ''}{key ? ' cursor-pointer select-none' : ''}"
						onclick={key ? () => onSort(key) : undefined}
						>{title} {sortKey === key ? (sortDirection === 1 ? "↑" : "↓") : ""}</Table.Head
					>
				{/each}
			</Table.Row>
		</Table.Header>

		<!-- Injected table children -->
		<Table.Body>
			{@const items = $virtualizer.getVirtualItems()}
			{@const totalHeight = $virtualizer.getTotalSize()}
			{@const startOffset =
				items.length > 0 ? items[0].start - $virtualizer.options.scrollMargin : 0}
			{@const endOffset = items.length > 0 ? totalHeight - items[items.length - 1].end : 0}

			<!-- Render virtualized first row (padding)-->
			{#if startOffset > 0}
				<tr style="height:{startOffset}px"></tr>
			{/if}

			<!-- Render injected rows -->
			{#each items as virtualRow (virtualRow.index)}
				{@render row(virtualRow.index)}
			{/each}

			<!-- Render virtualized last row (padding) -->
			{#if endOffset > 0}
				<tr style="height:{endOffset}px"></tr>
			{/if}
		</Table.Body>
	</Table.Root>
</div>
