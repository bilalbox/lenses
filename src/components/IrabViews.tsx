import type { ReactNode } from "react";
import { formatIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import { Tabs } from "./Tabs";

interface Props {
	/** Tafsir Center verse iʿrāb, when the verse has it. */
	classical?: string;
	/** NoorBayan diagram panel, when the syntax layer is on. */
	diagram: ReactNode;
}

/**
 * The verse's iʿrāb as a diagram or as classical prose, one at a time; the
 * reader's choice is remembered. With only one of them, it shows alone.
 */
export function IrabViews({ classical, diagram }: Props) {
	const { t } = useI18n();
	const prose = classical ? <ClassicalIrab text={classical} /> : null;
	if (!diagram || !prose) return <>{diagram ?? prose}</>;
	return (
		<Tabs
			storageKey="lenses-irab-view"
			label={t.verse.irabViewsAria}
			items={[
				{ key: "diagram", label: t.verse.irabDiagram, content: diagram },
				{ key: "classical", label: t.verse.irabClassical, content: prose },
			]}
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
