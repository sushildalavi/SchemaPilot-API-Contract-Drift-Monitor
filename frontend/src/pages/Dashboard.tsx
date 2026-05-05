import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { NumberTicker } from "../components/NumberTicker";
import { BorderBeam } from "../components/BorderBeam";
import { MagicCard } from "../components/MagicCard";
import { Meteors } from "../components/Meteors";
import { DriftChart } from "../components/DriftChart";
import { ActivityFeed } from "../components/ActivityFeed";
import { Sparkline } from "../components/Sparkline";
import type { MonitorRun } from "../types";

const STATUS: Record<MonitorRun["status"], { color: string; dot: string; label: string }> = {
  success:         { color: "#86efac", dot: "dot-green",  label: "Completed" },
  partial_failure: { color: "#fcd34d", dot: "dot-yellow", label: "Partial" },
  failed:          { color: "#fca5a5", dot: "dot-red",    label: "Failed" },
  running:         { color: "#93c5fd", dot: "dot-blue",   label: "Running" },
};

function timeAgo(dt: string | null) {
  if (!dt) return "–";
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Skel({ h = "h-8", className = "" }: { h?: string; className?: string }) {
  return <div className={`skel ${h} ${className}`} />;
}

const V = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } } },
};

export function Dashboard() {
  const { data: endpoints = [], isLoading: epLoad } = useQuery({ queryKey: QUERY_KEYS.endpoints, queryFn: api.endpoints.list, staleTime: 30_000, refetchInterval: 60_000 });
  const { data: runs = [], isLoading: runsLoad } = useQuery({ queryKey: QUERY_KEYS.monitorRuns, queryFn: () => api.monitor.runs(20), staleTime: 30_000, refetchInterval: 30_000 });
  const { data: allDiffs = [] } = useQuery({ queryKey: QUERY_KEYS.recentDiffs, queryFn: () => api.diffs.recent(200), staleTime: 30_000, refetchInterval: 30_000 });

  const latestRun  = runs[0];
  const breaking   = allDiffs.filter(d => d.severity === "breaking").length;
  const risky      = allDiffs.filter(d => d.severity === "risky").length;
  const safe       = allDiffs.filter(d => d.severity === "safe").length;
  const driftTrend = runs.slice().reverse().map(r => r.diffs_detected);
  const statusCfg  = latestRun ? STATUS[latestRun.status] : null;
  const totalSnaps = runs.reduce((a, r) => a + r.snapshots_created, 0);

  return (
    <motion.div className="space-y-6" style={{ maxWidth: 1440 }} variants={V.container} initial="hidden" animate="show">

      {/* ── Hero banner ─────────────────────────────────── */}
      <motion.div variants={V.item} className="relative overflow-hidden rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-2)", padding: "28px 32px 24px" }}>
        <Meteors number={10} />
        <BorderBeam size={250} duration={10} colorFrom="#6366f1" colorTo="#8b5cf6" borderWidth={1} />

        <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="heading-xl">API Contract Monitor</h1>
              {statusCfg && (
                <span
                  className="flex items-center gap-2 rounded-full px-3 py-1"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 500, color: statusCfg.color }}
                >
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              )}
            </div>
            <p className="body">
              Monitoring {endpoints.length} endpoints · {runs.length} runs · {totalSnaps} snapshots
              {latestRun && ` · last run ${timeAgo(latestRun.started_at)}`}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {([
              ["Breaking", breaking, "#fca5a5"],
              ["Risky",    risky,    "#fcd34d"],
              ["Safe",     safe,     "#86efac"],
            ] as [string, number, string][]).map(([label, val, color]) => (
              <div key={label} className="text-center">
                <p className="mono" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: val > 0 ? color : "var(--text-4)" }}>
                  {val}
                </p>
                <p className="caption mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Metrics row ─────────────────────────────────── */}
      <motion.div variants={V.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {epLoad ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} h="h-[120px]" className="rounded-xl" />) : (
          <>
            {([
              { label: "Endpoints",    value: endpoints.length, sub: `${totalSnaps} snapshots`, spark: runs.map(r => r.endpoints_checked).reverse(), color: "#818cf8", sparkColor: "#6366f1" },
              { label: "Breaking",     value: breaking, sub: breaking > 0 ? "Action needed" : "All clear", spark: driftTrend, color: breaking > 0 ? "#fca5a5" : "var(--text-3)", sparkColor: "#ef4444" },
              { label: "Risky",        value: risky,    sub: "Needs review", spark: [0, 0, 1, 1, 2, 1], color: risky > 0 ? "#fcd34d" : "var(--text-3)", sparkColor: "#f59e0b" },
              { label: "Safe Changes", value: safe,     sub: "Non-breaking",  spark: [1, 2, 1, 3, 2, 4], color: safe > 0 ? "#86efac" : "var(--text-3)", sparkColor: "#22c55e" },
            ] as { label: string; value: number; sub: string; spark: number[]; color: string; sparkColor: string }[]).map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, type: "spring", stiffness: 250, damping: 22 }}>
                <MagicCard className="card h-full" gradientColor={`${m.sparkColor}20`}>
                  <div className="p-5 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow">{m.label}</span>
                      {m.spark.length > 2 && <Sparkline data={m.spark} width={56} height={22} color={m.sparkColor} />}
                    </div>
                    <p className="mono" style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: m.color }}>
                      <NumberTicker value={m.value} />
                    </p>
                    <p className="caption">{m.sub}</p>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* ── Severity bar ─────────────────────────────────── */}
      {(breaking + risky + safe) > 0 && (
        <motion.div variants={V.item}>
          <MagicCard className="card" gradientColor="rgba(99,102,241,0.06)">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow">Severity Distribution</span>
                <div className="flex gap-4">
                  {([["Breaking", breaking, "#fca5a5"], ["Risky", risky, "#fcd34d"], ["Safe", safe, "#86efac"]] as [string, number, string][]).filter(([, v]) => v > 0).map(([l, v, c]) => (
                    <span key={l} className="flex items-center gap-1.5 caption">
                      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span style={{ color: c, fontWeight: 600 }}>{v}</span>
                      <span>{l}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-0.5 rounded-full overflow-hidden" style={{ height: 8, background: "rgba(255,255,255,0.06)" }}>
                {([["breaking", breaking, "#ef4444"], ["risky", risky, "#f59e0b"], ["safe", safe, "#22c55e"]] as [string, number, string][]).filter(([, v]) => v > 0).map(([key, v, color], i) => (
                  <motion.div
                    key={key} className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ flex: 0 }}
                    animate={{ flex: v }}
                    transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              </div>
            </div>
          </MagicCard>
        </motion.div>
      )}

      {/* ── Main grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Endpoints list */}
        <motion.div variants={V.item} className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Endpoints</span>
            <span className="caption">{endpoints.length} monitored</span>
          </div>

          {epLoad ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skel key={i} h="h-[68px]" className="rounded-xl" />)}</div>
          ) : endpoints.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="heading-sm mb-1">No endpoints yet</p>
              <p className="body">Trigger a monitor run to load from config</p>
            </div>
          ) : (
            <div className="space-y-2">
              {endpoints.map((ep, i) => {
                const epDiffs = allDiffs.filter(d => d.endpoint_id === ep.id);
                const epBreaking = epDiffs.filter(d => d.severity === "breaking").length;
                const epRisky = epDiffs.filter(d => d.severity === "risky").length;

                return (
                  <motion.div key={ep.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Link to={`/endpoints/${ep.id}`}>
                      <MagicCard className="card" gradientColor={epBreaking ? "rgba(239,68,68,0.07)" : "rgba(99,102,241,0.06)"}>
                        <div className="flex items-center gap-4 row p-4 !border-b-0 !rounded-xl" style={{ cursor: "pointer" }}>
                          <div className="relative flex-shrink-0">
                            {(epBreaking > 0 || epRisky > 0) && (
                              <span
                                className="absolute inset-0 rounded-full animate-ping opacity-60"
                                style={{ background: epBreaking > 0 ? "#ef4444" : "#f59e0b" }}
                              />
                            )}
                            <span
                              className="w-2.5 h-2.5 rounded-full block relative"
                              style={{ background: epBreaking > 0 ? "#ef4444" : epRisky > 0 ? "#f59e0b" : ep.latest_snapshot_hash ? "#22c55e" : "var(--text-3)" }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="heading-sm">{ep.name}</span>
                              {epBreaking > 0 && <span className="badge badge-breaking">{epBreaking} breaking</span>}
                              {!epBreaking && epRisky > 0 && <span className="badge badge-risky">{epRisky} risky</span>}
                            </div>
                            <p className="mono caption truncate mt-0.5" style={{ color: "var(--text-3)" }}>{ep.url}</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {ep.latest_snapshot_hash && (
                              <code className="mono caption" style={{ color: "var(--text-3)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                                {ep.latest_snapshot_hash.slice(0, 8)}
                              </code>
                            )}
                            <span className="caption">{timeAgo(ep.latest_checked_at)}</span>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-3)", flexShrink: 0 }}>
                              <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </MagicCard>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Activity feed */}
        <motion.div variants={V.item}>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Live Activity</span>
            <Link to="/diffs" className="caption" style={{ color: "var(--indigo-light)", textDecoration: "none" }}>View all →</Link>
          </div>
          <MagicCard className="card" gradientColor="rgba(99,102,241,0.05)">
            <div className="p-4">
              <ActivityFeed diffs={allDiffs} endpoints={endpoints} />
            </div>
          </MagicCard>
        </motion.div>
      </div>

      {/* ── Chart + Runs ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div variants={V.item} className="xl:col-span-2">
          <MagicCard className="card" gradientColor="rgba(99,102,241,0.04)">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="heading-sm">Monitor History</p>
                  <p className="caption mt-0.5">Drift events and snapshots over time</p>
                </div>
                <div className="flex items-center gap-4">
                  {[["Snapshots", "#22c55e"], ["Diffs", "#6366f1"]].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-2">
                      <div style={{ width: 16, height: 2, background: c as string, borderRadius: 2 }} />
                      <span className="caption">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              {runsLoad ? <Skel h="h-44" /> : <DriftChart runs={runs} />}
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={V.item}>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Recent Runs</span>
          </div>
          <MagicCard className="card" gradientColor="rgba(99,102,241,0.04)">
            {runsLoad ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} h="h-10" />)}</div>
            ) : runs.length === 0 ? (
              <p className="body p-6 text-center">No runs yet</p>
            ) : (
              <div>
                {runs.slice(0, 8).map((run) => {
                  const cfg = STATUS[run.status];
                  const dur = run.finished_at
                    ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                    : null;
                  return (
                    <div key={run.id} className="row flex items-center gap-3 px-4 py-2.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                      <div className="flex-1">
                        <span className="body" style={{ color: cfg.color, fontWeight: 500, fontSize: 12 }}>{cfg.label}</span>
                        <span className="caption ml-2">{run.endpoints_checked}ep · {run.snapshots_created}snaps</span>
                        {run.diffs_detected > 0 && <span style={{ fontSize: 11, color: "#fca5a5", marginLeft: 6 }}>⚡ {run.diffs_detected}</span>}
                      </div>
                      <div className="text-right">
                        <p className="caption">{timeAgo(run.started_at)}</p>
                        {dur && <p className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{dur}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MagicCard>
        </motion.div>
      </div>

      {/* ── Recent diffs ─────────────────────────────────── */}
      <motion.div variants={V.item}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="eyebrow">Recent Diffs</span>
            {allDiffs.length > 0 && <span className="badge badge-risky">{allDiffs.length} events</span>}
          </div>
          <Link to="/diffs">
            <motion.span
              className="btn btn-secondary caption"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ cursor: "pointer" }}
            >
              View all →
            </motion.span>
          </Link>
        </div>

        <MagicCard className="card overflow-hidden" gradientColor="rgba(99,102,241,0.04)">
          {allDiffs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="heading-sm">Schema stable</p>
              <p className="body">No drift detected</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[80px_130px_1fr_140px_65px_65px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Severity", "Change", "Path", "Endpoint", "Old", "New"].map(h => <span key={h} className="eyebrow">{h}</span>)}
              </div>
              {allDiffs.slice(0, 10).map((d, i) => {
                const ep = endpoints.find(e => e.id === d.endpoint_id);
                return (
                  <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="row grid grid-cols-[80px_130px_1fr_140px_65px_65px] gap-3 px-5 py-3">
                    <div className="self-center">
                      <span className={`badge badge-${d.severity}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.severity === "breaking" ? "dot-red" : d.severity === "risky" ? "dot-yellow" : "dot-green"}`} />
                        {d.severity}
                      </span>
                    </div>
                    <span className="mono self-center" style={{ fontSize: 11, color: "var(--text-2)" }}>{d.change_type}</span>
                    <code className="mono self-center truncate" style={{ fontSize: 11, color: "var(--indigo-light)" }}>{d.path}</code>
                    {ep ? (
                      <Link to={`/endpoints/${ep.id}`} className="self-center truncate body" style={{ fontSize: 12, color: "var(--text-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--indigo-light)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}>
                        {ep.name}
                      </Link>
                    ) : <span className="self-center caption">—</span>}
                    <span className="mono self-center caption">{d.old_type ?? "—"}</span>
                    <span className="mono self-center caption">{d.new_type ?? "—"}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </MagicCard>
      </motion.div>
    </motion.div>
  );
}
