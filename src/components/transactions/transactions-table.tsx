"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Repeat, Trash2 } from "lucide-react";

import { deleteTransaction } from "@/lib/actions";
import { formatDateShort, formatPeso } from "@/lib/format";
import type { Account, Category, TransactionWithRefs } from "@/lib/types";
import { TransactionForm } from "./transaction-form";
import { EntityBadge } from "@/components/shared/entity-badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Props {
  rows: TransactionWithRefs[];
  accounts: Account[];
  categories: Category[];
}

function RowActions({ txn, accounts, categories }: { txn: TransactionWithRefs; accounts: Account[]; categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-end gap-0.5">
      <TransactionForm
        accounts={accounts}
        categories={categories}
        transaction={txn}
        trigger={
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              “{txn.description || "Untitled"}” · {formatPeso(txn.amount)} on {formatDateShort(txn.date)}. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => startTransition(() => deleteTransaction(txn.id))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Amount({ txn }: { txn: TransactionWithRefs }) {
  const income = txn.direction === "income";
  return (
    <span className={cn("tnum font-medium", income ? "text-[var(--up-good)]" : "")}>
      {income ? "+" : "−"}
      {formatPeso(txn.amount)}
    </span>
  );
}

export function TransactionsTable({ rows, accounts, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "date";
  const order = searchParams.get("order") ?? "desc";

  function toggleSort(col: "date" | "amount") {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === col) params.set("order", order === "desc" ? "asc" : "desc");
    else {
      params.set("sort", col);
      params.set("order", "desc");
    }
    router.push(`${pathname}?${params}`, { scroll: false });
  }

  function SortHeader({ col, children }: { col: "date" | "amount"; children: React.ReactNode }) {
    const active = sort === col;
    const Icon = !active ? ArrowUpDown : order === "desc" ? ArrowDown : ArrowUp;
    return (
      <button
        className={cn("flex items-center gap-1 font-medium", active && "text-foreground")}
        onClick={() => toggleSort(col)}
      >
        {children}
        <Icon className="h-3 w-3" />
      </button>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[110px]">
                <SortHeader col="date">Date</SortHeader>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">
                <span className="flex justify-end">
                  <SortHeader col="amount">Amount</SortHeader>
                </span>
              </TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell className="tnum whitespace-nowrap text-muted-foreground">
                  {formatDateShort(txn.date)}
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{txn.description || "—"}</span>
                    {txn.is_recurring === 1 && (
                      <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Recurring" />
                    )}
                  </span>
                  {txn.notes && <span className="block truncate text-xs text-muted-foreground">{txn.notes}</span>}
                </TableCell>
                <TableCell>
                  {txn.category_name ? (
                    <EntityBadge name={txn.category_name} color={txn.category_color!} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell>
                  <EntityBadge name={txn.account_name} color={txn.account_color} />
                </TableCell>
                <TableCell className="text-right">
                  <Amount txn={txn} />
                </TableCell>
                <TableCell>
                  <RowActions txn={txn} accounts={accounts} categories={categories} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((txn) => (
          <div key={txn.id} className="rounded-xl border bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{txn.description || "—"}</span>
                  {txn.is_recurring === 1 && <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" />}
                </p>
                <p className="tnum mt-0.5 text-xs text-muted-foreground">{formatDateShort(txn.date)}</p>
              </div>
              <Amount txn={txn} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {txn.category_name && <EntityBadge name={txn.category_name} color={txn.category_color!} />}
              <EntityBadge name={txn.account_name} color={txn.account_color} />
              <div className="ml-auto">
                <RowActions txn={txn} accounts={accounts} categories={categories} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
