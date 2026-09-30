import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api-guard";
import { isStaff } from "@/lib/permissions";

/** Lightweight pulse for cross-user live updates (task status + notifications). */
export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user;
    const staff = isStaff(user.role);
    const taskWhere = staff ? {} : { assignedToId: user.id };

    const [latestTask, latestNotice, unread, notifications] = await Promise.all([
      prisma.task
        .findFirst({
          where: taskWhere,
          orderBy: { updatedAt: "desc" },
          select: { id: true, updatedAt: true, status: true },
        })
        .catch(() => null),
      prisma.notification
        .findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true },
        })
        .catch(() => null),
      prisma.notification.count({ where: { userId: user.id, read: false } }).catch(() => 0),
      prisma.notification
        .findMany({
          where: { userId: user.id },
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

    const syncKey = [
      latestTask?.id ?? "",
      latestTask?.updatedAt?.getTime() ?? 0,
      latestTask?.status ?? "",
      latestNotice?.id ?? "",
      latestNotice?.createdAt?.getTime() ?? 0,
      unread,
    ].join(":");

    return NextResponse.json(
      { syncKey, unread, notifications },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/live", error);
    return jsonError("Could not load live state.", 500);
  }
}
