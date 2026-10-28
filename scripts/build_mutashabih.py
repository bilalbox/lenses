#!/usr/bin/env python3
"""Compile full Quran Al-Mutashabih al-Lafzi dataset into lazy-loaded per-surah JSON chunks.

Downloads / reads from data/cache/:
  - Quranpedia similarity dump (Quranpedia.net):
    https://api.quranpedia.net/dumps/similar.json.gz
  - Waqar144 Huffaz mutashabihat text files (CC0 1.0 Universal):
    https://raw.githubusercontent.com/Waqar144/Quran_Mutashabihat_Data/master/txts/{1..30}.txt

Compiles:
  - public/data/quran/mutashabih/001.json .. 114.json
  - Updates public/data/quran/manifest.json (mutashabih counts and sources)
  - Updates public/data/NOTICES.txt
"""

from __future__ import annotations

import argparse
import difflib
import gzip
import json
import re
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE_DIR = ROOT / "data" / "cache"
DEFAULT_SURAH_DIR = ROOT / "public" / "data" / "quran" / "surah"
DEFAULT_OUT_DIR = ROOT / "public" / "data" / "quran" / "mutashabih"
DEFAULT_MANIFEST_PATH = ROOT / "public" / "data" / "quran" / "manifest.json"
DEFAULT_NOTICES_PATH = ROOT / "public" / "data" / "NOTICES.txt"

SIMILAR_DUMP_URL = "https://api.quranpedia.net/dumps/similar.json.gz"
WAQAR_BASE_URL = "https://raw.githubusercontent.com/Waqar144/Quran_Mutashabihat_Data/master/txts"

TASHKEEL = re.compile(r"[\u064b-\u0652\u0670\u0653-\u065f\u06d6-\u06ed]")

CANONICAL_ENGLISH_NOTES: dict[tuple[tuple[int, int], tuple[int, int]], str] = {
    ((2, 58), (7, 161)): (
        "In 2:58 speech is directly attributed to Allah ('We said') and includes 'abundantly' (raghadan) "
        "amidst favors. In 7:161 passive voice ('it was said') is used in reprimand."
    ),
    ((2, 48), (2, 123)): (
        "In 2:48 'shafa'ah' (intercession) precedes 'adl' (ransom). In 2:123 the order is reversed. "
        "Mnemonic: Shin precedes 'Ayn alphabetically."
    ),
    ((2, 35), (7, 19)): (
        "In 2:35 Adam and his wife are told to consume 'raghadan' (abundantly) in paradise. "
        "In 7:19 the invitation is given without raghadan to focus on the prohibited tree."
    ),
    ((3, 133), (57, 21)): (
        "In 3:133 the command is 'wa-sari'u' (and hasten) with a connecting waw. "
        "In 57:21 the command opens abruptly as 'sabiqu' (race one another)."
    ),
}


def strip_tashkeel(s: str) -> str:
    """Remove Arabic vocalic diacritics and Qur'anic annotation signs."""
    return TASHKEEL.sub("", s)


def ensure_similar_dump(cache_dir: Path) -> Path:
    """Ensure the Quranpedia similar.json.gz dump is present in the cache."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    dump_path = cache_dir / "similar.json.gz"
    if dump_path.exists() and dump_path.stat().st_size > 1_000_000:
        return dump_path

    print(f"Downloading Quranpedia similar dump from {SIMILAR_DUMP_URL}...")
    req = urllib.request.Request(
        SIMILAR_DUMP_URL,
        headers={"User-Agent": "Lenses/1.0 (dataset build script)"},
    )
    with urllib.request.urlopen(req) as resp, open(dump_path, "wb") as f:
        f.write(resp.read())
    print(f"Downloaded {dump_path.stat().st_size / 1024 / 1024:.2f} MB")
    return dump_path


def ensure_waqar_txts(cache_dir: Path) -> Path:
    """Ensure all 30 Juz txt files from Waqar144 are cached locally."""
    txts_dir = cache_dir / "waqar_txts"
    txts_dir.mkdir(parents=True, exist_ok=True)

    def fetch_one(p: int) -> None:
        fp = txts_dir / f"{p}.txt"
        if fp.exists() and fp.stat().st_size > 50:
            return
        url = f"{WAQAR_BASE_URL}/{p}.txt"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Lenses/1.0 (dataset build script)"},
        )
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
        fp.write_text(content, encoding="utf-8")

    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(fetch_one, range(1, 31)))

    return txts_dir


def load_all_surahs(surah_dir: Path) -> dict[tuple[int, int], list[dict[str, Any]]]:
    """Load words for all 6,236 verses across 114 surahs."""
    surah_words: dict[tuple[int, int], list[dict[str, Any]]] = {}
    for fp in sorted(surah_dir.glob("*.json")):
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
            s = int(data["n"])
            for verse in data["verses"]:
                v = int(verse["v"])
                surah_words[(s, v)] = verse["w"]
    return surah_words


def load_waqar_pairs(
    txts_dir: Path, valid_ayahs: set[tuple[int, int]]
) -> set[tuple[tuple[int, int], tuple[int, int]]]:
    """Parse Waqar144 txt files into undirected verse pairs."""
    pairs: set[tuple[tuple[int, int], tuple[int, int]]] = set()
    for p in range(1, 31):
        fp = txts_dir / f"{p}.txt"
        if not fp.exists():
            continue
        for line in fp.read_text(encoding="utf-8").splitlines():
            line = line.strip().rstrip(r"\n").rstrip("/")
            if not line or "|" not in line:
                continue
            left, right = line.split("|", 1)
            srcs = [tuple(map(int, m)) for m in re.findall(r"(\d+)[:/](\d+)", left)]
            muts = [tuple(map(int, m)) for m in re.findall(r"(\d+)[:/](\d+)", right)]
            for s in srcs:
                s_coord = (s[0], s[1])
                for m in muts:
                    m_coord = (m[0], m[1])
                    if s_coord != m_coord and s_coord in valid_ayahs and m_coord in valid_ayahs:
                        pairs.add(tuple(sorted([s_coord, m_coord])))  # pyright: ignore[reportArgumentType]
    return pairs


def load_quranpedia_data(
    dump_path: Path, valid_ayahs: set[tuple[int, int]]
) -> tuple[
    set[tuple[tuple[int, int], tuple[int, int]]],
    dict[tuple[tuple[int, int], tuple[int, int]], str],
]:
    """Extract pairwise verse relations and classical notes from Quranpedia dump."""
    pairs: set[tuple[tuple[int, int], tuple[int, int]]] = set()
    notes_by_pair: dict[tuple[tuple[int, int], tuple[int, int]], str] = {}

    with gzip.open(dump_path, "rt", encoding="utf-8") as f:
        data = json.load(f)

    all_groups: list[tuple[int, list[tuple[int, int]], str]] = []
    for it in data.get("data", []):
        for g in it.get("similar", []):
            ayahs: list[tuple[int, int]] = []
            for a in g.get("ayahs", []):
                s_id = int(a["info"]["surah_id"])
                a_num = int(a["info"]["number"])
                ayahs.append((s_id, a_num))
            note = str(g.get("notes") or "").strip()
            if ayahs:
                all_groups.append((len(ayahs), ayahs, note))

    # Sort descending by group size so smaller, pair-specific groups overwrite larger groups
    all_groups.sort(key=lambda x: -x[0])
    for _, ayahs, note in all_groups:
        for i in range(len(ayahs)):
            for j in range(i + 1, len(ayahs)):
                a1, a2 = ayahs[i], ayahs[j]
                if a1 in valid_ayahs and a2 in valid_ayahs:
                    pair_key: tuple[tuple[int, int], tuple[int, int]] = tuple(sorted([a1, a2]))  # pyright: ignore[reportAssignmentType]
                    pairs.add(pair_key)
                    if note:
                        notes_by_pair[pair_key] = note

    return pairs, notes_by_pair


def split_dabt_tawjih(note: str) -> tuple[str | None, str | None]:
    """Split raw classical Arabic note into Dabt (memorization rule) and Tawjih (exegesis)."""
    if not note or not note.strip():
        return None, None
    note = note.strip()

    lines = [line.strip() for line in note.splitlines() if line.strip()]
    if len(lines) == 1:
        return note, None

    dabt_lines: list[str] = []
    tawjih_lines: list[str] = []
    in_tawjih = False

    for line in lines:
        if any(
            line.startswith(p)
            for p in [
                "1-",
                "1 -",
                "1.",
                "1 .",
                "توجيه",
                "التوجيه",
                "السر البلاغي",
                "العلة",
            ]
        ):
            in_tawjih = True
        if in_tawjih:
            tawjih_lines.append(line)
        else:
            dabt_lines.append(line)

    if dabt_lines and tawjih_lines:
        return "\n".join(dabt_lines), "\n".join(tawjih_lines)
    if any(k in note for k in ["الضابط", "قاعدة", "ضبط", "تنبه", "تميزت", "القاعدة", "تجمعها"]):
        return note, None
    if any(k in note for k in ["توجيه", "سياق", "لبيان", "فناسب", "علة", "سر", "بلاغ"]):
        return None, note
    return note, None


def compute_token_diff(
    words1: list[dict[str, Any]], words2: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int, float, str]:
    """Compute token-level diff, matched words count, score, and category."""
    r1 = [strip_tashkeel(w["a"]) for w in words1]
    r2 = [strip_tashkeel(w["a"]) for w in words2]
    sm = difflib.SequenceMatcher(None, r1, r2)
    opcodes = sm.get_opcodes()

    src_tokens: dict[int, dict[str, Any]] = {}
    target_tokens: dict[int, dict[str, Any]] = {}

    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal":
            for k in range(i2 - i1):
                w1 = words1[i1 + k]
                w2 = words2[j1 + k]
                status = "exact" if w1["a"] == w2["a"] else "haraka"
                src_tokens[w1["n"]] = {"w": w1["n"], "s": status, "cw": w2["n"]}
                target_tokens[w2["n"]] = {"w": w2["n"], "s": status, "cw": w1["n"]}
        elif tag == "replace":
            len1, len2 = i2 - i1, j2 - j1
            for k in range(len1):
                w1 = words1[i1 + k]
                cw = words2[j1 + min(k, len2 - 1)]["n"] if len2 > 0 else None
                src_tokens[w1["n"]] = {"w": w1["n"], "s": "diff", "cw": cw}
            for k in range(len2):
                w2 = words2[j1 + k]
                cw = words1[i1 + min(k, len1 - 1)]["n"] if len1 > 0 else None
                target_tokens[w2["n"]] = {"w": w2["n"], "s": "diff", "cw": cw}
        elif tag == "delete":
            for k in range(i2 - i1):
                w1 = words1[i1 + k]
                src_tokens[w1["n"]] = {"w": w1["n"], "s": "extra"}
        elif tag == "insert":
            for k in range(j2 - j1):
                w2 = words2[j1 + k]
                target_tokens[w2["n"]] = {"w": w2["n"], "s": "extra"}

    sorted_src_tokens = [src_tokens[w["n"]] for w in words1]
    sorted_target_tokens = [target_tokens[w["n"]] for w in words2]

    matched_words = sum(1 for tok in sorted_src_tokens if tok["s"] in ("exact", "haraka"))
    total_words = len(words1) + len(words2)
    score = round(2.0 * matched_words / total_words, 2) if total_words > 0 else 0.0

    # Determine category
    equal_blocks = [(i1, i2, j1, j2) for tag, i1, i2, j1, j2 in opcodes if tag == "equal"]
    tot_max = max(len(words1), len(words2))
    ratio = matched_words / tot_max if tot_max else 0.0

    if ratio >= 0.95:
        category = "identical"
    else:
        s1_diff = set(
            r1[k]
            for k in range(len(words1))
            if not any(i1 <= k < i2 for i1, i2, _, _ in equal_blocks)
        )
        s2_diff = set(
            r2[k]
            for k in range(len(words2))
            if not any(j1 <= k < j2 for _, _, j1, j2 in equal_blocks)
        )
        if s1_diff and s2_diff and (s1_diff & s2_diff):
            category = "word_swap"
        elif (
            equal_blocks
            and equal_blocks[0][0] == 0
            and equal_blocks[0][2] == 0
            and equal_blocks[0][1] >= 3
        ):
            category = "shared_opening"
        elif (
            equal_blocks
            and equal_blocks[-1][1] == len(words1)
            and equal_blocks[-1][3] == len(words2)
            and (equal_blocks[-1][1] - equal_blocks[-1][0] >= 3)
        ):
            category = "shared_ending"
        else:
            category = "shared_phrase"

    return sorted_src_tokens, sorted_target_tokens, matched_words, score, category


def filter_high_quality_pairs(
    all_pairs: set[tuple[tuple[int, int], tuple[int, int]]],
    wq_pairs: set[tuple[tuple[int, int], tuple[int, int]]],
    notes_by_pair: dict[tuple[tuple[int, int], tuple[int, int]], str],
    surah_words: dict[tuple[int, int], list[dict[str, Any]]],
) -> set[tuple[tuple[int, int], tuple[int, int]]]:
    """Filter pairs for quality: in Waqar, has classical note, or high algorithmic similarity."""
    valid_pairs: set[tuple[tuple[int, int], tuple[int, int]]] = set()
    for a1, a2 in all_pairs:
        pair_key: tuple[tuple[int, int], tuple[int, int]] = tuple(sorted([a1, a2]))  # pyright: ignore[reportAssignmentType]
        if pair_key in wq_pairs or pair_key in notes_by_pair:
            valid_pairs.add(pair_key)
        else:
            w1, w2 = surah_words[a1], surah_words[a2]
            r1 = [strip_tashkeel(w["a"]) for w in w1]
            r2 = [strip_tashkeel(w["a"]) for w in w2]
            sm = difflib.SequenceMatcher(None, r1, r2)
            matched = sum(b.size for b in sm.get_matching_blocks())
            score = round(2.0 * matched / (len(w1) + len(w2)), 2) if (len(w1) + len(w2)) else 0.0
            if matched >= 4 or score >= 0.25:
                valid_pairs.add(pair_key)
    return valid_pairs


def compile_surah_matches(
    s: int,
    verse_matches_map: dict[tuple[int, int], set[tuple[int, int]]],
    surah_words: dict[tuple[int, int], list[dict[str, Any]]],
    notes_by_pair: dict[tuple[tuple[int, int], tuple[int, int]], str],
    max_matches: int,
) -> list[dict[str, Any]]:
    """Compile matches for all verses in a single surah."""
    s_ayahs = sorted([a for sura, a in verse_matches_map if sura == s])
    surah_verses: list[dict[str, Any]] = []

    for a in s_ayahs:
        src_ayah = (s, a)
        w1 = surah_words[src_ayah]
        candidates: list[dict[str, Any]] = []

        for tgt_ayah in verse_matches_map[src_ayah]:
            w2 = surah_words[tgt_ayah]
            src_toks, tgt_toks, matched, score, cat = compute_token_diff(w1, w2)
            if matched == 0:
                continue

            pair_key: tuple[tuple[int, int], tuple[int, int]] = tuple(  # pyright: ignore[reportAssignmentType]
                sorted([src_ayah, tgt_ayah])
            )
            raw_note = notes_by_pair.get(pair_key, "")
            dabt, tawjih = split_dabt_tawjih(raw_note)
            note_en = CANONICAL_ENGLISH_NOTES.get(pair_key)

            match_obj: dict[str, Any] = {
                "sura": tgt_ayah[0],
                "ayah": tgt_ayah[1],
                "cat": cat,
                "score": score,
                "matchedWords": matched,
                "srcTokens": src_toks,
                "targetTokens": tgt_toks,
            }
            if dabt:
                match_obj["dabt"] = dabt
            if tawjih:
                match_obj["tawjih"] = tawjih
            if note_en:
                match_obj["noteEn"] = note_en

            candidates.append(match_obj)

        candidates.sort(
            key=lambda m: (
                -m["score"],
                0 if ("dabt" in m or "tawjih" in m) else 1,
                -m["matchedWords"],
                m["sura"],
                m["ayah"],
            )
        )
        top_candidates = candidates[:max_matches]
        if top_candidates:
            surah_verses.append({"v": a, "matches": top_candidates})

    return surah_verses


def update_manifest_file(
    manifest_path: Path,
    surah_counts: dict[int, int],
    total_verses: int,
    total_pairs: int,
) -> None:
    """Update manifest.json with mutashabih stats and source metadata."""
    if not manifest_path.exists():
        return

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    for unit in manifest.get("units", []):
        u_num = int(unit["n"])
        unit["mutashabih"] = surah_counts.get(u_num, 0)

    stats = manifest.setdefault("stats", {})
    stats["mutashabihVerses"] = total_verses
    stats["mutashabihPairs"] = total_pairs

    sources = manifest.setdefault("sources", [])
    source_ids = {s.get("id") for s in sources}

    if "waqar-mutashabihat" not in source_ids:
        sources.append(
            {
                "id": "waqar-mutashabihat",
                "title": "Quran Mutashabihat Dataset (Huffāẓ Pairs)",
                "kind": "mutashabih",
                "attribution": "Waqar144 (Quran_Mutashabihat_Data)",
                "description": "Curated verbal similarity verse pairs across all 30 Juz for Quran memorization retention.",
                "license": "CC0 1.0 Universal (Public Domain)",
                "url": "https://github.com/Waqar144/Quran_Mutashabihat_Data",
            }
        )

    if "quranpedia-mutashabihat" not in source_ids:
        sources.append(
            {
                "id": "quranpedia-mutashabihat",
                "title": "Quranpedia Verbal Similarities & Memorization Rules",
                "kind": "mutashabih",
                "attribution": "Quranpedia.net (الموسوعة القرآنية)",
                "description": "Classical Ḍabṭ mnemonic anchors and Tawjīh rhetorical difference exegeses.",
                "license": "Free to use inside apps and research tools with attribution",
                "url": "https://quranpedia.net/",
            }
        )

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("Updated manifest.json.")


def update_notices_file(notices_path: Path) -> None:
    """Append mutashabih license notices to NOTICES.txt if not already present."""
    if not notices_path.exists():
        return

    notices_text = notices_path.read_text(encoding="utf-8")
    notices_to_append: list[str] = []

    if "Waqar144" not in notices_text:
        notices_to_append.append(
            "------------------------------------------------------------\n"
            "Quran Mutashabihat Dataset (Huffāẓ Pairs)\n"
            "Author: Waqar144\n"
            "URL: https://github.com/Waqar144/Quran_Mutashabihat_Data\n"
            "License: CC0 1.0 Universal (Public Domain)\n"
            "Used in Lenses for canonical verbal similarity (al-mutashābih al-lafẓī) pairings across all 30 Juz."
        )

    if "Quranpedia Verbal Similarities" not in notices_text:
        notices_to_append.append(
            "------------------------------------------------------------\n"
            "Quranpedia Verbal Similarities & Memorization Rules\n"
            "Source: Quranpedia.net (الموسوعة القرآنية)\n"
            "URL: https://quranpedia.net/\n"
            "License / Terms: Free to use inside apps and research tools with attribution.\n"
            "Used in Lenses for classical ḍabṭ mnemonic anchors and tawjīh rhetorical exegesis."
        )

    if notices_to_append:
        separator = "\n\n" if not notices_text.endswith("\n\n") else ""
        notices_path.write_text(
            notices_text + separator + "\n\n".join(notices_to_append) + "\n",
            encoding="utf-8",
        )
        print("Updated NOTICES.txt.")


def build_mutashabih(
    cache_dir: Path,
    surah_dir: Path,
    out_dir: Path,
    manifest_path: Path,
    notices_path: Path,
    max_matches: int = 5,
) -> None:
    """Build all 114 surah mutashabih JSON files and update manifest and notices."""
    print("Step 1: Loading all surahs...")
    surah_words = load_all_surahs(surah_dir)
    valid_ayahs = set(surah_words.keys())
    print(f"Loaded {len(valid_ayahs)} verses.")

    print("Step 2: Caching/loading raw sources...")
    dump_path = ensure_similar_dump(cache_dir)
    txts_dir = ensure_waqar_txts(cache_dir)

    print("Step 3: Extracting candidate pairs and classical notes...")
    wq_pairs = load_waqar_pairs(txts_dir, valid_ayahs)
    qp_pairs, notes_by_pair = load_quranpedia_data(dump_path, valid_ayahs)
    print(
        f"Waqar pairs: {len(wq_pairs)}, Quranpedia pairs: {len(qp_pairs)}, Notes: {len(notes_by_pair)}"
    )

    all_pairs = wq_pairs | qp_pairs
    valid_pairs = filter_high_quality_pairs(all_pairs, wq_pairs, notes_by_pair, surah_words)
    print(f"High-quality filtered pairs: {len(valid_pairs)}")

    verse_matches_map: dict[tuple[int, int], set[tuple[int, int]]] = defaultdict(set)
    for a1, a2 in valid_pairs:
        verse_matches_map[a1].add(a2)
        verse_matches_map[a2].add(a1)

    out_dir.mkdir(parents=True, exist_ok=True)
    surah_counts: dict[int, int] = {}
    total_compiled_matches = 0

    print("Step 4: Compiling per-surah JSON chunks...")
    for s in range(1, 115):
        surah_verses = compile_surah_matches(
            s, verse_matches_map, surah_words, notes_by_pair, max_matches
        )
        surah_counts[s] = len(surah_verses)
        total_compiled_matches += sum(len(v["matches"]) for v in surah_verses)

        file_data = {"sura": s, "verses": surah_verses}
        out_file = out_dir / f"{s:03d}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(file_data, f, separators=(",", ":"), ensure_ascii=False)

    total_verses = sum(surah_counts.values())
    print(
        f"Compiled 114 mutashabih files with {total_compiled_matches} total directed matches across {total_verses} verses."
    )

    print("Step 5: Updating manifest.json...")
    update_manifest_file(manifest_path, surah_counts, total_verses, len(valid_pairs))

    print("Step 6: Updating NOTICES.txt...")
    update_notices_file(notices_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compile Quran mutashabih dataset into lazy-loaded JSON chunks."
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=DEFAULT_CACHE_DIR,
        help="Directory containing cached raw files",
    )
    parser.add_argument(
        "--surah-dir",
        type=Path,
        default=DEFAULT_SURAH_DIR,
        help="Directory containing public/data/quran/surah/*.json",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Output directory for mutashabih/NNN.json files",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST_PATH,
        help="Path to manifest.json",
    )
    parser.add_argument(
        "--notices",
        type=Path,
        default=DEFAULT_NOTICES_PATH,
        help="Path to NOTICES.txt",
    )
    parser.add_argument(
        "--max-matches",
        type=int,
        default=5,
        help="Maximum counterpart matches per verse",
    )
    args = parser.parse_args()

    build_mutashabih(
        cache_dir=args.cache_dir,
        surah_dir=args.surah_dir,
        out_dir=args.out_dir,
        manifest_path=args.manifest,
        notices_path=args.notices,
        max_matches=args.max_matches,
    )


if __name__ == "__main__":
    main()
