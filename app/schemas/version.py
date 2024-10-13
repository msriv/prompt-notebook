from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class VersionResponse(BaseModel):
    id: UUID
    version: int
    content: str
    created_at: datetime

    class Config:
        orm_mode = True
