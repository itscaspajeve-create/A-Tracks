"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Pencil } from "lucide-react";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AppLogo } from "@/components/layout/app-logo";
import { AppIconDialog } from "@/components/layout/app-icon-dialog";
import { logoutAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const [iconOpen, setIconOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card md:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <button
          type="button"
          onClick={() => setIconOpen(true)}
          className="group relative shrink-0 rounded-xl"
          title="Change app icon"
          aria-label="Change app icon"
        >
          <AppLogo size={36} />
          <span className="absolute inset-0 hidden items-center justify-center rounded-xl bg-black/50 text-white group-hover:flex">
            <Pencil className="h-3.5 w-3.5" />
          </span>
        </button>
        <div>
          <p className="text-sm font-semibold leading-tight">A Tracks</p>
          <p className="text-xs text-muted-foreground">Personal finance</p>
        </div>
      </div>
      <AppIconDialog open={iconOpen} onOpenChange={setIconOpen} />
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t p-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          disabled={pending}
          onClick={() => startTransition(() => logoutAction())}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
