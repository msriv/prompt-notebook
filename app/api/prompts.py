from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prompt import Prompt
from app.models.version import Version
from app.models.project import Project
from app.schemas.prompt import PromptCreate, PromptResponse, PromptUpdate, TemplateFormat
from app.schemas.version import VersionResponse

router = APIRouter(prefix="/v1/prompts")

@router.post("/", response_model=PromptResponse)
def create_prompt(prompt: PromptCreate, db: Session = Depends(get_db)):
    if prompt.project_id:
        project = db.query(Project).filter(Project.id == prompt.project_id).first()
    elif prompt.project_slug:
        project = db.query(Project).filter(Project.slug == prompt.project_slug).first()
    else:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_prompt = Prompt(
        name=prompt.name,
        slug=prompt.slug,
        description=prompt.description,
        template_format=prompt.template_format,
        project_id=project.id
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)

    # Create initial version
    initial_version = Version(prompt_id=db_prompt.id, version_number=1, content=prompt.content)
    db.add(initial_version)
    db.commit()

    return PromptResponse(
        id=str(db_prompt.id),
        name=db_prompt.name,
        slug=db_prompt.slug,
        description=db_prompt.description,
        template_format=TemplateFormat(db_prompt.template_format),
        versions=[1],
        created_at=db_prompt.created_at,
        project_id=str(db_prompt.project_id)
    )

@router.get("/", response_model=List[PromptResponse])
def list_prompts(
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    prompts = db.query(Prompt).filter(Prompt.project_id == project.id).all()
    return [PromptResponse(
        id=str(prompt.id),
        name=prompt.name,
        slug=prompt.slug,
        description=prompt.description,
        template_format=TemplateFormat(prompt.template_format),
        versions=[v.version_number for v in prompt.versions],
        created_at=prompt.created_at,
        project_id=str(prompt.project_id)
    ) for prompt in prompts]

@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(prompt_id: UUID, prompt: PromptUpdate, db: Session = Depends(get_db)):
    db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    for key, value in prompt.dict(exclude_unset=True).items():
        setattr(db_prompt, key, value)

    new_version = None
    # Create new version if content is provided
    if prompt.content:
        latest_version = db.query(Version).filter(Version.prompt_id == prompt_id).order_by(Version.version_number.desc()).first()
        new_version_number = 1 if latest_version is None else latest_version.version_number + 1
        new_version = Version(prompt_id=prompt_id, version_number=new_version_number, content=prompt.content)
        db.add(new_version)

    db.commit()
    db.refresh(db_prompt)

    return PromptResponse(
        id=db_prompt.id,
        name=db_prompt.name,
        slug=db_prompt.slug,
        description=db_prompt.description,
        template_format=db_prompt.template_format,
        created_at=db_prompt.created_at,
        versions=[v.version_number for v in db_prompt.versions],
        project_id=db_prompt.project_id
    )

@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: UUID, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    versions = [version.version_number for version in prompt.versions]
    return PromptResponse(
        id=prompt.id,
        name=prompt.name,
        slug=prompt.slug,
        template_format=prompt.template_format,
        description=prompt.description,
        created_at=prompt.created_at,
        versions=versions,
        project_id=prompt.project_id
    )

@router.delete("/{prompt_id}", response_model=dict)
def delete_prompt(prompt_id: UUID, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db.delete(prompt)
    db.commit()
    return {"status": "ok"}

@router.get("/{prompt_id}/versions/{version}", response_model=VersionResponse)
def get_prompt_version(prompt_id: UUID, version: int, db: Session = Depends(get_db)):
    version = db.query(Version).filter(Version.prompt_id == prompt_id, Version.version_number == version).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return VersionResponse(
        id=version.prompt_id,
        version=version.version_number,
        content=version.content,
        created_at=version.created_at
    )
