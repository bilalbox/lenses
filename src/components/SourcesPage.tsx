import type { Manifest } from "../lib/types";

export function SourcesPage({ manifest }: { manifest: Manifest }) {
  const partial = manifest.stats.partialChapters[0];
  return (
    <article className="sources-page">
      <header className="page-intro">
        <p className="eyebrow">Data and licenses</p>
        <h1>What this edition is built from</h1>
        <p>
          Lenses is a reader for analyses other people published. The Arabic Quranic text is stored verbatim. Grammatical layers stay attributed to their sources, and a verse can show more than one of them at once.
        </p>
      </header>
      <section>
        <h2>Coverage</h2>
        <p>
          Morphology covers all {manifest.stats.words.toLocaleString()} words. The dependency treebank covers {manifest.stats.syntaxVerses.toLocaleString()} verses
          {partial ? `, including ${partial.syntax} of ${partial.verses} verses in surah ${partial.n}` : ""}. Chapters {manifest.stats.chaptersWithoutSyntax[0]}–
          {manifest.stats.chaptersWithoutSyntax[manifest.stats.chaptersWithoutSyntax.length - 1]} have no corpus syntax in this export. Classical iʿrāb and ṣarf from the Tafsir Center are included for every word.
        </p>
      </section>
      <section>
        <h2>tafsir.app</h2>
        <p>
          tafsir.app, الباحث القرآني, aggregates many tafsirs and iʿrāb books, including al-Jadwal, al-Daʿās, al-Naḥḥās, and al-Durr al-Maṣūn. No public data repository or open license for that site was found, so this app does not copy it. The extra grammatical source in v1 is the Tafsir Center linguistic database, which is explicitly CC BY 4.0 and includes word-level iʿrāb, ṣarf, and a verse-level iʿrāb. Full tafsir books inside that database are not redistributed.
        </p>
      </section>
      <ul className="source-cards">
        {manifest.sources.map((source) => (
          <li key={source.id}>
            <h3>{source.title}</h3>
            <p>{source.attribution}</p>
            <p>{source.license}</p>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.url.replace(/^https:\/\//, "")}
            </a>
          </li>
        ))}
      </ul>
      <p className="hint">
        The full notices travel with the data in <code>public/data/NOTICES.txt</code>. Application code is MIT. The morphology-derived JSON is a derivative of a GPL file whose own notice also allows use in an application when the Quranic Arabic Corpus is credited.
      </p>
    </article>
  );
}
