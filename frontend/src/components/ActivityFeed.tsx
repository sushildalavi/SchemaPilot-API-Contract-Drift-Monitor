import { motion } from "framer-motion";
import type { Diff, Endpoint } from "../types";

const ICONS: Record<string, { icon: string; color: string }> = {
  removed_field:           { icon: "−", color: "#fca5a5" },
  added_field:             { icon: "+", color: "#86efac" },
  type_changed:            { icon: "⇄", color: "#fcd34d" },
  int_to_number:           { icon: "≈", color: "#fcd34d" },
  number_to_int:           { icon: "≈", color: "#fcd34d" },
  nullable_added:          { icon: "?", color: "#93c5fd" },
  nullable_removed:        { icon: "!", color: "#67e8f9" },
  enum_expanded:           { icon: "⊕", color: "#c4b5fd" },
  enum_narrowed:           { icon: "⊖", color: "#a5b4fc" },
  enum_changed:            { icon: "⊙", color: "#c4b5fd" },
  array_item_type_changed: { icon: "[]", color: "#fca5a5" },
  nested_object_removed:   { icon: "−", color: "#fca5a5" },
};

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export function ActivityFeed({ diffs, endpoints }: { diffs: Diff[]; endpoints: Endpoint[] }) {
  const epMap = Object.fromEntries(endpoints.map(e => [e.id, e]));

  if (!diffs.length) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.8}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <p className="body" style={{ fontWeight: 500 }}>All clear</p>
      <p className="caption">No drift events detected</p>
    </div>
  );

  return (
    <div>
      {diffs.slice(0, 12).map((d, i) => {
        const ep  = epMap[d.endpoint_id];
        const cfg = ICONS[d.change_type] ?? { icon: "·", color: "var(--text-3)" };
        return (
          <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}
            className="row flex items-start gap-3 py-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
              style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="body" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>{ep?.name ?? "Unknown"}</span>
                <span className={`badge badge-${d.severity}`} style={{ fontSize: 9 }}>{d.severity}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <code className="mono caption" style={{ color: "var(--indigo-light)" }}>{d.path}</code>
                <span className="caption">·</span>
                <span className="mono caption">{d.change_type}</span>
              </div>
            </div>
            <span className="caption flex-shrink-0 mt-0.5">{timeAgo(d.created_at)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
