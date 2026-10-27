import { phraseGloss, relationGloss } from "./glossary";
import type { GraphNode, SyntaxGraph } from "./types";

export interface Anchor {
	index: number;
	x: number;
	si?: number;
}

export interface Box {
	kind: "word" | "elide" | "ref" | "card";
	text: string;
	caption: string;
	sura?: number;
	verse?: number;
	word?: number;
	segment?: number;
	phrase?: number;
	outside: boolean;
	x: number;
	y: number;
	width: number;
	height: number;
	anchors: Anchor[];
}

export interface PhraseGeom {
	nodeIndex: number;
	label: string;
	x1: number;
	x2: number;
	y: number;
	cx: number;
	labelWidth: number;
	badgeTop: number;
}

export interface ArcGeom {
	rel: string;
	name: string;
	dependent: number;
	head: number;
	ends: number[];
	/** Index of this arc in `graph.edges`, stable when other edges are hidden. */
	source: number;
	plane: "under" | "over" | "crown";
	lane: number;
	paint: number;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	level: number;
	labelX: number;
	labelY: number;
	labelWidth: number;
	path: string;
}

export interface LeafFace {
	text: string;
	caption: string;
}

export interface TreeLayout {
	width: number;
	height: number;
	boxes: Box[];
	phrases: PhraseGeom[];
	arcs: ArcGeom[];
}

const BOX_H = 96;
const GAP = 16;
const PAD_X = 28;
const PAD_TOP = 24;
const PAD_BOT = 16;
const OVER_STEP = 40;
const UNDER_STEP = 36;
const PHRASE_STEP = 30;

const UNDER = new Set(["gen", "poss", "adj", "emph", "app", "spec"]);

export function layoutGraph(
	graph: SyntaxGraph,
	current: { sura: number; verse: number },
	measure: (text: string, caption: boolean) => number,
	face: (node: GraphNode, index: number) => LeafFace,
	folded: ReadonlySet<number> = new Set(),
): TreeLayout {
	const leaves: number[] = [];
	graph.nodes.forEach((node, index) => {
		if (node.t !== "ph") leaves.push(index);
	});

	const covered = new Set<number>();
	for (const phraseIndex of folded) {
		const node = graph.nodes[phraseIndex];
		if (node?.t !== "ph" || node.from === undefined || node.to === undefined)
			continue;
		for (let index = node.from; index <= node.to; index += 1) {
			const n = graph.nodes[index];
			if (n && n.t !== "ph") covered.add(index);
		}
	}

	type Row =
		| { kind: "leaf"; nodeIndex: number }
		| { kind: "card"; phraseIndex: number; members: number[] };

	const row: Row[] = [];
	let cursor = 0;
	while (cursor < leaves.length) {
		const nodeIndex = leaves[cursor];
		if (nodeIndex === undefined) break;
		if (!covered.has(nodeIndex)) {
			row.push({ kind: "leaf", nodeIndex });
			cursor += 1;
			continue;
		}
		const phraseIndex = phraseCovering(graph, folded, nodeIndex);
		const members: number[] = [];
		while (cursor < leaves.length) {
			const leaf = leaves[cursor];
			if (leaf === undefined || !covered.has(leaf)) break;
			const nextPhrase = phraseCovering(graph, folded, leaf);
			if (nextPhrase !== phraseIndex) break;
			members.push(leaf);
			cursor += 1;
		}
		if (phraseIndex === undefined)
			row.push({ kind: "leaf", nodeIndex: members[0] ?? nodeIndex });
		else row.push({ kind: "card", phraseIndex, members });
	}

	const drafts = row.map((item) => {
		if (item.kind === "card") {
			const parts = item.members.map((nodeIndex) => {
				const n = graph.nodes[nodeIndex];
				return face(n ?? { t: "seg" }, nodeIndex).text;
			});
			const text = parts.join(" ");
			const label = phraseGloss(graph.nodes[item.phraseIndex]?.p || "S").name;
			const width = Math.max(
				measure(text, false) + 28,
				measure(label, true) + 22,
				72,
			);
			return {
				item,
				text,
				caption: label,
				width,
				outside: false,
				kind: "card" as const,
			};
		}
		const node = graph.nodes[item.nodeIndex];
		const shown = face(node ?? { t: "seg" }, item.nodeIndex);
		let kind: Box["kind"] = "word";
		let caption = shown.caption;
		if (node?.t === "elide") kind = "elide";
		else if (node?.t === "ref") kind = "ref";
		const outside =
			node?.t !== "elide" &&
			(node?.s !== current.sura || node?.v !== current.verse);
		if (outside && node?.s && node?.v) caption = `${node.s}:${node.v}`;
		const width = Math.max(
			measure(shown.text, false) + 28,
			measure(caption, true) + 18,
			54,
		);
		return { item, text: shown.text, caption, width, outside, kind };
	});

	const width =
		PAD_X * 2 +
		drafts.reduce((sum, box) => sum + box.width, 0) +
		GAP * Math.max(0, drafts.length - 1);

	let right = width - PAD_X;
	const boxes: Box[] = drafts.map((draft) => {
		const x = right - draft.width;
		right = x - GAP;
		const leaf =
			draft.item.kind === "leaf"
				? graph.nodes[draft.item.nodeIndex]
				: undefined;
		const firstMember =
			draft.item.kind === "card" ? draft.item.members[0] : undefined;
		const member =
			firstMember !== undefined ? graph.nodes[firstMember] : undefined;
		return {
			kind: draft.kind,
			text: draft.text,
			caption: draft.caption,
			sura: leaf?.s ?? member?.s,
			verse: leaf?.v ?? member?.v,
			word: leaf?.w,
			segment: leaf?.si,
			phrase: draft.item.kind === "card" ? draft.item.phraseIndex : undefined,
			outside: draft.outside,
			x,
			y: 0,
			width: draft.width,
			height: BOX_H,
			anchors: [
				{
					index:
						draft.item.kind === "leaf"
							? draft.item.nodeIndex
							: draft.item.phraseIndex,
					x: x + draft.width / 2,
					si: leaf?.si,
				},
			],
		};
	});

	const homeOfNode = new Map<number, number>();
	boxes.forEach((_, boxIndex) => {
		const draft = drafts[boxIndex];
		if (!draft) return;
		const item = draft.item;
		if (item.kind === "leaf") homeOfNode.set(item.nodeIndex, boxIndex);
		else {
			homeOfNode.set(item.phraseIndex, boxIndex);
			for (const member of item.members) homeOfNode.set(member, boxIndex);
		}
	});

	const centerOf = (nodeIndex: number): number => {
		const boxIndex = homeOfNode.get(nodeIndex);
		if (boxIndex !== undefined) {
			const box = boxes[boxIndex];
			if (box) return box.x + box.width / 2;
		}
		const node = graph.nodes[nodeIndex];
		if (node?.t === "ph" && node.from !== undefined && node.to !== undefined) {
			return (centerOf(node.from) + centerOf(node.to)) / 2;
		}
		return PAD_X;
	};

	const openPhrases = graph.nodes
		.map((node, index) => ({ node, index }))
		.filter(
			(item) =>
				item.node.t === "ph" &&
				item.node.from !== undefined &&
				item.node.to !== undefined &&
				!folded.has(item.index),
		);

	const spans = openPhrases.map((item) => {
		const x1 = centerOf(item.node.from ?? item.index);
		const x2 = centerOf(item.node.to ?? item.index);
		return {
			index: item.index,
			label: phraseGloss(item.node.p || "S").name,
			x1: Math.min(x1, x2),
			x2: Math.max(x1, x2),
		};
	});
	const phraseLane = laneBySpan(
		spans.map((span) => ({
			lo: span.x1,
			hi: span.x2,
			span: span.x2 - span.x1,
		})),
	);

	type DraftEdge = {
		edge: SyntaxGraph["edges"][number];
		source: number;
		plane: "under" | "over" | "crown";
		lo: number;
		hi: number;
		span: number;
		from: number;
		to: number;
	};

	const draftEdges: DraftEdge[] = [];
	graph.edges.forEach((edge, source) => {
		const from = homeOfNode.get(edge.d);
		const toHome = homeOfNode.get(edge.h);
		const headIsOpenPhrase =
			graph.nodes[edge.h]?.t === "ph" && !folded.has(edge.h);
		const depIsOpenPhrase =
			graph.nodes[edge.d]?.t === "ph" && !folded.has(edge.d);
		if (
			from !== undefined &&
			toHome !== undefined &&
			from === toHome &&
			!headIsOpenPhrase &&
			!depIsOpenPhrase
		)
			return;
		const fromBox = from !== undefined ? boxes[from] : undefined;
		const toBox = toHome !== undefined ? boxes[toHome] : undefined;
		const x1 =
			fromBox !== undefined ? fromBox.x + fromBox.width / 2 : centerOf(edge.d);
		const x2 =
			headIsOpenPhrase || depIsOpenPhrase
				? centerOf(edge.h)
				: toBox !== undefined
					? toBox.x + toBox.width / 2
					: centerOf(edge.h);
		const crown = headIsOpenPhrase || depIsOpenPhrase;
		draftEdges.push({
			edge,
			source,
			plane: crown ? "crown" : UNDER.has(edge.r) ? "under" : "over",
			lo: Math.min(x1, x2),
			hi: Math.max(x1, x2),
			span: Math.abs(x2 - x1),
			from: from ?? -1,
			to: toHome ?? -1,
		});
	});

	const laneFor = (plane: DraftEdge["plane"]) =>
		laneBySpan(
			draftEdges
				.filter((item) => item.plane === plane)
				.map((item) => ({ lo: item.lo, hi: item.hi, span: item.span })),
		);

	const underLanes = laneFor("under");
	const overLanes = laneFor("over");
	const crownLanes = laneFor("crown");
	const laneOf = new Map<DraftEdge, number>();
	const writeLanes = (plane: DraftEdge["plane"], lanes: number[]) => {
		let cursorLane = 0;
		for (const item of draftEdges) {
			if (item.plane !== plane) continue;
			laneOf.set(item, lanes[cursorLane] ?? 0);
			cursorLane += 1;
		}
	};
	writeLanes("under", underLanes);
	writeLanes("over", overLanes);
	writeLanes("crown", crownLanes);

	const overDepth = overLanes.length ? Math.max(...overLanes) + 1 : 0;
	const underDepth = underLanes.length ? Math.max(...underLanes) + 1 : 0;
	const crownDepth = crownLanes.length ? Math.max(...crownLanes) + 1 : 0;
	const phraseDepth = phraseLane.length ? Math.max(...phraseLane) + 1 : 0;
	const overBand = overDepth === 0 ? 0 : 28 + (overDepth - 1) * OVER_STEP;
	const crownBand = crownDepth === 0 ? 0 : 36 + (crownDepth - 1) * OVER_STEP;
	const phraseBand =
		phraseDepth === 0 ? 0 : 36 + (phraseDepth - 1) * PHRASE_STEP;
	const wordTop = PAD_TOP + phraseBand + crownBand + overBand + 18;
	const underBand = underDepth === 0 ? 0 : 24 + (underDepth - 1) * UNDER_STEP;
	const height = wordTop + BOX_H + underBand + PAD_BOT + (underDepth ? 18 : 0);
	for (const box of boxes) box.y = wordTop;

	const topPeak = wordTop - 24 - Math.max(0, overDepth - 1) * OVER_STEP;
	const phrases: PhraseGeom[] = spans.map((span, index) => {
		const lane = phraseLane[index] ?? 0;
		const y = topPeak - 46 - crownBand - lane * PHRASE_STEP;
		const labelWidth = measure(span.label, true) + 18;
		return {
			nodeIndex: span.index,
			label: span.label,
			x1: span.x1,
			x2: span.x2,
			y,
			cx: (span.x1 + span.x2) / 2,
			labelWidth,
			badgeTop: y - 24,
		};
	});
	const phraseByIndex = new Map(
		phrases.map((phrase) => [phrase.nodeIndex, phrase]),
	);

	type PortUse = { edge: DraftEdge; other: number; role: "d" | "h" };
	const boxPorts = new Map<number, { top: PortUse[]; bottom: PortUse[] }>();
	const ensurePorts = (boxIndex: number) => {
		const found = boxPorts.get(boxIndex);
		if (found) return found;
		const created = { top: [] as PortUse[], bottom: [] as PortUse[] };
		boxPorts.set(boxIndex, created);
		return created;
	};

	for (const item of draftEdges) {
		const under = item.plane === "under";
		if (item.from >= 0) {
			const toBox = item.to >= 0 ? boxes[item.to] : undefined;
			const other =
				toBox !== undefined
					? toBox.x + toBox.width / 2
					: (item.lo + item.hi) / 2;
			ensurePorts(item.from)[under ? "bottom" : "top"].push({
				edge: item,
				other,
				role: "d",
			});
		}
		if (
			item.to >= 0 &&
			!(graph.nodes[item.edge.h]?.t === "ph" && !folded.has(item.edge.h))
		) {
			const fromBox = item.from >= 0 ? boxes[item.from] : undefined;
			const other =
				fromBox !== undefined
					? fromBox.x + fromBox.width / 2
					: (item.lo + item.hi) / 2;
			ensurePorts(item.to)[under ? "bottom" : "top"].push({
				edge: item,
				other,
				role: "h",
			});
		}
	}

	const portX = new Map<string, number>();
	for (const [boxIndex, sides] of boxPorts) {
		const box = boxes[boxIndex];
		if (!box) continue;
		for (const side of ["top", "bottom"] as const) {
			const uses = sides[side].slice().sort((a, b) => a.other - b.other);
			uses.forEach((use, index) => {
				portX.set(
					`${itemKey(use.edge)}:${use.role}`,
					portAlong(box.x, box.width, index, uses.length, use.other),
				);
			});
		}
	}

	const pointFor = (item: DraftEdge, role: "d" | "h") => {
		const nodeIndex = role === "d" ? item.edge.d : item.edge.h;
		const phrase = phraseByIndex.get(nodeIndex);
		if (phrase && !folded.has(nodeIndex)) {
			const uses = draftEdges.filter(
				(other) =>
					(other.edge.d === nodeIndex || other.edge.h === nodeIndex) &&
					other.plane === "crown",
			);
			const ordered = uses.slice().sort((a, b) => a.lo - b.lo);
			const index = Math.max(0, ordered.indexOf(item));
			const x =
				ordered.length <= 1
					? phrase.cx
					: portAlong(
							phrase.cx - phrase.labelWidth / 2,
							phrase.labelWidth,
							index,
							ordered.length,
							(item.lo + item.hi) / 2,
						);
			return { x, y: phrase.badgeTop - 1 };
		}
		const boxIndex = homeOfNode.get(nodeIndex);
		if (boxIndex === undefined) return { x: centerOf(nodeIndex), y: wordTop };
		const box = boxes[boxIndex];
		if (!box) return { x: centerOf(nodeIndex), y: wordTop };
		const x = portX.get(`${itemKey(item)}:${role}`) ?? box.x + box.width / 2;
		const under = item.plane === "under";
		return { x, y: under ? box.y + BOX_H + 1 : box.y - 1 };
	};

	const routed = draftEdges.map((item) => {
		const start = pointFor(item, "d");
		const end = pointFor(item, "h");
		const lane = laneOf.get(item) ?? 0;
		return { item, start, end, lane };
	});

	const placed = routed.map(({ item, start, end, lane }) => {
		const labelWidth = measure(relationGloss(item.edge.r).name, true) + 16;
		let level = wordTop - 24 - lane * OVER_STEP;
		if (item.plane === "under")
			level = wordTop + BOX_H + 26 + lane * UNDER_STEP;
		if (item.plane === "crown") {
			const own =
				phraseByIndex.get(item.edge.h)?.badgeTop ??
				phraseByIndex.get(item.edge.d)?.badgeTop ??
				wordTop - 80;
			// A crown arc used to clear only its own badge. An outer phrase chip
			// (جملة فعلية above جار ومجرور) then sat on the label. Lift the run
			// above every phrase chip the span crosses.
			level = crownLevel(own, start.x, end.x, lane, labelWidth, phrases);
		}
		return { item, start, end, lane, level, labelWidth };
	});

	const minTop = Math.min(
		wordTop,
		...phrases.map((phrase) => phrase.badgeTop),
		...placed.map((item) => item.level - 18),
	);
	const shift = Math.max(0, 12 - minTop);
	if (shift) {
		for (const box of boxes) box.y += shift;
		for (const phrase of phrases) {
			phrase.y += shift;
			phrase.badgeTop += shift;
		}
		for (const item of placed) {
			item.start.y += shift;
			item.end.y += shift;
			item.level += shift;
		}
	}

	const arcs: ArcGeom[] = placed.map(
		({ item, start, end, lane, level, labelWidth }) => {
			const above = item.plane !== "under";
			const hops = placed.flatMap((other) => {
				if (other === undefined || other.level === level) return [];
				return [other.start, other.end].flatMap((tip) => {
					const low = Math.min(tip.y, other.level);
					const high = Math.max(tip.y, other.level);
					const lo = Math.min(start.x, end.x);
					const hi = Math.max(start.x, end.x);
					const crosses =
						tip.x > lo + 16 &&
						tip.x < hi - 16 &&
						level > low + 6 &&
						level < high - 6;
					return crosses ? [tip.x] : [];
				});
			});
			const path = elbow(start.x, start.y, end.x, end.y, level, hops, above);
			const name = relationGloss(item.edge.r).name;
			const ends = [item.edge.d, item.edge.h];
			const fromBox = item.from >= 0 ? boxes[item.from] : undefined;
			if (fromBox?.phrase !== undefined) ends.push(fromBox.phrase as number);
			const toBox = item.to >= 0 ? boxes[item.to] : undefined;
			if (toBox?.phrase !== undefined) ends.push(toBox.phrase as number);
			return {
				rel: item.edge.r,
				name,
				dependent: item.edge.d,
				head: item.edge.h,
				ends,
				source: item.source,
				plane: item.plane,
				lane,
				paint:
					(item.plane === "under" ? 0 : item.plane === "over" ? 100 : 200) +
					lane,
				x1: start.x,
				y1: start.y,
				x2: end.x,
				y2: end.y,
				level,
				labelX: placeArcLabel(
					(start.x + end.x) / 2,
					level,
					labelWidth,
					start.x,
					end.x,
					phrases,
				),
				labelY: level + 4,
				labelWidth,
				path,
			};
		},
	);

	return { width, height: height + shift, boxes, phrases, arcs };
}

/** Chip rect in DependencyTree: y = labelY - 14, height 20, and labelY = level + 4. */
const CHIP_BELOW = 10;
const CHIP_ABOVE = 10;

function crownLevel(
	ownTop: number,
	startX: number,
	endX: number,
	lane: number,
	labelWidth: number,
	phrases: PhraseGeom[],
) {
	const mid = (startX + endX) / 2;
	const half = labelWidth / 2;
	const lo = Math.min(startX, endX, mid - half);
	const hi = Math.max(startX, endX, mid + half);
	let ceiling = ownTop;
	for (const phrase of phrases) {
		const left = phrase.cx - phrase.labelWidth / 2;
		const right = phrase.cx + phrase.labelWidth / 2;
		if (right > lo + 2 && left < hi - 2)
			ceiling = Math.min(ceiling, phrase.badgeTop);
	}
	const clearingForeign = ceiling < ownTop - 0.5;
	const air = clearingForeign ? CHIP_BELOW + 18 : 20;
	return ceiling - air - lane * OVER_STEP;
}

function placeArcLabel(
	x: number,
	level: number,
	labelWidth: number,
	x1: number,
	x2: number,
	phrases: PhraseGeom[],
) {
	const half = labelWidth / 2;
	const top = level - CHIP_ABOVE;
	const bottom = level + CHIP_BELOW;
	const blocks = phrases.filter(
		(phrase) => bottom > phrase.badgeTop && top < phrase.badgeTop + 20,
	);
	const hits = (candidate: number) =>
		blocks.some((phrase) => {
			const left = phrase.cx - phrase.labelWidth / 2 - 4;
			const right = phrase.cx + phrase.labelWidth / 2 + 4;
			return candidate + half > left && candidate - half < right;
		});
	if (!hits(x)) return x;
	const lo = Math.min(x1, x2);
	const hi = Math.max(x1, x2);
	for (let delta = 8; delta <= hi - lo + labelWidth; delta += 8) {
		for (const candidate of [x + delta, x - delta]) {
			if (candidate - half < lo - 2 || candidate + half > hi + 2) continue;
			if (!hits(candidate)) return candidate;
		}
	}
	return x;
}

function phraseCovering(
	graph: SyntaxGraph,
	folded: ReadonlySet<number>,
	nodeIndex: number,
) {
	let found: number | undefined;
	let tight = Infinity;
	for (const phraseIndex of folded) {
		const node = graph.nodes[phraseIndex];
		if (node?.from === undefined || node.to === undefined) continue;
		if (nodeIndex < node.from || nodeIndex > node.to) continue;
		const span = node.to - node.from;
		if (span < tight) {
			tight = span;
			found = phraseIndex;
		}
	}
	return found;
}

function laneBySpan(items: { lo: number; hi: number; span: number }[]) {
	const order = items
		.map((item, index) => ({ ...item, index }))
		.sort((a, b) => a.span - b.span || a.lo - b.lo);
	const lanes: [number, number][][] = [];
	const assigned = new Array<number>(items.length);
	for (const item of order) {
		let lane = 0;
		while (lanes[lane]?.some(([lo, hi]) => !(item.hi < lo || item.lo > hi)))
			lane += 1;
		let currentLane = lanes[lane];
		if (!currentLane) {
			currentLane = [];
			lanes[lane] = currentLane;
		}
		currentLane.push([item.lo - 12, item.hi + 12]);
		assigned[item.index] = lane;
	}
	return assigned;
}

function portAlong(
	x: number,
	width: number,
	index: number,
	count: number,
	other: number,
) {
	const inset = Math.min(18, Math.max(8, width * 0.18));
	if (count <= 1) {
		const center = x + width / 2;
		const shift = Math.min(width * 0.22, 16);
		return center + Math.sign(other - center || 1) * shift;
	}
	const left = x + inset;
	const right = x + width - inset;
	return left + ((right - left) * index) / (count - 1);
}

function itemKey(item: { edge: { r: string; d: number; h: number } }) {
	return `${item.edge.r}:${item.edge.d}:${item.edge.h}`;
}

function elbow(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	level: number,
	hops: number[],
	above: boolean,
) {
	const gap = x2 - x1;
	const dir = gap === 0 ? 1 : Math.sign(gap);
	if (Math.abs(gap) < 22) {
		const bulge = above ? -18 : 18;
		return `M ${x1} ${y1} C ${x1 + bulge} ${level}, ${x2 + bulge} ${level}, ${x2} ${y2}`;
	}
	const lead = Math.min(26, Math.abs(gap) / 3);
	const startX = x1 + dir * lead;
	const endX = x2 - dir * lead;
	const radius = 6;
	const unique = [...new Set(hops.map((hop) => Math.round(hop)))].filter(
		(hop) => {
			return (
				(hop - startX) * dir > radius + 4 && (endX - hop) * dir > radius + 4
			);
		},
	);
	unique.sort((a, b) => (a - b) * dir);
	let path = `M ${x1} ${y1} C ${x1} ${level}, ${x1} ${level}, ${round(startX)} ${round(level)}`;
	for (const hop of unique) {
		const sweep = above ? (dir > 0 ? 0 : 1) : dir > 0 ? 1 : 0;
		path += ` L ${round(hop - dir * radius)} ${round(level)}`;
		path += ` A ${radius} ${radius} 0 0 ${sweep} ${round(hop + dir * radius)} ${round(level)}`;
	}
	path += ` L ${round(endX)} ${round(level)}`;
	path += ` C ${round(x2)} ${round(level)}, ${round(x2)} ${round(level)}, ${round(x2)} ${round(y2)}`;
	return path;
}

function round(value: number) {
	return Math.round(value * 10) / 10;
}
