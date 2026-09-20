import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api-guard";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const userId = auth.user.id;
    const [unread, notifications] = await Promise.all([
      prisma.notification.count({ where: { userId, read: false } }).catch(() => 0),
      prisma.notification
        .findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            body: true,
            href: true,
            read: true,
            createdAt: true,
          },
        })
        .catch(() => []),
    ]);
    return NextResponse.json({ unread, notifications });
  } catch (error) {
    console.error("GET /api/notifications", error);
    return jsonError("Could not load notifications.", 500);
  }
}
