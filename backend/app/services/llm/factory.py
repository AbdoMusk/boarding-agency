"""
LLM Provider factory.
Call get_provider() to get the currently configured provider.
Provider is selected by the runtime AppSettings table (allows hot-switch from UI)
falling back to the Config class defaults.
"""
from flask import current_app
from app.services.llm.base import BaseLLMProvider
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.ollama_provider import OllamaProvider


_provider_cache: dict[str, BaseLLMProvider] = {}


def get_provider(override: str | None = None) -> BaseLLMProvider:
    """
    Return a cached LLM provider instance.

    Priority:
      1. `override` argument (e.g. passed from route)
      2. AppSettings table key 'llm_provider'  (set via UI)
      3. Config.LLM_PROVIDER  (from .env)
    """
    # Import here to avoid circular imports
    from app.config import ACTIVE_CONFIG as cfg

    # Resolve which provider to use
    provider_name = override

    if not provider_name:
        try:
            from app.models import AppSettings
            provider_name = AppSettings.get("llm_provider") or cfg.LLM_PROVIDER
        except Exception:
            provider_name = cfg.LLM_PROVIDER

    provider_name = (provider_name or "gemini").lower()

    if provider_name not in _provider_cache:
        if provider_name == "gemini":
            _provider_cache[provider_name] = GeminiProvider(
                api_key=cfg.GOOGLE_AI_STUDIO_API_KEY,
                model=cfg.GEMINI_MODEL,
            )
        elif provider_name == "ollama":
            _provider_cache[provider_name] = OllamaProvider(
                base_url=cfg.OLLAMA_BASE_URL,
                ocr_model=cfg.OLLAMA_OCR_MODEL,
                llm_model=cfg.OLLAMA_LLM_MODEL,
            )
        else:
            raise ValueError(f"Unknown LLM provider: '{provider_name}'. Use 'gemini' or 'ollama'.")

    return _provider_cache[provider_name]


def clear_provider_cache():
    """Call this when settings change so the provider is re-instantiated."""
    _provider_cache.clear()


__all__ = ["get_provider", "clear_provider_cache"]
