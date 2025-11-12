import { PrismaClient } from "../prisma/generated/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

/**
 * Enhanced Prisma Client Configuration
 *
 * Features:
 * - Connection pooling (20 connections default)
 * - Query logging in development
 * - Error logging in production
 * - Optimized timeouts
 */
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL +
          // Connection pool configuration
          "?connection_limit=20" + // Max 20 concurrent connections
          "&pool_timeout=20" + // Wait up to 20s for connection
          "&connect_timeout=10", // Connect timeout 10s
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });

// Log slow queries in development
if (process.env.NODE_ENV === "development") {
  prisma.$on("query" as never, (e: any) => {
    if (e.duration > 100) {
      // Log queries slower than 100ms
      console.warn(
        `🐌 Slow query (${e.duration}ms): ${e.query.substring(0, 100)}...`
      );
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
