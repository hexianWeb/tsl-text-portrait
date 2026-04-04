# Pearl Maiden page typography — design

## Context

The showcase page uses a custom layout engine (`layout-engine.js`) that measures text with the same `font` strings as applied to the DOM. `style.css` and `index.html` already reference Google Fonts (EB Garamond, IM Fell English, IM Fell English SC); body and engine constants still pointed at Iowan Old Style / Helvetica until this change.

## Decisions

### Type roles

| Role | Element / constant | Font |
|------|-------------------|------|
| Main title | `.headline-line`, `HEADLINE_TEXT` | **IM Fell English SC**, uppercase. Weight **400** if the webfont has no true bold (avoids faux-bold and keeps measurement aligned). |
| Subtitle / credit | `.credit`, `CREDIT_TEXT` | **EB Garamond**, *italic*. |
| Body | `.line`, `BODY_COPY` | **IM Fell English**, regular. |
| Hint pill | `.hint-pill` | **Unchanged**: system / Helvetica sans stack for legibility and visual separation from the editorial block. |

### Uppercase headline and layout

Pretext measures using the literal string passed to `getPrepared`. **CSS-only `text-transform: uppercase` would not update those metrics**, so line breaks and `fitHeadlineFontSize` could disagree with the rendered glyphs. The headline string used for layout and for `textContent` must be **uppercase ASCII** (e.g. `GIRL WITH A PEARL EARRING`). Optional: keep `text-transform: uppercase` on `.headline-line` as a redundant safeguard.

### Single source of truth

Font stacks live in `layout-engine.js` (`HEADLINE_FONT_FAMILY`, `CREDIT_FONT`, `BODY_FONT`, and the headline `font` weight). `style.css` should mirror the same families and styles for `body`, `.credit`, `.headline-line`, and `.line` so any non-inlined text stays consistent.

### Google Fonts

No **Crimson Text** (user chose body = IM Fell English only). Existing `index.html` link is sufficient; no new families required.

## Acceptance

- Desktop and narrow (`page--mobile`) layouts: title fits without mid-word breaks where the engine forbids them; credit clears obstacles; body columns reflow as today.
- No visible fallback to Iowan/Helvetica for title, credit, or body (except hint pill).
- `npm run build` succeeds.

## Implementation

See `docs/plans/2026-04-04-typography.md`.
