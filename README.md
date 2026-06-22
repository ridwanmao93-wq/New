# Personal Performance Dashboard

One small, reliable system that pulls your **Oura Ring**, **hydration**, **CBT
morning/evening practice**, **workouts**, and **weight** into a single
**Airtable** base — ready to visualise in **Looker Studio**.

- **Oura data** syncs automatically once per day (yesterday's data).
- **CBT, workouts, weight, hydration** are entered through simple web forms.
- **Everything lands in Airtable** as the single source of truth.
- **Export endpoints** produce clean JSON/CSV for Looker Studio.

Built with Node.js + TypeScript + Express, validated with Zod, scheduled with
node-cron. No over-engineering — the goal is that the data lands cleanly.

---

## 1. Quick start (local)

```bash
git clone <your-repo>
cd <repo>
npm install
cp .env.example .env      # then fill in your secrets (see below)
npm run dev               # http://localhost:3000
```

Open <http://localhost:3000> for the home page, or
<http://localhost:3000/dashboard> for the dashboard.

### npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run with live reload (ts-node + nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |
| `npm run sync:oura` | Sync yesterday's Oura data (or `npm run sync:oura 2026-06-20`) |
| `npm run scorecard` | Generate the weekly scorecard for the last 7 days |

---

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```
AIRTABLE_API_KEY=        # Personal access token from airtable.com/create/tokens
AIRTABLE_BASE_ID=        # Starts with "app...", from the API docs of your base
AIRTABLE_DAILY_HEALTH_TABLE=Daily Health Metrics
AIRTABLE_CBT_MORNING_TABLE=CBT Morning Entries
AIRTABLE_CBT_EVENING_TABLE=CBT Evening Entries
AIRTABLE_WORKOUTS_TABLE=Workouts
AIRTABLE_WEIGHT_TABLE=Weight Tracking
AIRTABLE_HYDRATION_TABLE=Hydration
AIRTABLE_WEEKLY_SCORECARD_TABLE=Weekly Scorecard

OURA_ACCESS_TOKEN=       # Personal access token from cloud.ouraring.com

PORT=3000
CRON_ENABLED=true
OURA_SYNC_CRON=0 6 * * * # daily at 06:00 server time
```

Secrets are never hardcoded — the app validates the environment on boot and
exits with a clear message if anything required is missing.

---

## 3. Airtable setup

1. Create a new **base** (e.g. "Performance Dashboard").
2. Create an **API token** at <https://airtable.com/create/tokens> with the
   `data.records:read` and `data.records:write` scopes, granted access to your
   base. Put it in `AIRTABLE_API_KEY`.
3. Find your **Base ID** (starts with `app…`) at
   <https://airtable.com/api> → select your base. Put it in `AIRTABLE_BASE_ID`.
4. Create the **7 tables** below. Field names must match exactly (the app maps
   to them by name). Table names can be anything — just keep them in sync with
   the `AIRTABLE_*_TABLE` env vars.

> Tip: the **Date** field in each table should be an Airtable *Date* field.
> Score fields can be *Number*. `Completed Yes/No` and `Source` work well as
> *Single select*. Everything else can be *Single line text* / *Long text*.

### Tables & fields

**Daily Health Metrics** — `Date`, `Oura Sleep Score`, `Oura Readiness Score`,
`Oura Activity Score`, `Total Sleep Duration`, `Resting Heart Rate`, `HRV`,
`Steps`, `Calories Burned`, `Sleep Efficiency`, `Deep Sleep Duration`,
`REM Sleep Duration`, `Awake Time`, `Source`, `Synced At`

**CBT Morning Entries** — `Date`, `Mood Score 1-10`, `Energy Score 1-10`,
`Hopefulness Score 1-10`, `Sentence Completion Stem 1`,
`Sentence Completion Answers 1`, `Sentence Completion Stem 2`,
`Sentence Completion Answers 2`, `Today I will act like`,
`One action aligned with my values today`, `One small goal for today`,
`Notes`, `Created At`

**CBT Evening Entries** — `Date`, `Mood Score 1-10`, `Energy Score 1-10`,
`Hopefulness Score 1-10`, `What went well`, `Where I acted with values`,
`Key emotions`, `Trigger/Event`, `Automatic Thought`, `Cognitive Distortion`,
`Balanced Perspective`, `Gratitude 1`, `Gratitude 2`, `Gratitude 3`, `Notes`,
`Created At`

**Workouts** — `Date`, `Workout Type`, `Duration Minutes`, `Exercises`,
`Sets/Reps/Weight`, `Intensity 1-10`, `Completed Yes/No`, `Notes`, `Created At`

**Weight Tracking** — `Date`, `Weight`, `Waist Measurement`,
`Progress Photo URL`, `Notes`, `Created At`

**Hydration** — `Date`, `Water Intake ML`, `Water Intake OZ`,
`Hydration Goal ML`, `Hydration Goal Percentage`, `Source`, `Notes`,
`Created At`

**Weekly Scorecard** — `Week Start Date`, `Week End Date`, `Average Mood`,
`Average Energy`, `Average Hopefulness`, `Average Sleep Score`,
`Average Readiness Score`, `Average HRV`, `Average Resting Heart Rate`,
`Average Weight`, `Workouts Completed`, `Average Water Goal Percentage`,
`CBT Morning Completion %`, `CBT Evening Completion %`, `Weekly Reflection`,
`Created At`

---

## 4. Oura setup

1. Go to <https://cloud.ouraring.com/personal-access-tokens> and create a
   **Personal Access Token**.
2. Put it in `OURA_ACCESS_TOKEN`.
3. Test it:
   ```bash
   npm run sync:oura          # syncs yesterday into Daily Health Metrics
   ```

The sync **upserts by date** — running it again for the same day updates the
existing row instead of creating a duplicate. The daily cron job (when
`CRON_ENABLED=true`) syncs **yesterday's** data, because the current day's
metrics are incomplete until the ring syncs after sleep.

---

## 5. Pages & routes

### Forms (browser)

| Route | Purpose |
| --- | --- |
| `/morning` | Morning CBT practice |
| `/evening` | Evening CBT practice |
| `/workout` | Log a workout |
| `/weight` | Log weight / measurements |
| `/hydration` | Log water intake (ML or OZ; the other is auto-calculated) |
| `/dashboard` | Snapshot + 7-day trend tables |

### API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/sync/oura` | Sync Oura data. Optional body `{ "date": "YYYY-MM-DD" }` (defaults to yesterday) |
| `POST` | `/api/generate-weekly-scorecard` | Aggregate the last 7 days into the Weekly Scorecard table |
| `GET` | `/api/export/daily-health` | Export Daily Health Metrics |
| `GET` | `/api/export/cbt` | Export combined morning+evening CBT |
| `GET` | `/api/export/workouts` | Export Workouts |
| `GET` | `/api/export/weight` | Export Weight Tracking |
| `GET` | `/api/export/hydration` | Export Hydration |
| `GET` | `/api/export/weekly-scorecard` | Export Weekly Scorecard |
| `GET` | `/healthz` | Health check |

All export endpoints return JSON by default. Append `?format=csv` for CSV.

---

## 6. Looker Studio

You have two easy options:

**Option A — Google Sheet (recommended, most reliable):**
1. Open each export in your browser with `?format=csv`, e.g.
   `https://your-app.onrender.com/api/export/daily-health?format=csv`.
2. Import into a Google Sheet (one tab per table), or use
   `=IMPORTDATA("…?format=csv")` to keep it live.
3. In Looker Studio, add the Google Sheet as a data source.

**Option B — JSON connector:** point a community JSON/REST connector at the
JSON export endpoints.

Build charts on mood/sleep/readiness trends, weekly scorecard, hydration %, etc.

---

## 7. Validation rules (Zod)

- All 1–10 scores are rejected outside the 1–10 range.
- Morning/evening require mood, energy and hopefulness.
- Weight requires a positive number.
- Hydration requires either ML or OZ; the missing unit and goal % are derived.
- **Date** defaults to today if not provided, and must be `YYYY-MM-DD`.

---

## 8. Deployment

The app is a standard long-running Node server, so it deploys cleanly to
platforms that keep a process alive (so the daily cron runs).

### Render (recommended — includes `render.yaml`)
1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, pick the repo. It reads `render.yaml`.
3. Fill in `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `OURA_ACCESS_TOKEN` as secrets.
4. Deploy. The included `Procfile` also works for buildpack-style deploys.

### Railway
1. New project from repo. Build: `npm install && npm run build`. Start: `npm start`.
2. Add the env vars from `.env.example`.

### Vercel
Vercel is serverless, so a persistent `node-cron` won't run reliably. Two
options: (a) deploy the Express app and set `CRON_ENABLED=false`, then add a
**Vercel Cron Job** that hits `POST /api/sync/oura` daily; or (b) prefer
Render/Railway for the always-on cron. The forms, dashboard and exports work
fine on Vercel either way.

---

## 9. Acceptance checklist

1. ✅ Submit a morning CBT entry → appears in Airtable
2. ✅ Submit an evening CBT entry → appears in Airtable
3. ✅ Submit a workout → appears in Airtable
4. ✅ Submit weight → appears in Airtable
5. ✅ Submit hydration → appears in Airtable
6. ✅ `POST /api/sync/oura` (or `npm run sync:oura`) → yesterday's metrics in Airtable
7. ✅ Re-running Oura sync updates, never duplicates
8. ✅ `POST /api/generate-weekly-scorecard` (or `npm run scorecard`) → scorecard row
9. ✅ `/dashboard` renders the snapshot + trends
10. ✅ `/api/export/*` returns clean JSON/CSV for Looker Studio

---

## Project structure

```
src/
  app.ts                 Express app (routes wired up)
  server.ts              Boot server + start cron
  config/env.ts          Validated env config
  services/
    airtable.ts          Create / update / upsert-by-date / list
    oura.ts              Oura API v2 client + day sync
    weeklyScorecard.ts   7-day aggregation
  routes/                morning, evening, workout, weight, hydration,
                         ouraSync, scorecard, exports, dashboard
  schemas/               Zod schemas per form
  utils/                 dates, csv, html helpers
  cron/syncOuraDaily.ts  Daily Oura cron
  scripts/               CLI entrypoints for sync:oura & scorecard
```
