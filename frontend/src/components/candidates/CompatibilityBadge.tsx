import { clsx } from "clsx";

interface Props {
  score?: number | null;
  size?: "sm" | "md" | "lg";
}

function getColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getRingColor(score: number) {
  if (score >= 70) return "ring-green-200 bg-green-50";
  if (score >= 40) return "ring-amber-200 bg-amber-50";
  return "ring-red-200 bg-red-50";
}

export default function CompatibilityBadge({ score, size = "md" }: Props) {
  if (score === undefined || score === null)
    return <span className="text-slate-400 text-xs">—</span>;

  return (
    <span
      className={clsx(
        "inline-flex items-center font-bold rounded-full ring-1",
        getRingColor(score),
        getColor(score),
        size === "sm" ? "px-2 py-0.5 text-[11px]" : size === "lg" ? "px-4 py-1.5 text-lg" : "px-3 py-1 text-sm"
      )}
    >
      {score}%
    </span>
  );
}
