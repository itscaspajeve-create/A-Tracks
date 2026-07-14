import { Landmark, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoanCard } from "@/components/loans/loan-card";
import { LoanForm } from "@/components/loans/loan-form";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { getAccounts, getLoans } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loans" };

export default function LoansPage() {
  const loans = getLoans();
  const accounts = getAccounts();
  const totalRemaining = loans.reduce((s, l) => s + l.remaining_balance, 0);
  const totalMonthly = loans
    .filter((l) => l.remaining_balance > 0)
    .reduce((s, l) => s + l.monthly_payment, 0);

  return (
    <>
      <PageHeader title="Loans & Installments" description="Everything you still owe, in one place">
        <LoanForm
          accounts={accounts}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add loan
            </Button>
          }
        />
      </PageHeader>

      {loans.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:max-w-md md:gap-4">
          <StatCard label="Total remaining debt" value={totalRemaining} tone="neutral" />
          <StatCard label="Committed per month" value={totalMonthly} tone="neutral" />
        </div>
      )}

      {loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No loans tracked yet"
          description="Add your SPayLater, GLoan, Atome plans or any other installment to see balances, due dates and payoff progress."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} accounts={accounts} />
          ))}
        </div>
      )}
    </>
  );
}
