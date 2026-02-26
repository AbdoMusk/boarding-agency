"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import { candidatesApi } from "@/lib/api";

interface Props {
  companyId: number;
  onClose: () => void;
  onCreated: () => void;
}

export default function CandidateUploadModal({ companyId, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Candidate name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("company_id", String(companyId));
      fd.append("name", form.name);
      if (form.email) fd.append("email", form.email);
      if (form.phone) fd.append("phone", form.phone);
      if (file) fd.append("cv", file);
      await candidatesApi.create(fd);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create candidate.");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">Add Candidate</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
            <input className={input} placeholder="e.g. Alice Moreau" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="email" className={input} placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input className={input} placeholder="+33 6 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">CV (PDF)</label>
            <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition group">
              <Upload size={20} className="text-slate-400 group-hover:text-blue-500 transition" />
              <div className="flex-1 min-w-0">
                {file ? (
                  <span className="text-sm font-semibold text-blue-600 truncate block">{file.name}</span>
                ) : (
                  <>
                    <span className="text-sm text-slate-500">Click to upload PDF</span>
                    <span className="block text-xs text-slate-400">CV will be processed by AI automatically</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-60">
              {loading ? "Uploading…" : "Add Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
