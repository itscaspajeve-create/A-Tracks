import Link from "next/link";
import { ArrowLeftRight, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { ImportExport } from "@/components/transactions/import-export";
import { Button } from "@/components/ui/button";
import { getAccounts, getCategories, getTransactions } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Transactions" };

const PAGE_SIZE = 50;

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const filters = {
    account: Number(searchParams.account) || undefined,
    category: Number(searchParams.category) || undefined,
    from: searchParams.from,
    to: searchParams.to,
    q: searchParams.q,
    direction: searchParams.direction,
    sort: searchParams.sort,
    order: searchParams.order,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const accounts = getAccounts();
  const categories = getCategories();
  const { rows, total } = getTransactions(filters);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageLink = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v) params.set(k, v);
    params.set("page", String(p));
    return `/transactions?${params}`;
  };

  return (
    <>
      <PageHeader title="Transactions" description={`${total} record${total === 1 ? "" : "s"}`}>
        <ImportExport />
        <TransactionForm
          accounts={accounts}
          categories={categories}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          }
        />
      </PageHeader>

      <div className="mb-4">
        <TransactionFilters accounts={accounts} categories={categories} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Add your first transaction, adjust the filters, or import your spreadsheet history as CSV."
        />
      ) : (
        <>
          <TransactionsTable rows={rows} accounts={accounts} categories={categories} />
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageLink(page - 1)}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              <span className="text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageLink(page + 1)}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
