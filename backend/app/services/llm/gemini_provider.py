"""
Google Gemini (Cloud) LLM provider.
Uses the google-genai SDK with Google AI Studio.
"""
from google import genai
from google.genai import types
from app.services.llm.base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-3-flash-preview"):
        self._client = genai.Client(api_key=api_key)
        self._model = model

    @property
    def provider_name(self) -> str:
        return f"Gemini ({self._model})"

    def ocr_image(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        response = self._client.models.generate_content(
            model=self._model,
            contents=[
                (
                    "Extract ALL text from this image exactly as written. "
                    "Include text in margins, headers, footers, and sidebars. "
                    "Preserve line breaks. Do not summarise or skip anything."
                ),
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )
        return response.text

    def generate(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
        )
        return response.text
