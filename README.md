# SchemaPilot — API Contract Drift Monitor

A developer tool that monitors public JSON APIs over time, infers their response schemas, detects breaking contract drift via deterministic rules, and surfaces field-level diffs in a polished React dashboard.

> **SchemaPilot keeps compatibility classification deterministic and testable. The LLM layer is only used to convert validated structured diffs into developer-readable changelogs.**

---

## What it solves

APIs change without warning. A field gets renamed, a type widens, a previously-reliable value turns nullable — and your integration silently breaks. SchemaPilot runs scheduled polls against your API endpoints, infers JSON schemas from observed responses, and immediately alerts you when a contract drift is detected — before your users hit a runtime error.

Unlike OpenAPI linters or contract-testing frameworks, SchemaPilot works on **live HTTP responses** with no schema file required upfront.

---

## Architecture

```
GitHub Actions cron
        │
        ▼
POST /api/monitor/run-once
        │
        ▼
 registry_loader.py  ──▶  apis.yaml (endpoint registry)
        │
        ▼
   fetcher.py  ──▶  httpx async fetch + timeout
        │
        ▼
  normalizer.py  ──▶  deterministic key-sort + 256KB cap
        │
        ▼
 schema_infer.py  ──▶  JSON → list[SchemaNode]  (pure function)
        │
        ▼
  canonical.py  ──▶  SHA-256 hash (excludes example values)
        │
   hash changed?
      yes │
          ▼
 schema_diff.py  ──▶  (old, new) → list[Diff]   (pure function)
 severity.py     ──▶  change_type → severity     (pure lookup table)
        │
        ▼
PostgreSQL (schema_snapshots + schema_diffs + changelogs)
        │
        ▼
FastAPI exposes /api/* endpoints
        │
        ▼
React dashboard  ──▶  Dashboard / Endpoint Detail / Recent Diffs
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.115, Python 3.11 |
| ORM / migrations | SQLAlchemy 2.0, Alembic 1.14 |
| Validation | Pydantic v2, pydantic-settings |
| HTTP client | httpx (async) |
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3 |
| State / data | TanStack Query v5, React Router v6, Axios |
| Database | PostgreSQL 16 (Neon-compatible) |
| Scheduler | GitHub Actions cron |
| Deploy | Cloud Run (backend), Vercel (frontend), Neon (DB) |

---

## Local quickstart (3 commands)

```bash
cp .env.example .env
docker compose up -d --build
curl -X POST http://localhost:8080/api/monitor/run-once \
  -H "X-SCHEMAPILOT-ADMIN-SECRET: dev-secret"
```

Open **http://localhost:5173** — the dashboard shows 4 monitored endpoints with their latest snapshot hashes.

The **Drift Simulator** service rotates its JSON schema every 10 minutes, so you'll see breaking diffs appear without waiting weeks for a real API to change.

---

## Severity rules (response-runtime semantics)

All classification is deterministic. The LLM never touches this table.

| Change | Severity | Reason |
|---|---|---|
| Field removed | **breaking** | Consumer KeyError / missing data |
| Field added (any) | safe | Consumers ignore unknown fields |
| Type changed (e.g. string→object) | **breaking** | Consumer logic crashes |
| Integer → number | risky | Float where int expected |
| Number → integer | **breaking** | Decimal consumers lose precision |
| Nullable false → true | risky | Consumers may not null-check |
| Nullable true → false | safe | Null-handling becomes dead code |
| Enum expanded (new values) | risky | Strict consumers reject unknown values |
| Enum narrowed (values removed) | safe | Some branches become dead code |
| Nested object removed | **breaking** | Same as field removed |
| Array item type changed | **breaking** | Iteration crashes |

*Framing: severity reflects actual runtime impact on JSON consumers, not strict published-contract violations.*

---

## Example structured diff

```json
{
  "severity": "breaking",
  "change_type": "removed_field",
  "path": "users[*].email",
  "old_type": "string",
  "new_type": null,
  "message": "Field users[*].email was removed from the response schema."
}
```

## Example AI changelog (template fallback shown)

```
## Breaking (1)
- `users[*].email` — Field users[*].email was removed from the response schema.

## Risky (1)
- `id` — Field id is now nullable (consumers may receive null).
```

---

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Health check + DB ping |
| GET | `/api/endpoints` | — | List all monitored endpoints |
| GET | `/api/endpoints/{id}` | — | Endpoint detail |
| GET | `/api/endpoints/{id}/snapshots` | — | Snapshot timeline |
| GET | `/api/endpoints/{id}/diffs` | — | Diffs for endpoint |
| GET | `/api/endpoints/{id}/changelogs` | — | Changelogs for endpoint |
| GET | `/api/diffs/recent` | — | Cross-endpoint recent diffs |
| GET | `/api/monitor-runs` | — | Recent monitor runs |
| POST | `/api/monitor/run-once` | `X-SCHEMAPILOT-ADMIN-SECRET` | Trigger monitor run |
| POST | `/api/changelogs/generate` | `X-SCHEMAPILOT-ADMIN-SECRET` | Generate AI changelog |

---

## Database schema

- **`api_endpoints`** — monitored endpoint registry (upserted from `config/apis.yaml`)
- **`monitor_runs`** — one row per scheduled/manual run with aggregate counts
- **`schema_snapshots`** — one row per endpoint per run; stores inferred schema JSON + hash
- **`schema_diffs`** — one row per field-level change; severity classified deterministically
- **`changelogs`** — LLM or template-generated text keyed by diff set hash (cached)

---

## GitHub Actions cron

`.github/workflows/monitor.yml` runs daily at 08:00 UTC and on manual dispatch. It makes a single HTTP POST to the deployed backend — no code checkout, no Python environment.

For production deployment, set these repo secrets:
- `SCHEMAPILOT_BACKEND_URL` — deployed Cloud Run URL
- `SCHEMAPILOT_ADMIN_SECRET` — shared secret for the monitor endpoint

See **[DEPLOY.md](DEPLOY.md)** for the full free-tier deployment walkthrough.

---

## Project structure

```
schemapilot/
├── backend/
│   ├── app/
│   │   ├── core/          # pure functions: infer, diff, severity, changelog, hash
│   │   ├── api/           # FastAPI route handlers
│   │   ├── workers/       # monitor runner orchestrator
│   │   └── tests/         # 38 pytest tests (all pure, no network)
│   └── alembic/           # database migrations
├── drift-simulator/       # local rotating-schema service for demos
├── frontend/
│   └── src/
│       ├── pages/         # Dashboard, EndpointDetail, RecentDiffs
│       ├── components/    # Layout, DiffTable, SchemaTimeline, ChangelogPanel
│       └── api/           # typed axios client + react-query keys
├── config/
│   └── apis.yaml          # endpoint registry
└── .github/workflows/     # CI + daily monitor cron
```

---

## Known limitations

1. **Single-sample inference**: the first time an optional top-level field is absent, it triggers a `removed_field → breaking` event. Stabilizes after two snapshots.
2. **Response-side only**: request schemas are not monitored.
3. **GHA cron timing**: 5-minute minimum granularity; runs may be delayed under load.
4. **Single-instance locking**: the `pg_advisory_lock` prevents concurrent runs on one backend instance; multi-replica deployments need a different lock strategy.
5. **Raw body cap**: responses >256 KB are truncated in storage; schema inference runs on the full body.

---

## Future improvements

- Multi-sample inference for better optional-field detection
- Per-endpoint custom polling intervals
- Slack / email alerts on breaking diffs
- OpenAPI/Swagger spec import as schema baseline
- Schema history pruning UI
- Per-field annotation and suppression rules
