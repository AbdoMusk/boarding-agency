# Boarding AI Backoffice

An AI-powered recruitment backoffice for Boarding Agency — helping advisors make smarter, faster placement decisions.

---

## Project Structure

```
boarding-agency/
├── backend/                  # Python Flask API
│   ├── app/
│   │   ├── config.py         # All configuration (LLM, DB, caching…)
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── models.py         # Company, Candidate, AppSettings
│   │   ├── routes/           # Flask blueprints (companies, candidates, reports, settings)
│   │   └── services/
│   │       ├── llm/          # Modular LLM providers
│   │       │   ├── base.py          # Abstract interface
│   │       │   ├── gemini_provider.py   # Google Gemini (cloud)
│   │       │   ├── ollama_provider.py   # Ollama (local)
│   │       │   └── factory.py       # Provider factory (switch via settings)
│   │       ├── cv_parser.py  # Full CV processing pipeline
│   │       ├── cache.py      # File / Memory / Redis caching
│   │       └── report_generator.py  # PDF & CSV generation (ReportLab)
│   ├── seed.py               # Demo seed data
│   ├── run.py                # Entry point
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                 # Next.js 15 (App Router + Tailwind CSS)
│   └── src/
│       ├── app/
│       │   ├── companies/    # Companies list + Company detail
│       │   │   └── [id]/
│       │   │       └── candidates/[candidateId]/  # Split-view AI analysis
│       │   ├── settings/     # Runtime settings page
│       │   └── api-docs/     # Interactive API documentation
│       ├── components/
│       │   ├── layout/       # Sidebar
│       │   ├── companies/    # CompanyCard, CompanyFormModal
│       │   ├── candidates/   # SkillCard, CompatibilityCheckCard, RiskBadge…
│       │   └── ui/           # StatusBadge, LoadingSpinner
│       ├── lib/api.ts        # Typed API client (axios)
│       └── types/index.ts    # Shared TypeScript types
│
├── cvs/                      # Drop PDFs here for manual processing
├── main_gemini.py            # Standalone Gemini CV processor (legacy)
└── main.py                   # Standalone Ollama CV processor (legacy)
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtualenv
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your GOOGLE_AI_STUDIO_API_KEY

# Seed demo data (companies + candidates)
python seed.py

# Start the API server
python run.py
```

Backend runs at: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## Switching LLM Provider

You can switch between **Gemini** (cloud) and **Ollama** (local) in two ways:

**Via `.env`:**
```env
LLM_PROVIDER=gemini   # or: ollama
```

**Via the UI Settings page:** → Go to `Settings → AI & LLM Configuration → llm_provider`

No restart required when changed via the UI.

---

## LLM Provider Setup

### Gemini (Cloud — Default)
1. Get a key at https://aistudio.google.com/
2. Set `GOOGLE_AI_STUDIO_API_KEY=your_key` in `.env`
3. Set `LLM_PROVIDER=gemini`

### Ollama (Local)
1. Install Ollama: https://ollama.ai
2. Pull the models:
   ```bash
   ollama pull glm-ocr   # OCR
   ollama pull gemma3    # LLM
   ```
3. Set `LLM_PROVIDER=ollama` in `.env`

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies |
| POST | `/api/companies` | Create company |
| GET | `/api/companies/:id` | Company with candidates |
| POST | `/api/candidates` | Upload CV + create candidate |
| GET | `/api/candidates/:id` | Candidate with AI analysis |
| POST | `/api/candidates/:id/reprocess` | Re-run AI analysis |
| GET | `/api/reports/candidates/:id/pdf` | PDF report |
| GET | `/api/reports/companies/:id/csv` | CSV export |
| GET | `/api/settings` | All settings |
| PUT | `/api/settings` | Bulk update settings |

Full interactive docs available at `/api-docs` in the dashboard.

---

## Tech Stack

### Backend
- **Python + Flask** — REST API
- **SQLAlchemy + SQLite** (swap to PostgreSQL via `DATABASE_URL`)
- **Google Gemini** / **Ollama** — Modular LLM provider (switchable)
- **ReportLab** — PDF generation
- **File/Memory/Redis cache** — LLM call deduplication

### Frontend
- **Next.js 15** (App Router)
- **Tailwind CSS v4**
- **TypeScript**
- **Axios** — API client
- **Lucide React** — Icons

---

## AI Analysis Output

The AI produces insight-first, paragraph-based analysis including:

- **Profile Summary** — 3-5 sentence briefing paragraph
- **Compatibility Checks** — Traffic-light system (✓ compatible / ~ partial / ✗ incompatible)
- **Skill Cards** — Category, level bars (1-3), evidence extracted from CV
- **Paragraph Analyses** — Education, Experience, Soft Skills, Strengths, Weaknesses, Risk Assessment
- **Languages** — With proficiency level and CV evidence
- **Compatibility Score** — 0–100% based on checks
- **Risk Level** — Low / Medium / High

---

## Caching

LLM calls are cached to avoid redundant API costs. Cache strategy is configurable:

| Strategy | Description |
|----------|-------------|
| `file` | File-based cache in `cache/` dir (default) |
| `memory` | In-process memory cache (resets on restart) |
| `redis` | Redis (`REDIS_URL` required) |

Cache key = SHA-256 of the input content — identical CV files always hit the cache.
