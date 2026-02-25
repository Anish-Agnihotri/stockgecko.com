<script lang="ts">
	import { page } from "$app/state";
	import SearchBar from "./search/Bar.svelte";
	let { class: extraClass }: { class?: string } = $props();

	// A little premature for two entries but it makes
	// active page detection a lot easier.
	const nav: { title: string; path: string }[] = [
		{ title: "Venues", path: "/venues" },
		{ title: "Markets", path: "/markets" }
	];
</script>

<header
	class="sticky top-0 z-30 order-2 flex h-12 flex-row items-center justify-center border-b border-b-gecko-shade lg:h-16 {extraClass} bg-black"
>
	<div
		class="flex h-full w-full max-w-7xl items-center justify-between border-gecko-shade px-4 lg:border-x"
	>
		<!-- Logo -->
		<div>
			<a href="/">
				<!-- Mobile-friendly variant with explicit w/h -->
				<img
					src="/assets/brand/logo.svg"
					alt="StockGecko logo"
					class="hidden lg:inline"
					height="32px"
					width="160px"
				/>
				<img
					src="/assets/brand/logo.svg"
					alt="StockGecko logo"
					class="lg:hidden"
					height="24px"
					width="120px"
				/>
			</a>
		</div>

		<!-- Nav, search -->
		<div class="flex flex-row items-center gap-4">
			<!-- Nav -->
			<div>
				<ul class="flex gap-4 text-[13px] font-medium lg:text-base [&_li_a]:hover:text-gecko-white">
					{#each nav as { title, path }}
						{@const activeClass = path === page.route.id ? "text-gecko-white" : ""}

						<li><a href={path} class={activeClass}>{title}</a></li>
					{/each}
				</ul>
			</div>

			<!-- Search -->
			<SearchBar />
		</div>
	</div>
</header>
