# SchemaPilot — API Contract Drift Monitor

A developer tool that monitors public JSON APIs over time, infers their schemas, detects breaking contract drift via deterministic rules, and surfaces field-level diffs in a React dashboard.

> Severity classification is fully deterministic and unit-tested. The LLM layer is optional and only used to convert validated structured diffs into developer-readable changelogs.

## Stack

- Backend: FastAPI + SQLAlchemy 2 + Alembic + Pydantic v2
- Frontend: React + TypeScript + Vite + Tailwind
- DB: PostgreSQL 16
- Cron: GitHub Actions
- Deploy: Cloud Run (backend), Vercel (frontend), Neon (db)

## Quickstart

```bash
cp .env.example .env
docker compose up -d --build
curl -X POST http://localhost:8000/api/monitor/run-once \
  -H "X-SCHEMAPILOT-ADMIN-SECRET: dev-secret"
```

Open http://localhost:5173.

(Detailed sections — architecture, severity table, deploy guide, limitations — added in Phase 10.)
