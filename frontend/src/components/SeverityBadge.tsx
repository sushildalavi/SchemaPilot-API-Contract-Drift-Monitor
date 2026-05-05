import type { Severity } from "../types";

const DOT: Record<Severity, string> = {
  breaking: "bg-red-400",
  risky: "bg-amber-400",
  safe: "bg-emerald-400",
};

const STYLE: Record<Severity, string> = {
  breaking: "badge-breaking",
  risky: "badge-risky",
  safe: "badge-safe",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={STYLE[severity]}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[severity]} flex-shrink-0`} />
      {severity}
    </span>
  );
}
