import axios from "axios";
import type { Company, Candidate, SettingsMap, AppSetting } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// ── Companies ──────────────────────────────────────────────────────────────────
export const companiesApi = {
  list: (): Promise<Company[]> =>
    api.get("/api/companies").then((r) => r.data),

  get: (id: number): Promise<Company> =>
    api.get(`/api/companies/${id}`).then((r) => r.data),

  create: (data: Partial<Company>): Promise<Company> =>
    api.post("/api/companies", data).then((r) => r.data),

  update: (id: number, data: Partial<Company>): Promise<Company> =>
    api.put(`/api/companies/${id}`, data).then((r) => r.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/api/companies/${id}`).then((r) => r.data),
};

// ── Candidates ─────────────────────────────────────────────────────────────────
export const candidatesApi = {
  list: (companyId?: number): Promise<Candidate[]> =>
    api
      .get("/api/candidates", { params: companyId ? { company_id: companyId } : {} })
      .then((r) => r.data),

  get: (id: number): Promise<Candidate> =>
    api.get(`/api/candidates/${id}`).then((r) => r.data),

  create: (formData: FormData): Promise<Candidate> =>
    api.post("/api/candidates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: number, data: Partial<Candidate>): Promise<Candidate> =>
    api.put(`/api/candidates/${id}`, data).then((r) => r.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/api/candidates/${id}`).then((r) => r.data),

  reprocess: (id: number): Promise<{ message: string }> =>
    api.post(`/api/candidates/${id}/reprocess`).then((r) => r.data),

  cvUrl: (id: number): string => `${BASE_URL}/api/candidates/${id}/cv`,
};

// ── Reports ────────────────────────────────────────────────────────────────────
export const reportsApi = {
  candidatePdfUrl: (id: number): string =>
    `${BASE_URL}/api/reports/candidates/${id}/pdf`,

  companyPdfUrl: (id: number): string =>
    `${BASE_URL}/api/reports/companies/${id}/pdf`,

  companyCsvUrl: (id: number): string =>
    `${BASE_URL}/api/reports/companies/${id}/csv`,
};

// ── Settings ───────────────────────────────────────────────────────────────────
export const settingsApi = {
  list: (): Promise<SettingsMap> =>
    api.get("/api/settings").then((r) => r.data),

  updateBulk: (settings: { key: string; value: string }[]): Promise<{ updated: string[] }> =>
    api.put("/api/settings", settings).then((r) => r.data),

  update: (key: string, value: string): Promise<AppSetting> =>
    api.put(`/api/settings/${key}`, { value }).then((r) => r.data),
};

export default api;
