/* Forgot your password? Run: npm run reset-password
 * Removes the stored password and all sessions — the app will ask you to
 * create a new password on the next visit. Your data is untouched.
 */
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "data", "finance.db");
if (!fs.existsSync(DB_PATH)) {
  console.log("No database found — nothing to reset.");
  process.exit(0);
}

const db = new Database(DB_PATH);
try {
  db.prepare("DELETE FROM settings WHERE key IN ('password_hash', 'password_salt')").run();
  db.prepare("DELETE FROM sessions").run();
  console.log("Password cleared. Open the app and set a new one.");
} catch (e) {
  console.log("Nothing to reset (auth tables not created yet).");
}
