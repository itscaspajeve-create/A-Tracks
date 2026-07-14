"use client";

import { useState, useTransition } from "react";
import { Check, Pencil } from "lucide-react";

import { setBudget } from "@/lib/actions";
import { formatPeso } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";

interface Props {
  category: Category;
  limit: number | null;
  spent: number;
}

export function BudgetRow({ category, limit, spent }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(limit ? String(limit) : "");
  const [pending, startTransition] = useTransition();

  const pct = limit && limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit !== null && limit > 0 && spent > limit;

  function save() {
    const n = Number(value.replace(/[₱,\s]/g, ""));
    startTransition(async () => {
      await setBudget(category.id, Number.isFinite(n) ? n : 0);
      setEditing(false);
    });
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: category.color }}
            >
              <CategoryIcon icon={category.icon} className="h-4 w-4" />
            </span>
            <p className="truncate font-medium">{category.name}</p>
          </div>
          {editing ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                placeholder="0 = no budget"
                className="h-8 w-28 text-right"
              />
              <Button type="submit" size="icon" className="h-8 w-8" disabled={pending} aria-label="Save budget">
                <Check className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              {limit ? <span className="tnum">{formatPeso(limit)}/mo</span> : "Set budget"}
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>

        {limit ? (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className={cn("tnum", over ? "font-medium text-destructive" : "text-muted-foreground")}>
                {formatPeso(spent)} spent
              </span>
              <span className={cn("tnum", over ? "font-medium text-destructive" : "text-muted-foreground")}>
                {over ? `${formatPeso(spent - limit)} over` : `${formatPeso(limit - spent)} left`}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {spent > 0 ? `${formatPeso(spent)} spent this month — no budget set` : "No budget set"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
