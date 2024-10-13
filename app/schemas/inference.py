from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class InferenceRequest(BaseModel):
    prompt_id: UUID
    version_number: Optional[int] = None
    input: str
    model: str = "gpt-4o-mini-2024-07-18"
    provider: str = "openai"

class InferenceResponse(BaseModel):
    output: str
    model: str
    provider: str
    prompt_version: int

class ComparisonRequest(BaseModel):
    prompt_id: UUID
    base_version: int
    comparison_version: int
    input: str
    model: str = "gpt-4o-mini-2024-07-18"
    provider: str = "openai"

class ComparisonResponse(BaseModel):
    base_output: str
    comparison_output: str
    model: str
    provider: str
    base_version: int
    comparison_version: int
