# Pearl scale → luminance exponent — Implementation Plan

> **For Claude:** Optional follow-up: execute tasks in order; verify in browser.

**Goal:** Map smoothed `pearlUserScale` (0.5–2) linearly to `luminanceExponentUniform` (0.1–0.65) and hide the conflicting Inspector slider on the layout page.

**Architecture:** Pure function in `config.js`; `layout-engine` passes mapped value into `ascii-renderer.sync`; `material.js` initializes uniform at scale 1; `gui.js` optionally omits luminance control for ASCII layout.

**Tech Stack:** Three.js WebGPU, existing layout + ASCII pipeline.

---

### Task 1: Config mapper

**Files:**
- Modify: `src/layout/config.js`

**Steps:**
1. Add `PEARL_LUMINANCE_EXPONENT_MIN = 0.1` and `PEARL_LUMINANCE_EXPONENT_MAX = 0.65` (document that they pair with `PEARL_USER_SCALE_*`).
2. Export `mapPearlScaleToLuminanceExponent(scale)` using local `clamp` or `Math.min`/`Math.max` for `t` in `[0,1]` and the linear blend.

---

### Task 2: Wire layout → renderer

**Files:**
- Modify: `src/layout/layout-engine.js` — import mapper; call `asciiRenderer.sync(..., mapPearlScaleToLuminanceExponent(pearlUserScale))`.
- Modify: `src/render/ascii-renderer.js` — extend `sync` to accept optional third argument and assign `luminanceExponentUniform.value`.

---

### Task 3: Material default

**Files:**
- Modify: `src/render/material.js` — import `mapPearlScaleToLuminanceExponent` from `../layout/config.js`; initialize `luminanceExponentUniform` with `mapPearlScaleToLuminanceExponent(1)`.

---

### Task 4: Inspector

**Files:**
- Modify: `src/app/gui.js` — add optional `includeLuminanceExponent` (default `true`) to `setupInspector`; in `setupAsciiLayoutInspector`, pass `includeLuminanceExponent: false`.

---

### Task 5: Verify

**Run:** Open `index.html` dev server (e.g. `npm run dev` if defined); wheel-scale pearl and observe ASCII ramp; open Inspector and confirm luminance slider is absent on layout demo.

**Commit:** `feat(layout): map pearl scale to luminance exponent`
