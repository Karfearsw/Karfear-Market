"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SeverityBadge } from "@/components/ksw/status-badge";
import { useKswData } from "@/lib/ksw/provider";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function EventTicker() {
  const { state } = useKswData();

  const items = useMemo(() => state.events.slice(0, 18), [state.events]);

  return (
    <Card className="border-border/70 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
          Live Events
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-2">
            {items.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug">{e.message}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatTime(e.at)}
                  </div>
                </div>
                <div className="shrink-0">
                  <SeverityBadge severity={e.severity} />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

