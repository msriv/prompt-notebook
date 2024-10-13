from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.category import Category
from app.models.prompt import Prompt
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryInDB, CategoryList, CategoryWithPrompts
from uuid import UUID
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=CategoryInDB)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=CategoryInDB)
def update_category(category_id: UUID, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in category.dict().items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category

@router.post("/{category_id}/prompts", response_model=dict)
def add_prompts_to_category(
    category_id: UUID,
    prompt_ids: List[UUID] = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    added_prompts = []
    for prompt_id in prompt_ids:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if db_prompt and db_prompt not in db_category.prompts:
            db_category.prompts.append(db_prompt)
            added_prompts.append(str(prompt_id))
        else:
            raise HTTPException(status_code=409, detail="Prompt already in category")

    db.commit()
    return {
        "status": "successfully added prompts to the category",
    }

@router.delete("/{category_id}/prompts", response_model=dict)
def remove_prompts_from_category(
    category_id: UUID,
    prompt_ids: List[UUID] = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    removed_prompts = []
    for prompt_id in prompt_ids:
        db_prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if db_prompt and db_prompt in db_category.prompts:
            db_category.prompts.remove(db_prompt)
            removed_prompts.append(str(prompt_id))
        else:
            raise HTTPException(status_code=404, detail="Prompt not found")

    db.commit()
    return {
        "status": "successfully removed prompts from the category",
    }

@router.delete("/{category_id}", response_model=dict)
def delete_category(category_id: UUID, recursive: bool = False, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    if recursive:
        for prompt in db_category.prompts:
            db.delete(prompt)

    db.delete(db_category)
    db.commit()
    return {"status": "deleted"}

@router.get("/", response_model=List[CategoryList])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/{category_id_or_slug}", response_model=CategoryWithPrompts)
def get_category(category_id_or_slug: str, db: Session = Depends(get_db)):
    # Try to parse as UUID first
    try:
        category_id = UUID(category_id_or_slug)
        db_category = db.query(Category).filter(Category.id == category_id).first()
    except ValueError:
        # If it's not a valid UUID, treat it as a slug
        db_category = db.query(Category).filter(Category.slug == category_id_or_slug).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")


    prompts_dict = {}
    for prompt in db_category.prompts:
        # Ensure versions are sorted by created_at in descending order
        sorted_versions = sorted(prompt.versions, key=lambda v: v.created_at, reverse=True)
        if sorted_versions:
            latest_version = sorted_versions[0]
            print(latest_version)
            prompts_dict[prompt.slug] = {
                "id": str(prompt.id),
                "version": latest_version.version_number,
                "content": latest_version.content
            }

    return CategoryWithPrompts(
        id=UUID(str(db_category.id)),
        slug=str(db_category.slug),
        name=str(db_category.name),
        description=str(db_category.description),
        created_at=datetime.fromisoformat(str(db_category.created_at)),
        prompts=prompts_dict
    )
