import type { StructureBlock, SurahStructureFile } from "../../lib/types";
import { DiptychFoldout } from "./DiptychFoldout";
import { MunasabatCard } from "./MunasabatCard";

interface Props {
	structure: SurahStructureFile;
	currentVerse: number;
	onSelectBlock: (block: StructureBlock) => void;
	onJumpSurah: (sura: number) => void;
}

export function StructureSection({
	structure,
	currentVerse,
	onSelectBlock,
	onJumpSurah,
}: Props) {
	return (
		<div className="structure-section">
			<DiptychFoldout
				structure={structure}
				currentVerse={currentVerse}
				onSelectBlock={onSelectBlock}
			/>
			<MunasabatCard structure={structure} onJump={onJumpSurah} />
		</div>
	);
}
