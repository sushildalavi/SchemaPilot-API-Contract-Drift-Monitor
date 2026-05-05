import { motion } from "framer-motion";
import type { Diff, Endpoint } from "../types";

interface Props {
  diffs: Diff[];
  endpoints: Endpoint[];
}

const ICONS: Record<string, { icon: string; color: string }> = {
  removed_field:          { icon: "−", color: "#f87171" },
  added_field:            { icon: "+", color: "#34d399" },
  type_changed:           { icon: "⇄", color: "#fbbf24" },
  int_to_number:          { icon: "≈", color: "#fbbf24" },
  number_to_int:          { icon: "≈", color: "#fbbf24" },
  nullable_added:         { icon: "?", color: "#38bdf8" },
  nullable_removed:       { icon: "!", color: "#38bdf8" },
  enum_expanded:          { icon: "⊕", color: "#a78bfa" },
  enum_narrowed:          { icon: "⊖", color: "#a78bfa" },
  enum_changed:           { icon: "⊙", color: "#a78bfa" },
  array_item_type_changed:{ icon: "[]", color: "#f87171" },
  nested_object_removed:  { icon: "−", color: "#f87171" },
};

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export function ActivityFeed({ diffs, endpoints }: Props) {
  const epMap = Object.fromEntries(endpoints.map(e => [e.id, e]));

  if (!diffs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center text-lg">✓</div>
        <p className="text-[12px] font-medium text-slate-500">All clear</p>
        <p className="text-[11px] text-slate-700">No schema drift detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
      {diffs.slice(0, 12).map((d, i) => {
        const ep = epMap[d.endpoint_id];
        const cfg = ICONS[d.change_type] ?? { icon: "·", color: "#64748b" };
        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="flex items-start gap-3 py-3 px-1 group table-row"
          >
            {/* Icon */}
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
              style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
              {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px] font-semibold text-slate-300 truncate">{ep?.name ?? "Unknown"}</span>
                <span className={`badge text-[9px] ${d.severity === "breaking" ? "badge-breaking" : d.severity === "risky" ? "badge-risky" : "badge-safe"}`}>
                  {d.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 truncate">
                <code className="mono text-indigo-400/70 text-[10px]">{d.path}</code>
                <span className="mx-1">·</span>
                <span>{d.change_type}</span>
              </p>
            </div>

            <span className="text-[10px] text-slate-700 flex-shrink-0 mt-0.5">{timeAgo(d.created_at)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
