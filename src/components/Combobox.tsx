import {
	type KeyboardEvent,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { stripDiacritics } from "../lib/arabic";

export interface ComboboxOption {
	/** Arabic term shown as the option's title. */
	name: string;
	value: string;
	/** One-line gloss in the reader's language; also searched. */
	about: string;
}

interface Props {
	label: string;
	options: ComboboxOption[];
	value: string;
	/** Shown in the empty input; the selected option's name replaces it. */
	placeholder: string;
	emptyText: string;
	clearLabel: string;
	onChange: (value: string) => void;
}

const fold = (text: string) => stripDiacritics(text).toLowerCase();

/**
 * Lower is better: name prefix, exact code, name substring, the gloss's leading
 * term ("Verb: …"), any gloss word, then any substring.
 */
function matchRank(option: ComboboxOption, needle: string): number {
	const name = fold(option.name);
	if (name.startsWith(needle)) return 0;
	if (option.value.toLowerCase().split(",").includes(needle)) return 1;
	if (name.includes(needle)) return 2;
	const about = fold(option.about);
	if (about.startsWith(needle)) return 3;
	if (about.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(needle)))
		return 4;
	return about.includes(needle) ? 5 : -1;
}

/** Index the arrow, Home and End keys move to; undefined for any other key. */
function nextIndex(key: string, current: number, count: number) {
	const last = count - 1;
	const moves: Record<string, number> = {
		ArrowDown: Math.min(current + 1, last),
		ArrowUp: Math.max(current - 1, 0),
		Home: 0,
		End: last,
	};
	return moves[key];
}

/**
 * Single-select, type-to-filter picker (WAI-ARIA combobox with a listbox popup).
 * Typing matches the Arabic name, the gloss and the code, ignoring diacritics.
 */
export function Combobox({
	label,
	options,
	value,
	placeholder,
	emptyText,
	clearLabel,
	onChange,
}: Props) {
	const id = useId();
	const listId = `${id}-list`;
	const inputId = `${id}-input`;
	const listRef = useRef<HTMLDivElement>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const [active, setActive] = useState(0);

	const selected = options.find((o) => o.value === value);
	const matches = useMemo(() => {
		const needle = fold(text.trim());
		if (!needle) return options;
		return options
			.map((option) => ({ option, rank: matchRank(option, needle) }))
			.filter((m) => m.rank >= 0)
			.sort((x, y) => x.rank - y.rank)
			.map((m) => m.option);
	}, [options, text]);

	useEffect(() => {
		if (!open) return;
		listRef.current
			?.querySelector(`#${CSS.escape(`${id}-opt-${active}`)}`)
			?.scrollIntoView({ block: "nearest" });
	}, [active, open, id]);

	// Bring the whole popup on screen (above the phone dock) when it opens.
	useEffect(() => {
		if (!open) return;
		const frame = requestAnimationFrame(() => {
			const list = listRef.current;
			if (!list) return;
			const room = window.innerHeight - list.getBoundingClientRect().bottom;
			if (room < 80) rootRef.current?.scrollIntoView({ block: "start" });
		});
		return () => cancelAnimationFrame(frame);
	}, [open]);

	const openList = () => {
		setOpen(true);
		setActive(Math.max(matches.indexOf(selected as ComboboxOption), 0));
	};
	const close = () => {
		setOpen(false);
		setText("");
	};
	const pick = (option: ComboboxOption) => {
		onChange(option.value);
		close();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Escape") {
			if (open) event.preventDefault();
			close();
			return;
		}
		if (event.key === "Enter") {
			const option = open ? matches[active] : undefined;
			if (option) {
				event.preventDefault();
				pick(option);
			}
			return;
		}
		const to = nextIndex(event.key, active, matches.length);
		if (to === undefined) return;
		event.preventDefault();
		if (!open) openList();
		else setActive(to);
	};

	const activeOption = open ? matches[active] : undefined;
	/** Options never hold focus (it stays on the input); this only satisfies a11y lint. */
	const onOptionKey = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" && activeOption) pick(activeOption);
	};

	return (
		<div ref={rootRef} className="combobox">
			<label className="combobox-label" htmlFor={inputId}>
				{label}
			</label>
			<div className="combobox-field">
				<input
					id={inputId}
					role="combobox"
					aria-expanded={open}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={
						activeOption ? `${id}-opt-${active}` : undefined
					}
					dir="auto"
					autoComplete="off"
					spellCheck={false}
					className={selected ? "has-value" : undefined}
					value={open ? text : (selected?.name ?? "")}
					placeholder={open && selected ? selected.name : placeholder}
					onFocus={openList}
					onClick={() => {
						if (!open) openList();
					}}
					onBlur={close}
					onChange={(event) => {
						setText(event.target.value);
						setActive(0);
						setOpen(true);
					}}
					onKeyDown={onKeyDown}
				/>
				{selected ? (
					<button
						type="button"
						className="combobox-clear"
						aria-label={clearLabel}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => onChange("")}
					>
						×
					</button>
				) : null}
			</div>
			{open ? (
				<div
					ref={listRef}
					id={listId}
					role="listbox"
					aria-labelledby={inputId}
					className="combobox-list"
				>
					{matches.length === 0 ? (
						<p className="combobox-empty" aria-live="polite">
							{emptyText}
						</p>
					) : (
						matches.map((option, index) => (
							<div
								key={option.value}
								id={`${id}-opt-${index}`}
								role="option"
								tabIndex={-1}
								aria-selected={option.value === value}
								className={`combobox-option${index === active ? " is-active" : ""}`}
								onMouseDown={(event) => event.preventDefault()}
								onMouseMove={() => setActive(index)}
								onClick={() => pick(option)}
								onKeyDown={onOptionKey}
							>
								<b lang="ar" dir="rtl">
									{option.name}
								</b>
								{option.about ? <small dir="auto">{option.about}</small> : null}
							</div>
						))
					)}
				</div>
			) : null}
		</div>
	);
}
