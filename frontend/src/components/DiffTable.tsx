import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Diff } from "../types";
import { SeverityBadge } from "./SeverityBadge";

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CHANGE_COLOR: Record<string, string> = {
  removed_field: "text-red-400",
  added_field: "text-emerald-400",
  type_changed: "text-amber-400",
  int_to_number: "text-amber-400",
  number_to_int: "text-amber-400",
  nullable_added: "text-sky-400",
  nullable_removed: "text-sky-400",
  enum_expanded: "text-violet-400",
  enum_narrowed: "text-violet-400",
  array_item_type_changed: "text-rose-400",
  nested_object_removed: "text-red-400",
};

export function DiffTable({ diffs }: { diffs: Diff[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!diffs.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-16"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.8} strokeLinecap="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-slate-300">Schema is stable</p>
          <p className="text-[12px] text-slate-600 mt-0.5">No drift detected across all snapshots</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-[90px_140px_1fr_70px_70px_80px_20px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {["Severity","Change Type","Field Path","Old","New","When",""].map(h => <span key={h} className="section-label">{h}</span>)}
      </div>

      <AnimatePresence initial={false}>
        {diffs.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025, duration: 0.25 }}
            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
          >
            <div
              className="grid grid-cols-[90px_140px_1fr_70px_70px_80px_20px] gap-3 px-5 py-3 cursor-pointer group"
              style={{ transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => setExpanded(expanded === d.id ? null : d.id)}
            >
              <div className="self-center"><SeverityBadge severity={d.severity} /></div>
              <span className={`text-[12px] font-medium self-center ${CHANGE_COLOR[d.change_type] ?? "text-slate-400"}`}>
                {d.change_type}
              </span>
              <code className="mono text-[12px] text-indigo-300/90 self-center truncate">
                {d.path}
              </code>
              <span className="text-[11px] text-slate-500 self-center mono">{d.old_type ?? "—"}</span>
              <span className="text-[11px] text-slate-500 self-center mono">{d.new_type ?? "—"}</span>
              <span className="text-[11px] text-slate-600 self-center whitespace-nowrap">{timeAgo(d.created_at)}</span>
              <div className={`self-center transition-transform duration-200 ${expanded === d.id ? "rotate-180" : ""}`}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-700 group-hover:text-slate-500">
                  <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            <AnimatePresence>
              {expanded === d.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1">
                    <div className="rounded-xl px-4 py-3 text-[12px] text-slate-400 border"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                      <span className="text-slate-600 mr-2">↳ Message</span>
                      {d.message}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
