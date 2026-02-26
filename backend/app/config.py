"""
Configuration management for the Boarding AI Backoffice.
Supports switching between Gemini (cloud) and Ollama (local) LLM providers.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Flask ──────────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "boarding-ai-secret-change-in-prod")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///boarding.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── LLM Provider ───────────────────────────────────────────────────────
    # Switch with env var: LLM_PROVIDER=gemini | ollama
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" | "ollama"

    # Gemini (Cloud - Google AI Studio)
    GOOGLE_AI_STUDIO_API_KEY = os.getenv("GOOGLE_AI_STUDIO_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

    # Ollama (Local)
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_OCR_MODEL = os.getenv("OLLAMA_OCR_MODEL", "glm-ocr")
    OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3")

    # ── Caching ────────────────────────────────────────────────────────────
    # Strategy: "memory" | "redis" | "file"
    CACHE_STRATEGY = os.getenv("CACHE_STRATEGY", "file")
    CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "86400"))  # 24h default
    CACHE_DIR = os.getenv("CACHE_DIR", "cache")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ── File Storage ───────────────────────────────────────────────────────
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    IMAGES_FOLDER = os.getenv("IMAGES_FOLDER", "images")
    OUTPUTS_FOLDER = os.getenv("OUTPUTS_FOLDER", "outputs")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

    # ── PDF Conversion ─────────────────────────────────────────────────────
    PDF_DPI = int(os.getenv("PDF_DPI", "200"))

    # ── CORS ───────────────────────────────────────────────────────────────
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # ── Default Matching Rules ─────────────────────────────────────────────
    DEFAULT_REQUIRED_SKILLS = os.getenv(
        "DEFAULT_REQUIRED_SKILLS", "communication,teamwork,english"
    ).split(",")
    DEFAULT_MIN_EXPERIENCE = int(os.getenv("DEFAULT_MIN_EXPERIENCE", "0"))

    @classmethod
    def validate(cls):
        """Validate critical settings at startup."""
        if cls.LLM_PROVIDER == "gemini" and not cls.GOOGLE_AI_STUDIO_API_KEY:
            raise ValueError(
                "LLM_PROVIDER is 'gemini' but GOOGLE_AI_STUDIO_API_KEY is not set. "
                "Add it to your .env file or switch LLM_PROVIDER=ollama."
            )
        return True


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

ACTIVE_CONFIG = config_map.get(os.getenv("FLASK_ENV", "default"), DevelopmentConfig)
