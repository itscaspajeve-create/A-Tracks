import Link from "next/link";
import { PieChart, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { AccountBarChart } from "@/components/charts/account-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { monthKey, monthLabel, trailingMonths } from "@/lib/format";
import {
  getMonthlyTotals,
  getMonthSummary,
  getSpendByAccount,
  getSpendByCategory,
} from "@/lib/queries";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  requireAuth();
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? "") ? searchParams.month! : monthKey();
  const from = `${month}-01`;
  const to = `${month}-31`;

  const summary = getMonthSummary(month);
  const months = trailingMonths(12, month < monthKey() ? monthKey() : month);
  const trend = getMonthlyTotals(months);
  const byCategory = getSpendByCategory(from, to);
  const byAccount = getSpendByAccount(from, to);

  return (
    <>
      <PageHeader title="Dashboard" description={`Your money at a glance — ${monthLabel(month)}`}>
        <MonthPicker month={month} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard label="Spent this month" value={summary.spentThisMonth} tone="neutral" />
        <StatCard label="Income this month" value={summary.incomeThisMonth} tone="neutral" />
        <StatCard
          label="Net this month"
          value={summary.net}
          tone={summary.net >= 0 ? "positive" : "negative"}
          sub={summary.net >= 0 ? "Income exceeds spending" : "Spending exceeds income"}
        />
        <StatCard label="Spent all-time" value={summary.spentAllTime} tone="neutral" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly spending — trailing 12 months</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={trend} highlight={month} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="No expenses this month"
                description="Add a transaction or pick a different month to see the breakdown."
              >
                <Button asChild size="sm" variant="outline">
                  <Link href="/transactions">Go to transactions</Link>
                </Button>
              </EmptyState>
            ) : (
              <CategoryDonut data={byCategory} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by account</CardTitle>
          </CardHeader>
          <CardContent>
            {byAccount.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Nothing ran through your accounts"
                description="Expenses will show up here per account once recorded."
              />
            ) : (
              <AccountBarChart data={byAccount} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
