import { motion } from "framer-motion";
import type { Snapshot } from "../types";

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
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
    return <p className="text-sm text-slate-600">No snapshots yet.</p>;

  return (
    <div className="space-y-0">
      {snapshots.map((s, i) => {
        const hasDrift = diffSnapshotIds.has(s.id);
        const failed = !!s.fetch_error;
        const isLatest = i === 0;

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="relative flex gap-4 pb-4"
          >
            {/* Line */}
            {i < snapshots.length - 1 && (
              <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-800" />
            )}

            {/* Dot */}
            <div className="flex-shrink-0 mt-0.5">
              <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 z-10 relative ${
                failed ? "bg-slate-600" : hasDrift ? "bg-red-500" : "bg-emerald-500"
              } ${isLatest && !failed ? "ring-2 ring-offset-2 ring-offset-slate-900 " + (hasDrift ? "ring-red-500/40" : "ring-emerald-500/40") : ""}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">{timeAgo(s.created_at)}</span>
                {isLatest && (
                  <span className="text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-medium">
                    latest
                  </span>
                )}
                {hasDrift && (
                  <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    ⚡ drift
                  </span>
                )}
              </div>

              {failed ? (
                <p className="text-xs text-red-400/70 mt-1 truncate">{s.fetch_error}</p>
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <code className="mono text-xs text-indigo-400/80">{s.schema_hash.slice(0, 12)}</code>
                  <span className="text-xs text-slate-600">HTTP {s.status_code}</span>
                  <span className="text-xs text-slate-600">{s.response_time_ms}ms</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
