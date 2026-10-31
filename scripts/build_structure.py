#!/usr/bin/env python3
"""Compile Maraya ring composition + Tanāsuq al-Durar munāsabāt into lazy JSON.

Sources (cached under data/cache/):
  - Maraya (Ayah Labs / maraya.app) SPA bundle — structural blocks, families, pivots
  - Turath books-v3/9992.json — al-Suyūṭī, Tanāsuq al-Durar fī Tanāsub al-Suwar

Emits:
  - public/data/quran/structure/001.json .. 114.json
  - public/data/quran/transitions.json
  - updates manifest.json + NOTICES.txt
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from pipeline import (
    CACHE,
    MANIFEST,
    OUT,
    add_notice,
    edit_manifest,
    fetch_cached,
    surah_path,
    upsert_source,
    write_json,
)

MARAYA_URL = "https://maraya.app/assets/index-5WaNZ_Wy.js"
TANASUQ_URL = "https://files.turath.io/books-v3/9992.json"

PRIME = "′"

# Extra Arabic aliases used in Tanāsuq headings (not always identical to Tanzil names).
SURAH_ALIASES: dict[str, list[int]] = {
    "الفاتحة": [1],
    "البقرة": [2],
    "آل عمران": [3],
    "النساء": [4],
    "المائدة": [5],
    "الأنعام": [6],
    "الأعراف": [7],
    "الأنفال": [8],
    "براءة": [9],
    "التوبة": [9],
    "يونس": [10],
    "هود": [11],
    "يوسف": [12],
    "الرعد": [13],
    "إبراهيم": [14],
    "الحجر": [15],
    "النحل": [16],
    "بني إسرائيل": [17],
    "الإسراء": [17],
    "الكهف": [18],
    "مريم": [19],
    "طه": [20],
    "الأنبياء": [21],
    "الحج": [22],
    "المؤمنون": [23],
    "النور": [24],
    "الفرقان": [25],
    "الشعراء": [26],
    "النمل": [27],
    "القصص": [28],
    "العنكبوت": [29],
    "الروم": [30],
    "لقمان": [31],
    "السجدة": [32],
    "الأحزاب": [33],
    "سبأ": [34],
    "فاطر": [35],
    "يس": [36],
    "الصفات": [37],
    "الصفافات": [37],
    "ص": [38],
    "الزمر": [39],
    "غافر": [40],
    "فصلت": [41],
    "الشورى": [42],
    "الزخرف": [43],
    "الدخان": [44],
    "الجاثية": [45],
    "الأحقاف": [46],
    "القتال": [47],
    "محمد": [47],
    "الفتح": [48],
    "الحجرات": [49],
    "ق": [50],
    "الذاريات": [51],
    "الطور": [52],
    "النجم": [53],
    "القمر": [54],
    "الرحمن": [55],
    "الواقعة": [56],
    "الحديد": [57],
    "المجادلة": [58],
    "الحشر": [59],
    "الممتحنة": [60],
    "الصف": [61],
    "الجمعة": [62],
    "المنافقون": [63],
    "التغابن": [64],
    "الطلاق": [65],
    "التحريم": [66],
    "تبارك": [67],
    "الملك": [67],
    "ن": [68],
    "القلم": [68],
    "الحاقة": [69],
    "سأل": [70],
    "المعارج": [70],
    "نوح": [71],
    "الجن": [72],
    "المزمل": [73],
    "المدثر": [74],
    "القيامة": [75],
    "الإنسان": [76],
    "المراسلات": [77],
    "المرسلات": [77],
    "عم": [78],
    "النبأ": [78],
    "النازعات": [79],
    "عبس": [80],
    "التكوير": [81],
    "الانفطار": [82],
    "المطففين": [83],
    "الانشقاق": [84],
    "البروج": [85],
    "الطارق": [86],
    "الأعلى": [87],
    "الغاشية": [88],
    "الفجر": [89],
    "البلد": [90],
    "الشمس": [91],
    "الليل": [92],
    "الضحى": [93],
    "ألم نشرح": [94],
    "الشرح": [94],
    "التين": [95],
    "العلق": [96],
    "القدر": [97],
    "لم يكن": [98],
    "البينة": [98],
    "الزلزلة": [99],
    "العاديات": [100],
    "القارعة": [101],
    "التكاثر": [102],
    "العصر": [103],
    "الهمزة": [104],
    "الفيل": [105],
    "قريش": [106],
    "الماعون": [107],
    "الكوثر": [108],
    "الكافرون": [109],
    "النصر": [110],
    "تبت": [111],
    "المسد": [111],
    "الإخلاص": [112],
    "الفلق": [113],
    "الناس": [114],
}

NARRATIVE_PAIRS = (("N1", "N4"), ("N2", "N3"), ("N3", "N2"), ("N4", "N1"))
TRANSITION_PAIRS = (("T1", "T3"), ("T3", "T1"))


def fetch(url: str, dest: Path) -> Path:
    return fetch_cached(url, dest, user_agent="Lenses/1.0 (structure build)", min_size=10_000)


def extract_js_object(js: str, name: str) -> str:
    """Return the `{...}` source assigned to `name` in a minified bundle."""
    match = re.search(rf"(?:const |let |,|;){re.escape(name)}=\{{", js)
    if not match:
        match = re.search(rf"\b{re.escape(name)}=\{{", js)
    if not match:
        raise RuntimeError(f"assignment for {name} not found in Maraya bundle")
    start = js.find("{", match.start())
    depth = 0
    in_str: str | None = None
    escape = False
    for idx in range(start, len(js)):
        ch = js[idx]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in "\"'`":
            in_str = ch
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return js[start : idx + 1]
    raise RuntimeError(f"unclosed object for {name}")


def js_object_to_data(obj_src: str) -> Any:
    """Convert a limited JS object literal into Python via JSON."""
    fixed = re.sub(r"(?<=\{|,)(\d+):", r'"\1":', obj_src)
    fixed = re.sub(r"([{,])([A-Za-z_][\w]*):", r'\1"\2":', fixed)
    fixed = re.sub(r"(?<![0-9])(-?)\.(\d+)", r"\g<1>0.\2", fixed)
    return json.loads(fixed)


def load_maraya(cache_dir: Path) -> dict[str, Any]:
    """Parse structural datasets embedded in the Maraya SPA bundle."""
    js_path = fetch(MARAYA_URL, cache_dir / "maraya" / "index.js")
    js = js_path.read_text(encoding="utf-8", errors="replace")

    blocks = js_object_to_data(extract_js_object(js, "Vh"))
    pivot_stats = js_object_to_data(extract_js_object(js, "xs"))
    pivot_fns = {
        int(num): fn
        for num, fn in re.findall(
            r'(\d+):\{fn:"([A-Z_]+)"',
            js[js.find("Ph={") : js.find("Ph={") + 12_000],
        )
    }
    if len(pivot_fns) != 114:
        raise RuntimeError(f"expected 114 pivot functions, got {len(pivot_fns)}")

    fam_match = re.search(r"Pv=JSON\.parse\(`(.*?)`\)", js, re.S)
    if not fam_match:
        raise RuntimeError("family metadata JSON.parse payload missing")
    families = {int(row["surah_number"]): row for row in json.loads(fam_match.group(1))}

    names_match = re.search(r"\$v=JSON\.parse\('(.*?)'\)", js, re.S)
    if not names_match:
        raise RuntimeError("surah names JSON.parse payload missing")
    raw_names = names_match.group(1)
    if "\\u" in raw_names[:800]:
        names_list = json.loads(raw_names.encode("utf-8").decode("unicode_escape"))
    else:
        names_list = json.loads(raw_names)
    names = {int(row["surah_number"]): row for row in names_list}

    return {
        "blocks": blocks,
        "pivot_stats": pivot_stats,
        "pivot_fns": pivot_fns,
        "families": families,
        "names": names,
    }


def strip_html(text: str) -> str:
    """Remove HTML tags and collapse whitespace for classical excerpts."""
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def normalize_ar_key(text: str) -> str:
    """Normalize Arabic for alias lookup."""
    text = re.sub(r"[\u064b-\u065f\u0670\u06d6-\u06ed]", "", text)
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ى", "ي")
    text = text.replace("ة", "ه")
    text = re.sub(r"[^\u0600-\u06ff0-9]+", "", text)
    return text


def build_alias_index(manifest_units: list[dict[str, Any]]) -> dict[str, list[int]]:
    """Map normalized Arabic labels to surah numbers."""
    index: dict[str, list[int]] = {}
    for unit in manifest_units:
        n = int(unit["n"])
        for label in (unit["name"], unit.get("phonetic", "")):
            key = normalize_ar_key(str(label))
            if key:
                index.setdefault(key, [])
                if n not in index[key]:
                    index[key].append(n)
    for label, nums in SURAH_ALIASES.items():
        key = normalize_ar_key(label)
        index.setdefault(key, [])
        for n in nums:
            if n not in index[key]:
                index[key].append(n)
    return index


def surahs_from_title(title: str, alias_index: dict[str, list[int]]) -> list[int]:
    """Resolve a Tanāsuq TOC title into one or more surah numbers."""
    cleaned = re.sub(r"^سورة\s*", "", title.strip())
    cleaned = cleaned.strip(" :：،.-–—﴾﴿")
    if not cleaned:
        return []
    key = normalize_ar_key(cleaned)
    found: list[int] = []

    # Hawāmīm cluster treated under غافر in this edition.
    if "غافر" in cleaned or "الحواميم" in cleaned or "حواميم" in cleaned:
        for n in range(40, 47):
            found.append(n)

    # Longest-alias wins so short keys like "ق" do not hijack "الطارق".
    aliases = sorted(alias_index.items(), key=lambda kv: len(kv[0]), reverse=True)
    consumed = [False] * len(key)
    for alias_key, nums in aliases:
        if len(alias_key) < 2:
            continue
        start = 0
        while True:
            at = key.find(alias_key, start)
            if at < 0:
                break
            if not any(consumed[at : at + len(alias_key)]):
                for i in range(at, at + len(alias_key)):
                    consumed[i] = True
                for n in nums:
                    if n not in found:
                        found.append(n)
            start = at + 1
    return found


def extract_tanasuq_sections(
    book: dict[str, Any],
    alias_index: dict[str, list[int]],
) -> dict[int, str]:
    """Map surah number -> Arabic body discussing that surah's placement."""
    pages = book["pages"]
    title_hits: list[tuple[int, int, str, list[int]]] = []
    # (page_index, char_offset_in_page_text, title, surahs)
    for page_idx, page in enumerate(pages):
        text = page["text"]
        for match in re.finditer(r'<span data-type="title"[^>]*>(.*?)</span>', text):
            title = strip_html(match.group(1))
            surahs = surahs_from_title(title, alias_index)
            if surahs:
                title_hits.append((page_idx, match.end(), title, surahs))

    # Append sentinel end
    title_hits.append((len(pages), 0, "__END__", []))
    sections: dict[int, str] = {}
    for i, (page_idx, offset, _title, surahs) in enumerate(title_hits[:-1]):
        next_page_idx, next_offset, _, _ = title_hits[i + 1]
        chunks: list[str] = []
        if page_idx == next_page_idx:
            chunks.append(pages[page_idx]["text"][offset:next_offset])
        else:
            chunks.append(pages[page_idx]["text"][offset:])
            for mid in range(page_idx + 1, next_page_idx):
                chunks.append(pages[mid]["text"])
            if next_page_idx < len(pages):
                chunks.append(pages[next_page_idx]["text"][:next_offset])
        body = strip_html("\n".join(chunks))
        # Drop trailing TOC/index noise
        body = re.split(r"\n(?:فهرس|أهم المصادر)", body, maxsplit=1)[0].strip()
        if len(body) < 40:
            continue
        for sura in surahs:
            # Keep the longest excerpt if a surah appears in multiple headings
            if len(body) > len(sections.get(sura, "")):
                sections[sura] = body
    return sections


def infer_pair_id(block_id: str, id_set: set[str]) -> str | None:
    """Infer symmetrical partner id for a Maraya block."""
    if block_id.endswith(PRIME):
        base = block_id[: -len(PRIME)]
        return base if base in id_set else None
    primed = block_id + PRIME
    if primed in id_set:
        return primed
    for left, right in NARRATIVE_PAIRS + TRANSITION_PAIRS:
        if block_id == left and right in id_set:
            return right
    return None


def normalize_block_spans(
    blocks: list[dict[str, Any]],
    verse_count: int,
) -> list[dict[str, Any]]:
    """Expand sparse Maraya highlights into a contiguous 1..N partition.

    Short surahs in Maraya often mark thematic anchors rather than full coverage.
    The diptych visualizer needs contiguous hemispheres, so we keep block order /
    labels and stretch spans to abut from verse 1 through verse_count.
    """
    if not blocks:
        return blocks
    ordered = sorted(blocks, key=lambda b: (int(b["v"][0]), int(b["v"][1])))
    starts = [int(b["v"][0]) for b in ordered]
    ends = [int(b["v"][1]) for b in ordered]
    new_starts = [1]
    new_ends: list[int] = []
    for idx in range(len(ordered) - 1):
        # Boundary between this block and the next: midpoint of original abutment.
        boundary = (ends[idx] + starts[idx + 1]) // 2
        boundary = max(new_starts[idx], min(boundary, verse_count - (len(ordered) - idx - 1)))
        new_ends.append(boundary)
        new_starts.append(boundary + 1)
    new_ends.append(verse_count)
    normalized: list[dict[str, Any]] = []
    for block, start, end in zip(ordered, new_starts, new_ends, strict=True):
        if end < start:
            end = start
        item = dict(block)
        item["v"] = [start, end]
        normalized.append(item)
    return normalized


def canonicalize_block_id(block_id: str) -> str:
    """Normalize Maraya id variants (D_ → D′, trailing underscore primes)."""
    if block_id.endswith("_"):
        return block_id[:-1] + PRIME
    return block_id


def ensure_pivot_block(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Guarantee one pivot/center block for diptych keystone rendering."""
    if any(b["role"] in {"pivot", "center"} for b in blocks):
        return blocks
    for block in blocks:
        if block["role"] == "seam" or block["id"] in {"SEAM", "PIVOT", "CENTER"}:
            block["role"] = "pivot"
            return blocks
    mid = len(blocks) // 2
    blocks[mid]["role"] = "pivot"
    return blocks


def enrich_blocks(
    raw_blocks: list[dict[str, Any]],
    verse_count: int,
) -> list[dict[str, Any]]:
    """Add pairId links and normalize verse spans."""
    enriched: list[dict[str, Any]] = []
    for block in raw_blocks:
        start, end = int(block["v"][0]), int(block["v"][1])
        item: dict[str, Any] = {
            "id": canonicalize_block_id(str(block["id"])),
            "v": [start, end],
            "role": str(block["role"]),
            "label": str(block["label"]),
        }
        enriched.append(item)
    id_set = {b["id"] for b in enriched}
    for item in enriched:
        pair = infer_pair_id(item["id"], id_set)
        if pair:
            item["pairId"] = pair
    enriched = normalize_block_spans(enriched, verse_count)
    return ensure_pivot_block(enriched)


def pivot_verse_label(blocks: list[dict[str, Any]]) -> str:
    """Human-readable pivot span, preferring an explicit pivot/center block."""
    pivot = next((b for b in blocks if b["role"] in {"pivot", "center"}), None)
    if not pivot:
        return ""
    start, end = pivot["v"]
    if start == end:
        return str(start)
    mid = (start + end) // 2
    return f"{start}–{end} (axis: v.{mid})"


def clip_excerpt(text: str, limit: int = 900) -> str:
    """Keep a readable classical excerpt without cutting mid-word harshly."""
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip("،,;؛")
    return cut + "…"


def build_transition(
    sura: int,
    units: list[dict[str, Any]],
    sections_by_sura: dict[int, str],
) -> dict[str, Any] | None:
    """Build transitionToNext for sura -> sura+1 from Tanāsuq section of sura+1."""
    if sura >= 114:
        return None
    target = units[sura]  # 0-index: units[sura] is surah sura+1
    target_n = int(target["n"])
    arabic = sections_by_sura.get(target_n, "")
    if not arabic:
        # Fallback: section filed under current sura
        arabic = sections_by_sura.get(sura, "")
    current = units[sura - 1]
    english = (
        f"Al-Suyūṭī (Tanāsuq al-Durar) discusses why {target['phonetic']} "
        f"follows {current['phonetic']} in the muṣḥaf order."
    )
    biqai_ar = target.get("goal") or current.get("goal")
    out: dict[str, Any] = {
        "targetSura": target_n,
        "targetNameAr": target["name"],
        "targetNameEn": target["phonetic"],
        "suyutiLinkAr": clip_excerpt(arabic)
        if arabic
        else f"انظر تناسق الدرر للسيوطي في مناسبة سورة {target['name']} لما قبلها.",
        "suyutiLinkEn": english,
    }
    if biqai_ar:
        out["biqaiSummaryAr"] = str(biqai_ar)
        out["biqaiSummaryEn"] = (
            f"Surah goal (maqṣad) grounding the transition into {target['phonetic']}."
        )
    return out


def compile_surah_file(
    sura: int,
    maraya: dict[str, Any],
    units: list[dict[str, Any]],
    sections_by_sura: dict[int, str],
) -> dict[str, Any]:
    """Assemble one SurahStructureFile object."""
    unit = units[sura - 1]
    family_row = maraya["families"][sura]
    name_row = maraya["names"][sura]
    stats = maraya["pivot_stats"][str(sura)]
    blocks = enrich_blocks(maraya["blocks"][str(sura)], int(unit["verses"]))
    form = stats.get("type", family_row.get("form", "distributed"))
    if form not in {"compressed", "distributed"}:
        form = "distributed"
    semantic = family_row.get("semantic", "diffuse")
    if semantic not in {"concentrated", "diffuse", "transitional"}:
        semantic = "diffuse"
    center_logic = family_row.get("center_logic", "single_concentration")
    if center_logic not in {"single_concentration", "compound_seam"}:
        center_logic = "single_concentration"

    payload: dict[str, Any] = {
        "sura": sura,
        "nameAr": unit["name"],
        "nameEn": name_row.get("name_en") or unit["phonetic"],
        "verseCount": int(unit["verses"]),
        "family": {
            "id": int(family_row["family_id"]),
            "name": family_row["family_name"],
            "description": family_row["family_description"],
        },
        "pivot": {
            "verse": pivot_verse_label(blocks),
            "offset": float(stats.get("pivot_advantage", 0.0)),
            "centerLogic": center_logic,
            "function": maraya["pivot_fns"].get(sura)
            or family_row.get("pivot_function")
            or "THEOLOGICAL_DECLARATION",
        },
        "form": form,
        "semantic": semantic,
        "blocks": blocks,
    }
    transition = build_transition(sura, units, sections_by_sura)
    if transition:
        payload["transitionToNext"] = transition
    return payload


SOURCES: list[dict[str, Any]] = [
    {
        "id": "maraya-ring-composition",
        "title": "Maraya Ring Composition Corpus (Ayah Labs)",
        "kind": "structure",
        "attribution": "Feras Mansi / Ayah Labs (maraya.app)",
        "description": (
            "Full-Quran symmetrical block maps, architectural families, and pivot metadata."
        ),
        "license": "Used with attribution for educational research tooling",
        "url": "https://maraya.app",
    },
    {
        "id": "suyuti-tanasuq-al-durar",
        "title": "Tanāsuq al-Durar fī Tanāsub al-Suwar (Asrār Tartīb al-Qurʾān)",
        "kind": "munasabat",
        "attribution": "Jalāl al-Dīn al-Suyūṭī (Turath Book 9992)",
        "description": "Classical inter-surah munāsabāt explaining contiguous muṣḥaf order.",
        "license": "Classical heritage text via Turath.io",
        "url": "https://app.turath.io/book/9992",
    },
]


def update_manifest(block_counts: dict[int, int]) -> None:
    """Attach structure block counts and source entries to the catalog."""

    def edit(manifest: dict[str, Any]) -> None:
        for unit in manifest["units"]:
            unit["structure"] = block_counts.get(int(unit["n"]), 0)
        for source in SOURCES:
            upsert_source(manifest, source)
        manifest.setdefault("stats", {}).update(
            {
                "structureSurahs": 114,
                "structureBlocks": sum(block_counts.values()),
                "munasabatTransitions": 113,
            }
        )

    edit_manifest(edit)


def update_notices() -> None:
    """Attribution blocks for Maraya and Tanāsuq sources."""
    add_notice(
        "Maraya Ring Composition Corpus",
        "Platform: maraya.app (Ayah Labs)\n"
        "Author: Feras Mansi\n"
        "URL: https://maraya.app\n"
        "License / Terms: Educational research use with attribution to Ayah Labs / Maraya.\n"
        "Used in Lenses for full-Quran symmetrical surah blocks, families, and pivot axes.",
    )
    add_notice(
        "Tanāsuq al-Durar fī Tanāsub al-Suwar (Asrār Tartīb al-Qurʾān)",
        "Author: Jalāl al-Dīn al-Suyūṭī (d. 911 AH)\n"
        "Source: Turath.io Book 9992 (https://files.turath.io/books-v3/9992.json)\n"
        "License / Terms: Classical heritage text; retained with clear attribution.\n"
        "Used in Lenses for inter-surah munāsabāt transition exegesis.",
    )


def validate_structure_file(payload: dict[str, Any], unit: dict[str, Any]) -> None:
    """Hard checks for contiguous coverage and pivot presence."""
    verse_count = int(unit["verses"])
    blocks = payload["blocks"]
    if not blocks:
        raise RuntimeError(f"surah {payload['sura']}: empty blocks")
    covered: list[tuple[int, int]] = []
    for block in blocks:
        start, end = block["v"]
        if start < 1 or end > verse_count or start > end:
            raise RuntimeError(
                f"surah {payload['sura']}: bad span {block['id']} {start}-{end} / {verse_count}"
            )
        covered.append((start, end))
    covered.sort()
    if covered[0][0] != 1 or covered[-1][1] != verse_count:
        raise RuntimeError(
            f"surah {payload['sura']}: blocks do not cover 1..{verse_count} "
            f"(got {covered[0][0]}..{covered[-1][1]})"
        )
    for prev, nxt in zip(covered, covered[1:], strict=False):
        if prev[1] + 1 != nxt[0]:
            raise RuntimeError(f"surah {payload['sura']}: gap/overlap between {prev} and {nxt}")
    if not any(b["role"] in {"pivot", "center"} for b in blocks):
        raise RuntimeError(f"surah {payload['sura']}: missing pivot/center block")


def build_structure() -> None:
    """Compile all structure JSON artifacts."""
    print("Step 1: Load manifest...")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    units: list[dict[str, Any]] = manifest["units"]
    if len(units) != 114:
        raise RuntimeError("manifest must list 114 surahs")

    print("Step 2: Load Maraya structural corpus...")
    maraya = load_maraya(CACHE)

    print("Step 3: Load Tanāsuq al-Durar (Turath 9992)...")
    tanasuq_path = fetch(TANASUQ_URL, CACHE / "turath" / "tanasuq-9992.json")
    book = json.loads(tanasuq_path.read_text(encoding="utf-8"))
    alias_index = build_alias_index(units)
    sections = extract_tanasuq_sections(book, alias_index)
    print(f"  extracted Tanāsuq sections for {len(sections)} surahs")

    print("Step 4: Emit structure/NNN.json ...")
    block_counts: dict[int, int] = {}
    transitions: list[dict[str, Any]] = []
    for sura in range(1, 115):
        payload = compile_surah_file(sura, maraya, units, sections)
        validate_structure_file(payload, units[sura - 1])
        block_counts[sura] = len(payload["blocks"])
        if "transitionToNext" in payload:
            transitions.append(
                {
                    "fromSura": sura,
                    **payload["transitionToNext"],
                }
            )
        write_json(surah_path("structure", sura), payload)

    print("Step 5: Emit transitions.json ...")
    write_json(OUT / "transitions.json", {"count": len(transitions), "transitions": transitions})

    print("Step 6: Update manifest + notices...")
    update_manifest(block_counts)
    update_notices()

    print(
        f"Done: {len(block_counts)} surahs, {sum(block_counts.values())} blocks, "
        f"{len(transitions)} transitions."
    )


def main() -> None:
    build_structure()


if __name__ == "__main__":
    main()
