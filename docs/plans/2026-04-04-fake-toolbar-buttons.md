# Fake toolbar buttons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three decorative wireframe buttons at the top-left of the viewport with accent glow on hover/focus and `alert()` placeholders on click, matching `docs/plans/2026-04-04-fake-toolbar-buttons-design.md`.

**Architecture:** Static markup in `src/index.html`, styles in `src/style.css` using existing CSS variables (`--ink`, `--accent`, etc.), and a tiny click wiring block in `src/app/script.js` (or a one-line import of a small module if you prefer separation—YAGNI: prefer keeping it in `script.js` unless the file grows).

**Tech Stack:** Plain HTML/CSS/ES modules, no new dependencies.

---

I'm using the writing-plans skill to create the implementation plan.

### Task 1: Markup — toolbar region

**Files:**
- Modify: `src/index.html` (inside `<body>`, sibling to `<main class="page">`, before or after is fine; keep canvas first for clarity—place toolbar after `<main>` or just inside `<main>` as first child—**prefer fixed overlay outside `.stage`** so layout engine does not touch it: e.g. after `<canvas>` add `<div class="fake-toolbar" role="presentation">` with three buttons `VIE`, `ARC`, `LUX` and `type="button"`, each with `aria-label` like `Decorative control (demo)` plus distinguishing text if needed.)

**Step 1:** Insert the container and three buttons with visible text `VIE`, `ARC`, `LUX`.

**Step 2:** Open `src/index.html` in the browser (via existing dev server if any) and confirm the unstyled buttons appear in DOM order without breaking layout.

**Step 3:** Commit

```bash
git add src/index.html
git commit -m "feat(ui): add fake toolbar markup for top-left decorative buttons"
```

---

### Task 2: Styles — wireframe + glow

**Files:**
- Modify: `src/style.css` (new block after `.hint-pill` or near other fixed UI)

**Step 1:** Add `.fake-toolbar` as `position: fixed; top: 16px; left: 16px; z-index: 6;` (or `5` if stacking needs to match hint), `display: flex; gap: 6px;`, `pointer-events: auto`.

**Step 2:** Style `.fake-toolbar button` (or BEM `.fake-toolbar__btn`): min-height ~44px, padding, sans font stack matching `.hint-pill`, `font-size` ~11–12px, `letter-spacing`, `text-transform: uppercase`, transparent/very subtle background, `border: 1px solid rgba(232, 224, 212, 0.35)`, `color: var(--ink)`, `cursor: pointer`, `transition` for border/shadow.

**Step 3:** Add `:hover`, `:focus-visible` with brighter border and `box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 35%, transparent)` or equivalent `rgba` from `#d97757`.

**Step 4:** Add `:active` subtle press feedback.

**Step 5:** Verify contrast on dark background; resize window to ensure no overlap with centered hint or footer.

**Step 6:** Commit

```bash
git add src/style.css
git commit -m "style(ui): wireframe fake toolbar with accent hover glow"
```

---

### Task 3: Behavior — alerts

**Files:**
- Modify: `src/app/script.js`

**Step 1:** After the existing import, query `.fake-toolbar` buttons (e.g. `document.querySelectorAll('.fake-toolbar button')`) and attach `click` handlers that call `alert()` with three distinct short English strings (e.g. "View (demo)", "Archive (demo)", "Lux (demo)").

**Step 2:** Reload and click each button; confirm three different alerts.

**Step 3:** Commit

```bash
git add src/app/script.js
git commit -m "feat(ui): wire fake toolbar buttons to placeholder alerts"
```

---

### Task 4: Manual QA checklist

- [ ] Three buttons visible top-left; no overlap with hint pill or footer on narrow width.
- [ ] Keyboard: Tab to each button, `:focus-visible` ring/glow visible.
- [ ] Mobile/touch: taps show alert (if testing on device or emulator).

**Step 1:** Run through checklist.

**Step 2:** Optional single commit if any fix is needed.

---

## Execution handoff

**Plan complete and saved to `docs/plans/2026-04-04-fake-toolbar-buttons.md`. Two execution options:**

**1. Subagent-Driven (this session)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints.

**Which approach?**
