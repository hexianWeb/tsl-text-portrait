# Inspector `#debug` hash gate — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Attach Three.js Inspector only when `window.location.hash === '#debug'`, using one shared helper for both entry points.

**Architecture:** Add `src/app/inspector-debug.js` exporting `isInspectorDebugEnabled()`. In `main.js` and `ascii-renderer.js`, create `Inspector` and assign `renderer.inspector` only when that function returns true; call `setupInspector` / `setupAsciiLayoutInspector` only in that case.

**Tech Stack:** Vite, Three.js WebGPU, existing `Inspector` addon.

---

### Task 1: Helper module

**Files:**
- Create: `src/app/inspector-debug.js`

**Step 1:** Add `isInspectorDebugEnabled()` returning `window.location.hash === '#debug'` with a short JSDoc (why and example URL).

**Step 2:** Commit

```bash
git add src/app/inspector-debug.js
git commit -m "feat(app): add isInspectorDebugEnabled for Inspector gate"
```

---

### Task 2: `main.js`

**Files:**
- Modify: `src/app/main.js`

**Step 1:** Import `isInspectorDebugEnabled` from `./inspector-debug.js`.

**Step 2:** Replace unconditional `new Inspector()` / `renderer.inspector = inspector` with: if enabled, create inspector and assign; otherwise leave `renderer.inspector` unset.

**Step 3:** Wrap `setupInspector(...)` in `if (inspector)` (or equivalent) so it only runs when inspector exists.

**Step 4:** Run `npm run build` — expect exit 0.

**Step 5:** Commit

```bash
git add src/app/main.js
git commit -m "feat(app): gate Inspector on #debug in main entry"
```

---

### Task 3: `ascii-renderer.js`

**Files:**
- Modify: `src/render/ascii-renderer.js`

**Step 1:** Import `isInspectorDebugEnabled` from `../app/inspector-debug.js`.

**Step 2:** Same conditional pattern as Task 2; update the comment above `renderer.inspector` assignment to mention the `#debug` gate.

**Step 3:** Call `setupAsciiLayoutInspector` only when inspector exists.

**Step 4:** Run `npm run build` — expect exit 0.

**Step 5:** Commit

```bash
git add src/render/ascii-renderer.js
git commit -m "feat(render): gate ASCII layout Inspector on #debug"
```

---

### Task 4: Design doc (if not already committed)

**Files:**
- Add: `docs/plans/2026-04-07-inspector-debug-hash-design.md`
- Add: `docs/plans/2026-04-07-inspector-debug-hash.md`

**Step 1:** Commit plan/design alongside code or in a docs-only commit.

---

**Manual test:** Dev server → default URL: no inspector. Same URL with `#debug` and reload: inspector visible.

**Plan complete and saved to `docs/plans/2026-04-07-inspector-debug-hash.md`. Two execution options:**

**1. Subagent-Driven (this session)** — dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — open new session with executing-plans, batch execution with checkpoints

**Which approach?**
