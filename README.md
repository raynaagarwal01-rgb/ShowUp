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
- **Forgot password** — a real reset flow (`/forgot-password`, `/reset-password`).
  In Supabase mode it emails a genuine reset link; demo mode has no email
  transport, so it lets you set a new password directly instead of faking one.
- **Registration notifications** — confirming a registration (solo, team
  create, or team join) fires an email + SMS + WhatsApp notification via a
  Supabase Edge Function. See [Notifications](#registration-notifications)
  below — email is close to turnkey (just an API key), SMS/WhatsApp need a
  messaging provider account.

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
6. Forgot-password starts working automatically once Supabase Auth is live —
   no extra setup. It emails a link to `/reset-password` on whatever domain
   you're running on (`window.location.origin`), so it'll correctly point at
   `localhost` in dev and your real domain in production.

## Registration notifications

Confirming a registration calls `notifyRegistrationConfirmed`
(`src/lib/notifications.ts`), which in Supabase mode invokes the
`send-registration-notification` Edge Function
(`supabase/functions/send-registration-notification/index.ts`). That function
handles all three channels, but **each one is a no-op until you configure its
provider** — nothing is faked or partially wired:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link
   it to your project (`supabase link`).
2. Deploy the function: `supabase functions deploy send-registration-notification`.
3. Turn on whichever channels you want:
   - **Email (Resend)** — `supabase secrets set RESEND_API_KEY=... RESEND_FROM="Feastify <noreply@yourdomain.com>"`.
     Closest to turnkey: sign up at [resend.com](https://resend.com), verify a
     sending domain, done.
   - **SMS (Twilio)** — `supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_SMS_FROM=+1xxxxxxxxxx`.
     Needs a Twilio account and a number capable of sending SMS. **For Indian
     numbers specifically**, international SMS gateways are routinely
     filtered by carriers unless the sender is registered with India's DLT
     (telecom) framework — an India-first provider (MSG91, Gupshup) that
     handles DLT for you may be more reliable in practice than Twilio here.
     `sendSms` in the Edge Function is the one place to swap providers.
   - **WhatsApp (Twilio)** — `supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`.
     Needs a WhatsApp Business sender approved via Meta business
     verification (not instant); Twilio's sandbox number works for testing
     but only reaches numbers that have opted into the sandbox first.

Until any of these secrets are set, that channel is silently skipped (the
function reports `skipped_not_configured` per channel) — registrations still
succeed either way, since a notification failing should never undo one.

In **demo mode**, there's no backend to actually deliver anything, so
`notifyRegistrationConfirmed` logs what it would have sent to the browser
console instead of pretending an email/SMS/WhatsApp went out.

## Deliberately not built yet

These need your own accounts/credentials, so they're structured for but not
wired up:

- **Payments** — events have a `fee` field and a paid/free badge, but there's
  no Razorpay integration. Add a Supabase Edge Function that creates a
  Razorpay order and verifies the payment webhook server-side before marking
  a registration `confirmed` — never trust a client-side "payment succeeded"
  flag alone.
- **Certificates** — not generated yet. Once an event ends, a template + the
  registrant's name is enough to render a PDF via an Edge Function.
- **Magic-link/OTP sign-in** — the current auth is plain email + password via
  Supabase Auth (with a real forgot-password flow — see above). Swapping to
  OTP or Google sign-in would remove passwords from the picture entirely;
  it's a small change in `src/context/AuthContext.tsx` plus a Supabase Auth
  setting.

## Project structure

```text
src/
  lib/
    supabase.ts        # Supabase client + isSupabaseConfigured flag
    demoStorage.ts      # localStorage-backed demo data store
    db.ts               # data access layer — every call branches on
                         # isSupabaseConfigured so components don't have to
    notifications.ts     # registration-confirmed notifications (email/SMS/WhatsApp)
    indiaStates.ts, indiaCities.ts  # curated state -> city data for the dropdowns
  context/
    AuthContext.tsx     # sign in/up/out, password reset, demo + real Supabase paths
  components/           # Navbar, EventCard, QRTicket, CitySelect, route guards, etc.
supabase/
  functions/
    send-registration-notification/  # Edge Function: Resend email + Twilio SMS/WhatsApp
  pages/              # student-facing pages
  pages/organizer/    # event creation, registrant list, check-in scanner
```
