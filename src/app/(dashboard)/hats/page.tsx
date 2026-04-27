"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { HatEnabledBadge, HatStockBadge } from "@/components/ksw/hat-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function formatTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type HatFilter = "all" | "enabled" | "in_stock";

export default function HatsPage() {
  const { state } = useKswData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HatFilter>("all");

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
          <Button variant="outline" className="bg-card/30">
            Import
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            New Hat Add-on
          </Button>
        </div>
      </div>

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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

