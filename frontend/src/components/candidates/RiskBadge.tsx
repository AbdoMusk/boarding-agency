import { clsx } from "clsx";

interface Props {
  risk?: string | null;
  size?: "sm" | "md";
}

const colors: Record<string, string> = {
  Low: "bg-green-100 text-green-700 ring-green-200",
  Medium: "bg-amber-100 text-amber-700 ring-amber-200",
  High: "bg-red-100 text-red-700 ring-red-200",
};

export default function RiskBadge({ risk, size = "md" }: Props) {
  if (!risk) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold rounded-full ring-1",
        colors[risk] ?? "bg-slate-100 text-slate-600 ring-slate-200",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      )}
    >
      {risk} Risk
    </span>
  );
}
