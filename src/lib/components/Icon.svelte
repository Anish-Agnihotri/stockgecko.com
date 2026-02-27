<!--
A few types of icons, closely inspired by Lighter:
  - Single icon (e.g., asset icon)
  - Double icon (e.g., currency pairs)
  - Nested icon (e.g., namespaced exchange)
Size should be sane default
-->
<script lang="ts">
	let {
		src,
		alt,
		nested = false,
		class: extraClass = ""
	}: { src: string[]; alt: string; nested?: boolean; class?: string } = $props();
</script>

<!-- Single icon -->
{#if src.length == 1}
	<div class={extraClass}>
		<img src={src[0]} {alt} class="size-5 rounded-full" loading="lazy" />
	</div>
{/if}

<!-- Pair icon (non-nested) -->
{#if src.length == 2 && !nested}
	<div class="{extraClass} relative size-7">
		<img
			src={src[0]}
			alt={`${alt} pair 1`}
			class="absolute bottom-0.5 left-0.5 z-10 size-3.75 rounded-full"
			loading="lazy"
		/>
		<img
			src={src[1]}
			alt={`${alt} pair 2`}
			class="absolute top-0.5 right-0.5 z-0 size-3.75 rounded-full"
			loading="lazy"
		/>
	</div>
{/if}

<!-- Exchange icon (nested) -->
{#if src.length == 2 && nested}
	<div class="{extraClass} relative size-5">
		<img
			src={src[1]}
			{alt}
			class="absolute top-0 left-px z-0 size-4.25 rounded-full"
			loading="lazy"
		/>
		<img
			src={src[0]}
			{alt}
			class="absolute right-0 bottom-0 z-10 size-2.5 rounded-full"
			loading="lazy"
		/>
	</div>
{/if}
