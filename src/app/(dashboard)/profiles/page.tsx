"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKswData } from "@/lib/ksw/provider";

export default function ProfilesPage() {
  const { state } = useKswData();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Profiles are placeholders (no secrets). Wire your real profile store later.
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          New Profile
        </Button>
      </div>

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
                <Button variant="outline" className="bg-card/30">
                  Edit
                </Button>
                <Button variant="outline" className="bg-card/30">
                  Duplicate
                </Button>
                <Button className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  Set Default
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

