"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { saveTransaction } from "@/lib/actions";
import { todayISO } from "@/lib/format";
import type { Account, Category, Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  trigger: React.ReactNode;
}

export function TransactionForm({ accounts, categories, transaction, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState(transaction?.direction ?? "expense");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("direction", direction);
    setError(null);
    startTransition(async () => {
      const res = await saveTransaction(formData);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {transaction && <input type="hidden" name="id" value={transaction.id} />}

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["expense", "income"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium capitalize transition-colors",
                  direction === d
                    ? d === "income"
                      ? "bg-card text-[var(--up-good)] shadow-sm"
                      : "bg-card text-destructive shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="txn-date">Date</Label>
              <Input
                id="txn-date"
                type="date"
                name="date"
                required
                defaultValue={transaction?.date ?? todayISO()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txn-amount">Amount (₱)</Label>
              <Input
                id="txn-amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                defaultValue={transaction?.amount ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Account</Label>
            <Select name="account_id" required defaultValue={transaction ? String(transaction.account_id) : undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                      {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              name="category_id"
              defaultValue={transaction?.category_id ? String(transaction.category_id) : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="txn-desc">Description</Label>
            <Input
              id="txn-desc"
              name="description"
              placeholder="e.g. SP: Cat Food"
              defaultValue={transaction?.description ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="txn-notes">Notes</Label>
            <Textarea
              id="txn-notes"
              name="notes"
              rows={2}
              placeholder="Optional"
              defaultValue={transaction?.notes ?? ""}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="txn-recurring" className="text-sm font-normal">
              Recurring (bill, subscription…)
            </Label>
            <Switch
              id="txn-recurring"
              name="is_recurring"
              defaultChecked={transaction?.is_recurring === 1}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {transaction ? "Save changes" : "Add transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
