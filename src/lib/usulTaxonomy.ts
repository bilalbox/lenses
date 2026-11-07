import rawTaxonomyData from "../../public/data/quran/usulTaxonomy.json";
import type {
	UsuliCategoryGroup,
	UsuliTaxonomyId,
	UsuliTaxonomyNode,
} from "./usulTypes";

export const USULI_CATEGORY_LABELS: Record<
	UsuliCategoryGroup,
	{ ar: string; en: string }
> = {
	AMR_NAHY: { ar: "الأمر والنهي", en: "Commands & Prohibitions" },
	AMM_KHASS: { ar: "العام والخاص", en: "General & Specific" },
	MUTLAQ_MUQAYYAD: { ar: "المطلق والمقيد", en: "Absolute & Qualified" },
	MANTOOQ_MAFHUM: { ar: "المنطوق والمفهوم", en: "Explicit & Implied" },
	WAADIH_MUBHAM: { ar: "الوضوح والإبهام", en: "Clarity & Ambiguity" },
};

export const USULI_TAXONOMY_NODES: Record<UsuliTaxonomyId, UsuliTaxonomyNode> =
	Object.fromEntries(
		(rawTaxonomyData as UsuliTaxonomyNode[]).map((node) => [node.id, node]),
	) as Record<UsuliTaxonomyId, UsuliTaxonomyNode>;

export function getTaxonomyNode(id: UsuliTaxonomyId): UsuliTaxonomyNode {
	const node = USULI_TAXONOMY_NODES[id];
	if (!node) {
		throw new Error(`Unknown Usuli taxonomy ID: ${id}`);
	}
	return node;
}

export function listTaxonomyNodes(): UsuliTaxonomyNode[] {
	return Object.values(USULI_TAXONOMY_NODES);
}

export function nodesForCategory(
	group: UsuliCategoryGroup,
): UsuliTaxonomyNode[] {
	return Object.values(USULI_TAXONOMY_NODES).filter(
		(node) => node.categoryGroup === group,
	);
}
