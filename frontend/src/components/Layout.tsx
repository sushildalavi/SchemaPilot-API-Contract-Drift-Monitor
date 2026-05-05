import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "./CommandPalette";

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span className="mono tabular-nums" style={{ fontSize: 10, color: "#2a2a3a" }}>
      {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

const NAV = [
  {
    to: "/", end: true, label: "Overview",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: "/diffs", end: false, label: "Diff History",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
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

      <div className="flex min-h-screen" style={{ background: "#050508" }}>

        {/* ── Sidebar ─────────────────────────────────── */}
        <aside
          className="fixed inset-y-0 left-0 z-40 flex flex-col"
          style={{
            width: 220,
            background: "rgba(5,5,8,0.98)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Logo */}
          <div className="flex h-14 items-center px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5 select-none">
              <div className="relative w-7 h-7 flex-shrink-0">
                <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(8px)", opacity: 0.7 }} />
                <div className="relative w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                  </svg>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", lineHeight: 1 }}>SchemaPilot</p>
                <p style={{ fontSize: 9, color: "#2a2a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>Contract Monitor</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 group"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ color: "#2a2a3a" }}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <span style={{ flex: 1, textAlign: "left", fontSize: 12, color: "#2a2a3a" }}>Search…</span>
              <kbd style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "#1e1e2a", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 4 }}>⌘K</kbd>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            <p className="sp-label px-2 mb-2 mt-1">Menu</p>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {({ isActive }) => (
                  <motion.div
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive ? "#f0f0f0" : "#383850",
                      background: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                      border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.color = "#909090"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.color = "#383850"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; } }}
                    whileHover={{ x: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 w-0.5 h-5 rounded-full"
                        style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span style={{ color: isActive ? "#818cf8" : "#2a2a3a" }}>{item.icon}</span>
                    {item.label}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* API Docs */}
          <div className="px-3 pb-2">
            <a
              href="http://localhost:8080/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors duration-150"
              style={{ fontSize: 12, color: "#2a2a3a", border: "1px solid transparent" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#707080"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#2a2a3a"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent"; }}
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              API Reference
            </a>
          </div>

          {/* Footer status */}
          <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="relative w-2 h-2 flex-shrink-0">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 live-dot" style={{ color: "#34d399" }} />
                  <span className="block w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span style={{ fontSize: 11, color: "#1e1e2a" }}>Monitoring active</span>
              </div>
              <LiveClock />
            </div>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(to right, #6366f1, #8b5cf6, #6366f1)", backgroundSize: "200% 100%" }}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 86400, ease: "linear" }}
              />
            </div>
            <p style={{ fontSize: 10, color: "#1e1e2a", marginTop: 4 }}>Next cron · 08:00 UTC daily</p>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────── */}
        <div className="flex flex-col flex-1 relative" style={{ marginLeft: 220 }}>
          {/* Topbar */}
          <header
            className="sticky top-0 z-30 flex h-14 items-center gap-4 px-8"
            style={{
              background: "rgba(5,5,8,0.85)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={location.pathname}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="mono flex items-center gap-2"
                style={{ fontSize: 11, color: "#2a2a3a" }}
              >
                <span>schemapilot</span>
                <span style={{ color: "#1a1a28" }}>/</span>
                <span style={{ color: "#404058" }}>
                  {location.pathname === "/" ? "overview" : location.pathname.startsWith("/endpoints/") ? "endpoint" : "diffs"}
                </span>
              </motion.p>
            </AnimatePresence>

            <div className="flex-1" />

            <button
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "5px 12px", cursor: "pointer", fontSize: 11, color: "#383850" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#707080"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "#383850"; }}
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
              Search
              <kbd className="mono" style={{ fontSize: 9, color: "#1e1e2a", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 4 }}>⌘K</kbd>
            </button>

            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white cursor-pointer select-none"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: 11, fontWeight: 700, boxShadow: "0 0 16px rgba(99,102,241,0.35)" }}>
              S
            </div>
          </header>

          {/* Page content */}
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 px-8 py-7 relative"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
