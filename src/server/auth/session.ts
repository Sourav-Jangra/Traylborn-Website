import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/server/db";
import { recordAudit, type Actor } from "@/server/audit";
import { getDummyHash, MAX_PASSWORD_LENGTH, verifyPassword } from "./password";

export const SESSION_COOKIE = "tb_admin_session";
const SESSION_DAYS = 7;
const THROTTLE_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;

export interface AdminSession {
  sessionId: number;
  adminId: number;
  email: string;
  name: string;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getClientInfo() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = (forwarded || h.get("x-real-ip")?.trim() || "").slice(0, 64) || null;
  const userAgent = (h.get("user-agent") ?? "").slice(0, 255) || null;
  return { ip, userAgent };
}

/** Validates the session cookie against the database. Memoized per request. */
export const verifySession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT s.id AS session_id, s.last_seen_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE AS stale,
            u.id AS admin_id, u.email, u.name
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.is_active = 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;
  if (Number(row.stale)) {
    await db.execute("UPDATE admin_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?", [row.session_id]);
  }
  return { sessionId: Number(row.session_id), adminId: Number(row.admin_id), email: row.email, name: row.name };
});

/**
 * Call at the top of every admin page and every admin server action. Redirects to
 * the sign-in page when there is no valid session.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await verifySession();
  if (!session) redirect("/admin/login");
  return session;
}

/** requireAdmin() plus the request IP, in the shape the audit log expects. */
export async function requireAdminActor(): Promise<Actor> {
  const session = await requireAdmin();
  const { ip } = await getClientInfo();
  return { type: "admin", id: session.adminId, label: session.email, ip };
}

async function recentFailures(column: "email" | "ip", value: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM admin_login_attempts
      WHERE ${column} = ? AND succeeded = 0 AND attempted_at > UTC_TIMESTAMP() - INTERVAL ${THROTTLE_MINUTES} MINUTE`,
    [value],
  );
  return Number(rows[0].n);
}

export type LoginResult = { ok: true } | { ok: false; reason: "invalid" | "throttled" };

export async function signIn(emailInput: string, password: string): Promise<LoginResult> {
  const email = normalizeEmail(emailInput).slice(0, 254);
  const { ip, userAgent } = await getClientInfo();

  if (
    (await recentFailures("email", email)) >= MAX_FAILURES_PER_EMAIL ||
    (ip !== null && (await recentFailures("ip", ip)) >= MAX_FAILURES_PER_IP)
  ) {
    return { ok: false, reason: "throttled" };
  }

  const [users] = await db.execute<RowDataPacket[]>(
    "SELECT id, email, name, password_hash FROM admin_users WHERE email = ? AND is_active = 1",
    [email],
  );
  const user = users[0];
  // Always run a full hash so response time doesn't reveal whether the email exists.
  const valid =
    password.length <= MAX_PASSWORD_LENGTH &&
    (await verifyPassword(password, user ? user.password_hash : await getDummyHash())) &&
    Boolean(user);

  await db.execute(
    "INSERT INTO admin_login_attempts (email, ip, succeeded, attempted_at) VALUES (?, ?, ?, UTC_TIMESTAMP())",
    [email, ip, valid ? 1 : 0],
  );
  if (!valid) return { ok: false, reason: "invalid" };

  const token = randomBytes(32).toString("base64url");
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO admin_sessions (admin_user_id, token_hash, created_at, last_seen_at, expires_at, ip, user_agent)
     VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL ${SESSION_DAYS} DAY, ?, ?)`,
    [user.id, hashToken(token), ip, userAgent],
  );
  await db.execute("UPDATE admin_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [user.id]);
  await recordAudit(
    { type: "admin", id: Number(user.id), label: user.email, ip },
    { action: "admin.login", entityType: "admin_session", entityId: String(result.insertId) },
  );
  await pruneExpired();

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return { ok: true };
}

export async function signOut() {
  const session = await verifySession();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.execute("DELETE FROM admin_sessions WHERE token_hash = ?", [hashToken(token)]);
  if (session) {
    const { ip } = await getClientInfo();
    await recordAudit(
      { type: "admin", id: session.adminId, label: session.email, ip },
      { action: "admin.logout", entityType: "admin_session", entityId: String(session.sessionId) },
    );
  }
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 0 });
}

async function pruneExpired() {
  await db.execute("DELETE FROM admin_sessions WHERE expires_at < UTC_TIMESTAMP()");
  await db.execute("DELETE FROM admin_login_attempts WHERE attempted_at < UTC_TIMESTAMP() - INTERVAL 90 DAY");
}
