from uuid import UUID
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.tag import Tag
from app.models.version import Version
from app.schemas.tag import TagCreate, TagResponse
from app.schemas.version import VersionResponse

router = APIRouter(prefix="/v1/prompts")

@router.get("/{prompt_id}/versions/{version}/tags", response_model=List[TagResponse])
def get_tags(prompt_id: UUID, version: int, db: Session = Depends(get_db)):
    version_obj = db.query(Version).filter(Version.prompt_id == prompt_id, Version.version_number == version).first()
    if not version_obj:
        raise HTTPException(status_code=404, detail="Version not found")
    return [TagResponse(id=tag.id, name=tag.name) for tag in version_obj.tags]

@router.post("/{prompt_id}/versions/{version}/tags", response_model=TagResponse)
def create_tag(prompt_id: UUID, version: int, tag: TagCreate, db: Session = Depends(get_db)):
    version_obj = db.query(Version).filter(Version.prompt_id == prompt_id, Version.version_number == version).first()
    if not version_obj:
        raise HTTPException(status_code=404, detail="Version not found")

    existing_tag = db.query(Tag).filter(Tag.name == tag.name).first()
    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag name must be unique")

    new_tag = Tag(name=tag.name, version_id=version_obj.id)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return TagResponse(id=UUID(str(new_tag.id)), name=str(new_tag.name))

@router.delete("/{prompt_id}/versions/{version}/tags/{tag_id}", response_model=dict)
def delete_tag(prompt_id: UUID, version: int, tag_id: UUID, db: Session = Depends(get_db)):
    tag = db.query(Tag).join(Version).filter(
        Version.prompt_id == prompt_id,
        Version.version_number == version,
        Tag.id == tag_id
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return {"status": "ok"}

@router.get("/{prompt_id}/tags/{tag_name}", response_model=VersionResponse)
def get_prompt_by_tag(prompt_id: UUID, tag_name: str, db: Session = Depends(get_db)):
    version = db.query(Version).join(Tag).filter(
        Version.prompt_id == prompt_id,
        Tag.name == tag_name
    ).order_by(Version.version_number.desc()).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version with tag not found")
    return VersionResponse(id=UUID(str(version.prompt_id)), version=int(str(version.version_number)), content=str(version.content), created_at=datetime.fromisoformat(str(version.created_at)))
