"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { companiesApi } from "@/lib/api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CompanyFormModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    description: "",
    website: "",
    required_skills: "",
    min_experience_years: "0",
    job_role: "",
    job_duration: "",
    job_description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await companiesApi.create({
        name: form.name,
        industry: form.industry || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
        website: form.website || undefined,
        min_experience_years: parseFloat(form.min_experience_years) || 0,
        required_skills: form.required_skills
          ? form.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        job_requirements: {
          role: form.job_role,
          duration: form.job_duration,
          description: form.job_description,
        },
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create company.");
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">New Company</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name *</label>
              <input className={input} placeholder="e.g. TechNova GmbH" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Industry</label>
              <input className={input} placeholder="e.g. Software" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
              <input className={input} placeholder="e.g. Berlin, Germany" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea className={`${input} h-20 resize-none`} placeholder="Company description…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Website</label>
              <input className={input} placeholder="https://…" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Experience (years)</label>
              <input type="number" min="0" step="0.5" className={input} value={form.min_experience_years} onChange={(e) => setForm({ ...form, min_experience_years: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Required Skills <span className="font-normal text-slate-400">(comma-separated)</span></label>
              <input className={input} placeholder="Python, Communication, English" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
            </div>
          </div>

          <hr className="border-slate-100" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Job Description</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <input className={input} placeholder="e.g. Software Engineering Intern" value={form.job_role} onChange={(e) => setForm({ ...form, job_role: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
              <input className={input} placeholder="e.g. 6 months" value={form.job_duration} onChange={(e) => setForm({ ...form, job_duration: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Job Description</label>
              <textarea className={`${input} h-20 resize-none`} placeholder="Describe the internship…" value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-60">
              {loading ? "Creating…" : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
