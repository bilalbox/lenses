import { useRef } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import type { AsbabNarration } from "../lib/types";
import { useModalLifecycle } from "../lib/useModal";
import { BookIcon, CloseIcon } from "./Icons";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	sura: number;
	verseNumber: number;
	surahName?: string;
	narrations: AsbabNarration[];
}

export function AsbabDrawer({
	isOpen,
	onClose,
	sura,
	verseNumber,
	surahName,
	narrations,
}: Props) {
	const { t, formatNumber } = useI18n();
	const touchY = useRef(0);
	const drawerRef = useRef<HTMLDivElement>(null);
	const { rendered, isClosing } = useModalLifecycle(isOpen, onClose, drawerRef);

	if (!rendered) return null;

	return (
		<div
			className={`settings-backdrop asbab-backdrop${isClosing ? " is-closing" : ""}`}
			onClick={onClose}
			role="presentation"
		>
			<div
				className={`asbab-dialog${isClosing ? " is-closing" : ""}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="asbab-title"
				ref={drawerRef}
				onClick={(event) => event.stopPropagation()}
				dir="rtl"
			>
				<button
					type="button"
					className="sheet-handle settings-sheet-handle asbab-sheet-handle"
					aria-label={t.sheet.closeAria}
					onTouchStart={(event) => {
						touchY.current = event.touches[0]?.clientY ?? 0;
					}}
					onTouchEnd={(event) => {
						const end = event.changedTouches[0]?.clientY ?? touchY.current;
						if (end - touchY.current > 48) onClose();
					}}
					onClick={onClose}
				/>

				<header className="asbab-header">
					<div className="asbab-title-group">
						<span className="asbab-icon-wrap" aria-hidden="true">
							<BookIcon />
						</span>
						<div>
							<h2 id="asbab-title" className="asbab-heading">
								{t.verse.asbabDrawerTitle}
							</h2>
							<p className="asbab-subheading">
								{surahName ? `${surahName} · ` : ""}
								{formatNumber(sura)}:{formatNumber(verseNumber)}
							</p>
						</div>
					</div>
					<button
						type="button"
						className="icon-button"
						onClick={onClose}
						aria-label={t.sheet.closeAria}
					>
						<CloseIcon />
					</button>
				</header>

				<div className="asbab-content">
					{narrations.length === 0 ? (
						<p className="asbab-empty">{t.verse.noTreeTitle}</p>
					) : (
						narrations.map((item, index) => (
							<article key={item.id} className="asbab-card">
								<div className="asbab-card-top">
									<span className="asbab-card-num">
										رواية #{formatNumber(index + 1)}
									</span>
									<span
										className={`asbab-grade-badge grade-${item.grade}`}
										title={item.gradeLabel}
									>
										{item.gradeLabel || item.grade}
									</span>
								</div>

								<p className="asbab-narration-text" lang="ar">
									{item.text}
								</p>

								{item.takhrij ? (
									<div className="asbab-takhrij-block">
										<div className="asbab-takhrij-label">التخريج والحكم:</div>
										<p className="asbab-takhrij-text" lang="ar">
											{item.takhrij}
										</p>
									</div>
								) : null}
							</article>
						))
					)}
				</div>

				<footer className="asbab-footer">
					<p className="asbab-citation">
						المصدر: <strong>المحرر في أسباب نزول القرآن</strong> — أ.د. خالد بن
						سليمان المزيني
					</p>
				</footer>
			</div>
		</div>
	);
}
