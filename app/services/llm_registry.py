import os
from abc import ABC, abstractmethod
from typing import Dict, Type
from openai import AsyncOpenAI
from anthropic import Anthropic

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, model: str) -> str:
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
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in OpenAI API call: {str(e)}")
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
            return response.content[0].text
        except Exception as e:
            print(f"Error in Anthropic API call: {str(e)}")
            raise

class LLMRegistry:
    def __init__(self):
        self.providers: Dict[str, Type[LLMProvider]] = {
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
        }

    def get_provider(self, provider_name: str) -> LLMProvider:
        provider_class = self.providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        return provider_class()

llm_registry = LLMRegistry()

async def call_llm_api(prompt: str, model: str, provider: str) -> str:
    try:
        llm_provider = llm_registry.get_provider(provider)
        return await llm_provider.generate(prompt, model)
    except Exception as e:
        # Log the error and return a generic error message
        print(f"Error calling LLM API: {str(e)}")
        return "An error occurred while generating the response."
