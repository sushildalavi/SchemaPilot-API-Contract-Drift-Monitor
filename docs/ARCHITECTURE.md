# SchemaPilot Architecture

SchemaPilot has two backend paths:

1. Scheduled monitor (`backend/`): fetches configured APIs, infers schema, computes deterministic hash, stores snapshots/diffs.
2. Runtime guard (`app/`): accepts `POST /track` payloads, computes structural fingerprints, classifies drift, stores runtime violations.

## Runtime Guard Data Path

1. `POST /track` receives payload.
2. Payload is normalized (`app/core/parser.py`).
3. Deterministic fingerprint is generated (SHA-256 over structural string).
4. Registration executes under transactional advisory lock (`pg_advisory_xact_lock`).
5. Snapshot is inserted with endpoint-scoped uniqueness:
   - `UNIQUE(endpoint_id, fingerprint)`.
6. Drift is classified into `SAFE`, `RISKY`, `BREAKING`.
7. Runtime metrics are exposed at `/api/v1/metrics`.

## Runtime Schema

Managed by SQL migrations in `migrations/`:

- `001_contract_guard_schema.sql`
- `002_runtime_snapshot_endpoint_fingerprint_unique.sql`
