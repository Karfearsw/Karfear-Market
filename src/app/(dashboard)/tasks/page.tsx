"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Pin, Search } from "lucide-react";
import { HatStockBadge } from "@/components/ksw/hat-badge";
import { TaskStatusBadge } from "@/components/ksw/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { HatAddOn, TaskStatus } from "@/lib/ksw/types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TasksPage() {
  const { state, getTaskById } = useKswData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hatById = useMemo(() => {
    return new Map(state.hatAddOns.map((h) => [h.id, h]));
  }, [state.hatAddOns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.tasks
      .filter((t) => (status === "all" ? true : t.status === status))
      .filter((t) => {
        if (!q) return true;
        return (
          t.id.toLowerCase().includes(q) ||
          t.target.toLowerCase().includes(q) ||
          t.store.toLowerCase().includes(q) ||
          t.profileName.toLowerCase().includes(q) ||
          t.proxyGroupName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.lastUpdateAt - a.lastUpdateAt);
  }, [query, state.tasks, status]);

  const selected = selectedTaskId ? getTaskById(selectedTaskId) : undefined;
  const selectedHats = useMemo(() => {
    if (!selected) return [];
    return selected.addOnIds
      .map((id) => hatById.get(id))
      .filter((h): h is HatAddOn => h !== undefined);
  }, [hatById, selected]);

  async function callApi(path: string, init: RequestInit) {
    setError(null);
    setBusy(true);
    try {
      return await apiJson(path, init);
    } finally {
      setBusy(false);
    }
  }

  async function toggleQueue() {
    await callApi("/api/engine/queue", {
      method: "PATCH",
      body: JSON.stringify({ queuePaused: !state.engine.queuePaused }),
    });
  }

  async function startTasks() {
    if (state.engine.queuePaused) {
      await callApi("/api/engine/queue", {
        method: "PATCH",
        body: JSON.stringify({ queuePaused: false }),
      });
    }
    await callApi("/api/tasks/batch/requeue", { method: "POST" });
  }

  async function stopTask(id: string) {
    await callApi(`/api/tasks/${id}/cancel`, { method: "POST" });
  }

  async function retryTask(id: string) {
    await callApi(`/api/tasks/${id}/retry`, { method: "POST" });
  }

  async function togglePinned(id: string, pinned: boolean) {
    await callApi(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ pinned }) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks by store, target, id…"
              className="pl-9 bg-card/40"
            />
          </div>
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as TaskStatus | "all")}
          >
            <TabsList className="bg-card/40">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="queued">Queued</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-card/30"
            onClick={() => void toggleQueue().catch((e) => setError(String(e.message ?? e)))}
            disabled={busy}
          >
            {state.engine.queuePaused ? "Resume Queue" : "Pause Queue"}
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => void startTasks().catch((e) => setError(String(e.message ?? e)))}
            disabled={busy}
          >
            Start Tasks
          </Button>
        </div>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}

      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Task List
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Id</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Add-ons</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Proxy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {t.pinned && (
                          <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
                            pinned
                          </Badge>
                        )}
                        <span>{t.id.slice(0, 10)}…</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.storeType}</TableCell>
                    <TableCell className="text-sm">{t.target}</TableCell>
                    <TableCell className="text-sm">{t.size}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.addOnIds.length ? `${t.addOnIds.length} hat` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{t.profileName}</TableCell>
                    <TableCell className="text-sm">{t.proxyGroupName}</TableCell>
                    <TableCell>
                      <TaskStatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.step}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatTime(t.lastUpdateAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTaskId(t.id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedTaskId}
        onOpenChange={(open) => setSelectedTaskId(open ? selectedTaskId : null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-[520px]">
          <SheetHeader>
            <SheetTitle className="font-heading tracking-[0.14em] uppercase">
              Task Details
            </SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-4">
            {!selected ? (
              <div className="text-sm text-muted-foreground">No task selected.</div>
            ) : (
              <>
                <Card className="border-border/70 bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-heading tracking-[0.14em] uppercase text-sm">
                          {selected.target}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {selected.store} • {selected.storeType}
                        </div>
                      </div>
                      <TaskStatusBadge status={selected.status} />
                    </div>
                    <Separator className="my-4 opacity-60" />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Size</div>
                        <div className="mt-1">{selected.size}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Step</div>
                        <div className="mt-1">{selected.step}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Profile</div>
                        <div className="mt-1">{selected.profileName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Proxy Group</div>
                        <div className="mt-1">{selected.proxyGroupName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Retries</div>
                        <div className="mt-1">{selected.retries}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Last HTTP</div>
                        <div className="mt-1">
                          {selected.lastHttpStatus ?? "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Updated</div>
                        <div className="mt-1">{formatTime(selected.lastUpdateAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Id</div>
                        <div className="mt-1 font-mono text-xs">
                          {selected.id}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4 opacity-60" />
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Hat add-ons</div>
                      {selectedHats.length === 0 ? (
                        <div className="mt-2 text-sm text-muted-foreground">None</div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {selectedHats.map((h) => (
                            <div
                              key={h.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="text-sm">{h.name}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {h.color} • {h.storeType}
                                </div>
                              </div>
                              <HatStockBadge inStock={h.inStock} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
                      Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="bg-card/30"
                        onClick={() =>
                          selected
                            ? void stopTask(selected.id).catch((e) => setError(String(e.message ?? e)))
                            : undefined
                        }
                        disabled={!selected || busy}
                      >
                        Stop
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-card/30"
                        onClick={() =>
                          selected
                            ? void retryTask(selected.id).catch((e) => setError(String(e.message ?? e)))
                            : undefined
                        }
                        disabled={!selected || busy}
                      >
                        Retry
                      </Button>
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() =>
                          selected
                            ? void togglePinned(selected.id, !selected.pinned).catch((e) =>
                                setError(String(e.message ?? e))
                              )
                            : undefined
                        }
                        disabled={!selected || busy}
                      >
                        <Pin className="h-4 w-4" />
                        <span className="ml-2">{selected?.pinned ? "Unpin" : "Pin"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
