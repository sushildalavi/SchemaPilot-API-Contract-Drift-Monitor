import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  value: number;
  sub?: string;
  color?: "default" | "red" | "yellow" | "green" | "indigo";
  icon?: React.ReactNode;
}

const ACCENT: Record<string, string> = {
  default: "text-slate-100",
  red: "text-red-400",
  yellow: "text-amber-400",
  green: "text-emerald-400",
  indigo: "text-indigo-400",
};

const GLOW: Record<string, string> = {
  default: "",
  red: "shadow-red-500/10",
  yellow: "shadow-amber-500/10",
  green: "shadow-emerald-500/10",
  indigo: "shadow-indigo-500/10",
};

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const frame = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(frame);
      else prev.current = target;
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return count;
}

export function MetricCard({ label, value, sub, color = "default", icon }: Props) {
  const count = useCountUp(value);
  return (
    <div className={`card p-5 flex flex-col gap-3 transition-all duration-200 hover:border-slate-700 shadow-xl ${GLOW[color]}`}>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <span className={`text-4xl font-bold tracking-tight flash-in ${ACCENT[color]}`}>
        {count.toLocaleString()}
      </span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}
