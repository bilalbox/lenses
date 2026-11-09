import {
	type KeyboardEvent,
	type ReactNode,
	useId,
	useRef,
	useState,
} from "react";

export interface TabItem {
	key: string;
	label: string;
	content: ReactNode;
}

interface Props {
	/** localStorage key that remembers the reader's last tab. */
	storageKey: string;
	/** Accessible name of the tab list. */
	label: string;
	items: TabItem[];
}

function remembered(storageKey: string, items: TabItem[]): string {
	try {
		const stored = localStorage.getItem(storageKey);
		if (stored && items.some((item) => item.key === stored)) return stored;
	} catch {
		// storage blocked (private mode): fall back to the first tab
	}
	return items[0]?.key ?? "";
}

/** Tabs that remember the last one chosen; arrow keys move between them. */
export function Tabs({ storageKey, label, items }: Props) {
	const [active, setActive] = useState(() => remembered(storageKey, items));
	const id = useId();
	const buttons = useRef<(HTMLButtonElement | null)[]>([]);
	const current = items.find((item) => item.key === active) ?? items[0];

	const choose = (key: string) => {
		setActive(key);
		try {
			localStorage.setItem(storageKey, key);
		} catch {
			// not remembered; the choice still applies
		}
	};

	const onKeyDown = (event: KeyboardEvent, index: number) => {
		const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
		const step: Record<string, number> = {
			ArrowRight: rtl ? -1 : 1,
			ArrowLeft: rtl ? 1 : -1,
		};
		let next = index + (step[event.key] ?? 0);
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = items.length - 1;
		if (next === index) return;
		event.preventDefault();
		// Arrow keys elsewhere page through verses; on a tab they only move the tab.
		event.stopPropagation();
		const target = items[(next + items.length) % items.length];
		if (!target) return;
		choose(target.key);
		buttons.current[items.indexOf(target)]?.focus();
	};

	return (
		<>
			<div className="tabs" role="tablist" aria-label={label}>
				{items.map((item, index) => (
					<button
						key={item.key}
						ref={(el) => {
							buttons.current[index] = el;
						}}
						type="button"
						role="tab"
						id={`${id}-${item.key}`}
						aria-selected={item === current}
						aria-controls={`${id}-panel`}
						tabIndex={item === current ? 0 : -1}
						className={item === current ? "is-on" : ""}
						onClick={() => choose(item.key)}
						onKeyDown={(event) => onKeyDown(event, index)}
					>
						{item.label}
					</button>
				))}
			</div>
			<div
				id={`${id}-panel`}
				role="tabpanel"
				aria-labelledby={current ? `${id}-${current.key}` : undefined}
			>
				{current?.content}
			</div>
		</>
	);
}
