import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Landmark,
  PiggyBank,
  BarChart3,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom bar */
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", shortLabel: "Txns", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", shortLabel: "Accounts", icon: Wallet },
  { href: "/loans", label: "Loans", shortLabel: "Loans", icon: Landmark },
  { href: "/budgets", label: "Budgets", shortLabel: "Budgets", icon: PiggyBank },
  { href: "/reports", label: "Reports", shortLabel: "Reports", icon: BarChart3 },
  { href: "/categories", label: "Categories", shortLabel: "Categories", icon: Tags },
];

/** First 4 get their own bottom-bar tab; the rest go in the "More" menu. */
export const BOTTOM_BAR_COUNT = 4;
