import { NextResponse } from "next/server";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api-guard";

function actorFor(
  type: NotificationType,
  task: {
    assignedBy: { name: string; avatarUrl: string | null };
    assignedTo: { name: string; avatarUrl: string | null };
    reviews: { reviewer: { name: string; avatarUrl: string | null } }[];
  } | null,
) {
  if (!task) return null;
  if (type === "TASK_ASSIGNED") return task.assignedBy;
  if (type === "REVIEW_SUBMITTED") return task.assignedTo;
  if (type === "REVISION_REQUESTED" || type === "TASK_APPROVED") {
    return task.reviews[0]?.reviewer ?? null;
  }
  return null;
}

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        task: {
          select: {
            assignedBy: { select: { name: true, avatarUrl: true } },
            assignedTo: { select: { name: true, avatarUrl: true } },
            reviews: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { reviewer: { select: { name: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    const items = notifications.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      href: item.href,
      read: item.read,
      type: item.type,
      createdAt: item.createdAt,
      actor: actorFor(item.type, item.task),
    }));

    return NextResponse.json(
      { items, unread: items.filter((item) => !item.read).length },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/notifications", error);
    return jsonError("Could not load notifications.", 500);
  }
}
