import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function HatStockBadge({ inStock }: { inStock: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        inStock
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
          : "bg-white/10 text-white border-white/15"
      )}
    >
      {inStock ? "in stock" : "oos"}
    </Badge>
  );
}

export function HatEnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        enabled
          ? "bg-primary/15 text-primary border-primary/25"
          : "bg-white/10 text-white border-white/15"
      )}
    >
      {enabled ? "enabled" : "disabled"}
    </Badge>
  );
}

