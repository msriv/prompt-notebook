import uuid
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.schema import ForeignKey
from app.db.database import Base
from app.models.collection import collection_prompt

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True)
    slug = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    versions = relationship("Version", back_populates="prompt", cascade="all, delete-orphan")
    collections = relationship("Collection", secondary=collection_prompt, back_populates="prompts")
    template_format = Column(Enum('f-string', 'jinja2', name='template_format'), nullable=False, default='f-string')
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    project = relationship("Project", back_populates="prompts")
