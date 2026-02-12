<!--
A few types of icons, closely inspired by Lighter:
  - Single icon (e.g., asset icon)
  - Double icon (e.g., currency pairs)
  - Nested icon (e.g., namespaced exchange)

1. Size should be sane default
2. If tooltip, should be hoverable and have a custom text tooltip
-->
<script lang="ts">
	import * as Tooltip from "$shadcn/tooltip";

	let {
		src,
		alt,
		nested = false,
		tooltip = ""
	}: { src: string[]; alt: string; nested?: boolean; tooltip: string } = $props();
</script>

<Tooltip.Root>
	<!-- Render hovers only if tooltip content exists -->
	<Tooltip.Trigger
		class={`[&_img]:rounded-full [&_img]:transition-opacity ${tooltip != "" ? "[&:hover_img]:opacity-80" : ""}`}
	>
		<!-- Single icon -->
		{#if src.length == 1}
			<div>
				<img src={src[0]} {alt} class="size-6.5" />
			</div>
		{/if}

		<!-- Pair icon (non-nested) -->
		{#if src.length == 2 && !nested}
			<div class="relative size-6.5">
				<img src={src[0]} alt={`${alt} pair 1`} class="absolute bottom-px left-px z-10 size-4" />
				<img src={src[1]} alt={`${alt} pair 2`} class="absolute top-px right-px z-0 size-4" />
			</div>
		{/if}

		<!-- Exchange icon (nested) -->
		{#if src.length == 2 && nested}
			<div class="relative size-6.5">
				<img src={src[0]} {alt} class="absolute top-px left-px z-0 size-5" />
				<img src={src[1]} {alt} class="absolute right-px bottom-px z-10 size-3.5" />
			</div>
		{/if}
	</Tooltip.Trigger>

	<!-- If tooltip to be rendered, inject content -->
	{#if tooltip != ""}
		<Tooltip.Content>
			<span>{tooltip}</span>
		</Tooltip.Content>
	{/if}
</Tooltip.Root>
