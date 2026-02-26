"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, RefreshCw, FileText, User,
  BookOpen, Briefcase, MessageSquare, Star, AlertTriangle,
  Globe, Zap, Info,
} from "lucide-react";
import { candidatesApi, reportsApi, companiesApi } from "@/lib/api";
import type { Candidate, Company, AIAnalysis } from "@/types";
import CompatibilityBadge from "@/components/candidates/CompatibilityBadge";
import RiskBadge from "@/components/candidates/RiskBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import SkillCard from "@/components/candidates/SkillCard";
import CompatibilityCheckCard from "@/components/candidates/CompatibilityCheckCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { clsx } from "clsx";

type Tab = "overview" | "skills" | "analysis" | "languages";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size: number }> }[] = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "analysis", label: "Analysis", icon: BookOpen },
  { id: "languages", label: "Languages", icon: Globe },
];

function AnalysisParagraph({ label, icon: Icon, text }: {
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  text?: string;
}) {
  if (!text) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-blue-600" />
        <h4 className="font-semibold text-sm text-slate-800">{label}</h4>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

export default function CandidateDetailPage() {
  const { id, candidateId } = useParams<{ id: string; candidateId: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cand, comp] = await Promise.all([
        candidatesApi.get(Number(candidateId)),
        companiesApi.get(Number(id)),
      ]);
      setCandidate(cand);
      setCompany(comp);
    } catch {
      router.push(`/companies/${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [candidateId]);

  // Poll while processing
  useEffect(() => {
    if (candidate?.status !== "processing") return;
    const interval = setInterval(async () => {
      const updated = await candidatesApi.get(Number(candidateId));
      setCandidate(updated);
      if (updated.status !== "processing") clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [candidate?.status]);

  const handleReprocess = async () => {
    if (!candidate) return;
    setReprocessing(true);
    try {
      await candidatesApi.reprocess(candidate.id);
      setCandidate((p) => p ? { ...p, status: "processing" } : p);
    } finally {
      setReprocessing(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading candidate…" />;
  if (!candidate) return null;

  const analysis: AIAnalysis = candidate.ai_analysis ?? {};
  const skills = analysis.skills ?? [];
  const checks = analysis.compatibility_checks ?? [];
  const languages = analysis.languages ?? [];

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    acc[s.category] = [...(acc[s.category] ?? []), s];
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-screen">
      {/* ── Left: CV viewer ─────────────────────────────────────────────── */}
      <div className="w-[44%] min-h-screen bg-slate-100 border-r border-slate-200 flex flex-col">
        {/* Panel header */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-slate-200">
          <Link
            href={`/companies/${id}`}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft size={14} />
            {company?.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-800 truncate">{candidate.name}</span>
        </div>

        {/* CV iframe */}
        <div className="flex-1 relative">
          {candidate.cv_filename ? (
            <iframe
              src={candidatesApi.cvUrl(candidate.id)}
              className="w-full h-full border-0"
              title={`CV of ${candidate.name}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <FileText size={48} className="opacity-30" />
              <p className="text-sm">No CV uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: AI Analysis panel ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            {/* Candidate info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                {candidate.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{candidate.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                  {candidate.email && <span>{candidate.email}</span>}
                  {candidate.phone && <span>{candidate.phone}</span>}
                  <StatusBadge status={candidate.status} />
                </div>
              </div>
            </div>

            {/* Score + actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <CompatibilityBadge score={candidate.compatibility_score} size="lg" />
                <RiskBadge risk={candidate.risk_level} />
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={reportsApi.candidatePdfUrl(candidate.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <Download size={13} /> PDF
                </a>
                {candidate.cv_filename && (
                  <button
                    onClick={handleReprocess}
                    disabled={reprocessing || candidate.status === "processing"}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={candidate.status === "processing" ? "animate-spin" : ""} />
                    Re-analyse
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition",
                activeTab === tabId
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {candidate.status === "processing" && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin shrink-0" />
              AI is analysing the CV… This may take up to 30 seconds.
            </div>
          )}

          {candidate.status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
              <strong>Analysis failed:</strong> {candidate.error_message ?? "Unknown error"}
            </div>
          )}

          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <>
              {/* Profile summary */}
              {analysis.profile_summary && (
                <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] rounded-2xl p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">AI Profile Summary</p>
                  <p className="text-sm leading-relaxed">{analysis.profile_summary}</p>
                  {analysis._meta && (
                    <p className="text-xs opacity-40 mt-3">
                      Analysed by {analysis._meta.provider} · {analysis._meta.cached ? "cached" : "fresh"}
                    </p>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Experience", value: `${candidate.experience_years ?? "—"} yrs` },
                  { label: "Education", value: candidate.education_level ?? "—" },
                  { label: "Skills Found", value: String(skills.length) },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-xs text-slate-400 font-medium mb-1">{stat.label}</div>
                    <div className="font-bold text-slate-800 text-sm">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Compatibility checks */}
              {checks.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                    Compatibility Checks
                    <span className="text-xs font-normal text-slate-400">({checks.length} criteria)</span>
                  </h3>
                  <div className="space-y-2">
                    {checks.map((check, i) => (
                      <CompatibilityCheckCard key={i} check={check} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Skills Tab ── */}
          {activeTab === "skills" && (
            <>
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category}>
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-2">{category}</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {catSkills.map((s, i) => <SkillCard key={i} skill={s} />)}
                  </div>
                </div>
              ))}
              {skills.length === 0 && (
                <div className="text-center text-slate-400 py-16 text-sm">No skills extracted yet.</div>
              )}
            </>
          )}

          {/* ── Analysis Tab ── */}
          {activeTab === "analysis" && (
            <>
              <AnalysisParagraph label="Education" icon={BookOpen} text={analysis.education_analysis} />
              <AnalysisParagraph label="Experience" icon={Briefcase} text={analysis.experience_analysis} />
              <AnalysisParagraph label="Soft Skills" icon={MessageSquare} text={analysis.soft_skills_analysis} />
              <AnalysisParagraph label="Strengths" icon={Star} text={analysis.strengths_analysis} />
              <AnalysisParagraph label="Weaknesses & Gaps" icon={AlertTriangle} text={analysis.weaknesses_analysis} />
              <AnalysisParagraph label="Risk Assessment" icon={AlertTriangle} text={analysis.risk_assessment} />
            </>
          )}

          {/* ── Languages Tab ── */}
          {activeTab === "languages" && (
            <div className="space-y-3">
              {languages.map((lang, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4">
                  <Globe size={18} className="text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{lang.language}</span>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{lang.level}</span>
                    </div>
                    {lang.evidence && (
                      <p className="text-xs text-slate-500 leading-relaxed">{lang.evidence}</p>
                    )}
                  </div>
                </div>
              ))}
              {languages.length === 0 && (
                <div className="text-center text-slate-400 py-16 text-sm">No languages extracted yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
