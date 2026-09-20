import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return url;
  if (url.includes("pgbouncer=true") || url.includes("connection_limit=")) return url;
  if (url.includes("pooler.supabase.com") || url.includes(":6543")) {
    return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true&connection_limit=1`;
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl() || undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
