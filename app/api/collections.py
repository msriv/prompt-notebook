from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.collection import Collection
from app.models.prompt import Prompt
from app.models.project import Project
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionInDB, CollectionList, CollectionWithPrompts
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/v1/collections", tags=["collections"])

@router.post("/", response_model=CollectionInDB)
def create_collection(collection: CollectionCreate, db: Session = Depends(get_db)):
    # Try finding project by ID first, then by slug if ID is not provided
    if collection.project_id:
        project = db.query(Project).filter(Project.id == collection.project_id).first()
    elif collection.project_slug:
        project = db.query(Project).filter(Project.slug == collection.project_slug).first()
        if project:
            collection.project_id = UUID(str(project.id))
    else:
        raise HTTPException(status_code=400, detail="Either project_id or project_slug must be provided")

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_collection = Collection(**collection.dict(exclude={'project_slug'}))
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.put("/{collection_id_or_slug}", response_model=CollectionInDB)
def update_collection(
    collection_id_or_slug: str,
    collection: CollectionUpdate,
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

    # Try to find collection by ID first, then by slug
    try:
        collection_id = UUID(collection_id_or_slug)
        db_collection = db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.project_id == project.id
        ).first()
    except ValueError:
        db_collection = db.query(Collection).filter(
            Collection.slug == collection_id_or_slug,
            Collection.project_id == project.id
        ).first()

    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    for key, value in collection.dict(exclude_unset=True).items():
        setattr(db_collection, key, value)

    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.post("/{collection_id_or_slug}/prompts", response_model=dict)
def add_prompts_to_collection(
    collection_id_or_slug: str,
    prompt_ids: List[UUID] = Body(..., embed=True),
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

    # Find collection
    try:
        collection_id = UUID(collection_id_or_slug)
        db_collection = db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.project_id == project.id
        ).first()
    except ValueError:
        db_collection = db.query(Collection).filter(
            Collection.slug == collection_id_or_slug,
            Collection.project_id == project.id
        ).first()

    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    added_prompts = []
    for prompt_id in prompt_ids:
        db_prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()

        if db_prompt and db_prompt not in db_collection.prompts:
            db_collection.prompts.append(db_prompt)
            added_prompts.append(str(prompt_id))
        elif db_prompt in db_collection.prompts:
            raise HTTPException(status_code=409, detail="Prompt already in collection")
        else:
            raise HTTPException(status_code=404, detail="Prompt not found in the same project")

    db.commit()
    return {"status": "successfully added prompts to the collection"}

@router.delete("/{collection_id_or_slug}/prompts", response_model=dict)
def remove_prompts_from_collection(
    collection_id_or_slug: str,
    prompt_ids: List[UUID] = Body(..., embed=True),
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

    # Find collection
    try:
        collection_id = UUID(collection_id_or_slug)
        db_collection = db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.project_id == project.id
        ).first()
    except ValueError:
        db_collection = db.query(Collection).filter(
            Collection.slug == collection_id_or_slug,
            Collection.project_id == project.id
        ).first()

    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    removed_prompts = []
    for prompt_id in prompt_ids:
        db_prompt = db.query(Prompt).filter(
            Prompt.id == prompt_id,
            Prompt.project_id == project.id
        ).first()

        if db_prompt and db_prompt in db_collection.prompts:
            db_collection.prompts.remove(db_prompt)
            removed_prompts.append(str(prompt_id))
        else:
            raise HTTPException(status_code=404, detail="Prompt not found in collection")

    db.commit()
    return {"status": "successfully removed prompts from the collection"}

@router.delete("/{collection_id_or_slug}", response_model=dict)
def delete_collection(
    collection_id_or_slug: str,
    recursive: bool = False,
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

    # Find collection
    try:
        collection_id = UUID(collection_id_or_slug)
        db_collection = db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.project_id == project.id
        ).first()
    except ValueError:
        db_collection = db.query(Collection).filter(
            Collection.slug == collection_id_or_slug,
            Collection.project_id == project.id
        ).first()

    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if recursive:
        for prompt in db_collection.prompts:
            db.delete(prompt)

    db.delete(db_collection)
    db.commit()
    return {"status": "deleted"}

@router.get("/", response_model=List[CollectionList])
def get_collections(
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

    collections = db.query(Collection).filter(Collection.project_id == project.id).all()
    return [CollectionList(
        id=UUID(str(collection.id)),
        slug=str(collection.slug),
        name=str(collection.name),
        description=str(collection.description),
        project_id=UUID(str(collection.project_id))
    ) for collection in collections]

@router.get("/{collection_id_or_slug}", response_model=CollectionWithPrompts)
def get_collection(
    collection_id_or_slug: str,
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

    try:
        collection_id = UUID(collection_id_or_slug)
        db_collection = db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.project_id == project.id
        ).first()
    except ValueError:
        db_collection = db.query(Collection).filter(
            Collection.slug == collection_id_or_slug,
            Collection.project_id == project.id
        ).first()

    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    prompts_dict = {}
    for prompt in db_collection.prompts:
        sorted_versions = sorted(prompt.versions, key=lambda v: v.created_at, reverse=True)
        if sorted_versions:
            latest_version = sorted_versions[0]
            prompts_dict[str(prompt.slug)] = {
                "id": str(prompt.id),
                "version": int(str(latest_version.version_number)),
                "content": str(latest_version.content)
            }

    return CollectionWithPrompts(
        id=UUID(str(db_collection.id)),
        slug=str(db_collection.slug),
        name=str(db_collection.name),
        description=str(db_collection.description),
        created_at=db_collection.created_at.replace(tzinfo=None),
        prompts=prompts_dict,
        project_id=UUID(str(db_collection.project_id))
    )
