import { Plus, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { trailingMonths } from "@/lib/format";
import { getAccountStats } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accounts" };

export default function AccountsPage() {
  const stats = getAccountStats(trailingMonths(6));
  const active = stats.filter((s) => s.account.archived === 0);
  const archived = stats.filter((s) => s.account.archived === 1);

  return (
    <>
      <PageHeader title="Accounts" description="Banks, e-wallets and credit lines">
        <AccountForm
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add account
            </Button>
          }
        />
      </PageHeader>

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first bank, e-wallet or credit line to start tracking."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {active.map((s) => (
              <AccountCard key={s.account.id} stats={s} />
            ))}
          </div>
          {archived.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">Archived</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
                {archived.map((s) => (
                  <AccountCard key={s.account.id} stats={s} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
