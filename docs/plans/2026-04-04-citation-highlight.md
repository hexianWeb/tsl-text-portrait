# Citation highlight `[n]` Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show body text citations matching `\[\d+\]` with yellow background and slightly smaller type, without breaking pretext layout or line equality checks.

**Architecture:** Keep `line.text` as the single source of truth in layout data. Only change how each body `span.line` is filled: build child nodes (text + `span.line__cite`) instead of `textContent`. Styles live in `style.css`.

**Tech Stack:** Vanilla DOM, existing `layout-engine.js` projection loop, CSS.

---

### Task 1: Citation DOM helper

**Files:**
- Modify: `src/layout/layout-engine.js` (add helper near `projectTextProjection`, before or after `syncPool`)

**Step 1:** Add a constant and function:

```js
/** Wikipedia-style numeric refs only; e.g. [17], [21][22]. Excludes [nl] etc. */
const CITE_NUMERIC_RE = /\[\d+\]/g

/**
 * Fills `element` with text nodes and `.line__cite` spans for each [n] match.
 * @param {HTMLElement} element
 * @param {string} text
 */
function setBodyLineContentWithCitations(element, text) {
  const parts = text.split(CITE_NUMERIC_RE)
  const matches = text.match(CITE_NUMERIC_RE) ?? []
  const nodes = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) nodes.push(document.createTextNode(parts[i]))
    if (i < matches.length) {
      const cite = document.createElement('span')
      cite.className = 'line__cite'
      cite.textContent = matches[i]
      nodes.push(cite)
    }
  }
  element.replaceChildren(...nodes)
}
```

**Step 2:** In `projectTextProjection`, in the body loop, replace `element.textContent = line.text` with `setBodyLineContentWithCitations(element, line.text)`.

**Step 3:** Run the dev server (`npm run dev` or project equivalent) and resize the window; confirm `[17]` etc. show yellow and smaller text.

**Step 4:** Commit

```bash
git add src/layout/layout-engine.js
git commit -m "feat(layout): highlight numeric [n] citations in body lines"
```

---

### Task 2: Styles for `.line__cite`

**Files:**
- Modify: `src/style.css` (after `.line` block, ~line 151)

**Step 1:** Add rules:

```css
.line__cite {
  font-size: 0.85em;
  background-color: rgba(255, 235, 120, 0.92);
  box-decoration-break: clone;
  padding: 0 0.06em;
  border-radius: 0.12em;
}
```

Adjust `font-size` to taste (0.82em–0.88em). Background may use a CSS variable later; keep simple for v1.

**Step 2:** Optional: if hover makes cites hard to read, add:

```css
.line:hover .line__cite {
  color: inherit;
}
```

(Only if needed after visual check.)

**Step 3:** Manual test: hover lines containing `[17]`; background stays visible.

**Step 4:** Commit

```bash
git add src/style.css
git commit -m "style: citation highlight and smaller cite font"
```

---

### Task 3: Verification

**Files:** None

**Step 1:** Grep the repo for `textContent = line.text` in body path — should only remain for headline if applicable; body uses helper.

**Step 2:** Confirm `projectedBodyLinesEqual` still keys off `line.text` strings (unchanged).

**Step 3:** Final commit if any doc-only updates, or mark complete.

---

## Testing checklist (manual)

- Wide two-column: multiple `[n]` on one line, adjacent `[15][16]`.
- Narrow single-column: reflow, no console errors.
- Select/copy: citation text still selects with surrounding line text naturally.
