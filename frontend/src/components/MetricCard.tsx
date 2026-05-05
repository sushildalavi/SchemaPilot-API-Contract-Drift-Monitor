import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkline } from "./Sparkline";

interface Props {
  label: string;
  value: number;
  sub?: string;
  trend?: number[];
  delta?: number;
  color?: "default" | "red" | "amber" | "green" | "indigo";
  icon?: React.ReactNode;
}

const COLORS = {
  default: { text: "text-white", spark: "#6366f1", glow: "" },
  red:     { text: "text-red-400",     spark: "#ef4444", glow: "hover:shadow-red-500/10" },
  amber:   { text: "text-amber-400",   spark: "#f59e0b", glow: "hover:shadow-amber-500/10" },
  green:   { text: "text-emerald-400", spark: "#10b981", glow: "hover:shadow-emerald-500/10" },
  indigo:  { text: "text-indigo-400",  spark: "#6366f1", glow: "hover:shadow-indigo-500/10" },
};

function useCountUp(to: number, dur = 900) {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current;
    const d = to - from;
    if (!d) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(from + d * e));
      if (p < 1) requestAnimationFrame(tick);
      else ref.current = to;
    };
    requestAnimationFrame(tick);
  }, [to, dur]);
  return val;
}

export function MetricCard({ label, value, sub, trend, delta, color = "default", icon }: Props) {
  const c = COLORS[color];
  const count = useCountUp(value);
  const isUp = delta !== undefined && delta > 0;


  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`glass-hover rounded-2xl p-5 flex flex-col gap-3 hover:shadow-2xl ${c.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="section-label">{label}</span>
        {icon && <span className="text-slate-700">{icon}</span>}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <motion.span
            key={count}
            className={`text-4xl font-bold tracking-tight tabular-nums ${c.text}`}
          >
            {count.toLocaleString()}
          </motion.span>
          {delta !== undefined && delta !== 0 && (
            <span className={`ml-2 text-xs font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
              {isUp ? "↑" : "↓"}{Math.abs(delta)}
            </span>
          )}
        </div>
        {trend && trend.length > 2 && (
          <div className="opacity-80">
            <Sparkline data={trend} width={64} height={28} color={c.spark} />
          </div>
        )}
      </div>

      {sub && <span className="text-[11px] text-slate-600 -mt-1">{sub}</span>}
    </motion.div>
  );
}
