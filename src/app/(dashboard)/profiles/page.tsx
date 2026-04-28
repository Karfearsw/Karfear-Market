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
import type { PaymentType, Profile } from "@/lib/ksw/types";

export default function ProfilesPage() {
  const { state } = useKswData();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [country, setCountry] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("card");
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingProfile = useMemo(
    () => (editingId ? state.profiles.find((p) => p.id === editingId) : undefined),
    [editingId, state.profiles]
  );

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setName("");
    setShippingName("");
    setCountry("");
    setPaymentType("card");
    setIsDefault(state.profiles.length === 0);
    setError(null);
    setOpen(true);
  }

  function openEdit(p: Profile) {
    setMode("edit");
    setEditingId(p.id);
    setName(p.name);
    setShippingName(p.shippingName);
    setCountry(p.country);
    setPaymentType(p.paymentType);
    setIsDefault(p.isDefault);
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
    if (mode === "create") {
      await callApi("/api/profiles", {
        method: "POST",
        body: JSON.stringify({ name, shippingName, country, paymentType, isDefault }),
      });
    } else if (editingId) {
      await callApi(`/api/profiles/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, shippingName, country, paymentType, isDefault }),
      });
    }
    setOpen(false);
  }

  async function duplicate(p: Profile) {
    await callApi("/api/profiles", {
      method: "POST",
      body: JSON.stringify({
        name: `${p.name} (copy)`,
        shippingName: p.shippingName,
        country: p.country,
        paymentType: p.paymentType,
        isDefault: false,
      }),
    });
  }

  async function setDefaultProfile(p: Profile) {
    await callApi(`/api/profiles/${p.id}`, { method: "PATCH", body: JSON.stringify({ isDefault: true }) });
  }

  async function removeProfile() {
    if (!editingId) return;
    await callApi(`/api/profiles/${editingId}`, { method: "DELETE" });
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Profiles are stored in Supabase.</div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
          New Profile
        </Button>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {state.profiles.map((p) => (
          <Card key={p.id} className="border-border/70 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm truncate">
                    {p.name}
                  </CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.shippingName} • {p.country}
                  </div>
                </div>
                {p.isDefault && (
                  <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
                    default
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Payment</div>
                  <div className="mt-1">{p.paymentType}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Country</div>
                  <div className="mt-1">{p.country}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" className="bg-card/30" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="bg-card/30"
                  onClick={() => void duplicate(p).catch((e) => setError(String(e.message ?? e)))}
                  disabled={busy}
                >
                  Duplicate
                </Button>
                <Button
                  className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => void setDefaultProfile(p).catch((e) => setError(String(e.message ?? e)))}
                  disabled={busy}
                >
                  Set Default
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New Profile" : "Edit Profile"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Shipping Name</div>
              <Input value={shippingName} onChange={(e) => setShippingName(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Country</div>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} className="bg-card/40" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Payment</div>
              <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                <TabsList className="bg-card/40">
                  <TabsTrigger value="card">Card</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                  <TabsTrigger value="crypto">Crypto</TabsTrigger>
                  <TabsTrigger value="unknown">Other</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2">
              <div>
                <div className="text-sm">Default</div>
                <div className="text-xs text-muted-foreground">Sets this profile as the default selection.</div>
              </div>
              <Button
                variant="outline"
                className="bg-card/30"
                onClick={() => setIsDefault((v) => !v)}
                disabled={busy}
              >
                {isDefault ? "Yes" : "No"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            {mode === "edit" && (
              <Button
                variant="outline"
                className="bg-card/30 mr-auto"
                onClick={() => void removeProfile().catch((e) => setError(String(e.message ?? e)))}
                disabled={busy || !editingProfile}
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-card/30"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
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
