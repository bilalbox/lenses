import type { Manifest } from "../lib/types";
import { useI18n } from "../lib/i18n/I18nContext";
import { useRhetoric } from "../lib/rhetoric";

interface Props {
  manifest: Manifest;
  onOpen: (sura: number) => void;
}

export function SurahIndex({ manifest, onOpen }: Props) {
  const { t, formatNumber } = useI18n();
  const { entries: rhetoricEntries } = useRhetoric();
  return (
    <div className="surah-page anim-soft-enter">
      <header className="page-intro">
        <h1>{t.surahs.pageTitle}</h1>
        <p className="page-intro-count">{t.surahs.countEyebrow(manifest.units.length)}</p>
      </header>
      <ol className="surah-grid">
        {manifest.units.map((unit) => {
          const full = unit.syntax === unit.verses;
          const none = unit.syntax === 0;
          const rhetoricMatches = rhetoricEntries.filter((e) => e.sura === unit.n);
          return (
            <li key={unit.n} className="surah-item">
              <button
                type="button"
                className="surah-card-btn"
                onClick={() => onOpen(unit.n)}
                aria-label={`${unit.name} (${unit.phonetic})`}
              >
                <span className="num">{formatNumber(unit.n)}</span>
                <span className="names">
                  <b lang="ar">{unit.name}</b>
                  <small>
                    {unit.phonetic} · {unit.rev === "Madinah" ? t.verse.madinan : t.verse.meccan}
                  </small>
                </span>
                <span className={`coverage ${full ? "full" : none ? "none" : "partial"}`}>
                  {full
                    ? t.surahs.coverageTreebank
                    : none
                      ? t.surahs.coverageMorphology
                      : t.surahs.coverageTrees(unit.syntax, unit.verses)}
                </span>
              </button>
              {rhetoricMatches.length > 0 && (
                <div className="surah-badges">
                  <a
                    href={`#/rhetoric/${unit.n}/${rhetoricMatches[0].verse}`}
                    className="surah-balagha-chip"
                    title={`${rhetoricMatches.length} rhetorical analyses in Balāghah Studio`}
                  >
                    بلاغة · {rhetoricMatches.length} ↗
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
