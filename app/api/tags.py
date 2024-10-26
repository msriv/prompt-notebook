from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.tag import Tag
from app.models.version import Version
from app.models.prompt import Prompt
from app.models.project import Project
from app.schemas.tag import TagCreate, TagResponse
from app.schemas.version import VersionResponse

router = APIRouter(prefix="/v1/prompts", tags=["tags"])

@router.get("/{prompt_id_or_slug}/versions/{version}/tags", response_model=List[TagResponse])
def get_tags(
    prompt_id_or_slug: str,
    version: int,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find prompt
    try:
        prompt_id = UUID(prompt_id_or_slug)
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()
    except ValueError:
        prompt = db.query(Prompt).filter(
            Prompt.slug == prompt_id_or_slug,
            Prompt.project_id == project.id
        ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    version_obj = db.query(Version).filter(
        Version.prompt_id == prompt.id,
        Version.version_number == version
    ).first()

    if not version_obj:
        raise HTTPException(status_code=404, detail="Version not found")

    return [TagResponse(
        id=UUID(str(tag.id)),
        name=str(tag.name)
    ) for tag in version_obj.tags]

@router.post("/{prompt_id_or_slug}/versions/{version}/tags", response_model=TagResponse)
def create_tag(
    prompt_id_or_slug: str,
    version: int,
    tag: TagCreate,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find prompt
    try:
        prompt_id = UUID(prompt_id_or_slug)
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()
    except ValueError:
        prompt = db.query(Prompt).filter(
            Prompt.slug == prompt_id_or_slug,
            Prompt.project_id == project.id
        ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Verify version exists
    version_obj = db.query(Version).filter(
        Version.prompt_id == prompt.id,
        Version.version_number == version
    ).first()

    if not version_obj:
        raise HTTPException(status_code=404, detail="Version not found")

    # Check if tag already exists
    existing_tag = db.query(Tag).join(Version).filter(
        Tag.name == tag.name,
        Version.prompt_id == prompt.id
    ).first()

    if existing_tag:
        db.delete(existing_tag)
        db.commit()

    # Create new tag
    new_tag = Tag(name=tag.name, version_id=version_obj.id)
    db.add(new_tag)

    try:
        db.commit()
        db.refresh(new_tag)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create tag")

    return TagResponse(
        id=UUID(str(new_tag.id)),
        name=str(new_tag.name)
    )

@router.delete("/{prompt_id_or_slug}/versions/{version}/tags/{tag_id_or_name}", response_model=dict)
def delete_tag(
    prompt_id_or_slug: str,
    version: int,
    tag_id_or_name: str,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find prompt
    try:
        prompt_id = UUID(prompt_id_or_slug)
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()
    except ValueError:
        prompt = db.query(Prompt).filter(
            Prompt.slug == prompt_id_or_slug,
            Prompt.project_id == project.id
        ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Find tag
    try:
        tag_id = UUID(tag_id_or_name)
        tag_filter = Tag.id == tag_id
    except ValueError:
        tag_filter = Tag.name == tag_id_or_name

    tag = db.query(Tag).join(Version).filter(
        Version.prompt_id == prompt.id,
        Version.version_number == version,
        tag_filter
    ).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()
    return {"status": "deleted"}

@router.get("/{prompt_id_or_slug}/tags/{tag_id_or_name}", response_model=VersionResponse)
def get_prompt_by_tag(
    prompt_id_or_slug: str,
    tag_id_or_name: str,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find prompt
    try:
        prompt_id = UUID(prompt_id_or_slug)
        prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()
    except ValueError:
        prompt = db.query(Prompt).filter(
            Prompt.slug == prompt_id_or_slug,
            Prompt.project_id == project.id
        ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Find tag and associated version
    try:
        tag_id = UUID(tag_id_or_name)
        tag_filter = Tag.id == tag_id
    except ValueError:
        tag_filter = Tag.name == tag_id_or_name

    version = db.query(Version).join(Tag).filter(
        Version.prompt_id == prompt.id,
        tag_filter
    ).order_by(Version.version_number.desc()).first()

    if not version:
        raise HTTPException(status_code=404, detail="Version with tag not found")

    return VersionResponse(
        id=UUID(str(version.prompt_id)),
        version=int(str(version.version_number)),
        content=str(version.content),
        created_at=version.created_at.replace(tzinfo=None)
    )
