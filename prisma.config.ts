import { defineConfig, env } from "prisma/config";

// Setup `prisma` handler for use via `bunx --bun prisma`
export default defineConfig({
	schema: "src/prisma/schema.prisma",
	migrations: { path: "src/prisma/migrations" },
	datasource: { url: env("DATABASE_URL") }
});
