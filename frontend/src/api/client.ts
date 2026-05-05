import axios from "axios";
import type { Changelog, Diff, Endpoint, MonitorRun, Snapshot } from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const http = axios.create({ baseURL: BASE, timeout: 30_000 });

export const api = {
  endpoints: {
    list: () => http.get<Endpoint[]>("/api/endpoints").then((r) => r.data),
    get: (id: string) =>
      http.get<Endpoint>(`/api/endpoints/${id}`).then((r) => r.data),
    snapshots: (id: string, limit = 50) =>
      http
        .get<Snapshot[]>(`/api/endpoints/${id}/snapshots`, { params: { limit } })
        .then((r) => r.data),
    diffs: (id: string, limit = 50) =>
      http
        .get<Diff[]>(`/api/endpoints/${id}/diffs`, { params: { limit } })
        .then((r) => r.data),
    changelogs: (id: string) =>
      http.get<Changelog[]>(`/api/endpoints/${id}/changelogs`).then((r) => r.data),
  },
  diffs: {
    recent: (limit = 100, severity?: string) =>
      http
        .get<Diff[]>("/api/diffs/recent", { params: { limit, severity } })
        .then((r) => r.data),
  },
  monitor: {
    runs: (limit = 20) =>
      http.get<MonitorRun[]>("/api/monitor-runs", { params: { limit } }).then((r) => r.data),
  },
  changelogs: {
    generate: (snapshot_id: string) =>
      http
        .post<Changelog>(
          "/api/changelogs/generate",
          { snapshot_id },
          { headers: { "X-SCHEMAPILOT-ADMIN-SECRET": import.meta.env.VITE_ADMIN_SECRET ?? "dev-secret" } }
        )
        .then((r) => r.data),
    get: (id: string) =>
      http.get<Changelog>(`/api/changelogs/${id}`).then((r) => r.data),
  },
};

export const QUERY_KEYS = {
  endpoints: ["endpoints"] as const,
  endpoint: (id: string) => ["endpoints", id] as const,
  snapshots: (id: string) => ["snapshots", id] as const,
  diffs: (id: string) => ["diffs", id] as const,
  recentDiffs: ["diffs", "recent"] as const,
  changelogs: (id: string) => ["changelogs", id] as const,
  monitorRuns: ["monitor-runs"] as const,
};
