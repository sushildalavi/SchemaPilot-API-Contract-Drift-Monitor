import type { Snapshot } from "../types";

interface Props {
  snapshots: Snapshot[];
  diffSnapshotIds: Set<string>;
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SchemaTimeline({ snapshots, diffSnapshotIds }: Props) {
  if (!snapshots.length) {
    return <p className="text-sm text-gray-500">No snapshots yet.</p>;
  }

  return (
    <ol className="relative border-l border-gray-200">
      {snapshots.map((s) => {
        const hasDrift = diffSnapshotIds.has(s.id);
        const failed = !!s.fetch_error;
        return (
          <li key={s.id} className="mb-4 ml-4">
            <div
              className={`absolute w-3 h-3 rounded-full -left-1.5 border border-white ${
                failed ? "bg-gray-400" : hasDrift ? "bg-red-400" : "bg-green-400"
              }`}
            />
            <div className="flex items-start gap-3">
              <div>
                <p className="text-xs text-gray-400">{fmt(s.created_at)}</p>
                {failed ? (
                  <p className="text-sm text-red-500 mt-0.5">Fetch failed: {s.fetch_error}</p>
                ) : (
                  <>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {s.schema_hash.slice(0, 12)}
                    </code>
                    {hasDrift && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">⚡ drift</span>
                    )}
                    <span className="ml-2 text-xs text-gray-400">
                      HTTP {s.status_code} · {s.response_time_ms}ms
                    </span>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
