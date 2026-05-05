import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { SeverityBadge } from "../components/SeverityBadge";
import type { Severity } from "../types";

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITIES: (Severity | "all")[] = ["all", "breaking", "risky", "safe"];

const CHIP: Record<string, string> = {
  all: "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
  breaking: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25",
  risky: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25",
  safe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
};

const CHIP_ACTIVE: Record<string, string> = {
  all: "bg-slate-100 text-slate-900 border-slate-200",
  breaking: "bg-red-500 text-white border-red-500",
  risky: "bg-amber-500 text-white border-amber-500",
  safe: "bg-emerald-500 text-white border-emerald-500",
};

export function RecentDiffs() {
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [search, setSearch] = useState("");

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

  const filtered = diffs.filter(
    (d) => !search || d.path.toLowerCase().includes(search.toLowerCase()) || d.change_type.includes(search.toLowerCase())
  );

  const counts = diffs.reduce<Record<string, number>>(
    (acc, d) => { acc[d.severity] = (acc[d.severity] ?? 0) + 1; return acc; },
    {}
  );

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="page-title">Recent Diffs</h1>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} of {diffs.length} diffs</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Breaking", key: "breaking", color: "text-red-400", bg: "border-red-500/20 bg-red-500/5" },
          { label: "Risky", key: "risky", color: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/5" },
          { label: "Safe", key: "safe", color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/5" },
        ].map(({ label, key, color, bg }) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
            onClick={() => setSeverity(severity === key ? "all" : key as Severity)}
            className={`card p-4 text-left border transition-all ${bg} ${severity === key ? "ring-1 ring-indigo-500/50" : ""}`}
          >
            <p className="label">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{counts[key] ?? 0}</p>
          </motion.button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all duration-150 ${
                severity === s ? CHIP_ACTIVE[s] : CHIP[s]
              }`}
            >
              {s}
              {s !== "all" && counts[s] !== undefined && (
                <span className="ml-1 opacity-70">{counts[s]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Filter by path or change type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-10 rounded" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-600">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm font-medium text-slate-500">No diffs found</p>
            <p className="text-xs mt-1">Try a different filter or run the monitor</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[90px_130px_1fr_130px_80px_80px_100px] gap-3 px-4 py-2.5">
              {["Severity","Change","Path","Endpoint","Old","New","When"].map(h => (
                <span key={h} className="label">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-800/50">
              {filtered.map((d, i) => {
                const ep = epMap[d.endpoint_id];
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="grid grid-cols-[90px_130px_1fr_130px_80px_80px_100px] gap-3 px-4 py-2.5 hover:bg-slate-800/25 transition-colors"
                  >
                    <div className="self-center"><SeverityBadge severity={d.severity} /></div>
                    <span className="text-xs text-slate-400 self-center font-medium">{d.change_type}</span>
                    <code className="mono text-xs text-indigo-300 self-center truncate">{d.path}</code>
                    {ep ? (
                      <Link to={`/endpoints/${ep.id}`} className="text-xs text-slate-400 hover:text-indigo-400 self-center transition-colors truncate">
                        {ep.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600 self-center">—</span>
                    )}
                    <span className="text-xs text-slate-500 self-center">{d.old_type ?? "—"}</span>
                    <span className="text-xs text-slate-500 self-center">{d.new_type ?? "—"}</span>
                    <span className="text-xs text-slate-600 self-center">{timeAgo(d.created_at)}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
