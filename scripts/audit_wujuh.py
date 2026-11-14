#!/usr/bin/env python3
"""Quality check of al-Damaghani's wujuh against the word glosses.

For every placed citation, compares the sense al-Damaghani gives it with the
Tafsir Center gloss of the word (`m` in the surah files), runs extraction
lints, and sorts the citation into:

  verdict     reviewed: data/curation/wujuh-verdicts.json holds a verdict made
              against the current label
  agree       no lint fired and the sense shares a content word with the gloss
  queued      needs a reviewer (a lint fired, or the two read differently, or
              the label changed since its verdict)

Writes data/cache/review/wujuh-audit.json (every citation, with its status)
and data/cache/review/wujuh-queue/batch-NNN.json (the queue, whole entries per
batch) for review as described in docs/research/wujuh-review.md.

  python3 scripts/audit_wujuh.py           audit and write the queue
  python3 scripts/audit_wujuh.py --merge   fold reviewers' verdict files from
                                           data/cache/review/wujuh-verdicts/
                                           into the committed verdicts, then audit
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Any

from build_wujuh import (
    LABEL_WORDS,
    VERDICT_KINDS,
    VERDICTS,
    Cite,
    Parsed,
    cite_key,
    is_headword,
    load_verdicts,
    norm,
    parse_book,
    squash,
)
from pipeline import CACHE, OUT, ROOT, write_json

REVIEW_DIR = CACHE / "review"
AUDIT = REVIEW_DIR / "wujuh-audit.json"
QUEUE = REVIEW_DIR / "wujuh-queue"
INBOX = REVIEW_DIR / "wujuh-verdicts"
BATCH_ITEMS = 40
SENSE_TEXT_CHARS = 700
WEAK_SCORE = 0.9
WEAK_MARGIN = 0.05

# --- Comparing a sense with a gloss -------------------------------------------

STOP = set(
    norm(
        "في من على عن إلى الى و أو ما لا لم لن هو هي هم الذي التي الذين به له لها ذلك "
        "هذا هذه أن إن كان قد كل غير بعد قبل مع عند أي يعني بمعنى ثم بين التي اللذين ونحوه "
        "شيء أمر الله تعالى قوله"
    ).split()
)
ARTICLE = ("وال", "بال", "فال", "كال", "لل", "ال", "و", "ف", "ب", "ل")
ENDINGS = ("ات", "ون", "ين", "هم", "هن", "ها", "كم", "كن", "نا", "ه", "ي")


def stem(word: str) -> str:
    """A rough stem for comparing words: article and common endings removed."""
    for prefix in ARTICLE:
        if word.startswith(prefix) and len(word) - len(prefix) >= 3:
            word = word[len(prefix) :]
            break
    for ending in ENDINGS:
        if word.endswith(ending) and len(word) - len(ending) >= 3:
            return word[: -len(ending)]
    return word


def squash_weak(word: str) -> str:
    """Drop weak/vowel letters (ا, و, ي) to match broken plurals and derived forms."""
    return word.replace("و", "").replace("ي", "").replace("ا", "")


def content(text: str, heading: str) -> set[str]:
    """The content words of a text, as stems, leaving out forms of the headword
    (so `الحكمة: …` does not agree with a label just by naming the word)."""
    words = re.findall(r"[ء-ي]+", norm(text))
    return {stem(w) for w in words if w not in STOP and len(w) > 2 and not is_headword(w, heading)}


def share(a: set[str], b: set[str]) -> bool:
    """Some stem of one is the other's, or begins it (3 letters at least). Also
    matches consonantal skeletons with weak letters dropped."""
    if any(
        x == y or (min(len(x), len(y)) >= 3 and (x.startswith(y) or y.startswith(x)))
        for x in a
        for y in b
    ):
        return True
    sq_a = {squash_weak(x) for x in a if len(squash_weak(x)) >= 3}
    sq_b = {squash_weak(y) for y in b if len(squash_weak(y)) >= 3}
    return any(
        x == y or (min(len(x), len(y)) >= 3 and (x.startswith(y) or y.startswith(x)))
        for x in sq_a
        for y in sq_b
    )


# --- Lints --------------------------------------------------------------------


def label_lints(label: str, fragment: str, heading: str) -> list[str]:
    words = label.split()
    if not words:
        return ["label-empty"]
    flags = []
    quoted = " ".join(squash(w) for w in fragment.split())
    if len(words) > 1 and " ".join(squash(w) for w in words[:2]) in quoted:
        flags.append("label-quote")
    if len(words) > 1 and words[1] != "بعينه" and is_headword(words[0], heading):
        flags.append("label-headword")
    if len(words) >= LABEL_WORDS:
        flags.append("label-cut")
    return flags


def cite_lints(cite: Cite, label: str, heading: str) -> list[str]:
    flags = label_lints(label, cite.fragment, heading)
    if cite.gloss and not share(content(cite.gloss, heading), content(label, heading)):
        flags.append("gloss-differs")
    start = cite.match.start
    if not start <= cite.word - 1 <= start + len(cite.fragment.split()):
        flags.append("word-outside-quote")
    if cite.match.score < WEAK_SCORE or cite.match.margin < WEAK_MARGIN:
        flags.append("weak-match")
    if cite.match.elsewhere:
        flags.append("other-surah")  # not in the surah he names, or he names none
    if cite.match.parallel:
        flags.append("parallel")  # a bare مثلها في سورة …: the verse echoing the one before
    return flags


# --- Audit --------------------------------------------------------------------


def load_words() -> dict[tuple[int, int], dict[str, Any]]:
    """Per verse: its text, Arabic Mukhtasar tafsir and words."""
    verses = {}
    for sura in range(1, 115):
        data = json.loads((OUT / "surah" / f"{sura:03d}.json").read_text(encoding="utf-8"))
        for verse in data["verses"]:
            verses[(sura, verse["v"])] = verse
    return verses


def lemma(word: dict[str, Any]) -> str:
    stem_seg = next((s for s in word["s"] if s["k"] == "m"), {})
    return stem_seg.get("la", "")


@dataclass
class Audit:
    items: list[dict[str, Any]]
    entries: dict[str, dict[str, Any]]  # headword → what a reviewer sees of it
    orphans: list[str]
    conflicts: list[str]


def audit_item(
    entry: Parsed,
    index: int,
    cite: Cite,
    verses: dict[tuple[int, int], dict[str, Any]],
    verdicts: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    sense = entry.senses[index]
    verse = verses[(cite.sura, cite.verse)]
    word = verse["w"][cite.word - 1]
    gloss = word.get("m", "")
    flags = cite_lints(cite, sense.label, entry.heading)
    key = cite_key(entry.heading, cite)
    verdict = verdicts.get(f"{key}:{index + 1}") or verdicts.get(key)
    if verdict and verdict.get("l") == sense.label:
        status = "verdict"
    elif not flags and share(
        content(f"{sense.label} {cite.gloss}", entry.heading), content(gloss, entry.heading)
    ):
        status = "agree"
    else:
        status = "queued"
    item = {
        "key": key,
        "status": status,
        "sense": index + 1,
        "label": sense.label,
        "quote": cite.fragment,
        "gloss": cite.gloss,
        "verse": verse["ar"],
        "word": word["a"],
        "lemma": lemma(word),
        "meaning": gloss,
        "tafsir": verse.get("ma", ""),
        "flags": flags,
        "score": round(cite.match.score, 3),
    }
    if verdict:
        item["verdict" if status == "verdict" else "previous"] = verdict
    return item


def label_conflicts(items: list[dict[str, Any]], verdicts: dict[str, dict[str, Any]]) -> list[str]:
    """Senses given two different corrected labels by their citations."""
    by_sense: dict[tuple[str, int], set[str]] = defaultdict(set)
    for item in items:
        key = item["key"]
        verdict = verdicts.get(f"{key}:{item['sense']}") or verdicts.get(key, {})
        if verdict.get("v") == "label":
            heading = item["key"].split(":", 3)[3]
            by_sense[(heading, item["sense"])].add(verdict["label"])
    return [f"{h} sense {s}: {sorted(labels)}" for (h, s), labels in by_sense.items()
            if len(labels) > 1]  # fmt: skip


def run_audit(parsed: list[Parsed], verdicts: dict[str, dict[str, Any]]) -> Audit:
    verses = load_words()
    items = []
    entries = {}
    for entry in parsed:
        entries[entry.heading] = {
            "headword": entry.heading,
            "root": entry.root,
            "senses": [
                {"n": i + 1, "label": s.label, "text": s.chunk[:SENSE_TEXT_CHARS]}
                for i, s in enumerate(entry.senses)
            ],
        }
        for index, sense in enumerate(entry.senses):
            items.extend(audit_item(entry, index, c, verses, verdicts) for c in sense.cites)
    seen = {item["key"] for item in items} | {f"{item['key']}:{item['sense']}" for item in items}
    orphans = sorted(key for key in verdicts if key not in seen)
    return Audit(items, entries, orphans, label_conflicts(items, verdicts))


def write_queue(audit: Audit) -> int:
    """Queued citations in batches of whole entries; the number of batches."""
    shutil.rmtree(QUEUE, ignore_errors=True)
    by_entry: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in audit.items:
        if item["status"] == "queued":
            by_entry[item["key"].split(":", 3)[3]].append(item)
    batches: list[list[dict[str, Any]]] = [[]]
    size = 0
    for heading, items in by_entry.items():
        if size and size + len(items) > BATCH_ITEMS:
            batches.append([])
            size = 0
        batches[-1].append({**audit.entries[heading], "items": items})
        size += len(items)
    batches = [b for b in batches if b]
    for n, batch in enumerate(batches, start=1):
        write_json(QUEUE / f"batch-{n:03d}.json", {"batch": n, "entries": batch}, pretty=True)
    return len(batches)


def summary(audit: Audit, verdicts: dict[str, dict[str, Any]]) -> dict[str, Any]:
    statuses = Counter(item["status"] for item in audit.items)
    flags = Counter(flag for item in audit.items for flag in item["flags"])
    kinds = Counter(
        (verdicts.get(f"{item['key']}:{item['sense']}") or verdicts[item["key"]])["v"]
        for item in audit.items
        if item["status"] == "verdict"
    )
    stale = sum(1 for item in audit.items if "previous" in item)
    return {
        "citations": len(audit.items),
        "status": dict(statuses),
        "verdicts": dict(kinds),
        "stale": stale,
        "flags": dict(flags.most_common()),
        "orphanVerdicts": len(audit.orphans),
        "labelConflicts": len(audit.conflicts),
    }


# --- Merging reviewers' verdicts ----------------------------------------------


def verdict_error(verdict: Any, item: dict[str, Any] | None, senses: int) -> str | None:
    """Why a reviewer's verdict cannot be merged, or None."""
    if item is None:
        return "no such citation"
    if not isinstance(verdict, dict) or verdict.get("v") not in VERDICT_KINDS:
        return f"v must be one of {VERDICT_KINDS}"
    if verdict.get("l") != item["label"]:
        return f"l must be the current label {item['label']!r}"
    if not str(verdict.get("note", "")).strip():
        return "note is required"
    if verdict["v"] == "label" and not str(verdict.get("label", "")).strip():
        return "a label verdict needs label"
    to = verdict.get("to")
    if verdict["v"] == "move" and not (
        isinstance(to, int) and 1 <= to <= senses and to != item["sense"]
    ):
        return f"a move verdict needs to: another sense 1..{senses}"
    if verdict["v"] == "word" and not (
        isinstance(to, int) and to >= 1 and to != int(item["key"].split(":")[2])
    ):
        return "a word verdict needs to: another word of the verse (1-based)"
    return None


def merge(audit: Audit, verdicts: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Fold valid verdicts from the inbox into `verdicts`; print the rest."""
    items = {item["key"]: item for item in audit.items}
    items.update({f"{item['key']}:{item['sense']}": item for item in audit.items})
    merged = dict(verdicts)
    taken = rejected = 0
    for path in sorted(INBOX.glob("*.json")):
        for key, verdict in json.loads(path.read_text(encoding="utf-8")).items():
            item = items.get(key)
            heading = key.split(":")[3]
            senses = len(audit.entries.get(heading, {}).get("senses", []))
            if error := verdict_error(verdict, item, senses):
                rejected += 1
                print(f"rejected {path.name} {key}: {error}")
                continue
            keep = ("v", "l", "label", "to", "note")
            merged[key] = {k: verdict[k] for k in keep if k in verdict}
            taken += 1
    print(f"merged {taken} verdicts, rejected {rejected}")
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n", 1)[0])
    parser.add_argument("--merge", action="store_true", help="merge reviewers' verdict files")
    args = parser.parse_args()
    parsed, _, _ = parse_book()
    verdicts = load_verdicts()
    audit = run_audit(parsed, verdicts)
    if args.merge:
        verdicts = merge(audit, verdicts)
        write_json(VERDICTS, dict(sorted(verdicts.items())), pretty=True)
        audit = run_audit(parsed, verdicts)
    report = summary(audit, verdicts)
    write_json(
        AUDIT,
        {
            "summary": report,
            "orphanVerdicts": audit.orphans,
            "labelConflicts": audit.conflicts,
            "items": audit.items,
        },
        pretty=True,
    )
    batches = write_queue(audit)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"audit in {AUDIT.relative_to(ROOT)}; {batches} batches in {QUEUE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
