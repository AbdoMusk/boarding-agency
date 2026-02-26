"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, Search, RefreshCw } from "lucide-react";
import { companiesApi } from "@/lib/api";
import type { Company } from "@/types";
import CompanyCard from "@/components/companies/CompanyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CompanyFormModal from "@/components/companies/CompanyFormModal";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companiesApi.list();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {companies.length} {companies.length !== 1 ? "companies" : "company"} · Manage placements and candidates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompanies}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Company
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner label="Loading companies…" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Building2 size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">No companies found</p>
          <p className="text-sm mt-1">Create your first company to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CompanyFormModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchCompanies();
          }}
        />
      )}
    </div>
  );
}
