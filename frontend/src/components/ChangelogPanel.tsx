import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import type { Snapshot } from "../types";

interface Props { endpointId: string; latestSnapshot: Snapshot | null; }

function parseLog(text: string) {
  return text.split(/\n(?=## )/).filter(Boolean).map(block => {
    const lines = block.trim().split("\n").filter(Boolean);
    const heading = lines[0]?.replace(/^## /, "") ?? "";
    const items = lines.slice(1).map(l => l.replace(/^[-*]\s*/, ""));
    const sev = heading.toLowerCase().replace(/\s*\(\d+\)$/, "").trim();
    return { heading, items, sev };
  });
}

const SEV_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  breaking: { bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.15)",  text: "#fca5a5" },
  risky:    { bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.15)", text: "#fcd34d" },
  safe:     { bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.15)",  text: "#86efac" },
};

export function ChangelogPanel({ endpointId, latestSnapshot }: Props) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: changelogs = [] } = useQuery({
    queryKey: QUERY_KEYS.changelogs(endpointId),
    queryFn: () => api.endpoints.changelogs(endpointId),
    staleTime: 30_000,
  });

  const gen = useMutation({
    mutationFn: (id: string) => api.changelogs.generate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.changelogs(endpointId) }),
  });

  const selected = changelogs.find(c => c.id === selectedId) ?? changelogs[0];
  const latestHasCL = latestSnapshot ? changelogs.some(c => c.snapshot_id === latestSnapshot.id) : true;
  const sections = selected ? parseLog(selected.generated_text) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="heading-sm">AI Changelog</p>
          <p className="caption mt-0.5">{changelogs.length} {changelogs.length === 1 ? "entry" : "entries"}</p>
        </div>
        {latestSnapshot && !latestHasCL && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => gen.mutate(latestSnapshot.id)}
            disabled={gen.isPending}
            className="btn btn-primary"
          >
            {gen.isPending ? (
              <>
                <motion.svg animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" />
                </motion.svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate
              </>
            )}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {gen.isError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="body rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 12 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Failed to generate changelog
          </motion.div>
        )}
      </AnimatePresence>

      {changelogs.length > 1 && (
        <select
          className="input"
          value={selected?.id ?? ""}
          onChange={e => setSelectedId(e.target.value)}
        >
          {changelogs.map(c => (
            <option key={c.id} value={c.id} style={{ background: "var(--surface-2)" }}>
              {new Date(c.created_at).toLocaleString()} — {c.model_name ? `AI` : "Template"}
            </option>
          ))}
        </select>
      )}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {sections.map((sec, i) => {
              const style = SEV_STYLES[sec.sev] ?? SEV_STYLES.safe;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-xl px-4 py-3.5" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <h4 style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: style.text, marginBottom: 10 }}>
                    {sec.heading}
                  </h4>
                  <ul className="space-y-2">
                    {sec.items.map((item, j) => (
                      <li key={j} className="flex gap-2 body" style={{ fontSize: 12 }}>
                        <span style={{ color: "var(--text-3)", marginTop: 2, flexShrink: 0 }}>›</span>
                        <span dangerouslySetInnerHTML={{
                          __html: item.replace(/`([^`]+)`/g,
                            '<code style="font-family:JetBrains Mono,monospace;font-size:11px;background:rgba(99,102,241,0.12);color:#a5b4fc;padding:1px 5px;border-radius:4px;">$1</code>')
                        }} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}

            <div className="flex items-center gap-2 pt-1">
              {selected.model_name ? (
                <span className="badge" style={{ background: "rgba(139,92,246,0.1)", color: "#c4b5fd", borderColor: "rgba(139,92,246,0.2)", fontSize: 10 }}>
                  ⚡ {selected.model_name.split("-").slice(0, 3).join("-")}
                </span>
              ) : (
                <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-3)", borderColor: "var(--border-2)", fontSize: 10 }}>Template</span>
              )}
              <span className="caption">{new Date(selected.created_at).toLocaleString()}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--indigo-light)" strokeWidth={1.8}><path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="heading-sm">No changelogs yet</p>
            <p className="body">Generate one after a schema drift is detected</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
