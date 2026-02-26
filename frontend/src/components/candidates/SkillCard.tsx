import { clsx } from "clsx";
import type { Skill } from "@/types";

const categoryColors: Record<string, string> = {
  "Tech Stack": "bg-blue-50 border-blue-100 text-blue-800",
  "Language": "bg-purple-50 border-purple-100 text-purple-800",
  "Soft Skills": "bg-teal-50 border-teal-100 text-teal-800",
  "Marketing": "bg-pink-50 border-pink-100 text-pink-800",
  "Analytics": "bg-orange-50 border-orange-100 text-orange-800",
  "Tools": "bg-slate-50 border-slate-100 text-slate-700",
};

const levelColors = ["bg-slate-300", "bg-amber-400", "bg-green-500"];

function LevelBars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={clsx(
            "h-2 w-5 rounded-sm transition-all",
            i <= level ? levelColors[level - 1] : "bg-slate-200"
          )}
        />
      ))}
    </div>
  );
}

export default function SkillCard({ skill }: { skill: Skill }) {
  const colorClass =
    categoryColors[skill.category] ?? "bg-slate-50 border-slate-100 text-slate-700";

  return (
    <div className={clsx("rounded-xl border p-4 flex flex-col gap-2", colorClass)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={clsx("text-[10px] font-semibold uppercase tracking-widest opacity-60")}>
            {skill.category}
          </span>
          <h4 className="font-bold text-sm mt-0.5">{skill.name}</h4>
        </div>
        <span className="text-xs font-bold opacity-80 shrink-0">{skill.level_label}</span>
      </div>

      {/* Level bars */}
      <LevelBars level={skill.level} />

      {/* Requirement */}
      {skill.requirement_desc && (
        <p className="text-[11px] opacity-60 leading-snug">{skill.requirement_desc}</p>
      )}

      {/* Evidence */}
      {skill.evidence && (
        <div className="mt-1 rounded-lg bg-white/60 px-3 py-2 border border-current/10">
          <p className="text-[11px] leading-relaxed font-medium opacity-90">
            <span className="text-[10px] uppercase tracking-wide opacity-50 block mb-0.5">Evidence</span>
            {skill.evidence}
          </p>
        </div>
      )}
    </div>
  );
}
