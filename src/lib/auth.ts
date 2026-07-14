import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

export const SESSION_COOKIE = "atracks_session";
const SESSION_DAYS = 30;

function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

export function deleteSetting(key: string) {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
}

// ---------- Password ----------

export function hasPassword(): boolean {
  return getSetting("password_hash") !== null;
}

export function setPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  setSetting("password_salt", salt);
  setSetting("password_hash", hash);
}

export function verifyPassword(password: string): boolean {
  const salt = getSetting("password_salt");
  const hash = getSetting("password_hash");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

// ---------- Sessions ----------

/** Creates a DB session and sets the cookie. Call from a server action or route handler only. */
export function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  const db = getDb();
  db.prepare("INSERT INTO sessions (token) VALUES (?)").run(token);
  // prune sessions older than the cookie lifetime
  db.prepare(`DELETE FROM sessions WHERE created_at < datetime('now', '-${SESSION_DAYS} days')`).run();
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Removes the current session (DB row + cookie). Call from a server action only. */
export function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  cookies().delete(SESSION_COOKIE);
}

export function isAuthed(): boolean {
  // First run (no password yet): send to /login, which shows the
  // "create password" form instead of the sign-in form.
  if (!hasPassword()) return false;
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const row = getDb().prepare("SELECT token FROM sessions WHERE token = ?").get(token);
  return row !== undefined;
}

/** Guard for pages and server actions: redirects to /login when signed out. */
export function requireAuth() {
  if (!isAuthed()) redirect("/login");
}
