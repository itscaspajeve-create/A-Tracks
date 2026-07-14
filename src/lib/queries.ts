import { getDb } from "./db";
import type {
  Account,
  Budget,
  Category,
  LoanWithRefs,
  TransactionWithRefs,
} from "./types";

export function getAccounts(includeArchived = false): Account[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM accounts ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY archived, name`
    )
    .all() as Account[];
}

export function getCategories(): Category[] {
  const db = getDb();
  return db.prepare("SELECT * FROM categories ORDER BY name").all() as Category[];
}

export interface TransactionFilters {
  account?: number;
  category?: number;
  from?: string;
  to?: string;
  q?: string;
  direction?: string;
  sort?: string; // "date" | "amount"
  order?: string; // "asc" | "desc"
  limit?: number;
  offset?: number;
}

const TXN_SELECT = `
  SELECT t.*,
         a.name AS account_name, a.color AS account_color,
         c.name AS category_name, c.color AS category_color, c.icon AS category_icon
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  LEFT JOIN categories c ON c.id = t.category_id
`;

function buildWhere(f: TransactionFilters): { where: string; params: Record<string, unknown> } {
  const conds: string[] = [];
  const params: Record<string, unknown> = {};
  if (f.account) {
    conds.push("t.account_id = @account");
    params.account = f.account;
  }
  if (f.category) {
    conds.push("t.category_id = @category");
    params.category = f.category;
  }
  if (f.from) {
    conds.push("t.date >= @from");
    params.from = f.from;
  }
  if (f.to) {
    conds.push("t.date <= @to");
    params.to = f.to;
  }
  if (f.direction === "income" || f.direction === "expense") {
    conds.push("t.direction = @direction");
    params.direction = f.direction;
  }
  if (f.q) {
    conds.push("(t.description LIKE @q OR t.notes LIKE @q)");
    params.q = `%${f.q}%`;
  }
  return { where: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params };
}

export function getTransactions(f: TransactionFilters = {}): {
  rows: TransactionWithRefs[];
  total: number;
} {
  const db = getDb();
  const { where, params } = buildWhere(f);
  const sortCol = f.sort === "amount" ? "t.amount" : "t.date";
  const order = f.order === "asc" ? "ASC" : "DESC";
  const limit = f.limit ?? 100;
  const offset = f.offset ?? 0;
  const rows = db
    .prepare(`${TXN_SELECT} ${where} ORDER BY ${sortCol} ${order}, t.id ${order} LIMIT ${limit} OFFSET ${offset}`)
    .all(params) as TransactionWithRefs[];
  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM transactions t ${where}`).get(params) as { n: number }
  ).n;
  return { rows, total };
}

export interface MonthSummary {
  spentThisMonth: number;
  spentAllTime: number;
  incomeThisMonth: number;
  net: number;
}

export function getMonthSummary(month: string): MonthSummary {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN direction = 'expense' AND strftime('%Y-%m', date) = ? THEN amount END), 0) AS spentThisMonth,
        COALESCE(SUM(CASE WHEN direction = 'expense' THEN amount END), 0) AS spentAllTime,
        COALESCE(SUM(CASE WHEN direction = 'income' AND strftime('%Y-%m', date) = ? THEN amount END), 0) AS incomeThisMonth
      FROM transactions`
    )
    .get(month, month) as Omit<MonthSummary, "net">;
  return { ...row, net: row.incomeThisMonth - row.spentThisMonth };
}

export interface MonthlyTotal {
  month: string;
  expenses: number;
  income: number;
}

export function getMonthlyTotals(months: string[]): MonthlyTotal[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', date) AS month,
              COALESCE(SUM(CASE WHEN direction = 'expense' THEN amount END), 0) AS expenses,
              COALESCE(SUM(CASE WHEN direction = 'income' THEN amount END), 0) AS income
       FROM transactions
       WHERE strftime('%Y-%m', date) >= ? AND strftime('%Y-%m', date) <= ?
       GROUP BY month`
    )
    .all(months[0], months[months.length - 1]) as MonthlyTotal[];
  const map = new Map(rows.map((r) => [r.month, r]));
  return months.map((m) => map.get(m) ?? { month: m, expenses: 0, income: 0 });
}

export interface NamedTotal {
  id: number;
  name: string;
  color: string;
  total: number;
}

export function getSpendByCategory(from: string, to: string): NamedTotal[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT COALESCE(c.id, 0) AS id, COALESCE(c.name, 'Uncategorized') AS name,
              COALESCE(c.color, '#6e6d68') AS color, SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.direction = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id ORDER BY total DESC`
    )
    .all(from, to) as NamedTotal[];
}

export function getSpendByAccount(from: string, to: string): NamedTotal[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.id, a.name, a.color, SUM(t.amount) AS total
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       WHERE t.direction = 'expense' AND t.date >= ? AND t.date <= ?
       GROUP BY a.id ORDER BY total DESC`
    )
    .all(from, to) as NamedTotal[];
}

export interface AccountStats {
  account: Account;
  spentThisMonth: number;
  spentAllTime: number;
  trend: { month: string; total: number }[]; // trailing 6 months
}

export function getAccountStats(months: string[]): AccountStats[] {
  const db = getDb();
  const accounts = getAccounts(true);
  const thisMonth = months[months.length - 1];
  const spendRows = db
    .prepare(
      `SELECT account_id,
              COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = ? THEN amount END), 0) AS spentThisMonth,
              COALESCE(SUM(amount), 0) AS spentAllTime
       FROM transactions WHERE direction = 'expense' GROUP BY account_id`
    )
    .all(thisMonth) as { account_id: number; spentThisMonth: number; spentAllTime: number }[];
  const trendRows = db
    .prepare(
      `SELECT account_id, strftime('%Y-%m', date) AS month, SUM(amount) AS total
       FROM transactions
       WHERE direction = 'expense' AND strftime('%Y-%m', date) >= ?
       GROUP BY account_id, month`
    )
    .all(months[0]) as { account_id: number; month: string; total: number }[];

  const spendMap = new Map(spendRows.map((r) => [r.account_id, r]));
  return accounts.map((account) => {
    const s = spendMap.get(account.id);
    const trend = months.map((m) => ({
      month: m,
      total: trendRows.find((r) => r.account_id === account.id && r.month === m)?.total ?? 0,
    }));
    return {
      account,
      spentThisMonth: s?.spentThisMonth ?? 0,
      spentAllTime: s?.spentAllTime ?? 0,
      trend,
    };
  });
}

export function getLoans(): LoanWithRefs[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT l.*, a.name AS account_name, a.color AS account_color
       FROM loans l LEFT JOIN accounts a ON a.id = l.linked_account_id
       ORDER BY l.remaining_balance > 0 DESC, l.name`
    )
    .all() as LoanWithRefs[];
}

export function getBudgets(): Budget[] {
  const db = getDb();
  return db.prepare("SELECT * FROM budgets").all() as Budget[];
}

export interface StackedMonth {
  month: string;
  [categoryName: string]: number | string;
}

/** Per-month expense totals segmented by category, for stacked bars. */
export function getCategoryStacks(months: string[]): {
  data: StackedMonth[];
  series: { name: string; color: string }[];
} {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', t.date) AS month,
              COALESCE(c.name, 'Uncategorized') AS name,
              COALESCE(c.color, '#6e6d68') AS color,
              SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.direction = 'expense' AND strftime('%Y-%m', t.date) >= ? AND strftime('%Y-%m', t.date) <= ?
       GROUP BY month, c.id`
    )
    .all(months[0], months[months.length - 1]) as {
    month: string;
    name: string;
    color: string;
    total: number;
  }[];

  // Rank categories by grand total; keep top 6, fold the rest into "Other".
  const grand = new Map<string, { color: string; total: number }>();
  for (const r of rows) {
    const g = grand.get(r.name) ?? { color: r.color, total: 0 };
    g.total += r.total;
    grand.set(r.name, g);
  }
  const ranked = Array.from(grand.entries()).sort((a, b) => b[1].total - a[1].total);
  const top = ranked.slice(0, 6).map(([name, v]) => ({ name, color: v.color }));
  const topNames = new Set(top.map((t) => t.name));
  const hasOther = ranked.length > 6;
  const series = hasOther ? [...top, { name: "Other", color: "#6e6d68" }] : top;

  const data: StackedMonth[] = months.map((month) => {
    const entry: StackedMonth = { month };
    for (const s of series) entry[s.name] = 0;
    for (const r of rows.filter((r) => r.month === month)) {
      const key = topNames.has(r.name) ? r.name : "Other";
      entry[key] = ((entry[key] as number) ?? 0) + r.total;
    }
    return entry;
  });
  return { data, series };
}
