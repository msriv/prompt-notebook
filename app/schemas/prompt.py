from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, ClassVar, List
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
    project_id: Optional[UUID] = None
    project_slug: Optional[str] = None

    @validator('*', pre=True)
    def validate_project_identifier(cls, v, values: Dict[str, Any]) -> Any:
        # Only run this validation when we've collected all fields
        if len(values) == len(cls.__fields__) - 1:  # -1 because we're currently validating the last field
            if not values.get('project_id') and not values.get('project_slug'):
                raise ValueError('Either project_id or project_slug must be provided')
        return v

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    template_format: Optional[TemplateFormat] = None
    project_id: Optional[UUID] = None

class PromptResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    template_format: TemplateFormat
    versions: List[int]
    created_at: datetime
    project_id: UUID

    class Config:
        orm_mode = True
