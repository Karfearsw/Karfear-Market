"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiJson } from "@/lib/api-client";
import { useKswData } from "@/lib/ksw/provider";
import type { Adapter, AdapterCapability, StoreType } from "@/lib/ksw/types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const capabilities: AdapterCapability[] = [
  "product_discovery",
  "variant_parse",
  "add_to_cart",
  "checkout",
  "anti_bot",
];

export default function AdaptersPage() {
  const { state } = useKswData();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<StoreType>("shopify");
  const [baseUrl, setBaseUrl] = useState("");
  const [caps, setCaps] = useState<AdapterCapability[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsAdapterId, setLogsAdapterId] = useState<string | null>(null);

  const logsAdapter = useMemo(
    () => (logsAdapterId ? state.adapters.find((a) => a.id === logsAdapterId) : undefined),
    [logsAdapterId, state.adapters]
  );

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setName("");
    setType("shopify");
    setBaseUrl("");
    setCaps([]);
    setError(null);
    setOpen(true);
  }

  function openEdit(a: Adapter) {
    setMode("edit");
    setEditingId(a.id);
    setName(a.name);
    setType(a.type);
    setBaseUrl(a.baseUrl ?? "");
    setCaps(a.capabilities);
    setError(null);
    setOpen(true);
  }

  async function callApi(path: string, init: RequestInit) {
    setError(null);
    setBusy(true);
    try {
      return await apiJson(path, init);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const payload = { name, type, baseUrl, capabilities: caps };
    if (mode === "create") {
      await callApi("/api/adapters", { method: "POST", body: JSON.stringify(payload) });
    } else if (editingId) {
      await callApi(`/api/adapters/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
    }
    setOpen(false);
  }

  async function remove() {
    if (!editingId) return;
    await callApi(`/api/adapters/${editingId}`, { method: "DELETE" });
    setOpen(false);
  }

  async function connect(id: string) {
    await callApi(`/api/adapters/${id}/connect`, { method: "POST", body: JSON.stringify({}) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Adapters represent site-specific parsing + checkout logic.
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
          Add Adapter
        </Button>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {state.adapters.map((a) => (
          <Card key={a.id} className="border-border/70 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm truncate">
                    {a.name}
                  </CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Type: {a.type} • Last sync {formatTime(a.lastSyncAt)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    a.connected
                      ? "rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                      : "rounded-full bg-red-500/15 text-red-300 border-red-500/25"
                  }
                >
                  {a.connected ? "connected" : "offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2">
                {a.capabilities.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="rounded-full bg-background/30 border-border/60"
                  >
                    {c.replaceAll("_", " ")}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" className="bg-card/30" onClick={() => openEdit(a)} disabled={busy}>
                  Configure
                </Button>
                <Button
                  variant="outline"
                  className="bg-card/30"
                  onClick={() => {
                    setLogsAdapterId(a.id);
                    setLogsOpen(true);
                  }}
                >
                  View Logs
                </Button>
                <Button
                  className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => void connect(a.id).catch((e) => setError(String(e.message ?? e)))}
                  disabled={busy}
                >
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add Adapter" : "Configure Adapter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Type</div>
              <Tabs value={type} onValueChange={(v) => setType(v as StoreType)}>
                <TabsList className="bg-card/40">
                  <TabsTrigger value="shopify">Shopify</TabsTrigger>
                  <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Base URL</div>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((c) => {
                  const active = caps.includes(c);
                  return (
                    <Button
                      key={c}
                      variant="outline"
                      size="sm"
                      className={active ? "bg-primary/15 text-primary border-primary/25" : "bg-card/30"}
                      onClick={() =>
                        setCaps((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
                      }
                      disabled={busy}
                    >
                      {c.replaceAll("_", " ")}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            {mode === "edit" && (
              <Button variant="outline" className="bg-card/30 mr-auto" onClick={() => void remove().catch((e) => setError(String(e.message ?? e)))} disabled={busy || !editingId}>
                Delete
              </Button>
            )}
            <Button variant="outline" className="bg-card/30" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void save().catch((e) => setError(String(e.message ?? e)))} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adapter Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2">
              <div className="text-muted-foreground">Last checked</div>
              <div>{logsAdapter?.lastCheckedAt ? formatTime(logsAdapter.lastCheckedAt) : "—"}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2">
              <div className="text-muted-foreground">Last error</div>
              <div className="max-w-[260px] truncate">{logsAdapter?.lastError ?? "—"}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2">
              <div className="text-muted-foreground">Base URL</div>
              <div className="max-w-[260px] truncate">{logsAdapter?.baseUrl ?? "—"}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-card/30" onClick={() => setLogsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
