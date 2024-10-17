from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.models.prompt import Prompt
from app.models.version import Version
from app.schemas.inference import InferenceRequest, InferenceResponse, ComparisonRequest, ComparisonResponse
from app.services.llm_registry import call_llm_api
import asyncio

router = APIRouter(prefix="/v1/inference")

@router.post("/", response_model=InferenceResponse)
async def run_inference(request: InferenceRequest, db: Session = Depends(get_db)):
    # Fetch the prompt from the database
    prompt = db.query(Prompt).filter(Prompt.id == request.prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Get the specified version or the latest version
    if request.version_number:
        version = db.query(Version).filter(
            Version.prompt_id == request.prompt_id,
            Version.version_number == request.version_number
        ).first()
        if not version:
            raise HTTPException(status_code=404, detail="Prompt version not found")
    else:
        version = db.query(Version).filter(
            Version.prompt_id == request.prompt_id
        ).order_by(Version.version_number.desc()).first()

    if not version:
        raise HTTPException(status_code=404, detail="No version found for this prompt")

    # Combine the prompt content with the user input
    full_prompt = f"{version.content}\n\nUser: {request.input}"

    # Call LLM API using the registry
    output = await call_llm_api(full_prompt, request.model, request.provider)

    return InferenceResponse(
        output=output,
        model=request.model,
        provider=request.provider,
        prompt_version=int(str(version.version_number))
    )
