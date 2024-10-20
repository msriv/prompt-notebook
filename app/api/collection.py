from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.collection import Collection
from app.models.prompt import Prompt
from app.models.project import Project
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionInDB, CollectionList, CollectionWithPrompts
from uuid import UUID
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=CollectionInDB)
def create_collection(collection: CollectionCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == collection.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_collection = Collection(**collection.dict())
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.put("/{collection_id}", response_model=CollectionInDB)
def update_collection(collection_id: UUID, collection: CollectionUpdate, db: Session = Depends(get_db)):
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    for key, value in collection.dict(exclude_unset=True).items():
        setattr(db_collection, key, value)

    db.commit()
    db.refresh(db_collection)
    return db_collection

@router.post("/{collection_id}/prompts", response_model=dict)
def add_prompts_to_collection(
    collection_id: UUID,
    prompt_ids: List[UUID] = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    added_prompts = []
    for prompt_id in prompt_ids:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.project_id == db_collection.project_id).first()
        if db_prompt and db_prompt not in db_collection.prompts:
            db_collection.prompts.append(db_prompt)
            added_prompts.append(str(prompt_id))
        elif db_prompt in db_collection.prompts:
            raise HTTPException(status_code=409, detail="Prompt already in collection")
        else:
            raise HTTPException(status_code=404, detail="Prompt not found in the same project")

    db.commit()
    return {
        "status": "successfully added prompts to the collection",
    }

@router.delete("/{collection_id}/prompts", response_model=dict)
def remove_prompts_from_collection(
    collection_id: UUID,
    prompt_ids: List[UUID] = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    removed_prompts = []
    for prompt_id in prompt_ids:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.project_id == db_collection.project_id).first()
        if db_prompt and db_prompt in db_collection.prompts:
            db_collection.prompts.remove(db_prompt)
            removed_prompts.append(str(prompt_id))
        else:
            raise HTTPException(status_code=404, detail="Prompt not found in collection")

    db.commit()
    return {
        "status": "successfully removed prompts from the collection",
    }

@router.delete("/{collection_id}", response_model=dict)
def delete_collection(collection_id: UUID, recursive: bool = False, db: Session = Depends(get_db)):
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if recursive:
        for prompt in db_collection.prompts:
            db.delete(prompt)

    db.delete(db_collection)
    db.commit()
    return {"status": "deleted"}

@router.get("/", response_model=List[CollectionList])
def get_collections(project_id: UUID = Query(...), db: Session = Depends(get_db)):
    return db.query(Collection).filter(Collection.project_id == project_id).all()

@router.get("/{collection_id_or_slug}", response_model=CollectionWithPrompts)
def get_collection(collection_id_or_slug: str, project_id: UUID = Query(...), db: Session = Depends(get_db)):
    # Try to parse as UUID first
    try:
        collection_id = UUID(collection_id_or_slug)
        db_collection = db.query(Collection).filter(Collection.id == collection_id, Collection.project_id == project_id).first()
    except ValueError:
        # If it's not a valid UUID, treat it as a slug
        db_collection = db.query(Collection).filter(Collection.slug == collection_id_or_slug, Collection.project_id == project_id).first()

    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    prompts_dict = {}
    for prompt in db_collection.prompts:
        # Ensure versions are sorted by created_at in descending order
        sorted_versions = sorted(prompt.versions, key=lambda v: v.created_at, reverse=True)
        if sorted_versions:
            latest_version = sorted_versions[0]
            prompts_dict[prompt.slug] = {
                "id": str(prompt.id),
                "version": latest_version.version_number,
                "content": latest_version.content
            }

    return CollectionWithPrompts(
        id=db_collection.id,
        slug=db_collection.slug,
        name=db_collection.name,
        description=db_collection.description,
        created_at=db_collection.created_at,
        prompts=prompts_dict,
        project_id=db_collection.project_id
    )
