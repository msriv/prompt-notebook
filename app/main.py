from fastapi import FastAPI
from app.api import categories, prompts, tags, inference
from app.db.database import engine, Base
from app.models.prompt import Prompt
from app.models.version import Version
from app.models.tag import Tag
from app.middleware.cache_middleware import cache_middleware

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.middleware("http")(cache_middleware)
app.include_router(prompts.router)
app.include_router(tags.router)
app.include_router(categories.router, prefix="/v1/categories", tags=["categories"])
app.include_router(inference.router)
