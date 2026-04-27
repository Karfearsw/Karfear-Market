"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { ProductCategory } from "@/lib/ksw/types";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  store: string;
  storeType: "shopify" | "hybrid";
};

type CatalogVariant = {
  id: string;
  catalogItemId: string;
  sku: string;
  size: string | null;
  color: string;
  priceCents: number | null;
  inStock: boolean;
  lastSeenAt: string | null;
};

const categories: Array<ProductCategory | "all"> = [
  "all",
  "tops",
  "shoes",
  "pants",
  "hats",
  "outerwear",
  "accessories",
  "other",
];

function formatTime(ts: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function money(cents: number | null) {
  if (cents === null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CatalogPage() {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/catalog${category === "all" ? "" : `?category=${category}`}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items: CatalogItem[]; variants: CatalogVariant[] };
      if (cancelled) return;
      setItems(data.items ?? []);
      setVariants(data.variants ?? []);
    }

    void load();
    const id = setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [category]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return variants
      .filter((v) => (inStockOnly ? v.inStock : true))
      .filter((v) => {
        const item = itemById.get(v.catalogItemId);
        if (!item) return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.store.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          (v.size ? v.size.toLowerCase().includes(q) : false)
        );
      })
      .slice(0, 300);
  }, [inStockOnly, itemById, query, variants]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search catalog by name, SKU, color…"
              className="pl-9 bg-card/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={category}
              onValueChange={(v) => setCategory(v as ProductCategory | "all")}
            >
              <TabsList className="bg-card/40">
                {categories.map((c) => (
                  <TabsTrigger key={c} value={c}>
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <button
              type="button"
              onClick={() => setInStockOnly((v) => !v)}
              className="rounded-full"
            >
              <Badge
                className={
                  inStockOnly
                    ? "rounded-full bg-primary/15 text-primary hover:bg-primary/20"
                    : "rounded-full bg-white/10 text-white hover:bg-white/15"
                }
              >
                {inStockOnly ? "In-stock only" : "All stock"}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Catalog
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => {
                  const item = itemById.get(v.catalogItemId);
                  if (!item) return null;
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.storeType}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {v.sku}
                      </TableCell>
                      <TableCell className="text-sm">{v.size ?? "—"}</TableCell>
                      <TableCell className="text-sm">{v.color}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {money(v.priceCents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            v.inStock
                              ? "rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                              : "rounded-full bg-white/10 text-white border-white/15"
                          }
                        >
                          {v.inStock ? "in stock" : "oos"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatTime(v.lastSeenAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

