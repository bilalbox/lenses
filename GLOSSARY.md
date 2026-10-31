# Lenses Domain Model

Lenses (عدسات) is a Quranic study workbench providing deep morphological, syntactic, rhetorical, and structural views of the Quranic text.

## Language

### Syntax & Morphology (Nahw & Sarf)

**Dependency Graph**:
A directed graph of syntactic relations (iʿrāb) between word tokens in a verse, where each dependent token links to a head token with a grammatical relation label.
_Avoid_: Parse tree, syntax tree

**Constituent**:
A multi-token syntactic phrase or grouping (e.g., جار ومجرور, مركب إضافي, جملة صلة) that functions as a structural unit.
_Avoid_: Phrasal chunk, token span

**Qirāʾāt Variant**:
A canonical textual or vocalic variation at the word level across the ten recognized readings of the Quran.
_Avoid_: Recitation, pronunciation variant

### Verbal Similarities (Al-Mutashābih al-Lafẓī)

**Mutashābih Group**:
A set of verses across different surahs that share a distinctive sequence of words with nuanced lexical or structural variations.
_Avoid_: Duplicate ayahs, identical verses

**Counterpart**:
Another ayah in the same Mutashābih Group as the ayah being read, compared word by word (exact, ḥaraka, diff, extra). A jump to a Counterpart carries the origin as `?target=sura:ayah` so the reader can return.
_Avoid_: Match, similar verse

**Ḍabṭ**:
A mnemonic rule or memorization anchor formulated to prevent confusion between similar verses.
_Avoid_: Memorization tip, memory trick

**Tawjīh**:
The exegetical, rhetorical, or grammatical rationale explaining why a specific phrasing variation occurs in its context.
_Avoid_: Difference rationale, tafsir note

### Structural Coherence (Munāsabāt & Surah Structure)

**Munāsaba**:
The thematic, rhetorical, or logical transition linking an ayah to its predecessor, or linking a surah opening to the conclusion of the preceding surah.
_Avoid_: Connection, cohesion note

**Ring Composition**:
The bilateral concentric symmetry of a surah structured around a central pivot, partitioned into corresponding frame, body, and pivot blocks.
_Avoid_: Mirror structure, chiasmus

**Surah Maqṣad**:
The overarching core purpose or central thesis of a surah as formulated by classical and contemporary exegetes.
_Avoid_: Surah summary, theme

### Historical Context (Asbāb al-Nuzūl)

**Sabab al-Nuzūl**:
A specific documented historical event or inquiry that prompted the revelation of one or more verses, accompanied by its chain takhrīj and authenticity grading.
_Avoid_: Background story, revelation context

### Reading Surface

**Reader Layer**:
One optional lens shown with an ayah (meaning, iʿrāb, nahw, mutashābih, asbāb, balāgha, qirāʾāt), switched on or off in Settings. A layer that is off fetches nothing. Most appear as drawers under the ayah; qirāʾāt appears in the word sheet.
_Avoid_: Panel, section, feature (feature means a whole page such as the Rhetoric Studio or Munāsabāt)

**Data Layer**:
One static JSON dataset the client loads, either for the whole corpus (`manifest`, `verses`, `words`, `rhetoric`, `asbab`, `transitions`) or for each surah (`surah`, `syntax`, `qiraat`, `mutashabih`, `structure`). A Reader Layer reads from one or more Data Layers.
_Avoid_: Endpoint, API, file kind
