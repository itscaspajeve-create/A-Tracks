import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { parseCsv } from "@/lib/csv";
import { nextColor } from "@/lib/colors";

export const dynamic = "force-dynamic";

/**
 * Import transactions from CSV. Expected columns (header row required,
 * order-insensitive, case-insensitive):
 *   date, amount, direction, account, category, description, notes, is_recurring
 * Unknown accounts/categories are created automatically.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV needs a header row and at least one data row." }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const iDate = col("date");
  const iAmount = col("amount");
  if (iDate === -1 || iAmount === -1) {
    return NextResponse.json(
      { error: 'CSV must include at least "date" and "amount" columns.' },
      { status: 400 }
    );
  }
  const iDirection = col("direction");
  const iAccount = col("account");
  const iCategory = col("category");
  const iDescription = col("description");
  const iNotes = col("notes");
  const iRecurring = col("is_recurring");

  const db = getDb();
  const accounts = new Map(
    (db.prepare("SELECT id, name FROM accounts").all() as { id: number; name: string }[]).map((a) => [
      a.name.toLowerCase(),
      a.id,
    ])
  );
  const categories = new Map(
    (db.prepare("SELECT id, name FROM categories").all() as { id: number; name: string }[]).map((c) => [
      c.name.toLowerCase(),
      c.id,
    ])
  );

  const usedColors = () =>
    [
      ...(db.prepare("SELECT color FROM accounts").all() as { color: string }[]),
      ...(db.prepare("SELECT color FROM categories").all() as { color: string }[]),
    ].map((r) => r.color);

  const insertTxn = db.prepare(
    `INSERT INTO transactions (date, amount, direction, account_id, category_id, description, notes, is_recurring)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let imported = 0;
  const errors: string[] = [];

  const run = db.transaction(() => {
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");

      const rawDate = get(iDate);
      const date = normalizeDate(rawDate);
      const amount = Math.abs(Number(get(iAmount).replace(/[₱,\s]/g, "")));
      if (!date || !Number.isFinite(amount) || amount <= 0) {
        errors.push(`Row ${r + 1}: invalid date or amount ("${rawDate}", "${get(iAmount)}")`);
        continue;
      }
      const direction = get(iDirection).toLowerCase() === "income" ? "income" : "expense";

      const accountName = get(iAccount) || "Cash";
      let accountId = accounts.get(accountName.toLowerCase());
      if (!accountId) {
        const res = db
          .prepare("INSERT INTO accounts (name, type, color) VALUES (?, 'bank', ?)")
          .run(accountName, nextColor(usedColors()));
        accountId = Number(res.lastInsertRowid);
        accounts.set(accountName.toLowerCase(), accountId);
      }

      let categoryId: number | null = null;
      const categoryName = get(iCategory);
      if (categoryName) {
        categoryId = categories.get(categoryName.toLowerCase()) ?? null;
        if (!categoryId) {
          const res = db
            .prepare("INSERT INTO categories (name, color, icon) VALUES (?, ?, 'tag')")
            .run(categoryName, nextColor(usedColors()));
          categoryId = Number(res.lastInsertRowid);
          categories.set(categoryName.toLowerCase(), categoryId);
        }
      }

      const recurring = ["1", "true", "yes"].includes(get(iRecurring).toLowerCase()) ? 1 : 0;
      insertTxn.run(date, amount, direction, accountId, categoryId, get(iDescription), get(iNotes), recurring);
      imported++;
    }
  });
  run();

  for (const p of ["/", "/transactions", "/accounts", "/budgets", "/reports", "/categories"]) revalidatePath(p);
  return NextResponse.json({ imported, skipped: errors.length, errors: errors.slice(0, 10) });
}

/** Accepts YYYY-MM-DD, MM/DD/YYYY, M/D/YY and returns YYYY-MM-DD (or null). */
function normalizeDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const [, mm, dd, yy] = m;
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const d = new Date(raw);
  if (!isNaN(+d)) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}
