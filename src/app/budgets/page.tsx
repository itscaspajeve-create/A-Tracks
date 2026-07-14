import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { BudgetRow } from "@/components/budgets/budget-row";
import { monthKey, monthLabel } from "@/lib/format";
import { getBudgets, getCategories, getSpendByCategory } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Budgets" };

export default function BudgetsPage({ searchParams }: { searchParams: { month?: string } }) {
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? "") ? searchParams.month! : monthKey();
  const categories = getCategories().filter((c) => c.name !== "Income");
  const budgets = new Map(getBudgets().map((b) => [b.category_id, b.monthly_limit]));
  const spend = new Map(getSpendByCategory(`${month}-01`, `${month}-31`).map((s) => [s.id, s.total]));

  const withBudget = categories.filter((c) => budgets.has(c.id));
  const withoutBudget = categories.filter((c) => !budgets.has(c.id));

  return (
    <>
      <PageHeader title="Budgets" description={`Budget vs. actual — ${monthLabel(month)}`}>
        <MonthPicker month={month} />
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {[...withBudget, ...withoutBudget].map((c) => (
          <BudgetRow
            key={c.id}
            category={c}
            limit={budgets.get(c.id) ?? null}
            spent={spend.get(c.id) ?? 0}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Tip: set a budget to 0 to remove it. Budgets apply to every month.
      </p>
    </>
  );
}
