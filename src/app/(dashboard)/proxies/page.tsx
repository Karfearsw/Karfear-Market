"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKswData } from "@/lib/ksw/provider";
import { cn } from "@/lib/utils";

function sparklinePoints(seed: string, base: number) {
  const s = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: 16 }).map((_, i) => {
    const wave = Math.sin((i + s) * 0.7) * 0.35 + Math.cos((i + s) * 0.33) * 0.2;
    return base + wave * base * 0.12;
  });
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = values.map((v) => (max === min ? 0.5 : (v - min) / (max - min)));
  const points = norm
    .map((v, i) => {
      const x = (i / (norm.length - 1)) * 100;
      const y = 100 - v * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-8 w-28">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export default function ProxiesPage() {
  const { state } = useKswData();

  const rows = useMemo(() => {
    return state.proxies
      .map((g) => {
        const healthPct = g.proxiesCount === 0 ? 0 : g.healthyCount / g.proxiesCount;
        return { ...g, healthPct };
      })
      .sort((a, b) => b.healthPct - a.healthPct);
  }, [state.proxies]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Health and latency are simulated.
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Import Proxies
        </Button>
      </div>

      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Proxy Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Healthy</TableHead>
                  <TableHead>Avg Latency</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-sm">{g.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={cn(
                              "h-full",
                              g.healthPct > 0.85
                                ? "bg-emerald-500/70"
                                : g.healthPct > 0.7
                                ? "bg-amber-500/70"
                                : "bg-red-500/70"
                            )}
                            style={{ width: `${Math.round(g.healthPct * 100)}%` }}
                          />
                        </div>
                        <div className="text-sm tabular-nums">
                          {g.healthyCount}/{g.proxiesCount}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {g.avgLatencyMs}ms
                    </TableCell>
                    <TableCell className="text-primary">
                      <Sparkline values={sparklinePoints(g.name, g.avgLatencyMs)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="bg-card/30">
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
    </div>
  );
}

