from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.inference import InferenceRequest, InferenceResponse, InferenceStreamResponse
from app.services.llm_registry import call_llm_api, stream_llm_api, llm_registry
from typing import AsyncGenerator, Dict, Optional

router = APIRouter(prefix="/v1/inference", tags=["inference"])

@router.post("/", response_model=InferenceResponse)
async def run_inference(request: InferenceRequest):
    if request.stream:
        return StreamingResponse(
            stream_inference(request),
            media_type='text/event-stream'
        )

    # Combine the prompt content with the user input
    full_prompt = f"{request.prompt_content}\n\nUser: {request.input}"

    # Call LLM API using the registry
    output = await call_llm_api(full_prompt, request.model, request.provider)

    return InferenceResponse(
        output=output,
        model=request.model,
        provider=request.provider
    )

async def stream_inference(request: InferenceRequest) -> AsyncGenerator[str, None]:
    full_prompt = f"{request.prompt_content}\n\nUser: {request.input}"

    async for chunk in stream_llm_api(full_prompt, request.model, request.provider):
        yield f"data: {chunk}\n\n"

@router.get("/models")
async def get_models(provider: Optional[str] = None) -> Dict[str, Dict[str, str]]:
    """
    Get available models, optionally filtered by provider.

    Args:
        provider: Optional provider name to filter models

    Returns:
        Dictionary of providers and their available models

    Raises:
        HTTPException: If the specified provider is not found
    """
    try:
        return llm_registry.get_models(provider)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
