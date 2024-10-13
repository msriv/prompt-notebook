import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Version(Base):
    __tablename__ = "versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id"))
    version_number = Column(Integer)
    content = Column(String)
    prompt = relationship("Prompt", back_populates="versions")
    tags = relationship("Tag", back_populates="version", cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
