import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiStaff } from "@/lib/api-guard";

export async function GET() {
  try {
    const auth = await requireApiStaff();
    if ("error" in auth) return auth.error;

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        status: true,
        logoUrl: true,
        updatedAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { name: "asc" },
      take: 300,
    });

    return NextResponse.json(
      { clients },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/clients", error);
    return jsonError("Could not load clients.", 500);
  }
}
