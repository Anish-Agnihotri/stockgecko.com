<!-- @dev: this animation code is all written by Opus 4.6 -->
<script module lang="ts">
	// Shared `ResizeObserver` rather than one per rendered `IconScroll`
	// Lazily initialized to avoid SSR where ResizeObserver doesn't exist
	let sharedObserver: ResizeObserver;
	const resizeCallbacks = new Map<Element, () => void>();

	// Lazily-initialize `ResizeObserver` in browser
	function getObserver() {
		return (sharedObserver ??= new ResizeObserver((entries) => {
			for (const entry of entries) {
				resizeCallbacks.get(entry.target)?.();
			}
		}));
	}
</script>

<script lang="ts">
	import type { Snippet } from "svelte";

	// Child icons to wrap
	let { children }: { children: Snippet } = $props();

	// Scroller element ref
	let scrollerRef: HTMLDivElement | undefined = $state();

	// Local layout state
	let measured = $state(false);
	let overflows = $state(false);
	let scrollLeft = $state(0);
	let maxScroll = $state(0);

	// Current interaction state
	let isHovered = $state(false);
	let isAnimated = $state(false);

	// Do items overflow when collapsed?
	// Used to prevent flickering animations
	let collapsedOverflow = $state(false);

	// Scroll setup
	const SCROLL_SPEED = 1.5;
	const TRANSITION_MS = 220;
	let scrollDirection: -1 | 0 | 1 = $state(0);
	let frameId: number | null = null;

	/**
	 * Checks if `scrollerRef` content overflows; updates scroll bounds
	 * @dev Called on `mount`, `resize`, `hover`
	 */
	function checkOverflow() {
		if (!scrollerRef) return;

		// Update state
		overflows = scrollerRef.scrollWidth > scrollerRef.clientWidth;
		maxScroll = scrollerRef.scrollWidth - scrollerRef.clientWidth;
		scrollLeft = scrollerRef.scrollLeft;
		measured = true;
	}

	/**
	 * Start a requestAnimationFrame loop that scrolls the scrollerRef
	 * in the given direction. Called when hovering a scroll zone.
	 */
	/**
	 * Start a `requestAnimationFrame` loop that scrolls the `scrollerRef` zone
	 * in a given direction. Called when hovering a scroll zone
	 * @param {-1 | 1} direction to scroll
	 */
	function startScroll(direction: -1 | 1) {
		scrollDirection = direction;

		// If no raf reference, return
		if (frameId) return;

		// Animation tick
		function tick() {
			if (!scrollerRef || scrollDirection === 0) {
				frameId = null;
				return;
			}
			scrollerRef.scrollLeft += scrollDirection * SCROLL_SPEED;
			scrollLeft = scrollerRef.scrollLeft;
			frameId = requestAnimationFrame(tick);
		}
		frameId = requestAnimationFrame(tick);
	}

	/**
	 * Stop any scroll animation activity
	 */
	function stopScroll() {
		scrollDirection = 0;
		if (frameId) {
			cancelAnimationFrame(frameId);
			frameId = null;
		}
	}

	/**
	 * Gradient mask that fades out overflowing content.
	 *
	 * - No overflow: no mask
	 * - Transitioning: use the mask that matches the collapsed resting state
	 *   (gradient if collapsed state overflows, "none" if it doesn't) to
	 *   prevent a flicker when the transition ends.
	 * - Scrolled to start: fade right edge
	 * - Scrolled to end: fade left edge
	 * - Mid-scroll: fade both edges
	 */
	const maskImage = $derived.by(() => {
		if (!overflows) return "none";
		if (isAnimated) {
			return collapsedOverflow ? "linear-gradient(to right, black 70%, transparent 100%)" : "none";
		}
		const atStart = scrollLeft <= 1;
		const atEnd = scrollLeft >= maxScroll - 1;
		if (atStart) return "linear-gradient(to right, black 70%, transparent 100%)";
		if (atEnd) return "linear-gradient(to left, black 70%, transparent 100%)";
		return "linear-gradient(to right, transparent 0%, black 15%, black 70%, transparent 100%)";
	});

	// Only show scroll zones when there's content to scroll in that direction
	const showLeft = $derived(isHovered && overflows && scrollLeft > 1);
	const showRight = $derived(isHovered && overflows && scrollLeft < maxScroll - 1);

	// Measure on mount and whenever the scrollerRef resizes
	$effect(() => {
		if (!scrollerRef) return;

		// Initial check
		checkOverflow();

		// Assign descending z-index to children so earlier icons stack on top
		// of later ones when collapsed with negative margins.
		const kids = scrollerRef.children;
		for (let i = 0; i < kids.length; i++) {
			// Apply z-index
			(kids[i] as HTMLElement).style.zIndex = String(kids.length - i);
		}

		// Register with shared observer
		const obs = getObserver();
		resizeCallbacks.set(scrollerRef, checkOverflow);
		obs.observe(scrollerRef);
		return () => {
			obs.unobserve(scrollerRef!);
			resizeCallbacks.delete(scrollerRef!);
		};
	});
</script>

<div
	role="group"
	class="relative w-full {measured ? 'opacity-100' : 'opacity-0'}"
	onmouseenter={() => {
		collapsedOverflow = overflows;
		isHovered = true;
		requestAnimationFrame(checkOverflow);
		setTimeout(checkOverflow, TRANSITION_MS);
	}}
	onmouseleave={() => {
		isHovered = false;
		isAnimated = true;
		stopScroll();

		// Reset scroll to start so collapsed view shows from the beginning
		if (scrollerRef) {
			scrollerRef.scrollLeft = 0;
			scrollLeft = 0;
		}

		// After collapse transition completes, clear flag and remeasure
		setTimeout(() => {
			isAnimated = false;
			checkOverflow();
		}, TRANSITION_MS);
	}}
>
	<!-- Left scroll zone: invisible strip that auto-scrolls left on hover -->
	{#if showLeft}
		<div
			role="presentation"
			class="absolute top-0 left-0 z-10 h-full w-4 cursor-w-resize"
			onmouseenter={() => startScroll(-1)}
			onmouseleave={stopScroll}
		></div>
	{/if}

	<!-- Right scroll zone: invisible strip that auto-scrolls right on hover -->
	{#if showRight}
		<div
			role="presentation"
			class="absolute top-0 right-0 z-10 h-full w-4 cursor-e-resize"
			onmouseenter={() => startScroll(1)}
			onmouseleave={stopScroll}
		></div>
	{/if}

	<!-- Inner scroll scrollerRef -->
	<div
		bind:this={scrollerRef}
		onscroll={() => {
			if (scrollerRef) scrollLeft = scrollerRef.scrollLeft;
		}}
		class="flex items-center pr-1 transition-[gap] duration-200 ease-out [scrollbar-width:none] *:relative *:shrink-0 *:transition-[margin] *:duration-200 *:ease-out [&::-webkit-scrollbar]:hidden {isHovered
			? 'gap-0.5'
			: '-space-x-1.5'} {isHovered && overflows ? 'overflow-x-auto' : 'overflow-x-hidden'}"
		style:mask-image={maskImage}
		style:-webkit-mask-image={maskImage}
	>
		{@render children()}
	</div>
</div>
