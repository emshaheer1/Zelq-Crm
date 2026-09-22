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
  const signatureRef = useRef("");
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const pullNotifications = useCallback(async (opts?: { forcePageRefresh?: boolean }) => {
    const response = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;
    const data = (await response.json().catch(() => null)) as {
      unread?: number;
      notifications?: LiveNotice[];
    } | null;
    if (!data) return;

    const list = data.notifications ?? [];
    const unread = data.unread ?? 0;
    const signature = `${unread}:${list[0]?.id ?? ""}:${list.map((item) => (item.read ? "1" : "0")).join("")}`;
    const changed = signatureRef.current !== "" && signatureRef.current !== signature;
    signatureRef.current = signature;
    onDataRef.current({ unread, notifications: list });

    if (opts?.forcePageRefresh) {
      router.refresh();
    } else if (changed) {
      const dialogOpen = Boolean(document.querySelector('[data-slot="dialog-content"]'));
      if (!dialogOpen) router.refresh();
    }
  }, [router]);

  useEffect(() => {
    void pullNotifications();

    const onSoftRefresh = () => {
      router.refresh();
      void pullNotifications();
    };
    const onNotices = () => {
      void pullNotifications({ forcePageRefresh: false });
    };

    window.addEventListener("zelq:refresh", onSoftRefresh);
    window.addEventListener("zelq:notifications", onNotices);

    const timer = window.setInterval(() => {
      void pullNotifications();
    }, 4000);

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
