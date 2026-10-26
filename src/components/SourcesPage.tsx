import { useMemo } from "react";
import type { Manifest } from "../lib/types";
import { useI18n } from "../lib/i18n/I18nContext";
import { useRhetoric } from "../lib/rhetoric";

export function SourcesPage({ manifest }: { manifest: Manifest }) {
  const { t } = useI18n();
  const { entries: rhetoricEntries } = useRhetoric();

  const partial = manifest.stats.partialChapters[0];
  const partialText = partial
    ? t.sources.partialSnippet(partial.syntax, partial.verses, partial.n)
    : "";

  const surasWithRhetoricCount = useMemo(() => {
    return new Set(rhetoricEntries.map((e) => e.sura)).size || 34;
  }, [rhetoricEntries]);

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

      <section>
        <h2>{t.sources.rhetoricCoverageHeading}</h2>
        <p>
          {t.sources.rhetoricCoverageBody(
            rhetoricEntries.length || 53,
            surasWithRhetoricCount,
          )}
        </p>
      </section>

      <ul className="source-cards">
        {manifest.sources.map((source) => {
          const localized = t.sources.items?.[source.id];
          const title = localized?.title || source.title;
          const attribution = localized?.attribution || source.attribution;
          const description = localized?.description || source.description;
          const license = localized?.license || source.license;
          const kindLabel = (source.kind && t.sources.kinds?.[source.kind]) || source.kind;

          return (
            <li key={source.id}>
              <div className="source-card-header">
                <h3>{title}</h3>
                {kindLabel && <span className="source-kind-pill">{kindLabel}</span>}
              </div>
              <p className="source-attribution">{attribution}</p>
              {description && <p className="source-description">{description}</p>}
              {license && (
                <p className="source-license-line">
                  <strong>{t.sources.licenseLabel}</strong> {license}
                </p>
              )}
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.url.replace(/^https:\/\//, "")} ↗
              </a>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
