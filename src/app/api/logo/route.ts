import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { deleteSetting, isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const LOGO_PATH = path.join(process.cwd(), "data", "app-logo");
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

function getMime(): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = 'logo_mime'").get() as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

/** Serve the uploaded icon (public — it also appears on the login page). */
export async function GET() {
  const mime = getMime();
  if (!mime || !fs.existsSync(LOGO_PATH)) {
    return new Response("No custom logo", { status: 404 });
  }
  return new Response(fs.readFileSync(LOGO_PATH), {
    headers: { "Content-Type": mime, "Cache-Control": "no-store" },
  });
}

/** Upload a new icon. */
export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Please upload a PNG, JPG, WebP, GIF or SVG image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large — keep it under 2 MB." }, { status: 400 });
  }
  fs.mkdirSync(path.dirname(LOGO_PATH), { recursive: true });
  fs.writeFileSync(LOGO_PATH, Buffer.from(await file.arrayBuffer()));
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES ('logo_mime', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(file.type);
  return NextResponse.json({ ok: true });
}

/** Remove the custom icon (revert to the default). */
export async function DELETE() {
  if (!isAuthed()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (fs.existsSync(LOGO_PATH)) fs.unlinkSync(LOGO_PATH);
  deleteSetting("logo_mime");
  return NextResponse.json({ ok: true });
}
