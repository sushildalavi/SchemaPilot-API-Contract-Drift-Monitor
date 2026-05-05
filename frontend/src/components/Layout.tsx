import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const NAV = [
  {
    to: "/", end: true,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    label: "Dashboard",
  },
  {
    to: "/diffs", end: false,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    label: "Recent Diffs",
  },
];

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span className="mono text-[11px] text-slate-600 tabular-nums">
      {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="flex min-h-screen bg-[#080811]">
      {/* Ambient orbs */}
      <div className="orb w-96 h-96 bg-indigo-600/8 top-0 left-40" />
      <div className="orb w-80 h-80 bg-violet-600/6 bottom-20 right-20" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-40" style={{ background: "rgba(8,8,17,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <motion.div
            className="flex items-center gap-2.5 select-none"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 blur-sm opacity-60" />
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                </svg>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">SchemaPilot</p>
              <p className="text-[9px] text-slate-600 leading-none mt-0.5 uppercase tracking-widest">Contract Monitor</p>
            </div>
          </motion.div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="section-label px-2 mb-3 mt-1">Menu</p>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {({ isActive }) => (
                <motion.div
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 rounded-xl bg-white/5 border border-white/8"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors ${isActive ? "text-indigo-400" : "text-slate-600"}`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-full" />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom status */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block pulse-dot text-emerald-400" />
              </div>
              <span className="text-[11px] text-slate-600">Live</span>
            </div>
            <Clock />
          </div>
          <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 86400, ease: "linear", repeat: Infinity }}
            />
          </div>
          <p className="text-[10px] text-slate-700 mt-1.5">Next run: daily 08:00 UTC</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        {/* Top bar */}
        <header
          className="h-14 flex items-center px-8 gap-4 sticky top-0 z-30"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,8,17,0.8)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={location.pathname}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="text-[12px] text-slate-600 font-medium"
              >
                {location.pathname === "/" ? "Overview" : location.pathname.startsWith("/endpoints/") ? "Endpoint Detail" : "Diff History"}
              </motion.p>
            </AnimatePresence>
          </div>
          <a href="http://localhost:8080/docs" target="_blank" rel="noreferrer" className="btn-ghost text-[12px] h-8 px-3">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            API Docs
          </a>
          <div className="w-px h-5 bg-white/5" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
            S
          </div>
        </header>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 px-8 py-8 relative z-10"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
