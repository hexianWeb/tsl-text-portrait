# 單檔拆分設計（方案 3）

**日期：** 2026-03-24  
**目標：** 將 `src/script.js` 拆成 4 個檔案，提升可讀性與教學可維護性，並維持現有行為。

## 已確認方案

採用 **方案 3（半工程、最小拆分）**，保留單入口，避免過度工程化。

## 模組邊界

- `src/main.js`
  - 負責組裝所有模組與啟動流程。
  - 不包含 shader 細節與 GUI 細節。
- `src/material.js`
  - 負責 TSL 函數與材質節點圖。
  - 包含 `limitPosition`、`positionNode`、`colorNode`、uniforms。
- `src/gui.js`
  - 只負責建立 `lil-gui` 並綁定 uniforms。
  - 不直接操控 renderer/scene。
- `src/loop.js`
  - 只負責動畫迴圈與每幀調用順序。
  - 不包含材質建構與 UI 綁定。

## 資料流

`main -> createDemoMaterial() -> { material, uniforms } -> setupGui(uniforms)`  
`main -> startLoop({ renderer, postProcessing, controls })`

## 函式簽名（設計約定）

- `createDemoMaterial() => { material, uniforms }`
- `setupGui(uniforms) => gui`
- `startLoop({ renderer, postProcessing, controls }) => void`

## 遷移順序

1. 先抽 `material.js`（邏輯最集中、風險最低）。
2. 抽 `gui.js`（只改綁定位置，不改參數語意）。
3. 抽 `loop.js`（保持每幀順序不變）。
4. 新建 `main.js` 並讓 `src/script.js` 做最小轉接（或直接改入口到 `main.js`）。

## 風險與緩解

- **風險：** import 路徑或命名錯誤造成啟動失敗。  
  **緩解：** 每一步拆分後立即執行 build 驗證。
- **風險：** uniforms 引用斷開，GUI 不再生效。  
  **緩解：** 維持同一物件引用，僅移動定義位置。
- **風險：** RenderPipeline 呼叫方式被改壞。  
  **緩解：** 固定 `postProcessing.render()`（不傳 scene/camera）。

## 驗收標準

- 專案可正常啟動（`pnpm dev` / `pnpm run build`）。
- 畫面行為與拆分前一致（幾何位移、顏色、控制器可用）。
- GUI 三個參數仍可調整且有即時效果。
- 程式碼結構符合 4 檔案分工，`main.js` 僅做組裝。
