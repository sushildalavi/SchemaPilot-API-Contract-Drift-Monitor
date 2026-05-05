import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Diff } from "../types";

const CHANGE_COLORS: Record<string,string> = {
  removed_field:"#fc8181", added_field:"#6ee7b7", type_changed:"#fcd34d",
  int_to_number:"#fbbf24", number_to_int:"#fbbf24", nullable_added:"#7dd3fc",
  nullable_removed:"#67e8f9", enum_expanded:"#c4b5fd", enum_narrowed:"#a5b4fc",
  enum_changed:"#c4b5fd", array_item_type_changed:"#fca5a5", nested_object_removed:"#fc8181",
};

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function DiffTable({ diffs }: { diffs: Diff[] }) {
  const [expanded, setExpanded] = useState<string|null>(null);

  if (!diffs.length) return (
    <div className="flex flex-col items-center py-14 gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#383850" }}>Schema stable</p>
      <p style={{ fontSize: 11, color: "#2a2a3a" }}>No drift detected for this endpoint</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-[85px_130px_1fr_65px_65px_75px_14px] gap-3 px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {["Severity","Change","Path","Old","New","When",""].map(h => <span key={h} className="sp-label">{h}</span>)}
      </div>
      <AnimatePresence initial={false}>
        {diffs.map((d, i) => {
          const isOpen = expanded === d.id;
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
              <div
                className="grid grid-cols-[85px_130px_1fr_65px_65px_75px_14px] gap-3 px-5 py-2.5 tr-hover cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : d.id)}
              >
                <div className="self-center">
                  <span className={`sp-badge sp-badge-${d.severity}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.severity==="breaking"?"bg-red-400":d.severity==="risky"?"bg-orange-400":"bg-emerald-400"}`} />
                    {d.severity}
                  </span>
                </div>
                <span className="mono self-center" style={{ fontSize: 10, color: CHANGE_COLORS[d.change_type] ?? "#505068" }}>{d.change_type}</span>
                <code className="mono self-center truncate" style={{ fontSize: 10, color: "#6366f1" }}>{d.path}</code>
                <span className="mono self-center" style={{ fontSize: 9, color: "#2a2a3a" }}>{d.old_type ?? "—"}</span>
                <span className="mono self-center" style={{ fontSize: 9, color: "#2a2a3a" }}>{d.new_type ?? "—"}</span>
                <span style={{ fontSize: 10, color: "#1e1e2a", alignSelf: "center", whiteSpace: "nowrap" }}>{timeAgo(d.created_at)}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="self-center">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "#1e1e2a" }}><path strokeLinecap="round" d="M19 9l-7 7-7-7"/></svg>
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
    </div>
  );
}
