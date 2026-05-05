import { motion } from "framer-motion";
import type { Snapshot } from "../types";

function fmt(dt: string) {
  return new Date(dt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(dt: string) {
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  snapshots: Snapshot[];
  diffSnapshotIds: Set<string>;
}

export function SchemaTimeline({ snapshots, diffSnapshotIds }: Props) {
  if (!snapshots.length)
    return <p className="text-[13px] text-slate-600 py-8 text-center">No snapshots yet.</p>;

  return (
    <div className="space-y-0 relative">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-3 bottom-3 w-px" style={{ background: "rgba(255,255,255,0.05)" }} />

      {snapshots.map((s, i) => {
        const hasDrift = diffSnapshotIds.has(s.id);
        const failed = !!s.fetch_error;
        const isLatest = i === 0;
        const dotColor = failed ? "#475569" : hasDrift ? "#ef4444" : "#10b981";

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, type: "spring", stiffness: 200 }}
            className="relative flex gap-5 pb-5"
          >
            {/* Dot */}
            <div className="relative z-10 flex-shrink-0 mt-0.5">
              {hasDrift && !failed ? (
                <div className="relative w-3.5 h-3.5">
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${dotColor}30` }} />
                  <div className="w-3.5 h-3.5 rounded-full border-2 relative" style={{ background: dotColor, borderColor: "#080811" }} />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2" style={{ background: dotColor, borderColor: "#080811" }} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 rounded-xl p-3 transition-all duration-200 hover:bg-white/2 ${
              isLatest ? "border border-white/6" : "border border-transparent"
            }`} style={isLatest ? { background: "rgba(255,255,255,0.02)" } : {}}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500">{fmt(s.created_at)}</span>
                <span className="text-slate-700 text-[10px]">·</span>
                <span className="text-[11px] text-slate-600">{timeAgo(s.created_at)}</span>
                {isLatest && (
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide">
                    current
                  </span>
                )}
                {hasDrift && (
                  <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md font-semibold">
                    ⚡ drift
                  </span>
                )}
              </div>

              {failed ? (
                <p className="text-[11px] text-red-400/60 mt-1.5 truncate">{s.fetch_error}</p>
              ) : (
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <code className="mono text-[11px] text-indigo-400/70">{s.schema_hash.slice(0, 16)}</code>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#64748b" }}>
                    HTTP {s.status_code}
                  </span>
                  <span className="text-[11px] text-slate-600">{s.response_time_ms}ms</span>
                  <span className="text-[11px] text-slate-700">
                    {s.response_size_bytes > 1024 ? `${(s.response_size_bytes / 1024).toFixed(1)}KB` : `${s.response_size_bytes}B`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
