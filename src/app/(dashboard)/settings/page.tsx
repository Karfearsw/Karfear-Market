"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveApiBaseUrl, setCachedApiBaseUrl, setRuntimeApiBaseUrl } from "@/lib/api-base";

export default function SettingsPage() {
  const [{ baseUrl, source }, setResolved] = useState(() => resolveApiBaseUrl());
  const [draft, setDraft] = useState(baseUrl);
  const [health, setHealth] = useState<{
    ok: boolean;
    status: number | null;
    elapsedMs: number;
    error: string | null;
    checkedAt: number;
    urlTried: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const r = resolveApiBaseUrl();
      setResolved(r);
      setDraft(r.baseUrl);
    });
  }, []);

  async function testHealth() {
    setBusy(true);
    try {
      const r = resolveApiBaseUrl();
      const url = `${r.baseUrl}/health`;
      const started = Date.now();
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      setHealth({
        ok: res.ok,
        status: res.status,
        elapsedMs: Date.now() - started,
        error: null,
        checkedAt: Date.now(),
        urlTried: url,
      });
    } catch (err) {
      const r = resolveApiBaseUrl();
      const url = `${r.baseUrl}/health`;
      setHealth({
        ok: false,
        status: null,
        elapsedMs: 0,
        error: err instanceof Error ? err.message : "REQUEST_FAILED",
        checkedAt: Date.now(),
        urlTried: url,
      });
    } finally {
      setBusy(false);
    }
  }

  function applyOverride() {
    setCachedApiBaseUrl(draft);
    setRuntimeApiBaseUrl(draft);
    setResolved(resolveApiBaseUrl());
  }

  function clearOverride() {
    setCachedApiBaseUrl("");
    setRuntimeApiBaseUrl("");
    setResolved(resolveApiBaseUrl());
    setDraft("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Realtime mode</div>
            <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
              polling
            </Badge>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Upgrade to SSE/WebSocket when the bot backend is ready.
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            API Connectivity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">API Base URL</div>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="bg-card/40" />
            <div className="text-xs text-muted-foreground">
              Resolved: {baseUrl || "(same origin)"} ({source})
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-card/30" onClick={applyOverride} disabled={busy}>
              Save
            </Button>
            <Button variant="outline" className="bg-card/30" onClick={clearOverride} disabled={busy}>
              Clear
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void testHealth()} disabled={busy}>
              Test /health
            </Button>
          </div>
          {health && (
            <div className="rounded-xl border border-border/60 bg-background/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
                  {health.ok ? "ok" : "down"}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>URL: {health.urlTried}</div>
                <div>HTTP: {health.status ?? "—"}</div>
                <div>Latency: {health.elapsedMs}ms</div>
                <div>Checked: {new Date(health.checkedAt).toLocaleTimeString()}</div>
                {health.error && <div className="col-span-2 text-destructive">Error: {health.error}</div>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            Theme is locked to black/white/red (always dark) in this build.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
