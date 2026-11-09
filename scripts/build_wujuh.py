#!/usr/bin/env python3
"""Build the senses each Qur'anic word takes, from al-Damaghani's al-Wujuh.

al-Husayn ibn Muhammad al-Damaghani (d. 478 AH), Islah al-Wujuh wa-l-Naza'ir
(OpenITI 0478IbnMuhammadDamghani.QamusQuran, CC BY-NC-SA 4.0) lists, for each
word, the senses (wujuh) it carries in the Qur'an and the verses for each.

Writes public/data/quran/wujuh.json:
  {root key: [{"h": headword, "s": [{"l": sense, "c": [[sura, verse, word,
   before, word text, after], ...]}, ...]}, ...]}
with a short vowelled excerpt around each cited word, and lists what could not
be placed in data/cache/review/wujuh-unmatched.json. Run after build_data.py.

An entry is kept only when its senses parse cleanly (ordinals in sequence and
as many senses as the heading declares); a citation is kept only when it
resolves to one verse and one word of the entry's root. Nothing is guessed.

Reviewed corrections in data/curation/wujuh-verdicts.json (see
docs/research/wujuh-review.md) are applied last: a citation can be renamed,
moved to another sense or dropped. audit_wujuh.py finds what needs review.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from pipeline import (
    CACHE,
    OUT,
    ROOT,
    add_notice,
    edit_manifest,
    fetch_cached,
    upsert_source,
    write_json,
)

DAMGHANI = (
    "0500AH",
    "fff9e21790e2e54f14826322ae49ab7671f12744",
    "0478IbnMuhammadDamghani/0478IbnMuhammadDamghani.QamusQuran/"
    "0478IbnMuhammadDamghani.QamusQuran.ShamAY0034085-ara1",
)
DAMGHANI_URL = (
    f"https://raw.githubusercontent.com/OpenITI/{DAMGHANI[0]}/{DAMGHANI[1]}/data/{DAMGHANI[2]}"
)
REVIEW = CACHE / "review" / "wujuh-unmatched.json"

MARKS = re.compile(r"[ً-ٰٟـۖ-ۭ()\[\]{}]")
DASH_VOCAL = re.compile(r"[-–]\s*(?:بكسر|بضم|بفتح|بنصب|بتشديد|بالتخفيف)[^–-]+[-–]")
LETTERS = str.maketrans(
    {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي"}
)
NOISE = re.compile(r"PageV\d+P\d+|\bms\d+\b|@|~~|^#\s?", re.M)


def norm(text: str) -> str:
    """Unvowelled, one alif and one final ya, single spaces."""
    return re.sub(r"\s+", " ", MARKS.sub("", text).translate(LETTERS)).strip()


def squash(word: str) -> str:
    """A word with alif and hamza dropped: Uthmani وحده and plain واحدة agree."""
    return norm(word).replace("ا", "").replace("ء", "")


# --- Entries and senses -------------------------------------------------------

COUNT_WORDS = {
    "وجهين": 2,
    "ثلاثة": 3,
    "أربعة": 4,
    "خمسة": 5,
    "ستة": 6,
    "سبعة": 7,
    "ثمانية": 8,
    "تسعة": 9,
    "عشرة": 10,
}
# "<headword> على <count> أوجه": the headword is written as spaced letter groups
# (`أم ة`, `ب ح ر`), sometimes after a number in brackets.
ENTRY = re.compile(
    r"(?:\(\d+\)\s*)?(?<![ء-ي])((?:[ء-ي]{1,3} ){0,3}[ء-ي]{1,3}) ?على\s+([ء-ي]+\s+)?(أوجه|وجهين|وجوه)"
)
ORDINALS = (
    "فوجه منهم?ا",
    "الثاني",
    "الثالث",
    "الرابع",
    "الخامس",
    "السادس",
    "السابع",
    "الثامن",
    "التاسع",
    "العاشر",
    "الحادي عشر",
    "الثاني عشر",
    "الثالث عشر",
    "الرابع عشر",
    "الخامس عشر",
)
RESTART = re.compile(r"(?<![ء-ي])فوجه منهم?ا(?![ء-ي])")


@dataclass
class Entry:
    heading: str
    declared: int | None
    body: str
    senses: list[str] = field(default_factory=list)
    # The headword as written, in letter groups. A word of the text before it
    # can be caught as a first group (`قوة ب ط ل`); see `headword`.
    groups: list[str] = field(default_factory=list)


def body_text(raw: str) -> str:
    """The book's running text: markers removed, OpenITI section tags dropped."""
    text = raw.split("#META#Header#End#", 1)[1]
    text = "\n".join(line for line in text.splitlines() if not line.startswith("### |"))
    return re.sub(r"\s+", " ", NOISE.sub(" ", text))


def split_entries(text: str) -> list[Entry]:
    marks = list(ENTRY.finditer(text))
    entries = []
    for i, mark in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        count = mark.group(3) if mark.group(3) == "وجهين" else (mark.group(2) or "").strip()
        groups = mark.group(1).split()
        entries.append(
            Entry("".join(groups), COUNT_WORDS.get(count), text[mark.end() : end], groups=groups)
        )
    return entries


def split_senses(body: str) -> list[str]:
    """Each sense's text, found by looking for the next ordinal in turn (the
    colon after it is often missing). Stops at a second "فوجه منها", which
    starts an entry whose heading was not recognised."""
    starts: list[int] = []
    at = 0
    for ordinal in ORDINALS:
        match = re.compile(rf"(?<![ء-ي]){ordinal}(?![ء-ي])\s*:?").search(body, at)
        if not match:
            break
        starts.append(match.end())
        at = match.end()
    senses = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(body)
        chunk = body[start:end]
        restart = RESTART.search(chunk)
        senses.append(chunk[: restart.start()] if restart else chunk)
    # The ordinal search consumed the next ordinal's word; trim it off each chunk.
    return [re.sub(rf"\s*(?:{'|'.join(ORDINALS[1:])})\s*:?\s*$", "", s).strip() for s in senses]


# Where a sense's name ends and its first citation begins.
LABEL_END = re.compile(
    r"[.\"(،,:]|(?<![ء-ي])(?:قوله|كقوله|وقوله|نظيرها|مثلها|في سورة)(?![ء-ي])"
    r"|(?<![ء-ي])و?قال\s+(?:الله|تعالى|سبحانه|عز)"
)
# Where the first citation begins; the later part of the book drops the quotes.
CITATION = re.compile(r"\"|(?<![ء-ي])(?:قوله|كقوله|وقوله|في سورة)(?![ء-ي])")
NAMING = re.compile(r"(?<![ء-ي])(?:يعني|بمعن[ىي])\s+(?:به\s+)?")
# Before the first citation, أي or يقول names the sense too: `أوزعني أي ألهمني`, `احلل يقول أبسط`.
HEAD_NAMING = re.compile(r"(?<![ء-ي])(?:يعني|بمعن[ىي]|أي|يقول|أراد)\s+(?:به\s+)?")
LABEL_WORDS = 6
# Words a clause can be cut off after: `شبانا ويقال : …`, `الطعام فذلك …`.
DANGLING = {"ويقال", "يقال", "فذلك", "وذلك", "أي", "أو", "و", "ثم"}


def is_headword(word: str, heading: str) -> bool:
    """The word is a form of the headword: its root letters appear in order
    (الحكمة for حكم, التأويل for أول)."""
    letters = iter(squash(word))
    root = squash(heading)
    root = root[:-1] if len(root) > 2 and root.endswith("ه") else root
    return bool(root) and all(letter in letters for letter in root)


def opening_clause(text: str, heading: str) -> list[str]:
    """The text's first clause, without a leading headword with the article
    (`الحكمة القرآن قوله …` → القرآن, `الإثم والذنب` → الذنب). `الوجه بعينه`,
    the word's own sense, stays whole."""
    words = LABEL_END.split(text, maxsplit=1)[0].split()
    while len(words) > 1 and (
        (words[0].startswith("ال") and is_headword(words[0], heading) and words[1] != "بعينه")
        or (words[0].startswith("وال") and is_headword(words[0][1:], heading))
    ):
        words = words[1:]
        if words and words[0].startswith("وال") and len(words[0]) > 3:
            words[0] = words[0][1:]
    # If the first word is the bare headword itself before the sense
    # (`أحد ساقي الملك` → ساقي الملك, `أنى من أين` → من أين, `بحر تحت العرش` → تحت العرش).
    if (
        len(words) > 1
        and norm(words[0]) == norm(heading)
        and words[1] != "بعينه"
        and words[0] not in {"أمة", "أول"}
    ):
        words = words[1:]
    # If the first word is a bare headword verb followed by its gloss verb
    # (`أوى انتهى` → انتهى, `اتبعوا عملوا` → عملوا, `أحصى شكر` → شكر).
    if (
        len(words) > 1
        and is_headword(words[0], heading)
        and not words[0].startswith("ال")
        and words[1] not in {"الله", "النبي", "من", "في", "على", "عن", "إلى", "أن", "إن", "الذين"}
        and (
            any(words[0].endswith(e) for e in ("وا", "نا", "ته", "ه", "ى", "ا"))
            or words[0] in {"أحصى", "أوى", "سعى", "احلل", "ألقى", "أرسل", "أشرب", "أدرك"}
        )
    ):
        words = words[1:]
    return words


def sense_label(chunk: str, heading: str = "") -> str:
    """The sense, as al-Damaghani names it before his first citation: the
    words after يعني or بمعنى (`امة يعني ملة . قوله …` → ملة), else the opening
    clause. Only when that names nothing, the يعني after a quotation. In his
    spelling, at most six words."""
    plain = MARKS.sub("", chunk)
    cleaned = DASH_VOCAL.sub(" ", plain)
    head = CITATION.split(cleaned, maxsplit=1)[0]
    naming = HEAD_NAMING.search(head)
    if naming:
        words = LABEL_END.split(head[naming.end() :], maxsplit=1)[0].split()
    else:
        words = opening_clause(head, heading)
    if not words and (later := NAMING.search(cleaned)):
        words = LABEL_END.split(cleaned[later.end() :], maxsplit=1)[0].split()
    if not words:  # "… يعني ." names nothing: use the opening clause
        words = LABEL_END.split(cleaned, maxsplit=1)[0].split()
    words = words[:LABEL_WORDS]
    while len(words) > 1 and words[-1] in DANGLING:
        words.pop()
    return " ".join(words)


# --- Citations ----------------------------------------------------------------

CITE = re.compile(r'(?:سورة\s+([ء-ي ]{1,20}?)\s*)?"\s*([^"]{6,}?)\s*"')
# Old or short surah names al-Damaghani uses.
SURAH_ALIASES = {
    "الملائكة": 35,
    "بني إسرائيل": 17,
    "سبحان": 17,
    "حم السجدة": 41,
    "السجدة حم": 41,
    "حم المؤمن": 40,
    "المؤمن": 40,
    "هل أتى": 76,
    "الدهر": 76,
    "الإنسان": 76,
    "تبارك": 67,
    "الملك": 67,
    "ن": 68,
    "القلم": 68,
    "سأل": 70,
    "المعارج": 70,
    "المعا رج": 70,
    "عم": 78,
    "النبأ": 78,
    "اقتربت": 54,
    "القتال": 47,
    "المنافقين": 63,
    "المؤمنين": 23,
    "الطلاق": 65,
}


def surah_names() -> dict[str, int]:
    manifest = json.loads((OUT / "manifest.json").read_text(encoding="utf-8"))
    names = {norm(unit["name"]): unit["n"] for unit in manifest["units"]}
    names.update({norm(name): n for name, n in SURAH_ALIASES.items()})
    return names


def resolve_surah(raw: str, names: dict[str, int]) -> int | None:
    words = norm(raw).split()
    for size in (3, 2, 1):  # "حم السجدة" before "حم"
        if len(words) >= size and " ".join(words[:size]) in names:
            return names[" ".join(words[:size])]
    return None


@dataclass
class Corpus:
    """Per verse: squashed words (for matching) and vowelled words (for excerpts)."""

    words: dict[tuple[int, int], list[str]]
    squashed: dict[tuple[int, int], list[str]]
    roots: dict[tuple[int, int], list[str]]
    verses: dict[int, list[int]]


def load_corpus() -> Corpus:
    words: dict[tuple[int, int], list[str]] = {}
    squashed: dict[tuple[int, int], list[str]] = {}
    verses: dict[int, list[int]] = defaultdict(list)
    for sura in range(1, 115):
        data = json.loads((OUT / "surah" / f"{sura:03d}.json").read_text(encoding="utf-8"))
        for verse in data["verses"]:
            key = (sura, verse["v"])
            words[key] = [w["a"] for w in verse["w"]]
            squashed[key] = [squash(w["a"]) for w in verse["w"]]
            verses[sura].append(verse["v"])
    index = json.loads((OUT / "words.json").read_text(encoding="utf-8"))
    roots: dict[tuple[int, int], list[str]] = defaultdict(list)
    for row in index["rows"]:
        roots[(row[0], row[1])].append(index["roots"][row[4]]["b"])
    return Corpus(words, squashed, roots, verses)


def window_score(fragment: list[str], verse: list[str]) -> tuple[float, int]:
    """Best similarity of the fragment to a run of the verse's words, and where it starts."""
    target = " ".join(fragment)
    best = (0.0, 0)
    for size in {len(fragment) - 1, len(fragment), len(fragment) + 1} - {0}:
        for start in range(max(1, len(verse) - size + 1)):
            score = SequenceMatcher(None, target, " ".join(verse[start : start + size])).ratio()
            if score > best[0]:
                best = (score, start)
    return best


MATCH_FLOOR = 0.8
TIE = 0.02


@dataclass
class VerseMatch:
    verse: int
    start: int  # where the quote starts in the verse (0-based word)
    score: float
    margin: float  # lead over the next-best verse; 1.0 when no other fits


def find_verse(fragment: str, sura: int, keys: set[str], corpus: Corpus) -> VerseMatch | None:
    """The one verse of the surah quoting the fragment and holding a word of
    the root, and where the quote starts. None when no verse or several fit."""
    frag = [w for w in (squash(x) for x in fragment.split()) if w]
    if len(frag) < 2:
        return None
    wanted = set(frag)
    scored = []
    for verse in corpus.verses[sura]:
        squashed = corpus.squashed[(sura, verse)]
        if len(wanted & set(squashed)) * 2 < len(wanted) or not keys & set(
            corpus.roots[(sura, verse)]
        ):
            continue
        score, start = window_score(frag, squashed)
        if score >= MATCH_FLOOR:
            scored.append((score, verse, start))
    if not scored:
        return None
    scored.sort(reverse=True)
    margin = scored[0][0] - scored[1][0] if len(scored) > 1 else 1.0
    if margin <= TIE:
        return None  # a repeated phrase: more than one verse fits
    score, verse, start = scored[0]
    return VerseMatch(verse, start, score, margin)


def find_word(roots: list[str], keys: set[str], start: int, length: int) -> int | None:
    """The word of the root inside the quoted run, else the nearest to it (1-based)."""
    hits = [i for i, key in enumerate(roots) if key in keys]
    if not hits:
        return None
    middle = start + length / 2
    return min(hits, key=lambda i: (not start <= i < start + length + 1, abs(i - middle))) + 1


EXCERPT_WORDS = 3


def excerpt(words: list[str], word: int) -> list[str]:
    """Up to three words either side of the cited word, vowelled."""
    i = word - 1
    before = " ".join(words[max(0, i - EXCERPT_WORDS) : i])
    after = " ".join(words[i + 1 : i + 1 + EXCERPT_WORDS])
    return [before, words[i], after]


# --- Roots --------------------------------------------------------------------


def root_index() -> dict[str, list[str]]:
    """Unvowelled root letters → Buckwalter root keys."""
    words = json.loads((OUT / "words.json").read_text(encoding="utf-8"))
    found: dict[str, list[str]] = defaultdict(list)
    for root in words["roots"]:
        if root["b"]:
            found[norm(root["a"])].append(root["b"])
    return found


def root_keys(heading: str, by_letters: dict[str, list[str]]) -> set[str]:
    """Root keys for a headword: its letters, without a final ة (أمة → أم),
    as a doubled root (أم → أمم), or with a weak last letter."""
    letters = norm(heading)
    base = letters[:-1] if len(letters) > 2 and letters.endswith("ه") else letters
    for form in (
        letters,
        base,
        base + base[-1:],
        base + "و",
        base + "ي",
        base[:-1] + "و",
        base[:-1] + "ي",
    ):
        if form in by_letters:
            return set(by_letters[form])
    return set()


# --- Build --------------------------------------------------------------------


def headword(groups: list[str], by_letters: dict[str, list[str]]) -> tuple[str, set[str]]:
    """The headword and its root keys. When the letter groups name no root, a
    word of the text before the heading may have been caught as a first group
    (`قوة ب ط ل` → بطل): drop leading groups until the rest names one. A
    two-letter rest must be a doubled root (`ذلك أم` → أمم); otherwise particles
    (إن, ما) would pass for weak roots."""
    for first in range(len(groups)):
        heading = "".join(groups[first:])
        letters = norm(heading)
        if len(letters) < 2 or (
            first and len(letters) == 2 and letters + letters[-1] not in by_letters
        ):
            break
        if keys := root_keys(heading, by_letters):
            return heading, keys
    return "".join(groups), set()


@dataclass
class Cite:
    sura: int
    verse: int
    word: int
    fragment: str  # the quotation as al-Damaghani writes it
    match: VerseMatch
    gloss: str  # his يعني / أي right after the quotation, if any

    @property
    def position(self) -> tuple[int, int, int]:
        return (self.sura, self.verse, self.word)


@dataclass
class Sense:
    chunk: str  # al-Damaghani's text for the sense
    label: str
    cites: list[Cite]


@dataclass
class Parsed:
    heading: str
    keys: set[str]
    senses: list[Sense]

    @property
    def root(self) -> str:
        return sorted(self.keys)[0]


@dataclass
class Review:
    no_root: list[str] = field(default_factory=list)
    unclean: list[str] = field(default_factory=list)
    no_surah: list[str] = field(default_factory=list)
    no_verse: list[str] = field(default_factory=list)
    counts: dict[str, int] = field(default_factory=lambda: defaultdict(int))


GLOSS = re.compile(r"^\s*[.،,]?\s*(?:يعني|أي)\s+")


def local_gloss(after: str) -> str:
    """The يعني or أي that glosses a quotation: `" … " يعني ثوابهم` → ثوابهم."""
    match = GLOSS.match(MARKS.sub("", after))
    if not match:
        return ""
    words = LABEL_END.split(MARKS.sub("", after)[match.end() :], maxsplit=1)[0].split()
    return " ".join(words[:LABEL_WORDS])


def parse_sense(
    chunk: str, heading: str, keys: set[str], corpus: Corpus, names: dict[str, int], review: Review
) -> Sense:
    cites: list[Cite] = []
    sura: int | None = None
    quotes = list(CITE.finditer(chunk))
    for i, quote in enumerate(quotes):
        raw_surah, fragment = quote.group(1) or "", quote.group(2)
        review.counts["citations"] += 1
        sura = resolve_surah(raw_surah, names) if raw_surah else sura
        if sura is None:
            review.no_surah.append(f"{raw_surah} | {fragment}")
            continue
        found = find_verse(fragment, sura, keys, corpus)
        if not found:
            review.no_verse.append(f"{sura} | {fragment}")
            continue
        word = find_word(
            corpus.roots[(sura, found.verse)], keys, found.start, len(fragment.split())
        )
        if word is None:
            continue
        after = chunk[quote.end() : quotes[i + 1].start() if i + 1 < len(quotes) else None]
        cite = Cite(sura, found.verse, word, fragment, found, local_gloss(after))
        if cite.position not in [c.position for c in cites]:
            cites.append(cite)
            review.counts["placed"] += 1
    return Sense(chunk, sense_label(chunk, heading), cites)


def parse(text: str, corpus: Corpus, review: Review) -> list[Parsed]:
    """Every entry whose senses parse cleanly, with its citations placed."""
    names = surah_names()
    by_letters = root_index()
    parsed = []
    for entry in split_entries(text):
        review.counts["entries"] += 1
        heading, keys = headword(entry.groups, by_letters)
        if not keys:
            review.no_root.append(entry.heading)
            continue
        senses = split_senses(entry.body)
        if not senses or (entry.declared and len(senses) != entry.declared):
            review.unclean.append(f"{heading}: {len(senses)} of {entry.declared}")
            continue
        review.counts["kept"] += 1
        built = [parse_sense(c, heading, keys, corpus, names, review) for c in senses]
        parsed.append(Parsed(heading, keys, built))
    return parsed


def parse_book() -> tuple[list[Parsed], Corpus, Review]:
    path = fetch_cached(DAMGHANI_URL, CACHE / "openiti" / f"damghani-{DAMGHANI[1][:12]}.txt")
    corpus = load_corpus()
    review = Review()
    return parse(body_text(path.read_text(encoding="utf-8")), corpus, review), corpus, review


# --- Verdicts -----------------------------------------------------------------

# Reviewed citations, committed: `data/curation/wujuh-verdicts.json`.
# {"sura:verse:word:headword": {"v": verdict, "l": label reviewed, ...}}
VERDICTS = ROOT / "data" / "curation" / "wujuh-verdicts.json"
# agree / viewpoint leave the data as is; label renames the citation's sense,
# move files the citation under sense `to` (1-based), drop removes it.
VERDICT_KINDS = ("agree", "viewpoint", "label", "move", "drop")


def cite_key(heading: str, cite: Cite) -> str:
    return f"{cite.sura}:{cite.verse}:{cite.word}:{heading}"


def lookup_verdict(
    verdicts: dict[str, dict[str, Any]], heading: str, cite: Cite, sense_idx: int
) -> dict[str, Any]:
    base = cite_key(heading, cite)
    return verdicts.get(f"{base}:{sense_idx + 1}") or verdicts.get(base, {})


def load_verdicts(path: Path = VERDICTS) -> dict[str, dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def apply_verdicts(parsed: list[Parsed], verdicts: dict[str, dict[str, Any]]) -> int:
    """Apply label, move and drop verdicts in place; the number applied."""
    applied = 0
    for entry in parsed:
        moves: list[tuple[int, Cite]] = []
        for s_idx, sense in enumerate(entry.senses):
            kept = []
            for cite in sense.cites:
                verdict = lookup_verdict(verdicts, entry.heading, cite, s_idx)
                kind = verdict.get("v")
                if kind == "drop" or (
                    kind == "move" and 1 <= verdict.get("to", 0) <= len(entry.senses)
                ):
                    applied += 1
                    if kind == "move":
                        moves.append((verdict["to"] - 1, cite))
                    continue
                if kind == "label":
                    sense.label = verdict["label"]
                    applied += 1
                kept.append(cite)
            sense.cites = kept
        for to, cite in moves:
            target = entry.senses[to].cites
            if cite.position not in [c.position for c in target]:
                target.append(cite)
    return applied


def to_json(parsed: list[Parsed], corpus: Corpus) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for entry in parsed:
        senses = [
            {
                "l": sense.label,
                "c": [
                    [*c.position, *excerpt(corpus.words[(c.sura, c.verse)], c.word)]
                    for c in sense.cites
                ],
            }
            for sense in entry.senses
        ]
        out[entry.root].append({"h": entry.heading, "s": senses})
    return dict(out)


def main() -> None:
    parsed, corpus, review = parse_book()
    applied = apply_verdicts(parsed, load_verdicts())
    out = to_json(parsed, corpus)
    write_json(OUT / "wujuh.json", out)
    write_json(
        REVIEW,
        {
            "entriesWithoutRoot": review.no_root,
            "entriesNotParsedCleanly": review.unclean,
            "citationsWithoutSurah": review.no_surah,
            "citationsWithoutOneVerse": review.no_verse,
        },
        pretty=True,
    )
    counts = review.counts
    print(f"entries {counts['entries']}, kept {counts['kept']} for {len(out)} roots")
    print(f"citations {counts['citations']}, placed on a word {counts['placed']}")
    print(f"verdicts applied {applied} (label, move, drop) from {VERDICTS.relative_to(ROOT)}")
    print(f"review list in {REVIEW.relative_to(CACHE.parent.parent)}")

    def edit(manifest: dict[str, Any]) -> None:
        manifest.setdefault("stats", {})["wujuhRoots"] = len(out)
        upsert_source(manifest, SOURCE)

    edit_manifest(edit)
    add_notice(
        "OpenITI: al-Wujuh wa-l-Naza'ir",
        "\n".join(
            [
                "al-Husayn ibn Muhammad al-Damaghani (d. 478 AH), Islah al-Wujuh wa-l-Naza'ir",
                "(ed. 'Abd al-'Aziz Sayyid al-Ahl, Dar al-'Ilm li-l-Malayin).",
                f"Source: OpenITI {DAMGHANI[2].rsplit('/', 1)[1]} at {DAMGHANI[0]}@{DAMGHANI[1]},",
                "released under CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/).",
                "Lenses keeps each entry's senses and maps the verses al-Damaghani cites to",
                "word positions; the derived file is shared under the same terms.",
            ]
        ),
    )


SOURCE: dict[str, Any] = {
    "id": "openiti-wujuh",
    "title": "al-Wujūh wa-l-Naẓāʾir (al-Dāmaghānī)",
    "kind": "dictionary",
    "attribution": (
        "al-Ḥusayn ibn Muḥammad al-Dāmaghānī (d. 478 AH); digital text from the OpenITI "
        "corpus (ed. ʿAbd al-ʿAzīz Sayyid al-Ahl)"
    ),
    "description": (
        "The senses each Qur'anic word carries and the verses al-Dāmaghānī cites for each, "
        "mapped to word positions."
    ),
    "license": "CC BY-NC-SA 4.0 (OpenITI corpus release)",
    "url": "https://github.com/OpenITI/0500AH",
}


if __name__ == "__main__":
    main()
