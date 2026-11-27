# Human-recorded Mandarin / English diagnostic (2026-11-26 UTC)

Status: **PASS WITH WARNINGS** for acquiring a licensed fixed pair and executing the recorded small and medium CPU requests. **BLOCKED** for the full G3 human-corpus quality gate, local RTX GPU validation and real cloud-provider E2E. Two utterances are insufficient for a bilingual product accuracy claim. This report adds human speech evidence; it does not replace the separate synthetic or browser results.

## Frozen data and permission

Two pre-existing fixtures were selected by language before recognition, from official WeNet revision `be6ad97fdb512589df113042f7ff3a29d392fb38`. Published references are from that revision's `test/resources/dataset/text`, not model output. Audio was copied without local transformation and remains outside the product repository under `/workspace/work/human-corpus/`.

| Sample | Original corpus | License verified from original corpus publisher | Duration | SHA256 |
|---|---|---|---:|---|
| `aishell-BAC009S0724W0121.wav` | AISHELL-1 / SLR33 | Apache-2.0 | 4.281 s | `2f9fc9c912bb71c85fb286cb88b599c81efb8f727c727a5ea8f6d1c89c55ac13` |
| `librispeech-1995-1837-0001.wav` | LibriSpeech / SLR12 | CC BY 4.0 | 8.730 s | `a4d977939c2f673b370e7dd5840118947a8ae95f6d62d3a88f32b40c0631aaee` |

The [original AISHELL listing](https://www.openslr.org/33/) declares Apache License v2.0 and describes human participants recorded with microphones and professional transcription. The [original LibriSpeech listing](https://www.openslr.org/12/) declares CC BY 4.0 and identifies read LibriVox audiobooks. These were checked independently of WeNet's code license. Attribution and exact audio/reference source URLs are retained in [provenance](evidence/human-corpus-2026-11-26/provenance.json); the [manifest](evidence/human-corpus-2026-11-26/manifest.json) freezes audio hashes, durations, references and language hints. WeNet may have converted original corpus files to WAV; no claim is made that these bytes equal original archive audio files. No private speech or speaker identity was collected.

Google FLEURS official Hugging Face/GCS endpoints were blocked by the current environment's network policy (HTTP tunnel 403); no bypass was attempted. The independently licensed WeNet fixtures were used instead.

## Actual small CPU execution

- Codex Cloud Linux x86_64, AMD EPYC 9V74, 3 visible logical CPUs, cgroup quota 2 CPU equivalents and 8 GiB memory limit; this is not the user's Windows/WSL2/RTX machine.
- Real faster-whisper `1.2.1`, CTranslate2 `4.9.0`, PyAV `18.1.1`; CPU `int8`, real small model weights from Rhasspy release v1.0. Exact model identity/hashes are recorded in the separate model-acquisition evidence; service health records revision `rhasspy-v1.0-int8`.
- Reused the already-loaded loopback service only after the synthetic benchmark finished. No concurrent medium ASR inference was run. The shared cgroup (3 visible CPUs, 2 CPU-equivalent quota) was not isolated from unrelated background work (including a Qwen CPU browser/fallback task), so this is not a controlled latency experiment. Six explicit-language HTTP requests: one Mandarin and one English sample over three rounds (`--warm-runs 2`). Model download, cold latency and load time were not measured by this diagnostic; `cold_start_latency_seconds` is null.
- Two additional real HTTP requests use `language=auto`, matching the browser adapter hint. They are reported separately and excluded from the comparative metrics. This does not prove microphone permissions, browser transport or cloud-provider readiness.

| Language | Exact published reference / observed hypothesis | WER | Raw CER |
|---|---|---:|---:|
| Mandarin | `广州市房地产中介协会分析` → `廣州市法地產中介協會分析` | 100% (one unsegmented token; unsuitable Mandarin quality measure) | 41.67% |
| English | Published sentence in manifest → same words with added sentence punctuation | 0% | 4.39% |

All three explicit-language rounds produced the same transcript in each language. Both automatic-language requests also produced those same transcripts. Chinese errors include traditional/simplified character differences and a substantive `房` → `法` substitution; no conversion or correction was applied after observing output. English raw CER includes punctuation, which the fixed reference lacks. The harness uses NFKC/casefold, removes whitespace for CER and retains punctuation; WER splits word tokens after punctuation normalization. The mixed-language aggregate must not be used as a Mandarin quality score.

Six-request warm median latency was 4.0275 seconds, median RTF 0.630. Individual elapsed times ranged from 2.227 to 17.690 seconds, so this short shared-cloud diagnostic does not establish stable throughput, a model-size speedup, or a hardware comparison. Background CPU load was not isolated or normalized. CPU sampling reported a 73.08% service-process mean and RSS peak 652718080 bytes. GPU memory is null because no GPU was available; null is not zero memory usage.

Raw machine-readable evidence: [small explicit-language report](evidence/human-corpus-2026-11-26/small-warm-report.json), [small automatic-language smoke](evidence/human-corpus-2026-11-26/small-auto-smoke.json).

## Same-manifest medium CPU follow-up

After the separate synthetic medium run finished, the same two frozen samples were submitted to the already-loaded medium service on port 18101/PID8966, sequentially after small. Model/runtime/device/compute configuration matched small except the real Rhasspy v1.0 medium-int8 model; service health identifies model artifact bytes `791630576`. Three explicit-language rounds produced these identical outputs:

| Model | Mandarin hypothesis | Mandarin raw CER | English WER / raw CER | Six-request warm median latency / RTF | Peak service RSS |
|---|---|---:|---:|---:|---:|
| small int8 | `廣州市法地產中介協會分析` | 41.67% | 0% / 4.39% | 4.0275 s / 0.630 | 652718080 bytes |
| medium int8 | `廣州市房地產中介協會分析` | 33.33% | 0% / 4.39% | 7.409 s / 1.203 | 1443459072 bytes |

Medium removed the substantive `房` → `法` error on this one Mandarin sample. Its remaining raw CER is attributable to traditional/simplified script differences; references and scoring were kept fixed, with no post-hoc conversion. Mandarin whitespace WER remains 100% for both and is not an appropriate quality comparison. English wording and punctuation matched small on the single English sample. These are observations on two utterances, not evidence that medium is generally more accurate.

Medium individual elapsed times ranged 6.023–8.722 seconds, and process CPU mean was 189.06% (100% means one CPU). The processes ran sequentially, but the shared cgroup background load was not controlled or held constant; do not calculate an isolated model-size speedup from these latencies. No GPU memory or local RTX result is available. Both model reports use the exact same manifest digest, audio hashes and explicit-language method, while synthetic results remain a different dataset.

Raw follow-up: [medium explicit-language report](evidence/human-corpus-2026-11-26/medium-warm-report.json), [medium automatic-language smoke](evidence/human-corpus-2026-11-26/medium-auto-smoke.json). The two medium automatic-language requests succeeded and matched the explicit-language transcripts; they remain separate from the table statistics. Both cold-start fields are null because services were warm.

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
