"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKswData } from "@/lib/ksw/provider";
import type { ProductCategory } from "@/lib/ksw/types";

function formatTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MonitorsPage() {
  const { state } = useKswData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");

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
          <Button variant="outline" className="bg-card/30">
            New Monitor
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start All
          </Button>
        </div>
      </div>

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
                    <Button variant="outline" size="sm" className="bg-card/30">
                      Edit
                    </Button>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Toggle
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
