from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class PromptCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    content: str

class PromptUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None

class PromptResponse(BaseModel):
    id: UUID
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    versions: Optional[List[int]] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
