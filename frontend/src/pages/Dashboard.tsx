import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { SeverityBadge } from "../components/SeverityBadge";
import type { MonitorRun } from "../types";

function timeAgo(dt: string | null) {
  if (!dt) return "never";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS: Record<MonitorRun["status"], { color: string; dot: string; label: string }> = {
  success:         { color: "text-emerald-400", dot: "bg-emerald-400", label: "Success" },
  partial_failure: { color: "text-amber-400",   dot: "bg-amber-400",   label: "Partial Failure" },
  failed:          { color: "text-red-400",      dot: "bg-red-400",     label: "Failed" },
  running:         { color: "text-blue-400",     dot: "bg-blue-400 animate-pulse", label: "Running" },
};

function Skel({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } } };

export function Dashboard() {
  const { data: endpoints = [], isLoading: epLoad } = useQuery({ queryKey: QUERY_KEYS.endpoints, queryFn: api.endpoints.list, staleTime: 30_000, refetchInterval: 60_000 });
  const { data: runs = [], isLoading: runsLoad } = useQuery({ queryKey: QUERY_KEYS.monitorRuns, queryFn: () => api.monitor.runs(10), staleTime: 30_000, refetchInterval: 30_000 });
  const { data: allDiffs = [] } = useQuery({ queryKey: QUERY_KEYS.recentDiffs, queryFn: () => api.diffs.recent(200), staleTime: 30_000, refetchInterval: 30_000 });

  const latestRun = runs[0];
  const breaking = allDiffs.filter(d => d.severity === "breaking").length;
  const risky    = allDiffs.filter(d => d.severity === "risky").length;
  const safe     = allDiffs.filter(d => d.severity === "safe").length;

  // Fake sparkline trend from runs (diffs per run)
  const driftTrend = runs.slice().reverse().map(r => r.diffs_detected);
  const epTrend    = runs.slice().reverse().map(r => r.endpoints_checked);

  return (
    <motion.div className="space-y-7 max-w-7xl" variants={list} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="heading">Overview</h1>
          <p className="subheading mt-1">
            {endpoints.length} endpoints · {runs.length ? `last run ${timeAgo(runs[0]?.started_at)}` : "no runs yet"}
          </p>
        </div>
        {latestRun && (() => {
          const cfg = STATUS[latestRun.status];
          return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-medium"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className={cfg.color}>{cfg.label}</span>
              <span className="text-slate-700 mx-1">·</span>
              <span className="text-slate-500">{latestRun.endpoints_checked} endpoints checked</span>
            </div>
          );
        })()}
      </motion.div>

      {/* Metric cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {epLoad ? (
          Array.from({length:4}).map((_,i) => <Skel key={i} className="h-[120px] rounded-2xl" />)
        ) : (
          <>
            <MetricCard label="Endpoints" value={endpoints.length} trend={epTrend.length ? epTrend : [3,3,4,4]} color="indigo"
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>}
            />
            <MetricCard label="Breaking" value={breaking} trend={driftTrend.length ? driftTrend : [0,1,0,2,1]} color={breaking>0?"red":"default"}
              sub={breaking>0 ? "Needs attention" : "Schema stable"}
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>}
            />
            <MetricCard label="Risky" value={risky} trend={[0,0,1,1,2]} color={risky>0?"amber":"default"}
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            />
            <MetricCard label="Safe Changes" value={safe} trend={[1,2,1,3,2]} color={safe>0?"green":"default"}
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
            />
          </>
        )}
      </motion.div>

      {/* Drift bar */}
      {(breaking + risky + safe) > 0 && (
        <motion.div variants={item} className="glass-hover rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">Severity distribution</span>
            <span className="text-[11px] text-slate-600">{breaking + risky + safe} total diffs</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex gap-0.5 bg-white/3">
            {([["breaking", breaking, "#ef4444"],[`risky`, risky, "#f59e0b"],["safe", safe, "#10b981"]] as [string, number, string][])
              .filter(([,v]) => v > 0)
              .map(([key, v, color], i) => (
              <motion.div key={key} className="h-full rounded-full"
                style={{ background: color }}
                initial={{ flex: 0 }}
                animate={{ flex: v }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            ))}
          </div>
          <div className="flex gap-5 mt-3">
            {([["Breaking", breaking, "text-red-400"],["Risky", risky, "text-amber-400"],["Safe", safe, "text-emerald-400"]] as [string,number,string][])
              .filter(([,v]) => v > 0)
              .map(([l,v,c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className={`text-[13px] font-bold ${c}`}>{v}</span>
                  <span className="text-[11px] text-slate-600">{l}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Endpoints */}
        <motion.div variants={item} className="xl:col-span-3">
          <p className="section-label mb-3">Endpoints</p>
          <div className="glass rounded-2xl overflow-hidden">
            {epLoad ? (
              <div className="p-4 space-y-3">{Array.from({length:3}).map((_,i) => <Skel key={i} className="h-14" />)}</div>
            ) : endpoints.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <p className="text-[13px] text-slate-500 font-medium">No endpoints</p>
                <p className="text-[11px] text-slate-700">Trigger a monitor run to load from config</p>
              </div>
            ) : (
              <div>
                {endpoints.map((ep, i) => {
                  const epDiffs = allDiffs.filter(d => d.endpoint_id === ep.id);
                  const epBreaking = epDiffs.filter(d => d.severity === "breaking").length;
                  const epRisky    = epDiffs.filter(d => d.severity === "risky").length;

                  return (
                    <motion.div key={ep.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/endpoints/${ep.id}`} className="group block"
                        style={{ borderBottom: i < endpoints.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div className="flex items-center gap-4 px-5 py-3.5 transition-all duration-200"
                          style={{ position: "relative" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                          {/* Status dot */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${epBreaking>0 ? "bg-red-500" : ep.latest_snapshot_hash ? "bg-emerald-500" : "bg-slate-700"}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-slate-200 group-hover:text-white transition-colors">{ep.name}</span>
                              {epBreaking > 0 && <span className="badge-breaking text-[10px]"><span className="w-1 h-1 rounded-full bg-red-400"/>{epBreaking} breaking</span>}
                              {epRisky > 0 && !epBreaking && <span className="badge-risky text-[10px]"><span className="w-1 h-1 rounded-full bg-amber-400"/>{epRisky} risky</span>}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 truncate">{ep.url}</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {ep.latest_snapshot_hash && (
                              <code className="mono text-[10px] text-indigo-400/60 hidden sm:block">
                                {ep.latest_snapshot_hash.slice(0, 8)}
                              </code>
                            )}
                            <span className="text-[11px] text-slate-700">{timeAgo(ep.latest_checked_at)}</span>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-700 group-hover:text-slate-500 transition-colors group-hover:translate-x-0.5" style={{ transition: "all 0.2s" }}>
                              <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Monitor runs */}
        <motion.div variants={item} className="xl:col-span-2">
          <p className="section-label mb-3">Monitor Runs</p>
          <div className="glass rounded-2xl overflow-hidden">
            {runsLoad ? (
              <div className="p-4 space-y-2">{Array.from({length:4}).map((_,i) => <Skel key={i} className="h-12" />)}</div>
            ) : runs.length === 0 ? (
              <p className="text-[12px] text-slate-600 px-5 py-10 text-center">No runs yet</p>
            ) : (
              runs.map((run, i) => {
                const cfg = STATUS[run.status];
                return (
                  <motion.div key={run.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="px-5 py-3"
                    style={{ borderBottom: i < runs.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className={`text-[12px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-700">{timeAgo(run.started_at)}</span>
                    </div>
                    <div className="flex gap-3 ml-3.5">
                      <span className="text-[11px] text-slate-600">{run.endpoints_checked} eps</span>
                      <span className="text-[11px] text-slate-600">{run.snapshots_created} snaps</span>
                      {run.diffs_detected > 0 && (
                        <span className="text-[11px] text-red-400 font-medium">{run.diffs_detected} diffs</span>
                      )}
                      {run.finished_at && (
                        <span className="text-[11px] text-slate-700">
                          {Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent diffs */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Recent Diffs</p>
          <Link to="/diffs" className="btn-ghost text-[11px] h-7 px-2.5">
            View all <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          {allDiffs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-[13px] text-slate-500 font-medium">All clear</p>
              <p className="text-[11px] text-slate-700">No schema drift detected</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[85px_130px_1fr_140px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["Severity","Change","Path","Endpoint"].map(h => <span key={h} className="section-label">{h}</span>)}
              </div>
              {allDiffs.slice(0,10).map((d, i) => {
                const ep = endpoints.find(e => e.id === d.endpoint_id);
                return (
                  <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[85px_130px_1fr_140px] gap-3 px-5 py-2.5 transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="self-center"><SeverityBadge severity={d.severity} /></div>
                    <span className="text-[11px] text-slate-400 self-center">{d.change_type}</span>
                    <code className="mono text-[11px] text-indigo-300/80 self-center truncate">{d.path}</code>
                    {ep ? (
                      <Link to={`/endpoints/${ep.id}`} className="text-[11px] text-slate-500 hover:text-indigo-400 self-center truncate transition-colors">
                        {ep.name}
                      </Link>
                    ) : <span className="text-slate-700 text-[11px] self-center">—</span>}
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
