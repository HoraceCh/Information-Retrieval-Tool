# Synthetic bilingual benchmark corpus v1

This optional fixture set exercises actual inference, API plumbing and reproducible model comparisons. It is **synthetic eSpeak NG speech**, not human recordings, voice cloning, or a representative accuracy dataset. Keep human-speech validation separate. The fixed project-authored prompts cover seven Chinese and seven English conditions, including two deterministic noise variants and an English band-limited variant.

## Generate and freeze

Use a dedicated Python environment with the speech runtime plus the optional corpus dependency and an installed `ffmpeg`:

```bash
python -m pip install -r services/speech-whisper/requirements.txt \
  -r services/speech-whisper/requirements-benchmark.txt \
  -r services/speech-whisper/requirements-corpus.txt
python services/speech-whisper/scripts/synthesize_corpus.py \
  --output artifacts/whisper-corpus-v1
```

The generator writes 16 kHz mono PCM WAVs, `manifest.json` (text, language, conditions, durations and audio SHA256), and `provenance.json` (generator, source prompt, library/data hashes and versions). It uses the bundled `cmn` and `en-us` voices at rate 155. Noise is white noise at 15 dB SNR with a fixed per-sample seed; the low-quality clip uses a 250–1800 Hz band limit and an 8 kHz intermediate resampling stage. No user microphone data or external account credentials are involved.

The 2026-11-26 Linux/Python 3.12.14 run used `espeakng-loader==0.2.4`, eSpeak NG 1.52.0 and ffmpeg 7.1.5. Two independent generator executions produced identical hashes for all 14 audio files. This is evidence for that environment, not a promise of cross-platform byte identity. For comparisons, retain and reuse the **same frozen files and manifest hash** rather than regenerating between models. WAVs and model weights are not committed to the source tree.

## Run real inference

Start a fresh CPU speech service with a verified local model directory. If the local artifact lacks a tokenizer, use the separately documented `prepare_rhasspy_tokenizer.py` and the pinned official OpenAI rank table before starting the service. Keep model acquisition outside the timed inference phase.

```bash
WHISPER_MODEL_SIZE=/absolute/path/to/small-int8 \
WHISPER_DEVICE=cpu WHISPER_COMPUTE_TYPE=int8 HF_HUB_OFFLINE=1 \
  python -m uvicorn app.main:app --app-dir services/speech-whisper \
  --host 127.0.0.1 --port 18100
```

Then, in another shell:

```bash
python services/speech-whisper/scripts/evaluate_whisper.py \
  --manifest artifacts/whisper-corpus-v1/manifest.json \
  --dataset-version synthetic-espeak-ng-corpus-v1 \
  --base-url http://127.0.0.1:18100 --warm-runs 2 --require-cold \
  --hardware "record CPU / RAM / thread settings here" \
  --service-pid SERVICE_PID --model-cache /absolute/path/to/small-int8 \
  --output artifacts/small-results.json
```

Repeat with a fresh service for each model and unchanged audio, language and compute settings. The first request is model-cold lazy loading with already-acquired weights; it is not a cache-cold disk test or model-download latency. Other requests are warm. CPU sampling is process CPU percentage (100% is one logical core); RSS is process resident memory, sampled every 100 ms. GPU memory is null on a CPU-only host.

WER uses whitespace tokenization, so Chinese WER is **not** a linguistically segmented accuracy score. Use Chinese CER and English WER as the primary per-language indicators, inspect hypotheses, and preserve the documented normalization (CER retains punctuation). Do not compare aggregate WER across Chinese and English or across different corpora. No quality release threshold is inferred from synthetic scores.

## Reproduce the offline model preparation

The recorded CPU runs used the multilingual `asr_faster-whisper-small-int8.tar.gz` and `asr_faster-whisper-medium-int8.tar.gz` assets from the [Rhasspy models v1.0 release](https://github.com/rhasspy/models/releases/tag/v1.0). Verify the archive hashes in the benchmark evidence before extracting into a dedicated model directory. The archives contain CTranslate2 weights and vocabulary. Prepare the JSON tokenizer with the pinned [OpenAI multilingual rank table](https://github.com/openai/whisper/blob/86098128c0b4f24f0e2aa2994de830614b474227/whisper/assets/multilingual.tiktoken) and the runtime's `tokenizers` package.

```bash
python services/speech-whisper/scripts/prepare_rhasspy_tokenizer.py \
  /path/to/small-int8 /path/to/multilingual.tiktoken
```

The helper checks the rank-table digest and requires the model vocabulary to match the pinned token IDs. Use the resulting model directory as `WHISPER_MODEL_SIZE`. In Docker, mount that directory read-only, pass its container path as `WHISPER_MODEL_SIZE`, and allow UID 10001 to read the files. This procedure also applies to the medium int8 archive. The standard Compose default still uses the upstream small model.
