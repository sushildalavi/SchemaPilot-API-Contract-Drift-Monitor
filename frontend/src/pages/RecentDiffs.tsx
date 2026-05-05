import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { SeverityBadge } from "../components/SeverityBadge";
import type { Severity } from "../types";

function timeAgo(dt: string) {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITIES: (Severity | "all")[] = ["all", "breaking", "risky", "safe"];

const CHIP_INACTIVE: Record<string, string> = {
  all:      "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15",
  breaking: "border-red-500/15 text-red-500/60 hover:text-red-400 hover:border-red-500/30",
  risky:    "border-amber-500/15 text-amber-500/60 hover:text-amber-400 hover:border-amber-500/30",
  safe:     "border-emerald-500/15 text-emerald-500/60 hover:text-emerald-400 hover:border-emerald-500/30",
};
const CHIP_ACTIVE: Record<string, string> = {
  all:      "bg-white/8 border-white/15 text-white",
  breaking: "bg-red-500/15 border-red-500/30 text-red-400",
  risky:    "bg-amber-500/15 border-amber-500/30 text-amber-400",
  safe:     "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
};

const CHANGE_COLOR: Record<string, string> = {
  removed_field: "text-red-400",
  added_field: "text-emerald-400",
  type_changed: "text-amber-400",
  int_to_number: "text-amber-300",
  number_to_int: "text-amber-400",
  nullable_added: "text-sky-400",
  nullable_removed: "text-sky-300",
  enum_expanded: "text-violet-400",
  enum_narrowed: "text-violet-300",
  array_item_type_changed: "text-rose-400",
  nested_object_removed: "text-red-400",
};

export function RecentDiffs() {
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const epMap = Object.fromEntries(endpoints.map(e => [e.id, e]));

  const counts = diffs.reduce<Record<string, number>>((acc, d) => {
    acc[d.severity] = (acc[d.severity] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = diffs.filter(d =>
    !search || d.path.toLowerCase().includes(search.toLowerCase()) ||
    d.change_type.toLowerCase().includes(search.toLowerCase()) ||
    (epMap[d.endpoint_id]?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div className="space-y-6 max-w-7xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, type: "spring", stiffness: 200 }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="heading">Diff History</h1>
          <p className="subheading mt-1">{filtered.length} diffs · {endpoints.length} endpoints monitored</p>
        </div>
      </div>

      {/* Summary bento */}
      <div className="grid grid-cols-3 gap-4">
        {([["Breaking", "breaking","border-red-500/20 hover:border-red-500/35","text-red-400","bg-red-500/5"],
           ["Risky", "risky","border-amber-500/20 hover:border-amber-500/35","text-amber-400","bg-amber-500/5"],
           ["Safe", "safe","border-emerald-500/20 hover:border-emerald-500/35","text-emerald-400","bg-emerald-500/5"]
          ] as [string,string,string,string,string][]).map(([label, key, border, color, bg]) => (
          <motion.button key={key}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSeverity(severity === key ? "all" : key as Severity)}
            className={`text-left rounded-2xl p-5 border transition-all duration-200 ${bg} ${border} ${severity === key ? "ring-1 ring-indigo-500/30" : ""}`}>
            <p className="section-label">{label}</p>
            <p className={`text-4xl font-bold mt-2 ${color}`}>{counts[key] ?? 0}</p>
            <p className="text-[11px] text-slate-700 mt-1">diffs detected</p>
          </motion.button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {SEVERITIES.map(s => (
            <motion.button key={s} whileTap={{ scale: 0.95 }}
              onClick={() => setSeverity(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border capitalize transition-all duration-150 ${
                severity === s ? CHIP_ACTIVE[s] : CHIP_INACTIVE[s]
              }`}
              style={{ background: severity === s ? undefined : "rgba(255,255,255,0.02)" }}>
              {s}
              {s !== "all" && (counts[s] ?? 0) > 0 && (
                <span className="opacity-60 text-[10px]">{counts[s]}</span>
              )}
            </motion.button>
          ))}
        </div>

        <div className="relative">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search path, change, or endpoint…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 rounded-xl text-[12px] text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-colors w-72"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>

        {search && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSearch("")}
            className="btn-ghost text-[12px] h-8 px-2.5">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Clear
          </motion.button>
        )}

        <span className="text-[11px] text-slate-700 ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2.5">{Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-slate-300">No diffs found</p>
              <p className="text-[12px] text-slate-600 mt-0.5">Try changing filters or triggering a monitor run</p>
            </div>
          </motion.div>
        ) : (
          <div>
            {/* Col headers */}
            <div className="grid grid-cols-[85px_140px_1fr_140px_70px_70px_80px_16px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {["Severity","Change","Path","Endpoint","Old","New","When",""].map(h => <span key={h} className="section-label">{h}</span>)}
            </div>

            <AnimatePresence initial={false}>
              {filtered.map((d, i) => {
                const ep = epMap[d.endpoint_id];
                const isOpen = expanded === d.id;
                return (
                  <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div
                      className="grid grid-cols-[85px_140px_1fr_140px_70px_70px_80px_16px] gap-3 px-5 py-2.5 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : d.id)}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="self-center"><SeverityBadge severity={d.severity} /></div>
                      <span className={`text-[11px] font-medium self-center ${CHANGE_COLOR[d.change_type] ?? "text-slate-400"}`}>
                        {d.change_type}
                      </span>
                      <code className="mono text-[11px] text-indigo-300/80 self-center truncate">{d.path}</code>
                      {ep ? (
                        <Link to={`/endpoints/${ep.id}`} onClick={e => e.stopPropagation()}
                          className="text-[11px] text-slate-500 hover:text-indigo-400 self-center truncate transition-colors">
                          {ep.name}
                        </Link>
                      ) : <span className="text-[11px] text-slate-700 self-center">—</span>}
                      <span className="mono text-[10px] text-slate-500 self-center">{d.old_type ?? "—"}</span>
                      <span className="mono text-[10px] text-slate-500 self-center">{d.new_type ?? "—"}</span>
                      <span className="text-[11px] text-slate-700 self-center whitespace-nowrap">{timeAgo(d.created_at)}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="self-center">
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-slate-700">
                          <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-5 pb-3.5 pt-1">
                            <div className="rounded-xl px-4 py-3 text-[12px] text-slate-400"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <span className="text-slate-600 mr-2">↳</span>{d.message}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
