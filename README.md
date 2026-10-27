# ShowUp

A college event registration and check-in platform built as a three-table MySQL database project.

## Prerequisites & Setup
- **Prerequisites:** Node.js 22.18+ (or 24+) and MySQL 8.
- **Install dependencies:** `npm ci`
- **Configure environment:** Copy `.env.example` to `.env` and configure `DB_*` database credentials (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- **Initialize database:** `npm run db:init` (creates tables if not exists).
- **Optional sample data:** `npm run db:seed` (seeds demo data for a fresh database).
- **Development:** `npm run dev` (starts client on port 5173 and API on port 3001).
- **Production:** `npm run build` then `npm start` (serves production build on port 3001).

## Vercel Deployment
- Import the repository with the project root as the Root Directory. The Vite project builds with `npm run build` to `dist`; `vercel.json` routes `/api/*` to the root Node function in `api/` before the SPA rewrite.
- Set the server-only `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` environment variables in Vercel. They must point to a reachable hosted MySQL database; `localhost` is not the Vercel database.
- For Aiven, also set server-only `DB_SSL_CA` to the project's CA certificate PEM; TLS verifies the certificate and hostname. Literal `\n` line breaks and multiline PEM are supported. Leave it unset for local MySQL.
- Initialize a new database once, or upgrade an existing database without deleting records, using `npm run db:init` or `npm run db:upgrade` from an environment with database access. Never use `npm run db:reset` for a hosted database.
- Keep database credentials server-side. Never prefix them with `VITE_`.

## Database Schema (3 Tables)
The database relies on raw `mysql2` parameterized queries with `?` placeholders (no ORM, no third-party auth, no JWT):
1. **`users`**: `id` (PK), `name`, `email` (UNIQUE), `password_hash` (bcrypt), `role` (`student` or `organizer`), `college`, `reg_no`, `created_at`, plus nullable `session_token_hash` (`CHAR(64)`) and `session_expires_at` (`DATETIME`).
2. **`events`**: `id` (PK), `organizer_id` (FK -> `users.id`), `title`, `description`, `category`, `venue`, `event_date`, `registration_deadline`, `capacity`, `fee`, `created_at`.
3. **`registrations`**: `id` (PK), `user_id` (FK -> `users.id`), `event_id` (FK -> `events.id`), `status` (`confirmed` or `cancelled`), `checked_in_at`, `registered_at`, with `UNIQUE(user_id, event_id)`.

## Authentication & Architecture
- **Auth Flow:**
  1. *Login:* `SELECT` user account by email -> verify password with `bcrypt.compare` in Node.js -> generate random 32-byte bearer token, compute SHA-256 hash, and `UPDATE users` setting `session_token_hash` and a 7-day `session_expires_at` (`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY)`).
  2. *Protected Requests:* Every authenticated request hashes the incoming bearer token and performs an SQL lookup to verify session validity (`session_expires_at > UTC_TIMESTAMP()`) and load the user's current role.
  3. *Logout:* `UPDATE users SET session_token_hash = NULL, session_expires_at = NULL`.
- **Session Policy:** One active session per account; signing in on another device replaces the previous session.
- **Passwords:** Minimum 6 characters, maximum 72 UTF-8 bytes. Plaintext passwords and SQL password hashes are never output or exposed.
- **Roles & Scope:** Student vs. organizer selection is a classroom demonstration; no privilege approval workflow is claimed. Event fees are display-only (no payments processed).

## Supported Workflows & Routes
- **Students / Public:** Browse public events, register for events, view "My Events", and display QR tickets (`SHOWUP-REG-<id>`).
- **Organizers:** CRUD event management, view attendee lists, export attendee CSVs, and perform check-ins manually or via QR scanner.
- **Retired Features:** Teams, community (announcements, questions, winners), campus maps, and certificates are retired.
- **Database Migrations:** Fresh installs run `npm run db:init` (3 final tables). Existing databases run `npm run db:upgrade` to add session columns additively without deleting records or retired tables. Never run a destructive reset as a normal upgrade path (`npm run db:reset` is intentionally destructive for local development only).
- **Demo Accounts:** `codecell@showup.local` (organizer) and `ananya@showup.local` (student). Refer to the `sql/seed.sql` header for the actual demo password.

## Verification & Checks
- **Build & Lint:** `npm run build` and `npm run lint`.
- **Tests:** `npm test` runs auth, redirect and ticket-code unit tests plus optional MySQL integration tests.
- **Explicit Integration Command:** `SHOWUP_TEST_DATABASE=showup_test_checks node --test server/core.integration.test.js` (requires `DB_*` in `.env`, runs against a separate guarded test database) plus `node --test src/lib/authRedirect.test.js`. Integration tests remain disabled unless an explicit test database is provided.
- **SQL Scripts:** `sql/schema.sql` (table definitions), `sql/auth-upgrade.sql` (additive migration), `sql/seed.sql` (demo data), and `sql/examples.sql` (read-only learner queries).
