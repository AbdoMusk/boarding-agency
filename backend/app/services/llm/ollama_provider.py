"""
Ollama (local) LLM provider.
Uses the ollama Python SDK to call locally running models.
"""
import base64
import ollama as _ollama
from app.services.llm.base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        ocr_model: str = "glm-ocr",
        llm_model: str = "gemma3",
    ):
        self._client = _ollama.Client(host=base_url)
        self._ocr_model = ocr_model
        self._llm_model = llm_model

    @property
    def provider_name(self) -> str:
        return f"Ollama (OCR: {self._ocr_model}, LLM: {self._llm_model})"

    def ocr_image(self, image_bytes: bytes, mime_type: str = "image/png") -> str:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        response = self._client.chat(
            model=self._ocr_model,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Extract ALL text from this image exactly as written. "
                        "Include text in margins, headers, footers, and sidebars. "
                        "Preserve line breaks. Do not summarise or skip anything."
                    ),
                    "images": [b64],
                }
            ],
        )
        return response.message.content

    def generate(self, prompt: str) -> str:
        response = self._client.chat(
            model=self._llm_model,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.message.content
