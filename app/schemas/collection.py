from pydantic import BaseModel, Field
from typing import Any, List, Optional
from datetime import datetime
from uuid import UUID

class CollectionBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    project_id: UUID

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(CollectionBase):
    pass

class CollectionInDB(CollectionBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

class CollectionWithPrompts(CollectionInDB):
    prompts: dict[str, dict[str, Any]]

class CollectionList(CollectionBase):
    id: UUID

    class Config:
        orm_mode = True
