import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, QUERY_KEYS } from "../api/client";
import type { Snapshot } from "../types";

interface Props {
  endpointId: string;
  latestSnapshot: Snapshot | null;
}

export function ChangelogPanel({ endpointId, latestSnapshot }: Props) {
  const qc = useQueryClient();

  const { data: changelogs = [] } = useQuery({
    queryKey: QUERY_KEYS.changelogs(endpointId),
    queryFn: () => api.endpoints.changelogs(endpointId),
    staleTime: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: (snapshotId: string) => api.changelogs.generate(snapshotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.changelogs(endpointId) });
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = changelogs.find((c) => c.id === selectedId) ?? changelogs[0];

  const latestHasChangelog = latestSnapshot
    ? changelogs.some((c) => c.snapshot_id === latestSnapshot.id)
    : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Changelogs</h3>
        {latestSnapshot && !latestHasChangelog && (
          <button
            onClick={() => generateMutation.mutate(latestSnapshot.id)}
            disabled={generateMutation.isPending}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {generateMutation.isPending ? "Generating…" : "Generate Changelog"}
          </button>
        )}
      </div>

      {generateMutation.isError && (
        <p className="text-sm text-red-500">
          Failed: {String(generateMutation.error)}
        </p>
      )}

      {changelogs.length > 1 && (
        <select
          className="text-sm border border-gray-200 rounded px-2 py-1"
          value={selected?.id ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {changelogs.map((c) => (
            <option key={c.id} value={c.id}>
              {new Date(c.created_at).toLocaleString()} {c.model_name ? `(${c.model_name})` : "(template)"}
            </option>
          ))}
        </select>
      )}

      {selected ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {selected.generated_text}
            </pre>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {selected.model_name ? `AI: ${selected.model_name}` : "Template fallback"} ·{" "}
            {new Date(selected.created_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No changelogs yet.{" "}
          {latestSnapshot && !latestHasChangelog && "Click Generate to create one."}
        </p>
      )}
    </div>
  );
}
