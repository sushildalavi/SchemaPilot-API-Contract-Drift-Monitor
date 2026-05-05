export interface Endpoint {
  id: string;
  name: string;
  provider: string;
  url: string;
  method: string;
  headers_json: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  latest_snapshot_hash: string | null;
  latest_checked_at: string | null;
}

export interface Snapshot {
  id: string;
  endpoint_id: string;
  monitor_run_id: string;
  schema_hash: string;
  status_code: number;
  response_time_ms: number;
  response_size_bytes: number;
  normalized_schema_json: unknown | null;
  raw_sample_json: unknown | null;
  fetch_error: string | null;
  created_at: string;
}

export type Severity = "breaking" | "risky" | "safe";

export interface Diff {
  id: string;
  endpoint_id: string;
  old_snapshot_id: string | null;
  new_snapshot_id: string;
  severity: Severity;
  change_type: string;
  path: string;
  old_type: string | null;
  new_type: string | null;
  old_value_json: unknown | null;
  new_value_json: unknown | null;
  message: string;
  created_at: string;
}

export interface Changelog {
  id: string;
  endpoint_id: string;
  snapshot_id: string;
  diff_ids: string[];
  diff_set_hash: string;
  generated_text: string;
  model_name: string | null;
  created_at: string;
}

export interface MonitorRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "partial_failure" | "failed";
  endpoints_checked: number;
  snapshots_created: number;
  diffs_detected: number;
  error_message: string | null;
}
