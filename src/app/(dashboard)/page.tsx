"use client";

import { useMemo } from "react";
import { Activity, HatGlasses, Radar, Timer, Zap } from "lucide-react";
import { EventTicker } from "@/components/ksw/event-ticker";
import { KpiTile } from "@/components/ksw/kpi-tile";
import { TaskStatusBadge } from "@/components/ksw/status-badge";
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

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default function DashboardPage() {
  const { state, kpis } = useKswData();

  const recentTasks = useMemo(() => {
    return [...state.tasks]
      .sort((a, b) => b.lastUpdateAt - a.lastUpdateAt)
      .slice(0, 8);
  }, [state.tasks]);

  const activeMonitors = useMemo(() => {
    const enabled = state.monitors.filter((m) => m.enabled).length;
    return { enabled, total: state.monitors.length };
  }, [state.monitors]);

  const hatsSummary = useMemo(() => {
    const enabled = state.hatAddOns.filter((h) => h.enabled).length;
    const inStock = state.hatAddOns.filter((h) => h.enabled && h.inStock).length;
    return { enabled, inStock };
  }, [state.hatAddOns]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiTile
          label="Tasks Running"
          value={`${kpis.runningTasks}`}
          hint="Mock realtime updates"
          icon={<Activity className="h-5 w-5" />}
          accent="primary"
        />
        <KpiTile
          label="Success Rate (24h)"
          value={pct(kpis.successRate24h)}
          hint="Derived from last update timestamps"
          icon={<Zap className="h-5 w-5" />}
        />
        <KpiTile
          label="Checkout Latency P50"
          value={`${kpis.checkoutLatencyP50}ms`}
          hint="Proxy latency proxy"
          icon={<Timer className="h-5 w-5" />}
        />
        <KpiTile
          label="Restocks Today"
          value={`${kpis.restocksToday}`}
          hint={`${activeMonitors.enabled}/${activeMonitors.total} monitors enabled`}
          icon={<Radar className="h-5 w-5" />}
          accent="primary"
        />
        <KpiTile
          label="Hats In Stock"
          value={`${hatsSummary.inStock}`}
          hint={`${hatsSummary.enabled} enabled add-ons`}
          icon={<HatGlasses className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
              Recent Task Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Task</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Retries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.id.slice(0, 10)}…
                      </TableCell>
                      <TableCell className="text-sm">{t.storeType}</TableCell>
                      <TableCell className="text-sm">{t.target}</TableCell>
                      <TableCell className="text-sm">{t.size}</TableCell>
                      <TableCell>
                        <TaskStatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-right text-sm">{t.retries}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <EventTicker />
      </div>
    </div>
  );
}
