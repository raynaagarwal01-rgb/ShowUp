# ShowUp

One login, one dashboard, every event — a modern campus event discovery and
registration platform. Built as the antidote to a pile of Google Forms and clunky legacy portals.

## What's in here

- **Discovery** — search, filters (category, price, solo/team), event detail
  pages with rules, venue, and live seat counts.
- **Accounts & roles** — one profile per person, `student` or `organizer`.
  Reused across every registration, no retyping.
- **Registration** — solo or team (create a team, share a join code).
  Automatic waitlisting once an event is full, with auto-promotion when
  someone cancels.
- **QR tickets** — every registration gets a scannable ticket, visible from
  "My Events".
- **Organizer studio** — create/edit events, see registrants live, export a
  CSV, and check people in with a camera-based QR scanner (or paste a ticket
  ID manually if there's no camera).
- **Forgot password** — a real reset flow (`/forgot-password`, `/reset-password`).
  It emails a single-use link that expires after an hour.
- **Registration notifications** — confirming a registration (solo, team
  create, or team join) fires an email + SMS + WhatsApp notification. See
  [Notifications](#registration-notifications) below — email is close to
  turnkey (just an API key), SMS/WhatsApp need a messaging provider account.

## How it's built

```text
React app (Vite)  ──►  Node/Express API (server/)  ──►  MySQL
   src/                 plain SQL via mysql2            sql/schema.sql
```

Everything is stored in **MySQL**. The browser never talks to the database
directly: the React app calls a small Express API (`server/`), which runs
parameterised SQL and enforces who may do what. Accounts, passwords (bcrypt),
login sessions and password-reset tokens all live in MySQL tables too.

## Running it

You need **Node 20+** and **MySQL 8.0+**.

```bash
npm install
cp .env.example .env        # then set DB_USER / DB_PASSWORD for your MySQL
npm run db:init             # creates the `showup` database and all tables
npm run db:seed             # optional: loads a handful of sample events
npm run dev                 # API on :3001 + web app on http://localhost:5173
```

`npm run db:init` is safe to re-run. If you'd rather use the `mysql` client
directly, the same schema is plain SQL:

```bash
mysql -u root -p < sql/schema.sql
```

Sign up as an **organizer** in one browser and a **student** in another to try
the full loop: create an event (or click "Create Sample Event") → register →
check in.

### Production

```bash
npm run build               # builds the React app into dist/
NODE_ENV=production npm start
```

`npm start` runs one process that serves both the built site and the API (on
`PORT`, default 3001), so there is a single origin and no CORS to configure.
Set `APP_URL` to your public URL (used in emailed links) and `TRUST_PROXY=true`
if you're behind a reverse proxy. Any host that can run Node and reach a MySQL
server will do — static-only hosting (e.g. plain Vercel/Netlify) can't run the
API.

## Database

`sql/schema.sql` defines every table:

| Table | Purpose |
| --- | --- |
| `profiles` | people + login credential (bcrypt hash) |
| `sessions` | login sessions (only a hash of the token is stored) |
| `password_resets` | single-use, expiring reset tokens (hashed) |
| `events` | events (`rules` is a JSON array) |
| `teams`, `team_members` | teams and their membership |
| `registrations` | one row per person per event: `confirmed` / `waitlisted` / `cancelled` |
| `announcements`, `event_questions` | organizer updates and the Q&A forum |
| `event_winners` | published results |
| `teammate_listings` | "looking for teammates" posts |

Deleting an event cascades to everything that belongs to it. Seat counts and
waitlist promotion run inside transactions with row locks, so two people
can't both take the last seat.

Timestamps are stored as UTC.

### Loading real events

`npm run sync:unstop` and `npm run sync:gravitas` fetch public listings and
write a MySQL script (`scripts/unstop_events.sql`, `scripts/gravitas_events.sql`).
Load it into your database:

```bash
mysql -u root -p showup < scripts/unstop_events.sql
```

The events are owned by an organizer account looked up by email. By default
that's the placeholder organizer created by `npm run db:seed`; set
`SYNC_CREATOR_EMAIL` to use a real organizer instead.

## Forgot password

`/forgot-password` emails a link to `/reset-password?token=…` on `APP_URL`.
Email goes out through Resend (`RESEND_API_KEY`). **If no email provider is
configured, the link is printed to the API server's console in development**
so you can still finish the flow locally; in production nothing is logged and
no email is sent until you configure one.

Teammates added by a team leader who don't have an account yet get a
placeholder account with no password. They claim it with "Forgot password"
(which proves they own the email address).

## Registration notifications

Confirming a registration calls `notifyRegistrationConfirmed`
(`src/lib/notifications.ts`), which asks the API to deliver it
(`server/notify.js`). The server reads the event, recipient and status from the
database — the browser only says *which registration* — so the endpoint can't
be used to message arbitrary people. Each channel is a no-op until you
configure its provider in `.env`; nothing is faked or partially wired:

- **Email (Resend)** — `RESEND_API_KEY=re_...` and `RESEND_FROM="ShowUp <onboarding@resend.dev>"`.
  Sign up at [resend.com](https://resend.com) (free 3,000 emails/month). You
  can test immediately using `onboarding@resend.dev` or add your own verified domain.
- **SMS (India-first)** — `TWOFACTOR_API_KEY=...` (2Factor) or
  `FAST2SMS_API_KEY=...` (Fast2SMS). Deliver to Indian (+91) numbers.
- **SMS (Twilio — international)** — `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_SMS_FROM`. Used as the fallback, or for numbers outside India.
- **WhatsApp (Twilio)** — `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`.
  Needs a WhatsApp Business sender approved via Meta business verification,
  or Twilio's sandbox number for testing.

Until a channel is configured it is skipped, and the event page says so
("Notification not sent") rather than claiming a message went out.
Registrations succeed either way — a notification failing should never undo one.

## Deliberately not built yet

These need your own accounts/credentials, so they're structured for but not
wired up:

- **Payments** — events have a `fee` field and a paid/free badge, but there's
  no Razorpay integration. Add an API route that creates a Razorpay order and
  verifies the payment webhook server-side before marking a registration
  `confirmed` — never trust a client-side "payment succeeded" flag alone.
- **Certificates** — not generated yet. Once an event ends, a template + the
  registrant's name is enough to render a PDF from the API.
- **Magic-link/OTP sign-in** — the current auth is plain email + password
  (with a real forgot-password flow — see above). Swapping to OTP or Google
  sign-in would remove passwords from the picture entirely; it's contained in
  `server/routes/auth.js` and `src/context/AuthContext.tsx`.

## Project structure

```text
sql/
  schema.sql            # the whole MySQL schema (idempotent)
server/
  index.js              # Express app: API + serves dist/ in production
  config.js, db.js      # env config, MySQL pool, transaction helper
  auth.js               # bcrypt, sessions, auth middleware, rate limiting
  queries.js            # shared lookups (visible event, seat stats, teams)
  mappers.js            # DB rows -> the JSON shapes the app expects
  notify.js             # email / SMS / WhatsApp delivery
  migrate.js, seed.js   # `npm run db:init` / `npm run db:seed`
  routes/               # auth, events, registrations, teams, users,
                        # community (announcements/Q&A/winners/listings),
                        # notifications, organizer (sample event)
src/
  lib/
    api.ts              # fetch wrapper for the API (+ login token storage)
    db.ts               # data access layer — one function per API call
    notifications.ts    # registration-confirmed notifications
    indiaStates.ts, indiaCities.ts  # curated state -> city data for the dropdowns
  context/
    AuthContext.tsx     # sign in/up/out, profile, password reset
  components/           # Navbar, EventCard, QRTicket, CitySelect, route guards, etc.
  pages/                # student-facing pages
  pages/organizer/      # event creation, registrant list, check-in scanner
scripts/                # syncUnstop.js, syncGravitas.js -> MySQL import scripts
```
