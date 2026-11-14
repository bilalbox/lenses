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
NOISE = re.compile(r"PageV\d+P\d+|\bms\d+\b|@|~~|^#\s?|\d+", re.M)
# The later part of the digitised book spells its structural words with a
# final ى (فى سورة, يعنى, الثانى : ) and quotes with (( … )). Respell just
# those words, so one parser reads the whole book; sense names keep his spelling.
STRUCTURE = (
    (re.compile(r"(?<![ء-ي])(و?)فى(?![ء-ي])"), r"\1في"),
    (re.compile(r"(?<![ء-ي])يعنى(?![ء-ي])"), "يعني"),
    (re.compile(r"(?<![ء-ي])أى(?![ء-ي])"), "أي"),
    (re.compile(r"(?<![ء-ي])و?(الثان|الحاد)[يى](?=\s*(?:عشر\s*)?:)"), r"\1ي"),
    (re.compile(r"(?<![ء-ي])(الثان|الحاد)ى(?![ء-ي])"), r"\1ي"),
    (re.compile(r"\(\(|\)\)"), ' " '),
    # an ordinal run into the word before it (`مطلع الفجرالثاني حتى`)
    (
        re.compile(
            r"(?<=[ء-ي]{2})(?=(?:الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر)"
            r"(?![ء-ي]))"
        ),
        " ",
    ),
)


def norm(text: str) -> str:
    """Unvowelled, one alif and one final ya, single spaces."""
    return re.sub(r"\s+", " ", MARKS.sub("", text).translate(LETTERS)).strip()


def squash(word: str) -> str:
    """A word with alif and hamza dropped: Uthmani وحده and plain واحدة agree."""
    return norm(word).replace("ا", "").replace("ء", "")


# --- Entries and senses -------------------------------------------------------

COUNT_WORDS = {
    norm(word): n
    for word, n in {
        "وجهين": 2,
        "ثلاثة": 3,
        "أربعة": 4,
        "خمسة": 5,
        "ستة": 6,
        "سبعة": 7,
        "ثمانية": 8,
        "تسعة": 9,
        "عشرة": 10,
        "عشرين": 20,
        "أحد": 1,
        "إحدى": 1,
        "اثني": 2,
        "اثنا": 2,
    }.items()
}


def count_of(words: str) -> int | None:
    """`أربعة` → 4, `ستة عشر` → 16, `اثنى عشر` → 12."""
    parts = norm(words).split()
    if len(parts) == 2 and parts[1] in {"عشر", "عشرا"} and parts[0] in COUNT_WORDS:
        return COUNT_WORDS[parts[0]] + 10
    return COUNT_WORDS.get(parts[0]) if len(parts) == 1 else None


# "<headword> على <count> أوجه": the headword is written as spaced letter groups
# (`أم ة`, `ب ح ر`), sometimes after a number in brackets or before a gloss in
# brackets (`ر ح م ( من الرحمة ) على`); where the text drops hamzas it is
# `اوجه`. `وجها` follows a
# compound count (`على ستة عشر وجها`) and is only read with one.
ENTRY = re.compile(
    r"(?:\(\s*\)\s*)?(?<![ء-ي])((?:[ء-ي]{1,3} ){0,3}[ء-ي]{1,3}) ?(?:\(\s*[ء-ي ]{1,20}\)\s*)?على\s+"
    r"(?:([ء-ي]+\s+)?([أا]وجه|وجهين|وجوه)|([ء-ي]+\s+عشرا?\s+|عشرين\s+)(وجها))"
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
    "السادس عشر",
    "السابع عشر",
    "الثامن عشر",
    "التاسع عشر",
    "العشرون",
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
    text = NOISE.sub(" ", text)
    for pattern, spelling in STRUCTURE:
        text = pattern.sub(spelling, text)
    return re.sub(r"\s+", " ", text)


def split_entries(text: str) -> list[Entry]:
    marks = list(ENTRY.finditer(text))
    entries = []
    for i, mark in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        count = "وجهين" if mark.group(3) == "وجهين" else mark.group(2) or mark.group(4) or ""
        groups = mark.group(1).split()
        entries.append(
            Entry(
                "".join(groups),
                count_of(count) if count else None,
                text[mark.end() : end],
                groups=groups,
            )
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
    (الحكمة for حكم, التأويل for أول), a weak middle letter possibly gone
    (الناس for نوس)."""
    root = squash(heading)
    root = root[:-1] if len(root) > 2 and root.endswith("ه") else root
    forms = [root]
    if len(root) == 3 and root[1] in "وي":
        forms.append(root[0] + root[2])
    return bool(root) and any(_in_order(squash(word), form) for form in forms)


def _in_order(word: str, letters: str) -> bool:
    rest = iter(word)
    return all(letter in rest for letter in letters)


OWN = {"بعينه", "بعينها", "بعينة"}  # `الوجه بعينه`: the word's own sense


def opening_clause(text: str, heading: str) -> list[str]:
    """The text's first clause, without a leading headword with the article
    (`الحكمة القرآن قوله …` → القرآن, `الإثم والذنب` → الذنب). `الوجه بعينه`,
    the word's own sense, stays whole."""
    words = LABEL_END.split(text, maxsplit=1)[0].split()
    while len(words) > 1 and (
        (words[0].startswith("ال") and is_headword(words[0], heading) and words[1] not in OWN)
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
        and words[1] not in OWN
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
    "براءة": 9,
    "حم عسق": 42,
    "خم المؤمن": 40,
    "التطفيف": 83,
    "سبح": 87,
    "تبت": 111,
    "اللهب": 111,
    "طارق": 86,
    "والليل": 92,
    "والذاريات": 51,
    "والتين": 95,
    # slips of the pen
    "الحزاب": 33,
    "النعام": 6,
    "القرة": 2,
    "العراف": 7,
    "النخل": 16,
    "الكهل": 18,
    "الفصص": 28,
    "النملو": 27,
    "الفرقات": 25,
    "القيمة": 75,
    "المراسلات": 77,
    "المز مل": 73,
    "الرحمة": 55,
}


def surah_names() -> dict[str, int]:
    manifest = json.loads((OUT / "manifest.json").read_text(encoding="utf-8"))
    names = {norm(unit["name"]): unit["n"] for unit in manifest["units"]}
    names.update({norm(name): n for name, n in SURAH_ALIASES.items()})
    return names


def surah_prefix(words: list[str], names: dict[str, int]) -> tuple[int, int] | None:
    """The surah the words start with, and how many words name it."""
    words = [norm(w) for w in words[:3]]
    for size in (3, 2, 1):  # "حم السجدة" before "حم"
        if len(words) >= size and " ".join(words[:size]) in names:
            return names[" ".join(words[:size])], size
    return None


def resolve_surah(raw: str, names: dict[str, int]) -> int | None:
    found = surah_prefix(raw.split(), names)
    return found[0] if found else None


@dataclass
class Corpus:
    """Per verse: squashed words (for matching) and vowelled words (for excerpts)."""

    words: dict[tuple[int, int], list[str]]
    squashed: dict[tuple[int, int], list[str]]
    # Per word, its root key, or for a word without one (a particle) its
    # lemma key: `~` and the lemma (`~fiY`), as the reader looks it up.
    roots: dict[tuple[int, int], list[str]]
    verses: dict[int, list[int]]
    lemmas: dict[tuple[int, int], list[str]] = field(default_factory=dict)  # squashed
    _by_root: dict[str, list[tuple[int, int]]] = field(default_factory=dict)

    def places(self, sura: int | None, keys: set[str]) -> list[tuple[int, int]]:
        """The verses of the surah, or, with none, every verse holding a word of the root."""
        if sura is not None:
            return [(sura, verse) for verse in self.verses[sura]]
        if not self._by_root:
            for place, roots in self.roots.items():
                for key in set(roots):
                    self._by_root.setdefault(key, []).append(place)
        return sorted({place for key in keys for place in self._by_root.get(key, [])})


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
    lemmas: dict[tuple[int, int], list[str]] = defaultdict(list)
    for row in index["rows"]:
        lemma = index["lemmas"][row[5]]
        roots[(row[0], row[1])].append(index["roots"][row[4]]["b"] or lemma_key(lemma["b"]))
        lemmas[(row[0], row[1])].append(squash(lemma["a"]))
    return Corpus(words, squashed, roots, verses, lemmas)


def lemma_key(lemma: str) -> str:
    """The key of a word without a root: its lemma (`~fiY`)."""
    return f"~{lemma}" if lemma else ""


def lemma_index() -> dict[str, set[str]]:
    """Unvowelled lemma → lemma keys, for the lemmas without a root (في, إلى, لعل)."""
    words = json.loads((OUT / "words.json").read_text(encoding="utf-8"))
    found: dict[str, set[str]] = defaultdict(set)
    for row in words["rows"]:
        if not words["roots"][row[4]]["b"]:
            lemma = words["lemmas"][row[5]]
            found[norm(lemma["a"])].add(lemma_key(lemma["b"]))
    return dict(found)


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
    sura: int = 0
    # Found by searching the whole Qur'an: he named another surah (يونس for
    # يوسف) or none. Held to a stricter standard; the audit flags it.
    elsewhere: bool = False
    # A bare `مثلها في سورة الحج`: the verse there that echoes the citation
    # before it. The audit flags it.
    parallel: bool = False


# Searching the whole Qur'an, a match must be longer and clearer.
ANYWHERE_WORDS = 3
ANYWHERE_FLOOR = 0.9
ANYWHERE_MARGIN = 0.05


def find_verse(
    fragment: str, sura: int | None, keys: set[str], corpus: Corpus
) -> VerseMatch | None:
    """The one verse of the surah (None: of the Qur'an) quoting the fragment and
    holding a word of the root, and where the quote starts. None when no verse
    or several fit."""
    frag = [w for w in (squash(x) for x in fragment.split()) if w]
    anywhere = sura is None
    if len(frag) < (ANYWHERE_WORDS if anywhere else 2):
        return None
    wanted = set(frag)
    scored = []
    for place in corpus.places(sura, keys):
        squashed = corpus.squashed[place]
        if len(wanted & set(squashed)) * 2 < len(wanted) or not keys & set(corpus.roots[place]):
            continue
        score, start = window_score(frag, squashed)
        if score >= (ANYWHERE_FLOOR if anywhere else MATCH_FLOOR):
            scored.append((score, place, start))
    if not scored:
        return None
    scored.sort(reverse=True)
    margin = scored[0][0] - scored[1][0] if len(scored) > 1 else 1.0
    if margin <= (ANYWHERE_MARGIN if anywhere else TIE):
        return None  # a repeated phrase: more than one verse fits
    score, (found, verse), start = scored[0]
    return VerseMatch(verse, start, score, margin, found, anywhere)


def find_word(
    roots: list[str],
    keys: set[str],
    start: int,
    length: int,
    lemmas: list[str] | None = None,
    names: tuple[set[str], ...] = (),
) -> int | None:
    """The word of the root inside the quoted run, else the nearest to it (1-based).
    With two of different lemmas inside, the one the sense names (`الريحان
    بعينه` → وَرَيْحَانٌ, not فَرَوْحٌ): each set of `names` in turn picks a word
    when it names exactly one; else the one nearest the middle. A `word`
    verdict settles the rest (see `apply_verdicts`)."""
    hits = [i for i, key in enumerate(roots) if key in keys]
    if not hits:
        return None
    inside = [i for i in hits if start <= i < start + length + 1]
    if lemmas and len({lemmas[i] for i in inside}) > 1:
        for named in names:
            picked = [i for i in inside if lemmas[i] in named]
            if len(picked) == 1:
                return picked[0] + 1
    middle = start + length / 2
    return min(hits, key=lambda i: (not start <= i < start + length + 1, abs(i - middle))) + 1


def lemma_names(label: str) -> tuple[set[str], ...]:
    """What a sense names, to choose between two words of the root: the words
    of its label (الريحان → ريحان). Not the headword: it is the root's letters,
    which match its verb (زين → زَيَّنَّا) whatever the sense."""
    words = {squash(w[2:] if w.startswith("ال") else w) for w in label.split()}
    return (words - {""},)


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
    as a doubled root (أم → أمم), or with a weak last letter. A two-letter
    headword names every such root, since he files them together (أب: the
    father, أبو, and the pasture, أبب). Failing all, a respelling
    (`root_respellings`)."""
    letters = norm(heading)
    base = letters[:-1] if len(letters) > 2 and letters.endswith("ه") else letters
    if len(base) == 2 and not {letters, base} & by_letters.keys():
        found = {
            key
            for form in (base + base[-1], base + "و", base + "ي")
            for key in by_letters.get(form, [])
        }
        if found:
            return found
    for form in (
        letters,
        base,
        base.replace("ء", "ا"),  # سوء → سوأ, before the weak-letter guesses
        base + base[-1:],
        base + "و",
        base + "ي",
        base[:-1] + "و",
        base[:-1] + "ي",
        *root_respellings(base),
    ):
        if form in by_letters:
            return set(by_letters[form])
    return set()


def root_respellings(base: str) -> list[str]:
    """Root letters a headword spelt otherwise may stand for: a bare hamza for
    an alif seat (يءس → يأس, وطء → وطأ), a middle ي for و (ريح → روح, سيد →
    سود, سيأ → سوأ), a final اء for a weak letter (سواء → سوي), a final ن
    left from an alif-less ـان (سلطن → سلط)."""
    seated = base.replace("ء", "ا")
    forms = [seated]
    if len(seated) == 3 and seated[1] == "ي":
        forms.append(seated[0] + "و" + seated[2])
    if base.endswith("اء") and len(base) == 4:
        forms += [base[:2] + "ي", base[:2] + "و"]
    if len(base) == 4 and base.endswith("ن"):
        forms.append(base[:3])
    if len(seated) == 3 and seated[1] == "ا":  # a hollow root with its alif (لات → لوت)
        forms += [seated[0] + "و" + seated[2], seated[0] + "ي" + seated[2]]
    return forms


# --- Build --------------------------------------------------------------------


# Headings the digitised text garbles, read by hand: the heading as caught →
# the headword shown and the words it is looked up by.
HEADINGS: dict[str, tuple[str, tuple[str, ...]]] = {
    "خلفإنأنإن": ("إن", ("إن",)),  # `… خلف إن أن إن`: the entry on إن
    "ليفحتى": ("حتى", ("حتى",)),
    "تبت": ("تابوت", ("تابوت",)),
    "حسننى": ("حسنى", ("حسن",)),
    "رأذرر": ("ذرية", ("ذرر",)),
    "ذوت": ("ذات", ("ذو",)),
    "سنوسوء": ("حسنة سيئة", ("حسن", "سوء")),  # الحسنة والسيئة, one entry
}


@dataclass
class Heading:
    """A headword and the keys it may be read by: its root keys, and for a
    headword spelt as a particle its lemma keys. Both may hold (أم: the mother,
    and the conjunction); `parse` keeps whichever places more citations."""

    text: str
    roots: set[str]
    lemmas: set[str]


def read_heading(
    groups: list[str], by_letters: dict[str, list[str]], by_lemma: dict[str, set[str]]
) -> Heading:
    joined = "".join(groups)
    if joined in HEADINGS:
        shown, words = HEADINGS[joined]
        roots = {k for w in words for k in root_keys(w, by_letters)}
        lemmas = {k for w in words for k in by_lemma.get(norm(w), set())}
        return Heading(shown, roots, lemmas)
    text, roots = headword(groups, by_letters)
    return Heading(text, roots, by_lemma.get(norm(joined), set()))


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


# --- Unquoted citations -------------------------------------------------------
#
# From the letter م on, the digitised text drops its quotation marks:
# `قوله تعالى في سورة النساء أم يحسدون الناس على ما آتاهم الله من فضله يعني
# محمدا`. A citation then starts after a marker (قوله, مثلها, في سورة …) and
# runs to the next one; where the Qur'an ends inside it is found by aligning
# its words with the verse, and the rest is his commentary.

OPENERS = {"قوله", "كقوله", "وقوله", "فقوله", "وكقوله", "مثلها", "ومثلها", "نظيرها", "ونظيرها"}
SPEAKERS = {"وقال", "قال"}  # only before تعالى / سبحانه / الله
FILLERS = {"تعالى", "سبحانه", "وتعالى", "عز", "وجل", "جل", "ذكره", "الله"}
STOPS = OPENERS | {"ونحوه"}


@dataclass
class Span:
    sura: int | None  # named before the span, else None (the one before it)
    words: list[str]  # his words from the start of the quotation to the next marker
    named: bool  # a surah was named but not recognised


def is_opener(words: list[str], i: int) -> bool:
    word = words[i]
    after = words[i + 1] if i + 1 < len(words) else ""
    return (
        word in OPENERS
        or (word in SPEAKERS and after in FILLERS)
        or (word in {"في", "وفي"} and norm(after) == "سوره")
        or norm(word) in {"سوره", "وسوره"}
    )


def unquoted_spans(chunk: str, names: dict[str, int]) -> list[Span]:
    """The citations of a sense written without quotation marks."""
    words = MARKS.sub(" ", DASH_VOCAL.sub(" ", chunk)).split()
    spans: list[Span] = []
    # A surah named before another opener with no words between
    # (`مثلها في سورة يونس قوله سبحانه …`) is the next citation's.
    pending: int | None = None
    i = 0
    while i < len(words):
        if not is_opener(words, i):
            i += 1
            continue
        sura, named = None, False
        i += 0 if norm(words[i]) in {"سوره", "وسوره"} else 1
        while i < len(words):
            if words[i] in FILLERS or words[i] == "فيها":  # فيها: the same surah
                i += 1
            elif norm(words[i]) in {"سوره", "وسوره"} or (
                words[i] in {"في", "وفي"} and i + 1 < len(words) and norm(words[i + 1]) == "سوره"
            ):
                i += 1 if norm(words[i]) in {"سوره", "وسوره"} else 2
                found = surah_prefix(words[i:], names)
                sura, named = (found[0], False) if found else (None, True)
                i += found[1] if found else 0
            else:
                break
        end = i
        while end < len(words) and not is_opener(words, end) and words[end] not in STOPS:
            end += 1
        if end > i:
            spans.append(Span(sura or (None if named else pending), words[i:end], named))
            pending = None
        elif sura:
            pending = sura
        i = end
    return spans


def same_word(a: str, b: str) -> bool:
    """Two squashed words agree, allowing a slip of the pen (اعتتدى, اعتدى)."""
    if a == b:
        return True
    if min(len(a), len(b)) < 3:
        return False
    return SequenceMatcher(None, a, b).ratio() >= 0.75


SPAN_FLOOR = 3  # words of the Qur'an a citation must run to, unless that is all of it
SPAN_SKIP = 2  # words he may leave out, or put, before the run starts


def span_words(span: list[str]) -> list[list[str]]:
    """His words as the Uthmani text divides them: a vocative يا is written
    joined to its noun (يا عيسى → يَٰعِيسَى, يا أيها → يَٰٓأَيُّهَا). Each item
    keeps the words of his it stands for."""
    out: list[list[str]] = []
    for word in span:
        if out and squash(out[-1][-1]) == "ي" and len(out[-1]) == 1:
            out[-1].append(word)
        elif squash(word):
            out.append([word])
    return out


@dataclass
class Run:
    size: int  # words of the verse quoted
    skip: int  # words of the span before them
    start: int  # where they start in the verse (0-based)


def longest_run(span: list[str], verse: list[str]) -> Run:
    """The longest run of the span's words, from one of its first, found in the verse."""
    best = Run(0, 0, 0)
    for skip in range(min(SPAN_SKIP, len(span) - 1) + 1):
        for start in range(len(verse)):
            size = 0
            while (
                skip + size < len(span)
                and start + size < len(verse)
                and same_word(span[skip + size], verse[start + size])
            ):
                size += 1
            if size > best.size:
                best = Run(size, skip, start)
    return best


ANYWHERE_RUN = 4  # words a run must reach when searching the whole Qur'an


def align_span(
    span: list[str], sura: int | None, keys: set[str], corpus: Corpus
) -> tuple[VerseMatch, Run] | None:
    """The one verse of the surah (None: of the Qur'an) that the span opens by
    quoting, with the run of words quoted. None when the run is short or
    another verse quotes as much."""
    words = ["".join(squash(w) for w in group) for group in span_words(span)]
    anywhere = sura is None
    runs = []
    for place in corpus.places(sura, keys):
        roots = corpus.roots[place]
        if not keys & set(roots):
            continue
        run = longest_run(words, corpus.squashed[place])
        hit = any(key in keys for key in roots[run.start : run.start + run.size])
        whole = run.size >= 2 and run.size == len(words) and not anywhere
        if hit and (run.size >= (ANYWHERE_RUN if anywhere else SPAN_FLOOR) or whole):
            runs.append((run.size, place, run))
    if not runs:
        return None
    runs.sort(key=lambda r: r[0], reverse=True)
    size, place, run = runs[0]
    runner = runs[1][0] if len(runs) > 1 else 0
    if runner >= size:
        return None  # a repeated phrase: more than one verse fits
    quoted = " ".join(words[run.skip : run.skip + size])
    found = " ".join(corpus.squashed[place][run.start : run.start + size])
    score = SequenceMatcher(None, quoted, found).ratio()
    match = VerseMatch(place[1], run.start, score, (size - runner) / size, place[0], anywhere)
    return match, run


# --- Bare parallels -----------------------------------------------------------
#
# `قوله تعالى في سورة البقرة " لتكونوا شهداء على الناس " مثلها في سورة الحج`:
# no quotation follows the second surah; the verse meant is the one there that
# echoes the citation before it (22:78 وتكونوا شهداء على الناس).

PARALLELS = {"مثلها", "ومثلها", "نظيرها", "ونظيرها"}
ENDS = {".", "،", ",", "ونحوه", "ونحو", "ونحوها", "ونظائرها"}
PARALLEL_FLOOR = 0.75
PARALLEL_MARGIN = 0.05


def tokens(text: str) -> list[str]:
    """Words, with each quotation mark a word of its own."""
    return MARKS.sub(" ", DASH_VOCAL.sub(" ", text)).replace('"', ' " ').split()


@dataclass
class Bare:
    at: int  # the reference's first token
    suras: list[int]


def bare_references(words: list[str], names: dict[str, int], quoted: bool = False) -> list[Bare]:
    """References to a surah that quote nothing. Where he quotes with marks,
    any not followed by a quotation (or a قوله that brings one); without
    marks, those followed by the end of the sense or another parallel."""
    found = []
    for i, word in enumerate(words):
        if word not in PARALLELS and not (word in OPENERS and i + 1 < len(words)):
            continue
        j = i + 1
        while j < len(words) and words[j] in FILLERS:
            j += 1
        if j < len(words) and words[j] in {"في", "وفي"}:
            j += 1
        if j >= len(words) or norm(words[j]) != "سوره":
            continue
        named = surah_prefix(words[j + 1 :], names)
        if not named:
            continue
        suras, j = [named[0]], j + 1 + named[1]
        # `في سورة الحجرات ولقمان`
        while j < len(words) and words[j].startswith("و"):
            more = surah_prefix([words[j][1:], *words[j + 1 :]], names)
            if not more:
                break
            suras.append(more[0])
            j += more[1]
        after = words[j] if j < len(words) else "."
        if quoted:
            bare = after != '"' and after not in OPENERS - PARALLELS
        else:
            bare = after in ENDS or after in PARALLELS or after in {"في", "وفي"}
        if bare:
            found.append(Bare(i, suras))
    return found


def locate(words: list[str], fragment: str, before: int) -> int:
    """Where the fragment's words last start before `before`, or -1."""
    frag = tokens(fragment)
    size = len(frag)
    for start in range(min(before, len(words)) - size, -1, -1):
        if words[start : start + size] == frag:
            return start
    return -1


def find_parallel(fragment: str, sura: int, keys: set[str], corpus: Corpus) -> VerseMatch | None:
    """The one verse of the surah that echoes the fragment."""
    frag = [w for w in (squash(x) for x in fragment.split()) if w]
    scored = []
    for place in corpus.places(sura, keys):
        if not keys & set(corpus.roots[place]):
            continue
        score, start = window_score(frag, corpus.squashed[place])
        if score >= PARALLEL_FLOOR:
            scored.append((score, place, start))
    if not scored:
        return None
    scored.sort(reverse=True)
    margin = scored[0][0] - scored[1][0] if len(scored) > 1 else 1.0
    if margin <= PARALLEL_MARGIN:
        return None
    score, (found, verse), start = scored[0]
    return VerseMatch(verse, start, score, margin, found, parallel=True)


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

    def absorb(self, other: Review) -> None:
        self.no_surah += other.no_surah
        self.no_verse += other.no_verse
        for name, n in other.counts.items():
            self.counts[name] += n


GLOSS = re.compile(r"^\s*[.،,]?\s*(?:يعني|أي)\s+")


def local_gloss(after: str) -> str:
    """The يعني or أي that glosses a quotation: `" … " يعني ثوابهم` → ثوابهم."""
    match = GLOSS.match(MARKS.sub("", after))
    if not match:
        return ""
    words = LABEL_END.split(MARKS.sub("", after)[match.end() :], maxsplit=1)[0].split()
    return " ".join(words[:LABEL_WORDS])


def parse_unquoted(
    chunk: str,
    keys: set[str],
    corpus: Corpus,
    names: dict[str, int],
    review: Review,
    names_of: tuple[set[str], ...] = (),
) -> list[Cite]:
    cites: list[Cite] = []
    sura: int | None = None
    for span in unquoted_spans(chunk, names):
        review.counts["citations"] += 1
        sura = None if span.named else span.sura or sura
        text = " ".join(span.words)
        aligned = (sura is not None and align_span(span.words, sura, keys, corpus)) or align_span(
            span.words, None, keys, corpus
        )
        if not aligned:
            (review.no_verse if sura else review.no_surah).append(f"{sura or '?'} | {text}")
            continue
        found, run = aligned
        groups = span_words(span.words)
        quoted = [w for group in groups[run.skip : run.skip + run.size] for w in group]
        rest = [w for group in groups[run.skip + run.size :] for w in group]
        place = (found.sura, found.verse)
        word = find_word(
            corpus.roots[place], keys, found.start, run.size, corpus.lemmas.get(place), names_of
        )
        if word is None:
            continue
        cite = Cite(
            found.sura, found.verse, word, " ".join(quoted), found, local_gloss(" ".join(rest))
        )
        if cite.position not in [c.position for c in cites]:
            cites.append(cite)
            review.counts["placed"] += 1
    return cites


def parse_parallels(
    chunk: str,
    cites: list[Cite],
    keys: set[str],
    corpus: Corpus,
    names: dict[str, int],
    review: Review,
    names_of: tuple[set[str], ...],
) -> list[Cite]:
    """The verses his bare parallels point to, after the citations they echo."""
    words = tokens(chunk)
    found: list[Cite] = []
    for bare in bare_references(words, names, quoted='"' in chunk):
        placed = [(locate(words, c.fragment, bare.at), c) for c in cites]
        before = [(at, c) for at, c in placed if at >= 0]
        if not before:
            continue
        echoed = max(before, key=lambda pair: pair[0])[1]
        for sura in bare.suras:
            review.counts["citations"] += 1
            match = find_parallel(echoed.fragment, sura, keys, corpus)
            if not match:
                review.no_verse.append(f"{sura} | ≈ {echoed.fragment}")
                continue
            place = (match.sura, match.verse)
            word = find_word(
                corpus.roots[place],
                keys,
                match.start,
                len(echoed.fragment.split()),
                corpus.lemmas.get(place),
                names_of,
            )
            if word is None:
                continue
            cite = Cite(match.sura, match.verse, word, echoed.fragment, match, "")
            if cite.position not in [c.position for c in [*cites, *found]]:
                found.append(cite)
                review.counts["placed"] += 1
    return found


def parse_sense(
    chunk: str, heading: str, keys: set[str], corpus: Corpus, names: dict[str, int], review: Review
) -> Sense:
    label = sense_label(chunk, heading)
    names_of = lemma_names(label)
    if '"' not in chunk:
        cites = parse_unquoted(chunk, keys, corpus, names, review, names_of)
    else:
        cites = parse_quoted(chunk, keys, corpus, names, review, names_of)
    cites += parse_parallels(chunk, cites, keys, corpus, names, review, names_of)
    return Sense(chunk, label, cites)


def parse_quoted(
    chunk: str,
    keys: set[str],
    corpus: Corpus,
    names: dict[str, int],
    review: Review,
    names_of: tuple[set[str], ...],
) -> list[Cite]:
    cites: list[Cite] = []
    sura: int | None = None
    quotes = list(CITE.finditer(chunk))
    for i, quote in enumerate(quotes):
        raw_surah, fragment = quote.group(1) or "", quote.group(2)
        review.counts["citations"] += 1
        sura = resolve_surah(raw_surah, names) if raw_surah else sura
        found = (sura is not None and find_verse(fragment, sura, keys, corpus)) or find_verse(
            fragment, None, keys, corpus
        )
        if not found:
            if sura is None:
                review.no_surah.append(f"{raw_surah} | {fragment}")
            else:
                review.no_verse.append(f"{sura} | {fragment}")
            continue
        place = (found.sura, found.verse)
        word = find_word(
            corpus.roots[place],
            keys,
            found.start,
            len(fragment.split()),
            corpus.lemmas.get(place),
            names_of,
        )
        if word is None:
            continue
        after = chunk[quote.end() : quotes[i + 1].start() if i + 1 < len(quotes) else None]
        cite = Cite(found.sura, found.verse, word, fragment, found, local_gloss(after))
        if cite.position not in [c.position for c in cites]:
            cites.append(cite)
            review.counts["placed"] += 1
    return cites


def parse(text: str, corpus: Corpus, review: Review) -> list[Parsed]:
    """Every entry whose senses parse cleanly, with its citations placed."""
    names = surah_names()
    by_letters = root_index()
    by_lemma = lemma_index()
    parsed = []
    for entry in split_entries(text):
        review.counts["entries"] += 1
        head = read_heading(entry.groups, by_letters, by_lemma)
        heading = head.text
        if not head.roots and not head.lemmas:
            review.no_root.append(entry.heading)
            continue
        senses = split_senses(entry.body)
        if not senses or (entry.declared and len(senses) != entry.declared):
            review.unclean.append(f"{heading}: {len(senses)} of {entry.declared}")
            continue
        review.counts["kept"] += 1
        readings = []
        for keys in (head.roots, head.lemmas):
            if keys:
                trial = Review()
                built = [parse_sense(c, heading, keys, corpus, names, trial) for c in senses]
                readings.append((sum(len(s.cites) for s in built), keys, built, trial))
        # The reading that places more citations; on a tie, the root.
        _, keys, built, trial = max(readings, key=lambda r: r[0])
        review.absorb(trial)
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
# move files the citation under sense `to` (1-based), drop removes it, word
# points it at word `to` of the verse (1-based) where the quotation holds two
# of the root (3:173 قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ).
VERDICT_KINDS = ("agree", "viewpoint", "label", "move", "drop", "word")


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
                if kind == "word" and verdict.get("to", 0) >= 1:
                    cite.word = verdict["to"]
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
        # Under its root, and under any other root its citations land on
        # (أب cites both أبو and أبب), so the words of each find it. A particle
        # goes only under the lemmas it cites: ثُمَّ "then", not ثَمَّ "there".
        cited = {
            corpus.roots[(c.sura, c.verse)][c.word - 1]
            for sense in entry.senses
            for c in sense.cites
        }
        if entry.root.startswith("~"):
            keys = sorted(cited & entry.keys) or [entry.root]
        else:
            keys = [entry.root, *sorted(cited & entry.keys - {entry.root})]
        for root in keys:
            out[root].append({"h": entry.heading, "s": senses})
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
    print(f"verdicts applied {applied} (label, move, drop, word) from {VERDICTS.relative_to(ROOT)}")
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
    "title": "Iṣlāḥ al-Wujūh wa-l-Naẓāʾir (al-Dāmaghānī)",
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
