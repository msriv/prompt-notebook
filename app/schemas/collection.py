from pydantic import BaseModel, Field, validator
from typing import Any, List, Optional, Dict
from datetime import datetime
from uuid import UUID

class CollectionBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    project_id: Optional[UUID] = None
    project_slug: Optional[str] = None

    @validator('*', pre=True)
    def validate_project_identifier(cls, v, values: Dict[str, Any]) -> Any:
        # Only run this validation when we've collected all fields
        if len(values) == len(cls.__fields__) - 1:  # -1 because we're currently validating the last field
            if not values.get('project_id') and not values.get('project_slug'):
                raise ValueError('Either project_id or project_slug must be provided')
        return v

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
