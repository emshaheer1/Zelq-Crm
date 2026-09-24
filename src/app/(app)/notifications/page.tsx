import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { calendarDateKey, formatRelativeTime, shiftDayKey } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { MarkAllButton } from "./mark-all-button";
import { NotificationRow } from "./notification-row";

function groupLabel(createdAt: Date) {
  const key = calendarDateKey(createdAt);
  const today = calendarDateKey();
  if (key === today) return "Today";
  if (key === shiftDayKey(today, -1)) return "Yesterday";
  return "Earlier";
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((item) => !item.read).length;
  const groups = ["Today", "Yesterday", "Earlier"] as const;
  const grouped = Object.fromEntries(groups.map((label) => [label, [] as typeof notifications])) as Record<
    (typeof groups)[number],
    typeof notifications
  >;
  for (const item of notifications) {
    grouped[groupLabel(item.createdAt)].push(item);
  }

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

      {notifications.length === 0 ? (
        <Surface>
          <EmptyState
            title="You're all caught up."
            description="New assignments and reviews will appear here."
            icon={Bell}
          />
        </Surface>
      ) : (
        <div className="space-y-5">
          {groups.map((label) => {
            const items = grouped[label];
            if (items.length === 0) return null;
            return (
              <Surface key={label} padded={false} className="overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <SectionTitle
                    title={label}
                    description={`${items.length} notification${items.length === 1 ? "" : "s"}`}
                  />
                </div>
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      id={item.id}
                      href={item.href || "/notifications"}
                      title={item.title}
                      body={item.body}
                      read={item.read}
                      type={item.type}
                      timeLabel={formatRelativeTime(item.createdAt)}
                    />
                  ))}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
