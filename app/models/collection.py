import uuid
from sqlalchemy import Column, String, DateTime, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

collection_prompt = Table('collection_prompt', Base.metadata,
    Column('collection_id', UUID(as_uuid=True), ForeignKey('collections.id')),
    Column('prompt_id', UUID(as_uuid=True), ForeignKey('prompts.id'))
)

class Collection(Base):
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    prompts = relationship("Prompt", secondary=collection_prompt, back_populates="collections")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    project = relationship("Project", back_populates="collections")
