/* Seeds the SQLite database with realistic sample data.
 * Run with: npm run seed        (adds sample transactions, loans, budgets)
 *          npm run seed:reset   (wipes the DB first, then seeds)
 */
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "finance.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

if (process.argv.includes("--reset") && fs.existsSync(DB_PATH)) {
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  console.log("Removed existing database.");
}

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));

const ACCOUNTS = [
  ["UnionBank", "bank", "#eb6834"],
  ["Maya", "e-wallet", "#1baf7a"],
  ["Seabank", "bank", "#eda100"],
  ["GCash", "e-wallet", "#2a78d6"],
  ["SPayLater", "loan", "#e34948"],
  ["GLoan", "loan", "#4a3aa7"],
  ["Atome", "loan", "#e87ba4"],
];

const CATEGORIES = [
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

const insAcct = db.prepare("INSERT OR IGNORE INTO accounts (name, type, color) VALUES (?, ?, ?)");
for (const a of ACCOUNTS) insAcct.run(...a);
const insCat = db.prepare("INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)");
for (const c of CATEGORIES) insCat.run(...c);

const acct = Object.fromEntries(
  db.prepare("SELECT id, name FROM accounts").all().map((r) => [r.name, r.id])
);
const cat = Object.fromEntries(
  db.prepare("SELECT id, name FROM categories").all().map((r) => [r.name, r.id])
);

const existing = db.prepare("SELECT COUNT(*) AS n FROM transactions").get().n;
if (existing > 0 && !process.argv.includes("--force") && !process.argv.includes("--reset")) {
  console.log(`Database already has ${existing} transactions — skipping sample data.`);
  console.log("Use `npm run seed:reset` to start fresh, or `node scripts/seed.js --force` to add anyway.");
  process.exit(0);
}

// ---- Sample transactions: ~6 months of realistic activity -----------------
// Templates: [description, category, account, min, max, dayHint]
const MONTHLY_BILLS = [
  ["Netflix", "Entertainment", "Maya", 619, 619, 5],
  ["Converge WiFi", "Bills & Utilities", "UnionBank", 1300, 1500, 14],
  ["Meralco", "Bills & Utilities", "GCash", 1500, 2200, 18],
  ["Prime Water", "Bills & Utilities", "UnionBank", 780, 1900, 20],
  ["Rent share", "Household", "Seabank", 6500, 6500, 30],
  ["GLoan payment", "Loan Payment", "GCash", 2070, 2070, 13],
  ["SPayLater dues (15th)", "Loan Payment", "SPayLater", 1100, 1700, 15],
  ["SPayLater dues (30th)", "Loan Payment", "SPayLater", 1100, 1700, 30],
  ["Atome — phone installment", "Debt/Installment", "Atome", 1345, 1345, 11],
  ["GoSave transfer", "Savings", "Maya", 2000, 3500, 16],
];

const VARIABLE = [
  ["Rob Essentials", "Groceries", "UnionBank", 900, 2400],
  ["Osave grocery run", "Groceries", "Maya", 180, 700],
  ["SM Supermarket", "Groceries", "UnionBank", 350, 1500],
  ["SP: Cat food", "Cat/Pet", "SPayLater", 400, 1650],
  ["SP: Wet food + litter", "Cat/Pet", "SPayLater", 200, 700],
  ["Pet Express", "Cat/Pet", "Maya", 120, 300],
  ["Mercury Drug", "Personal", "UnionBank", 250, 1550],
  ["Watsons", "Personal", "Maya", 120, 700],
  ["David's Salon", "Personal", "UnionBank", 450, 900],
  ["Jollibee", "Personal", "Maya", 150, 500],
  ["McDo", "Personal", "Maya", 99, 470],
  ["KFC", "Personal", "Maya", 180, 640],
  ["Grab food", "Personal", "GCash", 280, 560],
  ["SM Cinema", "Entertainment", "Maya", 250, 750],
  ["TikTok Shop", "Entertainment", "SPayLater", 77, 300],
  ["Green — fare", "Other", "GCash", 80, 170],
  ["SP: House stuff", "Household", "SPayLater", 100, 550],
  ["Mr. DIY", "Household", "Maya", 60, 310],
  ["Flying Tiger", "Household", "UnionBank", 180, 440],
];

const INCOME = [
  ["Salary (1st half)", "Income", "UnionBank", 14000, 14000, 15],
  ["Salary (2nd half)", "Income", "UnionBank", 14000, 14000, 30],
  ["Commissions", "Income", "Maya", 970, 3900, 22],
  ["Raket / side gig", "Income", "GCash", 500, 2100, 8],
];

let seed = 42;
function rand() {
  // deterministic LCG so reseeding gives the same data
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const between = (min, max) => Math.round((min + (max - min) * rand()) * 100) / 100;

const now = new Date();
const insTxn = db.prepare(
  `INSERT INTO transactions (date, amount, direction, account_id, category_id, description, notes, is_recurring)
   VALUES (?, ?, ?, ?, ?, ?, '', ?)`
);

let count = 0;
const addTxn = (y, m, day, [desc, c, a, min, max], direction, recurring) => {
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(day, lastDay);
  const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (date > new Date().toISOString().slice(0, 10)) return;
  insTxn.run(date, between(min, max), direction, acct[a], cat[c], desc, recurring ? 1 : 0);
  count++;
};

const seedAll = db.transaction(() => {
  for (let back = 5; back >= 0; back--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const y = ref.getFullYear();
    const m = ref.getMonth();

    for (const bill of MONTHLY_BILLS) addTxn(y, m, bill[5], bill, "expense", true);
    for (const inc of INCOME) addTxn(y, m, inc[5], inc, "income", true);

    // 14–20 variable purchases scattered through the month
    const n = 14 + Math.floor(rand() * 7);
    for (let i = 0; i < n; i++) {
      const t = VARIABLE[Math.floor(rand() * VARIABLE.length)];
      addTxn(y, m, 1 + Math.floor(rand() * 28), t, "expense", false);
    }
  }

  // Loans (only if none exist yet)
  const loanCount = db.prepare("SELECT COUNT(*) AS n FROM loans").get().n;
  if (loanCount === 0) {
    const startOf = (monthsAgo) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 5);
      return d.toISOString().slice(0, 10);
    };
    const insLoan = db.prepare(
      `INSERT INTO loans (name, linked_account_id, principal, start_date, monthly_payment, due_day_1, due_day_2, remaining_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insLoan.run("GLoan", acct["GLoan"], 20000, startOf(4), 2070, 13, null, 11650);
    insLoan.run("SPayLater running balance", acct["SPayLater"], 18000, startOf(3), 2800, 15, 31, 9400);
    insLoan.run("Atome — phone", acct["Atome"], 16146, startOf(5), 1345.5, 11, null, 8073);
    insLoan.run("BPI card debt", acct["UnionBank"], 40000, startOf(5), 5000, 15, 31, 23179);
  }

  // Budgets (only if none exist yet)
  const budgetCount = db.prepare("SELECT COUNT(*) AS n FROM budgets").get().n;
  if (budgetCount === 0) {
    const insBudget = db.prepare("INSERT INTO budgets (category_id, monthly_limit) VALUES (?, ?)");
    insBudget.run(cat["Groceries"], 5000);
    insBudget.run(cat["Cat/Pet"], 5000);
    insBudget.run(cat["Personal"], 4000);
    insBudget.run(cat["Entertainment"], 2000);
    insBudget.run(cat["Bills & Utilities"], 6000);
    insBudget.run(cat["Household"], 8000);
  }
});
seedAll();

console.log(`Seeded ${count} sample transactions, 4 loans and 6 budgets into data/finance.db`);
