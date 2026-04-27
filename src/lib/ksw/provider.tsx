"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Kpis, KswState, Task } from "@/lib/ksw/types";

type KswContextValue = {
  state: KswState;
  kpis: Kpis;
  getTaskById: (id: string) => Task | undefined;
};

const KswContext = createContext<KswContextValue | null>(null);

const emptyState: KswState = {
  monitors: [],
  tasks: [],
  hatAddOns: [],
  profiles: [],
  proxies: [],
  adapters: [],
  events: [],
  engine: { queuePaused: false, updatedAt: 0 },
};

function computeKpis(state: KswState): Kpis {
  const runningTasks = state.tasks.filter((t) => t.status === "running").length;

  const recent = state.tasks.filter((t) => Date.now() - t.lastUpdateAt < 1000 * 60 * 60 * 24);
  const finished = recent.filter((t) => t.status === "success" || t.status === "failed");
  const successes = finished.filter((t) => t.status === "success").length;
  const successRate24h = finished.length === 0 ? 0 : successes / finished.length;

  const proxies = state.proxies.map((p) => p.avgLatencyMs).sort((a, b) => a - b);
  const checkoutLatencyP50 =
    proxies.length === 0 ? 0 : proxies[Math.floor(proxies.length * 0.5)];

  const restocksToday = state.monitors.reduce((acc, m) => acc + m.hitsToday, 0);

  return { runningTasks, successRate24h, checkoutLatencyP50, restocksToday };
}

export function KswDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KswState>(() => emptyState);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as KswState;
        if (!cancelled) setState(data);
      } finally {
        inFlight = false;
      }
    }

    void refresh();
    const id = setInterval(() => void refresh(), 1500);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const kpis = useMemo(() => computeKpis(state), [state]);
  const getTaskById = useMemo(() => {
    const map = new Map(state.tasks.map((t) => [t.id, t]));
    return (id: string) => map.get(id);
  }, [state.tasks]);

  return (
    <KswContext.Provider value={{ state, kpis, getTaskById }}>
      {children}
    </KswContext.Provider>
  );
}

export function useKswData() {
  const ctx = useContext(KswContext);
  if (!ctx) throw new Error("useKswData must be used within KswDataProvider");
  return ctx;
}
