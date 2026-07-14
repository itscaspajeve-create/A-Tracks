"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthKey, monthLabel, shiftMonth } from "@/lib/format";

/** Prev/next month stepper that drives the `?month=` search param. */
export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = monthKey();

  function go(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === current) params.delete("month");
    else params.set("month", next);
    router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => go(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[7.5rem] text-center text-sm font-medium">{monthLabel(month)}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => go(shiftMonth(month, 1))}
        disabled={month >= current}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
