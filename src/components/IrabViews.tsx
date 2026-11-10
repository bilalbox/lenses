import type { ReactNode } from "react";
import { formatIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import { getAppendixVerse } from "../lib/irabDictionary";
import { useLayer } from "../lib/layers";
import type { IrabAppendixVerse } from "../lib/types";
import { Tabs } from "./Tabs";

interface Props {
	/** Tafsir Center verse iʿrāb, when the verse has it. */
	classical?: string;
	/** NoorBayan diagram panel, when the syntax layer is on. */
	diagram: ReactNode;
	sura?: number;
	verseNumber?: number;
	khatibEnabled?: boolean;
}

/**
 * The verse's iʿrāb as a diagram, as classical Tafsir Center prose,
 * or as Dr. Émile Badīʿ Yaʿqūb's model parsing (al-Mu'jam al-Mufassal appendix);
 * the reader's choice is remembered.
 */
export function IrabViews({
	classical,
	diagram,
	sura,
	verseNumber,
	khatibEnabled = false,
}: Props) {
	const { t } = useI18n();
	const { data: irabDict } = useLayer("irabDictionary", {
		enabled: khatibEnabled,
	});

	const appendix =
		sura !== undefined && verseNumber !== undefined
			? getAppendixVerse(irabDict, sura, verseNumber)
			: undefined;

	const prose = classical ? <ClassicalIrab text={classical} /> : null;
	const model = appendix ? <ModelIrab appendix={appendix} /> : null;

	const items: { key: string; label: string; content: ReactNode }[] = [];
	if (diagram) {
		items.push({
			key: "diagram",
			label: t.verse.irabDiagram,
			content: diagram,
		});
	}
	if (prose) {
		items.push({
			key: "classical",
			label: t.verse.irabClassical,
			content: prose,
		});
	}
	if (model) {
		items.push({ key: "model", label: t.verse.irabModel, content: model });
	}

	if (items.length === 1 && items[0]) return <>{items[0].content}</>;
	if (items.length === 0) return null;

	return (
		<Tabs
			storageKey="lenses-irab-view"
			label={t.verse.irabViewsAria}
			items={items}
		/>
	);
}

function ClassicalIrab({ text }: { text: string }) {
	const { t } = useI18n();
	return (
		<>
			<p className="source-line">
				{t.common.tafsirCenterSource} ·{" "}
				<a href="https://tafsir.net/" target="_blank" rel="noreferrer">
					tafsir.net
				</a>
			</p>
			<div className="prose irab-prose" dir="rtl" lang="ar">
				{formatIrabText(text)}
			</div>
		</>
	);
}

function ModelIrab({ appendix }: { appendix: IrabAppendixVerse }) {
	const { t } = useI18n();
	return (
		<>
			<p className="source-line">{t.verse.irabModelSource}</p>
			<div className="prose irab-prose model-irab-prose" dir="rtl" lang="ar">
				{appendix.words.map((item, idx) => (
					<p key={idx}>
						<strong className="irab-target-word">{item.w}</strong>: {item.i}
					</p>
				))}
				{appendix.sentences.map((sent, sIdx) => (
					<p key={`s-${sIdx}`} className="model-irab-sentence">
						{sent}
					</p>
				))}
				{appendix.notes.length > 0 ? (
					<div className="model-irab-notes">
						{appendix.notes.map((note, nIdx) => (
							<small key={`n-${nIdx}`} className="model-irab-note">
								{note}
							</small>
						))}
					</div>
				) : null}
			</div>
		</>
	);
}
