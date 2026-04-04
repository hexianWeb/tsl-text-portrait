# `src/` 職責目錄重排 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 依設計稿 `2026-04-04-src-layout-design.md` 將 `src/` 下 JS 與可 import 資源移入 `app/`、`layout/`、`render/`、`assets/`，並更新所有引用，使 dev/build 通過。

**Architecture:** 僅搬移檔案與修正相對 `import` / HTML `script` / CSS 中若有資源路徑；不引入 alias；`index.html` 與 `style.css` 留在 `src/` 根。

**Tech Stack:** Vite 5、ES modules、Three.js WebGPU（既有依賴不變）。

**設計依據：** `docs/plans/2026-04-04-src-layout-design.md`

---

### Task 1: 搬移 `assets` 並修正仍在 `src/` 根下的 import

**Files:**

- Move: `src/image.png` → `src/assets/image.png`
- Move: `src/symbol2.svg` → `src/assets/symbol2.svg`
- Modify: `src/ascii-renderer.js`（搬進 `render/` 前先改路徑，避免中途壞 build）
- Modify: `src/layout-engine.js`（同上）

**Step 1:** `git mv` 兩個媒體檔到 `src/assets/`。

**Step 2: 更新仍在根目錄的 `src/ascii-renderer.js`**

```javascript
import imageUrl from './assets/image.png'
```

**Step 3: 更新仍在根目錄的 `src/layout-engine.js`**

```javascript
import pearlMaidenArtUrl from './assets/symbol2.svg'
```

（此時 `ascii-renderer` 仍指向 `./asciiTexture.js` 等，勿改。）

**Step 4:** 執行 `pnpm build` 確認通過後再進入 Task 2。

---

### Task 2: 搬移 `render/` 模組

**Files:**

- Move: `src/ascii-renderer.js` → `src/render/ascii-renderer.js`
- Move: `src/asciiTexture.js` → `src/render/asciiTexture.js`
- Move: `src/material.js` → `src/render/material.js`

**Step 1: 更新 `src/render/ascii-renderer.js` 內 import**

圖片改為自 `render/` 出發：

```javascript
import imageUrl from '../assets/image.png'
```

`asciiTexture.js`、`material.js` 若僅 `three` 與互相 `./` 引用，可維持不變。

**Step 2:** `pnpm build` 應仍通過。

---

### Task 3: 搬移 `layout/` 模組

**Files:**

- Move: `src/layout-engine.js` → `src/layout/layout-engine.js`
- Move: `src/layout-text.js` → `src/layout/layout-text.js`
- Move: `src/wrap-geometry.js` → `src/layout/wrap-geometry.js`

**Step 1: 更新 `src/layout/layout-engine.js` 頂部 import**

- `layout-text`：`./layout-text.js`（不變）
- SVG：`import pearlMaidenArtUrl from '../assets/symbol2.svg'`
- `wrap-geometry`：`./wrap-geometry.js`（不變）
- `ascii-renderer`：`import { initAsciiRenderer } from '../render/ascii-renderer.js'`

**Step 2:** `pnpm build` 確認通過。

---

### Task 4: 搬移 `app/` 模組

**Files:**

- Move: `src/script.js` → `src/app/script.js`
- Move: `src/main.js` → `src/app/main.js`
- Move: `src/gui.js` → `src/app/gui.js`
- Move: `src/loop.js` → `src/app/loop.js`

**Step 1: 更新 `src/app/script.js`**

```javascript
import '../layout/layout-engine.js'
```

**Step 2: 更新 `src/app/main.js` 頂部 import**

```javascript
import { setupInspector } from './gui.js'
import { startLoop } from './loop.js'
import { createASCIITexture } from '../render/asciiTexture.js'
import { createInstancedGridMaterial } from '../render/material.js'
import imageUrl from '../assets/image.png'
```

**Step 3:** 在 `main.js` 檔案頂部加一行簡短英文註釋說明：此檔為次要入口，預設 HTML 未引用；需使用時將 `index.html` 的 script `src` 改為 `./app/main.js`。

**Step 4:** `gui.js` / `loop.js` 若無內部相對專案 import，可不改。

---

### Task 5: 更新 `index.html`

**Files:**

- Modify: `src/index.html`

將：

```html
<script type="module" src="./script.js"></script>
```

改為：

```html
<script type="module" src="./app/script.js"></script>
```

**Step 1:** 保存後執行 `pnpm dev`，手動確認頁面載入無控制台模組錯誤。

---

### Task 6: 建置驗證與提交

**Step 1: 建置**

Run: `pnpm build`  
Expected: 成功結束，`dist/` 更新無報錯。

**Step 2: 全域檢查遺漏路徑**

Run: `rg "from '\\./(layout-engine|ascii-renderer|asciiTexture|material|layout-text|wrap-geometry|gui|loop|main|script)\\.js'" src` 或手動搜尋舊路徑；Expected: 無誤指向已搬移檔名（允許 `layout/layout-engine.js` 等新路徑）。

**Step 3: Commit**

```bash
git add src/
git status
git commit -m "refactor: reorganize src into app, layout, render, and assets"
```

---

## 錯誤處理

- 若 Vite 報「無法解析 import」：對照本 plan 逐檔檢查相對路徑層級（`../` 數量）。
- 若圖片或 SVG 404：確認檔案已在 `src/assets/` 且 import 路徑為 `../assets/...`（相對於所屬 JS 檔）。

## 測試說明

本專案無自動化單元測試；以 **`pnpm dev` + `pnpm build`** 為回歸標準。可選：在瀏覽器確認互動（Orbit、debug 快捷鍵等）與重構前一致。

---

**Plan complete and saved to `docs/plans/2026-04-04-src-folder-layout.md`. Two execution options:**

1. **Subagent-Driven（本會話）** — 每個 task 派生子代理、任務間 review，迭代快  
2. **Parallel Session（另開會話）** — 新會話搭配 executing-plans，批次執行並設檢查點  

**Which approach?**
