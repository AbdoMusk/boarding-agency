"""
Abstract base class for LLM providers.
All providers must implement the same interface so the rest of the codebase
is fully decoupled from the underlying model.
"""
from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    """Abstract LLM provider interface."""

    @abstractmethod
    def ocr_image(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        """
        Extract raw text from an image.
        Returns the extracted text as a plain string.
        """

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """
        Send a text prompt and return the model's response string.
        """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable name, e.g. 'Gemini Flash 2.0'."""
