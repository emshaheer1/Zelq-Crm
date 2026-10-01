"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type CacheEntry = { at: number; payload: unknown };

const memory = new Map<string, CacheEntry>();

function readSession(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`zelq:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    memory.set(key, parsed);
    return parsed.payload;
  } catch {
    return null;
  }
}

function writeSession(key: string, payload: unknown) {
  const entry = { at: Date.now(), payload };
  memory.set(key, entry);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`zelq:${key}`, JSON.stringify(entry));
  } catch {
    // quota — ignore
  }
}

export function peekCache<T>(key: string): T | null {
  const hit = memory.get(key);
  if (hit) return hit.payload as T;
  return readSession(key) as T | null;
}

export function clearPageCache(prefix?: string) {
  if (!prefix) {
    memory.clear();
    return;
  }
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  if (typeof window === "undefined") return;
  try {
    const remove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(`zelq:${prefix}`)) remove.push(key);
    }
    remove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/** Instant paint from cache, background revalidate. Listens to zelq:data / zelq:refresh. */
export function useInstantData<T>(key: string, url: string) {
  const [data, setData] = useState<T | null>(() => peekCache<T>(key));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const urlRef = useRef(url);
  urlRef.current = url;

  const load = useCallback(
    async (background = true) => {
      const response = await fetch(urlRef.current, { cache: "no-store" }).catch(() => null);
      if (!response?.ok) {
        if (!peekCache(key)) setError("Could not load.");
        return;
      }
      const payload = (await response.json().catch(() => null)) as T | null;
      if (!payload) return;
      writeSession(key, payload);
      if (background) {
        startTransition(() => setData(payload));
      } else {
        setData(payload);
      }
      setError(null);
    },
    [key],
  );

  useEffect(() => {
    const cached = peekCache<T>(key);
    setData(cached);
    void load(Boolean(cached));
    const onUpdate = () => {
      clearPageCache(key.split(":")[0] ?? key);
      void load(true);
    };
    window.addEventListener("zelq:data", onUpdate);
    window.addEventListener("zelq:refresh", onUpdate);
    return () => {
      window.removeEventListener("zelq:data", onUpdate);
      window.removeEventListener("zelq:refresh", onUpdate);
    };
  }, [key, load]);

  return { data, error, refreshing: pending && data !== null, loading: data === null && !error };
}

/** Soft refresh that updates client caches without blocking navigation. */
export function softRefresh() {
  if (typeof window === "undefined") return;
  clearPageCache();
  window.dispatchEvent(new Event("zelq:refresh"));
  window.dispatchEvent(new Event("zelq:data"));
}

export function useSoftRouterRefresh() {
  const router = useRouter();
  return useCallback(() => {
    softRefresh();
    // Light RSC refresh only for pages that still rely on server components (detail pages).
    router.refresh();
  }, [router]);
}
