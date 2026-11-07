import { stripDiacritics } from "./arabic";
import type {
	UsuliCategoryGroup,
	UsuliShahid,
	UsuliTaxonomyId,
} from "./usulTypes";

export interface UsuliSearchQuery {
	text?: string;
	categoryGroup?: UsuliCategoryGroup;
	taxonomyId?: UsuliTaxonomyId;
	hasQarinahSarifah?: boolean;
	isCanonicalShahid?: boolean;
}

export function searchUsuliShawahid(
	shawahid: readonly UsuliShahid[],
	query: UsuliSearchQuery,
): UsuliShahid[] {
	const textNeedle = query.text ? stripDiacritics(query.text.trim()) : "";

	return shawahid.filter((item) => {
		if (query.categoryGroup && item.categoryGroup !== query.categoryGroup) {
			return false;
		}

		if (query.taxonomyId && item.taxonomyId !== query.taxonomyId) {
			return false;
		}

		if (
			query.hasQarinahSarifah !== undefined &&
			item.hasQarinahSarifah !== query.hasQarinahSarifah
		) {
			return false;
		}

		if (
			query.isCanonicalShahid !== undefined &&
			item.isCanonicalShahid !== query.isCanonicalShahid
		) {
			return false;
		}

		if (textNeedle) {
			const targetText = [
				item.shahidPhraseAr,
				item.wajhAlDilalahAr,
				item.derivedFiqhRulingAr,
				item.linguisticTriggerAr,
				item.qarinahTextAr ?? "",
				item.khilafUsuliAr ?? "",
			]
				.map((field) => stripDiacritics(field))
				.join(" ");

			if (!targetText.includes(textNeedle)) {
				return false;
			}
		}

		return true;
	});
}
