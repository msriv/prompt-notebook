import json
import os
from abc import ABC, abstractmethod
from typing import Dict, Optional, Type, AsyncGenerator, Any, Coroutine
from openai import AsyncOpenAI
from anthropic import Anthropic

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

def load_model_registry(file_path: str = 'llm_registry.json') -> Dict:
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "openai": {
                "gpt4": "gpt-4",
                "gpt4-turbo": "gpt-4-1106-preview",
                "gpt35": "gpt-3.5-turbo"
            },
            "anthropic": {
                "claude": "claude-2",
                "claude-instant": "claude-instant-1",
                "claude3-opus": "claude-3-opus-20240229"
            }
        }

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, model: str) -> str:
        pass

    @abstractmethod
    async def stream(self, prompt: str, model: str) -> AsyncGenerator[str, None]:
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate(self, prompt: str, model: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content or ""  # Handle None case
        except Exception as e:
            print(f"Error in OpenAI API call: {str(e)}")
            raise

    async def stream(self, prompt: str, model: str) -> AsyncGenerator[str, None]:
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"Error in OpenAI streaming API call: {str(e)}")
            raise

class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.client = Anthropic(api_key=ANTHROPIC_API_KEY)

    async def generate(self, prompt: str, model: str) -> str:
        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            # Handle the response content properly
            return str(response.content[0].value) if response.content else ""
        except Exception as e:
            print(f"Error in Anthropic API call: {str(e)}")
            raise

    async def stream(self, prompt: str, model: str) -> AsyncGenerator[str, None]:
        try:
            with self.client.messages.stream(
                model=model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            ) as stream:
                async for chunk in stream:
                    if chunk.type == "content_block_delta" and chunk.delta.text:
                        yield chunk.delta.text
        except Exception as e:
            print(f"Error in Anthropic streaming API call: {str(e)}")
            raise

class LLMRegistry:
    def __init__(self):
        self.providers: Dict[str, Type[LLMProvider]] = {
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
        }
        self.model_registry = load_model_registry()

    def get_provider(self, provider_name: str) -> LLMProvider:
        provider_class = self.providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        return provider_class()

    def get_models(self, provider: Optional[str] = None) -> Dict[str, Dict[str, str]]:
        if provider:
            provider = provider.lower()
            if provider not in self.model_registry:
                raise ValueError(f"Unknown provider: {provider}")
            return {provider: self.model_registry[provider]}
        return self.model_registry

llm_registry = LLMRegistry()

async def call_llm_api(prompt: str, model: str, provider: str) -> str:
    try:
        llm_provider = llm_registry.get_provider(provider)
        result = await llm_provider.generate(prompt, model)
        return result or "No response generated."
    except Exception as e:
        print(f"Error calling LLM API: {str(e)}")
        return "An error occurred while generating the response."

async def stream_llm_api(prompt: str, model: str, provider: str) -> AsyncGenerator[str, None]:
    try:
        llm_provider = llm_registry.get_provider(provider)
        async for chunk in await llm_provider.stream(prompt, model):
            yield chunk
    except Exception as e:
        print(f"Error streaming from LLM API: {str(e)}")
        yield "An error occurred while generating the response."
