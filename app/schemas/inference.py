from pydantic import BaseModel
from typing import Optional

class InferenceRequest(BaseModel):
    prompt_content: str
    input: str
    model: str = "gpt-4o-mini-2024-07-18"
    provider: str = "openai"

class InferenceResponse(BaseModel):
    output: str
    model: str
    provider: str
