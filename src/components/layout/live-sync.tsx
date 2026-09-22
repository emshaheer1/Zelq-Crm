"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type LiveNotice = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt?: Date | string;
};

type Props = {
  onData: (data: { unread: number; notifications: LiveNotice[] }) => void;
};

export function LiveSync({ onData }: Props) {
  const router = useRouter();
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const pullNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;
    const data = (await response.json().catch(() => null)) as {
      unread?: number;
      notifications?: LiveNotice[];
    } | null;
    if (!data) return;
    onDataRef.current({
      unread: data.unread ?? 0,
      notifications: data.notifications ?? [],
    });
  }, []);

  useEffect(() => {
    void pullNotifications();

    const onSoftRefresh = () => {
      router.refresh();
      void pullNotifications();
    };
    const onNotices = () => {
      void pullNotifications();
    };

    window.addEventListener("zelq:refresh", onSoftRefresh);
    window.addEventListener("zelq:notifications", onNotices);

    // Poll bell only — do not router.refresh() here (that re-ran every heavy page query).
    const timer = window.setInterval(() => {
      void pullNotifications();
    }, 15000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void pullNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("zelq:refresh", onSoftRefresh);
      window.removeEventListener("zelq:notifications", onNotices);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pullNotifications, router]);

  return null;
}
