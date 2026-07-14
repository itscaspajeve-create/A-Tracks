import { Banknote, CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";
import type { AccountType } from "@/lib/types";

const ICONS: Record<AccountType, LucideIcon> = {
  bank: Landmark,
  "e-wallet": Wallet,
  loan: CreditCard,
  cash: Banknote,
};

export function AccountTypeIcon({ type, className }: { type: AccountType; className?: string }) {
  const Icon = ICONS[type] ?? Landmark;
  return <Icon className={className ?? "h-4 w-4"} />;
}
