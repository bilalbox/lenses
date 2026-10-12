import type { Locale } from "./types";

const arabicFormatter = new Intl.NumberFormat("ar-EG");
const indonesianFormatter = new Intl.NumberFormat("id-ID");
const westernFormatter = new Intl.NumberFormat("en-US");

export function formatNum(n: number, locale: Locale): string {
  if (locale === "ar") return arabicFormatter.format(n);
  if (locale === "id") return indonesianFormatter.format(n);
  return westernFormatter.format(n);
}

/** Converts Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to standard ASCII digits (0-9) */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (char) => String(char.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (char) => String(char.charCodeAt(0) - 0x06f0));
}
