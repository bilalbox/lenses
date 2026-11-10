#!/usr/bin/env python3
"""Build the i'rab dictionary data file from al-Mu'jam al-Mufassal fi al-I'rab.

Author: Tahir Yusuf al-Khatib (طاهر يوسف الخطيب)
Review & Introduction: Dr. Emil Badi' Ya'qub (د. إميل بديع يعقوب)
Source EPUB: https://thahabi.org/book/20680, cached in data/cache/almujam-almufassal.epub.

Outputs:
  - public/data/quran/irabDictionary.json
  - Updates public/data/quran/manifest.json
  - Updates public/data/NOTICES.txt
"""

from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path
from typing import Any

from pipeline import CACHE, OUT, add_notice, edit_manifest, upsert_source, write_json

LOCAL_DOWNLOAD_EPUB = Path("/mnt/c/users/bilal/downloads/المعجم المفصل في الإعراب.epub")
CACHED_EPUB = CACHE / "almujam-almufassal.epub"
OUT_FILE = OUT / "irabDictionary.json"
VERSES_FILE = OUT / "verses.json"
WORDS_FILE = OUT / "words.json"
MANIFEST_FILE = OUT / "manifest.json"

SOURCE_ID = "khatib-irab"
SOURCE_RECORD = {
    "id": SOURCE_ID,
    "title": "Al-Mu'jam al-Mufassal fi al-I'rab (al-Khatib)",
    "kind": "classical-irab",
    "attribution": ("Tahir Yusuf al-Khatib, with review and introduction by Dr. Emil Badi' Ya'qub"),
    "description": (
        "Alphabetical reference dictionary of Arabic grammatical particles, "
        "functional words, and syntactic rules with model parsing and Quranic citations, "
        "plus model parsing of Surah al-Fatihah and Surah al-Baqarah (1-25)."
    ),
    "license": "Public educational use; digitized via thahabi.org (book 20680)",
    "url": "https://thahabi.org/book/20680",
}

NOTICE_TITLE = "Al-Mu'jam al-Mufassal fi al-I'rab (al-Khatib)"
NOTICE_BODY = """Title: Al-Mu'jam al-Mufassal fi al-I'rab (المعجم المفصل في الإعراب)
Author: Tahir Yusuf al-Khatib (طاهر يوسف الخطيب)
Review and Introduction: Dr. Emil Badi' Ya'qub (د. إميل بديع يعقوب)
Publisher: Dar al-Kutub al-Ilmiyyah, Beirut (1991)
Source: Digitized edition via thahabi.org (https://thahabi.org/book/20680)
Description: Alphabetical reference compendium of Arabic grammatical particles,
syntactical tools, and i'rab parse models with Quranic verse citations, and an
appendix of complete model parsing for Surah al-Fatihah and al-Baqarah 1-25."""


def ensure_epub() -> Path:
    """Ensure cached EPUB exists, copying from downloads if available."""
    if CACHED_EPUB.exists() and CACHED_EPUB.stat().st_size > 10_000:
        return CACHED_EPUB
    if LOCAL_DOWNLOAD_EPUB.exists():
        CACHED_EPUB.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(LOCAL_DOWNLOAD_EPUB, CACHED_EPUB)
        print(f"Copied {LOCAL_DOWNLOAD_EPUB} to {CACHED_EPUB}")
        return CACHED_EPUB
    raise FileNotFoundError(
        f"EPUB file not found at {CACHED_EPUB} or {LOCAL_DOWNLOAD_EPUB}. "
        "Please download it from https://thahabi.org/book/20680."
    )


def norm_ar(s: str) -> str:
    """Normalize Arabic text for indexing and fuzzy matching."""
    s = re.sub(r"[ىي]\u0670", "ي", s)
    s = s.replace("\u0670", "ا")  # dagger alif -> alif
    s = re.sub(r"[ً-ٟـٱ\s\(\)«»\.\،\:\-\_\—\?؟\!]", "", s)
    s = s.translate(
        str.maketrans(
            {
                "أ": "ا",
                "إ": "ا",
                "آ": "ا",
                "ء": "ا",
                "ؤ": "ا",
                "ئ": "ا",
                "ى": "ي",
                "ة": "ه",
            }
        )
    )
    return s


def load_surah_map() -> dict[str, int]:
    """Map normalized surah names to 1-114 surah numbers."""
    manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
    sura_map: dict[str, int] = {}
    for u in manifest.get("units", []):
        name: str = u["name"]
        norm = norm_ar(name).removeprefix("ال")
        sura_map[norm] = u["n"]
        sura_map[name] = u["n"]
    # Common alternate names and typos in footnotes
    sura_map.update(
        {
            "تلانسان": 76,
            "الانسان": 76,
            "انسان": 76,
            "اللهب": 111,
            "مسد": 111,
            "اسراء": 17,
            "الاسراء": 17,
            "فصلت": 41,
            "الفصلت": 41,
            "صافات": 37,
            "الصافات": 37,
            "المجادلة": 58,
            "مجادلة": 58,
        }
    )
    return sura_map


def load_verse_corpus() -> list[tuple[int, int, str]]:
    """Load normalized Quran verses for citation matching."""
    verses_data = json.loads(VERSES_FILE.read_text(encoding="utf-8"))
    return [(v[0], v[1], norm_ar(v[2])) for v in verses_data]


def parse_page_footnotes(
    z: zipfile.ZipFile, sura_map: dict[str, int]
) -> dict[int, dict[int, tuple[int, int]]]:
    """Extract page-level Quran footnotes from EPUB."""
    pages_fn: dict[int, dict[int, tuple[int, int]]] = {}
    for i in range(1, 14):
        content = z.read(f"OEBPS/text-{i:04d}.xhtml").decode("utf-8", errors="replace")
        if i == 13:
            idx = content.find("ملحق")
            if idx != -1:
                content = content[:idx]

        pages = re.split(
            r"<div[^>]*class=[\"']pn[\"'][^>]*id=[\"']page-(\d+)[\"'][^>]*>",
            content,
        )
        if len(pages) > 1:
            for idx in range(1, len(pages), 2):
                p_num = int(pages[idx])
                p_html = pages[idx + 1]
                fns = re.findall(r"\((\d+)\)\s*سورة\s*([^:\n<]+):\s*آية\s*(\d+)", p_html)
                if fns:
                    fn_dict: dict[int, tuple[int, int]] = {}
                    for fn_n, s_name, a_num in fns:
                        s_norm = norm_ar(s_name).removeprefix("ال")
                        s_id = sura_map.get(s_norm)
                        if s_id:
                            fn_dict[int(fn_n)] = (s_id, int(a_num))
                    pages_fn[p_num] = fn_dict
    return pages_fn


def _resolve_citations(
    paras: list[tuple[int, str]],
    pages_fn: dict[int, dict[int, tuple[int, int]]],
    verse_corpus: list[tuple[int, int, str]],
) -> list[list[int]]:
    """Find all Quranic verse citations in an entry body."""
    citations: set[tuple[int, int]] = set()
    for p_num, text in paras:
        for m in re.findall(r"\((\d+)\)", text):
            fn_val = pages_fn.get(p_num, {}).get(int(m))
            if fn_val:
                citations.add(fn_val)

        quotes = re.findall(
            r"(?:قوله|كقوله|قال)\s*(?:تعالى|عزّ وجلّ|جلّ وعلا)?[^\(（]{0,25}[\(（]([^\)）]+)[\)）]",
            text,
        )
        for q in quotes:
            qn = norm_ar(q)
            if len(qn) < 8:
                continue
            for s, a, vt in verse_corpus:
                if qn in vt:
                    citations.add((s, a))
                    break

    sorted_cites = sorted(citations, key=lambda c: (c[0], c[1]))
    return [[c[0], c[1]] for c in sorted_cites]


def _build_entry(
    entry_id: int,
    head: str,
    bab: str,
    page: int,
    paras: list[tuple[int, str]],
    pages_fn: dict[int, dict[int, tuple[int, int]]],
    verse_corpus: list[tuple[int, int, str]],
) -> dict[str, Any]:
    return {
        "id": entry_id,
        "title": head,
        "bab": bab,
        "page": page,
        "body": [text for _, text in paras],
        "citations": _resolve_citations(paras, pages_fn, verse_corpus),
    }


def parse_dictionary_entries(
    z: zipfile.ZipFile,
    pages_fn: dict[int, dict[int, tuple[int, int]]],
    verse_corpus: list[tuple[int, int, str]],
) -> list[dict[str, Any]]:
    """Parse main dictionary entries across chapters 1 to 13."""
    entries: list[dict[str, Any]] = []
    current_bab = ""
    current_head = ""
    current_page = 1
    current_paras: list[tuple[int, str]] = []

    def commit() -> None:
        nonlocal current_head, current_paras
        if current_head and current_paras:
            entries.append(
                _build_entry(
                    len(entries),
                    current_head,
                    current_bab,
                    current_page,
                    current_paras,
                    pages_fn,
                    verse_corpus,
                )
            )
            current_head = ""
            current_paras = []

    for i in range(1, 14):
        content = z.read(f"OEBPS/text-{i:04d}.xhtml").decode("utf-8", errors="replace")
        if i == 13:
            idx = content.find("ملحق")
            if idx != -1:
                content = content[:idx]

        blocks = re.findall(r"<(p|div)([^>]*)>(.*?)</\1>", content, re.DOTALL)
        for tag, attrs, inner in blocks:
            clean = re.sub(r"<[^>]+>", "", inner).strip()
            if not clean:
                continue

            if tag == "div" and "doc-pagebreak" in attrs:
                m_p = re.search(r"id=[\"']page-(\d+)[\"']", attrs)
                if m_p:
                    current_page = int(m_p.group(1))
                continue

            if clean.startswith("__________________") or re.match(r"^\(\d+\)\s*سورة\s*", clean):
                continue

            if clean.startswith("باب ") and len(clean) < 30:
                current_bab = clean
                continue

            if clean.startswith("ـ") and clean.endswith("ـ") and len(clean) <= 40:
                commit()
                current_head = clean.strip("ـ \t\r\n")
            elif current_head:
                current_paras.append((current_page, clean))

    commit()
    return entries


def parse_appendix(z: zipfile.ZipFile) -> dict[str, dict[str, Any]]:
    """Parse Dr. Emil Badi' Ya'qub's model i'rab appendix for Surah 1 & 2:1-25."""
    content = z.read("OEBPS/text-0013.xhtml").decode("utf-8", errors="replace")
    idx = content.find("ملحق")
    if idx == -1:
        return {}

    app_html = content[idx:]
    idx_baqarah = app_html.find("سورة البقرة", 100)
    if idx_baqarah == -1:
        idx_baqarah = len(app_html)

    sections = [
        (1, app_html[:idx_baqarah]),
        (2, app_html[idx_baqarah:]),
    ]

    appendix: dict[str, dict[str, Any]] = {}

    for sura, sec_html in sections:
        verse_blocks = re.split(
            r"<p[^>]*>(?:<[^>]+>)*\s*(\d+)\s*ـ\s*[\(（]([^\)）]+)[\)）]",
            sec_html,
        )
        for i in range(1, len(verse_blocks), 3):
            v_num = int(verse_blocks[i])
            v_text = verse_blocks[i + 1].strip()
            v_body = verse_blocks[i + 2]

            paras = [
                re.sub(r"<[^>]+>", "", p).strip()
                for p in re.findall(r"<p[^>]*>(.*?)</p>", v_body, re.DOTALL)
            ]
            paras = [
                p
                for p in paras
                if p and not p.startswith("—") and not p.startswith("__________________")
            ]

            words: list[dict[str, str]] = []
            sentences: list[str] = []
            notes: list[str] = []

            for p in paras:
                if re.match(r"^\(\d+\)", p) or p.startswith("(*)"):
                    notes.append(p)
                elif p.startswith("وجملة ") or p.startswith("والجملة "):
                    sentences.append(p)
                elif ":" in p or "：" in p:
                    parts = re.split(r"[:：]", p, maxsplit=1)
                    words.append({"w": parts[0].strip(), "i": parts[1].strip()})
                else:
                    sentences.append(p)

            key = f"{sura}:{v_num}"
            appendix[key] = {
                "sura": sura,
                "verse": v_num,
                "text": v_text,
                "words": words,
                "sentences": sentences,
                "notes": notes,
            }

    return appendix


def build_indexes(
    entries: list[dict[str, Any]],
    appendix: dict[str, dict[str, Any]],
) -> tuple[dict[str, list[int]], dict[str, list[int]]]:
    """Build byWord and byVerse indexes for fast lookup."""
    by_word: dict[str, list[int]] = {}
    by_verse: dict[str, list[int]] = {}

    def add_word_key(key: str, entry_id: int) -> None:
        k = norm_ar(key)
        if len(k) >= 2:
            by_word.setdefault(k, [])
            if entry_id not in by_word[k]:
                by_word[k].append(entry_id)

    for e in entries:
        eid = e["id"]
        title = e["title"]

        # 1. Full normalized title
        add_word_key(title, eid)

        # 2. Sub-words if title is compound (e.g. لا سيما, حسبك درهم)
        for part in re.split(r"[\s،,-]+", title):
            add_word_key(part, eid)

        # 3. By-verse mapping for cited verses
        for sura, verse in e["citations"]:
            v_key = f"{sura}:{verse}"
            by_verse.setdefault(v_key, [])
            if eid not in by_verse[v_key]:
                by_verse[v_key].append(eid)

    # 4. Map Quran lemmas from words.json
    if WORDS_FILE.exists():
        words_data = json.loads(WORDS_FILE.read_text(encoding="utf-8"))
        for lem in words_data.get("lemmas", []):
            lem_ar = lem.get("a", "")
            lem_norm = norm_ar(lem_ar)
            if lem_norm in by_word:
                # Already indexed; also link exact raw lemma string if distinct
                add_word_key(lem_ar, by_word[lem_norm][0])

    # 5. Link appendix verses into by_verse (negative IDs or handled via appendix key)
    # The appendix is stored as its own top-level map, but we also ensure by_verse knows them
    for v_key in appendix:
        by_verse.setdefault(v_key, [])

    return by_word, by_verse


def main() -> None:
    epub_path = ensure_epub()
    print(f"Reading {epub_path}...")

    sura_map = load_surah_map()
    verse_corpus = load_verse_corpus()

    with zipfile.ZipFile(epub_path, "r") as z:
        print("Parsing footnotes...")
        pages_fn = parse_page_footnotes(z, sura_map)

        print("Parsing dictionary entries...")
        entries = parse_dictionary_entries(z, pages_fn, verse_corpus)

        print("Parsing appendix model i'rab...")
        appendix = parse_appendix(z)

    print(f"Parsed {len(entries)} entries and {len(appendix)} appendix verses.")

    by_word, by_verse = build_indexes(entries, appendix)

    total_citations = sum(len(e["citations"]) for e in entries)
    print(f"Total citations: {total_citations} across {len(by_verse)} distinct verses.")
    print(f"Indexed {len(by_word)} normalized word keys.")

    payload = {
        "metadata": {
            "title": "المعجم المفصل في الإعراب",
            "author": "طاهر يوسف الخطيب",
            "reviewer": "د. إميل بديع يعقوب",
            "entriesCount": len(entries),
            "citationsCount": total_citations,
            "appendixVersesCount": len(appendix),
        },
        "entries": entries,
        "byWord": by_word,
        "byVerse": by_verse,
        "appendix": appendix,
    }

    print(f"Writing {OUT_FILE}...")
    write_json(OUT_FILE, payload)

    print("Updating manifest and notices...")
    edit_manifest(lambda m: upsert_source(m, SOURCE_RECORD))
    add_notice(NOTICE_TITLE, NOTICE_BODY)

    print("Done!")


if __name__ == "__main__":
    main()
