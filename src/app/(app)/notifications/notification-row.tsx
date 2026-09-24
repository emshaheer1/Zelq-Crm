"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { apiJson, refreshNotifications, softRefresh } from "@/lib/client-api";
import { notificationTypeMeta } from "@/lib/notification-meta";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

export type NotificationActor = {
  name: string;
  avatarUrl: string | null;
} | null;

export function NotificationRow({
  id,
  href,
  title,
  body,
  read,
  type,
  timeLabel,
  actor,
}: {
  id: string;
  href: string;
  title: string;
  body: string | null;
  read: boolean;
  type: NotificationType;
  timeLabel: string;
  actor: NotificationActor;
}) {
  const router = useRouter();
  const meta = notificationTypeMeta[type] ?? {
    label: "Update",
    icon: Bell,
    tone: "bg-muted text-foreground",
    text: "text-muted-foreground",
  };
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
      <span className="relative mt-0.5 shrink-0">
        {actor ? (
          <UserAvatar name={actor.name} src={actor.avatarUrl} className="size-9" />
        ) : (
          <span className={cn("flex size-9 items-center justify-center rounded-full", meta.tone)}>
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        )}
        {actor ? (
          <span
            className={cn(
              "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ring-white",
              meta.tone,
            )}
          >
            <Icon className="size-2.5" strokeWidth={2} />
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("text-[11px] font-semibold tracking-wide uppercase", meta.text)}>
            {meta.label}
          </span>
          {actor ? (
            <span className="text-[11px] text-muted-foreground">from {actor.name.split(" ")[0]}</span>
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
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeLabel}</span>
      </span>

      {!read ? <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> : null}
    </Link>
  );
}
