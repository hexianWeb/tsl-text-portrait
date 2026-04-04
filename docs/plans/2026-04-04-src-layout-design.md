# `src/` 目錄職責拆分 — 設計說明

**狀態：** 已定稿（2026-04-04）  
**目標：** 在維持淺層結構（2～4 個頂層資料夾）的前提下，按職責整理 `src/`，便於長期維護。

---

## 背景

- Vite `root` 為 `src/`（見專案根目錄 `vite.config.js`）。
- 目前主入口：`index.html` → `script.js` → `layout-engine.js`（ASCII / 排版整合流程）。
- `main.js` 為另一條 WebGPU 網格 demo 路線，僅與 `gui.js`、`loop.js`、`asciiTexture.js`、`material.js`、圖片資源相關。

## 目錄結構（方案 1 — 四資料夾）

保留在 **`src/` 根目錄**：

- `index.html`
- `style.css`

新建並歸檔：

| 資料夾 | 檔案 | 職責 |
|--------|------|------|
| `app/` | `script.js`, `main.js`, `gui.js`, `loop.js` | 啟動腳本、可選次要入口、Inspector UI、動畫迴圈 |
| `layout/` | `layout-engine.js`, `layout-text.js`, `wrap-geometry.js` | 排版、文案資料、幾何輔助 |
| `render/` | `ascii-renderer.js`, `asciiTexture.js`, `material.js` | WebGPU / TSL 渲染與材質 |
| `assets/` | `image.png`, `symbol2.svg` | 由 JS `import` 的媒體資源 |

## 約定

1. **模組引用：** 第一階段僅使用**相對路徑**，不新增 Vite `resolve.alias`。
2. **HTML：** `index.html` 中樣式仍為 `./style.css`；模組入口改為 `./app/script.js`（實作時精確更新）。
3. **`main.js`：** 保留為**次要／參考入口**；預設不修改 `index.html` 指向它；若需啟用，改 `script` 的 `src` 即可（實作計畫中註明）。
4. **`src/UI` 與 `.gitignore`：** 本輪**不調整** `/src/UI*` 忽略策略；若未來要納版控，另開決策。

## 成功標準

- `pnpm dev` 與 `pnpm build` 成功，無模組解析錯誤。
- 預設從 `index.html` 進入的行為與重構前一致（仍以 `script.js` 為入口鏈）。

## 曾考慮的替代方案（簡記）

- **三資料夾：** `layout/` + `render/` + `assets/`，其餘留在 `src/` 根 — 根目錄仍易堆積，故不採用。
- **單一功能大包：** 不符合「按職責」與「淺層」目標，故不採用。

## 後續

實作步驟見同日期之 **Implementation Plan**（`docs/plans/2026-04-04-src-folder-layout.md`）。
