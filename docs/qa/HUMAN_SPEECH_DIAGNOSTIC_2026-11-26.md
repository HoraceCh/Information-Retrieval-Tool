# Human-recorded Mandarin / English diagnostic (2026-11-26 UTC)

Status: **PASS WITH WARNINGS** for acquiring a licensed fixed pair and executing the recorded small CPU requests. **BLOCKED** for the full G3 human-corpus quality gate, local RTX GPU validation and real cloud-provider E2E. Two utterances are insufficient for a bilingual product accuracy claim. This report adds human speech evidence; it does not replace the separate synthetic or browser results.

## Frozen data and permission

Two pre-existing fixtures were selected by language before recognition, from official WeNet revision `be6ad97fdb512589df113042f7ff3a29d392fb38`. Published references are from that revision's `test/resources/dataset/text`, not model output. Audio was copied without local transformation and remains outside the product repository under `/workspace/work/human-corpus/`.

| Sample | Original corpus | License verified from original corpus publisher | Duration | SHA256 |
|---|---|---|---:|---|
| `aishell-BAC009S0724W0121.wav` | AISHELL-1 / SLR33 | Apache-2.0 | 4.281 s | `2f9fc9c912bb71c85fb286cb88b599c81efb8f727c727a5ea8f6d1c89c55ac13` |
| `librispeech-1995-1837-0001.wav` | LibriSpeech / SLR12 | CC BY 4.0 | 8.730 s | `a4d977939c2f673b370e7dd5840118947a8ae95f6d62d3a88f32b40c0631aaee` |

The [original AISHELL listing](https://www.openslr.org/33/) declares Apache License v2.0 and describes human participants recorded with microphones and professional transcription. The [original LibriSpeech listing](https://www.openslr.org/12/) declares CC BY 4.0 and identifies read LibriVox audiobooks. These were checked independently of WeNet's code license. Attribution and exact audio/reference source URLs are retained in [provenance](evidence/human-corpus-2026-11-26/provenance.json); the [manifest](evidence/human-corpus-2026-11-26/manifest.json) freezes audio hashes, durations, references and language hints. WeNet may have converted original corpus files to WAV; no claim is made that these bytes equal original archive audio files. No private speech or speaker identity was collected.

Google FLEURS official Hugging Face/GCS endpoints were blocked by the current environment's network policy (HTTP tunnel 403); no bypass was attempted. The independently licensed WeNet fixtures were used instead.

## Actual small CPU execution

- Codex Cloud Linux x86_64, AMD EPYC 9V74, 3 logical CPUs; this is not the user's Windows/WSL2/RTX machine.
- Real faster-whisper `1.2.1`, CTranslate2 `4.9.0`, PyAV `18.1.1`; CPU `int8`, real small model weights from Rhasspy release v1.0. Exact model identity/hashes are recorded in the separate model-acquisition evidence; service health records revision `rhasspy-v1.0-int8`.
- Reused the already-loaded loopback service only after the synthetic benchmark finished. No concurrent medium inference was run. Six explicit-language HTTP requests: one Mandarin and one English sample over three rounds (`--warm-runs 2`). Model download, cold latency and load time were not measured by this diagnostic; `cold_start_latency_seconds` is null.
- Two additional real HTTP requests use `language=auto`, matching the browser adapter hint. They are reported separately and excluded from the comparative metrics. This does not prove microphone permissions, browser transport or cloud-provider readiness.

| Language | Exact published reference / observed hypothesis | WER | Raw CER |
|---|---|---:|---:|
| Mandarin | `广州市房地产中介协会分析` → `廣州市法地產中介協會分析` | 100% (one unsegmented token; unsuitable Mandarin quality measure) | 41.67% |
| English | Published sentence in manifest → same words with added sentence punctuation | 0% | 4.39% |

All three explicit-language rounds produced the same transcript in each language. Both automatic-language requests also produced those same transcripts. Chinese errors include traditional/simplified character differences and a substantive `房` → `法` substitution; no conversion or correction was applied after observing output. English raw CER includes punctuation, which the fixed reference lacks. The harness uses NFKC/casefold, removes whitespace for CER and retains punctuation; WER splits word tokens after punctuation normalization. The mixed-language aggregate must not be used as a Mandarin quality score.

Six-request warm median latency was 4.0275 seconds, median RTF 0.630. Individual elapsed times ranged from 2.227 to 17.690 seconds, so this short shared-cloud diagnostic does not establish a stable throughput or hardware comparison. CPU sampling reported a 73.08% service-process mean and RSS peak 652718080 bytes. GPU memory is null because no GPU was available; null is not zero memory usage.

Raw machine-readable evidence: [small explicit-language report](evidence/human-corpus-2026-11-26/small-warm-report.json), [small automatic-language smoke](evidence/human-corpus-2026-11-26/small-auto-smoke.json).

## Reproduction and limits

Retrieve the two WAVs and reference text from the pinned source URLs in the manifest and verify SHA256 before running. Put them beside the manifest outside the repository, retain source/license attribution, and use the actual service environment. The manifest itself has no audio payload. Run:

```sh
python services/speech-whisper/scripts/evaluate_whisper.py \
  --manifest /workspace/work/human-corpus/manifest.json \
  --base-url http://127.0.0.1:18100 \
  --dataset-version wenet-public-human-pair-v1@be6ad97fdb512589df113042f7ff3a29d392fb38 \
  --warm-runs 2 --service-pid <actual-local-service-pid> \
  --hardware '<actual hardware>' --output <report.json>
```

Use an already-loaded service to reproduce this warm-only method; do not add `--require-cold`. Each model comparison must retain this exact manifest and hashes, compute settings and method. Do not compare these two human utterances to a different synthetic dataset as an accuracy ranking. Mandarin/English technical terms, mixed language, realistic noise and a wider duration/speaker range still need a larger frozen corpus and agreed thresholds. No model accuracy pass threshold was invented after seeing these results.
