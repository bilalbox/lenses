import type { ReactNode } from "react";

// Regex matching either an embedded intro like "... وهو (( " followed by word: analysis,
// or a line beginning with word: analysis.
const EMBED_IRAB_LINE = /^(.*?(?:وهو\s*(?:\(\(|:|\:\(\()\s*))([^:\n]{1,60})([:：])\s*(.*)$/;
const NORMAL_IRAB_LINE = /^((?:\(\(|\«|\"|\s)*)([^:\n]{1,60})([:：])\s*(.*)$/;

function splitWordEnclosure(rawWord: string): { prefix: string; word: string; suffix: string } {
  const matchFull = rawWord.match(/^(\(\(+|\«|\"|\{|﴿)(.*?)(\)\)+|\»|\"|\}|﴾)$/);
  if (matchFull) {
    return {
      prefix: matchFull[1],
      word: matchFull[2].trim(),
      suffix: matchFull[3],
    };
  }
  const matchStart = rawWord.match(/^(\(\(+|\«|\"|\{|﴿)(.*)$/);
  if (matchStart) {
    return {
      prefix: matchStart[1],
      word: matchStart[2].trim(),
      suffix: "",
    };
  }
  return { prefix: "", word: rawWord, suffix: "" };
}

/**
 * Formats multi-line classical sentence i'rab or word-level analysis text.
 * Words before colons (such as `حَقَّ: فعل ماض...`) are rendered with
 * strong bold styling to demarcate the target word from its analysis.
 */
export function formatIrabText(text: string): ReactNode {
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return "\n";
    }

    const embedMatch = trimmed.match(EMBED_IRAB_LINE);
    if (embedMatch) {
      const [, lead, rawWord, colon, analysis] = embedMatch;
      const { prefix, word, suffix } = splitWordEnclosure(rawWord.trim());
      return (
        <span key={lineIdx} className="irab-line">
          {lead}
          {prefix}
          <strong className="irab-target-word">{word}</strong>
          {suffix}
          <span className="irab-colon">{colon}</span> {analysis}
          {lineIdx < lines.length - 1 ? "\n" : null}
        </span>
      );
    }

    const normMatch = trimmed.match(NORMAL_IRAB_LINE);
    if (normMatch) {
      const [, lead, rawWord, colon, analysis] = normMatch;
      const { prefix, word, suffix } = splitWordEnclosure(rawWord.trim());
      return (
        <span key={lineIdx} className="irab-line">
          {lead}
          {prefix}
          <strong className="irab-target-word">{word}</strong>
          {suffix}
          <span className="irab-colon">{colon}</span> {analysis}
          {lineIdx < lines.length - 1 ? "\n" : null}
        </span>
      );
    }

    return (
      <span key={lineIdx} className="irab-line">
        {trimmed}
        {lineIdx < lines.length - 1 ? "\n" : null}
      </span>
    );
  });
}

const BRACKETED_TOKEN = /(\([^\)]+\)|﴿[^﴾]+﴾)/;

/**
 * Formats word-level morphology/i'rab text where grammatical segments
 * are bracketed (e.g. `(الْبَاءُ) حَرْفُ جَرٍّ... وَ﴿اسْمِ﴾ اسْمٌ مَجْرُورٌ...`).
 */
export function formatWordIrabText(text: string): ReactNode {
  if (text.includes(":") || text.includes("：")) {
    return formatIrabText(text);
  }

  const parts = text.split(BRACKETED_TOKEN);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (
      (part.startsWith("(") && part.endsWith(")")) ||
      (part.startsWith("﴿") && part.endsWith("﴾"))
    ) {
      const open = part[0];
      const close = part[part.length - 1];
      const inner = part.slice(1, -1);
      return (
        <span key={idx}>
          {open}
          <strong className="irab-target-word">{inner}</strong>
          {close}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}
