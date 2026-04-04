# Citation highlight `[n]` — Design

**Status:** Approved (2026-04-04)

## Summary

In the Pearl Maiden article body, render Wikipedia-style numeric citations **`[n]`** (regex `\[\d+\]`) with a **yellow highlighter background**. Non-matching brackets (e.g. `[nl]`) stay plain text. Only **body lines** are affected; headline and credit are unchanged.

## Visual spec

- **Highlight:** Yellow / cream background on the full `[digits]` token (`background-color`, optional subtle `box-shadow` omitted unless needed).
- **Typography:** Citation text uses a **slightly smaller font** than the body line (e.g. `font-size: 0.82em` to `0.88em` relative to `.line`, or a fixed step down from 16px body). Line box height stays driven by the parent `.line` `line-height`; cite spans align on the baseline without changing pretext layout metrics.
- **Hover:** `.line:hover` currently tints the whole line `color` to accent. Citations **keep the yellow background**; citation **glyph color** follows the same hover rule as the rest of the line unless a follow-up tweak is requested.

## Implementation approach (chosen)

**Per-line DOM assembly** in `projectTextProjection` when updating `domCache.bodyLines`:

1. Split `line.text` with `/\[(\d+)\]/g` (or `/\[\d+\]/g` with capture for segments).
2. Append `TextNode` segments and `<span class="line__cite">` for each match.
3. Use `replaceChildren(...)` — no `innerHTML`; content is always the layout engine’s substring.

## Constraints / limitations

- If a line break ever splits `[` from `]`, a single-line regex will not match; accepted as rare for short citations.

## Out of scope

- ASCII/WebGPU layer (image grid only; article is DOM).
- Cross-line semantic linking or tooltip popovers for footnotes.

## Files touched at implementation time

- `src/layout/layout-engine.js` — body line projection.
- `src/style.css` — `.line__cite` and hover interaction.
