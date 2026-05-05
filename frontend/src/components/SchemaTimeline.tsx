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

export function SchemaTimeline({ snapshots, diffSnapshotIds }: { snapshots: Snapshot[]; diffSnapshotIds: Set<string> }) {
  if (!snapshots.length) return <p className="body text-center py-8">No snapshots yet.</p>;

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-4 bottom-4 w-px" style={{ background: "var(--border-2)" }} />
      <div className="space-y-0">
        {snapshots.map((s, i) => {
          const hasDrift  = diffSnapshotIds.has(s.id);
          const failed    = !!s.fetch_error;
          const isLatest  = i === 0;
          const dotColor  = failed ? "var(--text-3)" : hasDrift ? "#ef4444" : "#22c55e";

          return (
            <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="relative flex gap-5 pb-4">
              <div className="flex-shrink-0 mt-1 relative z-10">
                {hasDrift && !failed && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: "#ef4444", borderRadius: "50%" }} />
                )}
                <span className="w-3.5 h-3.5 rounded-full block relative" style={{ background: dotColor, border: "2px solid var(--bg)" }} />
              </div>

              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="caption" style={{ color: "var(--text-2)" }}>{fmt(s.created_at)}</span>
                  <span className="caption">·</span>
                  <span className="caption">{timeAgo(s.created_at)}</span>
                  {isLatest && <span className="badge" style={{ background: "rgba(99,102,241,0.1)", color: "var(--indigo-light)", borderColor: "rgba(99,102,241,0.2)", fontSize: 10 }}>latest</span>}
                  {hasDrift && <span className="badge badge-breaking" style={{ fontSize: 10 }}>⚡ drift</span>}
                </div>

                {failed ? (
                  <p className="body" style={{ fontSize: 12, color: "#fca5a5" }}>{s.fetch_error}</p>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="mono caption" style={{ color: "var(--indigo-light)" }}>{s.schema_hash.slice(0, 16)}</code>
                    <span className="caption" style={{ background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>HTTP {s.status_code}</span>
                    <span className="caption">{s.response_time_ms}ms</span>
                    <span className="caption">{s.response_size_bytes > 1024 ? `${(s.response_size_bytes / 1024).toFixed(1)}KB` : `${s.response_size_bytes}B`}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
