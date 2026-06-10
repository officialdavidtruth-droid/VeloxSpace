# Velox Space

Campaign intelligence at velocity — built on Supabase + Cloudflare Workers AI + Netlify.

---

## Setup (in order)

### 1. Supabase — create the database tables

1. Go to supabase.com → create a free account → New project → name it `velox-space`
2. Wait ~2 min for it to spin up
3. In your project: **SQL Editor → New query**
4. Paste the entire contents of `supabase/schema.sql` and click **Run**
5. Go to **Authentication → Providers → Email** — make sure it's enabled
6. Go to **Authentication → Settings** → disable **"Enable email confirmations"** (so you can sign in immediately without checking email during dev)
7. Go to **Project Settings → API** → copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

### 2. Cloudflare Workers AI

1. dash.cloudflare.com → free account → Workers & Pages → AI → enable
2. My Profile → API Tokens → Create Token → Workers AI template
3. Copy Account ID (right sidebar) → `CLOUDFLARE_ACCOUNT_ID`
4. Copy the token → `CLOUDFLARE_API_TOKEN`

### 3. GitHub

Push this project to a GitHub repo.

### 4. Netlify

1. app.netlify.com → Add new site → Import from Git → select your repo
2. Site configuration → Environment variables → add all 4 variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Deploys → Trigger deploy

---

## Everyday workflow

1. Open github.com/your-username/velox-space
2. Press `.` → GitHub.dev opens in browser
3. Edit/paste code
4. Commit → Netlify auto-deploys in ~60s
