interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "red" | "yellow" | "green";
}

const COLORS = {
  default: "border-gray-200 bg-white",
  red: "border-red-200 bg-red-50",
  yellow: "border-yellow-200 bg-yellow-50",
  green: "border-green-200 bg-green-50",
};

const VAL_COLORS = {
  default: "text-gray-900",
  red: "text-red-700",
  yellow: "text-yellow-700",
  green: "text-green-700",
};

export function MetricCard({ label, value, sub, color = "default" }: Props) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-1 ${COLORS[color]}`}>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className={`text-3xl font-bold ${VAL_COLORS[color]}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}
