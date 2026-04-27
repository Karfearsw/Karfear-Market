import type { ReactNode } from "react";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { TopBar } from "@/components/nav/top-bar";
import { KswDataProvider } from "@/lib/ksw/provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <KswDataProvider>
      <div className="min-h-full flex flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex min-w-0 flex-1 flex-col px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </KswDataProvider>
  );
}
