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

/** Bell poll only. Full RSC refresh happens on user mutations (zelq:refresh), not on the timer. */
const POLL_MS = 12000;

export function LiveSync({ onData }: Props) {
  const router = useRouter();
  const onDataRef = useRef(onData);
  const syncKeyRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const refreshTimer = useRef<number | null>(null);
  onDataRef.current = onData;

  const pullLive = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
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
        // Other users' changes: update client caches only (no full page reload).
        window.dispatchEvent(new Event("zelq:data"));
      }
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    void pullLive();

    const onSoftRefresh = () => {
      window.dispatchEvent(new Event("zelq:data"));
      void pullLive();
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      // User-initiated mutation — refresh current RSC once (not on poll).
      refreshTimer.current = window.setTimeout(() => router.refresh(), 100);
    };
    const onNotices = () => {
      void pullLive();
    };

    window.addEventListener("zelq:refresh", onSoftRefresh);
    window.addEventListener("zelq:notifications", onNotices);

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void pullLive();
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
  }, [pullLive, router]);

  return null;
}
