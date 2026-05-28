# drift.detected Event Schema

Kafka topic: `drift.detected`

```json
{
  "event_id": "uuid",
  "endpoint_id": "uuid",
  "endpoint_path_name": "orders POST /v1/orders",
  "namespace": "prod",
  "old_fingerprint": "sha256",
  "new_fingerprint": "sha256",
  "old_version": 2,
  "new_version": 3,
  "severity": "BREAKING",
  "compatibility_classification": "BREAKING",
  "timestamp": "2026-05-27T00:00:00Z",
  "schema_diff_summary": [
    {
      "path": "order.total",
      "old_type": "number",
      "new_type": "string",
      "classification": "BREAKING",
      "reason": "string->number"
    }
  ],
  "affected_consumer_count": 5
}
```

Notes:
- Publisher abstraction supports retries.
- Default runtime publisher is no-op until a concrete Kafka producer is wired in.
