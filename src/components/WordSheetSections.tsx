import { formatIrabText, formatWordIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import type { Word } from "../lib/types";

/** The Quranic Arabic Corpus English gloss; shown only in the English UI. */
export function WordGloss({ word }: { word: Word }) {
	const { locale, t } = useI18n();
	if (locale !== "en" || !word.e) return null;
	return (
		<p className="sheet-gloss">
			<span lang="en">{word.e}</span>
			<small className="source-line">{t.sheet.wordGlossSource}</small>
		</p>
	);
}

export function WordMeaning({ word }: { word: Word }) {
	const { t } = useI18n();
	if (!word.m) return null;
	return (
		<section>
			<h3 className="sheet-section-label">{t.sheet.wordMeaning}</h3>
			<p className="prose sheet-metric-prose" dir="rtl" lang="ar">
				{word.m}
			</p>
		</section>
	);
}

function TafsirCenterLine() {
	const { t } = useI18n();
	return (
		<p className="source-line">
			{t.common.tafsirCenterSource} ·{" "}
			<a href="https://tafsir.net/" target="_blank" rel="noreferrer">
				tafsir.net
			</a>
		</p>
	);
}

export function WordIrab({ word }: { word: Word }) {
	const { t } = useI18n();
	if (!word.i) return null;
	return (
		<section>
			<h3 className="sheet-section-label">{t.sheet.classicalIrab}</h3>
			<TafsirCenterLine />
			<p className="prose irab-prose sheet-metric-prose" dir="rtl" lang="ar">
				{formatWordIrabText(word.i)}
			</p>
		</section>
	);
}

export function WordSarf({ word }: { word: Word }) {
	const { t } = useI18n();
	if (!word.sf) return null;
	return (
		<section>
			<h3 className="sheet-section-label">{t.sheet.sarf}</h3>
			<TafsirCenterLine />
			<p className="prose irab-prose sheet-metric-prose" dir="rtl" lang="ar">
				{formatIrabText(word.sf)}
			</p>
		</section>
	);
}
