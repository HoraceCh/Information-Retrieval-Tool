import json
import os
import threading
import httpx
import pytest
from fastapi.testclient import TestClient
from app import main, text_api

client=TestClient(main.app)
RESULT={"keywords":[{"original":"robotics","zhSynonyms":["机器人"],"enSynonyms":["robotics"]}],"booleanQuery":"(robotics)","fieldSpecificQuery":"TS=(robotics)","schemaMapping":[{"field":"TS","mappedConcept":"robotics","reason":"topic"}],"explanation":"Topic search","suggestedUrls":[]}
REQUEST={"provider":"gemini","model":"gemini-2.5-flash","operation":"query","contents":"robotics","systemInstruction":"Use native field syntax and preserve the selected template."}

def install(monkeypatch, payload=None, error=None, inspect=None):
    class FakeClient:
        def __init__(self,**kwargs):
            assert kwargs["follow_redirects"] is False
        async def __aenter__(self):return self
        async def __aexit__(self,*args):pass
        async def post(self,url,**kwargs):
            if inspect:inspect(url,kwargs)
            if error:raise error
            return httpx.Response(200,json=payload,request=httpx.Request("POST",url))
    monkeypatch.setattr(text_api.httpx,"AsyncClient",FakeClient)


def test_gemini_uses_server_key_and_preserves_query_expansion_and_field_schema(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","server-only-fixture")
    def inspect(url,kwargs):
        assert url=="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        assert kwargs["headers"]=={"x-goog-api-key":"server-only-fixture"}
        schema=kwargs["json"]["generationConfig"]["responseJsonSchema"]
        assert {"keywords","booleanQuery","fieldSpecificQuery","schemaMapping","explanation"}.issubset(schema["required"])
        assert kwargs["json"]["systemInstruction"]["parts"][0]["text"]==REQUEST["systemInstruction"]
    install(monkeypatch,{"candidates":[{"content":{"parts":[{"text":json.dumps(RESULT)}]}}],"usageMetadata":{"promptTokenCount":3,"candidatesTokenCount":4,"totalTokenCount":7}},inspect=inspect)
    response=client.post("/api/ai/generate",json=REQUEST)
    assert response.status_code==200
    assert response.json()["result"]==RESULT
    assert response.json()["usage"]=={"promptTokens":3,"completionTokens":4,"totalTokens":7}
    assert "server-only-fixture" not in response.text


@pytest.mark.parametrize("provider",[name for name in text_api.DEFAULTS if name!="gemini"])
def test_existing_openai_compatible_providers_use_fixed_server_upstreams(monkeypatch,provider):
    monkeypatch.setenv(provider.upper()+"_API_KEY","server-only-fixture")
    model=text_api.DEFAULTS[provider][1].split(",")[0]
    def inspect(url,kwargs):
        assert url==text_api.DEFAULTS[provider][0]
        assert kwargs["headers"]=={"Authorization":"Bearer server-only-fixture"}
        assert kwargs["json"]["model"]==model
        assert kwargs["json"]["messages"][-1]["content"]==REQUEST["contents"]
    install(monkeypatch,{"choices":[{"message":{"content":json.dumps(RESULT)}}]},inspect=inspect)
    response=client.post("/api/ai/generate",json={**REQUEST,"provider":provider,"model":model})
    assert response.status_code==200 and response.json()["result"]==RESULT


def test_missing_server_key_is_explicit_and_no_upstream_request_occurs(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY",raising=False)
    install(monkeypatch,inspect=lambda *_:pytest.fail("Must not call an unconfigured upstream"))
    assert client.post("/api/ai/generate",json=REQUEST).status_code==503


def test_browser_cannot_submit_keys_upstream_endpoints_or_schemas():
    for field in ("apiKey","endpoint","responseSchema"):
        assert client.post("/api/ai/generate",json={**REQUEST,field:"browser-controlled"}).status_code==422


def test_server_model_allowlist_cannot_be_overridden(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","fixture")
    monkeypatch.setenv("GEMINI_TEXT_MODELS","gemini-2.5-flash")
    assert client.post("/api/ai/generate",json={**REQUEST,"model":"unapproved-model"}).status_code==403


def test_invalid_model_json_and_invalid_structured_result_are_sanitized(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","fixture")
    for value in ('not JSON',json.dumps({"keywords":[],"internal":"sensitive detail"})):
        install(monkeypatch,{"candidates":[{"content":{"parts":[{"text":value}]}}]})
        response=client.post("/api/ai/generate",json=REQUEST)
        assert response.status_code==502 and "sensitive detail" not in response.text


def test_upstream_timeout_is_sanitized(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","fixture")
    install(monkeypatch,error=httpx.TimeoutException("private URL or key"))
    response=client.post("/api/ai/generate",json=REQUEST)
    assert response.status_code==504 and "private" not in response.text


def test_standalone_expansion_and_connection_share_server_only_auth(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","fixture")
    install(monkeypatch,{"candidates":[{"content":{"parts":[{"text":json.dumps({"keywords":RESULT["keywords"],"explanation":"Synonyms"})}]}}]})
    response=client.post("/api/ai/generate",json={**REQUEST,"operation":"expand"})
    assert response.status_code==200 and response.json()["result"]["keywords"]==RESULT["keywords"]
    install(monkeypatch,{"candidates":[{"content":{"parts":[{"text":"OK"}]}}]})
    assert client.post("/api/ai/generate",json={**REQUEST,"operation":"connection"}).json()["connected"] is True


def test_operator_custom_upstream_is_not_browser_controlled(monkeypatch):
    monkeypatch.setenv("CUSTOM_API_KEY","fixture")
    monkeypatch.setenv("TEXT_PROVIDER_CONFIG_JSON",json.dumps({"custom":{"endpoint":"https://operator.example/v1/chat/completions","key_env":"CUSTOM_API_KEY","models":["custom-model"]}}))
    def inspect(url,kwargs): assert url=="https://operator.example/v1/chat/completions"
    install(monkeypatch,{"choices":[{"message":{"content":json.dumps(RESULT)}}]},inspect=inspect)
    response=client.post("/api/ai/generate",json={**REQUEST,"provider":"custom","model":"custom-model"})
    assert response.status_code==200
    monkeypatch.setenv("TEXT_PROVIDER_CONFIG_JSON",json.dumps({"custom":{"endpoint":"http://unsafe.example","key_env":"CUSTOM_API_KEY","models":["custom-model"]}}))
    assert client.post("/api/ai/generate",json={**REQUEST,"provider":"custom","model":"custom-model"}).status_code==503


def test_text_body_limit_and_disallowed_origin_apply_before_upstream(monkeypatch):
    assert client.post("/api/ai/generate",content=b"x"*131073,headers={"Content-Type":"application/json"}).status_code==413
    assert client.post("/api/ai/generate",json=REQUEST,headers={"Origin":"https://evil.example"}).status_code==403


def test_text_slots_are_isolated_from_speech_slots(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","fixture")
    install(monkeypatch,{"candidates":[{"content":{"parts":[{"text":"OK"}]}}]})
    middleware=main.app.middleware_stack
    while not isinstance(middleware,main.SpeechRequestLimits):middleware=middleware.app
    assert middleware.slots.acquire(blocking=False)
    try:
        assert client.post("/api/ai/generate",json={**REQUEST,"operation":"connection"}).status_code==200
    finally:middleware.slots.release()


def test_provider_status_exposes_capabilities_but_no_keys_or_upstream_addresses(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY","server-secret-fixture")
    response=client.get("/api/ai/providers")
    assert response.status_code==200
    provider=next(p for p in response.json()["providers"] if p["id"]=="gemini")
    assert provider["configured"] is True and "gemini-2.5-flash" in provider["models"]
    assert "server-secret-fixture" not in response.text
    assert "generativelanguage.googleapis.com" not in response.text


def test_reasoner_model_contract_preserves_reasoning_and_avoids_unsupported_response_format(monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY","fixture")
    def inspect(url,kwargs):
        body=kwargs["json"]
        assert len(body["messages"])==1 and body["messages"][0]["role"]=="user"
        assert "response_format" not in body
    install(monkeypatch,{"choices":[{"message":{"content":json.dumps(RESULT),"reasoning_content":"provider explanation fixture"}}]},inspect=inspect)
    response=client.post("/api/ai/generate",json={**REQUEST,"provider":"deepseek","model":"deepseek-reasoner"})
    assert response.status_code==200 and response.json()["reasoning"]=="provider explanation fixture"
