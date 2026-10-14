// Creates an admin user or resets an existing admin's password. Resetting signs the admin
// out everywhere and clears their failed sign-in attempts.
//
// Usage:
//   npm run admin:password -- --email you@example.com --name "Your Name"   (create)
//   npm run admin:password -- --email you@example.com                      (reset)
// The password is read from a hidden prompt, or from stdin with --password-stdin.
// It is never accepted as a command-line argument, so it can't end up in shell history.
import { parseArgs } from "node:util";
import { stdin, stdout } from "node:process";
import { connect } from "./lib/db.mjs";
import { hashPassword, passwordProblem } from "../src/server/auth/password-core.mjs";

const USAGE = 'Usage: npm run admin:password -- --email <email> [--name "<name>"] [--password-stdin]';

let args;
try {
  ({ values: args } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      "password-stdin": { type: "boolean", default: false },
    },
  }));
} catch (e) {
  fail(`${e.message}\n${USAGE}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const email = args.email?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail(`A valid --email is required.\n${USAGE}`);
const name = args.name?.trim();
if (name !== undefined && (!name || name.length > 120)) fail("--name must be 1–120 characters.");

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error("No terminal available for a hidden prompt. Use --password-stdin instead."));
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (input) => {
      for (const ch of input) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

let password;
if (args["password-stdin"]) {
  password = await readStdin();
} else {
  try {
    password = await promptHidden("New password: ");
    const again = await promptHidden("Repeat password: ");
    if (password !== again) fail("Passwords don't match.");
  } catch (e) {
    fail(e.message);
  }
}
const problem = passwordProblem(password);
if (problem) fail(problem);

const hash = await hashPassword(password);
password = undefined;

const conn = await connect();
try {
  const [tables] = await conn.query(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users'",
  );
  if (!tables.length) fail("The admin_users table does not exist. Run `npm run db:migrate` first.");

  await conn.beginTransaction();
  const [rows] = await conn.execute("SELECT id, name FROM admin_users WHERE email = ? FOR UPDATE", [email]);
  const actor = ["system", null, "scripts/admin-password.mjs"];
  let message;

  if (rows.length) {
    const id = rows[0].id;
    await conn.execute(
      `UPDATE admin_users SET password_hash = ?, password_changed_at = UTC_TIMESTAMP(), is_active = 1${name ? ", name = ?" : ""} WHERE id = ?`,
      name ? [hash, name, id] : [hash, id],
    );
    const [ended] = await conn.execute("DELETE FROM admin_sessions WHERE admin_user_id = ?", [id]);
    await conn.execute("DELETE FROM admin_login_attempts WHERE email = ? AND succeeded = 0", [email]);
    await conn.execute(
      `INSERT INTO audit_log (actor_type, actor_id, actor_label, action, entity_type, entity_id, before_data, after_data, ip, created_at)
       VALUES (?, ?, ?, 'admin.password_reset', 'admin_user', ?, ?, ?, NULL, UTC_TIMESTAMP())`,
      [
        ...actor,
        String(id),
        name && name !== rows[0].name ? JSON.stringify({ name: rows[0].name }) : null,
        JSON.stringify({ email, ...(name && name !== rows[0].name ? { name } : {}), sessionsEnded: ended.affectedRows }),
      ],
    );
    message = `Password reset for ${email}. ${ended.affectedRows} active session(s) signed out.`;
  } else {
    if (!name) fail(`No admin with email ${email} exists. Pass --name to create one.`);
    const [result] = await conn.execute(
      `INSERT INTO admin_users (email, name, password_hash, is_active, password_changed_at, created_at, updated_at)
       VALUES (?, ?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [email, name, hash],
    );
    await conn.execute(
      `INSERT INTO audit_log (actor_type, actor_id, actor_label, action, entity_type, entity_id, before_data, after_data, ip, created_at)
       VALUES (?, ?, ?, 'admin.create', 'admin_user', ?, NULL, ?, NULL, UTC_TIMESTAMP())`,
      [...actor, String(result.insertId), JSON.stringify({ email, name })],
    );
    message = `Admin ${name} <${email}> created.`;
  }
  await conn.commit();
  console.log(message);
} catch (e) {
  await conn.rollback().catch(() => {});
  throw e;
} finally {
  await conn.end();
}
