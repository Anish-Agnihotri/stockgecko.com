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
	}: { src: string[]; alt: string; nested?: boolean; tooltip?: string } = $props();
</script>

<Tooltip.Root>
	<!-- Render hovers only if tooltip content exists -->
	<Tooltip.Trigger
		class={`[&_img]:rounded-full [&_img]:transition-opacity ${tooltip != "" ? "[&:hover_img]:opacity-80" : ""}`}
	>
		<!-- Single icon -->
		{#if src.length == 1}
			<div>
				<img src={src[0]} {alt} class="size-5" />
			</div>
		{/if}

		<!-- Pair icon (non-nested) -->
		{#if src.length == 2 && !nested}
			<div class="relative size-7">
				<img
					src={src[0]}
					alt={`${alt} pair 1`}
					class="absolute bottom-0.5 left-0.5 z-10 size-3.75"
				/>
				<img src={src[1]} alt={`${alt} pair 2`} class="absolute top-0.5 right-0.5 z-0 size-3.75" />
			</div>
		{/if}

		<!-- Exchange icon (nested) -->
		{#if src.length == 2 && nested}
			<div class="relative size-5">
				<img src={src[1]} {alt} class="absolute top-0 left-px z-0 size-4.25" />
				<img src={src[0]} {alt} class="absolute right-0 bottom-0 z-10 size-2.5" />
			</div>
		{/if}
	</Tooltip.Trigger>

	<!-- If tooltip to be rendered, inject content -->
	{#if tooltip != ""}
		<Tooltip.Content
			class="border border-gecko-shade bg-gecko-black"
			arrowClasses="border-b border-b-gecko-shade bg-gecko-black"
		>
			<span>{tooltip}</span>
		</Tooltip.Content>
	{/if}
</Tooltip.Root>
