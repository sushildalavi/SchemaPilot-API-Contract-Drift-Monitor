import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import type { Snapshot } from "../types";

interface Props {
  endpointId: string;
  latestSnapshot: Snapshot | null;
}

export function ChangelogPanel({ endpointId, latestSnapshot }: Props) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = changelogs.find((c) => c.id === selectedId) ?? changelogs[0];
  const latestHasChangelog = latestSnapshot
    ? changelogs.some((c) => c.snapshot_id === latestSnapshot.id)
    : true;

  // Parse markdown sections
  const sections = selected
    ? selected.generated_text.split(/\n(?=## )/).filter(Boolean)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">AI Changelog</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {changelogs.length} {changelogs.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {latestSnapshot && !latestHasChangelog && (
          <button
            onClick={() => generateMutation.mutate(latestSnapshot.id)}
            disabled={generateMutation.isPending}
            className="btn-primary"
          >
            {generateMutation.isPending ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Changelog
              </>
            )}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {generateMutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Failed to generate changelog
          </motion.div>
        )}
      </AnimatePresence>

      {changelogs.length > 1 && (
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          value={selected?.id ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {changelogs.map((c) => (
            <option key={c.id} value={c.id}>
              {new Date(c.created_at).toLocaleString()} — {c.model_name ? `AI (${c.model_name})` : "Template"}
            </option>
          ))}
        </select>
      )}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {sections.map((section, i) => {
              const lines = section.split("\n").filter(Boolean);
              const heading = lines[0]?.replace("## ", "") ?? "";
              const items = lines.slice(1);
              const isBreaking = heading.toLowerCase().includes("breaking");
              const isRisky = heading.toLowerCase().includes("risky");
              const borderColor = isBreaking ? "border-red-500/30 bg-red-500/5" : isRisky ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5";
              const headingColor = isBreaking ? "text-red-400" : isRisky ? "text-amber-400" : "text-emerald-400";

              return (
                <div key={i} className={`rounded-xl border px-4 py-3 ${borderColor}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${headingColor}`}>
                    {heading}
                  </h4>
                  <ul className="space-y-1.5">
                    {items.map((line, j) => (
                      <li key={j} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-slate-600 mt-0.5">·</span>
                        <span dangerouslySetInnerHTML={{
                          __html: line.replace(/^[-*]\s*/, "").replace(/`([^`]+)`/g, '<code class="mono text-xs text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">$1</code>')
                        }} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="flex items-center gap-3 pt-1">
              <span className={`text-xs px-2 py-0.5 rounded-md ${selected.model_name ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-500"}`}>
                {selected.model_name ? `⚡ ${selected.model_name}` : "Template fallback"}
              </span>
              <span className="text-xs text-slate-600">{new Date(selected.created_at).toLocaleString()}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-10 text-slate-600"
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">No changelogs yet</p>
            <p className="text-xs mt-1">Generate one when a drift is detected</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
