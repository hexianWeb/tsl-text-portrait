# ASCII atlas middle-third white glow — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a white shadow/glow to the middle third of glyphs in `createASCIITexture` using per-cell clip + `shadowBlur`, with optional `glowShadowBlur` in `options`.

**Architecture:** Compute glow index range `[floor(n/3), floor(2n/3))`. For indices in range, draw with clip + white `shadowColor` + `shadowBlur`; optionally add a second `fillText` without shadow. Reset shadow before non-glow cells. Call sites keep working via defaults.

**Tech stack:** Canvas 2D, existing `THREE.CanvasTexture` upload path in `src/render/asciiTexture.js`.

---

### Task 1: Implement glow in `createASCIITexture`

**Files:**

- Modify: `src/render/asciiTexture.js`

**Step 1: Add helpers and options**

- After computing `n`, set:
  - `glowStart = Math.floor(n / 3)`
  - `glowEnd = Math.floor((2 * n) / 3)`
- Read `options.glowShadowBlur` with default `8` (number).

**Step 2: Replace the single loop with two behaviors**

- For each `i` in `0..n-1`:
  - `cx = i * CELL_PX + CELL_PX / 2`, `cy = CELL_PX / 2` (unchanged).
  - If `glowShadowBlur > 0` and `i >= glowStart` and `i < glowEnd`:
    - `save()` → `beginPath()` → `rect(i * CELL_PX, 0, CELL_PX, CELL_PX)` → `clip()`
    - `shadowColor = '#ffffff'`, `shadowBlur = glowShadowBlur`, `shadowOffsetX = 0`, `shadowOffsetY = 0`
    - `fillText(charset[i], cx, cy)`
    - Clear shadow: `shadowBlur = 0`, `shadowColor = 'transparent'` (or assign safe defaults)
    - Second `fillText` without shadow (same position) for a crisp core
    - `restore()`
  - Else:
    - Ensure no shadow (if previous iteration could leave state: set shadow off once before non-glow branch, or always `save`/`restore` only on glow path — prefer clearing shadow at start of non-glow branch)
    - `fillText(charset[i], cx, cy)`

**Step 3: JSDoc**

- Extend `@param options` with `glowShadowBlur?: number` (default 8; 0 skips glow).

**Step 4: Verify**

- Run: `npm run build` (or project’s build script from `package.json`).
- Expected: build succeeds.

**Step 5: Manual check**

- Run dev server / open app; confirm middle third of ASCII ramp shows white halo, ends stay sharp.

**Step 6: Commit**

```bash
git add src/render/asciiTexture.js
git commit -m "feat(render): white glow for middle third of ASCII atlas"
```

---

### Task 2 (optional): Pass-through from preset only if needed

**Files:**

- None required for default behavior. `ascii-renderer.js` already passes `{ fontCss }`; glow uses defaults.

If tuning per preset is desired later, add `glowShadowBlur` to preset objects and pass into `createASCIITexture` — **out of scope** unless requested.

---

## Notes

- `material.js` / shaders: **no change**; atlas remains sRGB texture, linear filtering.
- No new test file unless the repo adds canvas/unit tests for render helpers; manual visual is sufficient for v1.
