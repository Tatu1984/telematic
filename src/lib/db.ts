import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma with connection pooling optimizations for serverless environments
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Datasource configuration is handled via DATABASE_URL
    // For serverless (Vercel), use Prisma Accelerate or Neon pooler in connection string
    // Example: postgresql://user:pass@pooler.neon.tech/db?pgbouncer=true&connect_timeout=15
  });

// In development, preserve the Prisma client across hot-reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Connection management for serverless
// Disconnect on cold start prevention (optional, uncomment if needed)
// process.on('beforeExit', async () => {
//   await prisma.$disconnect();
// });

export default prisma;
