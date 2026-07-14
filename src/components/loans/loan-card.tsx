"use client";

import { useState, useTransition } from "react";
import { CalendarClock, HandCoins, Loader2, Pencil, Trash2 } from "lucide-react";

import { deleteLoan, recordLoanPayment } from "@/lib/actions";
import { formatPeso, nextDueDate, todayISO } from "@/lib/format";
import type { Account, LoanWithRefs } from "@/lib/types";
import { LoanForm } from "./loan-form";
import { EntityBadge } from "@/components/shared/entity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function PaymentDialog({ loan }: { loan: LoanWithRefs }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("loan_id", String(loan.id));
    setError(null);
    startTransition(async () => {
      const res = await recordLoanPayment(formData);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <HandCoins className="h-3.5 w-3.5" />
          Log payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log payment — {loan.name}</DialogTitle>
          <DialogDescription>
            Reduces the remaining balance{loan.account_name ? ` and records an expense from ${loan.account_name}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`pay-amount-${loan.id}`}>Amount (₱)</Label>
              <Input
                id={`pay-amount-${loan.id}`}
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                defaultValue={loan.monthly_payment || ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pay-date-${loan.id}`}>Date</Label>
              <Input id={`pay-date-${loan.id}`} name="date" type="date" required defaultValue={todayISO()} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LoanCard({ loan, accounts }: { loan: LoanWithRefs; accounts: Account[] }) {
  const [pending, startTransition] = useTransition();
  const paid = Math.max(0, loan.principal - loan.remaining_balance);
  const pct = loan.principal > 0 ? Math.min(100, Math.round((paid / loan.principal) * 100)) : 0;
  const due = nextDueDate([loan.due_day_1 ?? 0, loan.due_day_2 ?? 0]);
  const paidOff = loan.remaining_balance <= 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium">{loan.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {loan.account_name && <EntityBadge name={loan.account_name} color={loan.account_color!} />}
              {paidOff ? (
                <span className="rounded-full bg-[var(--up-good)]/10 px-2 py-0.5 font-medium text-[var(--up-good)]">
                  Paid off
                </span>
              ) : (
                due && (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    next due{" "}
                    {due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!paidOff && <PaymentDialog loan={loan} />}
            <LoanForm
              accounts={accounts}
              loan={loan}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit loan">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete loan">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete “{loan.name}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Past payment transactions stay; only the loan record is removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => startTransition(() => deleteLoan(loan.id))}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Remaining</p>
            <p className="tnum font-semibold">{formatPeso(loan.remaining_balance)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Monthly</p>
            <p className="tnum font-semibold">{formatPeso(loan.monthly_payment)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Principal</p>
            <p className="tnum font-semibold">{formatPeso(loan.principal)}</p>
          </div>
        </div>

        <div className="mt-3">
          <Progress value={pct} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {pct}% paid · {formatPeso(paid)} of {formatPeso(loan.principal)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
