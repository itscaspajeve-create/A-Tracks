import { getDb } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthed()) return new Response("Not signed in", { status: 401 });
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.date, t.amount, t.direction, a.name AS account, COALESCE(c.name, '') AS category,
              t.description, t.notes, t.is_recurring
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       LEFT JOIN categories c ON c.id = t.category_id
       ORDER BY t.date, t.id`
    )
    .all() as Record<string, string | number>[];

  const header = ["date", "amount", "direction", "account", "category", "description", "notes", "is_recurring"];
  const csv = toCsv([header, ...rows.map((r) => header.map((h) => r[h] ?? ""))]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
