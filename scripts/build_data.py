#!/usr/bin/env python3
"""Build compact per-surah JSON for Lenses from openly licensed sources.

Downloads (cached in data/cache/):
  - Quranic Arabic Corpus morphology 0.4 (GPL, Kais Dukes)
  - Quranic Arabic Corpus syntactic graphs (kaisdukes/quranic-corpus-api)
  - Tanzil Uthmani text, CC BY-ND 3.0, as distributed with the corpus
  - Indonesian and English Al-Mukhtasar (QuranEnc indonesian_mokhtasar and english_mokhtasar)
  - Lemma glosses shipped with the corpus API
  - Tafsir Center linguistic database, CC BY 4.0 (word iʿrāb, ṣarf, gloss, verse iʿrāb)

Does not scrape corpus.quran.com or tafsir.app.
"""

from __future__ import annotations

import hashlib
import json
import re
import sqlite3
import sys
import unicodedata
import urllib.request
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
OUT = ROOT / "public" / "data" / "quran"

MORPH_URL = "https://raw.githubusercontent.com/cltk/arabic_morphology_quranic-corpus/master/quranic-corpus-morphology-0.4.txt"
API = "https://raw.githubusercontent.com/kaisdukes/quranic-corpus-api/main/src/main/resources/data"
SYNTAX_URL = f"{API}/syntax.txt"
UTHMANI_URL = f"{API}/quran-uthmani.xml"
QURANENC_URL = "https://quranenc.com/api/v1/translation/sura/{key}/{sura}"
MOKHTASAR_VERSION = "V1.0.0"
MOKHTASAR_DATE = "23 January 2017"
LEMMAS_URL = f"{API}/lemmas.txt"
CHAPTERS_URL = f"{API}/chapters.json"
DB_URL = "https://huggingface.co/datasets/tafsircenter/tafsir-mcp-data/resolve/main/quran.db"
DB_SHA256 = "10e61f615ab5e6a3440e8ecc8ba1dc2273d12cd9048752760fe53a44d191cc27"

BUCK = {
    "'": "\u0621",
    ">": "\u0623",
    "&": "\u0624",
    "<": "\u0625",
    "}": "\u0626",
    "A": "\u0627",
    "b": "\u0628",
    "p": "\u0629",
    "t": "\u062a",
    "v": "\u062b",
    "j": "\u062c",
    "H": "\u062d",
    "x": "\u062e",
    "d": "\u062f",
    "*": "\u0630",
    "r": "\u0631",
    "z": "\u0632",
    "s": "\u0633",
    "$": "\u0634",
    "S": "\u0635",
    "D": "\u0636",
    "T": "\u0637",
    "Z": "\u0638",
    "E": "\u0639",
    "g": "\u063a",
    "_": "\u0640",
    "f": "\u0641",
    "q": "\u0642",
    "k": "\u0643",
    "l": "\u0644",
    "m": "\u0645",
    "n": "\u0646",
    "h": "\u0647",
    "w": "\u0648",
    "Y": "\u0649",
    "y": "\u064a",
    "F": "\u064b",
    "N": "\u064c",
    "K": "\u064d",
    "a": "\u064e",
    "u": "\u064f",
    "i": "\u0650",
    "~": "\u0651",
    "o": "\u0652",
    "^": "\u0653",
    "#": "\u0654",
    "`": "\u0670",
    "{": "\u0671",
    ":": "\u06dc",
    "@": "\u06df",
    '"': "\u06e0",
    "[": "\u06e2",
    ";": "\u06e3",
    ",": "\u06e5",
    ".": "\u06e6",
    "!": "\u06e8",
    "-": "\u06ea",
    "+": "\u06eb",
    "%": "\u06ec",
    "]": "\u06ed",
    "|": "\u0622",
    "/": "",
}

PREFIX_LEMMA = {
    "w:CONJ+": "w",
    "w:REM+": "w",
    "w:CIRC+": "w",
    "w:SUP+": "w",
    "w:COM+": "w",
    "w:P+": "w",
    "f:CONJ+": "f",
    "f:REM+": "f",
    "f:RSLT+": "f",
    "f:CAUS+": "f",
    "f:SUP+": "f",
    "bi+": "b",
    "ka+": "k",
    "ta+": "t",
    "l:P+": "l",
    "sa+": "s",
    "ya+": "yaA",
    "ha+": "haA",
    "+n:EMPH": "n",
    "+VOC": "hum~a",
}

FORMS = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"}
DIACRITICS = re.compile(
    "[\u064b-\u0652\u0670\u0653-\u065f\u06d6-\u06ed\u0640]"
)
ALEF = str.maketrans(
    {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ي",
        "ة": "ه",
        "ؤ": "و",
        "ئ": "ي",
    }
)


def download(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 0:
        print(f"cache {dest.name}")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"get {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "lenses-data-build"})
    with urllib.request.urlopen(req, timeout=180) as resp, dest.open("wb") as out:
        while True:
            chunk = resp.read(1 << 20)
            if not chunk:
                break
            out.write(chunk)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def buckwalter(text: str) -> str:
    return "".join(BUCK.get(ch, ch) for ch in text)


def lemma_arabic(key: str) -> str:
    core = key[:-1] if key and key[-1].isdigit() else key
    return buckwalter(core)


def is_base(ch: str) -> bool:
    if ch == "\u0640":
        return False
    return unicodedata.category(ch) not in ("Mn", "Me", "Cf")


def letter_groups(text: str) -> list[str]:
    groups: list[str] = []
    current = ""
    for ch in text:
        if is_base(ch):
            if current:
                groups.append(current)
            current = ch
        elif current:
            current += ch
        elif groups:
            groups[-1] += ch
        else:
            current = ch
    if current:
        groups.append(current)
    return groups


def slice_segments(word: str, decoded: list[str]) -> list[str] | None:
    whole = letter_groups(word)
    parts = [letter_groups(piece) for piece in decoded]
    if sum(len(p) for p in parts) != len(whole):
        return None
    out: list[str] = []
    index = 0
    for part in parts:
        take = len(part)
        out.append("".join(whole[index : index + take]))
        index += take
    return out


def norm_ar(text: str) -> str:
    return DIACRITICS.sub("", text).translate(ALEF)


def parse_pgn(token: str, feat: dict) -> None:
    i = 0
    if i < len(token) and token[i] in "123":
        feat["per"] = int(token[i])
        i += 1
    if i < len(token) and token[i] in "MF":
        feat["gen"] = token[i]
        i += 1
    if i < len(token) and token[i] in "SDP":
        feat["num"] = token[i]
        i += 1
    if i != len(token):
        raise ValueError(f"bad person/gender/number tag {token}")


def parse_segment(tag: str, features: str, form: str) -> dict:
    parts = features.split("|")
    kind_name = parts[0]
    kind = {"PREFIX": "p", "STEM": "m", "SUFFIX": "s"}.get(kind_name)
    if kind is None:
        raise ValueError(f"unknown segment kind {kind_name}")
    pos = tag
    feat: dict = {}
    lemma = None
    root = None
    marker = None
    i = 1
    while i < len(parts):
        token = parts[i]
        if token.startswith("POS:"):
            pos = token[4:]
        elif token.startswith("LEM:"):
            lemma = token[4:]
        elif token.startswith("ROOT:"):
            root = token[5:]
        elif token.startswith("PRON:"):
            parse_pgn(token[5:], feat)
        elif token.startswith("SP:"):
            feat["sp"] = token[3:]
        elif token.startswith("MOOD:"):
            feat["mood"] = token[5:]
        elif token in ("NOM", "GEN", "ACC"):
            feat["case"] = token
        elif token == "ACT" and i + 1 < len(parts) and parts[i + 1] == "PCPL":
            feat["deriv"] = "ACT-PCPL"
            i += 1
        elif token == "PASS" and i + 1 < len(parts) and parts[i + 1] == "PCPL":
            feat["deriv"] = "PASS-PCPL"
            i += 1
        elif token == "ACT":
            feat["voice"] = "ACT"
        elif token == "PASS":
            feat["voice"] = "PASS"
        elif token == "VN":
            feat["deriv"] = "VN"
        elif token in ("PERF", "IMPF", "IMPV"):
            feat["asp"] = token
        elif token.startswith("(") and token.endswith(")") and token[1:-1] in FORMS:
            feat["form"] = token[1:-1]
        elif token in ("DEF", "INDEF"):
            feat["state"] = token
        elif re.fullmatch(r"[123]?[MF]?[SDP]?", token):
            parse_pgn(token, feat)
        elif token.endswith("+") or token.startswith("+"):
            marker = token
        else:
            raise ValueError(f"unparsed feature {token} in {features}")
        i += 1
    if lemma is None and marker in PREFIX_LEMMA:
        lemma = PREFIX_LEMMA[marker]
    seg = {"k": kind, "p": pos, "bw": form}
    if lemma:
        seg["l"] = lemma
        seg["la"] = lemma_arabic(lemma)
    if root:
        seg["r"] = root
        seg["ra"] = buckwalter(root)
    if feat:
        seg["f"] = feat
    return seg


def tokenize(sura: int, verse: int, text: str) -> list[str]:
    parts = text.split(" ")
    # Corpus tokenization keeps إل ياسين as one word (Quran 37:130).
    if sura == 37 and verse == 130 and len(parts) == 4:
        parts = parts[:2] + [" ".join(parts[2:])]
    return parts


def load_morphology(path: Path) -> tuple[str, dict]:
    header: list[str] = []
    words: dict[tuple[int, int, int], list[dict]] = defaultdict(list)
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if not line.startswith("("):
                if line.startswith("#") or line.startswith("\n") or "====" in line:
                    header.append(line)
                continue
            loc, form, tag, features = line.rstrip("\n").split("\t")
            match = re.match(r"\((\d+):(\d+):(\d+):(\d+)\)", loc)
            if not match:
                raise ValueError(loc)
            sura, verse, word, _seg = (int(match.group(i)) for i in range(1, 5))
            words[(sura, verse, word)].append(parse_segment(tag, features, form))
    return "".join(header), words


def load_uthmani(path: Path) -> tuple[str, list[dict]]:
    xml = path.read_text(encoding="utf-8")
    header = xml.split("<quran>", 1)[0]
    surahs = []
    for sura_match in re.finditer(r'<sura index="(\d+)" name="([^"]+)">(.*?)</sura>', xml, re.S):
        sura = int(sura_match.group(1))
        verses = []
        for aya in re.finditer(r'<aya index="(\d+)" text="([^"]*)"', sura_match.group(3)):
            verses.append(
                {
                    "v": int(aya.group(1)),
                    "ar": aya.group(2),
                    "tokens": tokenize(sura, int(aya.group(1)), aya.group(2)),
                }
            )
        surahs.append({"n": sura, "name": sura_match.group(2), "verses": verses})
    return header, surahs


def load_quranenc(
    key: str,
    cache_name: str,
    text_key: str,
    note_key: str,
    expected: dict[int, int],
) -> dict[tuple[int, int], dict[str, str]]:
    """Verse paragraphs from QuranEnc, stored verbatim. Missing or extra ayahs fail the build."""
    folder = CACHE / cache_name
    folder.mkdir(parents=True, exist_ok=True)
    found: dict[tuple[int, int], dict[str, str]] = {}
    for sura, count in expected.items():
        dest = folder / f"{sura:03d}.json"
        download(QURANENC_URL.format(key=key, sura=sura), dest)
        payload = json.loads(dest.read_text(encoding="utf-8"))
        rows = payload.get("result")
        if not isinstance(rows, list):
            raise SystemExit(f"{key} surah {sura} has no result list")
        ayas: dict[int, dict] = {}
        for row in rows:
            aya = int(row["aya"])
            if aya in ayas:
                raise SystemExit(f"duplicate {key} {sura}:{aya}")
            text = row.get("translation")
            if not isinstance(text, str) or not text.strip():
                raise SystemExit(f"empty {key} {sura}:{aya}")
            entry = {text_key: text}
            notes = row.get("footnotes")
            if isinstance(notes, str) and notes.strip():
                entry[note_key] = notes
            elif notes not in (None, ""):
                raise SystemExit(f"unexpected {key} footnotes at {sura}:{aya}")
            ayas[aya] = entry
        if set(ayas) != set(range(1, count + 1)):
            raise SystemExit(f"{key} surah {sura} covers {sorted(ayas)} not 1..{count}")
        for aya, entry in ayas.items():
            found[(sura, aya)] = entry
    if len(found) != 6236:
        raise SystemExit(f"expected 6236 {key} verses, got {len(found)}")
    return found


def load_lemmas(path: Path) -> dict[str, str]:
    glosses = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        glosses[parts[0]] = parts[1]
    return glosses


def load_center(path: Path) -> dict:
    digest = sha256(path)
    if digest != DB_SHA256:
        raise SystemExit(f"quran.db sha256 mismatch: {digest}")
    con = sqlite3.connect(path)
    irab = {
        (s, a, w): text
        for s, a, w, text in con.execute(
            "SELECT surahNo, ayahNo, wordNo, irabMushakkal FROM word_content_irab"
        )
    }
    sarf = {
        (s, a, w): text
        for s, a, w, text in con.execute(
            "SELECT surahNo, ayahNo, wordNo, sarf FROM word_content_sarf"
        )
    }
    meaning = {
        (s, a, w): text
        for s, a, w, text in con.execute(
            "SELECT surahNo, ayahNo, wordNo, meaning FROM word_content_meaning"
        )
    }
    rasm: dict[tuple[int, int], list[str]] = defaultdict(list)
    for s, a, w, text in con.execute(
        "SELECT surahNo, ayahNo, wordNo, word FROM word_content_rasm ORDER BY surahNo, ayahNo, wordNo"
    ):
        rasm[(s, a)].append(text)
    verse_irab = {
        (s, a): text
        for s, a, text in con.execute(
            "SELECT surahNo, ayahNo, irabAyah1 FROM ayah_content_irab"
        )
    }
    con.close()
    return {"irab": irab, "sarf": sarf, "meaning": meaning, "rasm": rasm, "verse": verse_irab}


def align_center(corpus: list[str], center: list[str]) -> list[int | None]:
    a = [norm_ar(w) for w in corpus]
    b = [norm_ar(w) for w in center]
    if len(a) == len(b) and sum(x == y for x, y in zip(a, b)) >= max(1, int(0.6 * len(a))):
        return list(range(len(a)))
    mapping: list[int | None] = [None] * len(a)
    matcher = SequenceMatcher(a=a, b=b, autojunk=False)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal" or (tag == "replace" and (i2 - i1) == (j2 - j1)):
            for offset in range(i2 - i1):
                mapping[i1 + offset] = j1 + offset
    return mapping


NODE_RE = re.compile(r"^(.+?) = ([A-Za-z]+)\((.*)\)$")
EDGE_RE = re.compile(r"^([a-z]+)\(n(\d+) - n(\d+)\)$")
LOC_RE = re.compile(r"(\d+):(\d+):(\d+)")


def parse_syntax(path: Path) -> list[dict]:
    graphs = []
    lines: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line == "go":
            if lines:
                graphs.append(lines)
            lines = []
            continue
        if line and not line.startswith("--"):
            lines.append(line)
    parsed = []
    for block in graphs:
        nodes = []
        edges = []
        expected = 1
        for line in block:
            if " = " in line:
                left, right = line.split(" = ", 1)
                names = [name.strip() for name in left.split(",")]
                for name in names:
                    number = int(name[1:])
                    if number != expected:
                        raise ValueError(f"expected n{expected} in {line}")
                    expected += 1
                match = NODE_RE.match(line)
                if not match:
                    raise ValueError(line)
                count = len(names)
                kind = match.group(2)
                value = match.group(3)
                if kind in ("word", "reference"):
                    loc = LOC_RE.search(value)
                    if not loc:
                        raise ValueError(line)
                    sura, verse, word = (int(loc.group(i)) for i in range(1, 4))
                    for _ in range(count):
                        nodes.append(
                            {
                                "t": "seg" if kind == "word" else "ref",
                                "s": sura,
                                "v": verse,
                                "w": word,
                            }
                        )
                elif kind in ("S", "NS", "VS", "CS", "PP", "SC"):
                    if count != 1:
                        raise ValueError(line)
                    ends = [int(n) for n in re.findall(r"n(\d+)", value)]
                    if len(ends) != 2:
                        raise ValueError(line)
                    nodes.append({"t": "ph", "p": kind, "from": ends[0] - 1, "to": ends[1] - 1})
                else:
                    if count != 1:
                        raise ValueError(line)
                    nodes.append(
                        {
                            "t": "elide",
                            "p": kind,
                            "a": None if value == "*" else value,
                        }
                    )
            else:
                match = EDGE_RE.match(line)
                if not match:
                    raise ValueError(line)
                edges.append(
                    {
                        "r": match.group(1),
                        "d": int(match.group(2)) - 1,
                        "h": int(match.group(3)) - 1,
                    }
                )
        parsed.append({"nodes": nodes, "edges": edges})
    return parsed


def syntax_indexes(segments: list[dict]) -> list[int]:
    # The published graphs do not give the definite article its own node.
    return [i for i, seg in enumerate(segments) if seg["p"] != "DET"]


def bind_word_nodes(nodes: list[dict], start: int, count: int, segments: list[dict]) -> None:
    indexes = syntax_indexes(segments)
    if count < len(indexes):
        raise ValueError("syntax node count is smaller than non-determiner segments")
    indexes = indexes + [None] * (count - len(indexes))
    for offset, seg_index in enumerate(indexes):
        node = nodes[start + offset]
        if seg_index is None:
            node["t"] = "slot" if node["t"] == "seg" else node["t"]
            if node["t"] == "ref":
                node["t"] = "ref"
                node["slot"] = True
        else:
            node["si"] = seg_index


def attach_graphs(graphs: list[dict], morphology: dict) -> dict[tuple[int, int], list[dict]]:
    by_verse: dict[tuple[int, int], list[dict]] = defaultdict(list)
    # Group consecutive raw nodes that were expanded from one annotation line.
    for graph in graphs:
        nodes = graph["nodes"]
        i = 0
        while i < len(nodes):
            node = nodes[i]
            if node["t"] not in ("seg", "ref"):
                i += 1
                continue
            j = i + 1
            while (
                j < len(nodes)
                and nodes[j]["t"] == node["t"]
                and nodes[j]["s"] == node["s"]
                and nodes[j]["v"] == node["v"]
                and nodes[j]["w"] == node["w"]
            ):
                j += 1
            segments = morphology[(node["s"], node["v"], node["w"])]
            bind_word_nodes(nodes, i, j - i, segments)
            for node in nodes[i:j]:
                node["a"] = None  # filled once tokens are known
            i = j
        verses = {(n["s"], n["v"]) for n in nodes if n["t"] in ("seg", "slot", "ref") and "s" in n}
        # A reference alone should not place the graph; use real words.
        home = {(n["s"], n["v"]) for n in nodes if n["t"] in ("seg", "slot")}
        targets = home or verses
        cross = len({(n["s"], n["v"]) for n in nodes if n["t"] in ("seg", "slot")}) > 1
        payload = {"nodes": nodes, "edges": graph["edges"], "x": cross}
        for key in targets:
            by_verse[key].append(payload)
    return by_verse


def compact_segment(seg: dict, arabic: str, glosses: dict[str, str]) -> dict:
    out = {"k": seg["k"], "a": arabic, "p": seg["p"]}
    if "l" in seg:
        out["l"] = seg["l"]
        out["la"] = seg["la"]
        gloss = glosses.get(seg["l"])
        if gloss:
            out["g"] = gloss
    if "r" in seg:
        out["r"] = seg["r"]
        out["ra"] = seg["ra"]
    if "f" in seg:
        out["f"] = seg["f"]
    return out


def primary_stem(segments: list[dict]) -> dict | None:
    stems = [seg for seg in segments if seg["k"] == "m"]
    for seg in stems:
        if "r" in seg:
            return seg
    return stems[0] if stems else None


def feat_string(seg: dict | None) -> str:
    if not seg or "f" not in seg:
        return ""
    order = ["form", "asp", "voice", "mood", "per", "gen", "num", "case", "state", "deriv", "sp"]
    return " ".join(f"{key}={seg['f'][key]}" for key in order if key in seg["f"])


def main() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    files = {
        "morph": CACHE / "quranic-corpus-morphology-0.4.txt",
        "syntax": CACHE / "syntax.txt",
        "uthmani": CACHE / "quran-uthmani.xml",
        "lemmas": CACHE / "lemmas.txt",
        "chapters": CACHE / "chapters.json",
        "db": CACHE / "quran.db",
    }
    download(MORPH_URL, files["morph"])
    download(SYNTAX_URL, files["syntax"])
    download(UTHMANI_URL, files["uthmani"])
    download(LEMMAS_URL, files["lemmas"])
    download(CHAPTERS_URL, files["chapters"])
    download(DB_URL, files["db"])

    morph_header, morphology = load_morphology(files["morph"])
    uthmani_header, surahs = load_uthmani(files["uthmani"])
    glosses = load_lemmas(files["lemmas"])
    chapters = {item["chapterNumber"]: item for item in json.loads(files["chapters"].read_text())}
    center = load_center(files["db"])
    expected = {surah["n"]: len(surah["verses"]) for surah in surahs}
    english = load_quranenc("english_mokhtasar", "english_mokhtasar", "en", "ef", expected)
    indonesian = load_quranenc("indonesian_mokhtasar", "mokhtasar", "mk", "mf", expected)
    arabic = load_quranenc("arabic_mokhtasar", "arabic_mokhtasar", "ma", "af", expected)
    graphs = parse_syntax(files["syntax"])
    graphs_by_verse = attach_graphs(graphs, morphology)

    slice_fail = 0
    slice_ok = 0
    align_miss = 0
    units = []
    verse_rows = []
    root_ids: dict[str, int] = {}
    lemma_ids: dict[str, int] = {}
    word_rows = []
    syntax_verse_count = 0
    coverage: dict[int, int] = defaultdict(int)

    for surah in surahs:
        sura = surah["n"]
        built_verses = []
        for verse in surah["verses"]:
            number = verse["v"]
            tokens = verse["tokens"]
            morph_count = max((w for (s, v, w) in morphology if s == sura and v == number), default=0)
            if morph_count != len(tokens):
                raise SystemExit(f"token mismatch {sura}:{number}: text {len(tokens)} morph {morph_count}")
            center_words = center["rasm"].get((sura, number), [])
            mapping = align_center(tokens, center_words)
            if any(item is None for item in mapping):
                align_miss += 1
            words_out = []
            for index, arabic in enumerate(tokens, start=1):
                segments = morphology[(sura, number, index)]
                decoded = [buckwalter(seg["bw"]) for seg in segments]
                sliced = slice_segments(arabic, decoded)
                if sliced is None:
                    slice_fail += 1
                    sliced = decoded
                else:
                    slice_ok += 1
                compact = [
                    compact_segment(seg, piece, glosses) for seg, piece in zip(segments, sliced)
                ]
                word = {"n": index, "a": arabic, "s": compact}
                center_index = mapping[index - 1]
                if center_index is not None:
                    key = (sura, number, center_index + 1)
                    if key in center["irab"] and center["irab"][key]:
                        word["i"] = center["irab"][key]
                    if key in center["sarf"] and center["sarf"][key]:
                        word["sf"] = center["sarf"][key]
                    if key in center["meaning"] and center["meaning"][key]:
                        word["m"] = center["meaning"][key]
                words_out.append(word)

                stem = primary_stem(compact)
                root_key = stem.get("r", "") if stem else ""
                lemma_key = stem.get("l", "") if stem else ""
                if root_key not in root_ids:
                    root_ids[root_key] = len(root_ids)
                if lemma_key not in lemma_ids:
                    lemma_ids[lemma_key] = len(lemma_ids)
                poses = []
                for seg in compact:
                    if seg["p"] not in poses:
                        poses.append(seg["p"])
                rels = []
                for graph in graphs_by_verse.get((sura, number), []):
                    owned = {
                        n_index
                        for n_index, node in enumerate(graph["nodes"])
                        if node.get("s") == sura
                        and node.get("v") == number
                        and node.get("w") == index
                        and node["t"] in ("seg", "slot")
                    }
                    for edge in graph["edges"]:
                        if edge["d"] in owned and edge["r"] not in rels:
                            rels.append(edge["r"])
                word_rows.append(
                    [
                        sura,
                        number,
                        index,
                        arabic,
                        root_ids[root_key],
                        lemma_ids[lemma_key],
                        stem["p"] if stem else (compact[0]["p"] if compact else ""),
                        ",".join(poses),
                        feat_string(stem),
                        ",".join(rels),
                    ]
                )

            for graph in graphs_by_verse.get((sura, number), []):
                for node in graph["nodes"]:
                    if node["t"] in ("seg", "slot", "ref") and not node.get("a"):
                        node["a"] = surahs[node["s"] - 1]["verses"][node["v"] - 1]["tokens"][node["w"] - 1]
            verse_graphs = []
            for graph in graphs_by_verse.get((sura, number), []):
                item = {"nodes": graph["nodes"], "edges": graph["edges"]}
                if graph["x"]:
                    item["x"] = True
                verse_graphs.append(item)
            if verse_graphs:
                syntax_verse_count += 1
                coverage[sura] += 1
            built = {
                "v": number,
                "ar": verse["ar"],
                "en": english[(sura, number)]["en"],
                "w": words_out,
            }
            if "ef" in english[(sura, number)]:
                built["ef"] = english[(sura, number)]["ef"]
            verse_irab = center["verse"].get((sura, number))
            if verse_irab:
                built["ir"] = verse_irab
            note = indonesian[(sura, number)]
            built["mk"] = note["mk"]
            if "mf" in note:
                built["mf"] = note["mf"]
            ar_note = arabic[(sura, number)]
            built["ma"] = ar_note["ma"]
            if "af" in ar_note:
                built["af"] = ar_note["af"]
            if verse_graphs:
                built["g"] = verse_graphs
            built_verses.append(built)
            verse_rows.append([sura, number, norm_ar(verse["ar"]), built["en"]])

        meta = chapters[sura]
        unit = {
            "n": sura,
            "name": surah["name"],
            "phonetic": meta["phonetic"],
            "title": meta.get("translation") or meta["phonetic"],
            "rev": meta["city"],
            "verses": len(built_verses),
            "syntax": coverage[sura],
        }
        units.append(unit)
        payload = {
            "n": sura,
            "name": surah["name"],
            "phonetic": meta["phonetic"],
            "title": meta.get("translation") or meta["phonetic"],
            "rev": meta["city"],
            "verses": built_verses,
        }
        dest = OUT / "surah" / f"{sura:03d}.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        if dest.stat().st_size > 12 * 1024 * 1024:
            raise SystemExit(f"{dest.name} exceeds the 12 MB precache limit")
        print(f"surah {sura:03d} {dest.stat().st_size/1e6:.2f} MB syntax {coverage[sura]}/{len(built_verses)}")

    roots = [""] * len(root_ids)
    for key, index in root_ids.items():
        roots[index] = {"b": key, "a": buckwalter(key) if key else ""}
    lemmas = [""] * len(lemma_ids)
    for key, index in lemma_ids.items():
        lemmas[index] = {
            "b": key,
            "a": lemma_arabic(key) if key else "",
            "g": glosses.get(key, ""),
        }
    (OUT / "words.json").write_text(
        json.dumps({"roots": roots, "lemmas": lemmas, "rows": word_rows}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (OUT / "verses.json").write_text(
        json.dumps(verse_rows, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    partial = [u for u in units if 0 < u["syntax"] < u["verses"]]
    missing = [u["n"] for u in units if u["syntax"] == 0]
    manifest = {
        "id": "quran",
        "title": "The Quran",
        "language": "ar",
        "units": units,
        "stats": {
            "verses": 6236,
            "words": len(word_rows),
            "syntaxVerses": syntax_verse_count,
            "syntaxGraphs": len(graphs),
            "partialChapters": [{"n": u["n"], "syntax": u["syntax"], "verses": u["verses"]} for u in partial],
            "chaptersWithoutSyntax": missing,
        },
        "sources": [
            {
                "id": "qac-morphology",
                "title": "Quranic Arabic Corpus morphology 0.4",
                "kind": "morphology",
                "attribution": "Kais Dukes and the Quranic Arabic Corpus",
                "description": "Morphological segments, roots, lemmas, and grammatical features for all words.",
                "license": "GPL, with permission to use the annotation in an application if the corpus is credited",
                "url": "https://corpus.quran.com/download/",
            },
            {
                "id": "qac-syntax",
                "title": "Quranic Arabic Corpus dependency graphs",
                "kind": "syntax",
                "attribution": "Kais Dukes, Quranic Arabic Corpus, published in kaisdukes/quranic-corpus-api",
                "description": "Syntactic dependency graphs from the Quranic Arabic Dependency Treebank.",
                "license": "Distributed with the open corpus project; the API repository has no separate LICENSE file. Treat it under the corpus terms: credit corpus.quran.com.",
                "url": "https://github.com/kaisdukes/quranic-corpus-api",
            },
            {
                "id": "tanzil",
                "title": "Tanzil Uthmani Quran text",
                "kind": "text",
                "attribution": "Tanzil Project",
                "description": "Arabic text from Tanzil, CC BY-ND 3.0, unchanged.",
                "license": "CC BY-ND 3.0. The Arabic text is stored verbatim.",
                "url": "https://tanzil.net/",
            },
            {
                "id": "english-mokhtasar",
                "title": "Al-Mukhtasar in Interpreting the Noble Quran (English)",
                "kind": "tafsir",
                "attribution": "Tafsir Center for Quranic Studies, English text via QuranEnc.com",
                "description": "English translation and commentary of Al-Mukhtasar via QuranEnc.com.",
                "license": "QuranEnc republication terms: verbatim text, and credit the publisher and QuranEnc.com. The edition key is english_mokhtasar.",
                "url": "https://quranenc.com/api/v1/translation/sura/english_mokhtasar/1",
            },
            {
                "id": "tafsir-center",
                "title": "Tafsir Center linguistic analysis",
                "kind": "classical-irab",
                "attribution": "Tafsir Center for Quranic Studies",
                "description": "Traditional morphological description (ṣarf) from the Tafsir Center database, alongside word-level classical iʿrāb and verse-level sentence syntax. A second analysis beside the corpus tree.",
                "license": "CC BY 4.0",
                "url": "https://tafsir.net/",
            },
            {
                "id": "indonesian-mokhtasar",
                "title": "Al-Mukhtasar in Interpreting the Noble Quran (Indonesian)",
                "kind": "tafsir",
                "attribution": "Tafsir Center for Quranic Studies, Indonesian text via QuranEnc.com",
                "description": f"Indonesian translation and commentary of Al-Mukhtasar via QuranEnc.com, edition {MOKHTASAR_VERSION} ({MOKHTASAR_DATE}).",
                "license": f"QuranEnc republication terms: verbatim text, credit the publisher and QuranEnc.com, and name edition {MOKHTASAR_VERSION} ({MOKHTASAR_DATE}).",
                "url": "https://quranenc.com/en/browse/indonesian_mokhtasar",
            },
            {
                "id": "arabic-mokhtasar",
                "title": "Al-Mukhtasar in Interpreting the Noble Quran (Arabic)",
                "kind": "tafsir",
                "attribution": "Tafsir Center for Quranic Studies, Arabic text via QuranEnc.com",
                "description": "Arabic commentary text of Al-Mukhtasar via QuranEnc.com.",
                "license": "QuranEnc republication terms: verbatim text, and credit the publisher and QuranEnc.com. The edition key is arabic_mokhtasar.",
                "url": "https://quranenc.com/api/v1/translation/sura/arabic_mokhtasar/1",
            },
        ],
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    notices = OUT.parent / "NOTICES.txt"
    notices.write_text(
        "\n".join(
            [
                "Lenses data notices",
                "==================",
                "",
                "This file must stay with the derived data.",
                "",
                morph_header.strip(),
                "",
                "------------------------------------------------------------",
                "",
                uthmani_header.strip(),
                "",
                "------------------------------------------------------------",
                "English Al-Mukhtasar",
                "Title: Al-Mukhtasar in Interpreting the Noble Quran",
                "Publisher: Tafsir Center for Quranic Studies",
                "Source: QuranEnc.com, key english_mokhtasar",
                "https://quranenc.com/api/v1/translation/sura/english_mokhtasar/{sura}",
                "QuranEnc’s public edition list does not publish a separate version",
                "number for this key. The text is the edition that endpoint returns,",
                "stored verbatim. Republication follows the QuranEnc terms listed",
                "with the Indonesian Al-Mukhtasar below.",
                "",
                "------------------------------------------------------------",
                "Syntactic dependency graphs",
                "Source file: syntax.txt in https://github.com/kaisdukes/quranic-corpus-api",
                "Copyright: Kais Dukes / Quranic Arabic Corpus.",
                "That repository does not include a LICENSE file. The graphs are the",
                "Quranic Arabic Dependency Treebank (chapters 1-8, part of 9, and 59-114",
                "in this export). Credit https://corpus.quran.com and do not present",
                "the annotation as your own.",
                "",
                "------------------------------------------------------------",
                "Tafsir Center linguistic database (quran.db)",
                "Copyright: Tafsir Center for Quranic Studies (مركز تفسير للدراسات القرآنية)",
                "License: Creative Commons Attribution 4.0 International (CC BY 4.0)",
                "https://creativecommons.org/licenses/by/4.0/",
                "Credit: Tafsir Center for Quranic Studies (https://tafsir.net)",
                "This app uses word-level iʿrāb (irabMushakkal), ṣarf, word meanings,",
                "and verse-level iʿrāb (irabAyah1). It does not redistribute the tafsir",
                "book texts stored in the same database.",
                "Dataset: https://huggingface.co/datasets/tafsircenter/tafsir-mcp-data",
                "",
                "------------------------------------------------------------",
                "Indonesian Al-Mukhtasar",
                "Title: Al-Mukhtasar in Interpreting the Noble Quran",
                "Publisher: Tafsir Center for Quranic Studies",
                f"Edition: {MOKHTASAR_VERSION} ({MOKHTASAR_DATE})",
                "Source: QuranEnc.com, key indonesian_mokhtasar",
                "https://quranenc.com/en/browse/indonesian_mokhtasar",
                "Republication terms from QuranEnc:",
                "1. No modification, addition, or deletion of the content.",
                "2. Clearly refer to the publisher and the source (QuranEnc.com).",
                "3. Mention the version number when re-publishing.",
                "4. Keep the transcript information inside the document.",
                "5. Notify QuranEnc.com of any note on the translation.",
                "6. Update the translation to the latest version issued by QuranEnc.com.",
                "7. Do not include inappropriate advertisements when displaying it.",
                "This app stores each verse paragraph verbatim and does not add to or trim the text.",
                "",
                "------------------------------------------------------------",
                "Arabic Al-Mukhtasar",
                "Title: Al-Mukhtasar in Interpreting the Noble Quran",
                "Publisher: Tafsir Center for Quranic Studies",
                "Source: QuranEnc.com, key arabic_mokhtasar",
                "https://quranenc.com/api/v1/translation/sura/arabic_mokhtasar/{sura}",
                "License: QuranEnc republication terms: retain verbatim text and attribution.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    verify(OUT)
    print(f"slice ok {slice_ok} fail {slice_fail} align-miss verses {align_miss}")
    print(f"syntax verses {syntax_verse_count} graphs {len(graphs)} words {len(word_rows)}")
    print("partial", [(u["n"], u["syntax"], u["verses"]) for u in partial])
    print("no syntax", missing)


def verify(out: Path) -> None:
    surah = json.loads((out / "surah" / "002.json").read_text(encoding="utf-8"))
    verse = next(item for item in surah["verses"] if item["v"] == 31)
    words = verse["w"]
    if len(words) != 15:
        raise SystemExit(f"2:31 word count {len(words)}")
    first = words[0]
    if [seg["p"] for seg in first["s"]] != ["REM", "V"]:
        raise SystemExit(f"2:31:1 pos {[seg['p'] for seg in first['s']]}")
    stem = first["s"][1]
    if stem["r"] != "Elm" or stem["f"].get("form") != "II" or stem["f"].get("asp") != "PERF":
        raise SystemExit(f"2:31:1 stem {stem}")
    if stem["f"].get("per") != 3 or stem["f"].get("gen") != "M" or stem["f"].get("num") != "S":
        raise SystemExit(f"2:31:1 agreement {stem['f']}")
    if "".join(seg["a"] for seg in first["s"]) != first["a"]:
        raise SystemExit(f"2:31:1 slices {first['s']} vs {first['a']}")
    adam = words[1]
    if adam["s"][0]["p"] != "PN" or adam["s"][0]["f"].get("case") != "ACC":
        raise SystemExit(f"2:31:2 {adam['s'][0]}")
    inform = words[9]
    stem = next(seg for seg in inform["s"] if seg["k"] == "m")
    if stem["f"].get("form") != "IV" or stem["f"].get("asp") != "IMPV":
        raise SystemExit(f"2:31:10 {stem}")
    if not any(seg["p"] == "PRON" for seg in inform["s"]):
        raise SystemExit("2:31:10 missing pronoun suffix")
    if len(verse["g"]) != 4:
        raise SystemExit(f"2:31 graphs {len(verse['g'])}")
    graph = verse["g"][0]
    if not any(node["t"] == "elide" and node.get("a") == "هُوَ" for node in graph["nodes"]):
        raise SystemExit("2:31 missing implied huwa")
    if not any(edge["r"] == "subj" for edge in graph["edges"]):
        raise SystemExit("2:31 missing subject edge")
    if not verse["en"].startswith("31. To reveal the position of Adam"):
        raise SystemExit(verse["en"][:120])
    if not verse.get("ma"):
        raise SystemExit("2:31 missing Arabic Mukhtasar (ma)")
    if not verse.get("mk"):
        raise SystemExit("2:31 missing mukhtasar")
    fatiha = json.loads((out / "surah" / "001.json").read_text(encoding="utf-8"))
    opening = fatiha["verses"][0].get("mk", "")
    if not opening.startswith("Aku mulai membaca"):
        raise SystemExit(f"1:1 mukhtasar {opening[:80]}")
    english_opening = fatiha["verses"][0].get("en", "")
    if not english_opening.startswith("1. I begin by calling on Allah"):
        raise SystemExit(f"1:1 english mukhtasar {english_opening[:80]}")
    if not verse.get("ir") or not words[0].get("i"):
        raise SystemExit("2:31 missing classical i'rab")
    print("verified 2:31")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"build failed: {exc}", file=sys.stderr)
        raise
