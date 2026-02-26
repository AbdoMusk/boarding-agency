"""
CV parsing pipeline.

Converts a PDF → images → OCR text → structured AI analysis JSON.
The JSON output is paragraph-based and insight-first (aligned with the
TODO.md reference: traffic-light checks, skill cards with evidence, etc.)
"""
import json
import hashlib
import os
from pathlib import Path
from pdf2image import convert_from_path

from app.services.llm.factory import get_provider
from app.services.cache import cached_llm_call
from app.config import ACTIVE_CONFIG as cfg


# ─── Prompt Templates ──────────────────────────────────────────────────────────

STRUCTURE_PROMPT = """You are an expert recruitment AI for Boarding Agency, a startup helping students secure international internships.

Analyse the following CV text and return a STRICT JSON object (no markdown, no extra text).

The JSON must follow this exact schema:

{{
  "name": "Full name of the candidate",
  "email": "email address or null",
  "phone": "phone number or null",
  "profile_summary": "A rich 3-5 sentence paragraph that synthesises the candidate's overall profile, background, and positioning. Write as if briefing an advisor before a meeting.",
  "experience_years": 1.5,
  "education_level": "Bachelor / Master / PhD / High School / Other",
  "education_analysis": "A 2-4 sentence paragraph describing the candidate's academic background, institutions, specialisation, and relevance to an international internship context.",
  "experience_analysis": "A 3-5 sentence paragraph describing the candidate's work/internship experience, highlighting the most relevant positions, responsibilities, and what they demonstrate about the candidate's readiness.",
  "soft_skills_analysis": "A 2-3 sentence paragraph on interpersonal, communication, and organisational abilities evident from the CV.",
  "strengths_analysis": "A 2-3 sentence paragraph on the candidate's most valuable strengths for an international internship.",
  "weaknesses_analysis": "A 2-3 sentence paragraph on gaps or areas the advisor should probe during the advisory session.",
  "risk_assessment": "A 2-3 sentence paragraph evaluating the probability of successful placement and integration, citing any red flags.",
  "languages": [
    {{"language": "English", "level": "B2", "evidence": "Listed IELTS 6.5 on CV"}}
  ],
  "skills": [
    {{
      "name": "Python",
      "category": "Tech Stack",
      "level": 3,
      "level_label": "Strong",
      "evidence": "The exact sentence or project from the CV that proves this skill. Be specific.",
      "requirement_desc": "General requirement for international internship candidates"
    }}
  ],
  "compatibility_checks": [
    {{
      "criteria": "Education Level",
      "status": "compatible",
      "explanation": "2-3 sentences explaining why this criteria is met, partially met, or not met, citing evidence from the CV."
    }},
    {{
      "criteria": "Years of Experience",
      "status": "partial",
      "explanation": "..."
    }},
    {{
      "criteria": "Communication Skills",
      "status": "compatible",
      "explanation": "..."
    }},
    {{
      "criteria": "International Readiness",
      "status": "compatible",
      "explanation": "..."
    }},
    {{
      "criteria": "Technical Skills",
      "status": "incompatible",
      "explanation": "..."
    }}
  ],
  "compatibility_score": 75,
  "risk_level": "Low"
}}

Rules:
- Skill level: 1 = Basic, 2 = Intermediate, 3 = Strong
- Skill level_label: "Basic" | "Average" | "Strong"
- compatibility_checks status: "compatible" | "partial" | "incompatible"
- compatibility_score: integer 0-100
- risk_level: "Low" | "Medium" | "High"
- For every skill, extract the EXACT evidence sentence from the CV. Do NOT invent evidence.
- If information is not available, use null for that field.
- Respond ONLY with the JSON object. No markdown fences. No explanation.

REQUIRED SKILLS TO EVALUATE (add more if found): {required_skills}
MINIMUM EXPERIENCE REQUIRED: {min_experience} years

CV TEXT:
{cv_text}
"""


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _pdf_to_images(pdf_path: str, images_folder: str) -> list[str]:
    """Convert PDF pages to PNG images. Returns list of image file paths."""
    os.makedirs(images_folder, exist_ok=True)
    pages = convert_from_path(pdf_path, dpi=cfg.PDF_DPI)
    image_paths = []
    stem = Path(pdf_path).stem
    for i, page in enumerate(pages):
        img_path = os.path.join(images_folder, f"{stem}_{i}.png")
        page.save(img_path, "PNG")
        image_paths.append(img_path)
    return image_paths


def _ocr_images(image_paths: list[str]) -> str:
    """Run OCR on all images and concatenate results."""
    provider = get_provider()
    full_text = ""
    for img_path in image_paths:
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        # Cache key: hash of image bytes
        cache_key = f"ocr:{hashlib.sha256(img_bytes).hexdigest()}"
        ocr_text, from_cache = cached_llm_call(
            cache_key,
            lambda b=img_bytes: provider.ocr_image(b, mime_type="image/png"),
        )
        full_text += ocr_text + "\n"
    return full_text


def _safe_parse_json(raw: str) -> dict:
    """Extract the JSON object from the LLM response."""
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON found in LLM response. Raw: {raw[:300]}")
    return json.loads(raw[start:end])


# ─── Public API ────────────────────────────────────────────────────────────────

def parse_cv_file(
    pdf_path: str,
    required_skills: list[str] | None = None,
    min_experience: float = 0.0,
    images_folder: str | None = None,
) -> dict:
    """
    Full pipeline: PDF → images → OCR → AI structuring → dict.

    Args:
        pdf_path: absolute path to the PDF file.
        required_skills: list of skills to evaluate against.
        min_experience: minimum years of experience for compatibility check.
        images_folder: where to store extracted page images.

    Returns:
        Structured analysis dict.
    """
    images_folder = images_folder or cfg.IMAGES_FOLDER
    required_skills = required_skills or cfg.DEFAULT_REQUIRED_SKILLS
    min_experience = min_experience or cfg.DEFAULT_MIN_EXPERIENCE

    # Step 1: PDF → images
    image_paths = _pdf_to_images(pdf_path, images_folder)

    # Step 2: OCR
    cv_text = _ocr_images(image_paths)

    if not cv_text.strip():
        raise ValueError("OCR returned empty text. The PDF may be corrupted or unsupported.")

    # Step 3: Structure with LLM
    provider = get_provider()
    prompt = STRUCTURE_PROMPT.format(
        required_skills=", ".join(required_skills),
        min_experience=min_experience,
        cv_text=cv_text,
    )
    cache_key = f"structure:{hashlib.sha256(prompt.encode()).hexdigest()}"
    raw_response, from_cache = cached_llm_call(
        cache_key,
        lambda: provider.generate(prompt),
    )

    # Step 4: Parse JSON
    analysis = _safe_parse_json(raw_response)

    # Step 5: Derive/normalise compatibility_score & risk_level
    analysis = _normalise_analysis(analysis, required_skills, min_experience)
    analysis["_meta"] = {
        "provider": provider.provider_name,
        "cached": from_cache,
        "required_skills": required_skills,
        "min_experience_years": min_experience,
    }

    return analysis


def parse_cv_text(
    cv_text: str,
    required_skills: list[str] | None = None,
    min_experience: float = 0.0,
) -> dict:
    """
    Run only the analysis step on already-extracted text (skips OCR).
    Useful if you already have the text.
    """
    required_skills = required_skills or cfg.DEFAULT_REQUIRED_SKILLS

    provider = get_provider()
    prompt = STRUCTURE_PROMPT.format(
        required_skills=", ".join(required_skills),
        min_experience=min_experience,
        cv_text=cv_text,
    )
    cache_key = f"structure:{hashlib.sha256(prompt.encode()).hexdigest()}"
    raw_response, from_cache = cached_llm_call(
        cache_key,
        lambda: provider.generate(prompt),
    )
    analysis = _safe_parse_json(raw_response)
    analysis = _normalise_analysis(analysis, required_skills, min_experience)
    analysis["_meta"] = {
        "provider": provider.provider_name,
        "cached": from_cache,
        "required_skills": required_skills,
        "min_experience_years": min_experience,
    }
    return analysis


def _normalise_analysis(analysis: dict, required_skills: list[str], min_experience: float) -> dict:
    """
    Compute/override compatibility_score and risk_level based on
    the compatibility_checks returned by the LLM, as a safety net.
    Also sanitize data to ensure no None values in fields that will be serialized.
    """
    # Sanitize string fields to prevent None values from reaching report generators
    string_fields = [
        "name", "email", "phone", "profile_summary", "education_level",
        "education_analysis", "experience_analysis", "soft_skills_analysis",
        "strengths_analysis", "weaknesses_analysis", "risk_assessment"
    ]
    for field in string_fields:
        if field in analysis and analysis[field] is None:
            analysis[field] = ""
    
    # Sanitize skills array
    if "skills" in analysis and isinstance(analysis["skills"], list):
        for skill in analysis["skills"]:
            if isinstance(skill, dict):
                for key in ["name", "category", "level_label", "evidence", "requirement_desc"]:
                    if key in skill and skill[key] is None:
                        skill[key] = ""
    
    # Sanitize languages array
    if "languages" in analysis and isinstance(analysis["languages"], list):
        for lang in analysis["languages"]:
            if isinstance(lang, dict):
                for key in ["language", "level", "evidence"]:
                    if key in lang and lang[key] is None:
                        lang[key] = ""
    
    # Sanitize compatibility checks
    if "compatibility_checks" in analysis and isinstance(analysis["compatibility_checks"], list):
        for check in analysis["compatibility_checks"]:
            if isinstance(check, dict):
                for key in ["criteria", "explanation"]:
                    if key in check and check[key] is None:
                        check[key] = ""
    
    # Compute compatibility score
    checks = analysis.get("compatibility_checks", [])
    if checks:
        compatible_count = sum(1 for c in checks if c.get("status") == "compatible")
        partial_count = sum(1 for c in checks if c.get("status") == "partial")
        total = len(checks)
        if total > 0:
            score = int(((compatible_count + partial_count * 0.5) / total) * 100)
            analysis["compatibility_score"] = score
        else:
            score = analysis.get("compatibility_score", 50)
    else:
        score = analysis.get("compatibility_score", 50)

    if "risk_level" not in analysis or not analysis["risk_level"]:
        if score >= 70:
            analysis["risk_level"] = "Low"
        elif score >= 40:
            analysis["risk_level"] = "Medium"
        else:
            analysis["risk_level"] = "High"

    return analysis
