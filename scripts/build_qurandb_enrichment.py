#!/usr/bin/env python3
"""Extract Asbab al-Nuzul, Surah Maqasid, and Per-Word Qira'at from quran.db.

Reads from data/cache/quran.db (Tafsir Center database):
  - ayah_content_nozool (Dr. Khalid al-Muzayni, 201 ayahs, 326 narrations with gradings)
  - surah_content & surah_stats (surahGoals, revelationSeq 1..114, surahClass)
  - qeraat_info & word_content_rasm (ten canonical readings, 29,605 words with variants)

Emits:
  - public/data/quran/asbab.json (lazy-loaded Asbab al-Nuzul narrations)
  - public/data/quran/qiraat/001.json .. 114.json (per-surah canonical readings)
  - Updates public/data/quran/manifest.json (goals, revSeq, surahClass, stats, sources)
  - Enriches public/data/quran/surah/001.json .. 114.json (goals, revSeq, surahClass)
  - Updates public/data/NOTICES.txt
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path
from typing import Any

from paths import ROOT

DEFAULT_DB_PATH = ROOT / "data" / "cache" / "quran.db"
DEFAULT_DATA_DIR = ROOT / "public" / "data" / "quran"
DEFAULT_NOTICES_PATH = ROOT / "public" / "data" / "NOTICES.txt"


def parse_nozool_narrations(text: str) -> list[dict[str, Any]]:
    """Parse raw nozoolInfo text into structured narrations with takhrij and grade."""
    # Strip verse header: قوله تعالى: {...} [السورة: الآية].
    m_header = re.match(r"^قوله تعالى:\s*\{.*?\}\s*\[.*?\]\.\s*", text, flags=re.DOTALL)
    body = text[m_header.end() :].strip() if m_header else text.strip()

    # Split numbered items: '1 - ', '2 - ', etc.
    parts = re.split(r"(?:^|\n)\s*(\d+)\s*-\s*", body)
    raw_narrations: list[tuple[int, str]] = []
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            raw_narrations.append((int(parts[i]), parts[i + 1].strip()))
    else:
        raw_narrations.append((1, body))

    results: list[dict[str, Any]] = []
    for num, n_text in raw_narrations:
        m_fn = re.search(r"¬(.*?)¥", n_text, flags=re.DOTALL)
        takhrij = m_fn.group(1).strip() if m_fn else ""
        clean_text = (n_text[: m_fn.start()] + n_text[m_fn.end() :]).strip() if m_fn else n_text

        clean_text = re.sub(r"\s+", " ", clean_text).strip()
        takhrij = re.sub(r"\s+", " ", takhrij).strip()

        grade = "other"
        if any(
            g in takhrij
            for g in ("إسناده صحيح", "والحديث صحيح", "صحيح لغيره", "صحيح لشواهده", "حديث صحيح")
        ):
            grade = "sahih"
        elif "حسن" in takhrij:
            grade = "hasan"
        elif any(g in takhrij for g in ("ضعيف", "لا يصح", "منكر", "واه")):
            grade = "daif"

        grade_label = ""
        for g_phrase in (
            "إسناده صحيح وهو مرسل",
            "إسناده صحيح",
            "والحديث صحيح لشواهده",
            "والحديث صحيح لغيره",
            "والحديث صحيح",
            "صحيح",
            "والحديث حسن لشواهده",
            "والحديث حسن",
            "إسناده حسن",
            "حديث حسن غريب",
            "سنده حسن",
            "حسن",
            "إسناده ضعيف",
            "ضعيف",
            "لا يصح",
        ):
            if g_phrase in takhrij:
                grade_label = g_phrase
                break

        if not grade_label:
            grade_label = (
                "صحيح"
                if grade == "sahih"
                else "حسن"
                if grade == "hasan"
                else "ضعيف"
                if grade == "daif"
                else ""
            )

        results.append(
            {
                "id": num,
                "text": clean_text,
                "takhrij": takhrij,
                "grade": grade,
                "gradeLabel": grade_label,
            }
        )
    return results


def parse_qiraat_rules(text_block: str) -> list[dict[str, Any]]:
    """Parse @reader1 وَreader2/rule format into structured list."""
    if not text_block or "لا خلاف بين القراء" in text_block:
        return []

    rules: list[dict[str, Any]] = []
    raw_rules = [r.strip() for r in text_block.split("@") if r.strip()]
    for r in raw_rules:
        if "/" in r:
            readers_str, rule = r.split("/", 1)
            readers = [rd.strip() for rd in re.split(r"\s+وَ", readers_str) if rd.strip()]
            rules.append({"readers": readers, "rule": rule.strip()})
        else:
            rules.append({"readers": [], "rule": r.strip()})
    return rules


def map_seq_w_to_lenses(s: int, a: int, db_w: int) -> int:
    """Map DB sequential word index to Tanzil/Lenses 1-based word index for the 5 split/merged ayahs."""
    if (s, a) == (2, 181):
        if db_w <= 2:
            return db_w
        if db_w in (3, 4):
            return 3
        return db_w - 1
    if (s, a) == (8, 6):
        if db_w <= 3:
            return db_w
        if db_w in (4, 5):
            return 4
        return db_w - 1
    if (s, a) == (13, 37):
        if db_w <= 7:
            return db_w
        if db_w in (8, 9):
            return 8
        return db_w - 1
    if (s, a) == (15, 7):
        if db_w == 1:
            return 1
        return db_w + 1
    if (s, a) == (37, 130):
        if db_w <= 2:
            return db_w
        return 3
    return db_w


def extract_asbab(con: sqlite3.Connection, out_path: Path) -> dict[str, list[dict[str, Any]]]:
    """Extract ayah_content_nozool and write public/data/quran/asbab.json."""
    cursor = con.cursor()
    cursor.execute(
        "SELECT surahNo, ayahNo, nozoolInfo FROM ayah_content_nozool ORDER BY surahNo, ayahNo"
    )
    rows = cursor.fetchall()

    asbab_map: dict[str, list[dict[str, Any]]] = {}
    for sura, ayah, text in rows:
        key = f"{sura}:{ayah}"
        asbab_map[key] = parse_nozool_narrations(text)

    out_path.write_text(
        json.dumps(asbab_map, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(asbab_map)} ayahs with Asbab al-Nuzul to {out_path}.")
    return asbab_map


def extract_surah_meta(con: sqlite3.Connection) -> dict[int, dict[str, Any]]:
    """Extract surahGoals, revelationSeq, and surahClass for all 114 surahs."""
    cursor = con.cursor()
    cursor.execute(
        """
        SELECT sc.surahNo, sc.surahGoals, ss.revelationSeq, ss.surahClass
        FROM surah_content sc
        JOIN surah_stats ss ON sc.surahNo = ss.surahNo
        ORDER BY sc.surahNo
        """
    )
    meta = {}
    for sura, goal, rev_seq, s_class in cursor.fetchall():
        meta[sura] = {
            "goal": goal.strip() if goal else "",
            "revSeq": rev_seq,
            "surahClass": s_class.strip() if s_class else "",
        }
    return meta


def extract_qiraat(
    con: sqlite3.Connection,
    out_dir: Path,
) -> tuple[int, int]:
    """Extract qeraat_info joining on rowid and write per-surah JSON chunks."""
    out_dir.mkdir(parents=True, exist_ok=True)
    cursor = con.cursor()

    cursor.execute(
        """
        SELECT w.rowid, w.surahNo, w.ayahNo,
               row_number() OVER (PARTITION BY w.surahNo, w.ayahNo ORDER BY w.rowid) AS seq_w,
               q.content, q.note
        FROM word_content_rasm w
        JOIN qeraat_info q ON w.rowid = q.rowid
        ORDER BY w.rowid
        """
    )
    rows = cursor.fetchall()

    surahs_data: dict[int, dict[int, list[dict[str, Any]]]] = {s: {} for s in range(1, 115)}
    total_words_with_variants = 0
    total_verses_with_variants: set[tuple[int, int]] = set()

    for _rowid, s, a, seq_w, content, note in rows:
        w = map_seq_w_to_lenses(s, a, seq_w)
        content_str = content or ""
        note_str = (note or "").strip() or None

        parts = content_str.split("---{عند الوصل}---")
        waqf_part = parts[0].strip() if len(parts) > 0 else ""
        wasl_part = parts[1].strip() if len(parts) > 1 else ""

        waqf_rules = parse_qiraat_rules(waqf_part)
        wasl_rules = parse_qiraat_rules(wasl_part)

        if waqf_rules or wasl_rules or note_str:
            total_words_with_variants += 1
            total_verses_with_variants.add((s, a))

            if a not in surahs_data[s]:
                surahs_data[s][a] = []

            word_entry: dict[str, Any] = {"w": w}
            if waqf_rules:
                word_entry["q"] = waqf_rules
            if wasl_rules:
                word_entry["wasl"] = wasl_rules
            if note_str:
                word_entry["note"] = note_str

            surahs_data[s][a].append(word_entry)

    # Emit 114 files
    for s in range(1, 115):
        ayahs = surahs_data[s]
        verses_list = [{"v": a, "words": words} for a, words in sorted(ayahs.items())]
        file_payload = {"surah": s, "verses": verses_list}

        out_file = out_dir / f"{s:03d}.json"
        out_file.write_text(
            json.dumps(file_payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    print(
        f"Wrote 114 Qira'at files to {out_dir} "
        f"({total_words_with_variants} words across {len(total_verses_with_variants)} verses)."
    )
    return total_words_with_variants, len(total_verses_with_variants)


def update_manifest(
    manifest_path: Path,
    surah_meta: dict[int, dict[str, Any]],
    asbab_count: int,
    qiraat_words: int,
    qiraat_verses: int,
) -> None:
    """Enrich manifest.json with goals, revSeq, surahClass, asbab, and qiraat stats."""
    if not manifest_path.exists():
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # Enrich unit summaries
    for unit in manifest.get("units", []):
        s_num = unit["n"]
        meta = surah_meta.get(s_num, {})
        if "goal" in meta:
            unit["goal"] = meta["goal"]
        if "revSeq" in meta:
            unit["revSeq"] = meta["revSeq"]
        if "surahClass" in meta:
            unit["surahClass"] = meta["surahClass"]

    # Enrich stats
    stats = manifest.setdefault("stats", {})
    stats["asbabVerses"] = asbab_count
    stats["qiraatWords"] = qiraat_words
    stats["qiraatVerses"] = qiraat_verses

    # Add source attributions
    sources: list[dict[str, Any]] = manifest.get("sources", [])
    new_sources = [
        {
            "id": "asbab-muharrar",
            "title": "Al-Muḥarrar fī Asbāb Nuzūl al-Qur'ān",
            "kind": "asbab",
            "attribution": "Dr. Khālid ibn Sulaymān al-Muzaynī (Tafsir Center for Quranic Studies / Dār Ibn al-Jawzī)",
            "description": "Critical investigation of authentic causes of revelation across the nine primary hadith books, with isnād evaluation and hadith grading.",
            "license": "CC BY 4.0",
            "url": "https://tafsir.net/",
        },
        {
            "id": "canonical-qiraat",
            "title": "Ten Canonical Qirāʾāt Variants & Exegesis",
            "kind": "qiraat",
            "attribution": "Tafsir Center for Quranic Studies, based on Al-Nashr fī al-Qirā'āt al-'Ashr (Ibn al-Jazarī)",
            "description": "Per-word canonical reading variants across the 10 Qurrā' and 20 Ruwāt with linguistic and semantic explanatory notes.",
            "license": "CC BY 4.0",
            "url": "https://tafsir.net/",
        },
    ]

    existing_ids = {s.get("id") for s in sources}
    for ns in new_sources:
        if ns["id"] not in existing_ids:
            sources.append(ns)

    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated manifest at {manifest_path} with surah goals, revSeq, and stats.")


def enrich_surah_files(
    surah_dir: Path,
    surah_meta: dict[int, dict[str, Any]],
) -> None:
    """Enrich public/data/quran/surah/NNN.json files with goal, revSeq, and surahClass."""
    if not surah_dir.exists():
        return

    updated_count = 0
    for s_num, meta in surah_meta.items():
        surah_file = surah_dir / f"{s_num:03d}.json"
        if not surah_file.exists():
            continue

        surah_data = json.loads(surah_file.read_text(encoding="utf-8"))
        changed = False

        if meta.get("goal") and surah_data.get("goal") != meta["goal"]:
            surah_data["goal"] = meta["goal"]
            changed = True
        if meta.get("revSeq") and surah_data.get("revSeq") != meta["revSeq"]:
            surah_data["revSeq"] = meta["revSeq"]
            changed = True
        if meta.get("surahClass") and surah_data.get("surahClass") != meta["surahClass"]:
            surah_data["surahClass"] = meta["surahClass"]
            changed = True

        if changed:
            surah_file.write_text(
                json.dumps(surah_data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            updated_count += 1

    print(f"Enriched {updated_count} surah files in {surah_dir} with goal and metadata.")


def update_notices(notices_path: Path) -> None:
    """Append legal notices for Al-Muḥarrar and Canonical Qira'at to NOTICES.txt."""
    if not notices_path.exists():
        return

    content = notices_path.read_text(encoding="utf-8")
    if "Al-Muḥarrar fī Asbāb Nuzūl al-Qur'ān" in content:
        return

    notice_block = (
        "\n------------------------------------------------------------\n"
        "Al-Muḥarrar fī Asbāb Nuzūl al-Qur'ān\n"
        "Author: Dr. Khālid ibn Sulaymān al-Muzaynī\n"
        "Publisher: Tafsir Center for Quranic Studies / Dār Ibn al-Jawzī\n"
        "Source: Tafsir Center quran.db (CC BY 4.0)\n"
        "URL: https://tafsir.net/\n"
        "License / Terms: CC BY 4.0 Open Cultural License.\n"
        "Used in Lenses for authentic causes of revelation, isnād critique, and hadith gradings.\n"
        "\n------------------------------------------------------------\n"
        "Ten Canonical Qirāʾāt Variants & Exegesis\n"
        "Source: Tafsir Center for Quranic Studies (quran.db)\n"
        "Based on: Al-Nashr fī al-Qirā'āt al-'Ashr (Ibn al-Jazarī)\n"
        "URL: https://tafsir.net/\n"
        "License / Terms: CC BY 4.0 Open Cultural License.\n"
        "Used in Lenses for per-word canonical variant readings, phonetic rules, and semantic notes.\n"
    )

    notices_path.write_text(content.rstrip() + "\n" + notice_block, encoding="utf-8")
    print(f"Appended Asbab and Qira'at notices to {notices_path}.")


def main() -> None:
    """Main extraction and enrichment pipeline."""
    parser = argparse.ArgumentParser(
        description="Extract Asbab, Surah Goals, and Qira'at from quran.db."
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="Path to quran.db")
    parser.add_argument(
        "--data-dir", type=Path, default=DEFAULT_DATA_DIR, help="Output data directory"
    )
    parser.add_argument(
        "--notices", type=Path, default=DEFAULT_NOTICES_PATH, help="Path to NOTICES.txt"
    )
    args = parser.parse_args()

    if not args.db.exists():
        raise SystemExit(f"Error: {args.db} not found. Please ensure quran.db is cached.")

    print(f"Connecting to {args.db}...")
    con = sqlite3.connect(args.db)

    # 1. Asbab al-Nuzul
    asbab_path = args.data_dir / "asbab.json"
    asbab_data = extract_asbab(con, asbab_path)

    # 2. Surah Meta & Goals
    surah_meta = extract_surah_meta(con)

    # 3. Qira'at Variants
    qiraat_dir = args.data_dir / "qiraat"
    q_words, q_verses = extract_qiraat(con, qiraat_dir)

    con.close()

    # 4. Update manifest, surah files, and notices
    manifest_path = args.data_dir / "manifest.json"
    update_manifest(manifest_path, surah_meta, len(asbab_data), q_words, q_verses)

    surah_dir = args.data_dir / "surah"
    enrich_surah_files(surah_dir, surah_meta)

    update_notices(args.notices)
    print("quran.db enrichment complete!")


if __name__ == "__main__":
    main()
