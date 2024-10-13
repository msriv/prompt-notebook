import os
from redis import asyncio as aioredis
from urllib.parse import urlparse
import json

# Get the REDIS_URL from environment variable
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# Parse the REDIS_URL
parsed_url = urlparse(REDIS_URL)

# Create Redis client
redis_client = aioredis.Redis(
    host=parsed_url.hostname or 'localhost',
    port=parsed_url.port or 6379,
    db=int(parsed_url.path.lstrip('/') or 0),
    password=parsed_url.password or None,
    ssl=parsed_url.scheme == 'rediss'
)

async def set_cache(key: str, value: str, expiration: int = 3600):
    await redis_client.setex(key, expiration, value)

async def get_cache(key: str):
    cached = await redis_client.get(key)
    return cached.decode() if cached else None

def generate_cache_key(route: str, params: dict):
    sorted_params = sorted(params.items())
    return f"{route}:{':'.join(f'{k}={v}' for k, v in sorted_params)}"
