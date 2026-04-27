"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKswData } from "@/lib/ksw/provider";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AdaptersPage() {
  const { state } = useKswData();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Adapters represent site-specific parsing + checkout logic.
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          Add Adapter
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {state.adapters.map((a) => (
          <Card key={a.id} className="border-border/70 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm truncate">
                    {a.name}
                  </CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Type: {a.type} • Last sync {formatTime(a.lastSyncAt)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    a.connected
                      ? "rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                      : "rounded-full bg-red-500/15 text-red-300 border-red-500/25"
                  }
                >
                  {a.connected ? "connected" : "offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2">
                {a.capabilities.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="rounded-full bg-background/30 border-border/60"
                  >
                    {c.replaceAll("_", " ")}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" className="bg-card/30">
                  Configure
                </Button>
                <Button variant="outline" className="bg-card/30">
                  View Logs
                </Button>
                <Button className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

