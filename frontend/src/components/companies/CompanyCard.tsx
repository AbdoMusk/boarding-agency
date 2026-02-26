import Link from "next/link";
import { Building2, Users, MapPin, Globe } from "lucide-react";
import type { Company } from "@/types";

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="group block rounded-2xl bg-white border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 transition-colors shrink-0">
          <Building2 size={20} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
            {company.name}
          </h3>
          {company.industry && (
            <p className="text-[12px] text-slate-500 font-medium">{company.industry}</p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
        {company.location && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {company.location}
          </span>
        )}
        {company.website && (
          <span
            className="flex items-center gap-1 text-blue-500 hover:underline"
            onClick={(e) => { e.preventDefault(); window.open(company.website, "_blank"); }}
          >
            <Globe size={11} /> Website
          </span>
        )}
      </div>

      {/* Description */}
      {company.description && (
        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
          {company.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Users size={13} />
          {company.candidate_count ?? 0} candidate{company.candidate_count !== 1 ? "s" : ""}
        </div>
        {company.required_skills?.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {company.required_skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium"
              >
                {s}
              </span>
            ))}
            {company.required_skills.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                +{company.required_skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
