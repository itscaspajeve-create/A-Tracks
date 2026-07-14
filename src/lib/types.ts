export type AccountType = "bank" | "e-wallet" | "loan" | "cash";
export type Direction = "income" | "expense";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  color: string;
  archived: 0 | 1;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface Transaction {
  id: number;
  date: string; // YYYY-MM-DD
  amount: number;
  direction: Direction;
  account_id: number;
  category_id: number | null;
  description: string;
  notes: string;
  is_recurring: 0 | 1;
}

export interface TransactionWithRefs extends Transaction {
  account_name: string;
  account_color: string;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface Loan {
  id: number;
  name: string;
  linked_account_id: number | null;
  principal: number;
  start_date: string;
  monthly_payment: number;
  due_day_1: number | null;
  due_day_2: number | null;
  remaining_balance: number;
}

export interface LoanWithRefs extends Loan {
  account_name: string | null;
  account_color: string | null;
}

export interface Budget {
  id: number;
  category_id: number;
  monthly_limit: number;
}
