import { useState, useMemo, useEffect } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  useRhetoric,
  type RhetoricDatasetKey,
} from "../lib/rhetoric";

interface Props {
  targetSura?: number;
  targetVerse?: number;
  onOpenVerse: (sura: number, verse: number, word?: number) => void;
}

export function RhetoricScreen({ targetSura, targetVerse, onOpenVerse }: Props) {
  const { locale, t } = useI18n();
  const { entries, loading, error } = useRhetoric();

  // Find if a specific target verse was requested via URL
  const initialEntry = useMemo(() => {
    if (targetSura && targetVerse && entries.length > 0) {
      return entries.find((e) => e.sura === targetSura && e.verse === targetVerse);
    }
    return undefined;
  }, [targetSura, targetVerse, entries]);

  const [activeDataset, setActiveDataset] = useState<RhetoricDatasetKey>("dataset-a-tashbih");
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [surahFilter, setSurahFilter] = useState<number | "all">("all");

  // Dataset counts
  const counts = useMemo(() => {
    const c: Record<RhetoricDatasetKey, number> = {
      "dataset-a-tashbih": 0,
      "dataset-b-hadhf": 0,
      "classical-balagha": 0,
    };
    for (const e of entries) {
      if (c[e.dataset] !== undefined) {
        c[e.dataset]++;
      }
    }
    return c;
  }, [entries]);

  // Sync if targetSura/targetVerse provided or when initialEntry changes
  useEffect(() => {
    if (initialEntry) {
      setActiveDataset(initialEntry.dataset);
      setSelectedEntryId(initialEntry.id);
      setSurahFilter("all");
      setSearchQuery("");
    } else if (entries.length > 0 && !selectedEntryId) {
      const first = entries.find((e) => e.dataset === activeDataset);
      if (first) setSelectedEntryId(first.id);
    }
  }, [initialEntry, entries, activeDataset, selectedEntryId]);

  // Entries for the active dataset tab
  const datasetEntries = useMemo(() => {
    return entries.filter((e) => e.dataset === activeDataset);
  }, [entries, activeDataset]);

  // Unique surahs present in current dataset tab
  const availableSurahs = useMemo(() => {
    const map = new Map<number, { sura: number; nameAr: string; nameEn: string; count: number }>();
    for (const e of datasetEntries) {
      const existing = map.get(e.sura);
      if (existing) {
        existing.count++;
      } else {
        map.set(e.sura, { sura: e.sura, nameAr: e.surahNameAr, nameEn: e.surahNameEn, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sura - b.sura);
  }, [datasetEntries]);

  // Filtered by surah filter and search query
  const filteredEntries = useMemo(() => {
    let list = datasetEntries;
    if (surahFilter !== "all") {
      list = list.filter((e) => e.sura === surahFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) => {
        const matchRef = `${e.sura}:${e.verse}`.includes(q);
        const matchSurah = e.surahNameAr.includes(q) || e.surahNameEn.toLowerCase().includes(q);
        const matchDevice = e.deviceAr.includes(q) || e.deviceEn.toLowerCase().includes(q);
        const matchAr = e.highlightArabic.includes(q);
        const matchSub = e.subtypes.some((s) => s.toLowerCase().includes(q));
        return matchRef || matchSurah || matchDevice || matchAr || matchSub;
      });
    }
    return list;
  }, [datasetEntries, surahFilter, searchQuery]);

  const selectedEntry = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    return filteredEntries.find((e) => e.id === selectedEntryId) ?? filteredEntries[0];
  }, [selectedEntryId, filteredEntries]);

  return (
    <div className="rhetoric-page anim-soft-enter">
      <header className="page-intro">
        <h1>{locale === "ar" ? "مختبر البلاغة والتراكيب" : "Rhetoric Anatomy Studio"}</h1>
        <p className="search-lead">
          {locale === "ar"
            ? "تشريح التراكيب البيانية (التشبيه والحذف وبدائع النظم) في القرآن الكريم وفق المصادر التراثية والأكاديمية الموثقة."
            : "Deconstruct Quranic rhetorical figures through structural anatomy, covering Similes (Dataset A), Ellipses (Dataset B), and Classical Balāghah masterpieces."}
        </p>
      </header>

      {/* Dataset Selector Tabs with Counts */}
      <div className="rhetoric-dataset-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeDataset === "dataset-a-tashbih"}
          className={`rhetoric-ds-tab ${activeDataset === "dataset-a-tashbih" ? "is-active" : ""}`}
          onClick={() => {
            setActiveDataset("dataset-a-tashbih");
            setSurahFilter("all");
            setSearchQuery("");
            const first = entries.find((e) => e.dataset === "dataset-a-tashbih");
            if (first) setSelectedEntryId(first.id);
          }}
        >
          <div className="rhetoric-tab-top-row">
            <span className="rhetoric-tab-tag">Dataset A</span>
            <span className="rhetoric-tab-count-badge">{counts["dataset-a-tashbih"]}</span>
          </div>
          <span className="rhetoric-tab-title">{locale === "ar" ? "التشبيه والتمثيل" : "Tashbīh (Similes)"}</span>
          <span className="rhetoric-tab-cite">Nashir et al. (2026)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeDataset === "dataset-b-hadhf"}
          className={`rhetoric-ds-tab ${activeDataset === "dataset-b-hadhf" ? "is-active" : ""}`}
          onClick={() => {
            setActiveDataset("dataset-b-hadhf");
            setSurahFilter("all");
            setSearchQuery("");
            const first = entries.find((e) => e.dataset === "dataset-b-hadhf");
            if (first) setSelectedEntryId(first.id);
          }}
        >
          <div className="rhetoric-tab-top-row">
            <span className="rhetoric-tab-tag">Dataset B</span>
            <span className="rhetoric-tab-count-badge">{counts["dataset-b-hadhf"]}</span>
          </div>
          <span className="rhetoric-tab-title">{locale === "ar" ? "الحذف وبلاغة الإيجاز" : "Ḥadhf (Ellipses)"}</span>
          <span className="rhetoric-tab-cite">EEF Framework (2025)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeDataset === "classical-balagha"}
          className={`rhetoric-ds-tab ${activeDataset === "classical-balagha" ? "is-active" : ""}`}
          onClick={() => {
            setActiveDataset("classical-balagha");
            setSurahFilter("all");
            setSearchQuery("");
            const first = entries.find((e) => e.dataset === "classical-balagha");
            if (first) setSelectedEntryId(first.id);
          }}
        >
          <div className="rhetoric-tab-top-row">
            <span className="rhetoric-tab-tag">Classical</span>
            <span className="rhetoric-tab-count-badge">{counts["classical-balagha"]}</span>
          </div>
          <span className="rhetoric-tab-title">{locale === "ar" ? "أبواب البلاغة الكبرى" : "Classical Figures"}</span>
          <span className="rhetoric-tab-cite">Maʿānī · Bayān · Badīʿ</span>
        </button>
      </div>

      {loading && (
        <div className="rhetoric-loading-card">
          <p>{locale === "ar" ? "جارٍ تحميل بيانات البلاغة..." : "Loading rhetorical dataset..."}</p>
        </div>
      )}

      {error && (
        <div className="banner error">
          <p>{error}</p>
        </div>
      )}

      {/* Formula & Anatomy Banner */}
      {!loading && selectedEntry && (
        <div className="rhetoric-formula-banner">
          {activeDataset === "dataset-a-tashbih" && (
            <div className="rhetoric-formula-grid">
              <div className="rhetoric-formula-box is-sub">
                <span className="rhetoric-formula-role">المشبه (Subject)</span>
                <span className="rhetoric-formula-val">{selectedEntry.tashbih?.mushabbah ?? "—"}</span>
              </div>
              <span className="rhetoric-formula-plus">+</span>
              <div className="rhetoric-formula-box is-tool">
                <span className="rhetoric-formula-role">الأداة (Tool)</span>
                <span className="rhetoric-formula-val">{selectedEntry.tashbih?.adat ?? "—"}</span>
                <span className="rhetoric-formula-sub">
                  {selectedEntry.tashbih?.adatType === "mursal" ? "مرسل (مذكورة)" : "مؤكد (محذوفة)"}
                </span>
              </div>
              <span className="rhetoric-formula-plus">+</span>
              <div className="rhetoric-formula-box is-veh">
                <span className="rhetoric-formula-role">المشبه به (Vehicle)</span>
                <span className="rhetoric-formula-val">{selectedEntry.tashbih?.mushabbahBihi ?? "—"}</span>
              </div>
              <span className="rhetoric-formula-arrow">➔</span>
              <div className="rhetoric-formula-box is-wajh">
                <span className="rhetoric-formula-role">وجه الشبه (Ground)</span>
                <span className="rhetoric-formula-val">{selectedEntry.tashbih?.wajh ?? "—"}</span>
                <span className="rhetoric-formula-sub">{selectedEntry.tashbih?.classificationAr}</span>
              </div>
            </div>
          )}

          {activeDataset === "dataset-b-hadhf" && (
            <div className="rhetoric-formula-grid">
              <div className="rhetoric-formula-box is-sub">
                <span className="rhetoric-formula-role">الموضع القرآني (Uttered Context)</span>
                <span className="rhetoric-formula-val" dir="rtl" lang="ar">
                  {selectedEntry.hadhf?.omissionMarker}
                </span>
              </div>
              <span className="rhetoric-formula-arrow">➔</span>
              <div className="rhetoric-formula-box is-taqdir">
                <span className="rhetoric-formula-role">التقدير المحذوف (Reconstructed Taqdīr)</span>
                <span className="rhetoric-formula-val" dir="rtl" lang="ar">
                  {selectedEntry.hadhf?.taqdirAr}
                </span>
                <span className="rhetoric-formula-sub">{selectedEntry.hadhf?.taqdirEn}</span>
              </div>
              <span className="rhetoric-formula-arrow">➔</span>
              <div className="rhetoric-formula-box is-purpose">
                <span className="rhetoric-formula-role">الغرض البلاغي (Rhetorical Objective)</span>
                <span className="rhetoric-formula-val">{selectedEntry.hadhf?.purposeAr}</span>
                <span className="rhetoric-formula-sub">{selectedEntry.hadhf?.purposeEn}</span>
              </div>
            </div>
          )}

          {activeDataset === "classical-balagha" && (
            <div className="rhetoric-formula-grid">
              <div className="rhetoric-formula-box is-sub">
                <span className="rhetoric-formula-role">الفرع البلاغي (Branch)</span>
                <span className="rhetoric-formula-val">{selectedEntry.branchAr}</span>
                <span className="rhetoric-formula-sub">{selectedEntry.branchEn}</span>
              </div>
              <span className="rhetoric-formula-arrow">➔</span>
              <div className="rhetoric-formula-box is-veh">
                <span className="rhetoric-formula-role">الفن البلاغي (Figure)</span>
                <span className="rhetoric-formula-val">{selectedEntry.deviceAr}</span>
                <span className="rhetoric-formula-sub">{selectedEntry.deviceEn}</span>
              </div>
              <span className="rhetoric-formula-arrow">➔</span>
              <div className="rhetoric-formula-box is-purpose">
                <span className="rhetoric-formula-role">الفرع والأقسام</span>
                <span className="rhetoric-formula-val">{selectedEntry.subtypes.join(" · ")}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column Layout */}
      {!loading && (
        <div className="rhetoric-layout">
          {/* Left Column: Verse Cards List with Filter Controls */}
          <div className="rhetoric-entry-list-container">
            <div className="rhetoric-filter-bar">
              <div className="rhetoric-filter-controls">
                <select
                  className="rhetoric-surah-select"
                  value={surahFilter}
                  onChange={(e) => {
                    const val = e.target.value === "all" ? "all" : Number(e.target.value);
                    setSurahFilter(val);
                  }}
                  aria-label="Filter by Surah"
                >
                  <option value="all">
                    {locale === "ar" ? "كل السور" : "All Surahs"} ({datasetEntries.length})
                  </option>
                  {availableSurahs.map((s) => (
                    <option key={s.sura} value={s.sura}>
                      {s.sura}. {locale === "ar" ? s.nameAr : s.nameEn} ({s.count})
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  className="rhetoric-search-input"
                  placeholder={locale === "ar" ? "تصفية الآيات والشواهد..." : "Filter verses or devices..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="rhetoric-filter-meta">
                <span className="rhetoric-filter-count">
                  {filteredEntries.length} / {datasetEntries.length} {locale === "ar" ? "شاهد" : "entries"}
                </span>
                {(surahFilter !== "all" || searchQuery) && (
                  <button
                    type="button"
                    className="rhetoric-filter-reset"
                    onClick={() => {
                      setSurahFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    {locale === "ar" ? "إعادة الضبط" : "Reset"}
                  </button>
                )}
              </div>
            </div>

            <div className="rhetoric-entry-list">
              {filteredEntries.length === 0 && (
                <div className="rhetoric-empty-list">
                  <p>{locale === "ar" ? "لا توجد شواهد مطابقة لمعايير البحث." : "No verses match this filter."}</p>
                  <button
                    type="button"
                    className="rhetoric-reset-btn"
                    onClick={() => {
                      setSurahFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    {locale === "ar" ? "إظهار كافة الشواهد" : "Show all entries"}
                  </button>
                </div>
              )}

              {filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`rhetoric-entry-item ${isSelected ? "is-active" : ""}`}
                    onClick={() => setSelectedEntryId(entry.id)}
                  >
                    <div className="rhetoric-item-header">
                      <span className="rhetoric-ref-pill">
                        {entry.sura}:{entry.verse} · {entry.surahNameAr} ({entry.surahNameEn})
                      </span>
                      <span className="rhetoric-device-chip">{entry.deviceAr}</span>
                    </div>
                    <p className="rhetoric-item-ar" dir="rtl" lang="ar">
                      {entry.highlightArabic}
                    </p>
                    <div className="rhetoric-item-academic-badge">
                      {entry.tashbih && (
                        <span className="rhetoric-meta-tag">{entry.tashbih.classificationAr}</span>
                      )}
                      {entry.hadhf && (
                        <span className="rhetoric-meta-tag">{entry.hadhf.slotAr}</span>
                      )}
                      {!entry.tashbih && !entry.hadhf && (
                        <span className="rhetoric-meta-tag">{entry.subtypes.join(" · ")}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Dissection Stage */}
          {selectedEntry ? (
            <div className="rhetoric-dissection-stage">
              <div className="rhetoric-stage-card">
                <div className="rhetoric-stage-header">
                  <div>
                    <span className="rhetoric-pill">{selectedEntry.datasetBadge}</span>
                    <h2>
                      <span dir="rtl" lang="ar">{selectedEntry.surahNameAr}</span> {selectedEntry.sura}:{selectedEntry.verse}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="rhetoric-reader-jump-btn"
                    onClick={() => onOpenVerse(selectedEntry.sura, selectedEntry.verse)}
                  >
                    {t.common.open} {selectedEntry.sura}:{selectedEntry.verse} ↗
                  </button>
                </div>

                <p className="rhetoric-stage-ayah" dir="rtl" lang="ar">
                  {selectedEntry.arabicAyah}
                </p>

                {/* When Arabic UI, hide all translations from the rhetoric view. When Indonesian, surface Sabiq. */}
                {locale === "en" && (
                  <>
                    <p className="rhetoric-stage-en">{selectedEntry.englishAyah}</p>
                    <p className="rhetoric-snippet-source">
                      Saheeh International ·{" "}
                      <a href="https://quranenc.com/en/browse/english_saheeh" target="_blank" rel="noreferrer">
                        quranenc.com
                      </a>
                    </p>
                  </>
                )}

                {locale === "id" && (
                  <>
                    <p className="rhetoric-stage-en">{selectedEntry.indonesianAyah}</p>
                    <p className="rhetoric-snippet-source">
                      Terjemahan Sabiq (PT. Sabiq) ·{" "}
                      <a href="https://quranenc.com/en/browse/indonesian_sabiq" target="_blank" rel="noreferrer">
                        quranenc.com
                      </a>
                    </p>
                  </>
                )}

                <div className="rhetoric-stage-subtypes">
                  {selectedEntry.subtypes.map((st) => (
                    <span key={st} className="rhetoric-tag-pill">
                      {st}
                    </span>
                  ))}
                </div>

                {/* Sourced Dataset Attributes */}
                {selectedEntry.tashbih && (
                  <div className="rhetoric-stage-dataset-attrs">
                    <h3>التوصيف البلاغي للتشبيه (Dataset A Attributes)</h3>
                    <div className="rhetoric-attrs-grid">
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">نوع التشبيه التركيبي</span>
                        <strong className="rhetoric-attr-val">
                          {selectedEntry.tashbih.tamthili ? "تمثيلي (مركب من هيئة وصورة)" : "مفرد (بسيط)"}
                        </strong>
                      </div>
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">حالة الأداة (Adat)</span>
                        <strong className="rhetoric-attr-val">
                          {selectedEntry.tashbih.adatType === "mursal" ? "مرسل (مذكورة الأداة)" : "مؤكد (محذوفة الأداة)"}
                        </strong>
                      </div>
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">حالة وجه الشبه (Wajh)</span>
                        <strong className="rhetoric-attr-val">
                          {selectedEntry.tashbih.wajhType === "mufassal" ? "مفصل (مذكور)" : "مجمل (محذوف / ملحوظ)"}
                        </strong>
                      </div>
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">التصنيف الأكاديمي الشامل</span>
                        <strong className="rhetoric-attr-val">{selectedEntry.tashbih.classificationAr}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEntry.hadhf && (
                  <div className="rhetoric-stage-dataset-attrs">
                    <h3>أركان الحذف والإيجاز (Dataset B Attributes)</h3>
                    <div className="rhetoric-attrs-grid rhetoric-hadhf-grid">
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">تصنيف العنصر المحذوف</span>
                        <strong className="rhetoric-attr-val">{selectedEntry.hadhf.categoryAr}</strong>
                      </div>
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">الموقع الإعرابي الدقيق</span>
                        <strong className="rhetoric-attr-val">{selectedEntry.hadhf.slotAr}</strong>
                        <span className="rhetoric-attr-sub">{selectedEntry.hadhf.slotEn}</span>
                      </div>
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">الموضع القرآني المقتطع</span>
                        <strong className="rhetoric-attr-val" dir="rtl" lang="ar">
                          {selectedEntry.hadhf.omissionMarker}
                        </strong>
                      </div>
                      <div className="rhetoric-attr-card">
                        <span className="rhetoric-attr-label">التقدير النحوي المسند</span>
                        <strong className="rhetoric-attr-val" dir="rtl" lang="ar">
                          {selectedEntry.hadhf.taqdirAr}
                        </strong>
                        <span className="rhetoric-attr-sub">{selectedEntry.hadhf.taqdirEn}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scholarly Commentary */}
                {selectedEntry.scholarlyNote && (
                  <div className="rhetoric-scholarly-card">
                    <div className="rhetoric-scholarly-header">
                      <span className="rhetoric-scholarly-badge">الشاهد البياني والتفسيري</span>
                      <small className="rhetoric-scholarly-source">{selectedEntry.scholarlyNote.source}</small>
                    </div>
                    <p className="rhetoric-scholarly-text" dir="rtl" lang="ar">
                      {selectedEntry.scholarlyNote.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rhetoric-dissection-stage">
              <div className="rhetoric-stage-card rhetoric-empty-stage">
                <p>{locale === "ar" ? "يرجى تحديد شاهد من القائمة لعرض التحليل البلاغي المفصل." : "Please select an entry from the list to view its structural breakdown."}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
