import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "finance.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

const DEFAULT_ACCOUNTS: [string, string, string][] = [
  ["UnionBank", "bank", "#eb6834"],
  ["Maya", "e-wallet", "#1baf7a"],
  ["Seabank", "bank", "#eda100"],
  ["GCash", "e-wallet", "#2a78d6"],
  ["SPayLater", "loan", "#e34948"],
  ["GLoan", "loan", "#4a3aa7"],
  ["Atome", "loan", "#e87ba4"],
];

const DEFAULT_CATEGORIES: [string, string, string][] = [
  ["Household", "#2a78d6", "home"],
  ["Groceries", "#008300", "shopping-cart"],
  ["Cat/Pet", "#eda100", "cat"],
  ["Personal", "#e87ba4", "user"],
  ["Entertainment", "#4a3aa7", "clapperboard"],
  ["Bills & Utilities", "#0e7c8c", "plug-zap"],
  ["Loan Payment", "#eb6834", "landmark"],
  ["Savings", "#1baf7a", "piggy-bank"],
  ["Debt/Installment", "#e34948", "credit-card"],
  ["Income", "#008300", "banknote"],
  ["Other", "#6e6d68", "tag"],
];

declare global {
  // eslint-disable-next-line no-var
  var __financeDb: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));

  const hasAccounts = db.prepare("SELECT COUNT(*) AS n FROM accounts").get() as { n: number };
  if (hasAccounts.n === 0) {
    const ins = db.prepare("INSERT INTO accounts (name, type, color) VALUES (?, ?, ?)");
    for (const a of DEFAULT_ACCOUNTS) ins.run(...a);
  }
  const hasCategories = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (hasCategories.n === 0) {
    const ins = db.prepare("INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)");
    for (const c of DEFAULT_CATEGORIES) ins.run(...c);
  }
  return db;
}

// Reuse one connection across hot reloads / route invocations.
export function getDb(): Database.Database {
  if (!globalThis.__financeDb) {
    globalThis.__financeDb = open();
  }
  return globalThis.__financeDb;
}
