"use client";

import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  body?: string;
  response?: string;
  params?: string;
}

interface Section {
  title: string;
  endpoints: Endpoint[];
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

const SECTIONS: Section[] = [
  {
    title: "Health",
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        description: "Check server status.",
        response: `{ "status": "ok", "service": "Boarding AI Backoffice" }`,
      },
    ],
  },
  {
    title: "Companies",
    endpoints: [
      { method: "GET", path: "/api/companies", description: "List all companies.", response: "[Company, …]" },
      {
        method: "GET",
        path: "/api/companies/:id",
        description: "Get a company with its full candidate list.",
        response: "Company { …, candidates: [Candidate, …] }",
      },
      {
        method: "POST",
        path: "/api/companies",
        description: "Create a new company.",
        body: `{ "name": "TechNova GmbH", "industry": "Software", "location": "Berlin", "required_skills": ["Python", "English"], "min_experience_years": 0 }`,
        response: "Company",
      },
      {
        method: "PUT",
        path: "/api/companies/:id",
        description: "Update company fields.",
        body: `{ "name": "…", "required_skills": ["…"] }`,
        response: "Company",
      },
      { method: "DELETE", path: "/api/companies/:id", description: "Delete company and all its candidates.", response: `{ "message": "Company deleted" }` },
    ],
  },
  {
    title: "Candidates",
    endpoints: [
      {
        method: "GET",
        path: "/api/candidates",
        description: "List all candidates. Filter by company with ?company_id=.",
        params: "company_id (optional integer)",
        response: "[Candidate, …]",
      },
      { method: "GET", path: "/api/candidates/:id", description: "Get a candidate with full AI analysis.", response: "Candidate { …, ai_analysis: AIAnalysis }" },
      {
        method: "POST",
        path: "/api/candidates",
        description: "Create a candidate and optionally upload + process their CV. Accepts multipart/form-data.",
        body: "company_id (int, required), name (string, required), email, phone, cv (file PDF, optional)",
        response: "Candidate { status: 'pending' | 'processing' }",
      },
      { method: "POST", path: "/api/candidates/:id/reprocess", description: "Re-run AI analysis on an existing CV.", response: `{ "message": "Reprocessing started" }` },
      { method: "PUT", path: "/api/candidates/:id", description: "Update candidate metadata.", body: `{ "name": "…", "email": "…", "phone": "…" }`, response: "Candidate" },
      { method: "DELETE", path: "/api/candidates/:id", description: "Delete a candidate.", response: `{ "message": "Candidate deleted" }` },
      { method: "GET", path: "/api/candidates/:id/cv", description: "Stream the raw PDF CV file.", response: "PDF binary stream" },
    ],
  },
  {
    title: "Reports",
    endpoints: [
      { method: "GET", path: "/api/reports/candidates/:id/pdf", description: "Download detailed PDF report for one candidate.", response: "PDF" },
      { method: "GET", path: "/api/reports/companies/:id/pdf", description: "Download batch summary PDF for all company candidates.", response: "PDF" },
      { method: "GET", path: "/api/reports/companies/:id/csv", description: "Download CSV export for all company candidates.", response: "CSV" },
      { method: "GET", path: "/api/reports/candidates/csv", description: "Download CSV for all candidates. Filter with ?company_id=.", params: "company_id (optional integer)", response: "CSV" },
    ],
  },
  {
    title: "Settings",
    endpoints: [
      { method: "GET", path: "/api/settings", description: "Get all settings grouped by category.", response: `{ "ai": [Setting, …], "matching": [Setting, …], "ui": [Setting, …] }` },
      { method: "PUT", path: "/api/settings", description: "Bulk update settings.", body: `[{ "key": "llm_provider", "value": "ollama" }, …]`, response: `{ "updated": ["llm_provider", …] }` },
      { method: "GET", path: "/api/settings/:key", description: "Get a single setting.", response: "Setting" },
      { method: "PUT", path: "/api/settings/:key", description: "Update a single setting.", body: `{ "value": "gemini" }`, response: "Setting" },
    ],
  },
];

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
      >
        <span className={clsx("text-[11px] font-bold rounded-md px-2 py-0.5 shrink-0", METHOD_COLORS[ep.method])}>
          {ep.method}
        </span>
        <code className="text-sm font-mono text-slate-700 flex-1">{ep.path}</code>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-3">
          <p className="text-sm text-slate-600">{ep.description}</p>
          {ep.params && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Query Params</p>
              <code className="text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 block">{ep.params}</code>
            </div>
          )}
          {ep.body && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Request Body</p>
              <pre className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre-wrap">{ep.body}</pre>
            </div>
          )}
          {ep.response && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Response</p>
              <pre className="text-xs text-green-800 bg-green-50 border border-green-100 px-3 py-2 rounded-lg overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={22} className="text-blue-600" />
          API Documentation
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          REST API — Base URL: <code className="font-mono text-blue-600">http://localhost:5000</code>
        </p>
      </div>

      {/* Auth note */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
        <strong>Note:</strong> All endpoints return <code>application/json</code> unless otherwise stated. Authentication is not required in the current version (internal use only).
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="font-bold text-lg text-slate-800 mb-3 pb-2 border-b border-slate-200">{section.title}</h2>
            <div className="space-y-2">
              {section.endpoints.map((ep, i) => (
                <EndpointCard key={i} ep={ep} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
