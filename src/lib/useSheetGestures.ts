import {
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	useEffect,
	useRef,
} from "react";

/** Below this width the word sheet docks at the bottom of the screen. */
export const DOCKED_SHEET_QUERY = "(max-width: 1099px)";

const SETTLE = "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)";
/** Movement under this many px is a tap, not a drag. */
const TAP_SLOP = 6;
/** px/ms: a flick this fast commits regardless of distance. */
const FLICK = 0.6;

interface Drag {
	startY: number;
	lastY: number;
	lastT: number;
	velocity: number;
	dy: number;
	moved: boolean;
}

interface Options {
	/** Sheets with a taller state pass it; others just settle back. */
	expanded?: boolean;
	setExpanded?: (next: boolean) => void;
	/** Called once the sheet has slid off-screen. */
	onDismiss: () => void;
	/** Tap on the grab bar; defaults to toggling the taller state. */
	onTap?: () => void;
}

function settle(sheet: HTMLElement | null, offset: number | null) {
	if (!sheet) return;
	sheet.style.transition = SETTLE;
	sheet.style.transform = offset === null ? "" : `translateY(${offset}px)`;
}

function follow(sheet: HTMLElement | null, dy: number) {
	if (!sheet) return;
	sheet.style.transition = "none";
	// Downward tracks the finger 1:1; upward resists, hinting at "expand".
	sheet.style.transform = `translateY(${dy > 0 ? dy : dy / 4}px)`;
}

/**
 * The grab bar: drag down to put the sheet away (or collapse it when
 * expanded), drag up to expand, tap to toggle. Pointer events, so mouse and
 * pen drag the same way touch does.
 */
export function useSheetDrag(
	sheetRef: RefObject<HTMLElement | null>,
	{ expanded = false, setExpanded, onDismiss, onTap }: Options,
) {
	const drag = useRef<Drag | null>(null);
	const swallowClick = useRef(false);

	const finish = (drag: Drag) => {
		const sheet = sheetRef.current;
		const height = sheet?.offsetHeight ?? 0;
		const down =
			drag.dy > Math.min(120, height * 0.25) || drag.velocity > FLICK;
		const up = drag.dy < -48 || drag.velocity < -FLICK;
		if (down && drag.dy > 0) {
			// From full height, a moderate pull collapses; a long one dismisses.
			if (expanded && setExpanded && drag.dy < height * 0.5) {
				settle(sheet, null);
				setExpanded(false);
				return;
			}
			settle(sheet, height);
			// Already off-screen: skip any exit keyframes the sheet would replay.
			if (sheet) sheet.dataset.dragDismissed = "";
			window.setTimeout(onDismiss, 200);
			return;
		}
		settle(sheet, null);
		if (up && !expanded) setExpanded?.(true);
	};

	return {
		onPointerDown(event: ReactPointerEvent<HTMLElement>) {
			if (event.button !== 0) return;
			event.currentTarget.setPointerCapture(event.pointerId);
			drag.current = {
				startY: event.clientY,
				lastY: event.clientY,
				lastT: event.timeStamp,
				velocity: 0,
				dy: 0,
				moved: false,
			};
		},
		onPointerMove(event: ReactPointerEvent<HTMLElement>) {
			const current = drag.current;
			if (!current) return;
			const dt = Math.max(1, event.timeStamp - current.lastT);
			current.velocity = (event.clientY - current.lastY) / dt;
			current.lastY = event.clientY;
			current.lastT = event.timeStamp;
			current.dy = event.clientY - current.startY;
			if (Math.abs(current.dy) > TAP_SLOP) current.moved = true;
			if (current.moved) follow(sheetRef.current, current.dy);
		},
		onPointerUp() {
			const current = drag.current;
			drag.current = null;
			if (!current?.moved) return;
			swallowClick.current = true;
			finish(current);
		},
		onPointerCancel() {
			drag.current = null;
			settle(sheetRef.current, null);
		},
		onClick() {
			if (swallowClick.current) {
				swallowClick.current = false;
				return;
			}
			if (onTap) onTap();
			else setExpanded?.(!expanded);
		},
	};
}

/**
 * Docked only: a tap that lands outside the sheet puts it away, unless that
 * tap navigated (picking another word re-targets the sheet instead). Scroll
 * gestures never produce a click, so reading the verse never dismisses it.
 */
export function useDismissOnOutsideTap(
	sheetRef: RefObject<HTMLElement | null>,
	onDismiss: () => void,
) {
	const dismissRef = useRef(onDismiss);
	dismissRef.current = onDismiss;

	useEffect(() => {
		let armedAt: string | null = null;
		const onPointerDown = (event: PointerEvent) => {
			armedAt = null;
			if (!window.matchMedia(DOCKED_SHEET_QUERY).matches) return;
			const target = event.target as Element | null;
			if (!target || sheetRef.current?.contains(target)) return;
			// App chrome and dialogs keep working alongside the open sheet.
			if (target.closest(".topbar, .dock, .settings-backdrop, [role='dialog']"))
				return;
			armedAt = location.hash;
		};
		const onClick = () => {
			if (armedAt !== null && armedAt === location.hash) dismissRef.current();
			armedAt = null;
		};
		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("click", onClick);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("click", onClick);
		};
	}, [sheetRef]);
}
