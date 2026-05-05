import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "./CommandPalette";

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="mono caption tabular-nums">
      {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

const NAV = [
  {
    to: "/", end: true, label: "Overview",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    to: "/diffs", end: false, label: "Diff History",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>

        {/* ── Sidebar ─────────────────────────────── */}
        <aside className="fixed inset-y-0 left-0 z-40 flex flex-col sidebar" style={{ width: 224 }}>

          {/* Logo */}
          <div className="flex h-[56px] items-center px-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 select-none">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center relative" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(8px)", opacity: 0.5, zIndex: -1 }} />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.3} strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                  </svg>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2 }}>SchemaPilot</p>
                <p className="eyebrow" style={{ fontSize: 9, marginTop: 1 }}>API Monitor</p>
              </div>
            </div>
          </div>

          {/* Search trigger */}
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-2)", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-3)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <span style={{ flex: 1, textAlign: "left", fontSize: 12, color: "var(--text-3)" }}>Search…</span>
              <div className="flex items-center gap-0.5">
                <kbd style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-2)", padding: "2px 5px", borderRadius: 4 }}>⌘K</kbd>
              </div>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            <p className="eyebrow px-2 mb-2">Navigation</p>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {({ isActive }) => (
                  <motion.div
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer relative"
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--text-1)" : "var(--text-3)",
                      background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                    }}
                    whileHover={!isActive ? { backgroundColor: "rgba(255,255,255,0.04)" } : undefined}
                    transition={{ duration: 0.1 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-accent"
                        className="absolute left-0 inset-y-1 w-0.5 rounded-full"
                        style={{ background: "var(--indigo-light)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span style={{ color: isActive ? "var(--indigo-light)" : "var(--text-3)", flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-3 space-y-1">
            <a
              href="http://localhost:8080/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ fontSize: 12, color: "var(--text-3)", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              API Reference
            </a>
          </div>

          {/* Status footer */}
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full dot-green animate-live block" />
                <span className="caption">Monitoring active</span>
              </div>
              <LiveClock />
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(to right, var(--indigo), var(--violet))" }}
                initial={{ width: "15%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 86400, ease: "linear" }}
              />
            </div>
            <p className="caption mt-1" style={{ fontSize: 10 }}>Next run · daily 08:00 UTC</p>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────── */}
        <div className="flex flex-col flex-1" style={{ marginLeft: 224 }}>

          {/* Topbar */}
          <header className="topbar sticky top-0 z-30 flex h-[56px] items-center px-8 gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 mono caption"
              >
                <span style={{ color: "var(--text-3)" }}>schemapilot</span>
                <span style={{ color: "var(--text-4)" }}>/</span>
                <span style={{ color: "var(--text-2)" }}>
                  {location.pathname === "/" ? "overview" : location.pathname.startsWith("/endpoints/") ? "endpoint" : "diffs"}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="flex-1" />

            <button
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-2)", cursor: "pointer", fontSize: 12, color: "var(--text-3)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
              Search
              <kbd style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "var(--text-3)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-2)", padding: "1px 5px", borderRadius: 4 }}>⌘K</kbd>
            </button>

            <div className="w-px h-5" style={{ background: "var(--border-2)" }} />

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none"
              style={{ background: "linear-gradient(135deg, var(--indigo), var(--violet))", fontSize: 12, fontWeight: 700, color: "#fff", boxShadow: "0 0 12px rgba(99,102,241,0.4)" }}
            >S</div>
          </header>

          {/* Page */}
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 px-8 py-7"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
