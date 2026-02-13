<script lang="ts">
	import {
		ShaderMount,
		DitheringShapes,
		DitheringTypes,
		ShaderFitOptions,
		ditheringFragmentShader,
		getShaderColorFromString,
		type ShaderMountUniforms
	} from "@paper-design/shaders";
	import { onMount, onDestroy, type Snippet } from "svelte";

	// Shader configuration
	const animationSpeed = 0.5;
	const shaderConfig: ShaderMountUniforms = {
		// Sizing uniforms
		u_originX: 0.5,
		u_originY: 0.5,
		u_offsetX: 0,
		u_offsetY: 0,
		u_worldWidth: 0,
		u_worldHeight: 0,

		// To customize:
		u_rotation: 0,
		u_scale: 0.8,
		u_pxSize: 1.5,
		u_type: DitheringTypes["4x4"],
		u_fit: ShaderFitOptions["cover"],
		u_shape: DitheringShapes["swirl"],
		u_colorBack: getShaderColorFromString("#000000"),
		u_colorFront: getShaderColorFromString("#1E1E24")
	};

	// Element setup
	let containerEl: HTMLDivElement;
	let shaderMount: ShaderMount | null = null;

	onMount(() => {
		// Setup new shader mount
		shaderMount = new ShaderMount(
			containerEl,
			ditheringFragmentShader,
			shaderConfig,
			{ alpha: true, premultipliedAlpha: true },
			animationSpeed
		);
	});

	onDestroy(() => {
		// On dismount, cleanup
		shaderMount?.dispose();
		shaderMount = null;
	});

	// Collect additional styles, inject children
	let { class: className = "", children }: { class?: string; children?: Snippet } = $props();
</script>

<div bind:this={containerEl} class="relative isolate w-full overflow-hidden {className}">
	{@render children?.()}
</div>
