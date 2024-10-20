from fastapi import APIRouter, HTTPException
from app.schemas.inference import InferenceRequest, InferenceResponse
from app.services.llm_registry import call_llm_api

router = APIRouter(prefix="/v1/inference")

@router.post("/", response_model=InferenceResponse)
async def run_inference(request: InferenceRequest):
    # Combine the prompt content with the user input
    full_prompt = f"{request.prompt_content}\n\nUser: {request.input}"

    # Call LLM API using the registry
    output = await call_llm_api(full_prompt, request.model, request.provider)

    return InferenceResponse(
        output=output,
        model=request.model,
        provider=request.provider
    )
