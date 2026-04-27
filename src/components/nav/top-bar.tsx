"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Live overview and latest events." },
  "/catalog": { title: "Catalog", subtitle: "Tops, shoes, pants, hats, and more." },
  "/tasks": { title: "Task Engine", subtitle: "Queue, states, and checkout runs." },
  "/monitors": { title: "Monitors", subtitle: "Signals, restocks, and detections." },
  "/hats": { title: "Hats", subtitle: "Hat add-ons, stock, and variants." },
  "/profiles": { title: "Profiles", subtitle: "Shipping, billing, and defaults." },
  "/proxies": { title: "Proxies", subtitle: "Groups, health, and latency." },
  "/adapters": {
    title: "Store Adapters",
    subtitle: "Shopify test stores and hybrid connectors.",
  },
  "/settings": { title: "Settings", subtitle: "Dashboard preferences (UI only)." },
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/tasks", label: "Task Engine" },
  { href: "/monitors", label: "Monitors" },
  { href: "/hats", label: "Hats" },
  { href: "/profiles", label: "Profiles" },
  { href: "/proxies", label: "Proxies" },
  { href: "/adapters", label: "Store Adapters" },
  { href: "/settings", label: "Settings" },
] as const;

export function TopBar() {
  const pathname = usePathname();

  const heading = useMemo(() => {
    const match = Object.keys(titles)
      .sort((a, b) => b.length - a.length)
      .find((key) => (key === "/" ? pathname === "/" : pathname.startsWith(key)));
    return titles[match ?? "/"];
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/55">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-card/30">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0">
              <SheetHeader className="px-5 py-4">
                <SheetTitle className="font-heading tracking-[0.14em] uppercase">
                  KSW
                </SheetTitle>
              </SheetHeader>
              <Separator className="opacity-60" />
              <ScrollArea className="h-[calc(100vh-72px)]">
                <nav className="px-3 py-4">
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                            "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                            active &&
                              "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-ring/25"
                          )}
                        >
                          <span>{item.label}</span>
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-lg tracking-[0.14em] uppercase">
              {heading.title}
            </h1>
            <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/20">
              Mock realtime
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{heading.subtitle}</p>
        </div>
        <div className="hidden lg:block w-[340px]">
          <Input
            placeholder="Search tasks, SKUs, profiles…"
            className="bg-card/40"
          />
        </div>
      </div>
    </header>
  );
}
