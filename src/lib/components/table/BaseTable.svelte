<script lang="ts" generics="K extends string">
	import type { Snippet } from "svelte";
	import * as Table from "$shadcn/table";
	import type { Column } from "$components/table/table.svelte";

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
		// Rows
		children: Snippet;
	};

	// Collect props
	let { columns, sortKey, sortDirection, onSort, minWidth, children }: Props = $props();
</script>

<div class="flex w-full flex-col">
	<!-- Scrollable handler on mobile (defaults to `lg` breakpoint) -->
	<div
		class="flex items-center justify-end border-b border-b-gecko-shade bg-gecko-black px-2 py-0.5 font-mono text-xs text-gecko-gray/30 uppercase lg:hidden"
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
			{@render children()}
		</Table.Body>
	</Table.Root>
</div>
