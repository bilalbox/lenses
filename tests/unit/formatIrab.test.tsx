import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
	buildWordIndex,
	formatIrabText,
	formatWordIrabText,
	matchTargetWord,
} from "../../src/lib/formatIrab";
import type { Word } from "../../src/lib/types";

const sampleWords: Word[] = [
	{
		n: 1,
		a: "بِسْمِ",
		s: [
			{ a: "بِ", p: "P" },
			{ a: "سْمِ", p: "N", la: "ٱسْم" },
		],
	},
	{
		n: 2,
		a: "ٱللَّهِ",
		s: [{ a: "ٱللَّهِ", p: "PN", la: "ٱللَّه" }],
	},
	{
		n: 3,
		a: "ٱلرَّحْمَٰنِ",
		s: [{ a: "ٱلرَّحْمَٰنِ", p: "ADJ" }],
	},
	{
		n: 4,
		a: "ٱلرَّحِيمِ",
		s: [{ a: "ٱلرَّحِيمِ", p: "ADJ" }],
	},
];

const sampleIrabText = `{بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ (1)}
بِسْمِ: الباء حرف جرّ مبنيّ على الكسر.
اسم: اسم مجرور وعلامة جرّه الكسرة.
اللهِ: لفظ الجلالة مضاف إليه مخفوض بالكسرة.
الرَّحْمَنِ: نعت للفظ الجلالة أو بدل منه مخفوض بالكسرة.
الرَّحِيمِ: نعت ثانٍ للفظ الجلالة أو بدل منه مخفوض بالكسرة.
وجملة "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ" ابتدائية لا محلّ لها من الإعراب.`;

describe("formatIrabText without interactive options", () => {
	it("renders target words as strong tags and preserves text", () => {
		const html = renderToString(formatIrabText(sampleIrabText));
		expect(html).toContain('<strong class="irab-target-word">بِسْمِ</strong>');
		expect(html).toContain('<strong class="irab-target-word">اسم</strong>');
		expect(html).toContain('<strong class="irab-target-word">اللهِ</strong>');
		expect(html).toContain('<strong class="irab-target-word">الرَّحْمَنِ</strong>');
		expect(html).toContain('<strong class="irab-target-word">الرَّحِيمِ</strong>');
		expect(html).not.toContain("<button");
	});
});

describe("formatIrabText with interactive options", () => {
	it("renders quote line words as clickable buttons with irab-quote-word", () => {
		const onSelectWord = vi.fn();
		const html = renderToString(
			formatIrabText(sampleIrabText, {
				words: sampleWords,
				selectedWord: 2,
				onSelectWord,
			}),
		);

		expect(html).toContain('class="irab-quote-word"');
		expect(html).toContain('class="irab-quote-word is-on" aria-pressed="true"');
		expect(html).toContain("بِسْمِ");
		expect(html).toContain("(1)");
	});

	it("renders breakdown target words as clickable buttons with irab-target-word", () => {
		const onSelectWord = vi.fn();
		const html = renderToString(
			formatIrabText(sampleIrabText, {
				words: sampleWords,
				selectedWord: 3,
				onSelectWord,
			}),
		);

		// Word 3 (الرَّحْمَنِ) should be marked as active/selected
		expect(html).toContain(
			'<button type="button" class="irab-target-word is-on" aria-pressed="true">الرَّحْمَنِ</button>',
		);
		// Word 4 (الرَّحِيمِ) should be a clickable button, not selected
		expect(html).toContain(
			'<button type="button" class="irab-target-word" aria-pressed="false">الرَّحِيمِ</button>',
		);
		// Non-target explanation line remains plain text
		expect(html).toContain("ابتدائية لا محلّ لها");
	});

	it("handles Uthmani dagger alif variants like مَٰلِكِ vs مَالِكِ", () => {
		const verseWords: Word[] = [
			{ n: 1, a: "مَٰلِكِ", s: [] },
			{ n: 2, a: "يَوْمِ", s: [] },
			{ n: 3, a: "ٱلدِّينِ", s: [] },
		];
		const irab = "مَالِكِ: صفة للفظ الجلالة.\nيَوْمِ: مضاف إليه.\nالدِّينِ: مضاف إليه.";
		const onSelectWord = vi.fn();
		const html = renderToString(
			formatIrabText(irab, {
				words: verseWords,
				selectedWord: 1,
				onSelectWord,
			}),
		);

		expect(html).toContain(
			'<button type="button" class="irab-target-word is-on" aria-pressed="true">مَالِكِ</button>',
		);
	});

	it("matches repeated words sequentially", () => {
		const verseWords: Word[] = [
			{ n: 1, a: "صِرَٰطَ", s: [] },
			{ n: 2, a: "ٱلَّذِينَ", s: [] },
			{ n: 3, a: "أَنْعَمْتَ", s: [] },
			{ n: 4, a: "عَلَيْهِمْ", s: [] },
			{ n: 5, a: "غَيْرِ", s: [] },
			{ n: 6, a: "ٱلْمَغْضُوبِ", s: [] },
			{ n: 7, a: "عَلَيْهِمْ", s: [] },
			{ n: 8, a: "وَلَا", s: [] },
			{ n: 9, a: "ٱلضَّآلِّينَ", s: [] },
		];
		const irab = `عَلَيْهِمْ: الجار والمجرور متعلقان بأنعمت.
غَيْرِ: نعت.
الْمَغْضُوبِ: مضاف إليه.
عَلَيْهِمْ: شبه الجملة في محل رفع نائب فاعل.`;

		const onSelectWord = vi.fn();
		const node = formatIrabText(irab, {
			words: verseWords,
			selectedWord: 7,
			onSelectWord,
		});
		const html = renderToString(node);

		// First عَلَيْهِمْ should match word 4 (aria-pressed=false since selectedWord=7)
		// Second عَلَيْهِمْ should match word 7 (aria-pressed=true, is-on)
		expect(html).toContain(
			'<button type="button" class="irab-target-word" aria-pressed="false">عَلَيْهِمْ</button>',
		);
		expect(html).toContain(
			'<button type="button" class="irab-target-word is-on" aria-pressed="true">عَلَيْهِمْ</button>',
		);
	});

	it("invokes onSelectWord when clicking a target word button", () => {
		const onSelectWord = vi.fn();
		const result = formatIrabText(sampleIrabText, {
			words: sampleWords,
			selectedWord: undefined,
			onSelectWord,
		}) as unknown[];

		let foundButton: { props: { onClick: (e: unknown) => void } } | null = null;
		const searchElements = (node: unknown) => {
			if (!node || typeof node !== "object") return;
			const el = node as {
				type?: unknown;
				props?: {
					children?: unknown;
					onClick?: (e: unknown) => void;
				};
			};
			if (
				el.type === "button" &&
				el.props?.children === "اللهِ" &&
				el.props.onClick
			) {
				foundButton = el as { props: { onClick: (e: unknown) => void } };
				return;
			}
			if (el.props?.children) {
				if (Array.isArray(el.props.children)) {
					for (const child of el.props.children) searchElements(child);
				} else {
					searchElements(el.props.children);
				}
			}
		};

		for (const item of result) searchElements(item);
		expect(foundButton).not.toBeNull();

		const scrollMock = vi.fn();
		foundButton?.props.onClick({
			currentTarget: { scrollIntoView: scrollMock },
		});
		expect(onSelectWord).toHaveBeenCalledWith(2);
	});
});

describe("buildWordIndex and matchTargetWord", () => {
	it("finds words by exact text, segment lemma, and phrase containment", () => {
		const entries = buildWordIndex(sampleWords);
		expect(entries).toHaveLength(4);

		const matchBism = matchTargetWord("بِسْمِ", entries, 0);
		expect(matchBism?.word.n).toBe(1);

		const matchIsm = matchTargetWord("اسم", entries, 0);
		expect(matchIsm?.word.n).toBe(1);

		const matchAllah = matchTargetWord("اللهِ", entries, 0);
		expect(matchAllah?.word.n).toBe(2);

		const matchRahman = matchTargetWord("الرَّحْمَنِ", entries, 1);
		expect(matchRahman?.word.n).toBe(3);

		const matchRahim = matchTargetWord("الرَّحِيمِ", entries, 2);
		expect(matchRahim?.word.n).toBe(4);
	});
});

describe("formatWordIrabText", () => {
	it("formats bracketed morphology and segment tokens", () => {
		const text = "(الْبَاءُ) حَرْفُ جَرٍّ... وَ﴿اسْمِ﴾ اسْمٌ مَجْرُورٌ";
		const html = renderToString(formatWordIrabText(text));
		expect(html).toContain('<strong class="irab-target-word">الْبَاءُ</strong>');
		expect(html).toContain('<strong class="irab-target-word">اسْمِ</strong>');
	});
});
