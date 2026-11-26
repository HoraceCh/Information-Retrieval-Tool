"""Server-owned text provider routing. Browser requests never carry provider credentials/upstream URLs."""
from __future__ import annotations

import json
import os
import re
from typing import Literal
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError

router = APIRouter()
DEFAULTS = {
    "gemini": ("https://generativelanguage.googleapis.com/v1beta/models", "gemini-2.5-flash,gemini-3.5-flash,gemini-3.1-pro-preview,gemini-3-flash-preview,gemini-3.1-flash-lite,gemini-pro-latest,gemini-flash-latest,gemini-flash-lite-latest"),
    "deepseek": ("https://api.deepseek.com/chat/completions", "deepseek-chat,deepseek-reasoner,deepseek-v4-flash,deepseek-v4-pro"),
    "siliconflow": ("https://api.siliconflow.cn/v1/chat/completions", "deepseek-ai/DeepSeek-V3,deepseek-ai/DeepSeek-R1,Qwen/Qwen2.5-72B-Instruct,THUDM/glm-4-9b-chat"),
    "moonshot": ("https://api.moonshot.cn/v1/chat/completions", "moonshot-v1-8k,moonshot-v1-32k,moonshot-v1-128k"),
    "zhipu": ("https://open.bigmodel.cn/api/paas/v4/chat/completions", "glm-4-flash,glm-4-plus,glm-4,glm-4-long"),
    "dashscope": ("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "qwen-max,qwen-plus,qwen-turbo,qwen-coder-plus"),
    "openai": ("https://api.openai.com/v1/chat/completions", "gpt-4o,gpt-4o-mini,o1,o3-mini"),
    "openrouter": ("https://openrouter.ai/api/v1/chat/completions", "anthropic/claude-3.5-sonnet,google/gemini-2.5-pro,meta-llama/llama-3.3-70b-instruct,deepseek/deepseek-r1"),
}


class TextRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider: str = Field(default="gemini", pattern=r"^[a-z0-9_-]{1,64}$")
    model: str = Field(default="", max_length=256)
    operation: Literal["query", "expand", "connection"] = "query"
    contents: str = Field(min_length=1, max_length=60000)
    systemInstruction: str = Field(default="", max_length=12000)


class KeywordGroup(BaseModel):
    original: str = Field(max_length=4000)
    zhSynonyms: list[str] = Field(max_length=100)
    enSynonyms: list[str] = Field(max_length=100)


class FieldMapping(BaseModel):
    field: str
    mappedConcept: str
    reason: str


class SuggestedUrl(BaseModel):
    name: str
    url: str


class ExpansionResult(BaseModel):
    keywords: list[KeywordGroup] = Field(max_length=100)
    explanation: str


class QueryResult(ExpansionResult):
    booleanQuery: str
    fieldSpecificQuery: str
    schemaMapping: list[FieldMapping] = Field(max_length=100)
    suggestedUrls: list[SuggestedUrl] = Field(default_factory=list, max_length=20)


def provider_config(provider_id: str) -> dict:
    if provider_id in DEFAULTS:
        endpoint, models = DEFAULTS[provider_id]
        prefix = provider_id.upper()
        allowed = [item.strip() for item in os.getenv(prefix + "_TEXT_MODELS", models).split(",") if item.strip()]
        return {"endpoint": endpoint, "key_env": prefix + "_API_KEY", "models": allowed,
                "default_model": os.getenv(prefix + "_TEXT_MODEL", allowed[0] if allowed else ""), "auth_header": "Authorization", "auth_prefix": "Bearer "}
    try:
        # Trusted operator configuration only; never accepted in the API request.
        custom = json.loads(os.getenv("TEXT_PROVIDER_CONFIG_JSON", "{}")).get(provider_id)
        if not isinstance(custom, dict): raise ValueError()
        if not isinstance(custom["endpoint"], str) or any(character.isspace() for character in custom["endpoint"]): raise ValueError()
        parsed = urlsplit(custom["endpoint"])
        parsed.port  # Validate malformed operator port configuration before contacting upstream.
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError()
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*_API_KEY", custom["key_env"]): raise ValueError()
        if not isinstance(custom["models"], list) or not custom["models"] or not all(isinstance(item, str) and item for item in custom["models"]): raise ValueError()
        header = custom.get("auth_header", "Authorization")
        prefix = custom.get("auth_prefix", "Bearer ")
        if not re.fullmatch(r"[A-Za-z0-9-]{1,80}", header) or not isinstance(prefix, str) or "\r" in prefix or "\n" in prefix: raise ValueError()
        return {**custom, "default_model": custom.get("default_model", custom["models"][0]), "auth_header": header, "auth_prefix": prefix}
    except (ValueError, TypeError, KeyError, AttributeError):
        raise HTTPException(503, "This text provider is not configured on the trusted service.") from None


def model_configuration(request: TextRequest) -> tuple[dict, str, str]:
    config = provider_config(request.provider)
    model = request.model or config["default_model"]
    if model not in config["models"]:
        raise HTTPException(403, "This model is not enabled on the trusted service.")
    if request.provider == "gemini" and not re.fullmatch(r"[A-Za-z0-9._-]+", model):
        raise HTTPException(503, "The configured Gemini model is invalid.")
    key = os.getenv(config["key_env"], "")
    if not key: raise HTTPException(503, "The text provider is not configured on the trusted service.")
    return config, model, key


# Compact OpenAI-compatible instructions. Pydantic still validates the returned shape.
KEYWORD_SHAPE = "keywords: array of {original: string, zhSynonyms: string[], enSynonyms: string[]}; explanation: string"
QUERY_SHAPE = KEYWORD_SHAPE + (
    "; booleanQuery: string; fieldSpecificQuery: string; "
    "schemaMapping: array of {field: string, mappedConcept: string, reason: string}; "
    "suggestedUrls: optional array of {name: string, url: string}"
)


def structured_result(text: str, operation: str) -> dict:
    text = text.strip()
    match = re.fullmatch(r"```(?:json)?\s*([\s\S]*?)\s*```", text, flags=re.IGNORECASE)
    if match: text = match[1]
    expected = QueryResult if operation == "query" else ExpansionResult
    return expected.model_validate_json(text, strict=True).model_dump()


def usage_values(payload: dict, gemini: bool) -> dict | None:
    source = payload.get("usageMetadata" if gemini else "usage")
    if not isinstance(source, dict): return None
    keys = ("promptTokenCount", "candidatesTokenCount", "totalTokenCount") if gemini else ("prompt_tokens", "completion_tokens", "total_tokens")
    values = [source.get(key, 0) for key in keys]
    if not all(isinstance(value, int) and not isinstance(value, bool) and value >= 0 for value in values): return None
    return dict(zip(("promptTokens", "completionTokens", "totalTokens"), values))


@router.get("/api/ai/providers")
async def provider_status():
    ids = list(DEFAULTS)
    try:
        custom = json.loads(os.getenv("TEXT_PROVIDER_CONFIG_JSON", "{}"))
        if isinstance(custom, dict): ids.extend(key for key in custom if key not in ids and re.fullmatch(r"[a-z0-9_-]{1,64}", key))
    except (ValueError, TypeError): pass
    providers = []
    for provider_id in ids:
        try:
            config = provider_config(provider_id)
            providers.append({"id": provider_id, "configured": bool(os.getenv(config["key_env"])), "models": config["models"], "defaultModel": config["default_model"]})
        except HTTPException:
            providers.append({"id": provider_id, "configured": False, "models": [], "defaultModel": ""})
    return {"providers": providers}


@router.post("/api/ai/generate")
async def generate_text(request: TextRequest):
    config, model, key = model_configuration(request)
    is_gemini = request.provider == "gemini"
    expected = QueryResult if request.operation == "query" else ExpansionResult
    contents = "Reply with OK." if request.operation == "connection" else request.contents
    try:
        if is_gemini:
            url = config["endpoint"] + "/" + model + ":generateContent"
            headers = {"x-goog-api-key": key}
            generation_config = {"maxOutputTokens": 32 if request.operation == "connection" else 8192}
            if request.operation != "connection":
                generation_config.update(temperature=0, responseMimeType="application/json", responseJsonSchema=expected.model_json_schema())
            body = {"contents": [{"parts": [{"text": contents}]}], "generationConfig": generation_config}
            if request.systemInstruction: body["systemInstruction"] = {"parts": [{"text": request.systemInstruction}]}
        else:
            url = config["endpoint"]
            headers = {config["auth_header"]: config["auth_prefix"] + key}
            reasoner = any(token in model.lower() for token in ("reasoner", "r1", "v4-pro")) or model.startswith(("o1", "o3"))
            system = request.systemInstruction
            if request.operation != "connection":
                system += "\nReturn only a JSON object with these fields: " + (QUERY_SHAPE if request.operation == "query" else KEYWORD_SHAPE)
            messages = [{"role": "user", "content": system + "\n\n" + contents}] if reasoner else [{"role": "system", "content": system}, {"role": "user", "content": contents}]
            body = {"model": model, "messages": messages, "max_completion_tokens" if model.startswith(("o1", "o3")) else "max_tokens": 32 if request.operation == "connection" else 8192}
            if not reasoner and request.operation != "connection": body["response_format"] = {"type": "json_object"}
        async with httpx.AsyncClient(timeout=90, follow_redirects=False) as client:
            response = await client.post(url, headers=headers, json=body)
        response.raise_for_status()
        if len(response.content) > 1024 * 1024: raise ValueError("oversized response")
        payload = response.json()
        reasoning = None
        if is_gemini:
            parts = payload["candidates"][0]["content"]["parts"]
            text = " ".join(part["text"] for part in parts if isinstance(part.get("text"), str) and not part.get("thought"))
        else:
            message = payload["choices"][0]["message"]
            text = message["content"]
            if isinstance(message.get("reasoning_content"), str): reasoning = message["reasoning_content"][:32768]
        if not isinstance(text, str) or not text.strip(): raise ValueError("empty response")
        if request.operation == "connection": return {"connected": True, "provider": request.provider, "model": model}
        result = structured_result(text, request.operation)
        return {"result": result, "provider": request.provider, "model": model, "usage": usage_values(payload, is_gemini), "reasoning": reasoning}
    except httpx.TimeoutException:
        raise HTTPException(504, "The upstream model request timed out.") from None
    except httpx.HTTPStatusError as error:
        if error.response.status_code == 429: raise HTTPException(429, "The model provider is rate limited. Try again later.") from None
        if error.response.status_code in (401, 403): raise HTTPException(503, "The provider credentials require attention on the trusted service.") from None
        raise HTTPException(502, "The model provider rejected the request.") from None
    except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError, AttributeError, ValidationError):
        raise HTTPException(502, "The model provider returned an invalid result or could not be reached.") from None
