import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { SeverityBadge } from "../components/SeverityBadge";
import type { MonitorRun } from "../types";

function timeAgo(dt: string | null) {
  if (!dt) return "never";
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CONFIG: Record<MonitorRun["status"], { label: string; dot: string; bg: string }> = {
  success: { label: "Success", dot: "bg-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  partial_failure: { label: "Partial", dot: "bg-amber-400", bg: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  failed: { label: "Failed", dot: "bg-red-400", bg: "bg-red-500/10 border-red-500/20 text-red-400" },
  running: { label: "Running", dot: "bg-blue-400 animate-pulse", bg: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}


export function Dashboard() {
  const { data: endpoints = [], isLoading: epLoad } = useQuery({
    queryKey: QUERY_KEYS.endpoints,
    queryFn: api.endpoints.list,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: runs = [], isLoading: runsLoad } = useQuery({
    queryKey: QUERY_KEYS.monitorRuns,
    queryFn: () => api.monitor.runs(5),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: recentDiffs = [] } = useQuery({
    queryKey: QUERY_KEYS.recentDiffs,
    queryFn: () => api.diffs.recent(20),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const latestRun = runs[0];
  const statusCfg = latestRun ? STATUS_CONFIG[latestRun.status] : null;

  const breaking = recentDiffs.filter((d) => d.severity === "breaking").length;
  const risky = recentDiffs.filter((d) => d.severity === "risky").length;
  const safe = recentDiffs.filter((d) => d.severity === "safe").length;
  const total = breaking + risky + safe;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""} monitored
            {latestRun && ` · last run ${timeAgo(latestRun.started_at)}`}
          </p>
        </div>
        {statusCfg && latestRun && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${statusCfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label} · {latestRun.endpoints_checked} endpoints
          </div>
        )}
      </motion.div>

      {/* Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {epLoad ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <MetricCard label="Endpoints" value={endpoints.length} icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            } />
            <MetricCard label="Breaking" value={breaking} color={breaking > 0 ? "red" : "default"} icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            } />
            <MetricCard label="Risky" value={risky} color={risky > 0 ? "yellow" : "default"} icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            } />
            <MetricCard label="Safe" value={safe} color={safe > 0 ? "green" : "default"} icon={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            } />
          </>
        )}
      </motion.div>

      {/* Severity breakdown bar */}
      {total > 0 && (
        <motion.div variants={item} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label">Drift breakdown</span>
            <span className="text-xs text-slate-500">{total} total diffs</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex gap-0.5">
            {breaking > 0 && (
              <motion.div
                className="h-full bg-red-500 rounded-full"
                initial={{ flex: 0 }}
                animate={{ flex: breaking }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
            {risky > 0 && (
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                initial={{ flex: 0 }}
                animate={{ flex: risky }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              />
            )}
            {safe > 0 && (
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ flex: 0 }}
                animate={{ flex: safe }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              />
            )}
          </div>
          <div className="flex gap-4 mt-2">
            {([["Breaking", breaking, "text-red-400"], ["Risky", risky, "text-amber-400"], ["Safe", safe, "text-emerald-400"]] as [string, number, string][]).map(([l, v, c]) => (
              v > 0 && <span key={l} className={`text-xs ${c}`}>{v} {l}</span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Endpoints */}
        <motion.div variants={item} className="xl:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Endpoints</h2>
          </div>
          <div className="card divide-y divide-slate-800/60">
            {epLoad
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 m-3" />)
              : endpoints.length === 0
              ? (
                <div className="flex flex-col items-center py-12 text-slate-600">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="mb-3"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83"/></svg>
                  <p className="text-sm font-medium text-slate-500">No endpoints yet</p>
                  <p className="text-xs mt-1">Trigger a monitor run to load from config</p>
                </div>
              )
              : endpoints.map((ep, i) => {
                const epDiffs = recentDiffs.filter((d) => d.endpoint_id === ep.id);
                const epBreaking = epDiffs.filter((d) => d.severity === "breaking").length;
                return (
                  <motion.div
                    key={ep.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/endpoints/${ep.id}`}
                      className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-800/30 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${epBreaking > 0 ? "bg-red-500" : ep.latest_snapshot_hash ? "bg-emerald-500" : "bg-slate-600"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{ep.name}</p>
                          {epBreaking > 0 && (
                            <span className="badge-breaking text-[10px]">
                              <span className="w-1 h-1 rounded-full bg-red-400" />
                              {epBreaking} breaking
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{ep.url}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {ep.latest_snapshot_hash && (
                          <span className="hash hidden sm:block">{ep.latest_snapshot_hash.slice(0, 8)}</span>
                        )}
                        <span className="text-xs text-slate-600">{timeAgo(ep.latest_checked_at)}</span>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-700 group-hover:text-slate-400 transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            }
          </div>
        </motion.div>

        {/* Recent runs */}
        <motion.div variants={item} className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Monitor Runs</h2>
          </div>
          <div className="card divide-y divide-slate-800/60">
            {runsLoad
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 m-3" />)
              : runs.length === 0
              ? <p className="text-sm text-slate-600 px-4 py-8 text-center">No runs yet</p>
              : runs.map((run) => {
                const cfg = STATUS_CONFIG[run.status];
                return (
                  <div key={run.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-xs font-medium ${cfg.bg.includes("emerald") ? "text-emerald-400" : cfg.bg.includes("amber") ? "text-amber-400" : cfg.bg.includes("red") ? "text-red-400" : "text-blue-400"}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">{timeAgo(run.started_at)}</span>
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-xs text-slate-500">{run.endpoints_checked} endpoints</span>
                      <span className="text-xs text-slate-500">{run.snapshots_created} snaps</span>
                      {run.diffs_detected > 0 && (
                        <span className="text-xs text-red-400">{run.diffs_detected} diffs</span>
                      )}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </motion.div>
      </div>

      {/* Recent diffs */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Diffs</h2>
          <Link to="/diffs" className="btn-ghost text-xs">
            View all
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="card overflow-hidden">
          {recentDiffs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-600">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm font-medium text-slate-500">Schema stable</p>
              <p className="text-xs mt-1">No drift detected yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              <div className="grid grid-cols-[90px_120px_1fr_120px] gap-3 px-4 py-2.5">
                {["Severity","Change","Path","Endpoint"].map(h => <span key={h} className="label">{h}</span>)}
              </div>
              {recentDiffs.slice(0, 8).map((d, i) => {
                const ep = endpoints.find((e) => e.id === d.endpoint_id);
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[90px_120px_1fr_120px] gap-3 px-4 py-2.5 hover:bg-slate-800/20 transition-colors"
                  >
                    <SeverityBadge severity={d.severity} />
                    <span className="text-xs text-slate-400 self-center">{d.change_type}</span>
                    <code className="mono text-xs text-indigo-300 self-center truncate">{d.path}</code>
                    {ep ? (
                      <Link to={`/endpoints/${ep.id}`} className="text-xs text-slate-500 hover:text-indigo-400 self-center transition-colors truncate">
                        {ep.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600 self-center">—</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
