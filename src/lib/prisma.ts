import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Runtime URL for serverless. Migrations keep DIRECT_URL on port 5432. */
function datasourceUrl() {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw || raw.startsWith("file:")) return raw;
  const supabase = raw.includes("supabase.co") || raw.includes("pooler.supabase.com");
  if (!supabase) return raw;

  let url = raw;
  const directHost = url.includes("db.") && url.includes(".supabase.co") && !url.includes("pooler.supabase.com");
  if (directHost && !url.includes(":6543")) {
    url = url.includes(":5432") ? url.replace(":5432", ":6543") : url.replace(".supabase.co", ".supabase.co:6543");
  }
  if (!url.includes("pgbouncer=")) {
    url += `${url.includes("?") ? "&" : "?"}pgbouncer=true`;
  }
  if (!url.includes("connection_limit=")) {
    url += "&connection_limit=1";
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
