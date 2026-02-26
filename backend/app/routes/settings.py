from flask import Blueprint, jsonify, request
from app.database import db
from app.models import AppSettings
from app.services.llm.factory import clear_provider_cache

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

# Default settings seeded on first access
DEFAULT_SETTINGS = [
    {"key": "llm_provider", "value": "gemini", "description": "Active LLM provider: gemini or ollama", "category": "ai"},
    {"key": "gemini_model", "value": "gemini-3-flash-preview", "description": "Gemini model name", "category": "ai"},
    {"key": "ollama_ocr_model", "value": "glm-ocr", "description": "Ollama OCR model name", "category": "ai"},
    {"key": "ollama_llm_model", "value": "gemma3", "description": "Ollama LLM model name", "category": "ai"},
    {"key": "ollama_base_url", "value": "http://localhost:11434", "description": "Ollama server URL", "category": "ai"},
    {"key": "cache_strategy", "value": "file", "description": "Cache strategy: memory, file, or redis", "category": "ai"},
    {"key": "cache_ttl_seconds", "value": "86400", "description": "Cache TTL in seconds (default: 24h)", "category": "ai"},
    {"key": "default_required_skills", "value": "communication,teamwork,english", "description": "Comma-separated default required skills", "category": "matching"},
    {"key": "default_min_experience", "value": "0", "description": "Default minimum years of experience", "category": "matching"},
    {"key": "pdf_dpi", "value": "200", "description": "DPI for PDF to image conversion", "category": "ai"},
    {"key": "dashboard_title", "value": "Boarding AI Backoffice", "description": "Dashboard title shown in the UI", "category": "ui"},
    {"key": "primary_color", "value": "#1E3A5F", "description": "Dashboard primary colour (hex)", "category": "ui"},
    {"key": "accent_color", "value": "#2563EB", "description": "Dashboard accent colour (hex)", "category": "ui"},
]


def _ensure_defaults():
    for s in DEFAULT_SETTINGS:
        if not AppSettings.query.filter_by(key=s["key"]).first():
            db.session.add(AppSettings(**s))
    db.session.commit()


@settings_bp.route("", methods=["GET"])
def get_settings():
    """Return all settings grouped by category."""
    _ensure_defaults()
    settings = AppSettings.query.order_by(AppSettings.category, AppSettings.key).all()
    result: dict = {}
    for s in settings:
        result.setdefault(s.category, []).append(s.to_dict())
    return jsonify(result)


@settings_bp.route("", methods=["PUT"])
def update_settings():
    """
    Bulk update settings.
    Body: [{"key": "llm_provider", "value": "ollama"}, ...]
    """
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Expected a JSON array of {key, value} objects"}), 400

    updated = []
    provider_changed = False
    for item in data:
        key = item.get("key")
        value = item.get("value")
        if not key:
            continue
        AppSettings.set(key, value)
        updated.append(key)
        if key == "llm_provider":
            provider_changed = True

    if provider_changed:
        clear_provider_cache()

    return jsonify({"updated": updated})


@settings_bp.route("/<string:key>", methods=["GET"])
def get_setting(key):
    s = AppSettings.query.filter_by(key=key).first_or_404()
    return jsonify(s.to_dict())


@settings_bp.route("/<string:key>", methods=["PUT"])
def update_setting(key):
    data = request.get_json()
    value = data.get("value")
    AppSettings.set(key, value)
    if key == "llm_provider":
        clear_provider_cache()
    s = AppSettings.query.filter_by(key=key).first()
    return jsonify(s.to_dict())
