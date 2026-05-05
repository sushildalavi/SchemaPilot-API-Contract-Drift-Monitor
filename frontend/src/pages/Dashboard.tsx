import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, QUERY_KEYS } from "../api/client";
import { DiffTable } from "../components/DiffTable";
import { MetricCard } from "../components/MetricCard";

function fmt(dt: string | null) {
  if (!dt) return "never";
  return new Date(dt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RUN_STATUS_STYLE: Record<string, string> = {
  success: "text-green-600 bg-green-50 border-green-200",
  partial_failure: "text-yellow-600 bg-yellow-50 border-yellow-200",
  failed: "text-red-600 bg-red-50 border-red-200",
  running: "text-blue-600 bg-blue-50 border-blue-200",
};

export function Dashboard() {
  const { data: endpoints = [], isLoading: epLoad } = useQuery({
    queryKey: QUERY_KEYS.endpoints,
    queryFn: api.endpoints.list,
    staleTime: 30_000,
  });

  const { data: runs = [] } = useQuery({
    queryKey: QUERY_KEYS.monitorRuns,
    queryFn: () => api.monitor.runs(5),
    staleTime: 30_000,
  });

  const { data: recentDiffs = [] } = useQuery({
    queryKey: QUERY_KEYS.recentDiffs,
    queryFn: () => api.diffs.recent(10),
    staleTime: 30_000,
  });

  const latestRun = runs[0];
  const breakingCount = recentDiffs.filter((d) => d.severity === "breaking").length;
  const riskyCount = recentDiffs.filter((d) => d.severity === "risky").length;
  const safeCount = recentDiffs.filter((d) => d.severity === "safe").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">API contract drift monitor</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Endpoints" value={endpoints.length} />
        <MetricCard
          label="Breaking diffs"
          value={breakingCount}
          color={breakingCount > 0 ? "red" : "default"}
        />
        <MetricCard
          label="Risky diffs"
          value={riskyCount}
          color={riskyCount > 0 ? "yellow" : "default"}
        />
        <MetricCard label="Safe diffs" value={safeCount} color={safeCount > 0 ? "green" : "default"} />
      </div>

      {/* Last run status */}
      {latestRun && (
        <div
          className={`flex items-center gap-3 border rounded-lg px-4 py-3 text-sm ${
            RUN_STATUS_STYLE[latestRun.status] ?? ""
          }`}
        >
          <span className="font-semibold capitalize">{latestRun.status.replace("_", " ")}</span>
          <span className="text-xs opacity-75">
            Last run {fmt(latestRun.started_at)} · {latestRun.endpoints_checked} endpoints · {latestRun.snapshots_created} snapshots · {latestRun.diffs_detected} diffs
          </span>
        </div>
      )}

      {/* Endpoints list */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Monitored Endpoints</h2>
        {epLoad ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {endpoints.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">
                No endpoints yet. Trigger a monitor run to load from config.
              </p>
            )}
            {endpoints.map((ep) => (
              <Link
                key={ep.id}
                to={`/endpoints/${ep.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{ep.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ep.provider} · {ep.method} · Last: {fmt(ep.latest_checked_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {ep.latest_snapshot_hash && (
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {ep.latest_snapshot_hash.slice(0, 10)}
                    </code>
                  )}
                  <span className="text-gray-400 text-sm">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent diffs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Recent Diffs</h2>
          <Link to="/diffs" className="text-sm text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <DiffTable diffs={recentDiffs} />
        </div>
      </section>
    </div>
  );
}
