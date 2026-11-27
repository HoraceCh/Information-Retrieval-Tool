FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 WHISPER_DOWNLOAD_ROOT=/models HF_HOME=/models/huggingface
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 ca-certificates && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 speech && useradd --uid 10001 --gid speech --no-create-home speech \
    && mkdir /models && chown speech:speech /models
WORKDIR /app
COPY requirements.txt .
# Optional builder trust bundle for an organization-managed HTTPS proxy.
RUN --mount=type=secret,id=pip_ca_bundle \
    if [ -f /run/secrets/pip_ca_bundle ]; then export PIP_CERT=/run/secrets/pip_ca_bundle; fi \
    && python -m pip install --no-cache-dir --upgrade pip==26.3 setuptools==84.2.1 \
    && python -m pip install --no-cache-dir -r requirements.txt
COPY --chown=10001:10001 app ./app
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz',timeout=3)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "8"]
