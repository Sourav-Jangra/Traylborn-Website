import "server-only";
import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

function createPool() {
  return mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10,
    charset: "utf8mb4",
  });
}

// Reuse one pool across dev hot reloads instead of opening a new one per edit.
export const db = globalForDb.mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = db;
