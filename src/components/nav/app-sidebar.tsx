"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Gauge,
  HatGlasses,
  Layers3,
  PackageSearch,
  PlugZap,
  ScanEye,
  Settings2,
  ShieldEllipsis,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useKswData } from "@/lib/ksw/provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/catalog", label: "Catalog", icon: PackageSearch },
  { href: "/tasks", label: "Task Engine", icon: Activity },
  { href: "/monitors", label: "Monitors", icon: ScanEye },
  { href: "/hats", label: "Hats", icon: HatGlasses },
  { href: "/profiles", label: "Profiles", icon: Layers3 },
  { href: "/proxies", label: "Proxies", icon: ShieldEllipsis },
  { href: "/adapters", label: "Store Adapters", icon: PlugZap },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useKswData();

  return (
    <aside className="hidden md:flex w-[280px] shrink-0 border-r border-border/70 bg-sidebar text-sidebar-foreground">
      <div className="flex min-h-full w-full flex-col">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rounded-xl bg-primary/15 blur-[10px]" />
              <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-sidebar">
                <span className="font-heading text-[13px] tracking-[0.18em] text-primary">
                  KSW
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-heading text-sm tracking-[0.14em] uppercase leading-none">
                Karfear
              </div>
              <div className="mt-1 text-xs text-muted-foreground leading-none">
                Monitoring • Task Engine
              </div>
            </div>
          </div>
        </div>

        <Separator className="opacity-60" />

        <ScrollArea className="flex-1">
          <nav className="px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                      "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                      active &&
                        "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-ring/25"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] opacity-80 transition-opacity",
                        active ? "opacity-100" : "group-hover:opacity-100"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </ScrollArea>

        <Separator className="opacity-60" />

        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Engine</div>
            <div className="text-xs text-primary">{state.engine.queuePaused ? "Paused" : "Live"}</div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sidebar-accent/70">
            <div className={cn("h-full bg-primary/80", state.engine.queuePaused ? "w-1/4" : "w-full")} />
          </div>
        </div>
      </div>
    </aside>
  );
}
