export async function apiJson<T = { ok?: boolean; id?: string; error?: string }>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  }).catch(() => null);
  const result = (response ? await response.json().catch(() => ({})) : {}) as T & { error?: string };
  if (!response?.ok) {
    throw new Error(result.error || "Could not save.");
  }
  return result;
}

/** Soft-refresh: update client caches + current RSC (mutations only). */
export function softRefresh() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith("zelq:")) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("zelq:refresh"));
  window.dispatchEvent(new Event("zelq:data"));
}

/** Ask the shell to reload the notification bell immediately. */
export function refreshNotifications() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("zelq:notifications"));
}

/** After a mutation: refresh notifications + soft-refresh the page. */
export function reloadList() {
  refreshNotifications();
  softRefresh();
}
