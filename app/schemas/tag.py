from pydantic import BaseModel
from uuid import UUID

class TagCreate(BaseModel):
    name: str

class TagResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        orm_mode = True
