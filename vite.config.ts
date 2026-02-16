import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { workflowPlugin } from "workflow/sveltekit";

export default defineConfig({
	plugins: [tailwindcss({ optimize: { minify: true } }), sveltekit(), workflowPlugin()]
});
