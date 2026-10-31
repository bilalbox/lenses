import { type RefObject, useEffect, useRef, useState } from "react";

export function useModalLifecycle(
	isOpen: boolean,
	onClose: () => void,
	dialogRef: RefObject<HTMLElement | null>,
) {
	const [rendered, setRendered] = useState(isOpen);
	const [isClosing, setIsClosing] = useState(false);
	const triggerRef = useRef<HTMLElement | null>(null);
	// Callers pass inline closures; reading through a ref keeps the trap effect
	// from re-running (and re-focusing the first control) on every parent render.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		if (isOpen) {
			triggerRef.current = document.activeElement as HTMLElement | null;
			setRendered(true);
			setIsClosing(false);
			return undefined;
		}
		if (rendered && !isClosing) {
			setIsClosing(true);
			const timer = window.setTimeout(() => {
				setRendered(false);
				setIsClosing(false);
				triggerRef.current?.focus?.();
			}, 200);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isOpen, rendered, isClosing]);

	// Lock body scroll
	useEffect(() => {
		if (!isOpen && !isClosing) return;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen, isClosing]);

	// Trap focus and dismiss on Escape
	useEffect(() => {
		if (!rendered || isClosing || !dialogRef.current) return;
		const dialog = dialogRef.current;
		const focusable = dialog.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		if (focusable.length > 0) {
			focusable[0]?.focus();
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onCloseRef.current();
				return;
			}
			if (event.key === "Tab") {
				const elements = dialog.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				);
				if (elements.length === 0) return;
				const first = elements[0];
				const last = elements[elements.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last?.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first?.focus();
				}
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [rendered, isClosing, dialogRef]);

	return { rendered, isClosing };
}
