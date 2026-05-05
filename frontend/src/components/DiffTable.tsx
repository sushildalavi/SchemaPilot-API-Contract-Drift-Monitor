import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Diff } from "../types";

const CHANGE_COLOR: Record<string, string> = {
  removed_field: "#fca5a5", added_field: "#86efac", type_changed: "#fcd34d",
  int_to_number: "#fcd34d", number_to_int: "#fcd34d", nullable_added: "#93c5fd",
  nullable_removed: "#67e8f9", enum_expanded: "#c4b5fd", enum_narrowed: "#a5b4fc",
  enum_changed: "#c4b5fd", array_item_type_changed: "#fca5a5", nested_object_removed: "#fca5a5",
};

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export function DiffTable({ diffs }: { diffs: Diff[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!diffs.length) return (
    <div className="flex flex-col items-center gap-3 py-14">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <p className="heading-sm">Schema stable</p>
      <p className="body">No drift detected for this endpoint</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-[85px_140px_1fr_65px_65px_60px_16px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["Severity", "Change", "Path", "Old", "New", "When", ""].map(h => <span key={h} className="eyebrow">{h}</span>)}
      </div>
      <AnimatePresence initial={false}>
        {diffs.map((d, i) => {
          const isOpen = open === d.id;
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <div
                className="row grid grid-cols-[85px_140px_1fr_65px_65px_60px_16px] gap-3 px-5 py-3 cursor-pointer"
                onClick={() => setOpen(isOpen ? null : d.id)}
              >
                <div className="self-center">
                  <span className={`badge badge-${d.severity}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${d.severity === "breaking" ? "dot-red" : d.severity === "risky" ? "dot-yellow" : "dot-green"}`} />
                    {d.severity}
                  </span>
                </div>
                <span className="mono self-center" style={{ fontSize: 11, color: CHANGE_COLOR[d.change_type] ?? "var(--text-2)" }}>{d.change_type}</span>
                <code className="mono self-center truncate" style={{ fontSize: 11, color: "var(--indigo-light)" }}>{d.path}</code>
                <span className="mono self-center caption">{d.old_type ?? "—"}</span>
                <span className="mono self-center caption">{d.new_type ?? "—"}</span>
                <span className="self-center caption">{timeAgo(d.created_at)}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="self-center">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--text-3)" }}>
                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                    <div className="px-5 pb-3">
                      <div className="rounded-lg px-4 py-3 body" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12 }}>
                        <span style={{ color: "var(--text-3)", marginRight: 8 }}>↳</span>{d.message}
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
  );
}
