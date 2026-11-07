import { useMemo, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import {
	generateIdentifyDalalahDrill,
	generateKhilafDrill,
	generateLocateSpanDrill,
	generateSpotTheQarinahDrill,
	validateSpanClick,
} from "../lib/usulQuizEngine";
import { searchUsuliShawahid } from "../lib/usulSearch";
import { getTaxonomyNode, USULI_CATEGORY_LABELS } from "../lib/usulTaxonomy";
import {
	parseVerseKey,
	type UsuliCategoryGroup,
	type UsuliShahid,
} from "../lib/usulTypes";

interface Props {
	shawahid: UsuliShahid[];
	allShawahid?: UsuliShahid[];
	onSelectWord?: (wordIndex: number) => void;
	onNavigateAyah?: (sura: number, ayah: number) => void;
}

type ViewMode = "verse" | "explore" | "drill";
type DrillType =
	| "IDENTIFY_DALALAH"
	| "SPOT_THE_QARINAH"
	| "LOCATE_SHAHID_SPAN"
	| "USULI_KHILAF_DRILL";

interface UsulVerseCardProps {
	item: UsuliShahid;
	index: number;
	onSelectWord?: (wordIndex: number) => void;
	onNavigateAyah?: (sura: number, ayah: number) => void;
}

function UsulVerseCard({
	item,
	index,
	onSelectWord,
	onNavigateAyah,
}: UsulVerseCardProps) {
	const { formatNumber } = useI18n();
	const taxonomy = getTaxonomyNode(item.taxonomyId);
	const category = USULI_CATEGORY_LABELS[item.categoryGroup];
	const qarinahRef = item.qarinahVerseKey
		? parseVerseKey(item.qarinahVerseKey)
		: null;

	return (
		<article className="usul-card">
			<div className="usul-card-header">
				<div className="usul-badge-group">
					<span className="usul-cat-badge">{category.ar}</span>
					<span className="usul-tax-badge">{taxonomy.nameAr}</span>
					{item.isCanonicalShahid ? (
						<span className="usul-canonical-badge">شاهد أصيل</span>
					) : null}
					<span className="usul-stage-badge">
						{item.extractionStage === "GOLDEN_SEED"
							? "تحرير أصولي معتمد"
							: item.extractionStage === "STAGE2_LLM_VERIFIED"
								? "استنباط محقق"
								: "صيغة مرشحة"}
					</span>
				</div>
				<span className="usul-index-meta">شاهد #{formatNumber(index + 1)}</span>
			</div>

			<div className="usul-phrase-row">
				<button
					type="button"
					className="usul-phrase-btn"
					onClick={() => onSelectWord?.(item.wordStart)}
					title={`تحديد موضع الشاهد في الآية (الكلمات ${formatNumber(item.wordStart)}–${formatNumber(item.wordEnd)})`}
				>
					<span className="usul-phrase-quote">﴿{item.shahidPhraseAr}﴾</span>
					<span className="usul-span-coords">
						[الكلمات {formatNumber(item.wordStart)}–{formatNumber(item.wordEnd)}
						]
					</span>
				</button>
			</div>

			<div className="usul-details-grid">
				<div className="usul-detail-item">
					<span className="usul-detail-label">الصيغة الموجبة:</span>
					<span className="usul-detail-value">{item.linguisticTriggerAr}</span>
				</div>

				<div className="usul-detail-item">
					<span className="usul-detail-label">مجرى الدلالة:</span>
					{item.hasQarinahSarifah ? (
						<span className="usul-detail-value is-shifted">
							{item.defaultDalalahAr} ➔ <strong>{item.actualDalalahAr}</strong>{" "}
							(بقرينة صارفة)
						</span>
					) : (
						<span className="usul-detail-value">
							{item.actualDalalahAr} (على أصل الوضع اللغوي والشرعي)
						</span>
					)}
				</div>

				{item.hasQarinahSarifah && item.qarinahTextAr ? (
					<div className="usul-qarinah-box">
						<div className="usul-qarinah-head">
							<span className="usul-qarinah-label">القرينة الصارفة:</span>
							{qarinahRef && onNavigateAyah ? (
								<button
									type="button"
									className="usul-nav-verse-btn"
									onClick={() =>
										onNavigateAyah(qarinahRef.sura, qarinahRef.verse)
									}
								>
									انتقل إلى الآية {item.qarinahVerseKey} ↗
								</button>
							) : null}
						</div>
						<p className="usul-qarinah-text">﴿{item.qarinahTextAr}﴾</p>
					</div>
				) : null}

				<div className="usul-wajh-box">
					<span className="usul-detail-label">وجه الدلالة:</span>
					<p className="usul-prose-text">{item.wajhAlDilalahAr}</p>
				</div>

				<div className="usul-ruling-box">
					<span className="usul-detail-label">الحكم الفقهي المستنبط:</span>
					<p className="usul-prose-text">{item.derivedFiqhRulingAr}</p>
				</div>

				{item.khilafUsuliAr ? (
					<div className="usul-khilaf-box">
						<span className="usul-detail-label">تحرير الخلاف الأصولي:</span>
						<p className="usul-prose-text">{item.khilafUsuliAr}</p>
					</div>
				) : null}

				{item.classicalSources.length > 0 ? (
					<div className="usul-sources-row">
						<span className="usul-detail-label">أمهات المصادر الأصولية:</span>
						<div className="usul-source-tags">
							{item.classicalSources.map((source) => (
								<span key={source} className="usul-source-tag">
									{source}
								</span>
							))}
						</div>
					</div>
				) : null}
			</div>
		</article>
	);
}

interface UsulExploreViewProps {
	searchPool: UsuliShahid[];
	onNavigateAyah?: (sura: number, ayah: number) => void;
}

function UsulExploreView({ searchPool, onNavigateAyah }: UsulExploreViewProps) {
	const { formatNumber } = useI18n();
	const [searchText, setSearchText] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		UsuliCategoryGroup | undefined
	>(undefined);
	const [qarinahOnly, setQarinahOnly] = useState(false);
	const [canonicalOnly, setCanonicalOnly] = useState(false);

	const exploreResults = useMemo(() => {
		return searchUsuliShawahid(searchPool, {
			text: searchText || undefined,
			categoryGroup: selectedCategory,
			hasQarinahSarifah: qarinahOnly ? true : undefined,
			isCanonicalShahid: canonicalOnly ? true : undefined,
		});
	}, [searchPool, searchText, selectedCategory, qarinahOnly, canonicalOnly]);

	const categoryKeys = Object.keys(
		USULI_CATEGORY_LABELS,
	) as UsuliCategoryGroup[];

	return (
		<div className="usul-explore-container">
			<div className="usul-search-box">
				<input
					type="search"
					className="usul-search-input"
					placeholder="ابحث في نص الشاهد، وجه الدلالة، أو الحكم الفقهي..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
				/>
				{searchText ? (
					<button
						type="button"
						className="usul-clear-btn"
						onClick={() => setSearchText("")}
					>
						✕
					</button>
				) : null}
			</div>

			<div className="usul-filter-pills" role="radiogroup">
				<button
					type="button"
					className={`usul-pill-btn ${selectedCategory === undefined ? "is-active" : ""}`}
					onClick={() => setSelectedCategory(undefined)}
				>
					جميع الأبواب
				</button>
				{categoryKeys.map((catKey) => (
					<button
						key={catKey}
						type="button"
						className={`usul-pill-btn ${selectedCategory === catKey ? "is-active" : ""}`}
						onClick={() =>
							setSelectedCategory(
								selectedCategory === catKey ? undefined : catKey,
							)
						}
					>
						{USULI_CATEGORY_LABELS[catKey].ar}
					</button>
				))}
			</div>

			<div className="usul-flags-row">
				<label className="usul-checkbox-label">
					<input
						type="checkbox"
						checked={qarinahOnly}
						onChange={(e) => setQarinahOnly(e.target.checked)}
					/>
					<span>ذو قرينة صارفة فقط</span>
				</label>
				<label className="usul-checkbox-label">
					<input
						type="checkbox"
						checked={canonicalOnly}
						onChange={(e) => setCanonicalOnly(e.target.checked)}
					/>
					<span>الشواهد الأصيلة المعتمدة فقط</span>
				</label>
				<span className="usul-results-count">
					النتائج: {formatNumber(exploreResults.length)} شاهد
				</span>
			</div>

			<div className="usul-explore-results">
				{exploreResults.length === 0 ? (
					<p className="asbab-empty">
						لم يتم العثور على شواهد أصولية مطابقة لخيارات البحث.
					</p>
				) : (
					exploreResults.slice(0, 50).map((res) => {
						const tax = getTaxonomyNode(res.taxonomyId);
						const cat = USULI_CATEGORY_LABELS[res.categoryGroup];
						return (
							<div key={res.id} className="usul-explore-card">
								<div className="usul-explore-card-head">
									<div className="usul-badge-group">
										<span className="usul-cat-badge">{cat.ar}</span>
										<span className="usul-tax-badge">{tax.nameAr}</span>
										{res.isCanonicalShahid ? (
											<span className="usul-canonical-badge">أصيل</span>
										) : null}
									</div>
									{onNavigateAyah ? (
										<button
											type="button"
											className="usul-nav-verse-btn"
											onClick={() => onNavigateAyah(2, res.ayahNumber)}
										>
											الآية {res.verseKey} ↗
										</button>
									) : (
										<span className="usul-index-meta">{res.verseKey}</span>
									)}
								</div>
								<p className="usul-explore-phrase">﴿{res.shahidPhraseAr}﴾</p>
								<p className="usul-explore-wajh">{res.wajhAlDilalahAr}</p>
								<p className="usul-explore-ruling">
									<strong>الحكم:</strong> {res.derivedFiqhRulingAr}
								</p>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

interface DrillChoiceListProps {
	options: Array<{ labelAr: string; isCorrect?: boolean; id?: string }>;
	selectedIndex: number | string | null;
	onSelect: (indexOrId: number | string) => void;
}

function DrillChoiceList({
	options,
	selectedIndex,
	onSelect,
}: DrillChoiceListProps) {
	return (
		<div className="usul-quiz-options">
			{options.map((opt, idx) => {
				const optionKey = opt.id ?? idx;
				const isSelected = selectedIndex === optionKey;
				let btnClass = "usul-quiz-option";
				if (selectedIndex !== null) {
					if (opt.isCorrect) btnClass += " is-correct";
					else if (isSelected) btnClass += " is-incorrect";
				}
				return (
					<button
						key={opt.labelAr}
						type="button"
						className={btnClass}
						disabled={selectedIndex !== null}
						onClick={() => onSelect(optionKey)}
					>
						{opt.labelAr}
					</button>
				);
			})}
		</div>
	);
}

interface UsulDrillViewProps {
	pool: UsuliShahid[];
	onNavigateAyah?: (sura: number, ayah: number) => void;
}

function UsulDrillView({ pool, onNavigateAyah }: UsulDrillViewProps) {
	const { formatNumber } = useI18n();
	const [drillType, setDrillType] = useState<DrillType>("IDENTIFY_DALALAH");
	const [drillIndex, setDrillIndex] = useState(0);
	const [selectedOption, setSelectedOption] = useState<string | number | null>(
		null,
	);
	const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
		null,
	);
	const [spanClickResult, setSpanClickResult] = useState<boolean | null>(null);

	const activePool = useMemo(() => {
		if (drillType === "USULI_KHILAF_DRILL") {
			return pool.filter((s) => s.khilafUsuliAr !== null);
		}
		return pool;
	}, [pool, drillType]);

	const currentShahid =
		activePool.length > 0
			? (activePool[drillIndex % activePool.length] ?? activePool[0])
			: null;

	const currentDrill = useMemo(() => {
		if (!currentShahid) return null;
		const seed = `drill-${drillType}-${drillIndex}`;
		switch (drillType) {
			case "IDENTIFY_DALALAH":
				return generateIdentifyDalalahDrill(currentShahid, seed);
			case "SPOT_THE_QARINAH":
				return generateSpotTheQarinahDrill(currentShahid, seed);
			case "LOCATE_SHAHID_SPAN":
				return generateLocateSpanDrill(currentShahid);
			case "USULI_KHILAF_DRILL":
				return generateKhilafDrill(currentShahid, seed);
		}
	}, [currentShahid, drillType, drillIndex]);

	const handleNextDrill = () => {
		setSelectedOption(null);
		setSelectedTokenIndex(null);
		setSpanClickResult(null);
		setDrillIndex((prev) => prev + 1);
	};

	const handleSwitchDrillType = (type: DrillType) => {
		setDrillType(type);
		setSelectedOption(null);
		setSelectedTokenIndex(null);
		setSpanClickResult(null);
		setDrillIndex(0);
	};

	if (!currentDrill) {
		return (
			<p className="asbab-empty">
				لا توجد شواهد كافية لتوليد هذا النمط من التدريب حالياً.
			</p>
		);
	}

	return (
		<div className="usul-drill-container">
			<div className="usul-drill-type-pills">
				<button
					type="button"
					className={`usul-pill-btn ${drillType === "IDENTIFY_DALALAH" ? "is-active" : ""}`}
					onClick={() => handleSwitchDrillType("IDENTIFY_DALALAH")}
				>
					١. تعيين الدلالة الأصولية
				</button>
				<button
					type="button"
					className={`usul-pill-btn ${drillType === "SPOT_THE_QARINAH" ? "is-active" : ""}`}
					onClick={() => handleSwitchDrillType("SPOT_THE_QARINAH")}
				>
					٢. اكتشاف القرينة الصارفة
				</button>
				<button
					type="button"
					className={`usul-pill-btn ${drillType === "LOCATE_SHAHID_SPAN" ? "is-active" : ""}`}
					onClick={() => handleSwitchDrillType("LOCATE_SHAHID_SPAN")}
				>
					٣. تحديد موضع الشاهد
				</button>
				<button
					type="button"
					className={`usul-pill-btn ${drillType === "USULI_KHILAF_DRILL" ? "is-active" : ""}`}
					onClick={() => handleSwitchDrillType("USULI_KHILAF_DRILL")}
				>
					٤. تحرير الخلاف الأصولي
				</button>
			</div>

			<div className="usul-drill-card">
				<div className="usul-drill-meta-bar">
					<span className="usul-index-meta">
						سؤال #{formatNumber(drillIndex + 1)} · الآية {currentDrill.verseKey}
					</span>
					{onNavigateAyah ? (
						<button
							type="button"
							className="usul-nav-verse-btn"
							onClick={() => onNavigateAyah(2, currentDrill.ayahNumber)}
						>
							عرض في المصحف ↗
						</button>
					) : null}
				</div>

				{currentDrill.mode === "IDENTIFY_DALALAH" && (
					<div className="usul-drill-body">
						<h4 className="usul-drill-question">{currentDrill.questionAr}</h4>
						<div className="usul-drill-phrase-box">
							﴿{currentDrill.shahidPhraseAr}﴾
						</div>
						<DrillChoiceList
							options={currentDrill.options.map((opt) => ({
								id: opt.id,
								labelAr: opt.labelAr,
								isCorrect: opt.id === currentDrill.correctTaxonomyId,
							}))}
							selectedIndex={selectedOption}
							onSelect={setSelectedOption}
						/>
						{selectedOption !== null && (
							<div className="usul-feedback-banner">
								{selectedOption === currentDrill.correctTaxonomyId ? (
									<p className="usul-feedback-text is-success">
										✓ إجابة صحيحة! الدلالة الأصولية هي: [
										{getTaxonomyNode(currentDrill.correctTaxonomyId).nameAr}].
									</p>
								) : (
									<p className="usul-feedback-text is-error">
										✗ إجابة غير دقيقة. الصواب هو: [
										{getTaxonomyNode(currentDrill.correctTaxonomyId).nameAr}].
									</p>
								)}
							</div>
						)}
					</div>
				)}

				{currentDrill.mode === "SPOT_THE_QARINAH" && (
					<div className="usul-drill-body">
						<h4 className="usul-drill-question">{currentDrill.questionAr}</h4>
						<div className="usul-drill-phrase-box">
							﴿{currentDrill.shahidPhraseAr}﴾
						</div>
						<DrillChoiceList
							options={currentDrill.options}
							selectedIndex={selectedOption}
							onSelect={setSelectedOption}
						/>
						{selectedOption !== null && (
							<div className="usul-feedback-banner">
								{currentDrill.hasQarinahSarifah &&
								currentDrill.qarinahTextAr ? (
									<p className="usul-feedback-text">
										القرينة الصارفة: ﴿{currentDrill.qarinahTextAr}﴾{" "}
										{currentDrill.qarinahVerseKey
											? `(آية ${currentDrill.qarinahVerseKey})`
											: ""}
									</p>
								) : (
									<p className="usul-feedback-text">
										عريت الصيغة عن القرائن الصارفة فبقيت جارية على أصل مقتضاها
										اللغوي والشرعي.
									</p>
								)}
							</div>
						)}
					</div>
				)}

				{currentDrill.mode === "LOCATE_SHAHID_SPAN" && (
					<div className="usul-drill-body">
						<h4 className="usul-drill-question">{currentDrill.promptAr}</h4>
						<div className="usul-span-tokens">
							{currentDrill.shahidPhraseAr
								.split(/\s+/)
								.map((wordToken, idx) => {
									const wordNum = currentDrill.wordStart + idx;
									const isSelected = selectedTokenIndex === wordNum;
									let btnClass = "usul-token-btn";
									if (spanClickResult !== null && isSelected) {
										btnClass += spanClickResult
											? " is-correct"
											: " is-incorrect";
									}
									return (
										<button
											key={`${wordNum}-${wordToken}`}
											type="button"
											className={btnClass}
											onClick={() => {
												setSelectedTokenIndex(wordNum);
												const valid = validateSpanClick(
													wordNum,
													currentDrill.wordStart,
													currentDrill.wordEnd,
												);
												setSpanClickResult(valid);
											}}
										>
											{wordToken}
										</button>
									);
								})}
						</div>
						{spanClickResult !== null && (
							<div className="usul-feedback-banner">
								{spanClickResult ? (
									<p className="usul-feedback-text is-success">
										✓ موضع دقيق! اللفظ المختار يقع ضمن الشاهد الأصولي المحدد
										(الكلمات {currentDrill.wordStart}–{currentDrill.wordEnd}).
									</p>
								) : (
									<p className="usul-feedback-text is-error">
										✗ الموضع المختار خارج نطاق الشاهد الأصولي المحدد.
									</p>
								)}
							</div>
						)}
					</div>
				)}

				{currentDrill.mode === "USULI_KHILAF_DRILL" && (
					<div className="usul-drill-body">
						<h4 className="usul-drill-question">{currentDrill.questionAr}</h4>
						<DrillChoiceList
							options={currentDrill.options}
							selectedIndex={selectedOption}
							onSelect={setSelectedOption}
						/>
						{selectedOption !== null && (
							<div className="usul-feedback-banner">
								<p className="usul-feedback-text">
									تحرير الخلاف: {currentDrill.khilafUsuliAr}
								</p>
							</div>
						)}
					</div>
				)}

				<div className="usul-drill-footer">
					<button
						type="button"
						className="usul-next-btn"
						onClick={handleNextDrill}
					>
						السؤال التالي ↻
					</button>
				</div>
			</div>
		</div>
	);
}

export function UsulSection({
	shawahid,
	allShawahid = [],
	onSelectWord,
	onNavigateAyah,
}: Props) {
	const { t, formatNumber } = useI18n();
	const [viewMode, setViewMode] = useState<ViewMode>("verse");
	const pool = allShawahid.length > 0 ? allShawahid : shawahid;

	return (
		<div className="usul-section-body" dir="rtl" lang="ar">
			<div className="usul-view-tabs" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={viewMode === "verse"}
					className={`usul-tab-btn ${viewMode === "verse" ? "is-active" : ""}`}
					onClick={() => setViewMode("verse")}
				>
					شواهد الآية ({formatNumber(shawahid.length)})
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={viewMode === "explore"}
					className={`usul-tab-btn ${viewMode === "explore" ? "is-active" : ""}`}
					onClick={() => setViewMode("explore")}
				>
					استكشاف وبحث أصولي ({formatNumber(pool.length)})
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={viewMode === "drill"}
					className={`usul-tab-btn ${viewMode === "drill" ? "is-active" : ""}`}
					onClick={() => setViewMode("drill")}
				>
					التدريب والاختبار (Quiz)
				</button>
			</div>

			{viewMode === "verse" && (
				<div className="usul-verse-mode-container">
					{shawahid.length === 0 ? (
						<div className="usul-empty-card">
							<p className="asbab-empty">{t.verse.noTreeTitle}</p>
							<p className="usul-empty-hint">
								لا توجد شواهد أصولية مسجلة لهذه الآية بالتحديد. يمكنك الانتقال
								إلى وضع الاستكشاف لتصفح جميع شواهد سورة البقرة.
							</p>
							<button
								type="button"
								className="usul-nav-verse-btn"
								onClick={() => setViewMode("explore")}
							>
								فتح الاستكشاف الأصولي ↗
							</button>
						</div>
					) : (
						shawahid.map((item, index) => (
							<UsulVerseCard
								key={item.id}
								item={item}
								index={index}
								onSelectWord={onSelectWord}
								onNavigateAyah={onNavigateAyah}
							/>
						))
					)}
				</div>
			)}

			{viewMode === "explore" && (
				<UsulExploreView searchPool={pool} onNavigateAyah={onNavigateAyah} />
			)}

			{viewMode === "drill" && (
				<UsulDrillView pool={pool} onNavigateAyah={onNavigateAyah} />
			)}
		</div>
	);
}
