import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, QUERY_KEYS } from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: endpoints = [] } = useQuery({
    queryKey: QUERY_KEYS.endpoints,
    queryFn: api.endpoints.list,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const epResults = endpoints.filter(e =>
    !query || e.name.toLowerCase().includes(query.toLowerCase()) || e.provider.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    ...(query === "" || "dashboard".includes(query.toLowerCase()) ? [{ type: "action", icon: "⊞", label: "Go to Dashboard", sub: "", action: () => navigate("/") }] : []),
    ...(query === "" || "diffs".includes(query.toLowerCase()) ? [{ type: "action", icon: "⊟", label: "Recent Diffs", sub: "", action: () => navigate("/diffs") }] : []),
    ...epResults.map(ep => ({
      type: "endpoint",
      icon: ep.latest_snapshot_hash ? "●" : "○",
      label: ep.name,
      sub: ep.provider,
      action: () => navigate(`/endpoints/${ep.id}`),
    })),
  ];

  const go = (i: number) => {
    if (actions[i]) { actions[i].action(); onClose(); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, actions.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); go(selected); }
      if (e.key === "Escape")    { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, actions]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="card w-full max-w-[520px] overflow-hidden pointer-events-auto shadow-2xl"
              style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.2), 0 32px 80px -8px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.08)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={2.2} className="flex-shrink-0">
                  <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search endpoints, navigate…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0); }}
                  className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder-slate-600 outline-none"
                />
                <kbd className="text-[10px] text-slate-700 bg-white/4 border border-white/8 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {actions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12px] text-slate-600">No results for "{query}"</div>
                ) : (
                  <div className="py-1.5">
                    {actions.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-100"
                        style={{ background: selected === i ? "rgba(99,102,241,0.12)" : "transparent" }}
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => go(i)}
                      >
                        <span className={`text-base flex-shrink-0 ${item.type === "endpoint" ? (item.icon === "●" ? "text-emerald-400" : "text-slate-600") : "text-indigo-400"}`}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] text-slate-200 font-medium">{item.label}</span>
                          {item.sub && <span className="ml-2 text-[11px] text-slate-600">{item.sub}</span>}
                        </div>
                        {selected === i && (
                          <kbd className="text-[10px] text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">↵</kbd>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 flex items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {[["↑↓", "navigate"], ["↵", "open"], ["ESC", "close"]].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <kbd className="text-[10px] text-slate-600 bg-white/4 border border-white/8 px-1.5 py-0.5 rounded font-mono">{k}</kbd>
                    <span className="text-[10px] text-slate-700">{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
