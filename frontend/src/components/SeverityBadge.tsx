import type { Severity } from "../types";

const CFG: Record<Severity, { cls: string; dot: string; label: string }> = {
  breaking: { cls: "badge-breaking", dot: "bg-red-400", label: "Breaking" },
  risky:    { cls: "badge-risky",    dot: "bg-amber-400", label: "Risky" },
  safe:     { cls: "badge-safe",     dot: "bg-emerald-400", label: "Safe" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = CFG[severity];
  return (
    <span className={c.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
      {c.label}
    </span>
  );
}
