"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { settingsApi } from "@/lib/api";
import type { SettingsMap, AppSetting } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Save, Settings as SettingsIcon, RefreshCw } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI & LLM Configuration",
  matching: "Matching Rules",
  ui: "UI Customisation",
  general: "General",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.list();
      setSettings(data);
      setDirty({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setDirty((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(dirty).map(([key, value]) => ({ key, value }));
      if (updates.length > 0) {
        await settingsApi.updateBulk(updates);
        setSaved(true);
        fetchSettings();
      }
    } finally {
      setSaving(false);
    }
  };

  const getValue = (s: AppSetting) => dirty[s.key] ?? s.value ?? "";

  const input =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white";

  if (loading) return <LoadingSpinner label="Loading settings…" />;

  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon size={22} className="text-blue-600" />
            Settings
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure AI providers, matching rules, and UI preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 transition"
          >
            <RefreshCw size={15} />
          </button>
          {hasDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-sm"
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
          {saved && !hasDirty && (
            <span className="text-sm font-semibold text-green-600">✓ Saved</span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(settings).map(([category, items]) => (
          <div key={category} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-sm text-slate-700">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((s) => (
                <div key={s.key} className="flex items-start gap-6 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <label className="block font-semibold text-sm text-slate-800 mb-0.5">
                      {s.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </label>
                    {s.description && (
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">{s.description}</p>
                    )}
                    {/* Smart rendering based on key */}
                    {s.key === "llm_provider" ? (
                      <select
                        className={input}
                        value={getValue(s)}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                      >
                        <option value="gemini">Gemini (Cloud – Google AI Studio)</option>
                        <option value="ollama">Ollama (Local)</option>
                      </select>
                    ) : s.key === "cache_strategy" ? (
                      <select
                        className={input}
                        value={getValue(s)}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                      >
                        <option value="file">File (default)</option>
                        <option value="memory">Memory</option>
                        <option value="redis">Redis</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className={clsx(input, dirty[s.key] !== undefined && "ring-2 ring-blue-300")}
                        value={getValue(s)}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
