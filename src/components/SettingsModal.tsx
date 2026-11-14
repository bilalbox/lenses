import { useRef } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { LOCALES, type Locale } from "../lib/i18n/types";
import type { LibraryProgress } from "../lib/library";
import {
	READER_LAYER_KEYS,
	type ReaderLayerKey,
	type ReaderPrefs,
} from "../lib/readerPrefs";
import { useModalLifecycle } from "../lib/useModal";
import { useSheetDrag } from "../lib/useSheetGestures";
import { BookIcon, CheckIcon, CloseIcon, MoonIcon, SunIcon } from "./Icons";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	theme: string;
	onSelectTheme: (next: "light" | "dark") => void;
	readerPrefs: ReaderPrefs;
	onToggleReaderPref: (key: ReaderLayerKey, next: boolean) => void;
	/** Background offline download; null until it starts (or with Data Saver on). */
	library: LibraryProgress | null;
	canInstall: boolean;
	onInstall: () => void;
}

export function SettingsModal({
	isOpen,
	onClose,
	theme,
	onSelectTheme,
	readerPrefs,
	onToggleReaderPref,
	library,
	canInstall,
	onInstall,
}: Props) {
	const { locale, setLocale, t } = useI18n();
	const modalRef = useRef<HTMLDivElement>(null);
	const { rendered, isClosing } = useModalLifecycle(isOpen, onClose, modalRef);
	// Same grab bar as the word sheet: drag down (or tap) to put it away.
	const handleDrag = useSheetDrag(modalRef, {
		onDismiss: onClose,
		onTap: onClose,
	});

	if (!rendered) return null;

	const handleLanguageChange = (code: Locale) => {
		setLocale(code);
	};

	return (
		<div
			className={`settings-backdrop${isClosing ? " is-closing" : ""}`}
			onClick={onClose}
			role="presentation"
		>
			<div
				className={`settings-dialog${isClosing ? " is-closing" : ""}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-title"
				ref={modalRef}
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					className="sheet-handle settings-sheet-handle"
					aria-label={t.settings.closeAria}
					{...handleDrag}
				/>

				<header className="settings-head">
					<h2 id="settings-title">{t.settings.title}</h2>
					<button
						type="button"
						className="icon-button sheet-close"
						onClick={onClose}
						aria-label={t.settings.closeAria}
					>
						<CloseIcon />
					</button>
				</header>

				<section className="settings-section">
					<h3>{t.settings.languageSection}</h3>
					<div className="segmented-group">
						{(Object.keys(LOCALES) as Locale[]).map((code) => {
							const info = LOCALES[code];
							const isSelected = locale === code;
							return (
								<button
									key={code}
									type="button"
									className={`segmented-item${isSelected ? " is-active" : ""}`}
									onClick={() => handleLanguageChange(code)}
									aria-pressed={isSelected}
								>
									<span>{info.label}</span>
									{isSelected ? <CheckIcon className="check-mark" /> : null}
								</button>
							);
						})}
					</div>
				</section>

				<section className="settings-section">
					<h3>{t.settings.themeSection}</h3>
					<div className="segmented-group theme-group">
						<button
							type="button"
							className={`segmented-item${theme === "light" ? " is-active" : ""}`}
							onClick={() => onSelectTheme("light")}
							aria-pressed={theme === "light"}
						>
							<SunIcon />
							<span>{t.settings.themeLight}</span>
						</button>
						<button
							type="button"
							className={`segmented-item${theme === "dark" ? " is-active" : ""}`}
							onClick={() => onSelectTheme("dark")}
							aria-pressed={theme === "dark"}
						>
							<MoonIcon />
							<span>{t.settings.themeDark}</span>
						</button>
					</div>
				</section>

				<section className="settings-section">
					<h3>{t.settings.readerSection}</h3>
					<p className="settings-section-hint">
						{t.settings.readerSectionHint}
					</p>
					<div className="settings-switch-stack">
						{READER_LAYER_KEYS.map((key) => {
							const on = readerPrefs[key];
							return (
								<button
									key={key}
									type="button"
									role="switch"
									aria-checked={on}
									className="settings-switch-card"
									onClick={() => onToggleReaderPref(key, !on)}
								>
									<span className="settings-switch-content">
										<strong>{t.settings.readerLayers[key]}</strong>
									</span>
									<span
										className={`settings-switch${on ? " is-on" : ""}`}
										aria-hidden="true"
									>
										<span className="settings-switch-thumb" />
									</span>
								</button>
							);
						})}
					</div>
				</section>

				<section className="settings-section">
					<a href="#/sources" className="settings-link-card" onClick={onClose}>
						<div className="settings-link-icon">
							<BookIcon />
						</div>
						<div className="settings-link-content">
							<strong>{t.settings.sourcesLink}</strong>
							<small>{t.settings.sourcesDescription}</small>
						</div>
						<span className="settings-link-arrow" aria-hidden="true">
							›
						</span>
					</a>
				</section>

				{library ? (
					<p className="settings-offline" role="status">
						{library.done >= library.total
							? t.common.offlineReady
							: t.common.savingOffline(library.done, library.total)}
					</p>
				) : null}

				{canInstall ? (
					<section className="settings-section">
						<button
							type="button"
							className="install-button"
							onClick={() => {
								onInstall();
								onClose();
							}}
						>
							{t.settings.installApp}
						</button>
					</section>
				) : null}
			</div>
		</div>
	);
}
