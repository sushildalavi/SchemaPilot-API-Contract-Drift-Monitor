import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, QUERY_KEYS } from "../api/client";
import type { Snapshot } from "../types";

interface Props { endpointId: string; latestSnapshot: Snapshot | null; }

const SEVERITY_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  breaking: { border: "border-red-500/20",     bg: "bg-red-500/5",     text: "text-red-400" },
  risky:    { border: "border-amber-500/20",   bg: "bg-amber-500/5",   text: "text-amber-400" },
  safe:     { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400" },
};

function parseChangelog(text: string) {
  return text.split(/\n(?=## )/).filter(Boolean).map(block => {
    const lines = block.trim().split("\n").filter(Boolean);
    const heading = lines[0]?.replace(/^## /, "") ?? "";
    const items = lines.slice(1).map(l => l.replace(/^[-*]\s*/, ""));
    const sev = heading.toLowerCase().replace(/\s*\(\d+\)$/, "").trim();
    return { heading, items, sev };
  });
}

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
  const sections = selected ? parseChangelog(selected.generated_text) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-200">AI Changelog</h3>
          <p className="text-[11px] text-slate-600 mt-0.5">{changelogs.length} entries generated</p>
        </div>
        {latestSnapshot && !latestHasCL && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => gen.mutate(latestSnapshot.id)}
            disabled={gen.isPending}
            className="btn-primary h-8 text-[12px]"
          >
            {gen.isPending ? (
              <>
                <motion.svg animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                </motion.svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Generate
              </>
            )}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {gen.isError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="text-[12px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Failed to generate — check admin secret and retry
          </motion.div>
        )}
      </AnimatePresence>

      {changelogs.length > 1 && (
        <select
          className="w-full bg-white/3 border border-white/6 rounded-xl px-3 py-2 text-[12px] text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors"
          value={selected?.id ?? ""}
          onChange={e => setSelectedId(e.target.value)}
        >
          {changelogs.map(c => (
            <option key={c.id} value={c.id} style={{ background: "#0e0e1a" }}>
              {new Date(c.created_at).toLocaleString()} — {c.model_name ? `AI (${c.model_name.split("-").slice(0,2).join("-")})` : "Template"}
            </option>
          ))}
        </select>
      )}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {sections.map((sec, i) => {
              const style = SEVERITY_STYLE[sec.sev] ?? SEVERITY_STYLE.safe;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-xl border px-4 py-3.5 ${style.bg} ${style.border}`}>
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 ${style.text}`}>{sec.heading}</h4>
                  <ul className="space-y-2">
                    {sec.items.map((item, j) => (
                      <li key={j} className="flex gap-2 text-[12px] text-slate-400">
                        <span className="text-slate-700 mt-0.5 flex-shrink-0">›</span>
                        <span dangerouslySetInnerHTML={{ __html: item.replace(/`([^`]+)`/g,
                          '<code style="font-family:JetBrains Mono,monospace;font-size:11px;background:rgba(99,102,241,0.12);color:#a5b4fc;padding:1px 5px;border-radius:4px;">$1</code>') }}
                        />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              {selected.model_name ? (
                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-1 rounded-lg">
                  ⚡ {selected.model_name.split("-").slice(0,3).join("-")}
                </span>
              ) : (
                <span className="text-[10px] bg-white/4 text-slate-500 border border-white/8 px-2 py-1 rounded-lg">Template</span>
              )}
              <span className="text-[11px] text-slate-700">{new Date(selected.created_at).toLocaleString()}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-slate-400">No changelogs yet</p>
              <p className="text-[11px] text-slate-600 mt-1">Generate one after a drift is detected</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
