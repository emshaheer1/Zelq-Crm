"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

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

const POLL_MS = 4000;

export function LiveSync({ onData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const onDataRef = useRef(onData);
  const syncKeyRef = useRef<string | null>(null);
  const refreshTimer = useRef<number | null>(null);
  onDataRef.current = onData;

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      router.refresh();
    }, 250);
  }, [router]);

  const pullLive = useCallback(async () => {
    const response = await fetch("/api/live", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) return;
    const data = (await response.json().catch(() => null)) as {
      syncKey?: string;
      unread?: number;
      notifications?: LiveNotice[];
    } | null;
    if (!data) return;

    onDataRef.current({
      unread: data.unread ?? 0,
      notifications: data.notifications ?? [],
    });

    const nextKey = data.syncKey ?? "";
    if (syncKeyRef.current === null) {
      syncKeyRef.current = nextKey;
      return;
    }
    if (nextKey && nextKey !== syncKeyRef.current) {
      syncKeyRef.current = nextKey;
      scheduleRefresh();
    }
  }, [scheduleRefresh]);

  useEffect(() => {
    void pullLive();

    const onSoftRefresh = () => {
      scheduleRefresh();
      void pullLive();
    };
    const onNotices = () => {
      void pullLive();
    };

    window.addEventListener("zelq:refresh", onSoftRefresh);
    window.addEventListener("zelq:notifications", onNotices);

    const timer = window.setInterval(() => {
      void pullLive();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void pullLive();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("zelq:refresh", onSoftRefresh);
      window.removeEventListener("zelq:notifications", onNotices);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, [pullLive, scheduleRefresh]);

  // Re-baseline sync key when the route changes so we don't double-refresh.
  useEffect(() => {
    syncKeyRef.current = null;
    void pullLive();
  }, [pathname, pullLive]);

  return null;
}
