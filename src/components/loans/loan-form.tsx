"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { saveLoan } from "@/lib/actions";
import { todayISO } from "@/lib/format";
import type { Account, Loan } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LoanForm({
  accounts,
  loan,
  trigger,
}: {
  accounts: Account[];
  loan?: Loan;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await saveLoan(formData);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit loan" : "Add loan / installment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {loan && <input type="hidden" name="id" value={loan.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="loan-name">Name</Label>
            <Input id="loan-name" name="name" required placeholder="e.g. GLoan, Atome — phone" defaultValue={loan?.name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Paid from account</Label>
            <Select
              name="linked_account_id"
              defaultValue={loan?.linked_account_id ? String(loan.linked_account_id) : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-principal">Principal (₱)</Label>
              <Input id="loan-principal" name="principal" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={loan?.principal ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-remaining">Remaining (₱)</Label>
              <Input id="loan-remaining" name="remaining_balance" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={loan?.remaining_balance ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-start">Start date</Label>
              <Input id="loan-start" type="date" name="start_date" required defaultValue={loan?.start_date ?? todayISO()} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-monthly">Monthly payment (₱)</Label>
              <Input id="loan-monthly" name="monthly_payment" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={loan?.monthly_payment ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-due1">Due day 1</Label>
              <Input id="loan-due1" name="due_day_1" type="number" min="1" max="31" placeholder="e.g. 15" defaultValue={loan?.due_day_1 ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-due2">Due day 2</Label>
              <Input id="loan-due2" name="due_day_2" type="number" min="1" max="31" placeholder="e.g. 31" defaultValue={loan?.due_day_2 ?? ""} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Two due days cover bills paid in two installments per month (e.g. the 15th and end of month —
            use 31 for “last day”).
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loan ? "Save changes" : "Add loan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
