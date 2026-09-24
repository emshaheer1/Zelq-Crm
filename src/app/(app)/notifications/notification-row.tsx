"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  RefreshCcw,
  ScanEye,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { apiJson, refreshNotifications, softRefresh } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const typeMeta: Record<NotificationType, { label: string; icon: LucideIcon }> = {
  TASK_ASSIGNED: { label: "Assignment", icon: ClipboardList },
  DEADLINE_TOMORROW: { label: "Deadline", icon: CalendarDays },
  TASK_OVERDUE: { label: "Overdue", icon: AlertCircle },
  REVIEW_SUBMITTED: { label: "Review", icon: ScanEye },
  REVISION_REQUESTED: { label: "Revision", icon: RefreshCcw },
  TASK_APPROVED: { label: "Approved", icon: BadgeCheck },
  PROJECT_DEADLINE_APPROACHING: { label: "Project", icon: FolderKanban },
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
      className="flex items-start gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/50"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-[13px] leading-snug",
              read ? "font-medium text-muted-foreground" : "font-semibold text-foreground",
            )}
          >
            {title}
          </span>
          <span className="text-[11px] text-muted-foreground">· {meta.label}</span>
        </span>
        {body ? (
          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{body}</span>
        ) : null}
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeLabel}</span>
      </span>

      {!read ? <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> : null}
    </Link>
  );
}
