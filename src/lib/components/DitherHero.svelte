<script lang="ts">
	import { onMount, onDestroy, type Snippet } from "svelte";
	import type { ShaderMount, ShaderMountUniforms } from "@paper-design/shaders";

	// Element setup
	let containerEl: HTMLDivElement;

	// Reuseable WebGL context
	let sharedMount: ShaderMount | null = null;

	onMount(async () => {
		// Already created
		if (sharedMount) {
			// Reuse existing WebGL context, just move canvas
			containerEl.prepend(sharedMount.canvasElement);
			return;
		}

		// Else, dynamically import shader and create once
		const {
			ShaderMount,
			DitheringShapes,
			DitheringTypes,
			ShaderFitOptions,
			ditheringFragmentShader,
			getShaderColorFromString
		} = await import("@paper-design/shaders");

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

		// Component may have been destroyed while awaiting import
		if (!containerEl) return;

		// Create shader once
		sharedMount = new ShaderMount(
			containerEl,
			ditheringFragmentShader,
			shaderConfig,
			{ alpha: true, premultipliedAlpha: true },
			animationSpeed
		);
	});

	onDestroy(() => {
		// On dismount, detach canvas so WebGL context stays alive
		if (sharedMount?.canvasElement?.parentNode) {
			sharedMount.canvasElement.remove();
		}
	});

	// Collect additional styles, inject children
	let { class: className = "", children }: { class?: string; children?: Snippet } = $props();
</script>

<div bind:this={containerEl} class="relative isolate w-full overflow-hidden {className}">
	{@render children?.()}
</div>
