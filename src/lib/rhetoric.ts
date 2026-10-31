import { useLayer } from "./layers";
import type {
	HadhfDetails,
	RhetoricBranch,
	RhetoricDatasetKey,
	RhetoricEntry,
	TashbihDetails,
} from "./types";

export type {
	HadhfDetails,
	RhetoricBranch,
	RhetoricDatasetKey,
	RhetoricEntry,
	TashbihDetails,
};

const NO_ENTRIES: RhetoricEntry[] = [];

export function useRhetoric(enabled = true) {
	const { data, loading, error } = useLayer("rhetoric", { enabled });
	return { entries: data ?? NO_ENTRIES, loading, error };
}
