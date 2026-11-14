"""al-Damaghani's al-Wujuh: entries, senses, sense names, surah names, excerpts."""

from __future__ import annotations

from build_wujuh import (
    Cite,
    Corpus,
    Parsed,
    Sense,
    VerseMatch,
    align_span,
    apply_verdicts,
    bare_references,
    body_text,
    excerpt,
    find_parallel,
    find_verse,
    find_word,
    headword,
    is_headword,
    lemma_names,
    read_heading,
    resolve_surah,
    root_keys,
    sense_label,
    span_words,
    split_entries,
    split_senses,
    squash,
    tokens,
    unquoted_spans,
)

ENTRY_TEXT = (
    "أم ة على ثلاثة أوجه عصبة . ملة . سنين "
    'فوجه منها : امة مسلمة لك يعني عصبة . قوله تعالى في سورة البقرة " ومن ذريتنا امة مسلمة لك " '
    'الثاني : امة يعني ملة . قوله تعالى في سورة البقرة " كان الناس امة واحدة " '
    'الثالث امة يعني سنين معدودة . قوله تعالى في سورة هود " إلى امة معدودة " '
    "ب ح ر على وجهين فوجه منهما البحر بمعنى الماء المالح"
)


def test_split_entries_reads_the_spaced_headword_and_the_declared_count() -> None:
    entries = split_entries(ENTRY_TEXT)
    assert [(e.heading, e.declared) for e in entries] == [("أمة", 3), ("بحر", 2)]


def test_split_senses_follows_the_ordinals_with_or_without_a_colon() -> None:
    senses = split_senses(split_entries(ENTRY_TEXT)[0].body)
    assert len(senses) == 3
    assert senses[1].startswith("امة يعني ملة")
    assert senses[2].startswith("امة يعني سنين")


def test_split_senses_stops_where_another_entry_starts() -> None:
    body = 'فوجه منها : الأول يعني كذا الثاني : يعني كذا " نص " فوجه منها : شيء آخر'
    assert split_senses(body)[-1].endswith('" نص "')


def test_sense_label_names_the_sense_in_his_spelling() -> None:
    assert sense_label('امة يعني ملة . قوله تعالى في سورة البقرة " كان "') == "ملة"
    assert sense_label("الأثقال بمعنى الأوزار كقوله تعالى") == "الأوزار"
    assert sense_label("امة محمد صلى الله عليه وسلم خاصة . قوله") == ("امة محمد صلى الله عليه وسلم")


def test_resolve_surah_knows_the_old_names() -> None:
    names = {"البقره": 2, "الملائكه": 35, "حم السجده": 41, "حم": 40}
    assert resolve_surah("البقرة", names) == 2
    assert resolve_surah("حم السجدة", names) == 41


def test_squash_lets_uthmani_and_plain_spelling_agree() -> None:
    assert squash("وَٰحِدَةً") == squash("واحدة")
    assert squash("ٱلصَّلَوٰةَ") != ""


def test_root_keys_reads_a_headword_as_its_root() -> None:
    by_letters = {"امم": ["Amm"], "بحر": ["bHr"], "رجو": ["rjw"]}
    assert root_keys("أمة", by_letters) == {"Amm"}
    assert root_keys("بحر", by_letters) == {"bHr"}
    assert root_keys("رجا", by_letters) == {"rjw"}


def test_find_word_prefers_the_root_word_inside_the_quote() -> None:
    roots = ["kwn", "nws", "Amm", "wHd", "Amm"]
    assert find_word(roots, {"Amm"}, start=1, length=3) == 3
    assert find_word(roots, {"xyz"}, start=0, length=2) is None


def test_excerpt_keeps_three_words_either_side() -> None:
    words = ["كَانَ", "ٱلنَّاسُ", "أُمَّةً", "وَٰحِدَةً", "فَبَعَثَ", "ٱللَّهُ", "ٱلنَّبِيِّـۧنَ", "مُبَشِّرِينَ"]
    assert excerpt(words, 3) == ["كَانَ ٱلنَّاسُ", "أُمَّةً", "وَٰحِدَةً فَبَعَثَ ٱللَّهُ"]


def test_sense_label_strips_leading_headword_and_dangling_words() -> None:
    assert sense_label("الحكمة القرآن قوله تعالى في سورة النحل", "حكم") == "القرآن"
    assert sense_label("خفافا يعني شبانا ويقال : خفافا من المال", "خفف") == "شبانا"
    assert sense_label("الإثم يعني المعصية فذلك قوله تعالى", "أثم") == "المعصية"
    assert is_headword("الحكمة", "حكم")
    assert is_headword("التأويل", "أول")


def test_headword_drops_noise_prefix() -> None:
    by_letters = {"بطل": ["bTl"], "امم": ["Amm"]}
    assert headword(["قوة", "ب", "ط", "ل"], by_letters) == ("بطل", {"bTl"})
    assert headword(["أم", "ة"], by_letters) == ("أمة", {"Amm"})


def test_apply_verdicts_modifies_entries() -> None:
    match = VerseMatch(verse=1, start=0, score=1.0, margin=1.0)
    c1 = Cite(1, 1, 1, "ق1", match, "")
    c2 = Cite(1, 2, 1, "ق2", match, "")
    c3 = Cite(1, 3, 1, "ق3", match, "")
    s1 = Sense("s1", "قديم", [c1, c2])
    s2 = Sense("s2", "آخر", [c3])
    parsed = [Parsed("هد", {"hd"}, [s1, s2])]

    verdicts = {
        "1:1:1:هد": {"v": "label", "l": "قديم", "label": "جديد", "note": "ok"},
        "1:2:1:هد": {"v": "move", "l": "قديم", "to": 2, "note": "belongs to sense 2"},
        "1:3:1:هد": {"v": "drop", "l": "آخر", "note": "wrong word"},
    }
    applied = apply_verdicts(parsed, verdicts)
    assert applied == 3
    assert parsed[0].senses[0].label == "جديد"
    assert [c.verse for c in parsed[0].senses[0].cites] == [1]
    assert [c.verse for c in parsed[0].senses[1].cites] == [2]


def test_split_entries_reads_compound_counts_unhamzated_and_glossed_headings() -> None:
    text = (
        "أت ى على ستة عشر وجها الدنو فوجه منها : الإتيان الدنو "
        "ص ل ح على عشرة اوجه الايمان فوجه منها الصلاح الايمان "
        "ر ح م ( من الرحمة ) على أربعة عشر وجها الإسلام فوجه منها"
    )
    assert [(e.heading, e.declared) for e in split_entries(text)] == [
        ("أتى", 16),
        ("صلح", 10),
        ("رحم", 14),
    ]


def test_body_text_respells_structural_words_and_quotes() -> None:
    raw = (
        "#META#Header#End#\n"
        "فوجه منها : المد بمعنى العطاء . قوله سبحانه فى سورة نوح (( ويمددكم بأموال )) يعنى نعطيكم . "
        "والثانى : يمدونهم أى يلجئونهم"
    )
    text = body_text(raw)
    assert 'في سورة نوح " ويمددكم بأموال " يعني نعطيكم' in text
    assert "الثاني : يمدونهم أي يلجئونهم" in text
    assert len(split_senses(text)) == 2


NAS_SENSE = (
    "الناس محمد صلى الله عليه وسلم قوله تعالى في سورة النساء أم يحسدون الناس على ما آتاهم الله "
    "من فضله يعني محمدا صلى الله عليه وسلم كقوله تعالى في سورة آل عمران والذين قال لهم الناس "
    "مثلها في سورة الحج كقوله تعالى فيها عام فيه يغاث الناس"
)


def test_unquoted_spans_run_from_marker_to_marker_and_carry_the_surah() -> None:
    names = {"النساء": 4, "ال عمران": 3, "الحج": 22}
    spans = unquoted_spans(NAS_SENSE, names)
    assert [(s.sura, " ".join(s.words)) for s in spans] == [
        (4, "أم يحسدون الناس على ما آتاهم الله من فضله يعني محمدا صلى الله عليه وسلم"),
        (3, "والذين قال لهم الناس"),
        (22, "عام فيه يغاث الناس"),  # named before كقوله, then فيها
    ]


def test_span_words_joins_a_vocative_as_the_uthmani_text_does() -> None:
    assert span_words(["يا", "عيسى", "ابن"]) == [["يا", "عيسى"], ["ابن"]]
    assert squash("يَٰٓأَيُّهَا") == "".join(squash(w) for w in ["يا", "أيها"])


def corpus(verses: dict[int, tuple[str, list[str]]]) -> Corpus:
    return Corpus(
        words={(4, v): text.split() for v, (text, _) in verses.items()},
        squashed={(4, v): [squash(w) for w in text.split()] for v, (text, _) in verses.items()},
        roots={(4, v): roots for v, (_, roots) in verses.items()},
        verses={4: list(verses)},
    )


def test_align_span_finds_where_the_quotation_ends_and_his_comment_begins() -> None:
    quran = corpus(
        {
            54: ("أَمْ يَحْسُدُونَ ٱلنَّاسَ عَلَىٰ مَآ ءَاتَىٰهُمُ ٱللَّهُ", ["", "Hsd", "nws", "", "", "Aty", "Alh"]),
            1: ("يَٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمُ", ["", "nws", "wqy", "rbb"]),
        }
    )
    span = ["أم", "يحسدون", "الناس", "على", "ما", "آتاهم", "الله", "يعني", "محمدا"]
    aligned = align_span(span, 4, {"nws"}, quran)
    assert aligned is not None
    match, run = aligned
    assert (match.verse, match.start, run.size, run.skip) == (54, 0, 7, 0)
    assert match.score > 0.9
    assert align_span(["الذين", "قال", "لهم"], 4, {"nws"}, quran) is None


def test_align_span_refuses_a_phrase_two_verses_quote_alike() -> None:
    quran = corpus(
        {
            1: ("يَٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمُ", ["", "nws", "wqy", "rbb"]),
            2: ("يَٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمُ", ["", "nws", "wqy", "rbb"]),
        }
    )
    assert align_span(["يا", "أيها", "الناس", "اتقوا", "ربكم"], 4, {"nws"}, quran) is None


def test_is_headword_allows_a_hollow_root_without_its_middle_letter() -> None:
    assert is_headword("الناس", "نوس")
    assert sense_label("الناس جميع الناس قوله تعالى", "نوس") == "جميع الناس"
    assert sense_label("الساق بعينها قوله تعالى", "سوق") == "الساق بعينها"


def test_root_keys_reads_a_two_letter_headword_as_every_root_it_may_be() -> None:
    by_letters = {"ابب": ["Abb"], "ابو": ["Abw"], "كره": ["krh"], "كرر": ["krr"]}
    assert root_keys("أب", by_letters) == {"Abb", "Abw"}
    assert root_keys("كره", by_letters) == {"krh"}  # not كر + ة


def test_root_keys_reads_hamza_and_hollow_spellings() -> None:
    by_letters = {
        "ياس": ["yAs"],
        "سوا": ["swA"],
        "سوي": ["swy"],
        "روح": ["rwH"],
        "سود": ["swd"],
        "سلط": ["slT"],
    }
    assert root_keys("يءس", by_letters) == {"yAs"}
    assert root_keys("سوء", by_letters) == {"swA"}  # not سوي
    assert root_keys("سيأ", by_letters) == {"swA"}
    assert root_keys("سواء", by_letters) == {"swy"}
    assert root_keys("ريح", by_letters) == {"rwH"}
    assert root_keys("سيد", by_letters) == {"swd"}
    assert root_keys("سلطن", by_letters) == {"slT"}


YUSUF = Corpus(
    words={},
    squashed={
        (12, 46): [squash(w) for w in ["لَّعَلِّىٓ", "أَرْجِعُ", "إِلَى", "ٱلنَّاسِ", "لَعَلَّهُمْ", "يَعْلَمُونَ"]],
        (10, 2): [squash(w) for w in ["أَكَانَ", "لِلنَّاسِ", "عَجَبًا"]],
    },
    roots={(12, 46): ["Ell", "rjE", "", "nws", "Ell", "Elm"], (10, 2): ["kwn", "nws", "Ejb"]},
    verses={12: [46], 10: [2]},
)


def test_a_citation_he_files_under_the_wrong_surah_is_found_in_the_whole_quran() -> None:
    span = ["لعلي", "أرجع", "إلى", "الناس", "لعلهم", "يعلمون"]
    assert align_span(span, 10, {"nws"}, YUSUF) is None  # he names يونس
    aligned = align_span(span, None, {"nws"}, YUSUF)
    assert aligned is not None
    match, _ = aligned
    assert (match.sura, match.verse, match.elsewhere) == (12, 46, True)
    found = find_verse("لعلي أرجع إلى الناس", None, {"nws"}, YUSUF)
    assert found is not None
    assert (found.sura, found.verse, found.elsewhere) == (12, 46, True)


def test_the_whole_quran_search_wants_a_longer_quotation() -> None:
    assert align_span(["لعلي", "أرجع", "إلى"], 12, {"nws", "rjE"}, YUSUF) is not None
    assert align_span(["لعلي", "أرجع", "إلى"], None, {"nws", "rjE"}, YUSUF) is None
    assert find_verse("إلى الناس", None, {"nws"}, YUSUF) is None


def test_a_particle_headword_is_read_by_its_lemma_and_a_garbled_one_by_hand() -> None:
    by_letters = {"الو": ["Alw"], "حسن": ["Hsn"], "سوا": ["swA"]}
    by_lemma = {"الي": {"~<ilaY`"}, "في": {"~fiY"}, "حتي": {"~Hat~aY`"}}
    head = read_heading(["إ", "ل", "ى"], by_letters, by_lemma)
    assert (head.roots, head.lemmas) == ({"Alw"}, {"~<ilaY`"})  # parse keeps the better
    assert read_heading(["ف", "ي"], by_letters, by_lemma).lemmas == {"~fiY"}
    assert read_heading(["ليف", "ح", "ت", "ى"], by_letters, by_lemma).text == "حتى"
    both = read_heading(["س", "ن", "وس", "وء"], by_letters, by_lemma)
    assert both.roots == {"Hsn", "swA"}


def test_find_word_takes_the_word_the_sense_names_between_two_of_the_root() -> None:
    roots = ["rwH", "rwH", "jnn"]
    lemmas = [squash("رَوْح"), squash("رَيْحَان"), squash("جَنَّة")]
    rayhan = lemma_names("الريحان بعينه")
    assert find_word(roots, {"rwH"}, 0, 2, lemmas, rayhan) == 2
    # a sense naming neither keeps the nearest the middle
    assert find_word(roots, {"rwH"}, 0, 2, lemmas, lemma_names("الراحة")) == 2
    assert find_word(roots, {"rwH"}, 0, 1, lemmas, lemma_names("الراحة")) == 1


def test_a_word_verdict_points_the_citation_at_another_word() -> None:
    match = VerseMatch(verse=173, start=0, score=1.0, margin=1.0)
    cite = Cite(3, 173, 6, "قال لهم الناس إن الناس", match, "")
    parsed = [Parsed("نوس", {"nws"}, [Sense("s", "محمد", [cite])])]
    assert apply_verdicts(parsed, {"3:173:6:نوس": {"v": "word", "l": "محمد", "to": 4}}) == 1
    assert parsed[0].senses[0].cites[0].position == (3, 173, 4)


def test_bare_references_are_the_surahs_that_quote_nothing() -> None:
    names = {"البقره": 2, "الحج": 22, "الحجرات": 49, "لقمان": 31, "يونس": 10}
    quoted = (
        'قوله تعالى في سورة البقرة " لتكونوا شهداء على الناس " مثلها في سورة الحج يعني الرسل '
        'كقوله في سورة يونس " أكان للناس عجبا "'
    )
    assert [b.suras for b in bare_references(tokens(quoted), names, quoted=True)] == [[22]]
    unquoted = (
        "قوله في سورة الحج يا أيها الناس اتقوا ربكم مثلها في سورة الحجرات ولقمان "
        "مثلها في سورة يونس قوله سبحانه لعلي أرجع"
    )
    assert [b.suras for b in bare_references(tokens(unquoted), names)] == [[49, 31]]


def test_find_parallel_finds_the_verse_that_echoes_the_citation() -> None:
    quran = Corpus(
        words={},
        squashed={
            (22, 78): [squash(w) for w in ["وَتَكُونُوا۟", "شُهَدَآءَ", "عَلَى", "ٱلنَّاسِ"]],
            (22, 1): [squash(w) for w in ["يَٰٓأَيُّهَا", "ٱلنَّاسُ", "ٱتَّقُوا۟"]],
        },
        roots={(22, 78): ["kwn", "$hd", "", "nws"], (22, 1): ["", "nws", "wqy"]},
        verses={22: [1, 78]},
    )
    found = find_parallel("لتكونوا شهداء على الناس", 22, {"nws"}, quran)
    assert found is not None
    assert (found.sura, found.verse, found.parallel) == (22, 78, True)
