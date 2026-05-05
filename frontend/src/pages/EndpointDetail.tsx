import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import { ChangelogPanel } from "../components/ChangelogPanel";
import { DiffTable } from "../components/DiffTable";
import { SchemaTimeline } from "../components/SchemaTimeline";


type Tab = "diffs" | "timeline" | "schema" | "changelog";

function timeAgo(dt: string | null) {
  if (!dt) return "never";
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function EndpointDetail() {
  const { id } = useParams<{ id: string }>();
  const epId = id!;
  const [tab, setTab] = useState<Tab>("diffs");

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

  const breaking = diffs.filter((d) => d.severity === "breaking").length;
  const risky = diffs.filter((d) => d.severity === "risky").length;
  const safe = diffs.filter((d) => d.severity === "safe").length;

  // Build field schema from latest snapshot
  const schemaFields = (latestSnapshot?.normalized_schema_json as Array<{
    path: string; type: string; required: boolean; nullable: boolean; enum_values?: string[];
  }> | null) ?? [];

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "diffs", label: "Diffs", count: diffs.length },
    { id: "timeline", label: "Timeline", count: snapshots.length },
    { id: "schema", label: "Schema", count: schemaFields.length },
    { id: "changelog", label: "Changelog" },
  ];

  if (isLoading) return (
    <div className="space-y-4">
      <div className="shimmer h-8 rounded-lg w-48" />
      <div className="shimmer h-40 rounded-xl" />
    </div>
  );
  if (!endpoint) return <p className="text-sm text-red-400">Endpoint not found.</p>;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link to="/" className="hover:text-slate-400 transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-slate-400">{endpoint.name}</span>
      </div>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">{endpoint.name}</h1>
              <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-medium">
                {endpoint.provider}
              </span>
              <span className="text-xs bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded font-mono">
                {endpoint.method}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <a
                href={endpoint.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate max-w-lg"
              >
                {endpoint.url}
              </a>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {endpoint.latest_snapshot_hash && (
              <div>
                <p className="label mb-1">Latest hash</p>
                <span className="hash">{endpoint.latest_snapshot_hash.slice(0, 16)}</span>
              </div>
            )}
            <p className="text-xs text-slate-600 mt-2">Checked {timeAgo(endpoint.latest_checked_at)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800">
          {[
            { label: "Breaking diffs", value: breaking, color: breaking > 0 ? "text-red-400" : "text-slate-500" },
            { label: "Risky diffs", value: risky, color: risky > 0 ? "text-amber-400" : "text-slate-500" },
            { label: "Safe diffs", value: safe, color: safe > 0 ? "text-emerald-400" : "text-slate-500" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="label">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? "text-slate-100" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md ${tab === t.id ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-600"}`}>
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "diffs" && (
            <div className="card overflow-hidden">
              <DiffTable diffs={diffs} />
            </div>
          )}

          {tab === "timeline" && (
            <div className="card p-6">
              <SchemaTimeline snapshots={snapshots} diffSnapshotIds={diffSnapshotIds} />
            </div>
          )}

          {tab === "schema" && (
            <div className="card overflow-hidden">
              {schemaFields.length === 0 ? (
                <p className="text-sm text-slate-600 p-6 text-center">No schema data available</p>
              ) : (
                <div>
                  <div className="grid grid-cols-[1fr_90px_70px_70px_200px] gap-3 px-4 py-2.5">
                    {["Path", "Type", "Required", "Nullable", "Example / Enum"].map(h => (
                      <span key={h} className="label">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {schemaFields.map((f, i) => (
                      <motion.div
                        key={f.path}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="grid grid-cols-[1fr_90px_70px_70px_200px] gap-3 px-4 py-2.5 hover:bg-slate-800/20 transition-colors"
                      >
                        <code className="mono text-xs text-indigo-300 self-center">{f.path}</code>
                        <span className={`text-xs self-center font-medium ${
                          f.type === "object" ? "text-violet-400" :
                          f.type === "array" ? "text-blue-400" :
                          f.type === "string" ? "text-emerald-400" :
                          f.type === "integer" || f.type === "number" ? "text-amber-400" :
                          f.type === "boolean" ? "text-pink-400" :
                          "text-slate-400"
                        }`}>{f.type}</span>
                        <span className={`text-xs self-center ${f.required ? "text-emerald-400" : "text-slate-600"}`}>
                          {f.required ? "yes" : "no"}
                        </span>
                        <span className={`text-xs self-center ${f.nullable ? "text-amber-400" : "text-slate-600"}`}>
                          {f.nullable ? "yes" : "no"}
                        </span>
                        <span className="text-xs text-slate-600 self-center truncate">
                          {f.enum_values?.length ? f.enum_values.join(", ") : "—"}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "changelog" && (
            <div className="card p-6">
              <ChangelogPanel endpointId={epId} latestSnapshot={latestSnapshot} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
