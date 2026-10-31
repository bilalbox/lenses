#!/usr/bin/env python3
"""Build the mutashabih quiz bank from the compiled mutashabih pairs.

Reads (all already in public/data/quran/, run `pnpm data:mutashabih` first):
  - mutashabih/{nnn}.json   similar-verse pairs
  - verses.json             undiacritized text, diffed word by word
  - surah/{nnn}.json        Uthmani words, shown to the learner

Writes public/data/quran/mutashabihQuiz.json. Each question blanks the spot
where an ayah's wording parts from a similar ayah ("fill the word") and then
asks which surah the ayah is in. Every option is real Quranic wording taken
from the pair, so the answer key is exact and no distractor is invented.
"""

from __future__ import annotations

import difflib
import json
import random
from collections import defaultdict
from collections.abc import Container
from dataclasses import dataclass, field
from typing import Any

from pipeline import OUT, surah_path, write_json

Key = tuple[int, int]

# A diff counts only when it sits between this much shared wording.
MIN_LEAD_IN = 2
MIN_LEAD_OUT = 1
# Longest differing stretch (in words) that still makes a short option.
MAX_SPAN = 2
# Pairs this close in one surah are read as one passage, not as mutashabihāt.
NEIGHBOUR_GAP = 3
MAX_WORDING_OPTIONS = 4
MAX_SURAH_OPTIONS = 4


@dataclass(frozen=True)
class SlotDiff:
    """Words a[i1:i2] stand where b has b[j1:j2]; one side may be empty."""

    i1: int
    i2: int
    j1: int
    j2: int


def slot_diffs(a: list[str], b: list[str]) -> list[SlotDiff]:
    """Short differences framed on both sides by shared wording."""
    ops = difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
    out: list[SlotDiff] = []
    for before, (tag, i1, i2, j1, j2), after in zip(ops, ops[1:], ops[2:], strict=False):
        if tag == "equal" or before[0] != "equal" or after[0] != "equal":
            continue
        if before[2] - before[1] < MIN_LEAD_IN or after[2] - after[1] < MIN_LEAD_OUT:
            continue
        if max(i2 - i1, j2 - j1) > MAX_SPAN:
            continue
        out.append(SlotDiff(i1, i2, j1, j2))
    return out


def are_neighbours(a: Key, b: Key) -> bool:
    return a[0] == b[0] and abs(a[1] - b[1]) <= NEIGHBOUR_GAP


@dataclass
class Variant:
    """One wording for a blank and the ayahs that use it."""

    text: str
    refs: list[Key] = field(default_factory=lambda: [])


@dataclass
class Corpus:
    rasm: dict[Key, list[str]]
    uthmani: dict[Key, list[str]]
    partners: dict[Key, set[Key]]

    def by_text(self) -> dict[tuple[str, ...], list[Key]]:
        index: dict[tuple[str, ...], list[Key]] = defaultdict(list)
        for key, words in self.rasm.items():
            index[tuple(words)].append(key)
        return index


def _slot_variants(
    corpus: Corpus, target: Key
) -> dict[tuple[int, int], list[tuple[Key, SlotDiff]]]:
    slots: dict[tuple[int, int], list[tuple[Key, SlotDiff]]] = defaultdict(list)
    a = corpus.rasm[target]
    for partner in sorted(corpus.partners[target]):
        if are_neighbours(target, partner) or partner not in corpus.uthmani:
            continue
        for diff in slot_diffs(a, corpus.rasm[partner]):
            slots[(diff.i1, diff.i2)].append((partner, diff))
    # One blank per starting word: the span most partners agree on, then the shortest.
    best: dict[int, tuple[int, int]] = {}
    for span, found in slots.items():
        held = best.get(span[0])
        if held is None or (-len(found), span[1]) < (-len(slots[held]), held[1]):
            best[span[0]] = span
    return {span: slots[span] for span in best.values()}


def _wording_options(
    corpus: Corpus,
    target: Key,
    span: tuple[int, int],
    partners: list[tuple[Key, SlotDiff]],
    real: Container[tuple[str, ...]],
) -> list[Variant]:
    """The ayah's own wording first, then up to three partner wordings.

    A partner wording that turns the ayah into another real ayah is left out: with the
    reference hidden, the learner could not tell which of the two is being asked.
    """
    i1, i2 = span
    a = corpus.rasm[target]
    answer = Variant(" ".join(corpus.uthmani[target][i1:i2]), [target])
    seen: dict[str, Variant] = {" ".join(a[i1:i2]): answer}
    for partner, diff in partners:
        wording = corpus.rasm[partner][diff.j1 : diff.j2]
        if tuple(a[:i1] + wording + a[i2:]) in real:
            continue
        key = " ".join(wording)
        if key not in seen:
            text = " ".join(corpus.uthmani[partner][diff.j1 : diff.j2])
            seen[key] = Variant(text)
        seen[key].refs.append(partner)
    distractors = sorted(
        (v for v in seen.values() if v is not answer), key=lambda v: (-len(v.refs), v.refs)
    )
    return [answer, *distractors[: MAX_WORDING_OPTIONS - 1]]


def _surah_options(
    corpus: Corpus, target: Key, partners: list[Key], copies: list[Key]
) -> list[int]:
    """Surahs of the ayahs it is confused with, those at the blank first.

    Any surah that also holds this exact ayah is dropped, since it would be right too.
    """
    exclude = {target[0]} | {k[0] for k in copies if k != target}
    near = [p for p in sorted(corpus.partners[target]) if not are_neighbours(target, p)]
    others: list[int] = []
    for sura in [p[0] for p in partners] + [p[0] for p in near]:
        if sura not in exclude and sura not in others:
            others.append(sura)
    return [target[0], *others[: MAX_SURAH_OPTIONS - 1]]


def build_questions(corpus: Corpus) -> list[dict[str, Any]]:
    copies = corpus.by_text()
    questions: list[dict[str, Any]] = []
    for target in sorted(corpus.partners):
        if target not in corpus.uthmani:
            continue
        for (i1, i2), partners in sorted(_slot_variants(corpus, target).items()):
            options = _wording_options(corpus, target, (i1, i2), partners, copies)
            slot_partners = [p for p, _ in partners]
            surahs = _surah_options(
                corpus, target, slot_partners, copies[tuple(corpus.rasm[target])]
            )
            if len(options) < 2 or len(surahs) < 2:
                continue
            qid = f"mt:{target[0]}:{target[1]}:{i1}"
            rng = random.Random(qid)
            answer = options[0]
            rng.shuffle(options)
            rng.shuffle(surahs)
            questions.append(
                {
                    "id": qid,
                    "s": target[0],
                    "v": target[1],
                    "w": corpus.uthmani[target],
                    "at": i1,
                    "len": i2 - i1,
                    "opts": [{"a": o.text, "refs": [list(r) for r in o.refs]} for o in options],
                    "ans": options.index(answer),
                    "surahs": surahs,
                }
            )
    return questions


def load_corpus() -> Corpus:
    rows: list[list[Any]] = json.loads((OUT / "verses.json").read_text(encoding="utf-8"))
    rasm = {(int(r[0]), int(r[1])): str(r[2]).split() for r in rows}
    uthmani: dict[Key, list[str]] = {}
    partners: dict[Key, set[Key]] = defaultdict(set)
    for sura in range(1, 115):
        surah = json.loads(surah_path("surah", sura).read_text(encoding="utf-8"))
        for verse in surah["verses"]:
            key = (sura, int(verse["v"]))
            words = [str(w["a"]) for w in verse["w"]]
            # Blanks are placed by word position, so both texts must align.
            if len(words) == len(rasm.get(key, [])):
                uthmani[key] = words
        pairs = json.loads(surah_path("mutashabih", sura).read_text(encoding="utf-8"))
        for verse in pairs["verses"]:
            src = (sura, int(verse["v"]))
            for match in verse["matches"]:
                dst = (int(match["sura"]), int(match["ayah"]))
                partners[src].add(dst)
                partners[dst].add(src)
    return Corpus(rasm, uthmani, dict(partners))


def main() -> None:
    questions = build_questions(load_corpus())
    write_json(OUT / "mutashabihQuiz.json", {"version": 1, "questions": questions})
    print(f"Wrote {len(questions)} mutashabih quiz questions.")


if __name__ == "__main__":
    main()
