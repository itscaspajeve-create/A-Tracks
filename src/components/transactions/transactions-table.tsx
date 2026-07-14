"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Repeat, Trash2, X } from "lucide-react";

import { deleteFilteredTransactions, deleteTransaction, deleteTransactions } from "@/lib/actions";
import { formatDateShort, formatPeso } from "@/lib/format";
import type { TransactionFilters } from "@/lib/queries";
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
  total: number;
  filters: TransactionFilters;
}

const CHECKBOX_CLASS = "h-4 w-4 rounded border-input accent-primary cursor-pointer";

function RowCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className={CHECKBOX_CLASS}
      onClick={(e) => e.stopPropagation()}
    />
  );
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

export function TransactionsTable({ rows, accounts, categories, total, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "date";
  const order = searchParams.get("order") ?? "desc";

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someOnPageSelected = rows.some((r) => selected.has(r.id));
  const selectedCount = selectAllMatching ? total : selected.size;

  function toggleRow(id: number) {
    setSelectAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelectAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const r of rows) next.delete(r.id);
      } else {
        for (const r of rows) next.add(r.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setSelectAllMatching(false);
  }

  function confirmDelete() {
    startTransition(async () => {
      if (selectAllMatching) {
        await deleteFilteredTransactions(filters);
      } else {
        await deleteTransactions(Array.from(selected));
      }
      clearSelection();
      setConfirmOpen(false);
    });
  }

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
      {selectedCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">
            {selectAllMatching ? `All ${total}` : selectedCount} selected
          </span>
          {!selectAllMatching && allOnPageSelected && total > rows.length && (
            <button
              type="button"
              className="text-primary underline underline-offset-2"
              onClick={() => setSelectAllMatching(true)}
            >
              Select all {total} matching filters
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete {selectAllMatching ? "all" : "selected"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedCount} transaction{selectedCount === 1 ? "" : "s"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This can’t be undone.
                    {selectAllMatching &&
                      " This includes every transaction matching your current filters, not just this page."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={confirmDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                  }}
                  onChange={toggleAllOnPage}
                  aria-label="Select all on this page"
                  className={CHECKBOX_CLASS}
                />
              </TableHead>
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
              <TableRow key={txn.id} data-state={selected.has(txn.id) ? "selected" : undefined}>
                <TableCell>
                  <RowCheckbox
                    checked={selected.has(txn.id)}
                    onChange={() => toggleRow(txn.id)}
                    label={`Select transaction ${txn.description || txn.id}`}
                  />
                </TableCell>
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
          <div
            key={txn.id}
            className={cn(
              "rounded-xl border bg-card p-3 shadow-sm",
              selected.has(txn.id) && "border-primary/40 bg-primary/5"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="pt-0.5">
                  <RowCheckbox
                    checked={selected.has(txn.id)}
                    onChange={() => toggleRow(txn.id)}
                    label={`Select transaction ${txn.description || txn.id}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{txn.description || "—"}</span>
                    {txn.is_recurring === 1 && <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" />}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-muted-foreground">{formatDateShort(txn.date)}</p>
                </div>
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
