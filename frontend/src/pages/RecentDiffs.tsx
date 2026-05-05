import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { MagicCard } from "../components/MagicCard";
import { BorderBeam } from "../components/BorderBeam";
import { NumberTicker } from "../components/NumberTicker";
import type { Severity } from "../types";

function timeAgo(dt: string) {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Filter = Severity | "all";
const FILTERS: Filter[] = ["all", "breaking", "risky", "safe"];

const FILTER_ACTIVE: Record<string, { bg: string; text: string; border: string }> = {
  all:      { bg: "rgba(255,255,255,0.07)", text: "#f0f0f0",  border: "rgba(255,255,255,0.15)" },
  breaking: { bg: "rgba(239,68,68,0.1)",   text: "#fca5a5",  border: "rgba(239,68,68,0.25)" },
  risky:    { bg: "rgba(249,115,22,0.1)",  text: "#fdba74",  border: "rgba(249,115,22,0.25)" },
  safe:     { bg: "rgba(16,185,129,0.1)",  text: "#6ee7b7",  border: "rgba(16,185,129,0.25)" },
};

const CHANGE_COLORS: Record<string, string> = {
  removed_field: "#fc8181", added_field: "#6ee7b7", type_changed: "#fcd34d",
  int_to_number: "#fbbf24", number_to_int: "#fbbf24", nullable_added: "#7dd3fc",
  nullable_removed: "#67e8f9", enum_expanded: "#c4b5fd", enum_narrowed: "#a5b4fc",
  enum_changed: "#c4b5fd", array_item_type_changed: "#fca5a5", nested_object_removed: "#fc8181",
};

const STAT_CARDS = [
  ["Breaking", "breaking", "#fc8181", "rgba(239,68,68,0.06)"],
  ["Risky",    "risky",    "#fdba74", "rgba(249,115,22,0.06)"],
  ["Safe",     "safe",     "#6ee7b7", "rgba(16,185,129,0.06)"],
] as [string, string, string, string][];

export function RecentDiffs() {
  const [severity, setSeverity] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: diffs = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.recentDiffs, severity],
    queryFn: () => api.diffs.recent(200, severity !== "all" ? severity : undefined),
    staleTime: 30_000,
  });
  const { data: endpoints = [] } = useQuery({ queryKey: QUERY_KEYS.endpoints, queryFn: api.endpoints.list, staleTime: 60_000 });
  const epMap = Object.fromEntries(endpoints.map(e => [e.id, e]));

  const counts = diffs.reduce<Record<string, number>>((a, d) => {
    a[d.severity] = (a[d.severity] ?? 0) + 1;
    return a;
  }, {});

  const filtered = diffs.filter(d =>
    !search ||
    d.path.toLowerCase().includes(search.toLowerCase()) ||
    d.change_type.toLowerCase().includes(search.toLowerCase()) ||
    (epMap[d.endpoint_id]?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      className="space-y-6"
      style={{ maxWidth: 1400 }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0f0f0", lineHeight: 1 }}>Diff History</h1>
        <p style={{ fontSize: 13, color: "#2a2a3a", marginTop: 6 }}>{filtered.length} diffs · {endpoints.length} endpoints</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {STAT_CARDS.map(([label, key, color, glow]) => (
          <motion.div key={key} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <MagicCard className="sp-card overflow-hidden cursor-pointer" gradientColor={glow} gradientSize={200}>
              <button
                onClick={() => setSeverity(severity === key ? "all" : key as Severity)}
                className="w-full text-left"
                style={{ padding: "18px 20px", background: "none", border: "none", cursor: "pointer" }}
              >
                <p className="sp-label mb-2">{label}</p>
                <p className="mono" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: (counts[key] ?? 0) > 0 ? color : "#1e1e2a" }}>
                  <NumberTicker value={counts[key] ?? 0} />
                </p>
                <p style={{ fontSize: 11, color: "#2a2a3a", marginTop: 6 }}>
                  {(counts[key] ?? 0) > 0 ? "diffs detected" : "no events"}
                </p>
              </button>
              {severity === key && <BorderBeam size={80} duration={5} colorFrom={color} colorTo="transparent" borderWidth={1} />}
            </MagicCard>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {FILTERS.map(f => {
            const isActive = severity === f;
            const cfg = FILTER_ACTIVE[f];
            return (
              <motion.button key={f} whileTap={{ scale: 0.95 }}
                onClick={() => setSeverity(f)}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  textTransform: "capitalize", cursor: "pointer",
                  border: `1px solid ${isActive ? cfg.border : "rgba(255,255,255,0.07)"}`,
                  background: isActive ? cfg.bg : "rgba(255,255,255,0.02)",
                  color: isActive ? cfg.text : "#2a2a3a",
                  transition: "all 0.15s ease",
                }}
              >
                {f}
                {f !== "all" && (counts[f] ?? 0) > 0 && (
                  <span style={{ marginLeft: 5, opacity: 0.7, fontFamily: "JetBrains Mono,monospace", fontSize: 10 }}>{counts[f]}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="relative flex-1 max-w-xs">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#2a2a3a", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Filter by path, change, endpoint…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6, borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#d0d0e0", outline: "none" }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          />
        </div>

        {search && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSearch("")}
            style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, color: "#383850", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
            Clear ✕
          </motion.button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 11, color: "#1e1e2a" }}>{filtered.length} results</span>
      </div>

      {/* Table */}
      <MagicCard className="sp-card overflow-hidden" gradientColor="rgba(99,102,241,0.04)">
        {isLoading ? (
          <div style={{ padding: 16 }} className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#383850" }}>No diffs found</p>
            <p style={{ fontSize: 12, color: "#2a2a3a" }}>Try a different filter or trigger a monitor run</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[80px_130px_1fr_140px_65px_65px_80px_14px] gap-3 px-5 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {["Severity", "Change", "Path", "Endpoint", "Old", "New", "When", ""].map(h => <span key={h} className="sp-label">{h}</span>)}
            </div>

            <AnimatePresence initial={false}>
              {filtered.map((d, i) => {
                const ep = epMap[d.endpoint_id];
                const isOpen = expanded === d.id;
                return (
                  <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.2) }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
                    <div
                      className="grid grid-cols-[80px_130px_1fr_140px_65px_65px_80px_14px] gap-3 px-5 py-2.5 tr-hover cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : d.id)}
                    >
                      <div className="self-center">
                        <span className={`sp-badge sp-badge-${d.severity}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.severity === "breaking" ? "bg-red-400" : d.severity === "risky" ? "bg-orange-400" : "bg-emerald-400"}`} />
                          {d.severity}
                        </span>
                      </div>
                      <span className="mono self-center" style={{ fontSize: 10, color: CHANGE_COLORS[d.change_type] ?? "#505068" }}>{d.change_type}</span>
                      <code className="mono self-center truncate" style={{ fontSize: 10, color: "#6366f1" }}>{d.path}</code>
                      {ep ? (
                        <Link to={`/endpoints/${ep.id}`} onClick={e => e.stopPropagation()}
                          className="self-center truncate" style={{ fontSize: 11, color: "#383850" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#383850")}>
                          {ep.name}
                        </Link>
                      ) : <span className="self-center" style={{ fontSize: 11, color: "#1e1e2a" }}>—</span>}
                      <span className="mono self-center" style={{ fontSize: 9, color: "#2a2a3a" }}>{d.old_type ?? "—"}</span>
                      <span className="mono self-center" style={{ fontSize: 9, color: "#2a2a3a" }}>{d.new_type ?? "—"}</span>
                      <span style={{ fontSize: 10, color: "#1e1e2a", alignSelf: "center", whiteSpace: "nowrap" }}>{timeAgo(d.created_at)}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="self-center">
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "#1e1e2a" }}><path strokeLinecap="round" d="M19 9l-7 7-7-7" /></svg>
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                          <div style={{ padding: "0 20px 12px" }}>
                            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#505068" }}>
                              <span style={{ color: "#2a2a3a", marginRight: 8 }}>↳</span>{d.message}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </MagicCard>
    </motion.div>
  );
}
