from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/v1/projects", tags=["projects"])

@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return ProjectResponse(
        id=UUID(str(db_project.id)),
        name=str(db_project.name),
        slug=str(db_project.slug),
        description=str(db_project.description) if str(db_project.description) else None,
        created_at=db_project.created_at.replace(tzinfo=None)
    )

@router.get("/", response_model=List[ProjectResponse])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = db.query(Project).offset(skip).limit(limit).all()
    return [ProjectResponse(
        id=UUID(str(project.id)),
        name=str(project.name),
        slug=str(project.slug),
        description=str(project.description) if str(project.description) else None,
        created_at=project.created_at.replace(tzinfo=None)
    ) for project in projects]

@router.get("/{project_id_or_slug}", response_model=ProjectResponse)
def get_project(project_id_or_slug: str, db: Session = Depends(get_db)):
    # Try to parse as UUID first
    try:
        project_id = UUID(project_id_or_slug)
        project = db.query(Project).filter(Project.id == project_id).first()
    except ValueError:
        # If it's not a valid UUID, treat it as a slug
        project = db.query(Project).filter(Project.slug == project_id_or_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return ProjectResponse(
        id=UUID(str(project.id)),
        name=str(project.name),
        slug=str(project.slug),
        description=str(project.description) if str(project.description) else None,
        created_at=project.created_at.replace(tzinfo=None)
    )

@router.put("/{project_id_or_slug}", response_model=ProjectResponse)
def update_project(project_id_or_slug: str, project: ProjectUpdate, db: Session = Depends(get_db)):
    # Try to parse as UUID first
    try:
        project_id = UUID(project_id_or_slug)
        db_project = db.query(Project).filter(Project.id == project_id).first()
    except ValueError:
        # If it's not a valid UUID, treat it as a slug
        db_project = db.query(Project).filter(Project.slug == project_id_or_slug).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in project.dict(exclude_unset=True).items():
        setattr(db_project, key, value)

    db.commit()
    db.refresh(db_project)

    return ProjectResponse(
        id=UUID(str(db_project.id)),
        name=str(db_project.name),
        slug=str(db_project.slug),
        description=str(db_project.description) if str(db_project.description) else None,
        created_at=db_project.created_at.replace(tzinfo=None)
    )

@router.delete("/{project_id_or_slug}", response_model=dict)
def delete_project(project_id_or_slug: str, db: Session = Depends(get_db)):
    # Try to parse as UUID first
    try:
        project_id = UUID(project_id_or_slug)
        project = db.query(Project).filter(Project.id == project_id).first()
    except ValueError:
        # If it's not a valid UUID, treat it as a slug
        project = db.query(Project).filter(Project.slug == project_id_or_slug).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"status": "deleted"}
