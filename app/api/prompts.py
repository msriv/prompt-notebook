from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.prompt import Prompt
from app.models.tag import Tag
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

    # Create 'latest' tag for the initial version
    latest_tag = Tag(name="latest", version_id=initial_version.id)
    db.add(latest_tag)
    db.commit()

    return PromptResponse(
        id=UUID(str(db_prompt.id)),
        name=str(db_prompt.name),
        slug=str(db_prompt.slug),
        description=str(db_prompt.description) if str(db_prompt.description) else None,
        template_format=TemplateFormat(db_prompt.template_format),
        versions=[1],
        created_at=db_prompt.created_at.replace(tzinfo=None),
        project_id=UUID(str(db_prompt.project_id))
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
        id=UUID(str(prompt.id)),
        name=str(prompt.name),
        slug=str(prompt.slug),
        description=str(prompt.description) if str(prompt.description) else None,
        template_format=TemplateFormat(prompt.template_format),
        versions=[int(str(v.version_number)) for v in prompt.versions],
        created_at=prompt.created_at.replace(tzinfo=None),
        project_id=UUID(str(prompt.project_id))
    ) for prompt in prompts]

@router.put("/{prompt_id_or_slug}", response_model=PromptResponse)
def update_prompt(
    prompt_id_or_slug: str,
    prompt: PromptUpdate,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find the project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find the prompt
    try:
        prompt_id = UUID(prompt_id_or_slug)
        db_prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()
    except ValueError:
        db_prompt = db.query(Prompt).filter(
            Prompt.slug == prompt_id_or_slug,
            Prompt.project_id == project.id
        ).first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    for key, value in prompt.dict(exclude_unset=True, exclude={'content'}).items():
        setattr(db_prompt, key, value)

    if prompt.content:
        latest_version = db.query(Version).filter(
            Version.prompt_id == db_prompt.id
        ).order_by(Version.version_number.desc()).first()

        new_version_number = 1 if latest_version is None else latest_version.version_number + 1
        new_version = Version(
            prompt_id=db_prompt.id,
            version_number=new_version_number,
            content=prompt.content
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)

        # Update latest tag
        latest_tag = db.query(Tag).join(Version).filter(
            Tag.name == "latest",
            Version.prompt_id == db_prompt.id
        ).first()

        if latest_tag:
            latest_tag.version_id = new_version.id
        else:
            latest_tag = Tag(name="latest", version_id=new_version.id)
            db.add(latest_tag)

    db.commit()
    db.refresh(db_prompt)

    return PromptResponse(
        id=UUID(str(db_prompt.id)),
        name=str(db_prompt.name),
        slug=str(db_prompt.slug),
        description=str(db_prompt.description) if str(db_prompt.description) else None,
        template_format=TemplateFormat(db_prompt.template_format),
        versions=[int(str(v.version_number)) for v in db_prompt.versions],
        created_at=db_prompt.created_at.replace(tzinfo=None),
        project_id=UUID(str(db_prompt.project_id))
    )

@router.get("/{prompt_id_or_slug}", response_model=PromptResponse)
def get_prompt(
    prompt_id_or_slug: str,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find the project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find the prompt
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

    return PromptResponse(
        id=UUID(str(prompt.id)),
        name=str(prompt.name),
        slug=str(prompt.slug),
        description=str(prompt.description) if str(prompt.description) else None,
        template_format=TemplateFormat(prompt.template_format),
        versions=[int(str(v.version_number)) for v in prompt.versions],
        created_at=prompt.created_at.replace(tzinfo=None),
        project_id=UUID(str(prompt.project_id))
    )

@router.delete("/{prompt_id_or_slug}", response_model=dict)
def delete_prompt(
    prompt_id_or_slug: str,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find the project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find the prompt
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

    db.delete(prompt)
    db.commit()
    return {"status": "deleted"}

@router.get("/{prompt_id_or_slug}/versions/{version}", response_model=VersionResponse)
def get_prompt_version(
    prompt_id_or_slug: str,
    version: int,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find the project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find the prompt
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

    return VersionResponse(
        id=UUID(str(version_obj.prompt_id)),
        version=int(str(version_obj.version_number)),
        content=str(version_obj.content),
        created_at=version_obj.created_at.replace(tzinfo=None)
    )

@router.get("/{prompt_id_or_slug}/tags/{tag_name}", response_model=VersionResponse)
def get_prompt_by_tag(
    prompt_id_or_slug: str,
    tag_name: str,
    project_id: Optional[UUID] = Query(None),
    project_slug: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not project_id and not project_slug:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    # Find the project
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
    else:
        project = db.query(Project).filter(Project.slug == project_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find the prompt
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

    # Get the version with the specified tag
    version = db.query(Version).join(Tag).filter(
        Version.prompt_id == prompt.id,
        Tag.name == tag_name
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail=f"Version with tag '{tag_name}' not found")

    return VersionResponse(
        id=UUID(str(version.prompt_id)),
        version=int(str(version.version_number)),
        content=str(version.content),
        created_at=version.created_at.replace(tzinfo=None)
    )
