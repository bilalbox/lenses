import { useI18n } from "../lib/i18n/I18nContext";

interface Props {
	featureName: string;
	onOpenSettings: () => void;
}

export function FeatureOffPanel({ featureName, onOpenSettings }: Props) {
	const { t } = useI18n();
	return (
		<div className="feature-off-panel anim-soft-enter" role="status">
			<h1>{t.settings.featureOffTitle(featureName)}</h1>
			<p>{t.settings.featureOffBody}</p>
			<button type="button" className="install-button" onClick={onOpenSettings}>
				{t.settings.featureOffOpenSettings}
			</button>
		</div>
	);
}
