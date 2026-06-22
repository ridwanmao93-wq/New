# 🚀 Start Here — the simple version

Follow these 6 steps once. Takes about 20 minutes. No coding.

---

## Step 1 — Make the database (Supabase)

1. Go to **[supabase.com](https://supabase.com)** → sign in → **New project**.
   Pick any name and a password. Wait ~2 min for it to finish.
2. In the left menu click **SQL Editor** → **New query**.
3. Open the file [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   in this repo, copy **all** of it, paste into the editor, click **Run**.
   You should see “Success”.

## Step 2 — Copy your 3 Supabase keys

In Supabase, click **Settings (gear) → API**. Keep this tab open — you'll
copy these in Step 4:

- **Project URL**
- **anon public** key
- **service_role** key

## Step 3 — Get your Oura token

Go to **[cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens)**
→ **Create A Personal Access Token** → copy it.

## Step 4 — Deploy (one button)

Click this button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fridwanmao93-wq%2Fnew&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,OURA_ACCESS_TOKEN,CRON_SECRET&envDescription=Paste%20your%20Supabase%20keys%20and%20Oura%20token&envLink=https%3A%2F%2Fgithub.com%2Fridwanmao93-wq%2Fnew%2Fblob%2Fmain%2FSTART_HERE.md)

Vercel will ask you to paste each value. Use the table below
(👉 paste the **same** Supabase URL twice, and the **same** anon key twice):

| Box Vercel shows you | What to paste |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Step 2) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (Step 2) |
| `SUPABASE_URL` | Project URL again |
| `SUPABASE_ANON_KEY` | anon key again |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (Step 2) |
| `OURA_ACCESS_TOKEN` | Oura token (Step 3) |
| `CRON_SECRET` | type any random word, e.g. `bluefox42` |

Click **Deploy** and wait for it to finish. You'll get a link like
`https://your-app.vercel.app`.

## Step 5 — Create your account

1. Open your new link and add **/login** to the end:
   `https://your-app.vercel.app/login`
2. Click **Sign up**, enter your email + a password. You're in. 🎉

## Step 6 — Turn on automatic Oura sync (optional but nice)

1. In **Supabase → Authentication → Users**, click your user and copy the
   **User UID**.
2. In **Vercel → your project → Settings → Environment Variables**, add one
   more: name `DASHBOARD_USER_ID`, value = that UID. Save.
3. Click **Deployments → … → Redeploy**.

Done. Oura now syncs by itself every morning. You can also tap **Sync Oura now**
on the Settings page anytime.

---

### Did it work?

Open `https://your-app.vercel.app/api/health` in your browser.
If it says `"ok": true`, everything is wired up. If not, it tells you exactly
what's missing.

### Want to keep it private?

In **Supabase → Authentication → Providers/Sign In**, turn **off** new
sign-ups after you've created your account. Now only you can get in.
