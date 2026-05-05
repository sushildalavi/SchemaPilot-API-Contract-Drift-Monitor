import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  {
    to: "/", end: true, label: "Overview",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    to: "/diffs", end: false, label: "Diff History",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  },
];

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span className="mono text-[11px] tabular-nums" style={{ color: "#1e293b" }}>
      {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-40"
          style={{
            background: "rgba(6,6,15,0.95)",
            borderRight: "1px solid rgba(255,255,255,0.055)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Logo */}
          <div className="h-[56px] flex items-center px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <motion.div className="flex items-center gap-2.5 select-none" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
              <div className="relative w-7 h-7 flex-shrink-0">
                <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", filter: "blur(6px)", opacity: 0.6 }} />
                <div className="relative w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold text-white leading-none">SchemaPilot</p>
                <p style={{ fontSize: "9px", color: "#1e293b", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>Monitor</p>
              </div>
            </motion.div>
          </div>

          {/* Search trigger */}
          <div className="px-3 pt-4 pb-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-slate-600 hover:text-slate-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
              <span className="flex-1 text-left">Search…</span>
              <kbd className="mono text-[9px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", color: "#1e293b" }}>⌘K</kbd>
            </motion.button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            <p className="label px-2 mb-2 mt-1">Navigation</p>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {({ isActive }) => (
                  <motion.div
                    className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                    style={{ color: isActive ? "#e2e8f0" : "#334155", background: isActive ? "rgba(99,102,241,0.1)" : "transparent", border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent" }}
                    whileHover={{ x: 1.5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span style={{ color: isActive ? "#818cf8" : "#1e293b" }}>{item.icon}</span>
                    {item.label}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Docs link */}
          <div className="px-3 pb-3">
            <a
              href="http://localhost:8080/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-slate-700 hover:text-slate-400 transition-colors"
              style={{ border: "1px solid transparent" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              API Reference
            </a>
          </div>

          {/* Status footer */}
          <div className="px-4 py-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block pulse-dot text-emerald-400" />
                </div>
                <span style={{ fontSize: "11px", color: "#1e293b" }}>Live monitoring</span>
              </div>
              <LiveClock />
            </div>
            <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(to right, #6366f1, #8b5cf6)" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 86400, ease: "linear" }}
              />
            </div>
            <p style={{ fontSize: "10px", color: "#1e293b", marginTop: "4px" }}>Next cron: 08:00 UTC</p>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 ml-[220px] min-h-screen flex flex-col relative z-10">
          {/* Topbar */}
          <header
            className="h-[56px] flex items-center px-8 gap-4 sticky top-0 z-30"
            style={{
              background: "rgba(6,6,15,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={location.pathname}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-medium"
                style={{ color: "#1e293b" }}
              >
                {location.pathname === "/"
                  ? "schemapilot / overview"
                  : location.pathname.startsWith("/endpoints/")
                  ? "schemapilot / endpoint"
                  : "schemapilot / diffs"}
              </motion.p>
            </AnimatePresence>

            <div className="flex-1" />

            {/* Cmd K hint */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#334155" }}
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
              Quick search
              <kbd className="mono text-[9px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px" }}>⌘K</kbd>
            </motion.button>

            <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 12px rgba(99,102,241,0.4)" }}>
              S
            </div>
          </header>

          {/* Page */}
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
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
