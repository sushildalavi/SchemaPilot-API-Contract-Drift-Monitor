import type { Severity } from "../types";

const STYLES: Record<Severity, string> = {
  breaking: "bg-red-100 text-red-700 border border-red-300",
  risky: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  safe: "bg-green-100 text-green-700 border border-green-300",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${STYLES[severity]}`}>
      {severity}
    </span>
  );
}
