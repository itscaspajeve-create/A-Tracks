"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "./db";
import { nextColor } from "./colors";

function revalidateAll() {
  for (const p of ["/", "/transactions", "/accounts", "/loans", "/budgets", "/reports", "/categories"]) {
    revalidatePath(p);
  }
}

function num(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(/[₱,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// ---------- Transactions ----------

export async function saveTransaction(formData: FormData) {
  const db = getDb();
  const id = formData.get("id");
  const values = {
    date: String(formData.get("date") || "").slice(0, 10),
    amount: Math.abs(num(formData.get("amount"))),
    direction: formData.get("direction") === "income" ? "income" : "expense",
    account_id: num(formData.get("account_id")),
    category_id: num(formData.get("category_id")) || null,
    description: String(formData.get("description") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    is_recurring: formData.get("is_recurring") ? 1 : 0,
  };
  if (!values.date || !values.amount || !values.account_id) {
    return { error: "Date, amount and account are required." };
  }
  if (id) {
    db.prepare(
      `UPDATE transactions SET date=@date, amount=@amount, direction=@direction, account_id=@account_id,
       category_id=@category_id, description=@description, notes=@notes, is_recurring=@is_recurring WHERE id=@id`
    ).run({ ...values, id: Number(id) });
  } else {
    db.prepare(
      `INSERT INTO transactions (date, amount, direction, account_id, category_id, description, notes, is_recurring)
       VALUES (@date, @amount, @direction, @account_id, @category_id, @description, @notes, @is_recurring)`
    ).run(values);
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteTransaction(id: number) {
  getDb().prepare("DELETE FROM transactions WHERE id = ?").run(id);
  revalidateAll();
}

// ---------- Categories ----------

export async function saveCategory(formData: FormData) {
  const db = getDb();
  const id = formData.get("id");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };
  const icon = String(formData.get("icon") || "tag");
  let color = String(formData.get("color") || "");
  try {
    if (id) {
      color ||= "#6e6d68";
      db.prepare("UPDATE categories SET name=?, color=?, icon=? WHERE id=?").run(name, color, icon, Number(id));
    } else {
      if (!color) {
        const used = (db.prepare("SELECT color FROM categories").all() as { color: string }[]).map((r) => r.color);
        color = nextColor(used);
      }
      db.prepare("INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)").run(name, color, icon);
    }
  } catch {
    return { error: `A category named “${name}” already exists.` };
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteCategory(id: number) {
  const db = getDb();
  db.prepare("UPDATE transactions SET category_id = NULL WHERE category_id = ?").run(id);
  db.prepare("DELETE FROM budgets WHERE category_id = ?").run(id);
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  revalidateAll();
}

// ---------- Accounts ----------

export async function saveAccount(formData: FormData) {
  const db = getDb();
  const id = formData.get("id");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };
  const type = String(formData.get("type") || "bank");
  let color = String(formData.get("color") || "");
  try {
    if (id) {
      color ||= "#6e6d68";
      db.prepare("UPDATE accounts SET name=?, type=?, color=? WHERE id=?").run(name, type, color, Number(id));
    } else {
      if (!color) {
        const used = (db.prepare("SELECT color FROM accounts").all() as { color: string }[]).map((r) => r.color);
        color = nextColor(used);
      }
      db.prepare("INSERT INTO accounts (name, type, color) VALUES (?, ?, ?)").run(name, type, color);
    }
  } catch {
    return { error: `An account named “${name}” already exists.` };
  }
  revalidateAll();
  return { ok: true };
}

export async function setAccountArchived(id: number, archived: boolean) {
  getDb().prepare("UPDATE accounts SET archived = ? WHERE id = ?").run(archived ? 1 : 0, id);
  revalidateAll();
}

// ---------- Loans ----------

export async function saveLoan(formData: FormData) {
  const db = getDb();
  const id = formData.get("id");
  const values = {
    name: String(formData.get("name") || "").trim(),
    linked_account_id: num(formData.get("linked_account_id")) || null,
    principal: num(formData.get("principal")),
    start_date: String(formData.get("start_date") || "").slice(0, 10),
    monthly_payment: num(formData.get("monthly_payment")),
    due_day_1: num(formData.get("due_day_1")) || null,
    due_day_2: num(formData.get("due_day_2")) || null,
    remaining_balance: num(formData.get("remaining_balance")),
  };
  if (!values.name || !values.principal || !values.start_date) {
    return { error: "Name, principal and start date are required." };
  }
  if (id) {
    db.prepare(
      `UPDATE loans SET name=@name, linked_account_id=@linked_account_id, principal=@principal,
       start_date=@start_date, monthly_payment=@monthly_payment, due_day_1=@due_day_1,
       due_day_2=@due_day_2, remaining_balance=@remaining_balance WHERE id=@id`
    ).run({ ...values, id: Number(id) });
  } else {
    db.prepare(
      `INSERT INTO loans (name, linked_account_id, principal, start_date, monthly_payment, due_day_1, due_day_2, remaining_balance)
       VALUES (@name, @linked_account_id, @principal, @start_date, @monthly_payment, @due_day_1, @due_day_2, @remaining_balance)`
    ).run(values);
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteLoan(id: number) {
  getDb().prepare("DELETE FROM loans WHERE id = ?").run(id);
  revalidateAll();
}

/** Record a payment: decrement the loan balance and log a matching transaction. */
export async function recordLoanPayment(formData: FormData) {
  const db = getDb();
  const loanId = num(formData.get("loan_id"));
  const amount = Math.abs(num(formData.get("amount")));
  const date = String(formData.get("date") || "").slice(0, 10);
  const accountId = num(formData.get("account_id"));
  if (!loanId || !amount || !date) return { error: "Amount and date are required." };

  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId) as
    | { name: string; linked_account_id: number | null; remaining_balance: number }
    | undefined;
  if (!loan) return { error: "Loan not found." };

  const payFrom = accountId || loan.linked_account_id;
  const category = db.prepare("SELECT id FROM categories WHERE name = 'Loan Payment'").get() as
    | { id: number }
    | undefined;

  const tx = db.transaction(() => {
    db.prepare("UPDATE loans SET remaining_balance = MAX(0, remaining_balance - ?) WHERE id = ?").run(amount, loanId);
    if (payFrom) {
      db.prepare(
        `INSERT INTO transactions (date, amount, direction, account_id, category_id, description, notes, is_recurring)
         VALUES (?, ?, 'expense', ?, ?, ?, '', 1)`
      ).run(date, amount, payFrom, category?.id ?? null, `${loan.name} payment`);
    }
  });
  tx();
  revalidateAll();
  return { ok: true };
}

// ---------- Budgets ----------

export async function setBudget(categoryId: number, monthlyLimit: number) {
  const db = getDb();
  if (monthlyLimit > 0) {
    db.prepare(
      `INSERT INTO budgets (category_id, monthly_limit) VALUES (?, ?)
       ON CONFLICT(category_id) DO UPDATE SET monthly_limit = excluded.monthly_limit`
    ).run(categoryId, monthlyLimit);
  } else {
    db.prepare("DELETE FROM budgets WHERE category_id = ?").run(categoryId);
  }
  revalidateAll();
}
