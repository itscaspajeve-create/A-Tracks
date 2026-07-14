"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Archive, ArchiveRestore, Pencil } from "lucide-react";

import { setAccountArchived } from "@/lib/actions";
import { formatPeso } from "@/lib/format";
import type { AccountStats } from "@/lib/queries";
import { AccountForm } from "./account-form";
import { Sparkline } from "@/components/charts/sparkline";
import { AccountTypeIcon } from "@/components/shared/account-type-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AccountCard({ stats }: { stats: AccountStats }) {
  const { account, spentThisMonth, spentAllTime, trend } = stats;
  const [pending, startTransition] = useTransition();
  const archived = account.archived === 1;

  return (
    <Card className={cn("shadow-sm", archived && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: account.color }}
            >
              <AccountTypeIcon type={account.type} className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium leading-tight">{account.name}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {account.type}
                {archived && " · archived"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <AccountForm
              account={account}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit account">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={pending}
              aria-label={archived ? "Restore account" : "Archive account"}
              onClick={() => startTransition(() => setAccountArchived(account.id, !archived))}
            >
              {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">This month</p>
            <p className="tnum text-lg font-semibold">{formatPeso(spentThisMonth)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">All-time</p>
            <p className="tnum text-lg font-semibold">{formatPeso(spentAllTime)}</p>
          </div>
        </div>

        <div className="mt-2">
          <Sparkline data={trend} color={account.color} />
          <p className="text-right text-[10px] text-muted-foreground">last 6 months</p>
        </div>

        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link href={`/transactions?account=${account.id}`}>View transactions</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
