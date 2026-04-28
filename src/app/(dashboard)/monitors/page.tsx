"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiJson } from "@/lib/api-client";
import { useKswData } from "@/lib/ksw/provider";
import type { Monitor, ProductCategory, StoreType } from "@/lib/ksw/types";

function formatTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MonitorsPage() {
  const { state } = useKswData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [store, setStore] = useState("");
  const [storeType, setStoreType] = useState<StoreType>("shopify");
  const [draftCategory, setDraftCategory] = useState<ProductCategory>("other");
  const [draftQuery, setDraftQuery] = useState("");
  const [sizes, setSizes] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.monitors
      .filter((m) => (category === "all" ? true : m.category === category))
      .filter((m) => (q ? m.query.toLowerCase().includes(q) || m.store.toLowerCase().includes(q) : true))
      .sort((a, b) => (b.lastHitAt ?? 0) - (a.lastHitAt ?? 0));
  }, [category, query, state.monitors]);

  const enabledCount = useMemo(
    () => state.monitors.filter((m) => m.enabled).length,
    [state.monitors]
  );

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setStore("");
    setStoreType("shopify");
    setDraftCategory("other");
    setDraftQuery("");
    setSizes("");
    setEnabled(true);
    setError(null);
    setOpen(true);
  }

  function openEdit(m: Monitor) {
    setMode("edit");
    setEditingId(m.id);
    setStore(m.store);
    setStoreType(m.storeType);
    setDraftCategory(m.category);
    setDraftQuery(m.query);
    setSizes(m.sizes.join(", "));
    setEnabled(m.enabled);
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
    const sizesArr = sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (mode === "create") {
      await callApi("/api/monitors", {
        method: "POST",
        body: JSON.stringify({
          store,
          storeType,
          category: draftCategory,
          query: draftQuery,
          sizes: sizesArr,
          enabled,
        }),
      });
    } else if (editingId) {
      await callApi(`/api/monitors/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          store,
          storeType,
          category: draftCategory,
          query: draftQuery,
          sizes: sizesArr,
          enabled,
        }),
      });
    }
    setOpen(false);
  }

  async function toggleEnabled(m: Monitor) {
    await callApi(`/api/monitors/${m.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !m.enabled }) });
  }

  async function enableAll() {
    await callApi("/api/monitors/batch", { method: "PATCH", body: JSON.stringify({ enabled: true }) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search monitors…"
              className="pl-9 bg-card/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={category}
              onValueChange={(v) => setCategory(v as ProductCategory | "all")}
            >
              <TabsList className="bg-card/40">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="shoes">Shoes</TabsTrigger>
                <TabsTrigger value="tops">Tops</TabsTrigger>
                <TabsTrigger value="pants">Pants</TabsTrigger>
                <TabsTrigger value="hats">Hats</TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
              {enabledCount}/{state.monitors.length} enabled
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-card/30" onClick={openCreate}>
            New Monitor
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => void enableAll().catch((e) => setError(String(e.message ?? e)))}
            disabled={busy}
          >
            Start All
          </Button>
        </div>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((m) => (
          <Card key={m.id} className="border-border/70 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm truncate">
                    {m.query}
                  </CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {m.store} • {m.storeType}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full bg-background/30 border-border/60"
                  >
                    {m.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      m.enabled
                        ? "rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                        : "rounded-full bg-white/10 text-white border-white/15"
                    }
                  >
                    {m.enabled ? "enabled" : "paused"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2">
                {m.sizes.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="rounded-full bg-background/30 border-border/60"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Hits Today</div>
                  <div className="mt-1 font-heading tracking-[0.12em] uppercase">
                    {m.hitsToday}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Hit</div>
                  <div className="mt-1">{formatTime(m.lastHitAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Actions</div>
                  <div className="mt-1 flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="bg-card/30" onClick={() => openEdit(m)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => void toggleEnabled(m).catch((e) => setError(String(e.message ?? e)))}
                      disabled={busy}
                    >
                      Toggle
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New Monitor" : "Edit Monitor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Store</div>
              <Input value={store} onChange={(e) => setStore(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Store Type</div>
              <Tabs value={storeType} onValueChange={(v) => setStoreType(v as StoreType)}>
                <TabsList className="bg-card/40">
                  <TabsTrigger value="shopify">Shopify</TabsTrigger>
                  <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Category</div>
              <Tabs value={draftCategory} onValueChange={(v) => setDraftCategory(v as ProductCategory)}>
                <TabsList className="bg-card/40">
                  <TabsTrigger value="shoes">Shoes</TabsTrigger>
                  <TabsTrigger value="tops">Tops</TabsTrigger>
                  <TabsTrigger value="pants">Pants</TabsTrigger>
                  <TabsTrigger value="hats">Hats</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Query</div>
              <Input value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Sizes (comma-separated)</div>
              <Input value={sizes} onChange={(e) => setSizes(e.target.value)} className="bg-card/40" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2">
              <div>
                <div className="text-sm">Enabled</div>
                <div className="text-xs text-muted-foreground">Controls whether the monitor runs in the worker.</div>
              </div>
              <Button variant="outline" className="bg-card/30" onClick={() => setEnabled((v) => !v)} disabled={busy}>
                {enabled ? "On" : "Off"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-card/30" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void save().catch((e) => setError(String(e.message ?? e)))}
              disabled={busy}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
