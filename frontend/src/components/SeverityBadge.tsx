import type { Severity } from "../types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`badge badge-${severity}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${severity === "breaking" ? "dot-red" : severity === "risky" ? "dot-yellow" : "dot-green"}`} />
      {severity}
    </span>
  );
}
