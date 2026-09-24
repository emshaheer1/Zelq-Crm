"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { EmptyState } from "@/components/shared/empty-state";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { AppSelect } from "@/components/ui/app-select";
import { fieldSelectClass } from "@/lib/styles";
import { notificationFilterTypes } from "@/lib/notification-meta";
import { calendarDateKey, formatRelativeTime, shiftDayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { NotificationRow, type NotificationActor } from "./notification-row";

export type NotificationListItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  type: NotificationType;
  createdAt: string | Date;
  actor: NotificationActor;
};

function groupLabel(createdAt: Date | string) {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const key = calendarDateKey(date);
  const today = calendarDateKey();
  if (key === today) return "Today";
  if (key === shiftDayKey(today, -1)) return "Yesterday";
  return "Earlier";
}

export function NotificationsWorkspace({ items }: { items: NotificationListItem[] }) {
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (status === "unread" && item.read) return false;
      if (status === "read" && !item.read) return false;
      if (type !== "all" && item.type !== type) return false;
      return true;
    });
  }, [items, status, type]);

  const groups = ["Today", "Yesterday", "Earlier"] as const;
  const grouped = Object.fromEntries(groups.map((label) => [label, [] as NotificationListItem[]])) as Record<
    (typeof groups)[number],
    NotificationListItem[]
  >;
  for (const item of filtered) {
    grouped[groupLabel(item.createdAt)].push(item);
  }

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <div className="space-y-5">
      <Surface className="!p-3 md:!p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-white p-0.5">
            {(
              [
                { value: "all", label: "All" },
                { value: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
                { value: "read", label: "Read" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                  status === option.value
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <AppSelect
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={cn(fieldSelectClass, "h-9 w-[160px]")}
          >
            {notificationFilterTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppSelect>
        </div>
      </Surface>

      {filtered.length === 0 ? (
        <Surface>
          <EmptyState
            title={items.length === 0 ? "You're all caught up." : "No matching notifications."}
            description={
              items.length === 0
                ? "New assignments and reviews will appear here."
                : "Try another filter to see more updates."
            }
            icon={Bell}
          />
        </Surface>
      ) : (
        <div className="space-y-5">
          {groups.map((label) => {
            const groupItems = grouped[label];
            if (groupItems.length === 0) return null;
            return (
              <Surface key={label} padded={false} className="overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <SectionTitle
                    title={label}
                    description={`${groupItems.length} notification${groupItems.length === 1 ? "" : "s"}`}
                  />
                </div>
                <div className="divide-y divide-border">
                  {groupItems.map((item) => (
                    <NotificationRow
                      key={item.id}
                      id={item.id}
                      href={item.href || "/notifications"}
                      title={item.title}
                      body={item.body}
                      read={item.read}
                      type={item.type}
                      timeLabel={formatRelativeTime(item.createdAt)}
                      actor={item.actor}
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
