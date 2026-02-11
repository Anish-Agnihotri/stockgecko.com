import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "$prisma/client";
import { DATABASE_URL } from "$env/static/private";

// Setup and export Prisma client
// Used server-side only so forced connection creation; connection pooling if needed
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
export default new PrismaClient({ adapter });
