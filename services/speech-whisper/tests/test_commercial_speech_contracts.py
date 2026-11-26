"""Official-manual contracts via real httpx request encoding and a local MockTransport.

No commercial endpoint, API credential, acoustic model or recognition-quality result is used.
"""
import base64
import io
import json
import wave
from email import policy
from email.parser import BytesParser
from urllib.parse import parse_qs

import httpx
import pytest
from fastapi.testclient import TestClient
from app import main

client=TestClient(main.app)
REAL_ASYNC_CLIENT=httpx.AsyncClient
PROVIDERS=("gemini","openai","deepgram")


def wav_fixture():
    output=io.BytesIO()
    with wave.open(output,"wb") as recording:
        recording.setnchannels(1);recording.setsampwidth(2);recording.setframerate(16000)
        recording.writeframes(b"\0\0"*1600)
    return output.getvalue()


def configure_transport(monkeypatch,handler):
    for provider in PROVIDERS:
        monkeypatch.setattr(main,provider.upper()+"_API_KEY","contract-fixture-key")
    transport=httpx.MockTransport(handler)
    def factory(**kwargs):
        assert kwargs["follow_redirects"] is False
        assert kwargs["timeout"]==main.UPSTREAM_TIMEOUT_SECONDS
        return REAL_ASYNC_CLIENT(transport=transport,**kwargs)
    monkeypatch.setattr(main.httpx,"AsyncClient",factory)


def form_fields(request):
    body=request.content
    content_type=request.headers["Content-Type"]
    assert content_type.startswith("multipart/form-data; boundary=")
    message=BytesParser(policy=policy.default).parsebytes(("Content-Type: "+content_type+"\r\nMIME-Version: 1.0\r\n\r\n").encode()+body)
    return {part.get_param("name",header="content-disposition"):part for part in message.iter_parts()}


def success_payload(provider,text):
    if provider=="gemini":return {"candidates":[{"index":0,"finishReason":"STOP","content":{"role":"model","parts":[{"text":text}]}}],"usageMetadata":{"promptTokenCount":64,"candidatesTokenCount":10,"totalTokenCount":74}}
    if provider=="openai":return {"text":text,"usage":{"type":"duration","seconds":1}}
    return {"metadata":{"request_id":"local-contract-fixture","duration":0.1,"channels":1},"results":{"channels":[{"detected_language":"zh" if "机器人" in text else "en","alternatives":[{"transcript":text,"confidence":0.98,"words":[]}]}]}}


@pytest.mark.parametrize("provider",PROVIDERS)
@pytest.mark.parametrize("language,text",[("zh","机器人路径规划与机械工程"),("en","Robotic path planning and mechanical engineering")])
def test_official_chinese_english_request_and_response_shapes(monkeypatch,provider,language,text):
    audio=wav_fixture();calls=[]
    def upstream(request):
        calls.append(request)
        assert request.method=="POST"
        if provider=="gemini":
            assert str(request.url)=="https://generativelanguage.googleapis.com/v1beta/models/"+main.GEMINI_TRANSCRIPTION_MODEL+":generateContent"
            assert request.headers["x-goog-api-key"]=="contract-fixture-key"
            payload=json.loads(request.content)
            inline=payload["contents"][0]["parts"][0]["inlineData"]
            assert inline["mimeType"]=="audio/wav" and base64.b64decode(inline["data"])==audio
            assert language in payload["contents"][0]["parts"][1]["text"]
        elif provider=="openai":
            assert str(request.url)=="https://api.openai.com/v1/audio/transcriptions"
            assert request.headers["Authorization"]=="Bearer contract-fixture-key"
            fields=form_fields(request)
            assert fields["file"].get_filename()=="recording.wav"
            assert fields["file"].get_content_type()=="audio/wav"
            assert fields["file"].get_payload(decode=True)==audio
            assert fields["model"].get_content()==main.OPENAI_TRANSCRIPTION_MODEL
            assert fields["response_format"].get_content()=="json"
            assert fields["language"].get_content()==language
        else:
            assert request.url.host=="api.deepgram.com" and request.url.path=="/v1/listen"
            assert request.headers["Authorization"]=="Token contract-fixture-key"
            assert request.headers["Content-Type"]=="audio/wav" and request.content==audio
            params=parse_qs(request.url.query.decode())
            assert params=={"model":[main.DEEPGRAM_MODEL],"smart_format":["true"],"language":[language]}
        return httpx.Response(200,json=success_payload(provider,text))
    configure_transport(monkeypatch,upstream)
    response=client.post(f"/api/speech/{provider}/transcriptions",files={"file":("user-upload.wav",audio,"audio/wav")},data={"language":language})
    assert response.status_code==200 and response.json()=={"text":text}
    assert len(calls)==1 and "contract-fixture-key" not in response.text


@pytest.mark.parametrize("provider",("openai","deepgram"))
def test_auto_language_omits_invalid_upstream_auto_value(monkeypatch,provider):
    def upstream(request):
        if provider=="openai":assert "language" not in form_fields(request)
        else:
            params=parse_qs(request.url.query.decode())
            assert params["detect_language"]==["true"] and "language" not in params
        return httpx.Response(200,json=success_payload(provider,"fixture transcript"))
    configure_transport(monkeypatch,upstream)
    assert client.post(f"/api/speech/{provider}/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")},data={"language":"auto"}).status_code==200


@pytest.mark.parametrize("provider",PROVIDERS)
@pytest.mark.parametrize("upstream_status,local_status",[(400,422),(401,503),(403,503),(413,413),(415,415),(429,429),(503,503),(504,504)])
def test_documented_error_classes_are_mapped_without_leaking_provider_payloads(monkeypatch,provider,upstream_status,local_status):
    calls=[]
    def upstream(request):
        calls.append(request)
        body={"error":{"message":"fixture-private-body","code":"provider_error"},"err_code":"fixture-private-code","err_msg":"fixture-private-body"}
        return httpx.Response(upstream_status,json=body,headers={"Retry-After":"12"})
    configure_transport(monkeypatch,upstream)
    response=client.post(f"/api/speech/{provider}/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")})
    assert response.status_code==local_status and "fixture-private" not in response.text
    if upstream_status in (429,503,504):assert response.headers["retry-after"]=="12"
    assert len(calls)==1  # No retry, double billing or implicit provider/model switch.


@pytest.mark.parametrize("provider",PROVIDERS)
def test_timeout_network_and_malformed_json_are_local_and_sanitized(monkeypatch,provider):
    for failure,status in (("timeout",504),("network",502),("json",502)):
        def upstream(request):
            if failure=="timeout":raise httpx.ReadTimeout("fixture-private-timeout",request=request)
            if failure=="network":raise httpx.ConnectError("fixture-private-path",request=request)
            return httpx.Response(200,content=b"not JSON")
        configure_transport(monkeypatch,upstream)
        response=client.post(f"/api/speech/{provider}/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")})
        assert response.status_code==status and "fixture-private" not in response.text


def test_gemini_filters_thought_parts_and_rejects_truncated_transcripts(monkeypatch):
    def upstream(request):
        return httpx.Response(200,json={"candidates":[{"finishReason":"STOP","content":{"parts":[{"thought":True,"text":"fixture private model note"},{"text":"final transcript"}]}}]})
    configure_transport(monkeypatch,upstream)
    response=client.post("/api/speech/gemini/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")})
    assert response.json()=={"text":"final transcript"}
    for finish in (None,"MAX_TOKENS","SAFETY","RECITATION"):
        configure_transport(monkeypatch,lambda request:httpx.Response(200,json={"candidates":[{"finishReason":finish,"content":{"parts":[{"text":"partial transcript"}]}}]}))
        response=client.post("/api/speech/gemini/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")})
        assert response.status_code==502 and "partial transcript" not in response.text


def test_gemini_base64_total_size_limit_is_enforced_before_any_upstream_call(monkeypatch):
    monkeypatch.setattr(main,"GEMINI_API_KEY","fixture")
    small=main.gemini_audio_request(b"x"*20,"audio/wav","Transcribe")
    exact=len(json.dumps(small,separators=(",",":")).encode())
    monkeypatch.setattr(main,"GEMINI_INLINE_REQUEST_LIMIT",exact)
    assert main.gemini_audio_request(b"x"*20,"audio/wav","Transcribe")==small
    monkeypatch.setattr(main,"GEMINI_INLINE_REQUEST_LIMIT",exact-1)
    with pytest.raises(main.HTTPException) as error:main.gemini_audio_request(b"x"*20,"audio/wav","Transcribe")
    assert error.value.status_code==413


def test_openai_rejects_unsupported_raw_formats_and_non_iso639_1_language_before_upstream(monkeypatch):
    configure_transport(monkeypatch,lambda request:pytest.fail("must reject before upstream"))
    for mime in ("audio/aac","audio/3gpp"):
        assert client.post("/api/speech/openai/transcriptions",files={"file":("a.bin",b"fixture",mime)}).status_code==415
    assert client.post("/api/speech/openai/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")},data={"language":"eng"}).status_code==422


def test_openai_diarization_config_includes_required_chunking_for_long_recordings(monkeypatch):
    monkeypatch.setattr(main,"OPENAI_TRANSCRIPTION_MODEL","gpt-4o-transcribe-diarize")
    def upstream(request):
        fields=form_fields(request)
        assert fields["chunking_strategy"].get_content()=="auto"
        assert fields["response_format"].get_content()=="json"
        return httpx.Response(200,json={"text":"speaker transcript","segments":[]})
    configure_transport(monkeypatch,upstream)
    assert client.post("/api/speech/openai/transcriptions",files={"file":("a.wav",wav_fixture(),"audio/wav")}).json()=={"text":"speaker transcript"}
