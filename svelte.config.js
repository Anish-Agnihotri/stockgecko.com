import adapter from "@sveltejs/adapter-auto";

/** @type {import('@sveltejs/kit').Config} */
export default {
	kit: {
		adapter: adapter(),
		alias: {
			$db: "src/lib/db.ts",
			$config: "src/config",
			$prisma: "src/lib/generated/prisma"
		}
	}
};
