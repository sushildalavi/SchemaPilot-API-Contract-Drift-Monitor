import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { DriftChart } from "../components/DriftChart";
import { ActivityFeed } from "../components/ActivityFeed";
import { EndpointCard } from "../components/EndpointCard";
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

const STATUS_CFG: Record<MonitorRun["status"], { dot: string; label: string; bg: string; text: string }> = {
  success:         { dot: "#34d399", label: "Success",         bg: "rgba(16,185,129,0.08)",  text: "#34d399" },
  partial_failure: { dot: "#fbbf24", label: "Partial Failure", bg: "rgba(245,158,11,0.08)",  text: "#fbbf24" },
  failed:          { dot: "#f87171", label: "Failed",          bg: "rgba(239,68,68,0.08)",    text: "#f87171" },
  running:         { dot: "#60a5fa", label: "Running",         bg: "rgba(96,165,250,0.08)",   text: "#60a5fa" },
};

function Skel({ w = "w-full", h = "h-10" }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />;
}

const variants = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item:      { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 22 } } },
};

export function Dashboard() {
  const { data: endpoints = [], isLoading: epLoad } = useQuery({ queryKey: QUERY_KEYS.endpoints, queryFn: api.endpoints.list, staleTime: 30_000, refetchInterval: 60_000 });
  const { data: runs = [], isLoading: runsLoad } = useQuery({ queryKey: QUERY_KEYS.monitorRuns, queryFn: () => api.monitor.runs(20), staleTime: 30_000, refetchInterval: 30_000 });
  const { data: allDiffs = [] } = useQuery({ queryKey: QUERY_KEYS.recentDiffs, queryFn: () => api.diffs.recent(200), staleTime: 30_000, refetchInterval: 30_000 });

  const latestRun = runs[0];
  const breaking = allDiffs.filter(d => d.severity === "breaking").length;
  const risky    = allDiffs.filter(d => d.severity === "risky").length;
  const safe     = allDiffs.filter(d => d.severity === "safe").length;

  const driftTrend = runs.slice().reverse().map(r => r.diffs_detected);
  const epTrend    = runs.slice().reverse().map(r => r.endpoints_checked);

  const statusCfg = latestRun ? STATUS_CFG[latestRun.status] : null;

  // Snapshots per endpoint (approx from runs history)
  const totalSnaps = runs.reduce((a, r) => a + r.snapshots_created, 0);

  return (
    <motion.div className="space-y-6 max-w-[1400px]" variants={variants.container} initial="hidden" animate="show">
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div variants={variants.item} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="heading">Overview</h1>
            {statusCfg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                style={{ background: statusCfg.bg, color: statusCfg.text, border: `1px solid ${statusCfg.dot}30` }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusCfg.dot }} />
                {statusCfg.label}
              </motion.div>
            )}
          </div>
          <p className="subtext mt-1">
            {endpoints.length} endpoints · {runs.length} runs · {allDiffs.length} total diffs
            {latestRun && ` · last check ${timeAgo(latestRun.started_at)}`}
          </p>
        </div>
      </motion.div>

      {/* ── Metric cards ───────────────────────────────── */}
      <motion.div variants={variants.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {epLoad ? Array.from({length:4}).map((_,i) => <Skel key={i} h="h-[120px]" />) : (
          <>
            <MetricCard label="Endpoints" value={endpoints.length} trend={epTrend.length > 1 ? epTrend : [3,3,4,4,4]} color="indigo" sub={`${totalSnaps} snapshots total`}
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>}
            />
            <MetricCard label="Breaking" value={breaking} trend={driftTrend.length > 1 ? driftTrend : [0,1,0,2,0]} color={breaking>0?"red":"default"} sub={breaking > 0 ? "Schema has issues" : "All clear"} delta={breaking > 0 ? breaking : undefined}
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>}
            />
            <MetricCard label="Risky" value={risky} trend={[0,0,1,1,2,1]} color={risky>0?"amber":"default"} sub="Needs review"
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            />
            <MetricCard label="Safe" value={safe} trend={[1,2,1,3,2,4]} color={safe>0?"green":"default"} sub="Non-breaking changes"
              icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
            />
          </>
        )}
      </motion.div>

      {/* ── Severity bar ───────────────────────────────── */}
      {(breaking + risky + safe) > 0 && (
        <motion.div variants={variants.item} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="label">Severity breakdown</span>
            <div className="flex items-center gap-4 text-[11px]">
              {([["Breaking", breaking, "#f87171"], ["Risky", risky, "#fbbf24"], ["Safe", safe, "#34d399"]] as [string,number,string][]).filter(([,v]) => v > 0).map(([l,v,c]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span style={{ color: c }}>{v}</span>
                  <span style={{ color: "#1e293b" }}>{l}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex gap-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
            {([["breaking", breaking, "#ef4444"], ["risky", risky, "#f59e0b"], ["safe", safe, "#10b981"]] as [string,number,string][]).filter(([,v]) => v > 0).map(([key, v, color], i) => (
              <motion.div key={key} className="h-full rounded-full"
                style={{ background: color, transformOrigin: "left" }}
                initial={{ flex: 0 }}
                animate={{ flex: v }}
                transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16,1,0.3,1] }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Main grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Endpoint cards (2 cols) */}
        <motion.div variants={variants.item} className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="label">Endpoints</p>
            <span className="text-[11px]" style={{ color: "#1e293b" }}>{endpoints.length} monitored</span>
          </div>
          {epLoad ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({length:4}).map((_,i) => <Skel key={i} h="h-36" />)}
            </div>
          ) : endpoints.length === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3"/></svg>
              </div>
              <p className="text-[13px] font-semibold text-slate-500">No endpoints yet</p>
              <p className="text-[12px]" style={{ color: "#1e293b" }}>Trigger a monitor run to discover endpoints</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {endpoints.map((ep, i) => {
                const epDiffs = allDiffs.filter(d => d.endpoint_id === ep.id);
                return (
                  <motion.div key={ep.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <EndpointCard endpoint={ep} diffs={epDiffs} snapshots={[]} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Activity feed */}
        <motion.div variants={variants.item} className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <p className="label">Activity Feed</p>
            <Link to="/diffs" className="text-[11px]" style={{ color: "#4338ca" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4338ca")}>
              View all →
            </Link>
          </div>
          <div className="card p-4 h-full">
            <ActivityFeed diffs={allDiffs} endpoints={endpoints} />
          </div>
        </motion.div>
      </div>

      {/* ── Charts row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Area chart */}
        <motion.div variants={variants.item} className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-semibold text-slate-300">Monitor History</p>
              <p className="subtext mt-0.5">Drift events and snapshots per run</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              {[["Snapshots", "#10b981"], ["Total Diffs", "#6366f1"]].map(([l,c]) => (
                <span key={l} className="flex items-center gap-1.5" style={{ color: "#475569" }}>
                  <span className="w-2 h-0.5 rounded-full" style={{ background: c as string }} />{l}
                </span>
              ))}
            </div>
          </div>
          {runsLoad ? <Skel h="h-44" /> : <DriftChart runs={runs} />}
        </motion.div>

        {/* Run history */}
        <motion.div variants={variants.item} className="xl:col-span-1 card p-5">
          <p className="text-[13px] font-semibold text-slate-300 mb-4">Recent Runs</p>
          {runsLoad ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i) => <Skel key={i} h="h-11" />)}</div>
          ) : runs.length === 0 ? (
            <p className="text-[12px] text-center py-8" style={{ color: "#1e293b" }}>No runs yet</p>
          ) : (
            <div className="space-y-0">
              {runs.slice(0, 8).map((run, i) => {
                const cfg = STATUS_CFG[run.status];
                const dur = run.finished_at
                  ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                  : null;
                return (
                  <motion.div key={run.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-2.5 table-row rounded-lg px-1"
                    style={{ borderBottom: i < runs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium" style={{ color: cfg.text }}>{cfg.label}</span>
                      <span className="ml-2 text-[10px]" style={{ color: "#1e293b" }}>
                        {run.endpoints_checked}ep · {run.snapshots_created}snaps
                        {run.diffs_detected > 0 && <span style={{ color: "#f87171" }}> · {run.diffs_detected}⚡</span>}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px]" style={{ color: "#1e293b" }}>{timeAgo(run.started_at)}</span>
                      {dur && <span className="text-[9px]" style={{ color: "#0f172a" }}>{dur}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Recent diffs table ─────────────────────────── */}
      <motion.div variants={variants.item}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-semibold text-slate-300">Recent Diffs</p>
            <p className="subtext mt-0.5">{allDiffs.length} total drift events detected</p>
          </div>
          <Link to="/diffs">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn btn-outline text-[12px]">
              View All
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
            </motion.button>
          </Link>
        </div>

        <div className="card overflow-hidden">
          {allDiffs.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>✓</div>
              <p className="text-[14px] font-semibold text-slate-400">Schema stable</p>
              <p className="subtext">No drift detected across all monitored endpoints</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[80px_130px_1fr_140px_70px_70px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["Severity","Change","Path","Endpoint","Old","New"].map(h => <span key={h} className="label">{h}</span>)}
              </div>
              {allDiffs.slice(0, 10).map((d, i) => {
                const ep = endpoints.find(e => e.id === d.endpoint_id);
                return (
                  <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                    className="grid grid-cols-[80px_130px_1fr_140px_70px_70px] gap-3 px-5 py-2.5 table-row"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
                    <div className="self-center">
                      <span className={`badge badge-${d.severity}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.severity==="breaking"?"bg-red-400":d.severity==="risky"?"bg-amber-400":"bg-emerald-400"}`} />
                        {d.severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 self-center font-medium">{d.change_type}</span>
                    <code className="mono text-[11px] text-indigo-300/80 self-center truncate">{d.path}</code>
                    {ep ? (
                      <Link to={`/endpoints/${ep.id}`} className="text-[11px] text-slate-500 hover:text-indigo-400 self-center truncate transition-colors">
                        {ep.name}
                      </Link>
                    ) : <span className="text-[11px] self-center" style={{ color: "#0f172a" }}>—</span>}
                    <span className="mono text-[10px] text-slate-600 self-center">{d.old_type ?? "—"}</span>
                    <span className="mono text-[10px] text-slate-600 self-center">{d.new_type ?? "—"}</span>
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
