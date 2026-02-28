<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import DitherHero from "$components/DitherHero.svelte";

	/**
	 * Return home
	 */
	const home = () => goto("/", { replaceState: true });

	// 10 seconds in the future
	const future = +new Date() + 10_000_000;

	// Trigger home redirect automatically after 10s
	onMount(() => {
		const id = setTimeout(home, future - +new Date());
		return () => clearTimeout(id);
	});
</script>

<DitherHero class="flex flex-1">
	<div class="flex flex-1 flex-col items-center justify-center gap-2 px-4">
		<h1 class="text-9xl text-gecko-white">{page.status}</h1>
		<p class="max-w-md text-center text-sm lg:text-base">
			We're not sure how you got here, but we'll automatically redirect you <a
				href="/"
				class="underline hover:text-gecko-white">home</a
			> in 10 seconds.
		</p>
	</div>
</DitherHero>
