# Real CPU Whisper benchmark evidence — 2026-11-26

This directory records **actual faster-whisper inference through the local HTTP API**, using CPU/int8 and verified local model files. This is separate from mocked CI and from GPU validation. GPU hardware is unavailable. No model weights or human/synthetic WAV binaries are committed here.

## Inputs and provenance

- Host: AMD EPYC 9V74, 3 visible logical CPUs and about 9.7 GiB host RAM; actual cgroup quota is 2 CPU-equivalent cores and memory limit is 8 GiB, native Python 3.12.14; `OMP_NUM_THREADS=3`, `OPENBLAS_NUM_THREADS=1`. Full packages and environment are retained in `python-lock.txt` and `environment.json`.
- Models: independently published Rhasspy `models` GitHub release `v1.0`, `asr_faster-whisper-small-int8.tar.gz` and `asr_faster-whisper-medium-int8.tar.gz`. The exact source URLs, archive sizes/SHA256 and every extracted file hash are in `small-artifact.json` and `medium-artifact.json`. These archives do not publish an upstream training checkpoint commit; do not invent one.
- Archives were inspected before extraction: only regular files/directories, no absolute paths, traversal, symbolic/hard links or device entries, with an unpacked-size limit. The archives contain CT2 weights, config and vocabulary, but lack `tokenizer.json`.
- The tokenizer was supplied using the project's `prepare_rhasspy_tokenizer.py`, which checks a pinned official OpenAI multilingual rank-table hash and exact base/special-token IDs against the archive vocabulary. All 14 frozen reference strings were also checked against OpenAI tiktoken with exact encode/decode agreement. Generated tokenizer SHA256: `2e87bb8b733a5c03b8a19a918b649ad3ab39d1968723faba197e4e6444f4b47a`.
- Dataset: 14 **synthetic eSpeak NG** clips, seven Chinese and seven English, 103.6445 seconds total; mono 16 kHz PCM. Exact references/conditions/audio hashes are in `synthetic-corpus-manifest.json`; software/library/voice-data/generator hashes are in `synthetic-corpus-provenance.json`. Manifest SHA256: `56e96e67eaa7a499f014d638509db0a9cca5e321a6cfaef8a1c5029d773ff7b2`.
- Two independent generation runs produced identical WAV hashes for all 14 clips. The generator and regeneration instructions live in `services/speech-whisper/evaluation/SYNTHETIC_CORPUS.md`. The actual frozen WAVs are retained as a separate corpus delivery artifact; regenerate only when creating a new dataset identity.

## Completed measured results

Status: **PASS WITH WARNINGS** for this bounded real CPU experiment. Both models completed **42/42 actual HTTP transcriptions**: 14 unique clips × three passes, with identical ordered audio hashes across models. No mock inference was used. This is not a broad recognition-quality release approval.

| Model (CPU/int8) | First model-cold request, s | Warm median, s | Warm median RTF | Model load, s | Mean process CPU, % | Peak RSS, MiB | Acquired model files, MiB | Download archive, MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| small | 4.759 | 2.937 | 0.428 | 0.783 | 155.13 | 669.145 | 248.711 | 203.917 |
| medium | 9.813 | 8.488 | 1.197 | 1.912 | 154.00 | 1390.660 | 754.958 | 641.721 |

All model artifacts were downloaded before timing; acquisition during the timed service load was a local-directory lookup (about 0.00004 s). Acquired bytes include config/vocabulary/generated tokenizer as well as weights. Archive sizes are exact downloaded payload file sizes, not a measurement of TLS/network traffic. GPU memory remains **null/unmeasured**. The two timing rows were recorded under variable shared CPU load and must not be presented as an isolated speedup comparison.

### Chinese synthetic corpus

Seven unique clips, repeated three times (21 measured requests per model). CER is primary; whitespace WER is reported only for transparency and can exceed 100%.

| Model | Raw CER | Whitespace WER (not segmented) | Warm median latency, s | Warm median RTF |
| --- | ---: | ---: | ---: | ---: |
| small | 58.667% | 185.714% | 3.617 | 0.426 |
| medium | 59.111% | 142.857% | 9.141 | 1.075 |

The high Mandarin error rate is a real limitation of this synthetic test. Scores include script/punctuation differences and substantive recognition errors; references and normalization were not changed after seeing results. The experiment does not establish that either model is accurate enough for unsupervised technical Chinese entry. Review and correction remain necessary; use broader human speech before setting a quality release threshold.

### English synthetic corpus

Seven unique clips, repeated three times (21 measured requests per model); WER is primary.

| Model | WER | CER | Warm median latency, s | Warm median RTF |
| --- | ---: | ---: | ---: | ---: |
| small | 2.247% | 1.215% | 2.645 | 0.441 |
| medium | 2.247% | 1.389% | 6.645 | 1.340 |

These results apply to one synthetic voice per language and fixed clips, not population accuracy. Repeated passes increase timing observations, not unique speaker/content coverage. Do not combine the Chinese and English quality percentages or compare them with a different corpus's percentage. `comparison.json` and the two raw reports preserve counts, hypotheses and normalization inputs.

Large-v3 was optional and not acquired/run: the shared cgroup has an 8 GiB memory cap and was already near that budget with the active test services. GPU runtime/performance remains **BLOCKED** because no GPU is visible. No GPU result or large-v3 quality result is inferred from CPU success.

## Method and interpretation

Run a fresh model-cold local API service for each model, with `HF_HUB_OFFLINE=1` and already-acquired model files. The same fixed manifest and explicit `zh`/`en` language values are used for both models. The harness makes 42 requests per model: one full pass followed by two warm passes. Only the very first request includes lazy model initialization; all remaining requests are warm. HTTP latency includes upload, audio decoding, VAD and inference. Service startup and prior model download are excluded. Model acquisition/load times come from service health, not from a mocked clock.

The two ASR models run sequentially, but the host is a shared VM with a shared 2-core-equivalent cgroup quota: a separate local Qwen test and other work overlapped some measurements. There was no CPU isolation or controlled idle-host baseline. Timing is **observed under variable background load**, not an isolated causal comparison or reliable model speedup ratio. Resource sampling is service-process CPU percentage and RSS at 100 ms; 100% CPU is one logical core. GPU memory is null because no GPU is available. Download archive byte counts are saved payload artifact sizes; network traffic/TLS overhead is not measured.

`small-results.json` and `medium-results.json` retain each reference, hypothesis, exact audio hash, pass/phase, WER, CER, latency and real-time factor. Per-language summary WER/CER uses summed edit counts divided by summed reference length, rather than an unweighted mean of clip rates. Chinese WER is not linguistically segmented; **Chinese CER and English WER are the primary language-specific indicators**. NFKC/casefold normalization is used; CER removes whitespace and retains punctuation. Simplified/traditional Chinese differences are not silently corrected.

Synthetic voice accuracy is not representative human accuracy. High Mandarin CER remains a quality limitation, not something to hide by changing references or normalization. Real request completion is not an accuracy release threshold. The separately licensed human diagnostic corpus/report is tracked under `docs/qa/evidence/human-corpus-2026-11-26/`; it is not mixed into these synthetic scores.

## Dependency regression found by actual inference

The first installation selected PyAV 19.0.2 through the unconstrained `av>=11` transitive requirement. The model really loaded, but the first WAV transcription returned HTTP 502: `faster-whisper==1.2.1` calls `av.open(..., metadata_errors="ignore")`, which PyAV 19.0.2 rejects. PyAV 18.1.1 accepts the call and performs real inference. Runtime requirements were pinned to `av==18.1.1`, and decoder CI coverage was added separately; no check was bypassed. Failed-attempt timing is not reused as a successful cold-start result. See `decoder-compatibility.json`.

## Distribution access limits preserved

The configured environment still rejects the default Hugging Face model host and the separate official OpenAI Azure checkpoint URLs with CONNECT 403. Actual default `WhisperModel("small", cpu/int8)` failure and independent official tiny/small URL probes are preserved in `huggingface-attempt.json` and `openai-distribution-probe.json`. The successful benchmark uses a direct, independently published GitHub release, not a proxy for blocked requests. It does not prove the default first-run Hugging Face download works in this restricted environment.

The original 2026-11-16 blocked status is retained in `historical-status-2026-11-16.json`; it has not been relabeled as a past success. Current status and measured figures are recorded separately after the completed runs.
