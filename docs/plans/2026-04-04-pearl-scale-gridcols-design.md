# Pearl user scale → gridCols (design)

## Goal

Drive ASCII `gridCols` from the same smoothed `pearlUserScale` as luminance: linear mapping from wheel scale `[0.5, 2]` to column count `[64, 192]`, without rebuilding the instanced mesh every frame.

## Behavior

- **Mapper:** `mapPearlScaleToGridCols(scale)` in `src/layout/config.js` — same `t` as luminance, `round(64 + t * (192 - 64))`.
- **Rebuild policy:** Only when the **rounded** column count changes, call `buildGrid()` (approach A).
- **sync API:** Third argument is `pearlUserScale`; `ascii-renderer` applies both `mapPearlScaleToLuminanceExponent` and `mapPearlScaleToGridCols` internally (single source of scale at layout boundary).
- **Inspector:** Hide `gridCols` slider on the layout page (`includeGridCols: false`); keep `cellSize` and other controls.

## Initial state

- `gridCols` initializes to `mapPearlScaleToGridCols(1)` so the first grid matches default scale before the first `commitFrame`.

## Testing

- Manual: wheel between 0.5 and 2 — column count steps through rounded values; no continuous rebuild spam; ASCII detail increases with zoom-in.
