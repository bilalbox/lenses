#!/usr/bin/env python3
"""Build one dictionary file per Quranic root for the word sheet.

Downloads (cached in data/cache/, each pinned to a commit):
  - Lane's Arabic-English Lexicon, Perseus TEI XML with the fixes in
    laneslexicon/lexicon_xml (Perseus terms: credit, keep the availability
    statement, offer Perseus our changes)
  - Ibn Faris, Maqayis al-Lugha, and al-Raghib, al-Mufradat, from OpenITI
    (CC BY-NC-SA 4.0); the classical main text only

Writes public/data/quran/lexicon/{slug}.json for each corpus root found in at
least one dictionary, and adds the sources to manifest.json and NOTICES.txt.
Run after build_data.py, which writes the root list in words.json.
"""

from __future__ import annotations

import json
import re
import shutil
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from collections.abc import Callable, Iterator
from pathlib import Path
from typing import Any

from pipeline import CACHE, OUT, add_notice, edit_manifest, fetch_cached, upsert_source, write_json

LANE_SHA = "f3c19fb29f2cf2e12de3f97b7ce2b7a0d6682ea6"
LANE_ZIP_URL = f"https://codeload.github.com/laneslexicon/lexicon_xml/zip/{LANE_SHA}"
LANE_CREDIT = (
    "Text provided by Perseus Digital Library, with funding from "
    "The U.S. Department of Education and The Max Planck Society."
)
OPENITI_RAW = "https://raw.githubusercontent.com/OpenITI"
MAQAYIS = (
    "0400AH",
    "5bb6966d8df2ed22b1bff5cdbe29bb9c24f3ca29",
    "0395IbnFarisQazwini/0395IbnFarisQazwini.MucjamMaqayis/"
    "0395IbnFarisQazwini.MucjamMaqayis.Shamela0021710-ara1",
)
MUFRADAT = (
    "0525AH",
    "6290621b58e063ed1aa47ffd0a6fc1630191e7cb",
    "0502RaghibIsbahani/0502RaghibIsbahani.Mufradat/"
    "0502RaghibIsbahani.Mufradat.Shamela0023636-ara1",
)
LEXICON = OUT / "lexicon"
REVIEW = CACHE / "review" / "lexicon-unmatched.json"

# --- Root keys ---------------------------------------------------------------

# Uppercase Buckwalter letters get a "2" so `nws` (نوس) and `nwS` (نوص) stay
# apart on case-insensitive filesystems; `$` and `*` are not URL-safe.
SLUG_SYMBOLS = {"$": "c", "*": "o"}


def lexicon_slug(root: str) -> str:
    """File name for a Buckwalter root key. Mirrored by `lexiconSlug` in src/lib/lexicon.ts."""
    out = []
    for ch in root:
        if ch in SLUG_SYMBOLS:
            out.append(SLUG_SYMBOLS[ch])
        elif ch.isupper():
            out.append(f"{ch.lower()}2")
        else:
            out.append(ch)
    return "".join(out)


HAMZA_FORMS = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ء": "ا", "ؤ": "ا", "ئ": "ا", "ى": "ي"})
ARABIC_MARKS = re.compile(r"[ً-ٰٟـ]")


def heading_letters(text: str) -> str:
    """A heading's letters as written, hamza seats and final ى kept."""
    return ARABIC_MARKS.sub("", text).replace(" ", "")


def plain_words(text: str) -> list[str]:
    """The Arabic words of a text, unvowelled, every hamza as ا and ى as ي."""
    return re.findall(r"[ء-ي]+", ARABIC_MARKS.sub("", text).translate(HAMZA_FORMS))


def root_letters(text: str) -> str:
    """Bare root letters as the corpus writes them: every hamza as ا, final ى as ي."""
    return ARABIC_MARKS.sub("", text).translate(HAMZA_FORMS).replace(" ", "")


# --- Lane --------------------------------------------------------------------

# Port of convertString in laneslexicon/lexicon_parser/lane.pl. Perseus writes
# hamza as `^` after its seat, madda as `=`, hamza below as `_`, so the corpus
# Buckwalter table does not apply.
LANE_DIGRAPHS = (("A@", "{"), ("A_", "I"), ("A^", "O"), ("y^", "}"), ("w^", "W"))
LANE_LETTERS = str.maketrans(
    {
        **dict(zip("'|OWI}A", "ءآأؤإئا", strict=True)),
        **dict(zip("bptvjHx", "بةتثجحخ", strict=True)),
        **dict(zip("d*rzs$S", "دذرزسشص", strict=True)),
        **dict(zip("DTZEg-f", "ضطظعغـف", strict=True)),
        **dict(zip("qklmnhw", "قكلمنهو", strict=True)),
        **dict(zip("YyFNKau", "ىيًٌٍَُ", strict=True)),
        **dict(zip("i~o`{", "ِّْٰٱ", strict=True)),
        **dict(zip("PJVG", "پچڤگ", strict=True)),
        **dict(zip("^=_", "ٕٔٓ", strict=True)),
    }
)


def lane_arabic(text: str) -> str:
    for pair, letter in LANE_DIGRAPHS:
        text = text.replace(pair, letter)
    return text.translate(LANE_LETTERS)


ITALIC = 1
ARABIC = 2
Run = str | list[Any]


def _push(runs: list[Run], kind: int, text: str) -> None:
    """Append text, merging with the previous run of the same kind."""
    if not text:
        return
    last = runs[-1] if runs else None
    if kind == 0 and isinstance(last, str):
        runs[-1] = last + text
    elif kind and isinstance(last, list) and last[0] == kind:
        last[1] += text
    else:
        runs.append(text if kind == 0 else [kind, text])


def _walk(el: ET.Element, kind: int, runs: list[Run]) -> None:
    tag = el.tag
    if tag == "form":
        pass  # the headword is shown on its own
    elif tag in ("foreign", "orth") and el.get("lang") == "ar":
        _push(runs, ARABIC, lane_arabic("".join(el.itertext())))
    elif tag != "pb":
        own = ITALIC if tag == "hi" and el.get("rend") == "ital" else kind
        _push(runs, own, el.text or "")
        for child in el:
            _walk(child, own, runs)
    _push(runs, kind, el.tail or "")


def lane_runs(entry: ET.Element) -> list[Run]:
    runs: list[Run] = []
    _push(runs, 0, entry.text or "")
    for child in entry:
        _walk(child, 0, runs)
    tidy: list[Run] = []
    for run in runs:
        text = re.sub(r"\s+", " ", run if isinstance(run, str) else run[1])
        if text.strip():
            tidy.append(text if isinstance(run, str) else [run[0], text])
    if tidy and isinstance(tidy[0], str):
        tidy[0] = tidy[0].lstrip(" ,")
    if tidy and isinstance(tidy[-1], str):
        tidy[-1] = tidy[-1].rstrip()
    return [run for run in tidy if run]


def lane_headword(entry: ET.Element) -> tuple[str, str]:
    """(verb form number or "", Arabic headword) from the entry's <form>."""
    form = entry.find("form")
    itype = (form.findtext("itype") or "").strip() if form is not None else ""
    orths = [] if form is None else [(o.text or "").strip() for o in form.findall("orth")]
    word = next((o for o in orths if o and o != "*" and not o.isdigit()), entry.get("key", ""))
    return itype, lane_arabic(word)


def iter_lane_roots(archive: Path) -> Iterator[tuple[str, int, list[dict[str, Any]]]]:
    """(Buckwalter root, first page, entries) per root, in lexicon order."""
    page = 0
    with zipfile.ZipFile(archive) as bundle:
        names = sorted(n for n in bundle.namelist() if n.endswith(".xml"))
        for name in names:
            tree = ET.fromstring(bundle.read(name))
            for div in tree.iter("div2"):
                if div.get("type") != "root":
                    continue
                start = page
                entries = []
                for el in div.iter():
                    if el.tag == "pb" and (el.get("n") or "").isdigit():
                        page = int(el.get("n") or 0)
                    elif el.tag == "entryFree":
                        itype, head = lane_headword(el)
                        entry: dict[str, Any] = {"h": head, "t": lane_runs(el)}
                        if itype:
                            entry["f"] = itype
                        entries.append(entry)
                yield div.get("n") or "", start or page, entries


LANE_HAMZA = re.compile(r"[AwyI]\^|A_|A'|'")


def lane_root_key(root: str) -> str:
    """Lane's root key in corpus form: every hamza as `A`, final ى as `y`, a
    two-letter (doubled) root with its last letter repeated."""
    key = LANE_HAMZA.sub("A", root).replace("Y", "y")
    return key + key[-1] if len(key) == 2 else key


def load_lane(archive: Path, roots: set[str]) -> dict[str, dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {}
    for lane_root, page, entries in iter_lane_roots(archive):
        root = lane_root_key(lane_root)
        if root not in roots or not entries:
            continue
        if root in found:
            found[root]["e"].extend(entries)
        else:
            found[root] = {"p": page, "e": entries}
    return found


# --- OpenITI -----------------------------------------------------------------

NOISE = re.compile(r"PageV\d+P\d+|\bms\d+\b|«\d+»|@")


def openiti_lines(text: str) -> list[str]:
    """Body lines after the metadata header, with page, manuscript and footnote markers removed."""
    body = text.split("#META#Header#End#", 1)[1]
    return [NOISE.sub("", line).rstrip() for line in body.splitlines()]


def openiti_sections(lines: list[str]) -> Iterator[tuple[str, list[str]]]:
    """(heading, paragraphs) for each `### |` section; `~~` lines continue a paragraph."""
    heading: str | None = None
    paragraphs: list[str] = []
    for line in lines:
        if line.startswith("### |"):
            if heading is not None:
                yield heading, paragraphs
            heading, paragraphs = line[5:].strip(), []
        elif line.startswith("~~") and paragraphs:
            paragraphs[-1] = f"{paragraphs[-1]} {line[2:].strip()}"
        elif line.startswith("#"):
            paragraphs.append(line.lstrip("# ").strip())
    if heading is not None:
        yield heading, paragraphs


SENTENCE_END = (".", "؟", "!", "»", '"', "]", ")")


def clean_paragraphs(paragraphs: list[str]) -> list[str]:
    """Collapse spaces, and rejoin paragraphs the print split mid-sentence at a page turn."""
    out: list[str] = []
    for text in (re.sub(r"\s+", " ", p).strip() for p in paragraphs):
        if not text:
            continue
        if out and not out[-1].endswith(SENTENCE_END):
            out[-1] = f"{out[-1]} {text}"
        else:
            out.append(text)
    return out


def append_to(entry: list[str], paragraphs: list[str]) -> None:
    entry[:] = clean_paragraphs([*entry, *paragraphs])


# A stray heading in the middle of running text is part of a word: the word
# before it may end in one or two letters of it (`اللام وا` | `لطا` | `ء والفاء`
# for والطاء), and the text after it may start with the rest (`طري` | `ف، …`).
SHORT_TAIL = re.compile(r"(?:^|[^ء-ي])[ء-ي]{1,2}$")
WORD_TAIL = re.compile(r"^(?:[ء-ي][،,.:؛ ]|[ء-ي]{2}[،,.:؛])")


def glue_stray(entry: list[str], heading: str, paragraphs: list[str]) -> None:
    """Put a stray heading back into the entry's running text."""
    last = entry.pop() if entry else ""
    first, rest = (paragraphs[0], paragraphs[1:]) if paragraphs else ("", [])
    left = f"{last}{heading}" if SHORT_TAIL.search(last) else f"{last} {heading}".strip()
    joined = f"{left}{first}" if WORD_TAIL.match(first) else f"{left} {first}".strip()
    append_to(entry, [joined, *rest])


MAQAYIS_HEADING = re.compile(r"^\(([ء-ي]+)\)$")


def parse_maqayis(lines: list[str]) -> dict[str, list[str]]:
    """Root letters → paragraphs. Only `(xyz)` headings are entries; two letters mean a doubled root."""
    found: dict[str, list[str]] = defaultdict(list)
    current: str | None = None
    for heading, paragraphs in openiti_sections(lines):
        match = MAQAYIS_HEADING.match(heading)
        if match:
            letters = heading_letters(match.group(1))
            current = letters + letters[-1] if len(letters) == 2 else letters
            append_to(found[current], paragraphs)
        elif heading.startswith("["):
            current = None  # a كتاب / باب heading
        elif current:
            glue_stray(found[current], heading, paragraphs)
    return {letters: text for letters, text in found.items() if text}


MUFRADAT_START = "كتاب الألف"
MUFRADAT_END = "مقدمة للفهارس"
MUFRADAT_HEADING = re.compile(r"^[ء-ي ]+$")
# OpenITI often tags a line a little before the real headword, which is left as
# a bare paragraph (`### | علم`, two lines of علق, then `# علم`).
HEADWORD_LOOKAHEAD = 40
# An untagged one-word line of two to four letters, without the article or و,
# is a headword OpenITI did not tag at all (`# ربو`).
BARE_HEADWORD = re.compile(r"^# (?!ال|و)([ء-ي]{2,4})\s*$")


def retag_headwords(lines: list[str]) -> list[str]:
    """Move each heading tag onto its bare headword line when one follows it
    within the same section; the lines in between go back to the entry before."""
    out = list(lines)
    for i, line in enumerate(lines):
        if not line.startswith("### | "):
            continue
        bare = f"# {line[6:].strip()}"
        for j in range(i + 1, min(i + HEADWORD_LOOKAHEAD, len(lines))):
            if lines[j].startswith("### |"):
                break
            if lines[j].strip() == bare:
                out[i], out[j] = "", f"### | {line[6:].strip()}"
                break
    return [line for line in out if line]


def mufradat_range(lines: list[str]) -> list[str]:
    """The dictionary itself: from كتاب الألف up to the editor's indexes."""
    start = next(i for i, line in enumerate(lines) if line.startswith(f"### | {MUFRADAT_START}"))
    end = next(i for i, line in enumerate(lines) if MUFRADAT_END in line and i > start)
    retagged = retag_headwords(lines[start:end])
    return [BARE_HEADWORD.sub(r"### | \1", line) for line in retagged]


def mentions_root(letters: str, text: str) -> bool:
    """Whether the opening of `text` has a word with the root's strong letters in order."""
    core = [ch for ch in letters if ch not in WEAK_OR_HAMZA] or list(letters)
    pattern = re.compile(".*?".join(map(re.escape, core)))
    return any(pattern.search(word) for word in plain_words(text[:160]))


def leading_strays(letters: str, paragraphs: list[str]) -> int:
    """How many opening paragraphs belong to the entry before: those that never
    name the root, when a later paragraph does."""
    for index, text in enumerate(paragraphs):
        if mentions_root(letters, text):
            return index
    return 0


def mufradat_key(heading: str, found: dict[str, list[str]]) -> str:
    """Root letters for a heading. A two-letter heading used twice (أب: grass,
    then father) names two roots, so both go under a key no root matches."""
    letters = heading_letters(heading)
    if len(letters) == 2 and (letters in found or f"{letters}?" in found):
        found[f"{letters}?"] = found.pop(letters, []) + found.pop(f"{letters}?", [])
        return f"{letters}?"
    return letters


def parse_mufradat(lines: list[str]) -> dict[str, list[str]]:
    """Heading letters → paragraphs. Headings that are not Arabic words (`454-`)
    or that split a word continue the entry."""
    found: dict[str, list[str]] = defaultdict(list)
    current: str | None = None
    for heading, paragraphs in openiti_sections(mufradat_range(lines)):
        if heading.startswith("كتاب"):
            current = None
        elif not MUFRADAT_HEADING.match(heading) or (
            paragraphs and WORD_TAIL.match(paragraphs[0]) and not paragraphs[0].startswith(heading)
        ):
            if current:
                glue_stray(found[current], heading, paragraphs)
        else:
            letters = root_letters(heading)
            strays = leading_strays(letters, paragraphs)
            if current and strays:
                append_to(found[current], paragraphs[:strays])
            current = mufradat_key(heading, found)
            append_to(found[current], paragraphs[strays:])
    return {letters: text for letters, text in found.items() if text}


WEAK_OR_HAMZA = ("ا", "و", "ي")
FINAL_WEAK = ("و", "ي", "ى")


def letter_variants(heading: str) -> set[str]:
    """Other corpus spellings of a heading written with a weak letter.

    Works on the heading as written, where a bare ا is a weak letter and أ ء ئ ؤ
    are hamza: a bare ا may stand for و or ي (دعا → دعو, خاب → خيب), and a final
    و / ي / ى may be either (صلى → صلو). A medial و is never read as ي, nor a
    hamza as a weak letter: (عيق) is not عوق, (كوس) is not كأس. A two-letter
    heading may be a doubled or a weak root (أب → أبب, أبو, أبي)."""
    if len(heading) == 2:
        bases = [heading + heading[-1], heading + "و", heading + "ي"]
    else:
        bases = [heading]
    out: set[str] = set()
    for base in bases:
        forms = {base}
        for i, ch in enumerate(base):
            last = i == len(base) - 1
            if i > 0 and (ch == "ا" or (last and ch in FINAL_WEAK)):
                forms |= {f[:i] + w + f[i + 1 :] for f in forms for w in ("و", "ي")}
        out |= {root_letters(form) for form in forms}
    return out - {root_letters(heading)}


def match_headings(
    entries: dict[str, list[str]],
    by_letters: dict[str, list[str]],
    accepts_variant: Callable[[str, list[str]], bool] = lambda _letters, _text: True,
) -> tuple[dict[str, list[str]], list[str]]:
    """Corpus root key → paragraphs, and the headings no root fits.

    Exact letters first. Then a heading that matched nothing may take a doubled
    or weak-letter reading, when exactly one corpus root still unclaimed fits it
    and `accepts_variant(root letters, paragraphs)` agrees; anything else is
    left for review."""
    matched: dict[str, list[str]] = {}
    pending: list[str] = []
    for heading, paragraphs in entries.items():
        keys = by_letters.get(root_letters(heading), [])
        if len(keys) == 1 and keys[0] not in matched:
            matched[keys[0]] = paragraphs
        else:
            pending.append(heading)
    unmatched: list[str] = []
    for heading in pending:
        key = variant_key(heading, entries[heading], by_letters, matched, accepts_variant)
        if key:
            matched[key] = entries[heading]
        else:
            unmatched.append(heading)
    return matched, unmatched


def variant_key(
    heading: str,
    paragraphs: list[str],
    by_letters: dict[str, list[str]],
    matched: dict[str, list[str]],
    accepts: Callable[[str, list[str]], bool],
) -> str | None:
    """The one unclaimed corpus root a heading can be read as, if any."""
    if len(heading) == 2:  # al-Raghib heads doubled roots رب, صف, ضر
        doubled = root_letters(heading + heading[-1])
        keys = [k for k in by_letters.get(doubled, []) if k not in matched]
        if len(keys) == 1 and accepts(doubled, paragraphs):
            return keys[0]
    fits = {
        (variant, key)
        for variant in letter_variants(heading)
        for key in by_letters.get(variant, [])
        if key not in matched
    }
    if len(fits) != 1:
        return None
    letters, key = fits.pop()
    return key if accepts(letters, paragraphs) else None


def maqayis_is_weak(_letters: str, paragraphs: list[str]) -> bool:
    """Ibn Faris names a root's letters first; "والحرف المعتل" covers و and ي
    alike, but "وهو الواو" pins the entry to one of them."""
    opening = paragraphs[0][:90]
    return "معتل" in opening and "وهو الواو" not in opening and "وهو الياء" not in opening


RAGHIB_OPENERS = {"قال", "قوله", "يقال", "اصل", "وقوله", "وقال"}


def root_word(letters: str) -> re.Pattern[str]:
    """A word of the root: a weak letter may surface as ا, و or ي, or drop
    inside the word (a final one must show, so بل is not بلو); a doubled letter may be written once; the article and a short ending (ة, ية,
    ات …) may go around it."""
    parts = []
    for i, ch in enumerate(letters):
        if i > 0 and ch in WEAK_OR_HAMZA:
            parts.append("[اوي]" if i == len(letters) - 1 else "[اوي]?")
        elif i > 0 and ch == letters[i - 1]:
            parts.append(f"{ch}?")
        else:
            parts.append(ch)
    return re.compile(rf"(?:وال|ال|و)?{''.join(parts)}[اويةهتن]{{0,2}}")


def names_root(letters: str, paragraphs: list[str]) -> bool:
    """Whether an entry opens the way al-Raghib opens one for this root: with a
    word of it (الدعاء, الخيبة, السير, كم) or one of his usual openers (قال
    تعالى, يقال, أصل). A fragment of the entry before (`ق/ 1] ، وانشق`,
    `بلد،`) does not pass."""
    words = plain_words(paragraphs[0][:60])
    return bool(words) and (
        words[0] in RAGHIB_OPENERS or bool(root_word(letters).fullmatch(words[0]))
    )


def trim_to_root(letters: str, paragraphs: list[str]) -> list[str] | None:
    """Drop a leftover of the entry before from the front of an entry: start at
    the first paragraph that opens with the root (`… حميم [الأنعام/ 70] …`, then
    `الحمد لله …`). None when no paragraph does."""
    for index, text in enumerate(paragraphs):
        if mentions_root(letters, text[:60]):
            return paragraphs[index:]
    return None


# --- Build -------------------------------------------------------------------


def corpus_roots() -> dict[str, str]:
    """Buckwalter root key → Arabic letters, from words.json."""
    words = json.loads((OUT / "words.json").read_text(encoding="utf-8"))
    return {root["b"]: root["a"] for root in words["roots"] if root["b"]}


def check_slugs(roots: dict[str, str]) -> None:
    seen: dict[str, str] = {}
    for key in roots:
        slug = lexicon_slug(key).lower()
        if slug in seen:
            raise SystemExit(f"lexicon slug collision: {seen[slug]} and {key} → {slug}")
        seen[slug] = key


def fetch_sources() -> tuple[Path, str, str]:
    archive = fetch_cached(LANE_ZIP_URL, CACHE / "lane" / f"lexicon_xml-{LANE_SHA[:12]}.zip")
    texts = []
    for name, (repo, sha, path) in (("maqayis", MAQAYIS), ("mufradat", MUFRADAT)):
        dest = CACHE / "openiti" / f"{name}-{sha[:12]}.txt"
        fetch_cached(f"{OPENITI_RAW}/{repo}/{sha}/data/{path}", dest)
        texts.append(dest.read_text(encoding="utf-8"))
    return archive, texts[0], texts[1]


def repair_openings(found: dict[str, list[str]], roots: dict[str, str]) -> dict[str, list[str]]:
    """Entries whose opening never names the root carry the tail of the entry
    before (an OpenITI tag slip). Trim each to its first word of the root, or
    drop it when there is none. Returns what was trimmed or dropped, for review."""
    review: dict[str, list[str]] = {"trimmed": [], "dropped": []}
    for key in sorted(found):
        letters = root_letters(roots[key])
        if len(set(letters)) < 3 or mentions_root(letters, found[key][0][:60]):
            continue
        trimmed = trim_to_root(letters, found[key])
        if trimmed:
            found[key] = trimmed
            review["trimmed"].append(key)
        else:
            del found[key]
            review["dropped"].append(key)
    return review


def write_lexicon(roots: dict[str, str], sources: dict[str, dict[str, Any]]) -> int:
    if LEXICON.exists():
        shutil.rmtree(LEXICON)
    written = 0
    for key in roots:
        entry = {name: found[key] for name, found in sources.items() if key in found}
        if not entry:
            continue
        write_json(LEXICON / f"{lexicon_slug(key)}.json", {"r": key, **entry})
        written += 1
    return written


def main() -> None:
    roots = corpus_roots()
    check_slugs(roots)
    by_letters: dict[str, list[str]] = defaultdict(list)
    for key, arabic in roots.items():
        by_letters[root_letters(arabic)].append(key)

    archive, maqayis_text, mufradat_text = fetch_sources()
    lane = load_lane(archive, set(roots))
    maqayis, maqayis_miss = match_headings(
        parse_maqayis(openiti_lines(maqayis_text)), by_letters, maqayis_is_weak
    )
    mufradat, mufradat_miss = match_headings(
        parse_mufradat(openiti_lines(mufradat_text)), by_letters, names_root
    )
    repaired = repair_openings(mufradat, roots)
    sources: dict[str, dict[str, Any]] = {"lane": lane, "maqayis": maqayis, "mufradat": mufradat}
    written = write_lexicon(roots, sources)

    write_json(
        REVIEW,
        {
            "laneMissingRoots": sorted(set(roots) - set(lane)),
            "maqayisUnmatchedHeadings": sorted(maqayis_miss),
            "mufradatUnmatchedHeadings": sorted(mufradat_miss),
            "mufradatOpeningsTrimmed": repaired["trimmed"],
            "mufradatOpeningsDropped": repaired["dropped"],
        },
        pretty=True,
    )
    total = len(roots)
    for name, found in sources.items():
        print(f"{name}: {len(found)}/{total} corpus roots ({len(found) / total:.1%})")
    print(f"unmatched headings: maqayis {len(maqayis_miss)}, mufradat {len(mufradat_miss)}")
    print(f"wrote {written} root files; review list in {REVIEW.relative_to(CACHE.parent.parent)}")

    def edit(manifest: dict[str, Any]) -> None:
        manifest.setdefault("stats", {})["lexiconRoots"] = written
        for source in SOURCES:
            upsert_source(manifest, source)

    edit_manifest(edit)
    for title, *body in NOTICES:
        add_notice(title, "\n".join(body))


SOURCES: list[dict[str, Any]] = [
    {
        "id": "lane-lexicon",
        "title": "Lane's Arabic-English Lexicon",
        "kind": "dictionary",
        "attribution": f"Edward William Lane (1863-1893). {LANE_CREDIT}",
        "description": (
            "Lane's entries for each Quranic root, with Perseus's Arabic transliteration "
            "converted to Arabic script."
        ),
        "license": (
            "Perseus availability terms: free to distribute with credit to Perseus, "
            "the availability statement kept, and changes offered to Perseus"
        ),
        "url": "https://github.com/laneslexicon/lexicon_xml",
    },
    {
        "id": "openiti-maqayis",
        "title": "Muʿjam Maqāyīs al-Lugha (Ibn Fāris)",
        "kind": "dictionary",
        "attribution": (
            "Ibn Fāris (d. 395 AH); digital text from the OpenITI corpus "
            "(ed. ʿAbd al-Salām Hārūn, 1979)"
        ),
        "description": "The core meaning of each root, main text only.",
        "license": "CC BY-NC-SA 4.0 (OpenITI corpus release)",
        "url": "https://github.com/OpenITI/0400AH",
    },
    {
        "id": "openiti-mufradat",
        "title": "al-Mufradāt fī Gharīb al-Qurʾān (al-Rāghib al-Iṣfahānī)",
        "kind": "dictionary",
        "attribution": (
            "al-Rāghib al-Iṣfahānī (d. 502 AH); digital text from the OpenITI corpus "
            "(ed. Ṣafwān al-Dāwūdī)"
        ),
        "description": "The Qur'anic senses of each root, main text only.",
        "license": "CC BY-NC-SA 4.0 (OpenITI corpus release)",
        "url": "https://github.com/OpenITI/0525AH",
    },
]

NOTICES: list[list[str]] = [
    [
        "Lane's Arabic-English Lexicon (Perseus Digital Library)",
        "Edward William Lane, An Arabic-English Lexicon (London: Williams and Norgate, 1863-1893).",
        "Digital text: Perseus Digital Library, Tufts University, with XML fixes from",
        f"https://github.com/laneslexicon/lexicon_xml at commit {LANE_SHA}.",
        "Availability statement, as given in the source files:",
        "  This text may be freely distributed, subject to the following restrictions:",
        "  You credit Perseus, as follows, whenever you use the document:",
        f"  {LANE_CREDIT}",
        "  You leave this availability statement intact.",
        "  You offer Perseus any modifications you make.",
        "Changes made for Lenses: Arabic transliteration converted to Arabic script",
        "(following laneslexicon/lexicon_parser), markup reduced to plain, italic and",
        "Arabic text, and only roots that occur in the Qur'an kept.",
    ],
    [
        "OpenITI: Maqayis al-Lugha and al-Mufradat",
        "Source: OpenITI corpus (https://github.com/OpenITI), released under",
        "CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/).",
        f"Maqayis al-Lugha: {MAQAYIS[2].rsplit('/', 1)[1]} at {MAQAYIS[0]}@{MAQAYIS[1]}.",
        f"al-Mufradat: {MUFRADAT[2].rsplit('/', 1)[1]} at {MUFRADAT[0]}@{MUFRADAT[1]}.",
        "Lenses keeps the authors' main text only: editors' introductions, indexes,",
        "footnote markers, page markers and manuscript markers are removed. The",
        "derived dictionary files are shared under the same CC BY-NC-SA 4.0 terms.",
    ],
]


if __name__ == "__main__":
    main()
