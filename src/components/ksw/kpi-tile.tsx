import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/50">
      <div
        className={cn(
          "pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full blur-[42px]",
          accent === "primary" ? "bg-primary/12" : "bg-white/6"
        )}
      />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs tracking-[0.14em] uppercase text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 font-heading text-2xl tracking-[0.08em]">
              {value}
            </div>
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
          </div>
          {icon && (
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-background/40 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

