<script lang="ts">
	import Table from "$components/Table.svelte";

	let { data } = $props();
</script>

<main class="flex min-h-[calc(100dvh-108px)] flex-col">
	<!-- Hero -->
	<div class="flex min-h-96 flex-row justify-center border-b border-b-gecko-shade">
		<div class="flex max-w-7xl flex-1 flex-col border-x border-x-gecko-shade px-4">
			<span>Hero</span>
		</div>
	</div>

	<!-- Tabular data -->
	<section class="flex flex-1 flex-row justify-center">
		<div class="flex max-w-7xl flex-1 border-x border-x-gecko-shade">
			<Table snapshot={data.snapshot} />
		</div>
	</section>
</main>
