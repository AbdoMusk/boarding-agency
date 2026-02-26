export interface Company {
  id: number;
  name: string;
  industry?: string;
  location?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  job_requirements?: Record<string, string>;
  required_skills: string[];
  min_experience_years: number;
  candidate_count: number;
  created_at?: string;
  updated_at?: string;
  candidates?: Candidate[];
}

export interface Language {
  language: string;
  level: string;
  evidence: string;
}

export interface Skill {
  name: string;
  category: string;
  level: 1 | 2 | 3;
  level_label: "Basic" | "Average" | "Strong";
  evidence: string;
  requirement_desc: string;
}

export interface CompatibilityCheck {
  criteria: string;
  status: "compatible" | "partial" | "incompatible";
  explanation: string;
}

export interface AIAnalysis {
  name?: string;
  email?: string;
  phone?: string;
  profile_summary?: string;
  experience_years?: number;
  education_level?: string;
  education_analysis?: string;
  experience_analysis?: string;
  soft_skills_analysis?: string;
  strengths_analysis?: string;
  weaknesses_analysis?: string;
  risk_assessment?: string;
  languages?: Language[];
  skills?: Skill[];
  compatibility_checks?: CompatibilityCheck[];
  compatibility_score?: number;
  risk_level?: "Low" | "Medium" | "High";
  _meta?: {
    provider: string;
    cached: boolean;
    required_skills: string[];
    min_experience_years: number;
  };
}

export interface Candidate {
  id: number;
  company_id: number;
  name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  cv_filename?: string;
  compatibility_score?: number;
  risk_level?: "Low" | "Medium" | "High";
  experience_years?: number;
  education_level?: string;
  status: "pending" | "processing" | "done" | "error";
  error_message?: string;
  ai_analysis?: AIAnalysis;
  created_at?: string;
  updated_at?: string;
}

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  updated_at?: string;
}

export type SettingsMap = Record<string, AppSetting[]>;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
