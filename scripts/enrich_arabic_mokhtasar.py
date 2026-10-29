#!/usr/bin/env python3
"""Enrich existing surah JSON files with Arabic Al-Mukhtasar from QuranEnc."""

from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

from paths import ROOT

CACHE_DIR = ROOT / "data" / "cache" / "arabic_mokhtasar"
SURAH_DIR = ROOT / "public" / "data" / "quran" / "surah"
MANIFEST_FILE = ROOT / "public" / "data" / "quran" / "manifest.json"
NOTICES_FILE = ROOT / "public" / "data" / "NOTICES.txt"

API_TEMPLATE = "https://quranenc.com/api/v1/translation/sura/arabic_mokhtasar/{sura}"


def download_surah(sura: int, dest: Path) -> list[dict]:
    if dest.exists() and dest.stat().st_size > 0:
        with dest.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("result", [])

    url = API_TEMPLATE.format(sura=sura)
    req = urllib.request.Request(url, headers={"User-Agent": "lenses-data-build"})
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read()
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(content)
                data = json.loads(content.decode("utf-8"))
                return data.get("result", [])
        except Exception:
            if attempt == max_retries - 1:
                raise
            time.sleep(1.0 + attempt)
    return []


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching and processing Arabic Al-Mukhtasar for 114 surahs...")
    total_verses_enriched = 0

    for sura in range(1, 115):
        cache_path = CACHE_DIR / f"{sura:03d}.json"
        rows = download_surah(sura, cache_path)

        # Map aya number to translation & footnotes
        by_aya: dict[int, tuple[str, str | None]] = {}
        for r in rows:
            aya_num = int(r["aya"])
            trans = r.get("translation", "").strip()
            notes = r.get("footnotes")
            note_str = notes.strip() if isinstance(notes, str) and notes.strip() else None
            by_aya[aya_num] = (trans, note_str)

        # Read target surah file
        surah_file = SURAH_DIR / f"{sura:03d}.json"
        if not surah_file.exists():
            raise FileNotFoundError(f"Surah file not found: {surah_file}")

        surah_data = json.loads(surah_file.read_text(encoding="utf-8"))
        verses = surah_data.get("verses", [])

        if len(verses) != len(by_aya):
            raise ValueError(
                f"Verse count mismatch in surah {sura}: {len(verses)} vs {len(by_aya)}"
            )

        for verse in verses:
            v_num = verse["v"]
            if v_num not in by_aya:
                raise ValueError(f"Missing ayah {v_num} in surah {sura}")
            trans, note = by_aya[v_num]
            verse["ma"] = trans
            if note:
                verse["af"] = note
            total_verses_enriched += 1

        # Write back updated surah file
        surah_file.write_text(
            json.dumps(surah_data, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

        size_mb = surah_file.stat().st_size / 1e6
        if size_mb > 12:
            raise SystemExit(f"Surah {sura:03d} exceeds 12 MB precache limit ({size_mb:.2f} MB)")

        if sura % 20 == 0 or sura == 114:
            print(f"  Surah {sura:03d}/114 processed ({size_mb:.2f} MB)")

    print(f"Successfully enriched {total_verses_enriched} verses across 114 surahs.")

    # Update manifest.json with the new source if not present
    if MANIFEST_FILE.exists():
        manifest_data = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
        sources = manifest_data.get("sources", [])
        if not any(s.get("id") == "arabic-mokhtasar" for s in sources):
            sources.append(
                {
                    "id": "arabic-mokhtasar",
                    "title": "Al-Mukhtasar in Interpreting the Noble Quran (Arabic)",
                    "kind": "tafsir",
                    "attribution": "Tafsir Center for Quranic Studies, Arabic text via QuranEnc.com",
                    "description": "Arabic commentary text of Al-Mukhtasar via QuranEnc.com.",
                    "license": "QuranEnc republication terms: verbatim text, and credit the publisher and QuranEnc.com. The edition key is arabic_mokhtasar.",
                    "url": "https://quranenc.com/api/v1/translation/sura/arabic_mokhtasar/1",
                }
            )
            MANIFEST_FILE.write_text(
                json.dumps(manifest_data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print("Updated manifest.json with arabic-mokhtasar source.")

    # Update NOTICES.txt
    if NOTICES_FILE.exists():
        notices_text = NOTICES_FILE.read_text(encoding="utf-8")
        if "Arabic Al-Mukhtasar" not in notices_text:
            arabic_notice = (
                "\n------------------------------------------------------------\n"
                "Arabic Al-Mukhtasar\n"
                "Title: Al-Mukhtasar in Interpreting the Noble Quran\n"
                "Publisher: Tafsir Center for Quranic Studies\n"
                "Source: QuranEnc.com, key arabic_mokhtasar\n"
                "https://quranenc.com/api/v1/translation/sura/arabic_mokhtasar/{sura}\n"
                "License: QuranEnc republication terms: retain verbatim text and attribution.\n"
            )
            NOTICES_FILE.write_text(notices_text + arabic_notice, encoding="utf-8")
            print("Updated NOTICES.txt with arabic-mokhtasar notice.")


if __name__ == "__main__":
    main()
