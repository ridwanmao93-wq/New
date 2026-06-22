# Personal Performance Dashboard

> ### 👉 Just want it running? Follow **[START_HERE.md](START_HERE.md)** — 6 steps, ~20 minutes, no coding.
>
> [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fridwanmao93-wq%2Fnew&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,OURA_ACCESS_TOKEN,CRON_SECRET&envDescription=Paste%20your%20Supabase%20keys%20and%20Oura%20token&envLink=https%3A%2F%2Fgithub.com%2Fridwanmao93-wq%2Fnew%2Fblob%2Fmain%2FSTART_HERE.md)

A private **personal operating system** that connects physical health, mindset,
CBT / self-esteem practice, sobriety, discipline, relationships, money and
weekly review into one dashboard — built to help you stay **sober, courageous,
disciplined, healthy, and aligned with your values**.

It is **not** a generic habit tracker. It is designed around:

- 🟦 **Oura** biometrics (auto-synced daily)
- 🌅 **Morning** self-esteem / CBT practice (centering, self-rating, sentence
  completion, identity-aware action, affirmation)
- 🌙 **Evening** reflection (lightweight — gratitude & surrender)
- 🏋️ **Workout** consistency
- 💧 **Hydration** (manual now; extendable to LARQ / Apple Health later)
- ⚖️ **Weight** & progress
- 🎯 **Daily Alignment**, **Sobriety**, **Momentum**, **Anti-Avoidance**,
  **Relationships**, **Debt freedom**, and a **Future Self** page
- 📊 **Weekly reviews** and **plain-English correlations**

---

## 1. Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (dark mode, card-based, mobile-friendly)
- **Supabase** (PostgreSQL + Auth, row-level security)
- **Recharts** for charts
- **Zod** for validation
- **Oura API v2**
- Deployable to **Vercel** (with Vercel Cron for the daily Oura sync)

---

## 2. Setup (local)

```bash
git clone <your-repo>
cd <repo>
npm install
cp .env.example .env.local   # fill in your values (see §4)
npm run dev                  # http://localhost:3000
```

### npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint |
| `npm run sync:oura` | Sync Oura (yesterday) — `npm run sync:oura 2026-06-01 2026-06-07` to backfill |
| `npm run generate:weekly-review` | Generate this week’s review |

---

## 3. Supabase setup

1. Create a project at <https://supabase.com>.
2. **Settings → API**: copy the **Project URL**, the **anon** key, and the
   **service_role** key into your env (see §4).
3. **Database migration** — open **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   and run it. This creates every table, the auto-profile trigger, indexes,
   and **row-level security** so each user only sees their own rows.
   - (Optional, with the Supabase CLI: `supabase db push`.)
4. **Auth** — under **Authentication → Providers**, keep **Email** enabled.
   Because this is a private single-user app, after you sign up once you can
   **disable new sign-ups** (Authentication → Settings) to lock it down.

### Database tables

`profiles`, `oura_daily_metrics`, `cbt_morning_entries`,
`cbt_evening_entries`, `workouts`, `weight_entries`, `hydration_entries`,
`weekly_reviews`, plus the Life-OS tables: `daily_alignment_entries`,
`sobriety_entries`, `debt_entries`, `daily_momentum_entries`,
`anti_avoidance_entries`, `relationship_entries`, `future_self_goals`.
All fields are defined in the migration file.

---

## 4. Environment variables

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon public key

SUPABASE_URL=                    # same Project URL (server-side)
SUPABASE_ANON_KEY=               # same anon key (server-side)
SUPABASE_SERVICE_ROLE_KEY=       # service_role key — server only, keep secret

OURA_ACCESS_TOKEN=               # Oura Personal Access Token

CRON_SECRET=                     # any random string (for Vercel Cron / CLI)
DASHBOARD_USER_ID=               # your Supabase auth user id (for cron/CLI)
```

Secrets are never hardcoded. The service-role key is only ever used on the
server (API routes / CLI) and never shipped to the browser.

---

## 5. Oura API setup

1. Go to <https://cloud.ouraring.com/personal-access-tokens> and create a
   **Personal Access Token**.
2. Put it in `OURA_ACCESS_TOKEN`.
3. Test it from the **Settings** page (“Sync Oura now”) or via CLI:
   ```bash
   npm run sync:oura
   ```

The sync **upserts on (user_id, date)** so re-running never creates duplicate
rows. The daily job syncs **yesterday** (the current day is incomplete until
the ring syncs after sleep).

---

## 6. Running locally

```bash
npm run dev
```

- Visit `/login`, create an account, then you’re routed to `/dashboard`.
- Middleware protects every page and redirects to `/login` when signed out.

---

## 7. Deploy to Vercel

1. Push the repo to GitHub and **Import** it in Vercel.
2. Add all environment variables from §4 in **Project → Settings →
   Environment Variables**.
3. Deploy. `vercel.json` registers a **daily cron** at `06:00 UTC` that calls
   `GET /api/sync/oura`. Vercel automatically sends
   `Authorization: Bearer $CRON_SECRET`; the route then uses the service-role
   client with `DASHBOARD_USER_ID` to sync without a browser session.
4. In Supabase **Authentication → URL Configuration**, set your Vercel URL as
   the Site URL.

---

## 8. Syncing Oura data

- **UI:** Settings → “Sync Oura now (yesterday)”.
- **API:** `POST /api/sync/oura` (yesterday) or
  `GET /api/sync/oura?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` (backfill).
- **CLI:** `npm run sync:oura` or `npm run sync:oura 2026-06-01 2026-06-07`.
- **Cron:** automatic daily via `vercel.json`.

---

## 9. Generating weekly reviews

- **UI:** `/weekly-review` → “Generate Weekly Review” (add reflection notes &
  intentions first).
- **API:** `POST /api/generate-weekly-review`.
- **CLI:** `npm run generate:weekly-review`.

It aggregates the previous 7 days: CBT averages, Oura averages, workout count,
hydration average, morning/evening completion %, and current/longest streaks,
then upserts a `weekly_reviews` row.

---

## 10. Pages

| Route | What it does |
| --- | --- |
| `/dashboard` | Top section (sober streak, alignment, momentum, identity, debt, most important action) + core stats + sobriety/identity/debt cards + trend charts |
| `/daily-check-in` | One morning page: morning CBT + alignment + sobriety + momentum + anti-avoidance + most important action |
| `/morning` | Full morning practice |
| `/evening` | Lightweight evening practice |
| `/evening-shutdown` | Evening CBT + sobriety + momentum review + anti-avoidance + gratitude/surrender |
| `/workout` `/weight` `/hydration` | Tracking forms |
| `/weekly-review` | Generate & view weekly reviews |
| `/correlations` | Plain-English insight cards |
| `/future-self` | 12-month statement + goals with progress bars |
| `/settings` | Profile, goals, Oura token instructions, manual sync |

---

## 11. Validation (Zod)

- Mood / energy / hopefulness / intensity / alignment scores must be **1–10**.
- Weight and hydration must be **positive**.
- Dates are required and **default to today** when blank.
- Morning practice requires **2–3 sentence stems**, each with **5–10**
  responses.
- Alignment score = average of its four sub-scores; momentum score = % of the
  eight items completed (computed automatically).

---

## 12. Future improvements

- LARQ / Apple Health hydration import (the `source` field is already in place).
- kg/lbs toggle (defaults to lbs today).
- Push reminders for the morning check-in and evening shutdown.
- Richer analytics (rolling correlations, anomaly flags).
- Progress-photo uploads via Supabase Storage.

---

## Acceptance checklist

1. ✅ Sign in (Supabase Auth, middleware-protected routes)
2. ✅ Submit morning CBT
3. ✅ Submit evening CBT
4. ✅ Submit a workout
5. ✅ Submit weight
6. ✅ Submit hydration
7. ✅ Sync Oura data (UI / API / CLI / cron)
8. ✅ No duplicate Oura rows (upsert on user_id + date)
9. ✅ View the dashboard
10. ✅ See trend charts
11. ✅ Generate a weekly review
12. ✅ View correlations
13. ✅ Deployable to Vercel (with daily cron)
14. ✅ README explains every step

---

## Project structure

```
app/
  dashboard/ morning/ evening/ evening-shutdown/ daily-check-in/
  workout/ weight/ hydration/ weekly-review/ correlations/
  future-self/ settings/ login/
  api/sync/oura/  api/generate-weekly-review/  auth/signout/
components/
  ui/         shadcn/ui primitives
  forms/      FormShell, fields, morning + sentence-stems
  charts/     Recharts trend chart + chart card
  dashboard/  stat cards & progress bars
  nav.tsx     page-header.tsx  sync-oura-button.tsx
lib/
  supabase/   client / server / admin / middleware
  oura/       client + sync
  analytics/  correlation, insights, weekly-review
  validation/ Zod schemas
  dates/      date helpers
  actions.ts  server actions (all form submissions)
  data.ts     dashboard data access
supabase/
  migrations/0001_init.sql
scripts/
  syncOura.ts  generateWeeklyReview.ts
```
