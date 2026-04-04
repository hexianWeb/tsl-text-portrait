# ASCII Layout Inspector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Three.js Inspector to the layout app (`layout-engine` → `initAsciiRenderer`) to switch preset fonts (regenerate ASCII atlas), rebuild the instanced grid when `GRID_COLS` / `CELL_SIZE` change, and tune instanced-grid uniforms—without changing `app/main.js` in v1.

**Architecture:** `initAsciiRenderer` creates `WebGPURenderer`, attaches `Inspector`, and returns handles for grid/atlas rebuilds. `createInstancedGridMaterial` uses TSL `uniformTexture()` for the ASCII atlas so the same `TextureNode.value` can swap atlases; `charCountUniform` is returned for shader updates. Font presets live in `src/render/ascii-font-presets.js`. `gui.js` gains `setupAsciiLayoutInspector(inspector, api)` that binds dropdowns/sliders to that API.

**Tech Stack:** Three.js (WebGPU), `three/tsl` (`uniform`, `uniformTexture`, `texture`, …), `three/addons/inspector/Inspector.js`.

**Design reference:** `docs/plans/2026-04-04-ascii-inspector-layout-design.md`

---

### Task 1: Font presets module

**Files:**
- Create: `src/render/ascii-font-presets.js`

**Step 1:** Export a constant array of presets:

```javascript
/** @typedef {{ id: string, label: string, fontCss: string }} AsciiFontPreset */

/** @type {AsciiFontPreset[]} */
export const ASCII_FONT_PRESETS = [
  {
    id: 'unifraktur-default',
    label: 'UnifrakturCook (default)',
    fontCss: 'bold 60px "UnifrakturCook", cursive',
  },
]
```

**Step 2:** Export helper `getPresetById(id)` returning preset or first preset.

**Step 3:** Commit

```bash
git add src/render/ascii-font-presets.js
git commit -m "feat(render): add ASCII font preset list for layout inspector"
```

---

### Task 2: `createASCIITexture` — optional `fontCss`

**Files:**
- Modify: `src/render/asciiTexture.js`

**Step 1:** Extend signature to `createASCIITexture(charset = ASCII_CHARSET, { fontCss } = {})` with default `fontCss` matching current hardcoded `ctx.font` string.

**Step 2:** Use `fontCss` when calling `ctx.fillText` path (set `ctx.font = fontCss` before the loop).

**Step 3:** Run app manually (later); no unit test required for v1.

**Step 4:** Commit

```bash
git add src/render/asciiTexture.js
git commit -m "feat(render): allow custom font CSS in createASCIITexture"
```

---

### Task 3: Material — `uniformTexture` for atlas + export `charCountUniform`

**Files:**
- Modify: `src/render/material.js`

**Step 1:** Import `uniformTexture` from `three/tsl` (alongside existing imports).

**Step 2:** Replace direct `texture(asciiAtlas, …)` with a node created once:

```javascript
const asciiAtlasNode = uniformTexture(asciiAtlas)
// ...
const asciiSample = texture(asciiAtlasNode, vec2(uAtlas, vAtlas))
```

Confirm `texture(TextureNode, uv)` matches project’s three.js version (r17x+).

**Step 3:** Return from `createInstancedGridMaterial`:

- `asciiAtlasNode` (or a small object `{ setAtlas(t) { asciiAtlasNode.value = t } }` if you prefer hiding TextureNode)
- `charCountUniform` (already exists internally—add to return object)

**Step 4:** Manual check: existing `app/main.js` still renders after reload (same defaults).

**Step 5:** Commit

```bash
git add src/render/material.js
git commit -m "feat(render): uniformTexture for ASCII atlas and expose charCountUniform"
```

---

### Task 4: `ascii-renderer.js` — stateful grid, atlas rebuild, Inspector

**Files:**
- Modify: `src/render/ascii-renderer.js`
- Modify: `src/app/gui.js` (only if importing new setup from renderer would circular-import—prefer `gui` importing renderer types only as JSDoc; see Task 5)

**Step 1:** Replace top-level `GRID_COLS` / `CELL_SIZE` constants with `let` state variables + derive `GRID_ROWS`, `MESH_NATIVE_H`, `MESH_NATIVE_W` inside a function `recomputeMeshMetrics()` or update after each change.

**Step 2:** Extract mesh build into `buildOrReplaceInstancedMesh()` that:
- Disposes previous `PlaneGeometry` and removes old `InstancedMesh` from `group` if any.
- Creates new geometry, `aUv` buffer, `InstancedMesh` with current material.
- Repositions mesh with `-MESH_NATIVE_W/2`, `-MESH_NATIVE_H/2` as today.

**Step 3:** `MAX_GRID_INSTANCES` constant (e.g. `500_000` or stricter)—compute `count = GRID_ROWS * GRID_COLS`; if over cap, clamp `GRID_COLS` (and derived rows) or skip rebuild + `console.warn` (pick one clear rule in code).

**Step 4:** `async function rebuildAsciiAtlas(presetId)`:
- Resolve `fontCss` from presets.
- `await document.fonts.load(...)` using a parsed size/family from preset or a fixed load string like today’s `700 48px "UnifrakturCook"` extended for the chosen face if needed.
- `createASCIITexture(ASCII_CHARSET, { fontCss })`.
- Dispose previous atlas texture.
- `asciiAtlasNode.value = newTexture` (from material factory), `charCountUniform.value = charCount`, `newTexture.needsUpdate = true`, mark material dirty if required.

**Step 5:** Instantiate `Inspector`, `renderer.inspector = inspector`, import and call `setupAsciiLayoutInspector` from `gui.js` (Task 5) with an API object.

**Step 6:** `initAsciiRenderer` return value: keep existing methods; optionally expose `rebuildGrid` / `rebuildAsciiAtlas` only for tests—Inspector is the primary consumer.

**Step 7:** Commit

```bash
git add src/render/ascii-renderer.js
git commit -m "feat(render): inspector hooks and grid/atlas rebuild for layout ASCII"
```

---

### Task 5: `setupAsciiLayoutInspector` in `gui.js`

**Files:**
- Modify: `src/app/gui.js`

**Step 1:** Add exported function `setupAsciiLayoutInspector(inspector, api)` where `api` includes:
- Getters/setters or uniform refs for the six existing controls (same ranges as `setupInspector`).
- `gridCols`, `cellSize` with sliders.
- `fontPresetId` — Inspector may use `group.add` with a string field or map preset index; if Inspector lacks dropdown, use numeric index over `ASCII_FONT_PRESETS.length`.

**Step 2:** On font change, `await api.applyFontPreset(id)` (async—handle promise; on failure warn).

**Step 3:** On grid sliders, call `api.setGridCols` / `api.setCellSize` which trigger immediate rebuild.

**Step 4:** Commit

```bash
git add src/app/gui.js
git commit -m "feat(app): setupAsciiLayoutInspector for ASCII layout panel"
```

---

### Task 6: Wire presets import and verify layout entry

**Files:**
- Modify: `src/render/ascii-renderer.js` (import presets for rebuild + inspector labels)

**Step 1:** Load layout page (`index.html` or project default), confirm Inspector appears, font switch regenerates atlas, grid sliders rebuild, uniforms animate as before.

**Step 2:** Commit any small fixes.

---

### Task 7: Manual verification checklist

**Run:** Dev server (e.g. `npm run dev` per project README).

**Check:**
- [ ] Default layout matches pre-change appearance.
- [ ] Changing `GRID_COLS` / `CELL_SIZE` updates density and keeps pearl `sync()` scaling sane.
- [ ] Uniform sliders still work.
- [ ] Repeated font toggles do not grow GPU memory (DevTools Memory / Performance—spot check).
- [ ] No console errors on first load.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-04-ascii-inspector-layout.md`. Two execution options:

**1. Subagent-Driven (this session)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints.

Which approach do you prefer?
