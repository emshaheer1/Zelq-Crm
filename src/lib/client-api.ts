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

/** Soft-refresh the current page (no full browser reload). */
export function softRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("zelq:refresh"));
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
