import "server-only";

const REQUIRED = ["DATABASE_HOST", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"] as const;

type RequiredVar = (typeof REQUIRED)[number];

function readEnv() {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}. See .env.example.`);
  }
  const port = Number(process.env.DATABASE_PORT || 3306);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error("DATABASE_PORT must be a port number.");
  return {
    ...(Object.fromEntries(REQUIRED.map((name) => [name, process.env[name]!])) as Record<RequiredVar, string>),
    DATABASE_PORT: port,
  };
}

let cached: ReturnType<typeof readEnv> | undefined;

/** Validated server configuration. Throws a clear error naming any missing variable. */
export function env() {
  cached ??= readEnv();
  return cached;
}
