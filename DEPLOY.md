# Production Deploy Guide (Free Tier)

Zero cost at portfolio scale: Neon (DB) + Cloud Run (backend) + Vercel (frontend) + GitHub Actions (cron).

---

## 1. Neon Postgres

1. Sign up at [neon.tech](https://neon.tech) and create a free project called `schemapilot`.
2. From the **Dashboard → Connection Details** copy:
   - **Pooler URL** (for the app): `postgresql+asyncpg://...@ep-xxx.neon.tech/schemapilot?sslmode=require`
   - **Direct URL** (for Alembic): `postgresql://...@ep-xxx.neon.tech/schemapilot?sslmode=require`

   Prefix the pooler URL with `postgresql+asyncpg://` for `DATABASE_URL`.

3. No manual schema setup needed — Alembic runs on container start.

---

## 2. Backend on Cloud Run

### Prerequisites
- [Install `gcloud` CLI](https://cloud.google.com/sdk/docs/install)
- Create a GCP project (free tier works; billing account required but not charged at this scale)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

### Build and push

```bash
# From repo root
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/schemapilot-backend \
  ./backend
```

### Deploy

```bash
gcloud run deploy schemapilot-backend \
  --image gcr.io/YOUR_PROJECT_ID/schemapilot-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --timeout 120 \
  --set-env-vars "\
DATABASE_URL=postgresql+asyncpg://USER:PASS@HOST/schemapilot?sslmode=require,\
DATABASE_URL_SYNC=postgresql://USER:PASS@HOST/schemapilot?sslmode=require,\
ADMIN_SECRET=your-strong-secret-here,\
FRONTEND_ORIGINS=https://YOUR_VERCEL_DOMAIN.vercel.app,\
REGISTRY_PATH=/app/config/apis.yaml,\
ANTHROPIC_API_KEY=sk-ant-..."
```

Note the deployed URL: `https://schemapilot-backend-xxxx-uc.a.run.app`

---

## 3. Frontend on Vercel

1. Push this repo to GitHub (already done).
2. Go to [vercel.com](https://vercel.com), import the repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `VITE_API_BASE_URL` = your Cloud Run URL (e.g. `https://schemapilot-backend-xxxx-uc.a.run.app`)
   - `VITE_ADMIN_SECRET` = same value as `ADMIN_SECRET` on backend
5. Deploy. Note the Vercel domain (e.g. `schemapilot.vercel.app`).
6. Update the Cloud Run `FRONTEND_ORIGINS` env var with this domain and redeploy:
   ```bash
   gcloud run services update schemapilot-backend \
     --region us-central1 \
     --update-env-vars FRONTEND_ORIGINS=https://schemapilot.vercel.app
   ```

---

## 4. GitHub Actions secrets

In GitHub repo → Settings → Secrets → Actions, add:

| Secret | Value |
|---|---|
| `SCHEMAPILOT_BACKEND_URL` | Cloud Run URL |
| `SCHEMAPILOT_ADMIN_SECRET` | Same as `ADMIN_SECRET` |

Test the cron manually via Actions → SchemaPilot Monitor → Run workflow.

---

## Free-tier usage estimate

| Resource | Usage | Free limit |
|---|---|---|
| Neon storage | ~40 KB/day | 500 MB |
| Cloud Run requests | ~10/day (cron + dashboard) | 2M/month |
| Cloud Run CPU-sec | ~2s/day | 360K/month |
| Vercel builds | ~1/deploy | 100/month |
| GitHub Actions | ~1 min/day | 2000 min/month (public repo: unlimited) |

**Monthly cost: $0**
