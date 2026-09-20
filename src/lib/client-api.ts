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

export function reloadList() {
  window.setTimeout(() => {
    window.location.replace(window.location.pathname);
  }, 1500);
}
