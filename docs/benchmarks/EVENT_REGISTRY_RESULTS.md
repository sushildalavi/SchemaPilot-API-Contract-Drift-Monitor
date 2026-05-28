# Event Registry Benchmark Results

Source artifact: `docs/benchmarks/event_registry_simulation_5000.json`

## Run metadata
- events_total: 5000
- concurrency: 200
- success_count: 5000
- failure_count: 0
- duration_seconds: 157.1705
- timestamp: 2026-05-28T01:18:11.924907+00:00

## Drift classification counts
- SAFE: 1004
- RISKY: 4995
- BREAKING: 3996

## Notes
- These numbers come from an actual simulation run in this branch.
- k6-specific p95 latency is not included because `k6` binary is unavailable in this environment.
