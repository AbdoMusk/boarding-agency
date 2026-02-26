import { clsx } from "clsx";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { CompatibilityCheck } from "@/types";

const statusConfig = {
  compatible: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 border-green-100",
    label: "Compatible",
  },
  partial: {
    icon: MinusCircle,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
    label: "Partial",
  },
  incompatible: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
    label: "Incompatible",
  },
};

export default function CompatibilityCheckCard({ check }: { check: CompatibilityCheck }) {
  const cfg = statusConfig[check.status] ?? statusConfig.partial;
  const Icon = cfg.icon;

  return (
    <div className={clsx("flex gap-3 rounded-xl border p-4", cfg.bg)}>
      <Icon size={20} className={clsx("shrink-0 mt-0.5", cfg.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-slate-800">{check.criteria}</span>
          <span className={clsx("text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{check.explanation}</p>
      </div>
    </div>
  );
}
