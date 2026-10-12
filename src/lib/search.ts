import { hasArabic, normalizeQuery, stripDiacritics, toBuckwalter } from "./arabic";
import { featureLines } from "./glossary";
import type { Features, Lexeme, VerseRow, WordIndex, WordRow } from "./types";

export interface VerseHit {
  sura: number;
  verse: number;
  arabic: string;
  english: string;
}

export interface VerseSearch {
  hits: VerseHit[];
  total: number;
}

export interface ExampleQuery {
  root: string;
  lemma: string;
  pos: string;
  form: string;
  relation: string;
}

export interface ExampleHit {
  sura: number;
  verse: number;
  word: number;
  arabic: string;
  pos: string;
  features: string;
  relations: string[];
  root: string;
  rootArabic: string;
  lemma: string;
  lemmaArabic: string;
  gloss: string;
}

export function searchVerses(rows: VerseRow[], query: string, limit = 24): VerseSearch {
  const raw = query.trim();
  if (!raw) return { hits: [], total: 0 };
  const jump = raw.match(/^(\d{1,3})\s*[:\u061b]\s*(\d{1,3})$/);
  const hits: VerseHit[] = [];
  const seen = new Set<string>();
  const push = (sura: number, verse: number, arabic: string, english: string) => {
    const key = `${sura}:${verse}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (hits.length < limit) hits.push({ sura, verse, arabic, english });
  };
  if (jump) {
    const sura = Number(jump[1]);
    const verse = Number(jump[2]);
    const exact = rows.find((row) => row[0] === sura && row[1] === verse);
    if (exact) push(sura, verse, exact[2], exact[3]);
  }
  const needle = normalizeQuery(raw);
  const arabicNeedle = stripDiacritics(raw);
  let total = seen.size;
  if (needle.length < 2 && !jump) return { hits, total };
  for (const [sura, verse, arabic, english] of rows) {
    const englishHit = english.toLowerCase().includes(needle);
    const arabicHit = arabicNeedle.length >= 2 && arabic.includes(arabicNeedle);
    if (!englishHit && !arabicHit) continue;
    total += seen.has(`${sura}:${verse}`) ? 0 : 1;
    push(sura, verse, arabic, english);
  }
  return { hits, total };
}

function sameLexeme(query: string, entry: Lexeme | undefined): boolean {
  if (!query.trim()) return true;
  if (!entry || !entry.b) return false;
  const q = query.trim();
  if (q.toLowerCase() === entry.b.toLowerCase()) return true;
  const arabic = hasArabic(q) ? stripDiacritics(q) : stripDiacritics(q);
  if (arabic && stripDiacritics(entry.a) === arabic) return true;
  const encoded = hasArabic(q) ? toBuckwalter(q) : q;
  return encoded.toLowerCase() === entry.b.toLowerCase();
}

function parseFeatures(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!text) return out;
  for (const part of text.split(" ")) {
    const [key, value] = part.split("=");
    if (key && value) out[key] = value;
  }
  return out;
}

export function searchExamples(index: WordIndex, query: ExampleQuery, limit = 80): ExampleHit[] {
  const hits: ExampleHit[] = [];
  for (const row of index.rows) {
    if (!rowMatches(index, row, query)) continue;
    const [sura, verse, word, arabic, rootIndex, lemmaIndex, pos, , features, rels] = row;
    const root = index.roots[rootIndex];
    const lemma = index.lemmas[lemmaIndex];
    hits.push({
      sura,
      verse,
      word,
      arabic,
      pos,
      features,
      relations: rels ? rels.split(",") : [],
      root: root?.b ?? "",
      rootArabic: root?.a ?? "",
      lemma: lemma?.b ?? "",
      lemmaArabic: lemma?.a ?? "",
      gloss: lemma?.g ?? "",
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

export function countExamples(index: WordIndex, query: ExampleQuery): number {
  let count = 0;
  for (const row of index.rows) {
    if (rowMatches(index, row, query)) count += 1;
  }
  return count;
}

function rowMatches(index: WordIndex, row: WordRow, query: ExampleQuery): boolean {
  const [, , , , rootIndex, lemmaIndex, pos, poses, features, rels] = row;
  if (query.root && !sameLexeme(query.root, index.roots[rootIndex])) return false;
  if (query.lemma && !sameLexeme(query.lemma, index.lemmas[lemmaIndex])) return false;
  if (query.pos) {
    const wanted = query.pos.split(",");
    const all = poses ? poses.split(",") : [];
    if (!wanted.some((code) => pos === code || all.includes(code))) return false;
  }
  if (query.form && parseFeatures(features).form !== query.form) return false;
  if (query.relation) {
    const wanted = query.relation.split(",");
    const all = rels ? rels.split(",") : [];
    if (!wanted.some((code) => all.includes(code))) return false;
  }
  return Boolean(query.root || query.lemma || query.pos || query.form || query.relation);
}

export function exampleFacets(index: WordIndex, query: ExampleQuery): { lemmas: Facet[]; forms: Facet[] } {
  const lemmas = new Map<string, Facet>();
  const forms = new Map<string, Facet>();
  for (const row of index.rows) {
    if (!rowMatches(index, row, query)) continue;
    const lemma = index.lemmas[row[5]];
    const lemmaKey = lemma?.b || "";
    if (lemmaKey) {
      const current = lemmas.get(lemmaKey) ?? { key: lemmaKey, label: lemma?.a || lemmaKey, count: 0 };
      current.count += 1;
      lemmas.set(lemmaKey, current);
    }
    const form = parseFeatures(row[8]).form;
    if (form) {
      const current = forms.get(form) ?? { key: form, label: form, count: 0 };
      current.count += 1;
      forms.set(form, current);
    }
  }
  return {
    lemmas: [...lemmas.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    forms: [...forms.values()].sort((a, b) => b.count - a.count),
  };
}

export interface Facet {
  key: string;
  label: string;
  count: number;
}

export function featureSummary(features: string): string {
  const parsed = parseFeatures(features);
  const shaped: Features = {
    form: parsed.form,
    asp: parsed.asp,
    voice: parsed.voice,
    mood: parsed.mood,
    per: parsed.per ? Number(parsed.per) : undefined,
    gen: parsed.gen,
    num: parsed.num,
    case: parsed.case,
    state: parsed.state,
    deriv: parsed.deriv,
    sp: parsed.sp,
  };
  return featureLines(shaped)
    .map((line) => line.name)
    .join(" · ");
}
