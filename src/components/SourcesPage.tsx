import type { Manifest } from "../lib/types";
import { useI18n } from "../lib/i18n/I18nContext";

export function SourcesPage({ manifest }: { manifest: Manifest }) {
  const { t, formatNumber } = useI18n();
  const partial = manifest.stats.partialChapters[0];
  const partialText = partial
    ? `, including ${formatNumber(partial.syntax)} of ${formatNumber(partial.verses)} verses in surah ${formatNumber(partial.n)}`
    : "";
  return (
    <article className="sources-page anim-soft-enter">
      <header className="page-intro">
        <p className="eyebrow">{t.sources.eyebrow}</p>
        <h1>{t.sources.pageTitle}</h1>
        <p>{t.sources.intro}</p>
      </header>
      <section>
        <h2>{t.sources.coverageHeading}</h2>
        <p>
          {t.sources.coverageBody(
            manifest.stats.words,
            manifest.stats.syntaxVerses,
            partialText,
            manifest.stats.chaptersWithoutSyntax[0],
            manifest.stats.chaptersWithoutSyntax[manifest.stats.chaptersWithoutSyntax.length - 1],
          )}
        </p>
      </section>

      <ul className="source-cards">
        {manifest.sources.map((source) => (
          <li key={source.id}>
            <h3>{source.title}</h3>
            <p>{source.attribution}</p>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.url.replace(/^https:\/\//, "")}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
