"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { HatEnabledBadge, HatStockBadge } from "@/components/ksw/hat-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKswData } from "@/lib/ksw/provider";
import { apiJson } from "@/lib/api-client";
import type { HatAddOn, StoreType } from "@/lib/ksw/types";

function formatTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type HatFilter = "all" | "enabled" | "in_stock";

export default function HatsPage() {
  const { state } = useKswData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HatFilter>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<HatAddOn | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [color, setColor] = useState("");
  const [store, setStore] = useState("");
  const [storeType, setStoreType] = useState<StoreType>("shopify");
  const [enabledDraft, setEnabledDraft] = useState(true);
  const [inStockDraft, setInStockDraft] = useState(false);
  const [priceCents, setPriceCents] = useState("");
  const [importRaw, setImportRaw] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.hatAddOns
      .filter((h) => {
        if (filter === "enabled" && !h.enabled) return false;
        if (filter === "in_stock" && !h.inStock) return false;
        if (!q) return true;
        return (
          h.name.toLowerCase().includes(q) ||
          h.sku.toLowerCase().includes(q) ||
          h.color.toLowerCase().includes(q) ||
          h.store.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0));
  }, [filter, query, state.hatAddOns]);

  const summary = useMemo(() => {
    const total = state.hatAddOns.length;
    const enabled = state.hatAddOns.filter((h) => h.enabled).length;
    const inStock = state.hatAddOns.filter((h) => h.inStock).length;
    const lastSeen = Math.max(...state.hatAddOns.map((h) => h.lastSeenAt ?? 0), 0);
    return { total, enabled, inStock, lastSeen };
  }, [state.hatAddOns]);

  async function callApi(path: string, init: RequestInit) {
    setError(null);
    setBusy(true);
    try {
      return await apiJson(path, init);
    } finally {
      setBusy(false);
    }
  }

  function openNew() {
    setName("");
    setSku("");
    setColor("");
    setStore("");
    setStoreType("shopify");
    setEnabledDraft(true);
    setInStockDraft(false);
    setPriceCents("");
    setError(null);
    setNewOpen(true);
  }

  function openEdit(h: HatAddOn) {
    setEditing(h);
    setEnabledDraft(h.enabled);
    setInStockDraft(h.inStock);
    setPriceCents(h.priceCents ? String(h.priceCents) : "");
    setError(null);
    setEditOpen(true);
  }

  async function createHat() {
    const price = priceCents.trim() ? Number(priceCents) : null;
    await callApi("/api/add-ons", {
      method: "POST",
      body: JSON.stringify({
        type: "hat",
        name,
        sku,
        color,
        store,
        storeType,
        enabled: enabledDraft,
        inStock: inStockDraft,
        priceCents: typeof price === "number" && Number.isFinite(price) ? price : undefined,
      }),
    });
    setNewOpen(false);
  }

  async function updateHat() {
    if (!editing) return;
    const price = priceCents.trim() ? Number(priceCents) : null;
    await callApi(`/api/add-ons/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        enabled: enabledDraft,
        inStock: inStockDraft,
        priceCents: typeof price === "number" && Number.isFinite(price) ? price : undefined,
      }),
    });
    setEditOpen(false);
  }

  async function importHats() {
    const lines = importRaw
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      const [n, s, c, st, stType, pc] = parts;
      if (!n || !s || !c || !st) continue;
      const p = pc ? Number(pc) : undefined;
      await callApi("/api/add-ons", {
        method: "POST",
        body: JSON.stringify({
          type: "hat",
          name: n,
          sku: s,
          color: c,
          store: st,
          storeType: stType === "hybrid" ? "hybrid" : "shopify",
          enabled: true,
          inStock: false,
          priceCents: typeof p === "number" && Number.isFinite(p) ? p : undefined,
        }),
      });
    }

    setImportOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hats by name, SKU, color…"
              className="pl-9 bg-card/40"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as HatFilter)}>
            <TabsList className="bg-card/40">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="enabled">Enabled</TabsTrigger>
              <TabsTrigger value="in_stock">In Stock</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-card/30" onClick={() => setImportOpen(true)} disabled={busy}>
            Import
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openNew} disabled={busy}>
            New Hat Add-on
          </Button>
        </div>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="font-heading text-2xl tracking-[0.08em]">
              {summary.total}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
              Enabled
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="font-heading text-2xl tracking-[0.08em]">
              {summary.enabled}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="font-heading text-2xl tracking-[0.08em]">
              {summary.inStock}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
              Last Seen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-muted-foreground">{formatTime(summary.lastSeen)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Hat Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Last Seen</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">{h.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {h.sku}
                    </TableCell>
                    <TableCell className="text-sm">{h.color}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.storeType}
                    </TableCell>
                    <TableCell>
                      <HatEnabledBadge enabled={h.enabled} />
                    </TableCell>
                    <TableCell>
                      <HatStockBadge inStock={h.inStock} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatTime(h.lastSeenAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="bg-card/30" onClick={() => openEdit(h)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Hat Add-on</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">SKU</div>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} className="bg-card/40" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Color</div>
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="bg-card/40" />
              </div>
            </div>
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
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Enabled</div>
                <Button variant="outline" className="bg-card/30 w-full" onClick={() => setEnabledDraft((v) => !v)} disabled={busy}>
                  {enabledDraft ? "On" : "Off"}
                </Button>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">In Stock</div>
                <Button variant="outline" className="bg-card/30 w-full" onClick={() => setInStockDraft((v) => !v)} disabled={busy}>
                  {inStockDraft ? "Yes" : "No"}
                </Button>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Price Cents</div>
                <Input value={priceCents} onChange={(e) => setPriceCents(e.target.value)} className="bg-card/40" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-card/30" onClick={() => setNewOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void createHat().catch((e) => setError(String(e.message ?? e)))} disabled={busy}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Hat Add-on</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/30 px-3 py-2 text-sm">
              <div className="font-heading tracking-[0.12em] uppercase text-xs text-muted-foreground">
                {editing?.name ?? "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {editing?.sku ?? ""} • {editing?.color ?? ""} • {editing?.storeType ?? ""}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Enabled</div>
                <Button variant="outline" className="bg-card/30 w-full" onClick={() => setEnabledDraft((v) => !v)} disabled={busy}>
                  {enabledDraft ? "On" : "Off"}
                </Button>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">In Stock</div>
                <Button variant="outline" className="bg-card/30 w-full" onClick={() => setInStockDraft((v) => !v)} disabled={busy}>
                  {inStockDraft ? "Yes" : "No"}
                </Button>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Price Cents</div>
                <Input value={priceCents} onChange={(e) => setPriceCents(e.target.value)} className="bg-card/40" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-card/30" onClick={() => setEditOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void updateHat().catch((e) => setError(String(e.message ?? e)))} disabled={busy || !editing}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Hat Add-ons</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">CSV Lines (name,sku,color,store,storeType,priceCents)</div>
            <Textarea value={importRaw} onChange={(e) => setImportRaw(e.target.value)} className="bg-card/40" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-card/30" onClick={() => setImportOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void importHats().catch((e) => setError(String(e.message ?? e)))} disabled={busy}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
