# ASCII atlas middle-third white glow (design)

## Goal

Rasterize the horizontal glyph atlas so that **approximately the middle third** of `charset` indices (by order in the string) shows a **white blur / glow** around the glyph, while other cells stay the current crisp white-on-black look. This strengthens the visual cue for mid-density characters in the luminance ramp without changing sampling math elsewhere.

## Scope

- **Glow indices:** For `n = charset.length`, use half-open interval  
  `[ Math.floor(n / 3), Math.floor(2 * n / 3) )`.  
  If that interval is empty (e.g. `n < 3`), **no cell** receives glow.
- **Rendering:** Canvas 2D only, inside existing `createASCIITexture` loop. No shader changes unless a follow-up explicitly requests them.

## Recommended approach (chosen)

Per glowing cell: `ctx.save()` → `ctx.beginPath(); ctx.rect(i * CELL_PX, 0, CELL_PX, CELL_PX); ctx.clip()` → set `shadowColor` to white, `shadowBlur` to a small positive value (default e.g. **8**), `shadowOffsetX/Y` **0** → `fillText` → optional second `fillText` **without** shadow for a sharper core → `ctx.restore()`.

Non-glowing cells: unchanged (no shadow).

## Alternatives considered

| Approach | Notes |
|----------|--------|
| Offscreen canvas + CSS `filter: blur()` per cell | Heavier; unnecessary for this feature. |
| Whole-atlas blur | Would blur all glyphs; rejected. |

## API (minimal)

Extend `createASCIITexture(charset, options)` with optional:

- `glowShadowBlur?: number` — default `8`; `0` disables glow even in the middle third (optional behavior; simplest is “0 means no shadow” for those indices).

YAGNI: do **not** add `glowFraction` or manual index ranges until needed.

## Risks

- **Neighbor bleed:** Mitigated by per-cell **clip** and moderate `shadowBlur`.
- **Empty middle third:** Handled by index math; no special UI.

## Testing

- **Manual:** Run the app, confirm mid-strip glyphs show a soft white halo and edge glyphs stay crisp; resize / font preset changes still regenerate atlas as today (`ascii-renderer.js` call sites).

## Approval

User confirmed option **A** (middle third by index) and the shadow+clip approach on 2026-04-07.
