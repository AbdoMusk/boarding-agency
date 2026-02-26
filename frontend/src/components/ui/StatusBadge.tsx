import { clsx } from "clsx";

interface Props {
  status: "pending" | "processing" | "done" | "error";
}

const map: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-slate-100 text-slate-500 ring-slate-200" },
  processing: { label: "Processing…", classes: "bg-blue-100 text-blue-600 ring-blue-200 animate-pulse" },
  done: { label: "Done", classes: "bg-green-100 text-green-600 ring-green-200" },
  error: { label: "Error", classes: "bg-red-100 text-red-600 ring-red-200" },
};

export default function StatusBadge({ status }: Props) {
  const cfg = map[status] ?? map.pending;
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ring-1", cfg.classes)}>
      {cfg.label}
    </span>
  );
}
