# Fixed public human-recorded speech diagnostic pair

Audio stays outside the product repository. No private recording was supplied or collected.

Source snapshot: WeNet `be6ad97fdb512589df113042f7ff3a29d392fb38`.
Source repository: https://github.com/wenet-e2e/wenet

The two pre-existing WeNet ASR test fixtures are derived from distinct human-recorded public corpora. Published references come from that snapshot's `test/resources/dataset/text`, not from model recognition or manual correction after seeing results. The pair was frozen before inference. WAV bytes are copied without local modification; this does not establish byte identity to the original full corpus archives.

- Mandarin: AISHELL-1, `BAC009S0724W0121`, 4.281 seconds. Official original corpus source https://www.openslr.org/33/ explicitly declares Apache License v2.0, describes 400 invited human participants, indoor microphone recording and professional manual transcription. Attribution: Beijing Shell Shell Technology Co., Ltd.; Hui Bu, Jiayu Du, Xingyu Na, Bengu Wu, Hao Zheng, AIShell-1 (2017).
- English: LibriSpeech, `1995-1837-0001`, 8.73 seconds. Official original corpus source https://www.openslr.org/12/ declares CC BY 4.0 and identifies human-read LibriVox audiobooks. Attribution: Vassil Panayotov, Guoguo Chen, Daniel Povey, Sanjeev Khudanpur, LibriSpeech (2015). License: https://creativecommons.org/licenses/by/4.0/.

WeNet's Apache license is retained in WENET-LICENSE. Original corpus licensing was independently checked; it is not inferred solely from WeNet's source-code license.

The manifest contains exact source URLs, transcript URLs, original corpus license declarations, sample durations and SHA256 hashes. Download/reproduce by checking out the source revision, copying the two WAV files under `test/resources/`, and verifying the manifest hashes. Do not edit references to match predictions.

This is a two-utterance diagnostic, not a representative bilingual benchmark, an independent held-out corpus or an accuracy release gate. Mandarin CER is informative for this short sample; whitespace WER treats the entire Chinese string as one token and is not a useful Mandarin quality metric. The harness retains punctuation in CER, so added punctuation counts as errors. Analyze languages separately and compare models only on this identical frozen manifest.

Google FLEURS official HF/GCS fetches were blocked by current network policy (HTTP tunnel 403). No bypass was attempted. The selected WeNet fixtures are used under independently verified permissive original corpus declarations instead.
