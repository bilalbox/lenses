import { useEffect, useState } from "react";
import { loadRhetoric } from "./api";

export type RhetoricDatasetKey = "dataset-a-tashbih" | "dataset-b-hadhf" | "classical-balagha";

export type RhetoricBranch = "maani" | "bayan" | "badi";

export interface TashbihDetails {
  tamthili: boolean; // composite multi-element scene analogy
  adat: string; // e.g. "كَمَثَلِ", "كَـ", "كَأَنَّ", or "none (محذوفة)"
  adatType: "mursal" | "muakkad";
  mushabbah: string; // the subject compared
  mushabbahBihi: string; // the vehicle compared to
  wajh: string; // point of similarity
  wajhType: "mufassal" | "mujmal";
  baligh: boolean; // tool & wajh omitted
  classificationAr: string; // e.g. "تمثيلي مرسل مجمل", "بليغ"
  classificationEn: string;
}

export interface HadhfDetails {
  category: "ism" | "harf" | "fil" | "jumlah";
  categoryAr: string; // "حذف اسم / مفعول / مضاف" | "حذف حرف" | "حذف فعل" | "حذف جملة / جواب شرط"
  slotAr: string; // "حذف المفعول به" | "حذف المضاف" | "حذف جواب الشرط" | "حذف مقول القول"
  slotEn: string;
  taqdirAr: string; // e.g. "[مَا قَدَّمَتْهُ مِنْ عَمَلٍ]"
  taqdirEn: string; // e.g. "[Whatever deeds she put forward]"
  omissionMarker: string; // context phrase with [ ] marker
  purposeAr: string; // e.g. "للتعميم والشمول واستيعاب سائر الأعمال"
  purposeEn: string; // e.g. "Universal generalization to encompass all deeds without limitation"
}

export interface RhetoricEntry {
  id: string;
  sura: number;
  verse: number;
  surahNameAr: string;
  surahNameEn: string;
  dataset: RhetoricDatasetKey;
  datasetBadge: string;
  branch: RhetoricBranch;
  branchAr: string;
  branchEn: string;
  deviceAr: string;
  deviceEn: string;
  subtypes: string[];
  arabicAyah: string;
  englishAyah: string;
  indonesianAyah: string;
  highlightArabic: string;
  tashbih?: TashbihDetails;
  hadhf?: HadhfDetails;
  scholarlyNote?: {
    source: string;
    text: string;
  };
}

let memoryCache: RhetoricEntry[] | null = null;
let fetchPromise: Promise<RhetoricEntry[]> | null = null;

export function getRhetoricEntriesAsync(): Promise<RhetoricEntry[]> {
  if (memoryCache) return Promise.resolve(memoryCache);
  fetchPromise ??= loadRhetoric().then((data) => {
    memoryCache = data;
    return data;
  });
  return fetchPromise;
}

export function useRhetoric() {
  const [entries, setEntries] = useState<RhetoricEntry[]>(() => memoryCache || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryCache);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (memoryCache) {
      setEntries(memoryCache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getRhetoricEntriesAsync()
      .then((data) => {
        if (!cancelled) {
          setEntries(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load rhetoric data");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading, error };
}

// Deprecated empty fallback for legacy synchronous references
export const RHETORIC_ENTRIES: RhetoricEntry[] = [];
