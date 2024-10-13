from pydantic import BaseModel, Field
from typing import Any, List, Optional
from datetime import datetime
from uuid import UUID

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class CategoryInDB(CategoryBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

class CategoryWithPrompts(CategoryInDB):
    prompts: dict[str, dict[str, Any]]

class CategoryList(CategoryBase):
    id: UUID

    class Config:
        orm_mode = True
