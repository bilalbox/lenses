# Quality Check & Review of al-Dāmaghānī's Wujūh

This document describes the quality-control pipeline comparing al-Ḥusayn ibn Muḥammad al-Dāmaghānī's _Iṣlāḥ al-Wujūh wa-l-Naẓāʾir_ (d. 478 AH) with the Tafsīr Center word-level meaning glosses (`m`) and al-Mukhtaṣar verse tafsīr (`ma`).

## Background & Objective

In _Lenses_, word sheets display both:
1. **Meaning gloss (`m`)**: A concise contextual definition from Tafsir Center (`quran.db`).
2. **Senses in the Qur'ān (`wujūh`)**: al-Dāmaghānī's classical categorization of the polysemic senses (_wujūh_) of each root/word across the Qur'ān.

Often the sense label given by al-Dāmaghānī differs from the word gloss:
- **Case 1: Legitimate classical exegesis / authorial viewpoint.** For instance, in 16:125 (`بِٱلْحِكْمَةِ`), al-Dāmaghānī explicitly classifies the sense as `القرآن` ("يعني القرآن ونحوه"), whereas modern tafsīr glosses it as `حسن التصرف والصواب في القول والفعل`. This is not an extraction bug; it is an authentic classical viewpoint documented by al-Dāmaghānī.
- **Case 2: Extraction artifacts.** Issues in the OCR/text parsing such as:
  - Labels incorporating post-citation explanations (`انتهينا إلى الصخرة` instead of `انتهى`).
  - Dangling conjunctions (`شبانا ويقال` instead of `شبانا`).
  - Headword repetition in the label (`الحكمة القرآن` instead of `القرآن`).
  - Citations matched to an adjacent word or ambiguous verse occurrence.

To maintain textual integrity while systematically curing errors, the system operates in two tiers.

---

## Architecture: Two-Tier Quality System

```
                         al-Dāmaghānī text
                                |
                                v
                       build_wujuh.py (Parser)
                                |
                                v
                       audit_wujuh.py (Audit & Linter)
                       /                           \
         [Tier 1: Deterministic Lints]      [Tier 2: Semantic Review]
         - label-headword                    - agree (auto-resolved)
         - label-cut                         - queued -> review queue
         - label-quote                                  |
         - gloss-differs                     Subagents review batches
         - weak-match                                   |
         - word-outside-quote                data/cache/review/wujuh-verdicts/*.json
                                                        |
                                             pnpm audit:wujuh:merge
                                                        |
                                                        v
                                             data/curation/wujuh-verdicts.json
                                             (committed, applied at build time)
```

### Tier 1: Deterministic Linter

`audit_wujuh.py` analyzes every placed citation against the verse and word metadata, assigning deterministic lint flags:
- `label-headword`: The extracted label still starts with the headword.
- `label-cut`: The label exceeds the word cutoff and may be truncated.
- `label-quote`: The label contains words copied from the cited Qur'anic fragment.
- `gloss-differs`: al-Dāmaghānī's local explanation (`يعني ...`) right after the citation contradicts the extracted sense label.
- `weak-match`: Verse fuzzy matching score was `< 0.9` or runner-up score was within `0.05`.
- `word-outside-quote`: The highlighted token falls outside the quoted fragment.

### Tier 2: Semantic Adjudication Queue

Citations with no lint flags whose sense shares content words with the Tafsir Center gloss are marked `agree` automatically. All other citations are queued for reviewer adjudication into `data/cache/review/wujuh-queue/batch-NNN.json`.

---

## Verdict Schema & Semantics

Verdicts are stored in `data/curation/wujuh-verdicts.json` keyed by `"sura:verse:word:headword"`.

| Verdict (`v`) | Meaning                                                                                                 | Effect on Build                                |
| ------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `agree`       | al-Dāmaghānī's sense agrees in substance with the word gloss (`m`), despite using different vocabulary. | No change to data. Marks citation as reviewed. |
| `viewpoint`   | Legitimate alternative classical interpretation/viewpoint specific to al-Dāmaghānī.                     | No change to data. Marks citation as reviewed. |
| `label`       | The extracted sense label is erroneous or noisy; provides a clean, accurate label.                      | Overrides `sense.label` in the built dataset.  |
| `move`        | The citation was misattributed to this sense and belongs under sense number `to` (1-based).             | Moves the citation to `entry.senses[to - 1]`.  |
| `drop`        | The citation is invalid (wrong word, unsupported match, or spurious entry).                             | Removes the citation from the built dataset.   |

### Record Format

```json
{
	"16:125:5:حكم": {
		"v": "viewpoint",
		"l": "القرآن",
		"note": "al-Damaghani explicitly glosses al-Hikmah in 16:125 as al-Quran"
	},
	"18:16:7:اوى": {
		"v": "label",
		"l": "انتهينا إلى الصخرة",
		"label": "انتهى",
		"note": "Opening clause was انتهى; label mistakenly captured post-quote clause"
	}
}
```

- `l` (_required_): The exact label reviewed. If the upstream parser changes the label later, the audit flags this verdict as stale (`previous`), ensuring obsolete verdicts are re-checked.
- `note` (_required_): A concise justification for the determination.
- `label` (_required if `v == "label"`_): The corrected label string.
- `to` (_required if `v == "move"`_): Target sense number (1-indexed).

---

## Review Workflow with Subagents

1. **Generate Queue**:

   ```bash
   pnpm audit:wujuh
   ```

   Batches of grouped entries are generated in `data/cache/review/wujuh-queue/batch-NNN.json`.

2. **Subagent Review**:
   Subagents inspect one or more batches and write their output to `data/cache/review/wujuh-verdicts/batch-NNN.json`.
   Each entry in the queue provides:
   - Full context: Headword, root, sense text, sense label, cited quote, local gloss (`يعني ...`), verse Arabic text, word rasm, lemma, Tafsir Center meaning (`m`), and al-Mukhtaṣar verse tafsir (`ma`).

3. **Merge & Validate**:

   ```bash
   pnpm audit:wujuh:merge
   ```

   Merges verdict files from `data/cache/review/wujuh-verdicts/*.json` into `data/curation/wujuh-verdicts.json`, validating schemas, ensuring no sense label conflicts, and re-running the audit.

4. **Rebuild & Gate**:

   ```bash
   pnpm data:wujuh
   pnpm gate:fast
   ```
