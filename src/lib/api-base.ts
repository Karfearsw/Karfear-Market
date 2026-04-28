export type ApiBaseUrlSource = "runtime" | "localStorage" | "env" | "default";

let runtimeOverride: string | null = null;

export function normalizeApiBaseUrl(v: string) {
  const trimmed = v.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function setRuntimeApiBaseUrl(v: string | null) {
  runtimeOverride = v === null ? null : normalizeApiBaseUrl(v);
}

export function getCachedApiBaseUrl() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeApiBaseUrl(window.localStorage.getItem("ksw.apiBaseUrl") ?? "");
  } catch {
    return "";
  }
}

export function setCachedApiBaseUrl(v: string) {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeApiBaseUrl(v);
    if (!normalized) window.localStorage.removeItem("ksw.apiBaseUrl");
    else window.localStorage.setItem("ksw.apiBaseUrl", normalized);
  } catch {}
}

export function resolveApiBaseUrl(): { baseUrl: string; source: ApiBaseUrlSource } {
  const rt = runtimeOverride ? normalizeApiBaseUrl(runtimeOverride) : "";
  if (rt) return { baseUrl: rt, source: "runtime" };

  const cached = getCachedApiBaseUrl();
  if (cached) return { baseUrl: cached, source: "localStorage" };

  const env = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
  if (env) return { baseUrl: env, source: "env" };

  return { baseUrl: "", source: "default" };
}

export async function probeHealth(
  baseUrl?: string,
  opts?: { timeoutMs?: number }
): Promise<{ ok: boolean; status: number | null; urlTried: string; elapsedMs: number; error: string | null }> {
  const timeoutMs = opts?.timeoutMs ?? 3000;
  const resolved = baseUrl !== undefined ? normalizeApiBaseUrl(baseUrl) : resolveApiBaseUrl().baseUrl;
  const url = `${resolved}/health`;
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store", signal: controller.signal });
    return { ok: res.ok, status: res.status, urlTried: url, elapsedMs: Date.now() - start, error: null };
  } catch (err) {
    return {
      ok: false,
      status: null,
      urlTried: url,
      elapsedMs: Date.now() - start,
      error: err instanceof Error ? err.message : "REQUEST_FAILED",
    };
  } finally {
    clearTimeout(id);
  }
}

