import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { MarkAllButton } from "./mark-all-button";
import { NotificationsWorkspace, type NotificationListItem } from "./notifications-workspace";

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

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
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

  const unread = notifications.filter((item) => !item.read).length;
  const items: NotificationListItem[] = notifications.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    href: item.href,
    read: item.read,
    type: item.type,
    createdAt: item.createdAt,
    actor: actorFor(item.type, item.task),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} unread · Assignments, reviews, and deadlines.`
            : "Assignments, reviews, and deadlines."
        }
        actions={unread > 0 ? <MarkAllButton /> : null}
      />
      <NotificationsWorkspace items={items} />
    </div>
  );
}
