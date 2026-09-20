import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiStaff } from "@/lib/api-guard";

export async function GET() {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;

    const [projects, clients, managers, employees] = await Promise.all([
      prisma.project.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.client.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", role: { in: ["ADMIN", "MANAGER"] } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", role: { not: "ADMIN" } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json(
      { projects, clients, managers, employees },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    console.error("GET /api/options", error);
    return jsonError("Could not load form options.", 500);
  }
}
