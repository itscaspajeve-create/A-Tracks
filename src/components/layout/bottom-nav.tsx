"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { ImageUp, LogOut, MoreHorizontal } from "lucide-react";

import { NAV_ITEMS, BOTTOM_BAR_COUNT } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AppIconDialog } from "@/components/layout/app-icon-dialog";
import { logoutAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Mobile-only bottom tab bar (thumb-reachable, 44px+ targets). */
export function BottomNav() {
  const pathname = usePathname();
  const [iconOpen, setIconOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const mainItems = NAV_ITEMS.slice(0, BOTTOM_BAR_COUNT);
  const moreItems = NAV_ITEMS.slice(BOTTOM_BAR_COUNT);
  const moreActive = moreItems.some((i) => pathname.startsWith(i.href));

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
      <AppIconDialog open={iconOpen} onOpenChange={setIconOpen} />
      <div className="grid grid-cols-5">
        {mainItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.shortLabel}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              moreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            {moreItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-3 py-2.5">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5"
              onSelect={() => setIconOpen(true)}
            >
              <ImageUp className="h-4 w-4" />
              Change app icon
            </DropdownMenuItem>
            <div className="px-1">
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5"
              disabled={pending}
              onSelect={() => startTransition(() => logoutAction())}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
