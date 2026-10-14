// Database connection for command-line scripts. Mirrors the settings in src/server/db.ts
// so scripts and the app read and write values the same way.
import mysql from "mysql2/promise";
import { databaseSsl } from "../../src/server/db-ssl-core.mjs";

const REQUIRED = ["DATABASE_HOST", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"];

export function requireDatabaseEnv() {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}. See .env.example.`);
    process.exit(1);
  }
}

function sslOptions() {
  try {
    return databaseSsl(process.env);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

export async function connect({ multipleStatements = false } = {}) {
  requireDatabaseEnv();
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: sslOptions(),
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: ["DATE"],
    jsonStrings: true,
    multipleStatements,
  });
  await conn.query("SET time_zone = '+00:00'");
  return conn;
}
