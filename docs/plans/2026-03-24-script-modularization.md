# Script Modularization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split `src/script.js` into `main.js`, `material.js`, `gui.js`, and `loop.js` while preserving current runtime behavior.

**Architecture:** Keep a single app entry and move responsibilities by concern: shader/material graph in `material.js`, UI controls in `gui.js`, frame update/render in `loop.js`, and wiring/bootstrap in `main.js`.

**Tech Stack:** Three.js WebGPU (`three/webgpu`), TSL (`three/tsl`), Vite, lil-gui.

---

### Task 1: Extract material module

**Files:**
- Create: `src/material.js`
- Modify: `src/script.js`

**Step 1: Create `createDemoMaterial()`**
- Move `limitPosition`, uniforms, oscillation/displaced nodes, and `material` setup into `createDemoMaterial`.
- Return `{ material, uniforms }`.

**Step 2: Use module from `script.js`**
- Import `createDemoMaterial`.
- Replace inline material creation with module call.

**Step 3: Verify build**
Run: `pnpm run build`  
Expected: Build succeeds.

---

### Task 2: Extract GUI module

**Files:**
- Create: `src/gui.js`
- Modify: `src/script.js`

**Step 1: Create `setupGui(uniforms)`**
- Move lil-gui creation and three sliders into `setupGui`.
- Return created `gui`.

**Step 2: Use module from `script.js`**
- Remove inline GUI setup.
- Call `setupGui(uniforms)` from bootstrap flow.

**Step 3: Verify build**
Run: `pnpm run build`  
Expected: Build succeeds.

---

### Task 3: Extract loop module

**Files:**
- Create: `src/loop.js`
- Modify: `src/script.js`

**Step 1: Create `startLoop({ renderer, postProcessing, controls })`**
- Move `tick` function and `renderer.setAnimationLoop`.
- Keep render call as `postProcessing.render()`.

**Step 2: Use module from `script.js`**
- Replace inline loop with `startLoop(...)`.

**Step 3: Verify build**
Run: `pnpm run build`  
Expected: Build succeeds.

---

### Task 4: Introduce main entry and keep compatibility

**Files:**
- Create: `src/main.js`
- Modify: `src/script.js`

**Step 1: Move orchestration to `main.js`**
- Scene/camera/controls/renderer/postfx setup and mesh creation remain in entry.
- `main.js` imports and wires `material.js`, `gui.js`, `loop.js`.

**Step 2: Keep `script.js` minimal**
- Option A: `script.js` re-export/forward to `main.js`.
- Option B: Switch `index.html` import to `main.js` directly.

**Step 3: Verify build and quick runtime**
Run: `pnpm run build`  
Expected: Build succeeds; runtime behavior unchanged.

---

### Task 5: Final verification checklist

**Files:**
- Modify: `src/main.js` (if needed)

**Step 1: Validate behavior**
- Orbit controls works.
- GUI sliders affect displacement as before.
- Torus mesh and axis helper render.
- Post processing still uses output pass.

**Step 2: Lint check**
Run lints for changed files and resolve introduced issues.

**Step 3: Optional commit**
If user requests commit, stage only related files and commit with a concise message.
