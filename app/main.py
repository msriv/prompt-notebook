import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import collection, prompts, tags, inference
from app.db.database import engine, Base
from app.models.prompt import Prompt
from app.models.version import Version
from app.models.tag import Tag
from app.middleware.cache_middleware import cache_middleware

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add debug middleware
@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    logger.info(f"Received request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Returning response: Status {response.status_code}")
    logger.info(f"Response headers: {response.headers}")
    return response

# Add cache middleware
app.middleware("http")(cache_middleware)

# Include routers
app.include_router(prompts.router)
app.include_router(tags.router)
app.include_router(collection.router, prefix="/v1/collections", tags=["categories"])
app.include_router(inference.router)

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
