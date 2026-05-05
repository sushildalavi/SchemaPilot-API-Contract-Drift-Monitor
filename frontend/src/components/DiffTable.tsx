import type { Diff } from "../types";
import { SeverityBadge } from "./SeverityBadge";

function fmt(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  diffs: Diff[];
  showEndpoint?: boolean;
}

export function DiffTable({ diffs }: Props) {
  if (!diffs.length) {
    return <p className="text-sm text-gray-500 py-4">No diffs recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Change</th>
            <th className="px-3 py-2">Path</th>
            <th className="px-3 py-2">Old</th>
            <th className="px-3 py-2">New</th>
            <th className="px-3 py-2">Detected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {diffs.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <SeverityBadge severity={d.severity} />
              </td>
              <td className="px-3 py-2 text-gray-700">{d.change_type}</td>
              <td className="px-3 py-2">
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{d.path}</code>
              </td>
              <td className="px-3 py-2 text-gray-500">{d.old_type ?? "—"}</td>
              <td className="px-3 py-2 text-gray-500">{d.new_type ?? "—"}</td>
              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{fmt(d.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
