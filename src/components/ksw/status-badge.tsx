import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Severity, TaskStatus } from "@/lib/ksw/types";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    queued: "bg-white/10 text-white border-white/15",
    running: "bg-primary/15 text-primary border-primary/25",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    failed: "bg-red-500/15 text-red-300 border-red-500/25",
    paused: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    canceled: "bg-white/10 text-white border-white/15",
  };

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", styles[status])}
    >
      {status}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    info: "bg-white/10 text-white border-white/15",
    warn: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    error: "bg-red-500/15 text-red-300 border-red-500/25",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  };

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", styles[severity])}
    >
      {severity}
    </Badge>
  );
}
