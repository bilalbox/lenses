import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { LOCALES, type Locale } from "../lib/i18n/types";
import { BookIcon, CheckIcon, CloseIcon, MoonIcon, SunIcon } from "./Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onSelectTheme: (next: "light" | "dark") => void;
  quizHideDiacritics: boolean;
  onToggleQuizHideDiacritics: (next: boolean) => void;
  canInstall: boolean;
  onInstall: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  quizHideDiacritics,
  onToggleQuizHideDiacritics,
  canInstall,
  onInstall,
}: Props) {
  const { locale, setLocale, t } = useI18n();
  const touchY = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const [rendered, setRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      setRendered(true);
      setIsClosing(false);
    } else if (rendered && !isClosing) {
      setIsClosing(true);
      const timer = window.setTimeout(() => {
        setRendered(false);
        setIsClosing(false);
        triggerRef.current?.focus?.();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, rendered, isClosing]);

  useEffect(() => {
    if (!isOpen && !isClosing) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isClosing]);

  useEffect(() => {
    if (!rendered || isClosing || !modalRef.current) return;
    const dialog = modalRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0]?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const elements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rendered, isClosing, onClose]);

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
          onTouchStart={(event) => {
            touchY.current = event.touches[0]?.clientY ?? 0;
          }}
          onTouchEnd={(event) => {
            const end = event.changedTouches[0]?.clientY ?? touchY.current;
            if (end - touchY.current > 48) onClose();
          }}
          onClick={onClose}
        />

        <header className="settings-head">
          <h2 id="settings-title">{t.settings.title}</h2>
          <button
            type="button"
            className="icon-button"
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
          <h3>{t.settings.quizSection}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={quizHideDiacritics}
            className="settings-switch-card"
            onClick={() => onToggleQuizHideDiacritics(!quizHideDiacritics)}
          >
            <span className="settings-switch-content">
              <strong>{t.settings.quizDiacriticsLabel}</strong>
              <small>{t.settings.quizDiacriticsDescription}</small>
            </span>
            <span className={`settings-switch${quizHideDiacritics ? " is-on" : ""}`} aria-hidden="true">
              <span className="settings-switch-thumb" />
            </span>
          </button>
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
