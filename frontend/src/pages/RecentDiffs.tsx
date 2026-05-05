import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, QUERY_KEYS } from "../api/client";
import { SeverityBadge } from "../components/SeverityBadge";
import type { Severity } from "../types";

function fmt(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SEVERITIES: (Severity | "all")[] = ["all", "breaking", "risky", "safe"];

export function RecentDiffs() {
  const [severity, setSeverity] = useState<Severity | "all">("all");

  const { data: diffs = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.recentDiffs, severity],
    queryFn: () => api.diffs.recent(200, severity !== "all" ? severity : undefined),
    staleTime: 30_000,
  });

  const { data: endpoints = [] } = useQuery({
    queryKey: QUERY_KEYS.endpoints,
    queryFn: api.endpoints.list,
    staleTime: 60_000,
  });

  const epMap = Object.fromEntries(endpoints.map((e) => [e.id, e]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recent Diffs</h1>
          <p className="text-sm text-gray-500 mt-1">{diffs.length} diffs shown</p>
        </div>
        {/* Severity filter */}
        <div className="flex gap-1">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                severity === s
                  ? s === "all"
                    ? "bg-gray-900 text-white"
                    : s === "breaking"
                    ? "bg-red-500 text-white"
                    : s === "risky"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-6">Loading…</p>
        ) : diffs.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">No diffs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Change</th>
                  <th className="px-3 py-2">Path</th>
                  <th className="px-3 py-2">Old</th>
                  <th className="px-3 py-2">New</th>
                  <th className="px-3 py-2">Detected</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diffs.map((d) => {
                  const ep = epMap[d.endpoint_id];
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {ep ? (
                          <Link
                            to={`/endpoints/${ep.id}`}
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            {ep.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">{d.endpoint_id.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <SeverityBadge severity={d.severity} />
                      </td>
                      <td className="px-3 py-2 text-gray-700">{d.change_type}</td>
                      <td className="px-3 py-2">
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{d.path}</code>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{d.old_type ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{d.new_type ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{fmt(d.created_at)}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-xs truncate">{d.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
