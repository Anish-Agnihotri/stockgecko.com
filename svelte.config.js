import adapter from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
export default {
	kit: {
		adapter: adapter({ runtime: "experimental_bun1.x" }),
		alias: {
			$config: "src/config",
			$workflows: "src/workflows",
			$prisma: "src/lib/generated/prisma"
		}
	}
};
