# Footer copyright separator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fixed bottom footer with a 1px top border and centered copyright line, consistent with existing dark theme and fonts.

**Architecture:** Semantic `<footer>` after `</main>` in `src/index.html`; styles in `src/style.css` using existing CSS variables (`--muted`, etc.) and `z-index: 4` below `.hint-pill`.

**Tech Stack:** Static HTML + CSS (Vite project; no JS required).

---

### Task 1: Markup

**Files:**
- Modify: `src/index.html` (after `</main>`, before `<script>`)

**Step 1:** Insert footer markup:

```html
<footer class="site-footer" role="contentinfo">
  <p class="site-footer__copyright">
    © 2026 Girl with a Pearl Earring. All rights reserved.
  </p>
</footer>
```

**Step 2:** Open the app (`npm run dev`), confirm the footer appears in the DOM (inspect Elements).

**Step 3:** Commit

```bash
git add src/index.html
git commit -m "feat(ui): add site footer markup for copyright"
```

---

### Task 2: Styles

**Files:**
- Modify: `src/style.css` (append near other layout/UI rules, e.g. after `.hint-pill` block)

**Step 1:** Add rules (tune values to match design doc if needed):

```css
.site-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 4;
  margin: 0;
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(160, 152, 136, 0.55);
  background: transparent;
  text-align: center;
}

.site-footer__copyright {
  margin: 0;
  font: 400 12px/1.35 "IM Fell English", serif;
  letter-spacing: 0.02em;
  color: var(--muted);
  user-select: text;
}
```

**Step 2:** Reload dev server; verify line spans full width, text centered, readable on canvas; resize window — footer stays bottom, not clipped.

**Step 3:** Commit

```bash
git add src/style.css
git commit -m "feat(ui): style fixed footer copyright strip"
```

---

### Optional Task 3: Mobile tweak

If the footer crowds small screens, add under existing `@media (max-width: 760px)` in `src/style.css`:

```css
.site-footer {
  padding-bottom: max(14px, env(safe-area-inset-bottom));
}
```

(Only if manual test on a narrow viewport shows overlap with home indicator.)

---

## Design reference

See `docs/plans/2026-04-04-footer-copyright-design.md`.
