"""Build tokenizer.json for Rhasspy multilingual Whisper CT2 archives from OpenAI's rank table."""
import argparse
import base64
import hashlib
from pathlib import Path

from tokenizers import AddedToken, Tokenizer, decoders, models, pre_tokenizers

# openai/whisper at commit 86098128c0b4f24f0e2aa2994de830614b474227.
RANKS_SHA256 = "b34b360dbb493e781e479794586d661700670d65564001f23024971d1f2fa126"


def byte_alphabet():
    # GPT-2 byte-to-Unicode alphabet used by OpenAI's Whisper tokenizer.
    visible = list(range(33, 127)) + list(range(161, 173)) + list(range(174, 256))
    mapping = {byte: chr(byte) for byte in visible}
    for offset, byte in enumerate(byte for byte in range(256) if byte not in visible):
        mapping[byte] = chr(256 + offset)
    return mapping


def build(model_dir, rank_file):
    source = rank_file.read_bytes()
    if hashlib.sha256(source).hexdigest() != RANKS_SHA256:
        raise ValueError("Unexpected multilingual.tiktoken revision")
    ranks = {base64.b64decode(token): int(rank) for token, rank in (line.split() for line in source.splitlines())}
    vocabulary = (model_dir / "vocabulary.txt").read_text().split("\n")
    if vocabulary[-1] == "":
        vocabulary.pop()
    ids = {token: index for index, token in enumerate(vocabulary)}
    alphabet = byte_alphabet()
    def spelling(token):
        return "".join(alphabet[byte] for byte in token)
    if any(ids.get(spelling(raw)) != rank for raw, rank in ranks.items()):
        raise ValueError("Rank table and model vocabulary differ")
    if ids.get("<|endoftext|>") != len(ranks) or ids.get("<|30.00|>") != 51864:
        raise ValueError("Unexpected Whisper special-token range")

    # A tiktoken rank can be reached by several valid pairs. Preserve their rank order.
    merges = []
    for raw, rank in ranks.items():
        pairs = [(raw[:i], raw[i:]) for i in range(1, len(raw)) if raw[:i] in ranks and raw[i:] in ranks]
        for left, right in sorted(pairs, key=lambda pair: (ranks[pair[0]], ranks[pair[1]])):
            merges.append((rank, spelling(left), spelling(right)))
    tokenizer = Tokenizer(models.BPE(vocab=ids, merges=[(left, right) for _, left, right in sorted(merges, key=lambda row: row[0])]))
    tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
    tokenizer.decoder = decoders.ByteLevel()
    tokenizer.add_special_tokens([AddedToken(token, special=True, normalized=False) for token in vocabulary[len(ranks):]])
    tokenizer.save(str(model_dir / "tokenizer.json"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model_dir", type=Path)
    parser.add_argument("multilingual_ranks", type=Path)
    args = parser.parse_args()
    build(args.model_dir, args.multilingual_ranks)
