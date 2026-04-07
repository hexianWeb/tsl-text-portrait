# Pearl scale → gridCols — Implementation Plan

**Goal:** Map `pearlUserScale` linearly to `gridCols` in `[64, 192]`, rebuild only on integer change, hide Inspector `gridCols` on layout demo.

**Architecture:** Constants + `mapPearlScaleToGridCols` in `config.js`; `ascii-renderer.sync(rect, angle, pearlUserScale)` updates luminance + grid; `layout-engine` passes `pearlUserScale` only.

---

### Task 1: Config

**Files:** `src/layout/config.js`

- Add `PEARL_GRID_COLS_MIN`, `PEARL_GRID_COLS_MAX`, `mapPearlScaleToGridCols(scale)` returning `Math.round` of linear blend.

### Task 2: ASCII renderer

**Files:** `src/render/ascii-renderer.js`

- Import mappers; init `gridCols` with `mapPearlScaleToGridCols(1)`.
- In `sync`, if `pearlUserScale` defined: set luminance uniform; if `mapPearlScaleToGridCols(pearlUserScale) !== gridCols`, assign and `buildGrid()`.

### Task 3: Layout engine

**Files:** `src/layout/layout-engine.js`

- Remove `mapPearlScaleToLuminanceExponent` import; call `asciiRenderer.sync(..., pearlUserScale)`.

### Task 4: GUI

**Files:** `src/app/gui.js`

- `setupAsciiLayoutInspector(..., { includeGridCols: false })` for layout entry; optional `includeGridCols` on the helper.

### Task 5: Verify

**Run:** `npm run build`; in browser, wheel-scale pearl and observe grid resolution steps.

**Commit:** `feat(layout): drive grid columns from pearl scale`
