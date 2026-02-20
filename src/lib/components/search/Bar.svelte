<script lang="ts">
	import { onMount } from "svelte";
	import * as Dialog from "$shadcn/dialog";
	import * as Drawer from "$shadcn/drawer";
	import { MediaQuery } from "svelte/reactivity";
	import Command from "$components/search/Command.svelte";

	// Kick to Vaul on small displays
	const isDesktop = new MediaQuery("(min-width: 1024px)");

	// Dialog/drawer open state
	let open: boolean = $state(false);

	// Proxy input element to force-cpature focus
	let proxyInput: HTMLInputElement;

	onMount(() => {
		// Handle keyboard shortcut
		function onKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				open = !open;
			}
		}

		// Track key event
		document.addEventListener("keydown", onKeydown);
		return () => document.removeEventListener("keydown", onKeydown);
	});

	$effect(() => {
		if (!open) return;

		// Force lock scroll on dialog/drawer open
		window.scrollTo(0, 0);
		const lock = () => window.scrollTo(0, 0);
		window.addEventListener("scroll", lock);

		return () => {
			window.removeEventListener("scroll", lock);

			// Force dismiss iOS keyboard
			const active = document.activeElement as HTMLElement | null;
			active?.setAttribute("readonly", "readonly");
			active?.blur();
			setTimeout(() => active?.removeAttribute("readonly"), 100);
		};
	});

	// Close modal fn
	const close = () => (open = false);
</script>

<!-- Hidden proxy input to capture iOS keyboard -->
<input
	bind:this={proxyInput}
	class="pointer-events-none fixed -top-20 left-0 opacity-0"
	tabindex="-1"
	aria-hidden="true"
/>

<!-- Search trigger button -->
<button
	onclick={() => {
		// Synchronously capture focus to "reserve" keyboard (esp. on iOS)
		proxyInput?.focus();
		// Then, toggle opening drawer/dialog
		open = true;
	}}
	aria-label="Search"
	class="group flex h-8 w-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-gecko-shade bg-gecko-black px-3 text-xs text-gecko-gray hover:border-gecko-gray/30 hover:bg-gecko-black-hover lg:w-56"
>
	<!-- Search icon -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 640 640"
		class="h-3.5 w-3.5 shrink-0 opacity-50"
		><path
			fill="currentColor"
			d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"
		/></svg
	>

	<!-- Search text; pedantic but the `h-3.75` is slightly more visually-aligned -->
	<span class="hidden h-3.75 flex-1 text-left opacity-50 lg:inline-flex">Search...</span>

	<kbd
		class="pointer-events-none hidden gap-[1.5px] rounded border border-gecko-shade px-1 font-mono text-xs text-gecko-gray/50 group-hover:border-gecko-muted lg:inline-flex"
	>
		<span class="translate-y-[0.5px]">⌘</span>
		<span>K</span>
	</kbd>
</button>

{#if isDesktop.current}
	<!-- Desktop: Dialog + Command -->
	<Dialog.Root bind:open>
		<Dialog.Content class="border-3 border-gecko-shade bg-black p-0 **:data-dialog-close:hidden">
			<Command {close} />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<!-- Mobile: Drawer + Command -->
	<Drawer.Root bind:open>
		<Drawer.Content
			class="top-12 mt-0! h-[calc(100%-48px)]! max-h-[calc(100%-48px)]! rounded-none! border-gecko-shade bg-black [&>div:first-child]:hidden"
		>
			<Command {close} />
		</Drawer.Content>
	</Drawer.Root>
{/if}
