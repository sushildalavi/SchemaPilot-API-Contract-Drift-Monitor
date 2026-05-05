import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { ChangelogPanel } from "../components/ChangelogPanel";
import { DiffTable } from "../components/DiffTable";
import { SchemaTimeline } from "../components/SchemaTimeline";
import { Sparkline } from "../components/Sparkline";

type Tab = "diffs" | "timeline" | "schema" | "changelog";

function timeAgo(dt: string | null) {
  if (!dt) return "never";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_COLOR: Record<string, string> = {
  string: "text-emerald-400",
  integer: "text-amber-400",
  number: "text-amber-400",
  boolean: "text-pink-400",
  array: "text-blue-400",
  object: "text-violet-400",
  null: "text-slate-500",
  mixed: "text-orange-400",
  unknown: "text-slate-600",
};
const TYPE_BG: Record<string, string> = {
  string: "bg-emerald-500/8 border-emerald-500/15",
  integer: "bg-amber-500/8 border-amber-500/15",
  number: "bg-amber-500/8 border-amber-500/15",
  boolean: "bg-pink-500/8 border-pink-500/15",
  array: "bg-blue-500/8 border-blue-500/15",
  object: "bg-violet-500/8 border-violet-500/15",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "diffs", label: "Diffs" },
  { id: "timeline", label: "Timeline" },
  { id: "schema", label: "Schema" },
  { id: "changelog", label: "Changelog" },
];

export function EndpointDetail() {
  const { id } = useParams<{ id: string }>();
  const epId = id!;
  const [tab, setTab] = useState<Tab>("diffs");

  const { data: endpoint, isLoading } = useQuery({
    queryKey: QUERY_KEYS.endpoint(epId),
    queryFn: () => api.endpoints.get(epId),
    staleTime: 30_000,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: QUERY_KEYS.snapshots(epId),
    queryFn: () => api.endpoints.snapshots(epId),
    staleTime: 30_000,
  });

  const { data: diffs = [] } = useQuery({
    queryKey: QUERY_KEYS.diffs(epId),
    queryFn: () => api.endpoints.diffs(epId),
    staleTime: 30_000,
  });

  const diffSnapshotIds = new Set(diffs.map(d => d.new_snapshot_id));
  const latestSnapshot = snapshots[0] ?? null;

  const breaking = diffs.filter(d => d.severity === "breaking").length;
  const risky    = diffs.filter(d => d.severity === "risky").length;
  const safe     = diffs.filter(d => d.severity === "safe").length;
  const rts      = snapshots.filter(s => !s.fetch_error).map(s => s.response_time_ms).reverse();

  const schemaFields = (latestSnapshot?.normalized_schema_json as Array<{
    path: string; type: string; required: boolean; nullable: boolean;
    array_item_type?: string; enum_values?: string[]; example_value?: unknown;
  }> | null) ?? [];

  const tabCount: Record<Tab, number | undefined> = {
    diffs: diffs.length,
    timeline: snapshots.length,
    schema: schemaFields.length,
    changelog: undefined,
  };

  if (isLoading) return (
    <div className="space-y-5">
      <div className="skeleton h-7 w-44 rounded-xl" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
  if (!endpoint) return <p className="text-sm text-red-400">Endpoint not found.</p>;

  return (
    <motion.div className="space-y-6 max-w-7xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, type: "spring", stiffness: 200 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-600">
        <Link to="/" className="hover:text-slate-400 transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-slate-400">{endpoint.name}</span>
      </div>

      {/* Hero card */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Gradient top strip */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 opacity-60" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="heading">{endpoint.name}</h1>
                <div className="flex gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg border"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                    {endpoint.provider}
                  </span>
                  <span className="mono text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg border"
                    style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                    {endpoint.method}
                  </span>
                </div>
              </div>
              <a href={endpoint.url} target="_blank" rel="noreferrer"
                className="text-[12px] text-indigo-400/60 hover:text-indigo-300 transition-colors truncate max-w-xl block mt-1.5">
                {endpoint.url}
              </a>
              {endpoint.latest_snapshot_hash && (
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] text-slate-600">Current hash</span>
                  <code className="mono text-[11px] text-indigo-400/70">{endpoint.latest_snapshot_hash.slice(0, 24)}</code>
                  <span className="text-[11px] text-slate-700">· {timeAgo(endpoint.latest_checked_at)}</span>
                </div>
              )}
            </div>

            {/* Response time sparkline */}
            {rts.length > 1 && (
              <div className="flex flex-col items-end gap-1">
                <span className="section-label">Response time</span>
                <Sparkline data={rts} width={120} height={40} color={rts[rts.length-1] > 1000 ? "#f59e0b" : "#10b981"} />
                <span className="text-[11px] text-slate-600">{rts[rts.length-1]}ms latest</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6 pt-5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { label: "Snapshots", val: snapshots.length, color: "text-indigo-400" },
              { label: "Breaking", val: breaking, color: breaking>0 ? "text-red-400" : "text-slate-500" },
              { label: "Risky", val: risky, color: risky>0 ? "text-amber-400" : "text-slate-500" },
              { label: "Safe", val: safe, color: safe>0 ? "text-emerald-400" : "text-slate-500" },
              { label: "Fields", val: schemaFields.length, color: "text-violet-400" },
              { label: "Avg ms", val: rts.length ? Math.round(rts.reduce((a,b)=>a+b,0)/rts.length) : 0, color: "text-sky-400" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <span className="section-label block mb-1">{label}</span>
                <span className={`text-xl font-bold tabular-nums ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${tab === t.id ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
            {t.label}
            {tabCount[t.id] !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                tab === t.id ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-600"
              }`}>
                {tabCount[t.id]}
              </span>
            )}
            {tab === t.id && (
              <motion.div layoutId="ep-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === "diffs" && (
            <div className="glass rounded-2xl overflow-hidden">
              <DiffTable diffs={diffs} />
            </div>
          )}

          {tab === "timeline" && (
            <div className="glass rounded-2xl p-6">
              <SchemaTimeline snapshots={snapshots} diffSnapshotIds={diffSnapshotIds} />
            </div>
          )}

          {tab === "schema" && (
            <div className="glass rounded-2xl overflow-hidden">
              {schemaFields.length === 0 ? (
                <p className="text-[13px] text-slate-600 p-8 text-center">No schema data available yet</p>
              ) : (
                <div>
                  <div className="grid grid-cols-[1fr_90px_65px_65px_180px_180px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Path","Type","Required","Nullable","Enum Values","Example"].map(h => <span key={h} className="section-label">{h}</span>)}
                  </div>
                  {schemaFields.map((f, i) => {
                    const tc = TYPE_COLOR[f.type] ?? "text-slate-400";
                    const bg = TYPE_BG[f.type] ?? "bg-white/4 border-white/8";
                    const depthPadding = (f.path.split(".").length - 1) * 12;
                    return (
                      <motion.div key={f.path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                        className="grid grid-cols-[1fr_90px_65px_65px_180px_180px] gap-3 px-5 py-2.5 transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div className="flex items-center self-center" style={{ paddingLeft: `${depthPadding}px` }}>
                          {depthPadding > 0 && <span className="text-slate-700 mr-1.5 text-[10px]">└</span>}
                          <code className={`mono text-[11px] ${f.path.includes("[*]") ? "text-blue-300/70" : "text-indigo-300/80"}`}>{f.path.split(".").at(-1)}</code>
                        </div>
                        <div className="self-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${bg} ${tc}`}>{f.type}</span>
                        </div>
                        <span className={`text-[11px] self-center font-medium ${f.required ? "text-emerald-400" : "text-slate-600"}`}>
                          {f.required ? "yes" : "no"}
                        </span>
                        <span className={`text-[11px] self-center font-medium ${f.nullable ? "text-amber-400" : "text-slate-600"}`}>
                          {f.nullable ? "yes" : "no"}
                        </span>
                        <span className="text-[10px] text-slate-600 self-center truncate">
                          {f.enum_values?.length ? (
                            <span className="flex gap-1 flex-wrap">
                              {f.enum_values.slice(0,3).map(v => (
                                <span key={String(v)} className="bg-violet-500/10 text-violet-400 border border-violet-500/15 px-1.5 py-0.5 rounded">
                                  {String(v)}
                                </span>
                              ))}
                              {f.enum_values.length > 3 && <span className="text-slate-600">+{f.enum_values.length-3}</span>}
                            </span>
                          ) : "—"}
                        </span>
                        <span className="text-[11px] text-slate-600 self-center truncate">
                          {f.example_value !== undefined && f.example_value !== null ? (
                            <code className="mono text-[10px] text-slate-500">
                              {String(f.example_value).slice(0, 28)}
                            </code>
                          ) : "—"}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "changelog" && (
            <div className="glass rounded-2xl p-6">
              <ChangelogPanel endpointId={epId} latestSnapshot={latestSnapshot} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
