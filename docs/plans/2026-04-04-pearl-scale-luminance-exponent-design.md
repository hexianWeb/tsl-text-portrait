# Pearl user scale → luminance exponent (design)

## Goal

Tie ASCII `luminanceExponent` (the base for `pow(luminance, exponent)` in `material.js`) to the pearl illustration wheel scale `pearlUserScale`, so zoom and perceived contrast move together.

## Behavior

- **Input:** `pearlUserScale` after smoothing, clamped to `[PEARL_USER_SCALE_MIN, PEARL_USER_SCALE_MAX]` (0.5–2).
- **Output:** `luminanceExponentUniform.value` in `[0.1, 0.65]`.
- **Mapping:** Linear: smaller scale → lower exponent (softer); larger scale → higher exponent (sharper glyph ramp). Formula:

  `t = clamp((scale - 0.5) / (2 - 0.5), 0, 1)`  
  `exponent = 0.1 + t * (0.65 - 0.1)`

## Architecture

- **Single source of truth:** `mapPearlScaleToLuminanceExponent(scale)` exported from `src/layout/config.js` next to `PEARL_USER_SCALE_*`.
- **Call site:** `commitFrame` in `layout-engine.js` passes the mapped value into the ASCII renderer whenever layout commits (same cadence as `asciiRenderer.sync`).
- **ASCII renderer:** `sync(rect, angle, luminanceExponent)` sets the uniform before positioning the grid.
- **Inspector:** Hide the luminance exponent slider for the layout demo (`setupAsciiLayoutInspector`) so it is not overwritten every frame; keep the slider for `app/main.js` which uses `setupInspector` directly.

## Edge cases

- Scale outside `[0.5, 2]` is clamped inside the mapper (defensive).
- Initial material default uses `mapPearlScaleToLuminanceExponent(1)` so the first GPU frame matches default `pearlUserScale === 1`.

## Testing

- Manual: wheel zoom pearl 0.5 ↔ 2 and confirm ASCII contrast follows; Inspector no longer shows a conflicting luminance slider on the main page.
