const BUCK: Record<string, string> = {
	"'": "\u0621",
	">": "\u0623",
	"&": "\u0624",
	"<": "\u0625",
	"}": "\u0626",
	A: "\u0627",
	b: "\u0628",
	p: "\u0629",
	t: "\u062a",
	v: "\u062b",
	j: "\u062c",
	H: "\u062d",
	x: "\u062e",
	d: "\u062f",
	"*": "\u0630",
	r: "\u0631",
	z: "\u0632",
	s: "\u0633",
	$: "\u0634",
	S: "\u0635",
	D: "\u0636",
	T: "\u0637",
	Z: "\u0638",
	E: "\u0639",
	g: "\u063a",
	_: "\u0640",
	f: "\u0641",
	q: "\u0642",
	k: "\u0643",
	l: "\u0644",
	m: "\u0645",
	n: "\u0646",
	h: "\u0647",
	w: "\u0648",
	Y: "\u0649",
	y: "\u064a",
	F: "\u064b",
	N: "\u064c",
	K: "\u064d",
	a: "\u064e",
	u: "\u064f",
	i: "\u0650",
	"~": "\u0651",
	o: "\u0652",
	"^": "\u0653",
	"#": "\u0654",
	"`": "\u0670",
	"{": "\u0671",
	":": "\u06dc",
	"@": "\u06df",
	'"': "\u06e0",
	"[": "\u06e2",
	";": "\u06e3",
	",": "\u06e5",
	".": "\u06e6",
	"!": "\u06e8",
	"-": "\u06ea",
	"+": "\u06eb",
	"%": "\u06ec",
	"]": "\u06ed",
	"|": "\u0622",
};

const REVERSE: Record<string, string> = {};
for (const [latin, arabic] of Object.entries(BUCK)) {
	if (arabic && REVERSE[arabic] === undefined) REVERSE[arabic] = latin;
}

const DIACRITICS = /[\u064b-\u0652\u0670\u0653-\u065f\u06d6-\u06ed\u0640]/g;

export function stripDiacritics(text: string): string {
	return text
		.replace(DIACRITICS, "")
		.replace(/[أإآٱ]/g, "ا")
		.replace(/ى/g, "ي")
		.replace(/ة/g, "ه");
}

const TASHKEEL = /[\u064b-\u0652\u0670\u0653-\u065f\u06d6-\u06ed]/g;

/** Removes only vowel marks (harakat / Quranic marks), keeping letter forms unchanged. */
export function stripTashkeel(text: string): string {
	return text.replace(TASHKEEL, "");
}

export function hasArabic(text: string): boolean {
	return /[\u0600-\u06ff]/.test(text);
}

export function fromBuckwalter(text: string): string {
	return [...text].map((ch) => BUCK[ch] ?? ch).join("");
}

export function toBuckwalter(text: string): string {
	return [...stripDiacritics(text)].map((ch) => REVERSE[ch] ?? ch).join("");
}

export function spaceLetters(text: string): string {
	const bare = stripDiacritics(text).replace(/\s/g, "");
	return [...bare].join(" ");
}

export function normalizeQuery(text: string): string {
	return stripDiacritics(text).replace(/\s+/g, " ").trim().toLowerCase();
}
