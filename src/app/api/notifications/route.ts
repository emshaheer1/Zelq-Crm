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
    return NextResponse.json(
      { unread, notifications },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/notifications", error);
    return jsonError("Could not load notifications.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const body = ((await request.json()) ?? {}) as { id?: string; all?: boolean };
    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: auth.user.id, read: false },
        data: { read: true },
      });
    } else if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: auth.user.id },
        data: { read: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/notifications", error);
    return jsonError("Could not update notifications.", 500);
  }
}
