# ASCII Layout Inspector — Design

**Status:** Approved (2026-04-04)

## Summary

Add a Three.js `Inspector` panel on the **layout-only** path (`layout-engine` → `initAsciiRenderer`) to:

- Regenerate the ASCII glyph atlas via `createASCIITexture` when switching **preset fonts** (list maintained in-repo; v1: single entry matching current UnifrakturCook usage).
- Update the instanced grid material’s ASCII texture and keep `charCount` in sync with the shader.
- Control **grid** parameters: `GRID_COLS`, `CELL_SIZE` (rebuild mesh/geometry **immediately** on change). `GRID_ROWS` stays `Math.round(GRID_COLS * IMAGE_ASPECT)`.
- Expose the same **six uniforms** as `material.js` / `gui.js`: luminance exponent, use texture color, show original image, glyph luminance jitter, glyph time oscillation, osc time scale.

## Architectural choice

**Inspector lives inside `initAsciiRenderer`** (same pattern as `app/main.js`: `renderer.inspector = inspector`). `layout-engine` keeps a thin integration: init + dispose. Panel wiring goes in **`gui.js`** via a dedicated setup function (e.g. `setupAsciiLayoutInspector`).

**Supporting modules:**

- `asciiTexture.js`: extend `createASCIITexture` with a **font** (CSS fragment) parameter; default preserves current behavior. `CELL_PX` stays 64 for v1 (not exposed).
- `ascii-font-presets.js` (or equivalent): `{ id, label, fontCss }[]` — initially one preset.
- `material.js`: ensure atlas replacement updates **texture binding** and **`charCountUniform`** (expose `charCountUniform` in the factory return; implementation may use mutable texture node or recreate material — see implementation plan).
- `ascii-renderer.js`: mutable `GRID_COLS` / `CELL_SIZE`; `rebuildGrid()`, `rebuildAsciiAtlas({ fontKey })`; dispose old atlas on swap; optional max instance guard.

## Inspector groups

1. **ASCII atlas** — font preset (dropdown).
2. **Grid** — `GRID_COLS`, `CELL_SIZE` (sliders with sane min/max/step in implementation).
3. **Instanced grid** — six uniforms (ranges aligned with existing `setupInspector` in `gui.js`).

## Error handling and limits

- Font load failure: keep previous atlas, `console.warn` (optional status string later).
- Cap max grid instances to avoid browser/GPU freeze; clamp and warn (exact cap in implementation plan).

## Testing

Manual: switch font, drag grid params, tweak uniforms; verify no leaks on repeated atlas rebuilds and `dispose()`.

## Out of scope (v1)

- `app/main.js` parity (optional follow-up).
- Free-text custom font / `CELL_PX` in UI.
- Editable `GRID_ROWS` independent of aspect.

## Related implementation plan

See `docs/plans/2026-04-04-ascii-inspector-layout.md`.
