# Pearl Maiden typography — implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the approved font pairing (IM Fell English SC + uppercase headline, EB Garamond italic credit, IM Fell English body) with layout metrics matching rendered text.

**Architecture:** Update font constants and headline weight in `layout-engine.js`, set `HEADLINE_TEXT` to uppercase for measurement parity, align `style.css` with the same stacks and styles. Leave `.hint-pill` on the existing sans stack.

**Tech Stack:** Vite, `@chenglou/pretext`, Google Fonts (already linked in `index.html`).

---

### Task 1: Layout engine — fonts, headline string, weight

**Files:**
- Modify: `src/layout/layout-engine.js` (constants at top, `fitHeadlineFontSize`, narrow + wide `headlineFont` construction)

**Step 1:** Set:

- `HEADLINE_TEXT` to `'GIRL WITH A PEARL EARRING'` (uppercase; must match visual glyphs used for pretext measurement).
- `HEADLINE_FONT_FAMILY` to `'"IM Fell English SC", serif'`.
- `CREDIT_FONT` to italic EB Garamond, e.g. `italic 12px "EB Garamond", serif` (keep size/line-height semantics consistent with `CREDIT_LINE_HEIGHT` unless you intentionally tune).
- `BODY_FONT` to `16px "IM Fell English", serif` (keep `16px` and existing `BODY_LINE_HEIGHT` unless spacing looks wrong after visual check).

**Step 2:** Replace headline weight **700** with **400** everywhere the headline font string is built:

- Inside `fitHeadlineFontSize`, the `font` template passed to `getPrepared`.
- Narrow and wide layout branches where `headlineFont` is assigned (e.g. `` `700 ${headlineFontSize}px ...` `` → `` `400 ${headlineFontSize}px ...` ``).

**Step 3:** Run `npm run build` from repo root.

Expected: build completes with no errors.

**Step 4:** Commit.

```bash
git add src/layout/layout-engine.js
git commit -m "feat(layout): use IM Fell / EB Garamond typography and uppercase headline"
```

---

### Task 2: CSS alignment

**Files:**
- Modify: `src/style.css`

**Step 1:** Set `body` `font-family` to `"IM Fell English", serif` (match `BODY_FONT`).

**Step 2:** Update `.credit` to use EB Garamond italic (remove uppercase sans if it fights the new voice; if credit stays all-caps in copy, either keep `text-transform: uppercase` on `.credit` or change `CREDIT_TEXT` — default: **italic EB Garamond, normal case** for `CREDIT_TEXT` string; drop forced uppercase styles that assume Helvetica).

**Step 3:** For `.headline-line`, set `font-family: "IM Fell English SC", serif`, `font-weight: 400`, and optional `text-transform: uppercase` (redundant if string is already uppercase).

**Step 4:** Ensure `.line` inherits body or explicitly set `font-family: "IM Fell English", serif` and `font-weight`/`font-style` to match `BODY_FONT`.

**Step 5:** Leave `.hint-pill` unchanged (sans stack).

**Step 6:** `npm run build`.

**Step 7:** Commit.

```bash
git add src/style.css
git commit -m "style: align CSS with layout-engine typography"
```

---

### Task 3: Manual verification

**Files:** None (browser).

**Step 1:** `npm run dev`, open the app.

**Step 2:** Verify headline is IM Fell English SC, all caps, no obvious faux-bold.

**Step 3:** Resize below `NARROW_BREAKPOINT` (~380px): headline and body still reflow; no overlap regressions with pearl hull.

**Step 4:** Optional: DevTools → Computed → font-family on `.headline-line`, `.credit`, `.line`.

**Step 5:** If credit uppercase styling was removed, confirm `CREDIT_TEXT` in JS reads acceptably in sentence case in italic Garamond.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-04-typography.md`. Two execution options:

1. **Subagent-driven (this session)** — dispatch a fresh subagent per task, review between tasks.
2. **Parallel session (separate)** — new session with executing-plans and checkpoints.

Which approach do you want?
