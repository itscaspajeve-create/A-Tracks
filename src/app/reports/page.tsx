import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StackedCategoriesChart } from "@/components/charts/stacked-categories-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPeso, monthShort, trailingMonths } from "@/lib/format";
import {
  getCategoryStacks,
  getMonthlyTotals,
  getSpendByAccount,
  getSpendByCategory,
  type NamedTotal,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

const RANGES = [
  { key: "3", label: "3 months" },
  { key: "6", label: "6 months" },
  { key: "12", label: "12 months" },
] as const;

function TopList({ title, items }: { title: string; items: NamedTotal[] }) {
  const max = items[0]?.total ?? 0;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No expenses in this range.</p>
        ) : (
          <ol className="space-y-3">
            {items.slice(0, 5).map((item, i) => (
              <li key={item.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-medium">{item.name}</span>
                  </span>
                  <span className="tnum shrink-0">{formatPeso(item.total)}</span>
                </div>
                <div className="ml-6 mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${max > 0 ? (item.total / max) * 100 : 0}%`, backgroundColor: item.color }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage({ searchParams }: { searchParams: { range?: string } }) {
  const rangeKey = RANGES.some((r) => r.key === searchParams.range) ? searchParams.range! : "6";
  const months = trailingMonths(Number(rangeKey));
  const from = `${months[0]}-01`;
  const to = `${months[months.length - 1]}-31`;

  const totals = getMonthlyTotals(months);
  const { data: stacks, series } = getCategoryStacks(months);
  const topCategories = getSpendByCategory(from, to);
  const topAccounts = getSpendByAccount(from, to);
  const hasData = totals.some((t) => t.expenses > 0 || t.income > 0);

  return (
    <>
      <PageHeader title="Reports" description="Month-over-month view of where the money goes">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/reports?range=${r.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                rangeKey === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Nothing to report yet"
          description="Once you have transactions in this range, you’ll see trends, comparisons and top spending here."
        />
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Category breakdown over time</CardTitle>
            </CardHeader>
            <CardContent>
              <StackedCategoriesChart data={stacks} series={series} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Month-over-month comparison</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Δ expenses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totals
                    .slice()
                    .reverse()
                    .map((t, i, arr) => {
                      const prev = arr[i + 1];
                      const delta =
                        prev && prev.expenses > 0
                          ? ((t.expenses - prev.expenses) / prev.expenses) * 100
                          : null;
                      const net = t.income - t.expenses;
                      return (
                        <TableRow key={t.month}>
                          <TableCell className="font-medium">{monthShort(t.month)}</TableCell>
                          <TableCell className="tnum text-right">{formatPeso(t.income)}</TableCell>
                          <TableCell className="tnum text-right">{formatPeso(t.expenses)}</TableCell>
                          <TableCell
                            className={cn(
                              "tnum text-right font-medium",
                              net >= 0 ? "text-[var(--up-good)]" : "text-destructive"
                            )}
                          >
                            {formatPeso(net)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "tnum text-right",
                              delta === null
                                ? "text-muted-foreground"
                                : delta > 0
                                  ? "text-destructive"
                                  : "text-[var(--up-good)]"
                            )}
                          >
                            {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <TopList title="Top 5 categories" items={topCategories} />
            <TopList title="Top 5 accounts" items={topAccounts} />
          </div>
        </div>
      )}
    </>
  );
}
