import { resolveApiBaseUrl } from "@/lib/api-base";

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl } = resolveApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${path}` : path;

  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as Record<string, unknown>).error)
        : `HTTP_${res.status}`;
    throw new Error(msg);
  }

  return payload as T;
}
