from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.version import Version
from app.schemas.version import  VersionResponse

router = APIRouter(prefix="/v1/prompts/{prompt_id}/versions")

@router.post("/", response_model=VersionResponse)
def create_version(prompt_id: UUID, version: Version, db: Session = Depends(get_db)):
    latest_version = db.query(Version).filter(Version.prompt_id == prompt_id).order_by(Version.version_number.desc()).first()
    new_version_number = 1 if latest_version is None else latest_version.version_number + 1

    db_version = Version(prompt_id=prompt_id, version_number=new_version_number, content=version.content)
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version

@router.get("/", response_model=List[VersionResponse])
def list_versions(prompt_id: UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    versions = db.query(Version).filter(Version.prompt_id == prompt_id).offset(skip).limit(limit).all()
    return versions

@router.get("/{version_number}", response_model=VersionResponse)
def get_version(prompt_id: UUID, version_number: int, db: Session = Depends(get_db)):
    version = db.query(Version).filter(Version.prompt_id == prompt_id, Version.version_number == version_number).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version

@router.put("/{version_number}", response_model=VersionResponse)
def update_version(prompt_id: UUID, version_number: int, version: VersionUpdate, db: Session = Depends(get_db)):
    db_version = db.query(Version).filter(Version.prompt_id == prompt_id, Version.version_number == version_number).first()
    if not db_version:
        raise HTTPException(status_code=404, detail="Version not found")

    for key, value in version.dict(exclude_unset=True).items():
        setattr(db_version, key, value)

    db.commit()
    db.refresh(db_version)
    return db_version

@router.delete("/{version_number}", response_model=VersionResponse)
def delete_version(prompt_id: UUID, version_number: int, db: Session = Depends(get_db)):
    version = db.query(Version).filter(Version.prompt_id == prompt_id, Version.version_number == version_number).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    db.delete(version)
    db.commit()
    return version
