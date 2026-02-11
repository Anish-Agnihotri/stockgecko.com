import adapter from "@sveltejs/adapter-auto";

/** @type {import('@sveltejs/kit').Config} */
export default {
	kit: {
		adapter: adapter(),
		alias: {
			$config: "src/config",
			$workflows: "src/workflows",
			$prisma: "src/lib/generated/prisma"
		}
	}
};
