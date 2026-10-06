import "server-only";
import mysql from "mysql2/promise";
import { env } from "./env";

const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

function createPool() {
  const config = env();
  const pool = mysql.createPool({
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT,
    user: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    database: config.DATABASE_NAME,
    connectionLimit: 10,
    charset: "utf8mb4",
    // DATETIME/TIMESTAMP values are UTC; DATE values stay "YYYY-MM-DD" strings so
    // they can never shift by a timezone.
    timezone: "Z",
    dateStrings: ["DATE"],
    // MariaDB returns JSON columns as text while MySQL returns parsed values; always
    // take text and parse explicitly (see parseJson) so both engines behave the same.
    jsonStrings: true,
  });
  pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  return pool;
}

// Reuse one pool across dev hot reloads instead of opening a new one per edit.
export const db = globalForDb.mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = db;

export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}

export function parseJson<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}
