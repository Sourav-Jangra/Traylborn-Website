import "server-only";
import type { Pool, PoolConnection } from "mysql2/promise";
import { db } from "./db";

export interface Actor {
  type: "admin" | "system";
  id: number | null;
  /** Email for admins; a short description for system actors. */
  label: string;
  ip: string | null;
}

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Appends one row to audit_log. Pass the transaction's connection so the audit row
 * commits or rolls back with the change it describes. Callers must never include
 * passwords, session tokens or payment secrets in before/after.
 */
export async function recordAudit(actor: Actor, entry: AuditEntry, conn: Pool | PoolConnection = db) {
  await conn.execute(
    `INSERT INTO audit_log (actor_type, actor_id, actor_label, action, entity_type, entity_id, before_data, after_data, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [
      actor.type,
      actor.id,
      actor.label,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.before ? JSON.stringify(entry.before) : null,
      entry.after ? JSON.stringify(entry.after) : null,
      actor.ip,
    ],
  );
}

/** JSON with object keys sorted: the database may reorder keys inside JSON columns. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y)))
      : v,
  );
}

/** Keeps only the fields that differ, so update entries show exactly what changed. */
export function diff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const b: Record<string, unknown> = {};
  const a: Record<string, unknown> = {};
  for (const key of Object.keys(after)) {
    if (canonical(before[key]) !== canonical(after[key])) {
      b[key] = before[key];
      a[key] = after[key];
    }
  }
  return { before: b, after: a, changed: Object.keys(a).length > 0 };
}
