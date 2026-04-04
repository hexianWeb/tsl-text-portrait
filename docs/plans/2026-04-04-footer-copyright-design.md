# Page footer — copyright separator — Design

**Status:** Approved (2026-04-04)

## Summary

Add a fixed strip at the bottom of the viewport: a thin horizontal separator line and centered copyright text, matching the existing dark theme and serif typography (`IM Fell English`). Copy uses option **A**: project-consistent English, editable in one place.

**Default line:** `© 2026 Girl with a Pearl Earring. All rights reserved.` (aligned with `<title>`; replace holder text in HTML when needed.)

## Architectural choice

**`<footer>` sibling to `main`, `position: fixed; bottom: 0; left: 0; right: 0`** — same layering idea as `.hint-pill`; works with `html/body { overflow: hidden }` and full-viewport layout without affecting `#stage`.

Alternatives considered: absolute footer inside `.page` (more coupling); `body::after` (bad for accessibility and editing).

## Visual spec

- **Line:** `border-top: 1px solid` using a muted light grey (reuse `var(--muted)` or a token derived from it).
- **Text:** centered, small (≈12–13px), serif stack already on `body`; color `var(--muted)` or slightly brighter for contrast.
- **Spacing:** padding above/below the line block so the line does not touch the text.
- **Stacking:** `z-index: 4` — above `.page` (1) and canvas (0), below `.hint-pill` (5).

## Accessibility

- `role="contentinfo"` on `<footer>`.
- Keep text selectable (default `pointer-events`; do not mirror `pointer-events: none` from the hint unless explicitly desired later).

## Out of scope (v1)

- Decorative grain/gradient on the footer background (reference image only); add later if needed.

## Verification

Manual: desktop and narrow viewport — line full width, text centered, not clipped; no overlap with interactive stage beyond the bottom strip.
