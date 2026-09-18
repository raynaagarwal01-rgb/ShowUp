# Feastify

One login, one dashboard, every club's events — a campus event registration and
hosting platform. Built as the antidote to a pile of Google Forms and a
bolted-on legacy portal for the "real" registration step.

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

## Running it

```bash
npm install
npm run dev
```

It runs immediately in **demo mode** — no Supabase project needed. Data
(accounts, events, registrations, teams) is stored in your browser's
localStorage, seeded with a handful of sample events. Sign up as an
**organizer** in one browser tab and a **student** in another (or just sign
out and back in) to try the full loop: create an event → register → check in.

Demo-mode passwords are stored in plain text in localStorage. That's fine for
trying the app locally — **never treat demo mode as production auth.**

## Going live with Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase_schema.sql`](supabase_schema.sql) in the SQL Editor — it
   creates `profiles`, `events`, `teams`, `registrations`, and the RLS
   policies that scope each person to their own data.
3. Copy `.env.example` to `.env` and fill in your project URL and anon key.
4. Enable email/password auth in Supabase Auth settings (or swap in
   magic-link/OTP — see below).
5. Restart `npm run dev`. The app detects real credentials automatically and
   switches out of demo mode (`src/lib/supabase.ts`).

## Deliberately not built yet

These need your own accounts/credentials, so they're structured for but not
wired up:

- **Payments** — events have a `fee` field and a paid/free badge, but there's
  no Razorpay integration. Add a Supabase Edge Function that creates a
  Razorpay order and verifies the payment webhook server-side before marking
  a registration `confirmed` — never trust a client-side "payment succeeded"
  flag alone.
- **Email** — no confirmation/reminder emails yet. A Supabase Edge Function
  + Resend (or similar) triggered on registration insert is the natural next
  step.
- **Certificates** — not generated yet. Once an event ends, a template + the
  registrant's name is enough to render a PDF via an Edge Function.
- **Magic-link/OTP sign-in** — the current auth is plain email + password via
  Supabase Auth. Swapping to OTP or Google sign-in removes the "forgot my
  fest password next year" problem entirely; it's a small change in
  `src/context/AuthContext.tsx` plus a Supabase Auth setting.

## Project structure

```text
src/
  lib/
    supabase.ts      # Supabase client + isSupabaseConfigured flag
    demoStorage.ts    # localStorage-backed demo data store
    db.ts             # data access layer — every call branches on
                       # isSupabaseConfigured so components don't have to
  context/
    AuthContext.tsx   # sign in/up/out, demo + real Supabase paths
  components/         # Navbar, EventCard, QRTicket, route guards, etc.
  pages/              # student-facing pages
  pages/organizer/    # event creation, registrant list, check-in scanner
```
