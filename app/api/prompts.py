from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prompt import Prompt
from app.models.version import Version
from app.schemas.prompt import PromptCreate, PromptResponse, PromptUpdate
from app.schemas.version import VersionResponse

router = APIRouter(prefix="/v1/prompts")

@router.post("/", response_model=PromptResponse)
def create_prompt(prompt: PromptCreate, db: Session = Depends(get_db)):
    db_prompt = Prompt(name=prompt.name, slug=prompt.slug, description=prompt.description, template_format=prompt.template_format)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)

    # Create initial version
    initial_version = Version(prompt_id=db_prompt.id, version_number=1, content=prompt.content)
    db.add(initial_version)
    db.commit()

    return PromptResponse(
        id=UUID(str(db_prompt.id)),
        name=str(db_prompt.name),
        slug=str(db_prompt.slug),
        description=str(db_prompt.description),
        template_format=str(db_prompt.template_format),
        versions=[v.version_number for v in db_prompt.versions],
        created_at=datetime.fromisoformat(str(db_prompt.created_at))
    )

@router.get("/", response_model=List[PromptResponse])
def list_prompts(db: Session = Depends(get_db)):
    prompts = db.query(Prompt).all()
    return [PromptResponse(
        id=UUID(str(prompt.id)),
        name=str(prompt.name),
        slug=str(prompt.slug),
        description=str(prompt.description),
        template_format=str(prompt.template_format),
        versions=[v.version_number for v in prompt.versions],
        created_at=datetime.fromisoformat(str(prompt.created_at))
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
        id=UUID(str(db_prompt.id)),
        name=str(db_prompt.name),
        slug=str(db_prompt.slug),
        description=str(db_prompt.description),
        template_format=str(db_prompt.template_format),
        created_at=datetime.fromisoformat(str(db_prompt.created_at)),
        versions=[v.version_number for v in db_prompt.versions]
    )

@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: UUID, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    versions = [version.version_number for version in prompt.versions]
    return PromptResponse(
        id=UUID(str(prompt.id)),
        name=str(prompt.name),
        slug=str(prompt.slug),
        template_format=str(prompt.template_format),
        description=str(prompt.description) if prompt.description is not None else None,
        created_at=datetime.fromisoformat(str(prompt.created_at)),  # datetime objects don't need typecasting
        versions=versions
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
        id=UUID(str(version.prompt_id)),
        version=int(str(version.version_number)),
        content=str(version.content),
        created_at=datetime.fromisoformat(str(version.created_at))
    )
