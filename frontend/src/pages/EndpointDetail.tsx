import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api, QUERY_KEYS } from "../api/client";
import { ChangelogPanel } from "../components/ChangelogPanel";
import { DiffTable } from "../components/DiffTable";
import { SchemaTimeline } from "../components/SchemaTimeline";

export function EndpointDetail() {
  const { id } = useParams<{ id: string }>();
  const epId = id!;

  const { data: endpoint, isLoading } = useQuery({
    queryKey: QUERY_KEYS.endpoint(epId),
    queryFn: () => api.endpoints.get(epId),
    staleTime: 30_000,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: QUERY_KEYS.snapshots(epId),
    queryFn: () => api.endpoints.snapshots(epId),
    staleTime: 30_000,
  });

  const { data: diffs = [] } = useQuery({
    queryKey: QUERY_KEYS.diffs(epId),
    queryFn: () => api.endpoints.diffs(epId),
    staleTime: 30_000,
  });

  const diffSnapshotIds = new Set(diffs.map((d) => d.new_snapshot_id));
  const latestSnapshot = snapshots[0] ?? null;

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (!endpoint) return <p className="text-sm text-red-500">Endpoint not found.</p>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Link to="/" className="hover:text-indigo-600">Dashboard</Link>
          <span>›</span>
          <span className="text-gray-700">{endpoint.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{endpoint.name}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-gray-500">
          <span>
            <span className="font-medium text-gray-700">Provider:</span> {endpoint.provider}
          </span>
          <span>
            <span className="font-medium text-gray-700">Method:</span> {endpoint.method}
          </span>
          <span>
            <a
              href={endpoint.url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline truncate max-w-xs"
            >
              {endpoint.url}
            </a>
          </span>
        </div>
        {endpoint.latest_snapshot_hash && (
          <p className="mt-2 text-xs text-gray-400">
            Latest hash:{" "}
            <code className="bg-gray-100 px-1 rounded">{endpoint.latest_snapshot_hash.slice(0, 20)}</code>
            {endpoint.latest_checked_at && (
              <span className="ml-2">
                · Checked {new Date(endpoint.latest_checked_at).toLocaleString()}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: timeline */}
        <div className="lg:col-span-1">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Snapshot Timeline</h2>
          <SchemaTimeline snapshots={snapshots} diffSnapshotIds={diffSnapshotIds} />
        </div>

        {/* Right: diffs + changelog */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Diffs ({diffs.length})
            </h2>
            <DiffTable diffs={diffs} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <ChangelogPanel endpointId={epId} latestSnapshot={latestSnapshot} />
          </div>
        </div>
      </div>
    </div>
  );
}
