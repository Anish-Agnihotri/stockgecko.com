<script lang="ts">
	import "../app.css";
	import "../shadcn.css";
	import Header from "$components/Header.svelte";
	import Footer from "$components/Footer.svelte";
	import Subheader from "$components/Subheader.svelte";

	let { children } = $props();
</script>

<!-- Setup layout -->
<div class="flex min-h-dvh flex-col">
	<!-- Header -->
	<Header class="order-1 lg:order-2" />

	<!-- Subheader -->
	<Subheader class="order-2 lg:order-1" />

	<!-- Content -->
	<main class="order-3 flex flex-1 flex-row justify-center">
		<div class="flex w-full max-w-7xl flex-1 flex-col border-x-gecko-shade lg:border-x">
			{@render children()}
		</div>
	</main>

	<!-- Footer -->
	<Footer class="order-4" />
</div>
