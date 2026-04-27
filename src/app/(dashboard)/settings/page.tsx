"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Realtime mode</div>
            <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
              mock
            </Badge>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Swap the provider implementation to SSE/WebSocket when the bot backend is ready.
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading tracking-[0.14em] uppercase text-sm">
            Preferences (UI only)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            Theme is locked to black/white/red (always dark) in this build.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

