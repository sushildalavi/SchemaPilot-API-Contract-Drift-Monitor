import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Diff } from "../types";
import { SeverityBadge } from "./SeverityBadge";

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function DiffTable({ diffs }: { diffs: Diff[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!diffs.length) {
    return (
      <div className="flex flex-col items-center py-12 text-slate-600">
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-slate-500">No diffs recorded</p>
        <p className="text-xs text-slate-600 mt-1">Schema is stable across all snapshots</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/60">
      <div className="grid grid-cols-[100px_120px_1fr_80px_80px_90px] gap-3 px-4 py-2.5">
        {["Severity","Change","Path","Old","New","When"].map(h => (
          <span key={h} className="label">{h}</span>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {diffs.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <div
              className="grid grid-cols-[100px_120px_1fr_80px_80px_90px] gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
              onClick={() => setExpanded(expanded === d.id ? null : d.id)}
            >
              <div><SeverityBadge severity={d.severity} /></div>
              <span className="text-xs text-slate-400 font-medium self-center">{d.change_type}</span>
              <code className="mono text-xs text-indigo-300 self-center truncate">{d.path}</code>
              <span className="text-xs text-slate-500 self-center">{d.old_type ?? "—"}</span>
              <span className="text-xs text-slate-500 self-center">{d.new_type ?? "—"}</span>
              <span className="text-xs text-slate-600 self-center">{timeAgo(d.created_at)}</span>
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
                  <div className="px-4 pb-3 pt-1">
                    <div className="bg-slate-800/50 rounded-lg px-4 py-3 text-sm text-slate-400 border border-slate-700/50">
                      <span className="text-slate-500 text-xs font-medium">Message · </span>
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
