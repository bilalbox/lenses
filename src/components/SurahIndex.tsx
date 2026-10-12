import type { Manifest } from "../lib/types";
import { useI18n } from "../lib/i18n/I18nContext";

interface Props {
  manifest: Manifest;
  onOpen: (sura: number) => void;
}

export function SurahIndex({ manifest, onOpen }: Props) {
  const { t, formatNumber } = useI18n();
  return (
    <div className="surah-page">
      <header className="page-intro">
        <p className="eyebrow">{t.surahs.countEyebrow(manifest.units.length)}</p>
        <h1>{t.surahs.pageTitle}</h1>
      </header>
      <ol className="surah-grid">
        {manifest.units.map((unit) => {
          const full = unit.syntax === unit.verses;
          const none = unit.syntax === 0;
          return (
            <li key={unit.n}>
              <button type="button" onClick={() => onOpen(unit.n)}>
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
