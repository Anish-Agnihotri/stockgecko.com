import adapter from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
export default {
	kit: {
		adapter: adapter({ runtime: "experimental_bun1.x" }),
		alias: {
			$config: "src/config",
			$workflows: "src/workflows",
			$components: "src/lib/components",
			$prisma: "src/lib/generated/prisma",
			$shadcn: "src/lib/shadcn/components/ui",

			// shadcn/ui
			"@/*": "src/lib/*"
		},
		prerender: {
			handleHttpError: "warn"
		}
	}
};
