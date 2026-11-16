# Whisper CPU/GPU runtime and local validation

Status (2026-11-16): CPU/GPU configurations are implemented. A container health probe is not evidence of real transcription. GPU inference still needs a machine with an actual NVIDIA device; use the actual device name/VRAM reported by the preflight instead of assuming a hardware description is correct.

## Compatibility evidence and choice

The GPU image is separate from the CPU image and uses Python 3.11, faster-whisper **1.2.1**, CTranslate2 **4.9.0**, CUDA runtime **12.8.90**, cuBLAS **12.8.4.1**, cuRAND **10.3.9.90**, and optional cuDNN **9.10.2.21**. Versions are pinned in `services/speech-whisper/requirements-gpu.txt`.

Evidence checked on 2026-11-16:

- [faster-whisper upstream GPU requirements](https://github.com/SYSTRAN/faster-whisper#gpu) document CUDA 12/cuBLAS and cuDNN 9. This README can lag newer CT2 builds.
- [CTranslate2 v4.9.0 Linux wheel build](https://github.com/OpenNMT/CTranslate2/blob/v4.9.0/python/tools/prepare_build_environment_linux.sh) uses CUDA 12.8, cuBLAS 12.8.4.1, cuDNN 9.10.2.21 during build, and `WITH_CUDNN=OFF`.
- [CTranslate2 v4.6.3 change log](https://github.com/OpenNMT/CTranslate2/blob/v4.9.0/CHANGELOG.md) introduced CUDA 12.8 support and a pure CUDA convolution implementation, making cuDNN optional. The GPU image includes cuDNN for compatibility rather than assuming it is mandatory for this wheel.
- [NVIDIA CUDA compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/) and [WSL guide](https://docs.nvidia.com/cuda/wsl-user-guide/index.html) are the driver references. Use a current host driver supporting the actual GPU and CUDA 12.8; do not infer driver compatibility from `nvcc` on the host. A recent GPU may require a newer driver than CUDA's generic minimum.

These references establish a configuration to test, not a certification that every NVIDIA GPU works. The preflight checks dynamically loaded libraries and CT2 float16 support; an actual model inference must still pass.

## WSL2 / Docker prerequisites

1. Install/update the NVIDIA Windows host driver with WSL support. Do not install a Linux display driver inside WSL.
2. Update WSL2, enable Docker Desktop WSL integration for the Ubuntu distribution, and verify `nvidia-smi` from that distribution.
3. For native Linux Docker Engine, follow [NVIDIA Container Toolkit installation](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) and configure the NVIDIA runtime. Docker Desktop manages its own backend; do not blindly apply native daemon configuration to it.
4. Build the GPU image and run the probe from the repository root:

```bash
docker compose -f docker-compose.speech.gpu.yml build
python3 services/speech-whisper/scripts/check_gpu.py --docker --output gpu-preflight.json
```

A PASS means CUDA visibility/library support only. The script downloads no model. It uses the already built image (`--no-build --pull never`). A missing image, driver, device or library gives a failing exit code and a diagnostic; it never silently switches to CPU.

## Run one independent mode

```bash
cp .env.example .env
# CPU: small / int8; this file always selects cpu.
docker compose -f docker-compose.speech.yml up --build -d
# Stop CPU before starting GPU on the same port.
docker compose -f docker-compose.speech.yml down
# GPU: small / float16 by default; change WHISPER_GPU_MODEL_SIZE as needed.
docker compose -f docker-compose.speech.gpu.yml up --build -d
curl --fail http://127.0.0.1:8000/healthz
curl --fail http://127.0.0.1:8000/readyz
```

The two Compose files are standalone alternatives. Do not stack them as overrides: GPU libraries, device reservations and model cache are intentionally isolated. CPU ignores `WHISPER_DEVICE` overrides. GPU always selects `cuda` and uses `WHISPER_GPU_COMPUTE_TYPE` (float16 by default).

Both images run as UID/GID 10001, drop capabilities, disallow privilege escalation, use a read-only root filesystem, a bounded writable `/tmp`, and a persistent `/models` volume. New volumes inherit image ownership. An old root-owned cache may need an administrator to migrate ownership to 10001; do not use `chmod 777`. Keys are runtime environment values, never image layers or Vite variables. `healthz` is liveness/configuration; `readyz` probes device/compute support without loading a model.

Host publishing is `127.0.0.1` only. The process listens on `0.0.0.0` **inside** its container so port publishing works; this is not authorization to bind a host process to the LAN. For native Python, use `--host 127.0.0.1`. CORS and Origin checks are not authentication. Remote access requires an authenticated HTTPS gateway, rate limits, and abuse controls.

## Fixed corpus and benchmark

`services/speech-whisper/evaluation/corpus-v1.prompts.json` fixes fourteen Chinese/English prompts across ordinary, long, mixed language, technical, academic, noise, short and low-quality conditions. It contains **no audio** and is not a completed dataset or performance result. Record each prompt into a private WAV named `<id>.wav`, manually verify ground truth, document speaker/recording conditions and obtain consent. Keep the same recordings for every model. Do not commit personal recordings/transcripts without consent.

```bash
python3 services/speech-whisper/scripts/prepare_corpus.py --recordings /path/to/private-corpus
python3 -m pip install -r services/speech-whisper/requirements-benchmark.txt
python3 services/speech-whisper/scripts/evaluate_whisper.py \
  --manifest /path/to/private-corpus/manifest.json --dataset-version corpus-v1-recording-1 \
  --base-url http://127.0.0.1:8000 --hardware 'actual CPU/GPU/RAM/driver' \
  --warm-runs 2 --require-cold --output report-small.json
```

Restart the service before each configuration's cold run. For download-free cold load measurement, pre-cache weights, then restart without deleting the volume. The first request includes lazy model load (and download if missing), later requests are warm. Compare small, medium and large-v3 by changing the appropriate model variable and recreating the service; use identical manifest/audio SHA256 values and language settings. Start with small; large-v3 is optional if resources are insufficient.

The report records actual service model/device/compute/version metadata, dataset version and hashes, per-recording WER/CER/latency/RTF, cold first-request and warm latency, and model-load time. Chinese WER uses whitespace tokenization and is only diagnostic; CER is primary. Punctuation remains in CER. Do not compare different recordings or mix language/condition groups to claim model superiority.

GPU memory is a 100ms sampled **device-wide** high-water mark across visible devices; it includes other processes and may miss short spikes. Keep other GPU workloads idle. CPU/RSS requires `--service-pid` with the API process PID on the same host and optional psutil; native CPU percentages can exceed 100% across cores. Docker users can additionally capture `docker stats`; never substitute client CPU use for server CPU use. Unavailable resource values are null, not zero.

`--model-cache` records on-disk cache bytes only. Actual model download traffic is null until separately measured (e.g. controlled network counters); it must not be inferred from cache size. The model-load time includes download when uncached. Pin/cache the model snapshot and save its hash/revision with the report when doing formal model comparisons.

## Stop and clean

```bash
docker compose -f docker-compose.speech.gpu.yml down
# CPU equivalent: docker compose -f docker-compose.speech.yml down
```

Model volumes remain for reuse. `down --volumes` permanently deletes that mode's model cache and forces a later download; use it only when intentionally discarding the cache. No production deployment is performed by these commands.
