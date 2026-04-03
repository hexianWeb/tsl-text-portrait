# ASCII Art × Dynamic Layout Fusion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge the `@chenglou/pretext` dynamic text layout with the Three.js WebGPU ASCII art renderer into a single page — DOM text wraps around the Pearl Maiden while ASCII art provides the visual rendering beneath.

**Architecture:** Full-viewport `<canvas>` (Three.js WebGPU, black background) at z-index 0. DOM text layer floats on top with transparent background and light-colored text. `OrthographicCamera` maps 1 world-unit = 1 screen-pixel. `InstancedMesh` (ASCII art) is scaled/positioned to match `pearlRect` via uniform scale. Layout system owns all interaction; Three.js passively follows.

**Tech Stack:** Three.js r183 (WebGPU + TSL), `@chenglou/pretext`, Vite, JavaScript (全 JS, 无 TS)

---

## Target File Structure

```
src/
├── index.html          ← Fusion entry (canvas + DOM layout + dark theme)
├── script.js           ← import './layout-engine.js'
├── layout-engine.js    ← Converted from dynamic-layout.ts (main orchestrator)
├── layout-text.js      ← Converted from dynamic-layout-text.ts
├── wrap-geometry.js    ← Converted from wrap-geometry.ts
├── ascii-renderer.js   ← NEW: Three.js WebGPU init + sync API
├── material.js         ← Unchanged (TSL ASCII material)
├── asciiTexture.js     ← Minor fix: remove debug DOM append
├── style.css           ← Rewrite: dark theme + layout element styles
├── font.ttf            ← Unchanged
├── image.png           ← 672×1024 Pearl Maiden photo
├── symbol2.svg         ← Moved from dynamic-layout/
```

After all tasks complete, delete `src/dynamic-layout/` directory and unused files (`main.js`, `gui.js`, `loop.js`, `image3.png`).

---

## Key Constants (shared across modules)

```javascript
const IMAGE_ASPECT = 672 / 1024           // SVG viewBox & image share this ratio
const GRID_COLS = 192                      // vertical cells (Y / height direction)
const GRID_ROWS = Math.round(GRID_COLS * IMAGE_ASPECT)  // ≈ 126
const CELL_SIZE = 0.1
const MESH_NATIVE_W = GRID_ROWS * CELL_SIZE  // ≈ 12.6
const MESH_NATIVE_H = GRID_COLS * CELL_SIZE  // = 19.2
```

---

## Task 1: Convert TypeScript → JavaScript & Reorganize Files

**Files:**
- Create: `src/wrap-geometry.js` (from `src/dynamic-layout/wrap-geometry.ts`)
- Create: `src/layout-text.js` (from `src/dynamic-layout/dynamic-layout-text.ts`)
- Create: `src/layout-engine.js` (from `src/dynamic-layout/dynamic-layout.ts`)
- Move: `src/dynamic-layout/symbol2.svg` → `src/symbol2.svg`

### TS → JS conversion rules (apply to all three files):

1. **Remove all `type` / `interface` declarations** — delete entire blocks like `type PageLayout = { ... }`
2. **Remove all type annotations** — `function foo(x: number): string` → `function foo(x)`
3. **Remove type imports** — `type LayoutCursor` from import → just remove it
4. **Remove `!` non-null assertions** — `array[index]!` → `array[index]`
5. **Remove generic type parameters** — `Map<string, X>` → `Map()`
6. **Remove `as` casts** — `value as T` → `value`
7. **Keep ALL runtime logic identical**

### Step 1: Convert `wrap-geometry.ts` → `src/wrap-geometry.js`

Source: `src/dynamic-layout/wrap-geometry.ts` (329 lines)

Key changes:
- Remove exports of types: `Rect`, `Interval`, `Point`, `WrapHullMode`, `WrapHullOptions`
- Remove type annotations from all function signatures
- Remove `!` from array index accesses (e.g. `points[index]!` → `points[index]`)
- Remove `Array<number | null>` → just `new Array(height).fill(null)`
- Keep all `export function` declarations (just strip type annotations)

Example diff for `getWrapHull`:
```javascript
// Before (TS):
// export function getWrapHull(src: string, options: WrapHullOptions): Promise<Point[]> {
// After (JS):
export function getWrapHull(src, options) {
```

Example diff for array access:
```javascript
// Before (TS):
// const left = lefts[y]!
// After (JS):
const left = lefts[y]
```

### Step 2: Convert `dynamic-layout-text.ts` → `src/layout-text.js`

Source: `src/dynamic-layout/dynamic-layout-text.ts` (23 lines)

Trivial — just rename. The file only exports a const string, no type annotations.

```javascript
export const BODY_COPY = `\
The painting is a tronie...
`
```

### Step 3: Convert `dynamic-layout.ts` → `src/layout-engine.js`

Source: `src/dynamic-layout/dynamic-layout.ts` (993 lines)

Key changes besides type stripping:

**Import paths** — update to new locations:
```javascript
// Before:
// import { BODY_COPY } from './dynamic-layout-text.ts'
// import pearlMaidenArtUrl from './symbol2.svg'
// import { carveTextLineSlots, ... } from './wrap-geometry.ts'

// After:
import { BODY_COPY } from './layout-text.js'
import pearlMaidenArtUrl from './symbol2.svg'
import { carveTextLineSlots, getPolygonIntervalForBand, getRectIntervalsForBand, getWrapHull, isPointInPolygon, transformWrapPoints } from './wrap-geometry.js'
```

**Remove all type declarations** (delete these entire blocks):
- `type LogoKind = 'pearl'`
- `type SpinState = { ... }`
- `type LogoAnimationState = { ... }`
- `type PositionedLine = { ... }`
- `type ProjectedBodyLine = { ... }`
- `type TextProjection = { ... }`
- `type BandObstacle = ...`
- `type PageLayout = { ... }`
- `type LogoHits = { ... }`
- `type WrapHulls = { ... }`
- `type DomCache = { ... }`
- `type PearlDragSession = { ... }`

**Remove type annotations from all functions.** For example:
```javascript
// Before:
// function clamp(n: number, min: number, max: number): number {
// After:
function clamp(n, min, max) {
```

**Remove type from variable declarations:**
```javascript
// Before:
// let pearlDragSession: PearlDragSession | null = null
// After:
let pearlDragSession = null
```

**Remove `!` non-null assertions everywhere** — there are ~40+ instances. Search for `!.` and `]!` patterns.

### Step 4: Move `symbol2.svg`

Copy `src/dynamic-layout/symbol2.svg` to `src/symbol2.svg`.

### Step 5: Verify conversion compiles

Run: `npx vite build --mode development 2>&1 | head -30`

Expected: No import or syntax errors. (The page won't work yet — HTML hasn't been updated.)

### Step 6: Commit

```bash
git add src/wrap-geometry.js src/layout-text.js src/layout-engine.js src/symbol2.svg
git commit -m "refactor: convert dynamic-layout TS to JS and move to src/"
```

---

## Task 2: HTML Fusion + Dark Theme CSS

**Files:**
- Modify: `src/index.html`
- Modify: `src/style.css`
- Modify: `src/script.js`

### Step 1: Rewrite `src/index.html`

Replace the entire content with the fused structure:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Girl with a Pearl Earring</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <canvas class="webgl"></canvas>
    <main class="page">
      <p class="hint-pill">
        Drag the illustration to move it; wheel to scale; short press to rotate. Press D for debug overlay.
      </p>
      <div id="stage" class="stage"></div>
    </main>
    <script type="module" src="./script.js"></script>
  </body>
</html>
```

Key points:
- `<canvas class="webgl">` before `<main>` — Three.js renders here
- `.page` contains the DOM text layout
- Atmosphere divs removed (not needed with dark ASCII background)

### Step 2: Rewrite `src/style.css`

Replace entire content with dark-themed fusion styles:

```css
@font-face {
  font-family: "UnifrakturCook";
  src: url("./font.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  color-scheme: dark;
  --paper: #000000;
  --ink: #e8e0d4;
  --muted: #a09888;
  --accent: #d97757;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  background: var(--paper);
  color: var(--ink);
  overflow: hidden;
  overscroll-behavior: none;
}

body {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
  cursor: default;
}

.webgl {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  outline: none;
}

.page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  overscroll-behavior: none;
  isolation: isolate;
  background: transparent;
  z-index: 1;
}

.hint-pill {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 10px 16px 11px;
  border-radius: 999px;
  background: rgba(232, 224, 212, 0.12);
  color: rgba(232, 224, 212, 0.80);
  font: 500 12px/1.2 "Helvetica Neue", Helvetica, Arial, sans-serif;
  letter-spacing: 0.015em;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  z-index: 5;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.3);
}

.stage {
  position: relative;
  height: 100%;
}

.headline {
  position: absolute;
  margin: 0;
  font: inherit;
  user-select: text;
  z-index: 1;
}

.headline-line {
  position: absolute;
  white-space: pre;
  color: var(--ink);
  cursor: text;
}

.credit {
  position: absolute;
  margin: 0;
  font: 12px/16px "Helvetica Neue", Helvetica, Arial, sans-serif;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--muted);
  user-select: text;
  cursor: text;
  z-index: 1;
}

.logo {
  position: absolute;
  display: block;
  user-select: none;
  pointer-events: none;
  transform-origin: center center;
  z-index: 3;
}

.line {
  position: absolute;
  white-space: pre;
  color: var(--ink);
  font-weight: 450;
  letter-spacing: 0.002em;
  user-select: text;
  cursor: text;
  transition: color 120ms ease;
  z-index: 1;
}

.line:hover {
  color: var(--accent);
}
```

### Step 3: Update `src/script.js`

```javascript
import './layout-engine.js'
```

### Step 4: Verify in browser

Run: `npx vite`
Open: `http://localhost:5173/src/index.html`

Expected: Dark page with light-colored text. Layout renders correctly. Canvas is black behind text. No ASCII art yet (that comes in Task 4+).

### Step 5: Commit

```bash
git add src/index.html src/style.css src/script.js
git commit -m "feat: fused HTML structure with dark theme for ASCII layout"
```

---

## Task 3: Create `src/ascii-renderer.js`

**Files:**
- Create: `src/ascii-renderer.js`
- Modify: `src/asciiTexture.js` (remove debug DOM append)

### Step 1: Fix `asciiTexture.js` — remove debug canvas append

In `src/asciiTexture.js`, remove these two lines (~line 26-27):

```javascript
// DELETE these two lines:
canvas.style.zIndex = 10
document.body.appendChild(canvas)
```

### Step 2: Create `src/ascii-renderer.js`

```javascript
import * as THREE from 'three/webgpu'
import { pass, renderOutput } from 'three/tsl'
import { createASCIITexture } from './asciiTexture.js'
import { createInstancedGridMaterial } from './material.js'
import imageUrl from './image.png'

const IMAGE_ASPECT = 672 / 1024
const GRID_COLS = 192
const GRID_ROWS = Math.round(GRID_COLS * IMAGE_ASPECT)
const CELL_SIZE = 0.1
const MESH_NATIVE_W = GRID_ROWS * CELL_SIZE
const MESH_NATIVE_H = GRID_COLS * CELL_SIZE

/**
 * Initialize the ASCII art renderer on the given canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<{
 *   sync: (rect: {x:number,y:number,width:number,height:number}, angle: number) => void,
 *   render: () => void,
 *   resize: (w: number, h: number) => void,
 *   dispose: () => void,
 * }>}
 */
export async function initAsciiRenderer(canvas) {
  const renderer = new THREE.WebGPURenderer({ canvas, forceWebGL: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#000000', 1)

  const scene = new THREE.Scene()

  const w = canvas.clientWidth || window.innerWidth
  const h = canvas.clientHeight || window.innerHeight
  renderer.setSize(w, h)

  // Orthographic camera: 1 unit = 1 pixel, Y-down (matches DOM coordinates).
  // top=0, bottom=h means Y increases downward like CSS.
  const camera = new THREE.OrthographicCamera(0, w, 0, h, -1, 1)
  camera.position.set(0, 0, 0)

  // Post-processing pipeline (consistent with project's existing pattern)
  const postProcessing = new THREE.RenderPipeline(renderer)
  postProcessing.outputColorTransform = false
  const scenePass = pass(scene, camera)
  postProcessing.outputNode = renderOutput(scenePass)

  // Load image texture
  const imageTexture = await new THREE.TextureLoader().loadAsync(imageUrl)
  await document.fonts.load('700 48px "UnifrakturCook"')
  await document.fonts.ready

  imageTexture.colorSpace = THREE.SRGBColorSpace
  imageTexture.wrapS = THREE.ClampToEdgeWrapping
  imageTexture.wrapT = THREE.ClampToEdgeWrapping
  imageTexture.minFilter = THREE.LinearMipmapLinearFilter
  imageTexture.magFilter = THREE.LinearFilter
  imageTexture.generateMipmaps = true

  // ASCII glyph atlas
  const { texture: asciiAtlas, charCount } = createASCIITexture()

  // Reuse existing TSL material
  const { material } = createInstancedGridMaterial(imageTexture, asciiAtlas, charCount)

  // Build instanced grid
  const count = GRID_ROWS * GRID_COLS
  const geometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE, 1, 1)
  const aUvArray = new Float32Array(count * 2)
  const mesh = new THREE.InstancedMesh(geometry, material, count)

  const mat4 = new THREE.Matrix4()
  const pos = new THREE.Vector3()

  for (let i = 0; i < GRID_ROWS; i++) {
    for (let j = 0; j < GRID_COLS; j++) {
      const idx = i * GRID_COLS + j
      pos.set(i * CELL_SIZE, j * CELL_SIZE, 0)
      mat4.identity().setPosition(pos)
      mesh.setMatrixAt(idx, mat4)
      aUvArray[idx * 2] = GRID_ROWS > 1 ? i / (GRID_ROWS - 1) : 0.5
      aUvArray[idx * 2 + 1] = GRID_COLS > 1 ? j / (GRID_COLS - 1) : 0.5
    }
  }

  geometry.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUvArray, 2))
  mesh.instanceMatrix.needsUpdate = true

  // Group for center-pivot rotation:
  // mesh is offset so its center sits at group origin.
  const group = new THREE.Group()
  mesh.position.set(-MESH_NATIVE_W / 2, -MESH_NATIVE_H / 2, 0)
  group.add(mesh)
  scene.add(group)

  return {
    /** Position and scale the ASCII art to cover the given screen rect. */
    sync(rect, angle) {
      const scale = rect.height / MESH_NATIVE_H
      group.position.set(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        0,
      )
      group.scale.set(scale, scale, 1)
      group.rotation.z = angle
    },

    render() {
      postProcessing.render()
    },

    resize(width, height) {
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      camera.right = width
      camera.bottom = height
      camera.updateProjectionMatrix()
    },

    dispose() {
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      imageTexture.dispose()
      asciiAtlas.dispose()
    },
  }
}
```

### Step 3: Verify module compiles

Run: `npx vite build --mode development 2>&1 | head -20`

Expected: No import or syntax errors.

### Step 4: Commit

```bash
git add src/ascii-renderer.js src/asciiTexture.js
git commit -m "feat: create ascii-renderer module with orthographic camera sync"
```

---

## Task 4: Fix `pearlRect` Aspect Ratio

**Files:**
- Modify: `src/layout-engine.js`

### Step 1: Add aspect constant

Near top of file (after other constants):

```javascript
const IMAGE_ASPECT = 672 / 1024
```

### Step 2: Modify wide-layout `pearlRect`

Find the wide-layout pearlRect calculation in `buildLayout()`. Change:

```javascript
// BEFORE:
const pearlSize = Math.round(Math.max(600, Math.min(1440, contentWidth * 0.84, pageHeight * 1.16)))
// ... (existing code) ...
const pearlRect = {
    x: contentInsetX + contentWidth - Math.round(pearlSize * 0.9),
    y: 0,
    width: pearlSize,
    height: pearlSize,
}

// AFTER:
const pearlHeight = Math.round(Math.max(600, Math.min(1440, contentWidth * 0.84, pageHeight * 1.16)))
const pearlWidth = Math.round(pearlHeight * IMAGE_ASPECT)
const pearlRect = {
    x: contentInsetX + contentWidth - Math.round(pearlWidth * 0.9),
    y: 0,
    width: pearlWidth,
    height: pearlHeight,
}
```

### Step 3: Modify narrow-layout `pearlRect`

Find the narrow-layout pearlRect. Change:

```javascript
// BEFORE:
const pearlSize = Math.round(Math.min(92, contentWidth * 0.23, pageHeight * 0.11))
const pearlRect = {
    x: contentInsetX + contentWidth - gutter - Math.round(pearlSize * 0.88),
    y: 4,
    width: pearlSize,
    height: pearlSize,
}

// AFTER:
const pearlHeight = Math.round(Math.min(92, contentWidth * 0.23, pageHeight * 0.11))
const pearlWidth = Math.round(pearlHeight * IMAGE_ASPECT)
const pearlRect = {
    x: contentInsetX + contentWidth - gutter - Math.round(pearlWidth * 0.88),
    y: 4,
    width: pearlWidth,
    height: pearlHeight,
}
```

### Step 4: Verify text reflow

Open page in browser. Resize window. Drag/zoom illustration.

Expected: Text still reflows correctly. SVG now fills pearlRect without letterboxing.

### Step 5: Commit

```bash
git add src/layout-engine.js
git commit -m "fix: use 672:1024 aspect ratio for pearlRect instead of square"
```

---

## Task 5: Integrate ASCII Renderer into Layout Loop

**Files:**
- Modify: `src/layout-engine.js`

### Step 1: Add import

At top of `layout-engine.js`:

```javascript
import { initAsciiRenderer } from './ascii-renderer.js'
```

### Step 2: Initialize renderer after font/hull preload

Find the existing `await Promise.all([ ... ])` block. After it, add:

```javascript
const canvasEl = document.querySelector('canvas.webgl')
if (!(canvasEl instanceof HTMLCanvasElement)) throw new Error('canvas.webgl not found')
const asciiRenderer = await initAsciiRenderer(canvasEl)
```

### Step 3: Hook sync + render into `commitFrame()`

At the end of `commitFrame()`, just before `return animating`, add:

```javascript
asciiRenderer.sync(layout.pearlRect, logoAnimations.pearl.angle)
asciiRenderer.render()
```

`layout` is the local variable already computed in `commitFrame` — it has the final `pearlRect` after scale + drag transforms.

### Step 4: Hook resize

Find `window.addEventListener('resize', scheduleRender)`. Replace with:

```javascript
window.addEventListener('resize', () => {
  const root = document.documentElement
  asciiRenderer.resize(root.clientWidth, root.clientHeight)
  scheduleRender()
})
```

### Step 5: Hide SVG image

In the `projectChromeLayout()` function, after the existing pearlArt style updates, add:

```javascript
domCache.pearlArt.style.opacity = '0'
domCache.pearlArt.style.pointerEvents = 'none'
```

### Step 6: Verify in browser

Expected:
- Black page with ASCII art rendering where SVG was
- Light-colored text wraps around the image
- Drag/zoom/rotate — ASCII art follows text layout in sync
- Resize window — both adapt

### Step 7: Commit

```bash
git add src/layout-engine.js
git commit -m "feat: integrate ascii-renderer into layout commit loop"
```

---

## Task 6: Debug Overlay + Cleanup

**Files:**
- Modify: `src/layout-engine.js`

### Step 1: Add debug state

Near other `let` declarations at the top:

```javascript
let debugOverlay = false
```

### Step 2: Wire to SVG visibility

In `projectChromeLayout()`, replace the hardcoded `opacity = '0'` from Task 5:

```javascript
domCache.pearlArt.style.opacity = debugOverlay ? '0.35' : '0'
domCache.pearlArt.style.pointerEvents = 'none'
```

### Step 3: Add keyboard shortcut

After the existing event listeners (near the end of the file):

```javascript
document.addEventListener('keydown', (event) => {
  if (event.key === 'd' && !event.ctrlKey && !event.metaKey) {
    debugOverlay = !debugOverlay
    scheduleRender()
  }
})
```

### Step 4: Verify

- Open page → ASCII art visible, text wraps
- Press D → SVG outline appears semi-transparent (check alignment)
- Press D → SVG disappears

### Step 5: Commit

```bash
git add src/layout-engine.js
git commit -m "feat: add debug overlay toggle (D key) for alignment check"
```

---

## Task 7: Final Cleanup

**Files:**
- Delete: `src/dynamic-layout/` (entire directory)

### Step 1: Delete old directory

```bash
rm -rf src/dynamic-layout/
```

### Step 2: Full integration test

1. Open page — ASCII art visible, text wraps around it
2. Drag image — text reflows, ASCII art follows in sync
3. Wheel zoom — both scale together
4. Short click — image rotates, both follow
5. Resize window — everything adapts
6. Press D — SVG debug overlay toggles on/off
7. Check narrow viewport (<760px) — mobile layout works

### Step 3: Commit

```bash
git add -A
git commit -m "chore: remove old dynamic-layout directory, cleanup complete"
```

---

## Reference: Layer Stack

```
Browser viewport
├── <canvas.webgl>              z:0  fixed, full viewport, black bg
│   └── Three.js WebGPU
│       ├── OrthographicCamera  (0,W) × (0,H), 1 unit = 1 px, Y-down
│       └── Group               position = pearlRect center
│           └── InstancedMesh   126×192 cells, ASCII TSL shader
│
├── <main.page>                 z:1  relative, transparent bg
│   ├── .hint-pill
│   └── #stage
│       ├── h1.headline > span.headline-line ×N
│       ├── p.credit
│       ├── span.line ×N (body text, light color)
│       └── img.logo (SVG) — opacity:0 unless debug
```

## Reference: Data Flow

```
User pointer/wheel event
  → Layout pointer handlers (existing, unchanged)
  → pearlUserScale / pearlDragOffset / spin state
  → scheduleRender()
  → requestAnimationFrame → render(now)
    → commitFrame(now)
      → buildLayout()        → pearlRect (672:1024 aspect)
      → scalePearlRect()     → user zoom applied
      → translatePearlRect() → user drag applied
      → evaluateLayout()     → headline/body lines + hull hits
      → projectChromeLayout()→ DOM element positions
      → projectTextProjection() → text span content
      → asciiRenderer.sync(pearlRect, angle)   ← NEW
      → asciiRenderer.render()                  ← NEW
```

## Reference: Sync Math

```
// pearlRect and mesh share 672:1024 aspect ratio
// → scaleX === scaleY → one uniform scale factor

scale = pearlRect.height / MESH_NATIVE_H

group.position = (pearlRect.x + pearlRect.width/2, pearlRect.y + pearlRect.height/2, 0)
group.scale    = (scale, scale, 1)
group.rotation.z = angle
```
