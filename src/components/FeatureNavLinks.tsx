import { useI18n } from "../lib/i18n/I18nContext";
import type { ReaderPrefs } from "../lib/readerPrefs";
import type { Route } from "../lib/types";

interface Props {
	route: Route;
	readerPrefs: ReaderPrefs;
}

export function FeatureNavLinks({ route, readerPrefs }: Props) {
	const { t } = useI18n();
	return (
		<>
			{readerPrefs.rhetoricStudio ? (
				<a
					href="#/rhetoric"
					aria-current={route.page === "rhetoric" ? "page" : undefined}
				>
					{t.common.rhetoricNav}
				</a>
			) : null}
			{readerPrefs.munasabat ? (
				<a
					href="#/munasabat"
					aria-current={route.page === "munasabat" ? "page" : undefined}
				>
					{t.common.munasabatNav}
				</a>
			) : null}
		</>
	);
}
