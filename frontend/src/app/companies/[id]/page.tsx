"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Users, Plus, Download, FileText,
  AlertTriangle, CheckCircle2, RefreshCw, Trash2, MapPin, Globe
} from "lucide-react";
import { companiesApi, candidatesApi, reportsApi } from "@/lib/api";
import type { Company, Candidate } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import CompatibilityBadge from "@/components/candidates/CompatibilityBadge";
import RiskBadge from "@/components/candidates/RiskBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CandidateUploadModal from "@/components/candidates/CandidateUploadModal";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const data = await companiesApi.get(Number(id));
      setCompany(data);
    } catch {
      router.push("/companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleDelete = async (candidateId: number) => {
    if (!confirm("Delete this candidate?")) return;
    await candidatesApi.delete(candidateId);
    fetchCompany();
  };

  if (loading) return <LoadingSpinner label="Loading company…" />;
  if (!company) return null;

  const candidates = company.candidates ?? [];
  const avgScore =
    candidates.filter((c) => c.compatibility_score != null).length > 0
      ? Math.round(
          candidates
            .filter((c) => c.compatibility_score != null)
            .reduce((sum, c) => sum + (c.compatibility_score ?? 0), 0) /
            candidates.filter((c) => c.compatibility_score != null).length
        )
      : null;

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/companies" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Companies
      </Link>

      {/* Company header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                {company.industry && <span className="font-medium">{company.industry}</span>}
                {company.location && (
                  <span className="flex items-center gap-1"><MapPin size={12} />{company.location}</span>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                    <Globe size={12} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 shrink-0">
            {avgScore != null && (
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Avg Match</div>
                <CompatibilityBadge score={avgScore} size="lg" />
              </div>
            )}
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Candidates</div>
              <div className="text-2xl font-bold text-slate-800">{candidates.length}</div>
            </div>
          </div>
        </div>

        {company.description && (
          <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100 leading-relaxed">
            {company.description}
          </p>
        )}

        {company.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {company.required_skills.map((s) => (
              <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Candidates section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users size={18} /> Candidates
        </h2>
        <div className="flex items-center gap-2">
          {candidates.length > 0 && (
            <>
              <a
                href={reportsApi.companyCsvUrl(company.id)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <Download size={13} /> CSV
              </a>
              <a
                href={reportsApi.companyPdfUrl(company.id)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <FileText size={13} /> PDF
              </a>
            </>
          )}
          <button
            onClick={fetchCompany}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus size={15} /> Add Candidate
          </button>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-semibold">No candidates yet</p>
          <p className="text-sm mt-1">Upload a CV to add your first candidate.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left">Risk</th>
                <th className="px-5 py-3 text-left">Experience</th>
                <th className="px-5 py-3 text-left">Education</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/companies/${company.id}/candidates/${c.id}`}
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                    >
                      {c.name}
                    </Link>
                    {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <CompatibilityBadge score={c.compatibility_score} size="sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskBadge risk={c.risk_level} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {c.experience_years != null ? `${c.experience_years} yrs` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{c.education_level ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/companies/${company.id}/candidates/${c.id}`}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <CandidateUploadModal
          companyId={company.id}
          onClose={() => setShowUpload(false)}
          onCreated={() => {
            setShowUpload(false);
            fetchCompany();
          }}
        />
      )}
    </div>
  );
}
