import Link from "next/link";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Eye,
  Flag,
  Inbox,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { calendarDateKey, formatDateTime, formatRelativeTime, shiftDayKey } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface } from "@/components/shared/surface";
import { StatCard } from "@/components/shared/stat-card";
import { MarkAllButton } from "./mark-all-button";
import { cn } from "@/lib/utils";

const typeMeta: Record<
  NotificationType,
  { label: string; icon: typeof Bell; tone: string }
> = {
  TASK_ASSIGNED: {
    label: "Assignment",
    icon: UserPlus,
    tone: "bg-[#EFF8FF] text-[#175CD3]",
  },
  DEADLINE_TOMORROW: {
    label: "Deadline",
    icon: CalendarClock,
    tone: "bg-[#FFFAEB] text-[#B54708]",
  },
  TASK_OVERDUE: {
    label: "Overdue",
    icon: TriangleAlert,
    tone: "bg-[#FEF3F2] text-[#B42318]",
  },
  REVIEW_SUBMITTED: {
    label: "Review",
    icon: Eye,
    tone: "bg-primary/15 text-[#111111]",
  },
  REVISION_REQUESTED: {
    label: "Revision",
    icon: Flag,
    tone: "bg-[#FFF6ED] text-[#C4320A]",
  },
  TASK_APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    tone: "bg-[#ECFDF3] text-[#027A48]",
  },
  PROJECT_DEADLINE_APPROACHING: {
    label: "Project",
    icon: CalendarClock,
    tone: "bg-[#FEFBE8] text-[#CA8A04]",
  },
};

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
        description="Assignments, reviews, and deadlines across your workspace."
        actions={unread > 0 ? <MarkAllButton /> : null}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Bell} label="Unread" value={unread} tone={unread > 0 ? "lime" : "muted"} />
        <StatCard icon={Inbox} label="Total" value={notifications.length} tone="charcoal" />
        <StatCard
          icon={CheckCircle2}
          label="Status"
          value={unread > 0 ? "Needs attention" : "All caught up"}
          tone={unread > 0 ? "orange" : "green"}
        />
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up."
          description="New assignments and reviews will appear here."
          icon={Bell}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((label) => {
            const items = grouped[label];
            if (items.length === 0) return null;
            return (
              <Surface key={label} padded={false} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-[#111111]/[0.03] px-5 py-3">
                  <p className="text-[13px] font-semibold text-foreground">{label}</p>
                  <p className="text-[12px] tabular-nums text-muted-foreground">
                    {items.length} notification{items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {items.map((item) => {
                    const meta = typeMeta[item.type] ?? {
                      label: "Update",
                      icon: Bell,
                      tone: "bg-primary/15 text-foreground",
                    };
                    const Icon = meta.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href || "/notifications"}
                        className={cn(
                          "flex items-start gap-3.5 px-5 py-4 transition-colors duration-150 hover:bg-muted/50",
                          !item.read && "bg-primary/[0.06]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                            meta.tone,
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                                meta.tone,
                              )}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </span>
                          <p
                            className={cn(
                              "mt-1.5 text-[14px] leading-snug",
                              item.read ? "font-medium text-muted-foreground" : "font-semibold text-foreground",
                            )}
                          >
                            {item.title}
                          </p>
                          {item.body ? (
                            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
                          ) : null}
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </span>
                        {!item.read ? (
                          <span className="mt-2 size-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
