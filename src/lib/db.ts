import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "$prisma/client";

// Database connection
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!
});

// Export Prisma client
export default new PrismaClient({ adapter });
