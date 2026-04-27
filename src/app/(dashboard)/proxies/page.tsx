"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useKswData } from "@/lib/ksw/provider";
import { cn } from "@/lib/utils";

export default function ProxiesPage() {
  const { state } = useKswData();
  const [importOpen, setImportOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [groupName, setGroupName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return state.proxies
      .map((g) => {
        const healthPct = g.proxiesCount === 0 ? 0 : g.healthyCount / g.proxiesCount;
        return { ...g, healthPct };
      })
      .sort((a, b) => b.healthPct - a.healthPct);
  }, [state.proxies]);

  async function callApi(path: string, init: RequestInit) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(path, {
        ...init,
        headers: { "content-type": "application/json", ...(init.headers ?? {}) },
      });
      const payload = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const msg =
          payload && typeof payload === "object" && "error" in payload
            ? String((payload as Record<string, unknown>).error)
            : `HTTP_${res.status}`;
        throw new Error(msg);
      }
      return payload;
    } finally {
      setBusy(false);
    }
  }

  function openImport() {
    setGroupName("");
    setRaw("");
    setError(null);
    setImportOpen(true);
  }

  async function importProxies() {
    await callApi("/api/proxies/import", { method: "POST", body: JSON.stringify({ raw, groupName }) });
    setImportOpen(false);
  }

  async function testGroup(id: string) {
    await callApi("/api/proxies/test", { method: "POST", body: JSON.stringify({ proxyGroupId: id }) });
  }

  function openEdit(id: string, name: string) {
    setEditGroupId(id);
    setEditName(name);
    setError(null);
    setEditOpen(true);
  }

  async function renameGroup() {
    if (!editGroupId) return;
    await callApi(`/api/proxy-groups/${editGroupId}`, { method: "PATCH", body: JSON.stringify({ name: editName }) });
    setEditOpen(false);
  }

  async function deleteGroup() {
    if (!editGroupId) return;
    await callApi(`/api/proxy-groups/${editGroupId}`, { method: "DELETE" });
    setEditOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Import proxies, run health checks, and track group latency.
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openImport}>
          Import Proxies
        </Button>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}

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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-card/30"
                          onClick={() => void testGroup(g.id).catch((e) => setError(String(e.message ?? e)))}
                          disabled={busy}
                        >
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-card/30"
                          onClick={() => openEdit(g.id, g.name)}
                          disabled={busy}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Proxies</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Proxy Group Name</div>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Proxies</div>
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={`host:port\nhost:port:user:pass\nuser:pass@host:port`}
                className="bg-card/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-card/30" onClick={() => setImportOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void importProxies().catch((e) => setError(String(e.message ?? e)))}
              disabled={busy}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Proxy Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Name</div>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-card/40" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-card/30 mr-auto"
              onClick={() => void deleteGroup().catch((e) => setError(String(e.message ?? e)))}
              disabled={busy || !editGroupId}
            >
              Delete
            </Button>
            <Button variant="outline" className="bg-card/30" onClick={() => setEditOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void renameGroup().catch((e) => setError(String(e.message ?? e)))}
              disabled={busy || !editGroupId}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
