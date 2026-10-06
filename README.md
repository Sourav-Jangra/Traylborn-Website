# Traylborn website

Next.js 16 app backed by MariaDB 11.8+ or MySQL 8+.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the database connection.
3. `npm run db:migrate` — creates or upgrades the schema. Safe to re-run; it only applies
   migrations that haven't run yet and never drops data.
4. Create the admin account (the password is asked for in a hidden prompt):

   ```bash
   npm run admin:password -- --email <email> --name "<name>"
   ```

   Run the same command without `--name` to reset a forgotten password. Resetting signs
   that admin out everywhere and clears failed sign-in lockouts.
5. `npm run dev`, then sign in at `/admin/login`.

For a local database only, `npm run db:seed` adds the sample packages from
`db/seed/dev-packages.json` (existing packages are never overwritten).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply pending migrations from `db/migrations` |
| `npm run db:migrate:status` | List applied and pending migrations |
| `npm run admin:password` | Create an admin or reset an admin's password |
| `npm run typecheck` / `npm run lint` / `npm run build` | Checks and production build |

## Migrations

Add a new file `db/migrations/NNNN_description.sql` for every schema change. Never edit a
migration that has already been applied: the runner stores a checksum and stops if a file
changes. Statements that can lose data (DROP, TRUNCATE, DELETE FROM, RENAME, MODIFY,
CHANGE) are refused unless the file's first line is `-- allow-destructive`.

All DATETIME columns hold UTC. Calendar dates (departures) are DATE values handled as
plain `YYYY-MM-DD` strings, and "today" is always the date in India (Asia/Kolkata).
