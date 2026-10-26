---
name: Lenses (عدسات)
description: Quranic Arabic morphology, dependency treebank, and classical iʿrāb reader.
colors:
  primary: "#0f6e66"
  primary-dark: "#3dbea8"
  secondary: "#9a6432"
  secondary-dark: "#e0b15a"
  accent-crimson: "#8c3d4b"
  accent-crimson-dark: "#e08a96"
  accent-slate: "#2c4c7c"
  accent-slate-dark: "#9eb6de"
  neutral-bg: "#f3efe6"
  neutral-bg-dark: "#101311"
  neutral-surface: "#fffdf8"
  neutral-surface-dark: "#171d1a"
  neutral-surface-alt: "#e7e0d2"
  neutral-surface-alt-dark: "#1b221e"
  text-ink: "#1c1915"
  text-ink-dark: "#f4efe6"
  text-muted: "#6f675e"
  text-muted-dark: "#b7aea2"
  border-line: "#e3d9c8"
  border-line-dark: "#2d3832"
typography:
  display:
    fontFamily: '"Scheherazade New", "Amiri", serif'
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  headline:
    fontFamily: 'Literata, "Iowan Old Style", Georgia, serif'
    fontSize: "clamp(1.4rem, 3.5vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: '"Noto Sans Arabic", sans-serif'
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "0.35rem"
  sm: "0.55rem"
  md: "0.75rem"
  lg: "1.2rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.7rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.7rem"
  chip-grammar:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.65rem"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.lg}"
    padding: "1rem 1.15rem"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-ink}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 0.9rem"
---

# Design System: Lenses (عدسات)

## Overview

**Creative North Star: "The Linguistic Observatory"**

Lenses is a precision instrument designed for the deep, contemplative study of Quranic Arabic grammar (*naḥw*), morphology (*ṣarf*), and rhetoric (*balāghah*). Like astronomical instrumentation mapping the celestial sphere, the interface maps linguistic structure with quiet, disciplined clarity. Syntactic dependencies, morphological segments, and classical *iʿrāb* layers are rendered as crisp, interconnected nodes that invite focused intellectual inquiry without visual distraction.

The interface adheres to an aesthetic of deliberate restraint: warm parchment and obsidian canvas surfaces, fine hairline structural boundaries, and refined classical typography. Controls and cards do not announce themselves as software chrome; they remain minimal and unobtrusive, allowing the sacred Uthmani text and analytical diagrams to command the reader's full attention.

**Key Characteristics:**
- **Analytical Clarity:** Grammar relations, dependencies, and phonetic features are prioritized as first-class visual data.
- **Minimal Chrome:** Controls and containers recede; there are no decorative borders, no drop-shadow noise, and no artificial gradients.
- **Harmonious Dual-Mode Palette:** Warm studio parchment in light mode and deep obsidian in dark mode, both engineered for hours of continuous reading.
- **Rigorously Bidirectional:** Seamless orchestration of Right-to-Left (RTL) Arabic typography alongside Left-to-Right (LTR) commentary and metadata.

## Colors

The Modern Semantic Studio palette draws inspiration from classical botanical ink formulations—indigo, madder, gallnut kohl, and verdigris—translated into modern functional roles.

### Primary
- **Quranic Teal** (`#0f6e66` in light, `#3dbea8` in dark): The primary identity and active selection color. Represents the anchor of reading, current word focus, clause dependencies, and affirmative navigation.

### Secondary
- **Grammar Amber** (`#9a6432` in light, `#e0b15a` in dark): Used for secondary grammatical roles, nominal relations, rhetorical highlights (*tashbīh*, *ḥadhf*), and classical citation badges.

### Tertiary
- **Crimson / Madder Rose** (`#8c3d4b` in light, `#e08a96` in dark): Marks grammatical particles, prepositional attachments, and corrective drill states.
- **Slate Indigo** (`#2c4c7c` in light, `#9eb6de` in dark): Encodes sentence clauses, complex phrase boundaries, and elliptical syntactic slots (*taqdīr*).

### Neutral
- **Studio Paper** (`#fffdf8` in light, `#171d1a` in dark): Elevated card surface, word inspection sheet, and dialog background.
- **Warm Canvas** (`#f3efe6` in light, `#101311` in dark): Root application canvas carrying a subtle ambient radial gradient.
- **Muted Studio Surface** (`#e7e0d2` in light, `#1b221e` in dark): Subtle pill backgrounds, filter badges, and secondary action tabs.
- **Text Ink** (`#1c1915` in light, `#f4efe6` in dark): Primary high-contrast reading text for Quranic verses and translations.
- **Text Muted** (`#6f675e` in light, `#b7aea2` in dark): Metalinguistic labels, transliterations, chapter numbers, and attributions.
- **Border Line** (`#e3d9c8` in light, `#2d3832` in dark): 1px structural hairpins defining card boundaries and tab dividers.

### Named Rules
**The Semantic Rarity Rule.** The primary accent (`--teal`) is reserved strictly for current selection, head node connections, and active navigation. Its power comes from restraint; it must never be sprayed casually as decorative fill.
**The Dual-Mode Contrast Rule.** Accent backgrounds in dark mode invert text ink to deep dark slate (`#10211e`) to guarantee contrast ratios exceeding 7:1 (WCAG AAA).

## Typography

**Display Font:** Scheherazade New, Amiri, serif  
**Body Font:** Source Sans 3, Segoe UI, sans-serif  
**Editorial Serif:** Literata, "Iowan Old Style", Georgia, serif  
**Arabic UI Font:** Noto Sans Arabic, sans-serif  

**Character:** The typography bridges classical manuscript calligraphy (*Scheherazade New* with full tashkīl) and contemporary typographic precision (*Literata* and *Source Sans 3*), offering effortless legibility across bidirectional scripts.

### Hierarchy
- **Display (Quranic Verses)** (Regular 400, `clamp(2rem, 5vw, 3rem)`, line-height 1.6–1.8): Primary sacred text rendered in Uthmani rasm with generous vertical leading for diacritic clarity.
- **Headline (Surah Titles & Page Intros)** (Semi-bold 600, `clamp(1.4rem, 3.5vw, 2rem)`, line-height 1.2): Section and surah title headings set in Literata serif.
- **Title (Component Headings)** (Bold 700, 1.05rem–1.2rem, line-height 1.3): Card headings, word sheet lemma titles, and dataset selectors.
- **Body (Commentary & Translation)** (Regular 400, 17px, line-height 1.5–1.65): Translation prose, Al-Mukhtasar tafsir, and grammatical explanations with a comfortable reading measure of 65–75 characters.
- **Label (Linguistic Metadata & Badges)** (Bold 700, 0.72rem–0.85rem, letter-spacing 0.02em): Part of speech tags, syntactic roles, root letters, and formula tags set in Noto Sans Arabic or Source Sans 3.

### Named Rules
**The Rasm Dominance Rule.** The Quranic Arabic text is the visual center of gravity; analytical captions, phonetic titles, and translation prose must always recede below the Uthmani script in scale and contrast.
**The Tabular Coordinates Rule.** All numeric references (surah:ayah:word coordinates) use tabular numerals (`font-variant-numeric: tabular-nums`) to prevent optical jitter during live reading steps.

## Layout

The spatial model prioritizes undisturbed reading while providing instant access to analytical depth on demand:
- **Two-Column Reading Stage (Desktop):** The central reading viewport hosts the verse toolbar, Quranic ayah, interactive dependency tree, and commentary tabs (max-width 1180px, centered). Word inspection slides smoothly into a sticky 360px sidebar sheet without obstructing the verse.
- **Fluid Single-Column Stack (Mobile):** On viewports under 1100px, the word sheet transforms into an accessible bottom sheet modal. On viewports under 720px, the top navigation remains persistent as a compact single-row strip while reading controls dock neatly at the bottom (`.dock`).
- **Dependency Tree Canvas:** Scaled vector graphics (`<svg>`) rendered with `userSpaceOnUse` markers, natural arc curvatures directed toward syntactic heads, and dashed lines for implied pronouns or cross-verse boundaries.

## Elevation & Depth

Depth is established primarily through tonal planes and fine hairline borders rather than heavy drop shadows.

**The Flat-at-Rest Rule.** Surfaces are flat and flush at rest; subtle layered ambient shadows and 1px boundary lines emerge only on active interaction, modal sheets, or sticky bars.

### Shadow Vocabulary
- **Ambient Soft (`--shadow-soft`):** `0 1px 2px rgba(60, 42, 20, 0.05), 0 6px 14px -4px rgba(60, 42, 20, 0.08)` (Dark mode: `0 1px 2px rgba(0, 0, 0, 0.22), 0 6px 14px -4px rgba(0, 0, 0, 0.35)`). Applied to elevated cards and floating search results.
- **Elevated Dialog (`--shadow`):** `0 1px 2px rgba(60, 42, 20, 0.05), 0 10px 28px -6px rgba(60, 42, 20, 0.1)` (Dark mode: `0 1px 2px rgba(0, 0, 0, 0.2), 0 12px 32px -6px rgba(0, 0, 0, 0.45)`). Applied to modal dialogs (`SettingsModal`, mobile `WordSheet`).

## Shapes

- **Concentric Radii:**
  - `999px` (Pills): Navigation tabs, search inputs, chip filters, jump buttons, and badge tags.
  - `16px–18px` (Containers): Surah grid cards, word sheets, settings dialog, and search result containers.
  - `10px–12px` (Internal Cards): Formula boxes, quiz answer cards, and nested filter containers.
  - `8px` (Inner Chips): Grammatical attribute badges and table cells.
- **Hairline Boundaries:** Always 1px solid `var(--line)`. Never exceed 1px stroke widths on card boundaries or dividers.

## Components

### Buttons
- **Shape:** Pill radius (`999px`).
- **Primary:** Background `var(--teal)`, text `var(--paper)` (light) / `#10211e` (dark), padding `0.4rem 0.7rem`.
- **Secondary / Ghost:** Transparent background, text `var(--ink)`, hover background `var(--teal-soft)`.
- **Focus:** 2px solid `var(--teal)` outline with 2px offset (`:focus-visible`).

### Chips & Badges
- **Style:** Compact pill (`padding: 0.25rem 0.65rem`), subtle 1px border.
- **States:** Default uses `var(--bg-2)` or `var(--gold-soft)`. Selected state flips to `var(--teal)` or `var(--gold)` with high-contrast text.

### Cards / Containers
- **Corner Style:** 16px radius (`--radius`).
- **Background:** `var(--paper)` on canvas `var(--bg)`.
- **Internal Padding:** 1rem to 1.25rem.

### Inputs & Finders
- **Style:** Full pill (`border-radius: 999px`), 1px solid `var(--line)`, background `var(--paper)`.
- **Focus:** Border transitions to `var(--teal)`, with explicit `:focus-visible` ring.

### Signature Component: The Dependency Tree
- **Nodes:** Word boxes (`rx: 14px`) with bold Arabic rasm and secondary metalinguistic captions. Implied pronouns appear as dashed nodes.
- **Arcs:** Cubic bezier curves terminating in arrow markers pointed at the syntactic head (`fill="var(--teal)"`, `fill="var(--gold)"`, `fill="var(--indigo)"`, `fill="var(--rose)"`).
- **Phrase Badges:** Pill-shaped fold toggles (`rx: 8px`) supporting full keyboard expand/collapse via Enter and Space.

## Do's and Don'ts

### Do:
- **Do** preserve the Tanzil Uthmani Quranic text and Al-Mukhtasar commentaries verbatim without any alterations.
- **Do** state treebank coverage limits honestly (chapters 10–58 unannotated in the treebank).
- **Do** ensure all text on dark-mode accent backgrounds uses high-contrast ink (`#10211e`) to maintain AAA contrast.
- **Do** provide keyboard accessibility (`tabIndex={0}`, `role="button"`, Space/Enter handlers) for all SVG tree interactions.
- **Do** keep mobile navigation permanently accessible in a single compact strip when scrolling.

### Don't:
- **Don't** wrap sacred Quranic verses in heavy, bordered card boxes; let the ayah breathe directly on the canvas.
- **Don't** use decorative Islamic arabesque flourishes, faux-manuscript clip art, or artificial gradient text.
- **Don't** add thick "side-tab" colored borders to cards, alerts, or formula callouts.
- **Don't** use hard zero-blur offset drop shadows (`4px 4px 0 #000`); use soft multi-layer ambient elevation.
- **Don't** nest interactive elements inside buttons or `<summary>` elements.
- **Don't** introduce high-saturation buttons that distract from reading and contemplative focus.
