"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Eye,
  Flag,
  TriangleAlert,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { apiJson, refreshNotifications, softRefresh } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const typeMeta: Record<NotificationType, { label: string; icon: LucideIcon }> = {
  TASK_ASSIGNED: { label: "Assignment", icon: UserPlus },
  DEADLINE_TOMORROW: { label: "Deadline", icon: CalendarClock },
  TASK_OVERDUE: { label: "Overdue", icon: TriangleAlert },
  REVIEW_SUBMITTED: { label: "Review", icon: Eye },
  REVISION_REQUESTED: { label: "Revision", icon: Flag },
  TASK_APPROVED: { label: "Approved", icon: CheckCircle2 },
  PROJECT_DEADLINE_APPROACHING: { label: "Project", icon: CalendarClock },
};

export function NotificationRow({
  id,
  href,
  title,
  body,
  read,
  type,
  timeLabel,
}: {
  id: string;
  href: string;
  title: string;
  body: string | null;
  read: boolean;
  type: NotificationType;
  timeLabel: string;
}) {
  const router = useRouter();
  const meta = typeMeta[type] ?? { label: "Update", icon: Bell };
  const Icon = meta.icon;

  return (
    <Link
      href={href}
      onClick={() => {
        if (read) return;
        void apiJson("/api/notifications", { method: "PATCH", json: { id } })
          .then(() => {
            refreshNotifications();
            softRefresh();
            router.refresh();
          })
          .catch(() => {});
      }}
      className={cn(
        "group relative flex items-start gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/60",
        !read && "bg-[#FCFFF5]",
      )}
    >
      {!read ? (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden="true" />
      ) : null}

      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border",
          read
            ? "border-border bg-white text-muted-foreground"
            : "border-[#d8f28a] bg-primary/20 text-[#111111]",
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {meta.label}
          </span>
          {!read ? (
            <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
              New
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "mt-1 block text-[13px] leading-snug",
            read ? "font-medium text-muted-foreground" : "font-semibold text-foreground",
          )}
        >
          {title}
        </span>
        {body ? (
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{body}</span>
        ) : null}
      </span>

      <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">{timeLabel}</span>
    </Link>
  );
}
