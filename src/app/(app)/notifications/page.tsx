import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { calendarDateKey, formatRelativeTime, shiftDayKey } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface } from "@/components/shared/surface";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay on top of assignments, reviews, and deadlines."
        actions={unread > 0 ? <MarkAllButton /> : null}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Unread</span>
          <span className="text-[18px] font-semibold tabular-nums text-foreground">
            {String(unread).padStart(2, "0")}
          </span>
        </div>
        <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Total</span>
          <span className="text-[18px] font-semibold tabular-nums text-foreground">
            {String(notifications.length).padStart(2, "0")}
          </span>
        </div>
        <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
        <p className="text-[13px] text-muted-foreground">
          {unread > 0
            ? `${unread} item${unread === 1 ? "" : "s"} need your attention`
            : "You're all caught up"}
        </p>
      </div>

      {notifications.length === 0 ? (
        <Surface>
          <EmptyState
            title="No notifications yet"
            description="Assignments, reviews, and deadline alerts will show up here."
            icon={Bell}
          />
        </Surface>
      ) : (
        <Surface padded={false} className="overflow-hidden">
          {groups.map((label, groupIndex) => {
            const items = grouped[label];
            if (items.length === 0) return null;
            return (
              <div key={label} className={groupIndex > 0 ? "border-t border-border" : undefined}>
                <div className="flex items-center justify-between bg-[#F8FAFC] px-5 py-2.5">
                  <p className="text-[12px] font-semibold tracking-wide text-[#344054] uppercase">
                    {label}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">{items.length}</p>
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
              </div>
            );
          })}
        </Surface>
      )}
    </div>
  );
}
