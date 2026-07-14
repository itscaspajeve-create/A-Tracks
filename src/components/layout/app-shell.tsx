"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

/** Full app chrome (sidebar + bottom bar) everywhere except the sign-in screen. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <div className="min-h-dvh">{children}</div>;
  }
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <main className="pb-24 pt-4 md:ml-60 md:pb-10 md:pt-8">
        <div className="container max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
