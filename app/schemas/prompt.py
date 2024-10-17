from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class TemplateFormat(str, Enum):
    f_string = "f-string"
    jinja2 = "jinja2"

class PromptCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    content: str
    template_format: TemplateFormat = TemplateFormat.f_string

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    template_format: Optional[TemplateFormat] = None

class PromptResponse(BaseModel):
    id: UUID
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    versions: Optional[List[int]] = None
    created_at: Optional[datetime] = None
    template_format: Optional[TemplateFormat] = None

    class Config:
        orm_mode = True
