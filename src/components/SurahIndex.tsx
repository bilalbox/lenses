import type { Manifest } from "../lib/types";

interface Props {
  manifest: Manifest;
  onOpen: (sura: number) => void;
}

export function SurahIndex({ manifest, onOpen }: Props) {
  return (
    <div className="surah-page">
      <header className="page-intro">
        <p className="eyebrow">114 surahs</p>
        <h1>Browse the Quran</h1>
        <p>
          {manifest.stats.syntaxVerses.toLocaleString()} of {manifest.stats.verses.toLocaleString()} verses have a dependency tree.
          Chapters 10–58 have morphology and classical iʿrāb, and no corpus syntax yet.
        </p>
      </header>
      <ol className="surah-grid">
        {manifest.units.map((unit) => {
          const full = unit.syntax === unit.verses;
          const none = unit.syntax === 0;
          return (
            <li key={unit.n}>
              <button type="button" onClick={() => onOpen(unit.n)}>
                <span className="num">{unit.n}</span>
                <span className="names">
                  <b lang="ar">{unit.name}</b>
                  <small>
                    {unit.phonetic} · {unit.title}
                  </small>
                </span>
                <span className={`coverage ${full ? "full" : none ? "none" : "partial"}`}>
                  {full ? "Treebank" : none ? "Morphology" : `${unit.syntax}/${unit.verses} trees`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
