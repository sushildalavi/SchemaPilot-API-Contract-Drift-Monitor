import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { MagicCard } from "../components/MagicCard";
import { BorderBeam } from "../components/BorderBeam";
import { NumberTicker } from "../components/NumberTicker";
import { Sparkline } from "../components/Sparkline";
import { DiffTable } from "../components/DiffTable";
import { SchemaTimeline } from "../components/SchemaTimeline";
import { ChangelogPanel } from "../components/ChangelogPanel";

type Tab = "diffs" | "timeline" | "schema" | "changelog";

function timeAgo(dt: string | null) {
  if (!dt) return "–";
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "diffs", label: "Diffs" },
  { id: "timeline", label: "Timeline" },
  { id: "schema", label: "Schema Fields" },
  { id: "changelog", label: "Changelog" },
];

export function EndpointDetail() {
  const { id } = useParams<{ id: string }>();
  const epId = id!;
  const [tab, setTab] = useState<Tab>("diffs");

  const { data: endpoint, isLoading } = useQuery({ queryKey: QUERY_KEYS.endpoint(epId), queryFn: () => api.endpoints.get(epId), staleTime: 30_000 });
  const { data: snapshots = [] } = useQuery({ queryKey: QUERY_KEYS.snapshots(epId), queryFn: () => api.endpoints.snapshots(epId), staleTime: 30_000 });
  const { data: diffs = [] } = useQuery({ queryKey: QUERY_KEYS.diffs(epId), queryFn: () => api.endpoints.diffs(epId), staleTime: 30_000 });

  const diffSnapshotIds = new Set(diffs.map(d => d.new_snapshot_id));
  const latestSnapshot  = snapshots[0] ?? null;
  const breaking = diffs.filter(d => d.severity === "breaking").length;
  const risky    = diffs.filter(d => d.severity === "risky").length;
  const safe     = diffs.filter(d => d.severity === "safe").length;
  const rts      = snapshots.filter(s => !s.fetch_error).map(s => s.response_time_ms).reverse();
  const avgMs    = rts.length ? Math.round(rts.reduce((a,b) => a+b, 0) / rts.length) : 0;

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
    <div className="space-y-4">
      <div className="skeleton h-6 w-40 rounded-lg" />
      <div className="skeleton h-44 rounded-2xl" />
    </div>
  );
  if (!endpoint) return <p style={{ fontSize: 13, color: "#fc8181" }}>Endpoint not found.</p>;

  return (
    <motion.div
      className="space-y-5"
      style={{ maxWidth: 1400 }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mono" style={{ fontSize: 11, color: "#2a2a3a" }}>
        <Link to="/" onMouseEnter={e=>(e.currentTarget.style.color="#818cf8")} onMouseLeave={e=>(e.currentTarget.style.color="#2a2a3a")}>overview</Link>
        <span>/</span>
        <span style={{ color: "#404058" }}>{endpoint.name}</span>
      </div>

      {/* Hero */}
      <div className="sp-card relative overflow-hidden">
        <div style={{ height: 2, background: "linear-gradient(to right, #6366f1, #8b5cf6, #a855f7, transparent)" }} />
        <BorderBeam size={300} duration={12} colorFrom="#6366f1" colorTo="#a855f7" borderWidth={1} />

        <div style={{ padding: "20px 24px 18px" }}>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1.5">
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0f0f0", lineHeight: 1 }}>
                  {endpoint.name}
                </h1>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#505068", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {endpoint.provider}
                </span>
                <code style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#818cf8", fontFamily: "JetBrains Mono,monospace", textTransform: "uppercase" }}>
                  {endpoint.method}
                </code>
              </div>
              <a href={endpoint.url} target="_blank" rel="noreferrer" className="mono block truncate"
                style={{ fontSize: 11, color: "#404058", maxWidth: 500, marginBottom: 10 }}
                onMouseEnter={e=>(e.currentTarget.style.color="#818cf8")} onMouseLeave={e=>(e.currentTarget.style.color="#404058")}>
                {endpoint.url}
              </a>
              {endpoint.latest_snapshot_hash && (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 11, color: "#2a2a3a" }}>Hash</span>
                  <code className="mono" style={{ fontSize: 10, color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "2px 7px", borderRadius: 4 }}>
                    {endpoint.latest_snapshot_hash.slice(0, 20)}
                  </code>
                  <span style={{ fontSize: 11, color: "#2a2a3a" }}>·</span>
                  <span style={{ fontSize: 11, color: "#2a2a3a" }}>{timeAgo(endpoint.latest_checked_at)}</span>
                </div>
              )}
            </div>
            {rts.length > 2 && (
              <div className="text-right flex-shrink-0">
                <p className="sp-label mb-1">Response Time</p>
                <Sparkline data={rts} width={120} height={36} color={avgMs > 1000 ? "#f97316" : "#10b981"} />
                <p className="mono" style={{ fontSize: 10, color: "#2a2a3a", marginTop: 3 }}>{avgMs}ms avg</p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { label: "Snapshots", val: snapshots.length, color: "#818cf8" },
              { label: "Breaking",  val: breaking, color: breaking > 0 ? "#fc8181" : "#2a2a3a" },
              { label: "Risky",     val: risky,    color: risky > 0 ? "#fdba74" : "#2a2a3a" },
              { label: "Safe",      val: safe,     color: safe > 0 ? "#6ee7b7" : "#2a2a3a" },
              { label: "Fields",    val: schemaFields.length, color: "#c4b5fd" },
              { label: "Avg ms",    val: avgMs,    color: avgMs > 1000 ? "#fdba74" : "#93c5fd" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="sp-label mb-1">{label}</p>
                <p className="mono" style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
                  <NumberTicker value={val} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="relative flex items-center gap-2 px-4 py-2.5 transition-colors duration-150"
            style={{ fontSize: 13, fontWeight: 500, color: tab === t.id ? "#f0f0f0" : "#383850", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = "#909090"; }}
            onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = "#383850"; }}
          >
            {t.label}
            {tabCount[t.id] !== undefined && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 600, background: tab === t.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", color: tab === t.id ? "#818cf8" : "#2a2a3a" }}>
                {tabCount[t.id]}
              </span>
            )}
            {tab === t.id && (
              <motion.div layoutId="ep-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: "linear-gradient(to right, #6366f1, #8b5cf6)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === "diffs" && (
            <MagicCard className="sp-card overflow-hidden" gradientColor="rgba(99,102,241,0.05)">
              <DiffTable diffs={diffs} />
            </MagicCard>
          )}

          {tab === "timeline" && (
            <MagicCard className="sp-card" gradientColor="rgba(99,102,241,0.05)">
              <div style={{ padding: 20 }}>
                <SchemaTimeline snapshots={snapshots} diffSnapshotIds={diffSnapshotIds} />
              </div>
            </MagicCard>
          )}

          {tab === "schema" && (
            <MagicCard className="sp-card overflow-hidden" gradientColor="rgba(99,102,241,0.04)">
              {schemaFields.length === 0 ? (
                <p style={{ padding: 28, textAlign: "center", fontSize: 13, color: "#2a2a3a" }}>No schema yet</p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_80px_65px_65px_160px_160px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Field Path","Type","Req","Nullable","Enum Values","Example"].map(h => <span key={h} className="sp-label">{h}</span>)}
                  </div>
                  {schemaFields.map((f, i) => {
                    const depth = (f.path.split(".").length - 1) * 14;
                    const tc = { string:"type-string", integer:"type-integer", number:"type-number", boolean:"type-boolean", array:"type-array", object:"type-object", null:"type-null", mixed:"type-mixed" }[f.type] ?? "type-null";
                    return (
                      <motion.div key={f.path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                        className="grid grid-cols-[1fr_80px_65px_65px_160px_160px] gap-3 px-5 py-2.5 tr-hover"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
                        <div className="flex items-center self-center" style={{ paddingLeft: depth }}>
                          {depth > 0 && <span style={{ color: "#2a2a3a", marginRight: 4, fontSize: 10 }}>└</span>}
                          <code className="mono" style={{ fontSize: 10, color: f.path.includes("[*]") ? "#93c5fd" : "#6366f1" }}>
                            {f.path.split(".").at(-1)}
                          </code>
                        </div>
                        <div className="self-center"><span className={`type-pill ${tc}`}>{f.type}</span></div>
                        <span className="self-center mono" style={{ fontSize: 10, color: f.required ? "#6ee7b7" : "#2a2a3a" }}>{f.required ? "yes" : "no"}</span>
                        <span className="self-center mono" style={{ fontSize: 10, color: f.nullable ? "#fcd34d" : "#2a2a3a" }}>{f.nullable ? "yes" : "no"}</span>
                        <div className="self-center flex gap-1 flex-wrap">
                          {f.enum_values?.length ? f.enum_values.slice(0,3).map(v => (
                            <span key={String(v)} className="mono" style={{ fontSize: 9, color: "#c4b5fd", background: "rgba(196,181,253,0.08)", border: "1px solid rgba(196,181,253,0.15)", padding: "1px 5px", borderRadius: 3 }}>{String(v)}</span>
                          )) : <span style={{ fontSize: 10, color: "#1e1e2a" }}>—</span>}
                          {(f.enum_values?.length ?? 0) > 3 && <span style={{ fontSize: 9, color: "#2a2a3a" }}>+{(f.enum_values?.length ?? 0) - 3}</span>}
                        </div>
                        <code className="self-center mono truncate" style={{ fontSize: 9, color: "#2a2a3a" }}>
                          {f.example_value !== null && f.example_value !== undefined ? String(f.example_value).slice(0, 24) : "—"}
                        </code>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </MagicCard>
          )}

          {tab === "changelog" && (
            <MagicCard className="sp-card" gradientColor="rgba(99,102,241,0.05)">
              <div style={{ padding: 20 }}>
                <ChangelogPanel endpointId={epId} latestSnapshot={latestSnapshot} />
              </div>
            </MagicCard>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
