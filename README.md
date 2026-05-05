# SchemaPilot — API Contract Drift Monitor

> A production-quality developer tool that monitors live JSON APIs, infers their schemas from observed responses, and detects breaking contract drift using **fully deterministic, unit-tested rules**. The LLM layer is optional and only converts validated structured diffs into human-readable changelogs — it never decides severity.

![Dashboard](docs/screenshots/01-dashboard.png)

---

## What it solves

APIs change without warning. A field gets renamed, a type widens, a reliable value suddenly becomes nullable — and your integration silently breaks in production. SchemaPilot polls your endpoints on a schedule, infers JSON schemas from live HTTP responses (no OpenAPI spec required), and immediately flags drift when the contract changes.

- **Zero schema files needed** — infers from observed responses
- **Deterministic severity** — every classification is a rule lookup, fully unit-tested
- **Field-level granularity** — knows exactly which path changed and why it breaks
- **Free to run** — Neon + Cloud Run + Vercel + GitHub Actions, all free tier

---

## Screenshots

### Dashboard Overview
![Dashboard](docs/screenshots/01-dashboard.png)

### Endpoints + Monitor History
![Dashboard Lower](docs/screenshots/02-dashboard-lower.png)

### Endpoint Detail — Diff View
![Endpoint Detail](docs/screenshots/03-endpoint-detail.png)

### Schema Field Viewer
![Schema Viewer](docs/screenshots/04-schema-viewer.png)

### Diff History
![Diff History](docs/screenshots/05-diff-history.png)

---

## Architecture & Data Flow

```mermaid
flowchart TD
    A([GitHub Actions Cron\n08:00 UTC daily]) -->|POST /api/monitor/run-once| B

    B[Monitor Runner\nworkers/monitor_runner.py]
    B --> C{pg_advisory_lock\nacquired?}
    C -- No --> D([Return 409\nAlready Running])
    C -- Yes --> E[Load apis.yaml\nUpsert api_endpoints]
    E --> F[Fetch each endpoint\nhttpx async · 10s timeout]

    F --> G{Valid JSON?}
    G -- No --> H[(Store error\nsnapshot)]
    G -- Yes --> I[Normalize\nsort keys · truncate 256KB]
    I --> J[schema_infer.py\nJSON → list of SchemaNode]
    J --> K[canonical.py\nSHA-256 hash\nexclude example_value]
    K --> L{Hash changed\nvs prior?}
    L -- Same --> M[(Store snapshot\nskip diff)]
    L -- Changed --> N[schema_diff.py\nold vs new nodes]
    N --> O[severity.py\nchange_type → severity\npure lookup table]
    O --> P[(Store schema_diffs\nin PostgreSQL)]

    P --> Q[retention_sweep\nnull raw bodies\nbeyond latest 10]
    Q --> R[(Update monitor_run\nsuccess / partial_failure)]

    R --> S[FastAPI\n/api endpoints]
    S --> T[React Dashboard\nport 5174]
```

---

## Schema Inference Flow

```mermaid
flowchart LR
    A([Raw JSON\nHTTP Response]) --> B[normalizer.py\nSort keys · Truncate 256KB]
    B --> C[schema_infer.py]

    C --> D{Type?}
    D -- dict --> E[Emit object node\nRecurse children]
    D -- list empty --> F[array · item_type=unknown]
    D -- list scalars --> G[array · detect type\nor mixed]
    D -- list objects --> H[Union item shapes\nMark optional if absent\nin any item]
    D -- null --> I[nullable=true\ntype=null]
    D -- string --> J{Distinct values\n≤ 10?}
    J -- yes --> K[Set enum_values]
    J -- no --> L[enum_disabled]
    D -- scalar --> M[integer / number\nboolean]

    E --> N[list of SchemaNode\nsorted by path]
    F --> N
    G --> N
    H --> N
    I --> N
    K --> N
    L --> N
    M --> N

    N --> O[canonical.py\nStrip example_value\njson.dumps sort_keys\nSHA-256]
    O --> P([schema_hash])
```

---

## Diff Classification Flow

```mermaid
flowchart TD
    A([Prior SchemaNode list]) --> C[schema_diff.py]
    B([New SchemaNode list]) --> C

    C --> D{Path in old\nnot in new?}
    D -- object type --> E[nested_object_removed\n→ breaking]
    D -- other type --> F[removed_field\n→ breaking]

    C --> G{Path in new\nnot in old?}
    G -- Yes --> H[added_field\n→ safe]

    C --> I{Path in both\ntype differs?}
    I -- int→number --> J[int_to_number\n→ risky]
    I -- number→int --> K[number_to_int\n→ breaking]
    I -- other --> L[type_changed\n→ breaking]

    C --> M{nullable\nchanged?}
    M -- false→true --> N[nullable_added\n→ risky]
    M -- true→false --> O[nullable_removed\n→ safe]

    C --> P{enum_values\nchanged?}
    P -- new ⊃ old --> Q[enum_expanded\n→ risky]
    P -- old ⊃ new --> R[enum_narrowed\n→ safe]
    P -- overlap --> S[enum_changed\n→ risky]

    C --> T{array_item_type\nchanged?}
    T -- Yes --> U[array_item_type_changed\n→ breaking]

    E & F & H & J & K & L & N & O & Q & R & S & U --> V[(schema_diffs\nPostgreSQL)]
```

---

## Database Schema

```mermaid
erDiagram
    api_endpoints {
        UUID id PK
        TEXT name UK
        TEXT provider
        TEXT url
        TEXT method
        JSONB headers_json
        BOOL is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    monitor_runs {
        UUID id PK
        TIMESTAMPTZ started_at
        TIMESTAMPTZ finished_at
        TEXT status
        INT endpoints_checked
        INT snapshots_created
        INT diffs_detected
        TEXT error_message
    }

    schema_snapshots {
        UUID id PK
        UUID endpoint_id FK
        UUID monitor_run_id FK
        TEXT schema_hash
        INT status_code
        INT response_time_ms
        INT response_size_bytes
        JSONB normalized_schema_json
        JSONB raw_sample_json
        TEXT fetch_error
        TIMESTAMPTZ created_at
    }

    schema_diffs {
        UUID id PK
        UUID endpoint_id FK
        UUID old_snapshot_id FK
        UUID new_snapshot_id FK
        TEXT severity
        TEXT change_type
        TEXT path
        TEXT old_type
        TEXT new_type
        JSONB old_value_json
        JSONB new_value_json
        TEXT message
        TIMESTAMPTZ created_at
    }

    changelogs {
        UUID id PK
        UUID endpoint_id FK
        UUID snapshot_id FK
        JSONB diff_ids
        TEXT diff_set_hash
        TEXT generated_text
        TEXT model_name
        TIMESTAMPTZ created_at
    }

    api_endpoints ||--o{ schema_snapshots : "has"
    api_endpoints ||--o{ schema_diffs : "has"
    api_endpoints ||--o{ changelogs : "has"
    monitor_runs ||--o{ schema_snapshots : "produced by"
    schema_snapshots ||--o{ schema_diffs : "new_snapshot"
    schema_snapshots ||--o{ changelogs : "summarised by"
```

---

## Deployment Architecture

```mermaid
flowchart LR
    subgraph GHA [GitHub Actions]
        CRON([Daily Cron\n08:00 UTC])
    end

    subgraph VERCEL [Vercel Hobby]
        FE[React Dashboard\nVite · Tailwind\nFramer Motion]
    end

    subgraph GCP [GCP Cloud Run]
        BE[FastAPI Backend\nPython 3.11\nSQLAlchemy 2]
    end

    subgraph NEON [Neon Postgres]
        DB[(PostgreSQL 16\nFree 500MB)]
    end

    subgraph LOCAL [Local Docker Compose]
        DS[Drift Simulator\nRotating schema\nevery 10 min]
    end

    CRON -->|POST /api/monitor/run-once\nX-SCHEMAPILOT-ADMIN-SECRET| BE
    FE -->|REST API calls| BE
    BE <-->|SQLAlchemy async| DB
    DS -.->|Monitored endpoint| BE
```

---

## Severity Rules (Response-Runtime Semantics)

All classification is **deterministic** — pure lookup table in `core/severity.py`. The LLM never touches this.

| Change | Severity | Why |
|---|---|---|
| Field removed | **breaking** | Consumer gets KeyError / missing data |
| Field added | safe | Consumers ignore unknown fields |
| Type changed | **breaking** | Consumer logic crashes |
| Integer → Number | risky | Float where int expected |
| Number → Integer | **breaking** | Decimal consumers lose precision |
| Nullable false → true | risky | Consumers may not null-check |
| Nullable true → false | safe | Null-handling becomes dead code |
| Enum expanded (new values) | risky | Strict consumers reject new values |
| Enum narrowed (values removed) | safe | Dead code branches |
| Enum changed (overlap) | risky | Partial set changes |
| Array item type changed | **breaking** | Iteration crashes |
| Nested object removed | **breaking** | Same as field removed |

> Severity reflects **runtime impact on JSON consumers**, not formal contract violations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.115 · Python 3.11 |
| ORM / Migrations | SQLAlchemy 2.0 · Alembic 1.14 |
| Validation | Pydantic v2 · pydantic-settings |
| HTTP Client | httpx (async) |
| Frontend | React 18 · TypeScript · Vite 6 · Tailwind CSS 3 |
| UI Animations | Framer Motion · MagicUI components |
| Data Fetching | TanStack Query v5 · Axios |
| Database | PostgreSQL 16 (Neon-compatible) |
| Scheduler | GitHub Actions cron |
| Deploy | Cloud Run · Vercel · Neon Postgres |

---

## Local Quickstart

```bash
# Clone and copy env
git clone https://github.com/sushildalavi/SchemaPilot-API-Contract-Drift-Monitor
cd SchemaPilot-API-Contract-Drift-Monitor
cp .env.example .env

# Start all services
docker compose up -d --build

# Trigger first monitor run
curl -X POST http://localhost:8080/api/monitor/run-once \
  -H "X-SCHEMAPILOT-ADMIN-SECRET: dev-secret"

# Open dashboard
open http://localhost:5174
```

The **Drift Simulator** service rotates its schema every 10 minutes — run the monitor again after 10+ min to see live drift detection.

### Port Map

| Service | Port |
|---|---|
| Backend API | `localhost:8080` |
| Frontend Dashboard | `localhost:5174` |
| Drift Simulator | `localhost:8001` |

---

## Project Structure

```
schemapilot/
├── backend/
│   ├── app/
│   │   ├── core/              # Pure functions: infer, diff, severity, hash
│   │   │   ├── schema_infer.py  ← JSON → list[SchemaNode]
│   │   │   ├── schema_diff.py   ← (old, new) → list[Diff]
│   │   │   ├── severity.py      ← change_type → severity (lookup only)
│   │   │   ├── canonical.py     ← stable_schema_hash (excludes examples)
│   │   │   ├── changelog.py     ← Anthropic call + template fallback
│   │   │   ├── fetcher.py       ← httpx async + error capture
│   │   │   ├── normalizer.py    ← key-sort + 256KB cap
│   │   │   ├── locking.py       ← pg_advisory_lock context manager
│   │   │   └── registry_loader.py ← apis.yaml → DB upsert
│   │   ├── api/               # FastAPI route handlers
│   │   ├── workers/           # monitor_runner.py (orchestrator)
│   │   └── tests/             # 49 pytest tests (pure functions)
│   └── alembic/               # DB migrations
├── drift-simulator/           # Rotating-schema service for demos
├── frontend/
│   └── src/
│       ├── components/        # MagicUI: BorderBeam, MagicCard, NeonGradientCard,
│       │                      #   AnimatedList, BlurFade, RetroGrid, NumberTicker,
│       │                      #   AnimatedGradientText, Meteors, Sparkline...
│       ├── pages/             # Dashboard · EndpointDetail · RecentDiffs
│       └── api/               # Typed axios client + React Query keys
├── config/
│   └── apis.yaml              # Endpoint registry
└── .github/workflows/
    ├── ci.yml                 # Backend tests + frontend build
    └── monitor.yml            # Daily cron trigger
```

---

## Production Deploy (Free Tier)

See **[DEPLOY.md](DEPLOY.md)** for the full step-by-step guide.

| Resource | Service | Free Limit |
|---|---|---|
| Database | Neon Postgres | 500 MB |
| Backend | GCP Cloud Run | 2M req/month |
| Frontend | Vercel Hobby | Unlimited |
| Cron | GitHub Actions | Unlimited (public repo) |
| LLM | Anthropic Haiku | Pay-per-use (optional) |

**Monthly cost: $0** at portfolio scale.

---

## GitHub Actions Cron

`.github/workflows/monitor.yml` fires daily at 08:00 UTC. No code checkout — pure HTTP POST to the deployed backend:

```yaml
- name: Trigger monitor
  run: |
    curl -fsSL --max-time 120 -X POST "$BACKEND_URL/api/monitor/run-once" \
      -H "X-SCHEMAPILOT-ADMIN-SECRET: $ADMIN_SECRET"
```

Manual dispatch available via Actions → "Run workflow" for immediate testing.

---

## Example Structured Diff

```json
{
  "severity": "breaking",
  "change_type": "removed_field",
  "path": "current_weather.temperature",
  "old_type": "number",
  "new_type": null,
  "message": "Field current_weather.temperature was removed from the response schema."
}
```

## Example AI Changelog

```markdown
## Breaking (1)
- `current_weather.temperature` — Field current_weather.temperature was removed
  from the response schema.

## Risky (1)
- `current_weather.time` — Field current_weather.time is now nullable
  (consumers may receive null).
```

---

## Tests

49 unit tests covering every deterministic component — all pure functions, no network, ~10s runtime.

```bash
docker compose exec backend sh -c "pip install pytest pytest-asyncio -q && pytest app/tests/ -v"
```

Test coverage:
- `test_canonical_hash.py` — hash stability, excludes example values
- `test_schema_infer.py` — objects, arrays, optionality, nullables, enums
- `test_severity_table.py` — every row in the rule table
- `test_schema_diff.py` — all 12 change types, correct severity
- `test_monitor_runner.py` — snapshot storage, diff creation, failure handling
- `test_admin_secret.py` — 401 on missing/wrong header
- `test_concurrent_runs.py` — 409 when advisory lock held

---

## Known Limitations

1. **Single-sample inference** — first omission of an optional field triggers `removed_field → breaking`. Stabilises after two snapshots.
2. **Response-side only** — no request schema monitoring.
3. **GHA cron timing** — 5-min minimum granularity, may run late.
4. **Single-instance locking** — `pg_advisory_lock` works for one backend replica.
5. **Body cap** — responses > 256 KB are truncated in storage; inference runs on full body.

---

## Future Improvements

- Multi-sample inference for better optional-field detection
- Per-endpoint polling intervals
- Slack / email alerts on breaking diffs
- OpenAPI / Swagger spec import as baseline
- Schema history pruning UI
- Multi-replica concurrency (Redis lock)
