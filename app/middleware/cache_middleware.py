import logging
from fastapi import Request
from fastapi.responses import JSONResponse, Response
from fastapi.encoders import jsonable_encoder
from starlette.types import Message
from app.cache.redis_cache import get_cache, set_cache, generate_cache_key, redis_client
import json

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def cache_middleware(request: Request, call_next):
    logger.debug(f"Processing request: {request.method} {request.url.path}")

    if request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
        logger.debug("Skipping cache for documentation endpoints")
        return await call_next(request)

    if request.method == "GET":
        cache_key = generate_cache_key(request.url.path, dict(request.query_params))
        logger.debug(f"Generated cache key: {cache_key}")

        cached_response = await get_cache(cache_key)
        if cached_response:
            logger.debug("Cache hit, returning cached response")
            return JSONResponse(content=json.loads(cached_response))

    response = await call_next(request)
    logger.debug(f"Received response from next middleware/route handler. Status: {response.status_code}")

    if request.method == "GET" and response.status_code == 200:
        cache_key = generate_cache_key(request.url.path, dict(request.query_params))

        response_body = [chunk async for chunk in response.body_iterator]
        response.body_iterator = iter(response_body)

        body = b''.join(response_body)

        try:
            json_content = json.loads(body)
            await set_cache(cache_key, json.dumps(jsonable_encoder(json_content)), 3600)
            logger.debug(f"Cached response for key: {cache_key}")
        except json.JSONDecodeError:
            logger.warning("Response body is not valid JSON, not caching")

        # Create a new response with updated headers
        new_response = Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )
        new_response.headers['Content-Length'] = str(len(body))
        return new_response

    elif request.method in ["POST", "PUT", "DELETE"] and response.status_code < 400:
        base_path = "/".join(request.url.path.split("/")[:3])
        logger.debug(f"Invalidating cache for base path: {base_path}")

        async for key in redis_client.scan_iter(f"{base_path}*"):
            await redis_client.delete(key)
            logger.debug(f"Invalidated cache key: {key}")

        if len(request.url.path.split("/")) > 3:
            list_cache_key = generate_cache_key(base_path, {})
            await redis_client.delete(list_cache_key)
            logger.debug(f"Invalidated list cache key: {list_cache_key}")

    return response
