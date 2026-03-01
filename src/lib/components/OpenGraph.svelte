<script lang="ts">
	let {
		markets,
		volume,
		oi,
		name,
		logo
	}: { markets: string; volume: string; oi: string; name: string; logo: string } = $props();
</script>

<div class="relative flex h-full w-full tabular-nums">
	<!-- Template background -->
	<img
		src={`https://i.postimg.cc/HLsbqfv2/${"template"}.webp"`}
		width="2400px"
		height="1256px"
		alt="background"
		class="absolute top-0 left-0 h-full w-full"
	/>

	<!-- Meta -->
	<div class="absolute top-[64px] left-[64px] flex h-[1128px] w-[1553px] flex-col">
		{#each logo.split(",") as path}
			<img
				src="https://ipogecko.com{path}"
				alt="logo"
				width="300px"
				height="300px"
				class="absolute top-0 left-0 h-[300px] w-[300px] rounded-full"
			/>
			<!-- <span class="text-white">https://ipogecko.com{path}</span> -->
		{/each}

		<!-- Logo -->
		<span class="text-white">{logo}</span>
		<!-- Name -->
		<h1 class="text-2xl text-white">{name}</h1>
	</div>

	<!-- Markets -->
	<h3 class="absolute top-[443px] left-[1711px] font-mono text-5xl text-white">{markets}</h3>

	<!-- Volume -->
	<h3 class="absolute top-[739px] left-[1711px] font-mono text-5xl text-white">${volume}</h3>

	<!-- Open Interest -->
	<h3 class="absolute top-[1040px] left-[1711px] font-mono text-5xl text-white">${oi}</h3>
</div>
