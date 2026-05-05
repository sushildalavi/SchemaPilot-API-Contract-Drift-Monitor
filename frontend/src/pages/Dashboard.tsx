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
  success:         { color: "#6ee7b7", dot: "#34d399", label: "Success" },
  partial_failure: { color: "#fcd34d", dot: "#fbbf24", label: "Partial" },
  failed:          { color: "#fca5a5", dot: "#f87171", label: "Failed" },
  running:         { color: "#93c5fd", dot: "#60a5fa", label: "Running" },
};

function timeAgo(dt: string | null) {
  if (!dt) return "–";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

const parent = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const child  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } } };

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
  const statusCfg  = latestRun ? STATUS[latestRun.status] : null;

  return (
    <motion.div
      className="space-y-6"
      style={{ maxWidth: 1400 }}
      variants={parent}
      initial="hidden"
      animate="show"
    >

      {/* ── Hero header with Meteors ─────────────────── */}
      <motion.div variants={child} className="relative overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px 28px 24px" }}>
        <Meteors number={14} />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0f0f0", lineHeight: 1 }}>
                API Contract Monitor
              </h1>
              {statusCfg && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ background: `${statusCfg.dot}15`, border: `1px solid ${statusCfg.dot}30`, fontSize: 11, fontWeight: 600, color: statusCfg.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                  {statusCfg.label}
                </motion.span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#383850" }}>
              {endpoints.length} endpoints · {runs.length} runs · {allDiffs.length} diffs detected
              {latestRun && ` · last checked ${timeAgo(latestRun.started_at)}`}
            </p>
          </div>
          <div className="flex-shrink-0 hidden md:flex items-center gap-3">
            {([
              { label: "Breaking", val: breaking, c: "#fc8181" },
              { label: "Risky",    val: risky,    c: "#fdba74" },
              { label: "Safe",     val: safe,     c: "#6ee7b7" },
            ] as {label:string;val:number;c:string}[]).map(({ label, val, c }) => (
              <div key={label} className="text-right">
                <p style={{ fontSize: 22, fontWeight: 700, color: val > 0 ? c : "#1e1e2a", fontFamily: "JetBrains Mono,monospace", lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 10, color: "#2a2a3a", marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
        <BorderBeam size={200} duration={10} colorFrom="#6366f1" colorTo="#a855f7" borderWidth={1} />
      </motion.div>

      {/* ── Big metric cards ─────────────────────────── */}
      <motion.div variants={child} className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {epLoad ? Array.from({length:4}).map((_,i) => <Skel key={i} className="h-28 rounded-xl" />) : (
          <>
            {([
              { label: "Endpoints",    value: endpoints.length, spark: epTrend, color: "#818cf8", sparkColor: "#6366f1", sub: `${runs.reduce((a,r) => a+r.snapshots_created,0)} total snapshots` },
              { label: "Breaking",     value: breaking, spark: driftTrend, color: breaking>0?"#fc8181":"#1e1e2a", sparkColor: "#ef4444", sub: breaking>0?"Needs attention":"Schema stable" },
              { label: "Risky",        value: risky,    spark: [0,0,1,1,2,1], color: risky>0?"#fdba74":"#1e1e2a", sparkColor: "#f97316", sub: "Requires review" },
              { label: "Safe Changes", value: safe,     spark: [1,2,1,3,2,4], color: safe>0?"#6ee7b7":"#1e1e2a", sparkColor: "#10b981", sub: "Non-breaking" },
            ] as {label:string;value:number;spark:number[];color:string;sparkColor:string;sub:string}[]).map(({ label, value, spark, color, sparkColor, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 22 }}
                whileHover={{ y: -2, scale: 1.01 }}
              >
                <MagicCard
                  className="sp-card h-full"
                  gradientColor={`${sparkColor}15`}
                >
                  <div style={{ padding: "16px 18px 14px" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="sp-label">{label}</span>
                      {spark.length > 2 && (
                        <Sparkline data={spark} width={48} height={20} color={sparkColor} />
                      )}
                    </div>
                    <p style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color, fontFamily: "JetBrains Mono,monospace" }}>
                      <NumberTicker value={value} className="" />
                    </p>
                    <p style={{ fontSize: 11, color: "#2a2a3a", marginTop: 6 }}>{sub}</p>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* ── Severity bar ─────────────────────────────── */}
      {(breaking + risky + safe) > 0 && (
        <motion.div variants={child}>
          <MagicCard className="sp-card" gradientColor="rgba(99,102,241,0.06)">
            <div style={{ padding: "14px 18px" }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="sp-label">Severity distribution</span>
                <span style={{ fontSize: 11, color: "#2a2a3a" }}>{breaking+risky+safe} total</span>
              </div>
              <div className="flex gap-0.5 overflow-hidden rounded-full" style={{ height: 6, background: "rgba(255,255,255,0.04)" }}>
                {([["breaking",breaking,"#ef4444"],["risky",risky,"#f97316"],["safe",safe,"#10b981"]] as [string,number,string][]).filter(([,v])=>v>0).map(([k,v,c],i) => (
                  <motion.div key={k} className="h-full rounded-full"
                    style={{ background: c }}
                    initial={{ flex: 0 }}
                    animate={{ flex: v }}
                    transition={{ duration: 1, delay: i * 0.15, ease: [0.16,1,0.3,1] }}
                  />
                ))}
              </div>
              <div className="flex gap-5 mt-2">
                {([["Breaking",breaking,"#fc8181"],["Risky",risky,"#fdba74"],["Safe",safe,"#6ee7b7"]] as [string,number,string][]).filter(([,v])=>v>0).map(([l,v,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "JetBrains Mono,monospace" }}>{v}</span>
                    <span style={{ fontSize: 11, color: "#2a2a3a" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </MagicCard>
        </motion.div>
      )}

      {/* ── Providers marquee ─────────────────────────  */}
      {endpoints.length > 0 && (
        <motion.div variants={child} className="overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center overflow-hidden py-2">
            {[...endpoints,...endpoints,...endpoints].map((ep, i) => (
              <div key={`${ep.id}-${i}`} className="flex items-center gap-2 px-5 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
                <span style={{ fontSize: 11, color: "#2a2a3a", whiteSpace: "nowrap", fontFamily: "JetBrains Mono,monospace" }}>{ep.provider}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Main grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Endpoints list (3 col) */}
        <motion.div variants={child} className="xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="sp-label">Endpoints</span>
            <span style={{ fontSize: 11, color: "#2a2a3a" }}>{endpoints.filter(e=>e.is_active).length} active</span>
          </div>

          {epLoad ? (
            <div className="space-y-2">{Array.from({length:3}).map((_,i) => <Skel key={i} className="h-16 rounded-xl" />)}</div>
          ) : endpoints.length === 0 ? (
            <div className="sp-card p-10 text-center">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#383850" }}>No endpoints loaded</p>
              <p style={{ fontSize: 11, color: "#2a2a3a", marginTop: 4 }}>Trigger a monitor run to populate from config</p>
            </div>
          ) : (
            <div className="space-y-2">
              {endpoints.map((ep, i) => {
                const epDiffs   = allDiffs.filter(d => d.endpoint_id === ep.id);
                const epBreaking = epDiffs.filter(d => d.severity === "breaking").length;
                const epRisky    = epDiffs.filter(d => d.severity === "risky").length;
                const healthy    = !epBreaking && !epRisky;

                return (
                  <motion.div key={ep.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link to={`/endpoints/${ep.id}`}>
                      <MagicCard className="sp-card" gradientColor={epBreaking ? "rgba(239,68,68,0.06)" : "rgba(99,102,241,0.06)"}>
                        <div
                          className="flex items-center gap-4 tr-hover"
                          style={{ padding: "12px 16px" }}
                        >
                          <div className="relative w-2 h-2 flex-shrink-0">
                            {!healthy && (
                              <span
                                className="absolute inset-0 rounded-full"
                                style={{ background: epBreaking ? "#ef4444" : "#f97316", animation: "ripple-out 1.8s ease-out infinite", opacity: 0.6 }}
                              />
                            )}
                            <span className="w-2 h-2 rounded-full block relative z-10"
                              style={{ background: epBreaking ? "#ef4444" : epRisky ? "#f97316" : ep.latest_snapshot_hash ? "#10b981" : "#2a2a3a" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#d0d0e0" }}>{ep.name}</span>
                              {epBreaking > 0 && <span className="sp-badge sp-badge-breaking">{epBreaking} breaking</span>}
                              {!epBreaking && epRisky > 0 && <span className="sp-badge sp-badge-risky">{epRisky} risky</span>}
                            </div>
                            <p className="mono truncate" style={{ fontSize: 10, color: "#2a2a3a" }}>{ep.url}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {ep.latest_snapshot_hash && (
                              <code className="mono" style={{ fontSize: 10, color: "#404058", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4 }}>
                                {ep.latest_snapshot_hash.slice(0, 8)}
                              </code>
                            )}
                            <span style={{ fontSize: 11, color: "#2a2a3a" }}>{timeAgo(ep.latest_checked_at)}</span>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#1e1e2a" }}>
                              <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
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

        {/* Activity feed (2 col) */}
        <motion.div variants={child} className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="sp-label">Live Activity</span>
            <Link to="/diffs" style={{ fontSize: 11, color: "#4338ca" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4338ca")}>
              View all →
            </Link>
          </div>
          <MagicCard className="sp-card h-full" gradientColor="rgba(99,102,241,0.05)">
            <div style={{ padding: "12px 14px" }}>
              <ActivityFeed diffs={allDiffs} endpoints={endpoints} />
            </div>
          </MagicCard>
        </motion.div>
      </div>

      {/* ── Charts + runs ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div variants={child} className="xl:col-span-2">
          <MagicCard className="sp-card" gradientColor="rgba(99,102,241,0.05)">
            <div style={{ padding: "18px 20px 14px" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#d0d0e0" }}>Monitor History</p>
                  <p style={{ fontSize: 11, color: "#2a2a3a", marginTop: 2 }}>Snapshots and drift events per run</p>
                </div>
                <div className="flex items-center gap-4">
                  {[["Snapshots","#10b981"],["Total Diffs","#6366f1"]].map(([l,c]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div style={{ width: 20, height: 2, background: c as string, borderRadius: 2 }} />
                      <span style={{ fontSize: 10, color: "#2a2a3a" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              {runsLoad ? <Skel className="h-44" /> : <DriftChart runs={runs} />}
            </div>
          </MagicCard>
        </motion.div>

        <motion.div variants={child}>
          <div className="flex items-center justify-between mb-3">
            <span className="sp-label">Recent Runs</span>
          </div>
          <MagicCard className="sp-card" gradientColor="rgba(99,102,241,0.05)">
            {runsLoad ? (
              <div style={{ padding: 14 }} className="space-y-2">{Array.from({length:5}).map((_,i)=><Skel key={i} className="h-10 rounded-lg"/>)}</div>
            ) : runs.length === 0 ? (
              <p style={{ padding: 28, textAlign: "center", fontSize: 12, color: "#2a2a3a" }}>No runs yet</p>
            ) : (
              <div>
                {runs.slice(0, 8).map((run, i) => {
                  const cfg = STATUS[run.status];
                  const dur = run.finished_at ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s` : null;
                  return (
                    <motion.div key={run.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 tr-hover"
                      style={{ padding: "10px 16px", borderBottom: i < runs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                      <div className="flex-1">
                        <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 10, color: "#2a2a3a", marginLeft: 8 }}>{run.endpoints_checked} eps · {run.snapshots_created} snaps{run.diffs_detected > 0 ? ` · ` : ""}</span>
                        {run.diffs_detected > 0 && <span style={{ fontSize: 10, color: "#fc8181" }}>{run.diffs_detected} diffs</span>}
                      </div>
                      <div className="flex flex-col items-end">
                        <span style={{ fontSize: 10, color: "#2a2a3a" }}>{timeAgo(run.started_at)}</span>
                        {dur && <span className="mono" style={{ fontSize: 9, color: "#1e1e2a" }}>{dur}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </MagicCard>
        </motion.div>
      </div>

      {/* ── Recent diffs table ──────────────────────────── */}
      <motion.div variants={child}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="sp-label">Recent Diffs</span>
            {allDiffs.length > 0 && <span style={{ fontSize: 11, color: "#2a2a3a", marginLeft: 8 }}>{allDiffs.length} events</span>}
          </div>
          <Link to="/diffs">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer"
              style={{ border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "#383850" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = "#d0d0e0"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = "#383850"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              View all <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
            </motion.div>
          </Link>
        </div>

        <MagicCard className="sp-card overflow-hidden" gradientColor="rgba(99,102,241,0.04)">
          {allDiffs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#383850" }}>Schema stable</p>
              <p style={{ fontSize: 11, color: "#2a2a3a" }}>No drift detected across monitored endpoints</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[80px_130px_1fr_150px_70px_70px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["Severity","Change","Path","Endpoint","Old","New"].map(h => <span key={h} className="sp-label">{h}</span>)}
              </div>
              {allDiffs.slice(0, 10).map((d, i) => {
                const ep = endpoints.find(e => e.id === d.endpoint_id);
                return (
                  <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[80px_130px_1fr_150px_70px_70px] gap-3 px-5 py-2.5 tr-hover"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
                    <div className="self-center">
                      <span className={`sp-badge sp-badge-${d.severity}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.severity==="breaking"?"bg-red-400":d.severity==="risky"?"bg-orange-400":"bg-emerald-400"}`} />
                        {d.severity}
                      </span>
                    </div>
                    <span className="self-center mono" style={{ fontSize: 10, color: "#505068" }}>{d.change_type}</span>
                    <code className="self-center mono truncate" style={{ fontSize: 10, color: "#6366f1" }}>{d.path}</code>
                    {ep ? (
                      <Link to={`/endpoints/${ep.id}`} className="self-center truncate" style={{ fontSize: 11, color: "#383850" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#383850")}>
                        {ep.name}
                      </Link>
                    ) : <span className="self-center" style={{ fontSize: 11, color: "#1e1e2a" }}>—</span>}
                    <span className="self-center mono" style={{ fontSize: 10, color: "#2a2a3a" }}>{d.old_type ?? "—"}</span>
                    <span className="self-center mono" style={{ fontSize: 10, color: "#2a2a3a" }}>{d.new_type ?? "—"}</span>
                  </motion.div>
                );
              })}
            </>
          )}
        </MagicCard>
      </motion.div>
    </motion.div>
  );
}
