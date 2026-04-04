/**
 * Layout / typography / interaction tuning for the Pearl Maiden showcase.
 * 版面、字體與互動相關可調參數（集中於此便於修改）。
 */

/** 正文區塊使用的字體 CSS 字串（供 pretext 量測與排版）。 */
export const BODY_FONT = '16px "IM Fell English", serif'

/** 正文行高（px），與 CSS line-height 語意一致。 */
export const BODY_LINE_HEIGHT = 28

/** Credit 行字體；需與 DOM 樣式一致以便量測寬度。 */
export const CREDIT_FONT = 'italic 20px "EB Garamond", serif'

/** Credit 行高（px）。 */
export const CREDIT_LINE_HEIGHT = 16

/** 主標題字族（不含字重／大小，由 fitHeadlineFontSize 決定）。 */
export const HEADLINE_FONT_FAMILY = '"IM Fell English SC", serif'

/**
 * 頂部提示 pill / 安全區：標題區 `y` 不得小於此值，避免與 UI 重疊。
 */
export const HINT_PILL_SAFE_TOP = 100

/** 視窗寬度低於此值（px）時切換為窄版單欄排版。 */
export const NARROW_BREAKPOINT = 380

/** 窄版時單欄最大寬度（px），避免在寬螢幕上過寬（若內容帶更寬則居中）。 */
export const NARROW_COLUMN_MAX_WIDTH = 430

/**
 * 左右頁邊：視窗寬度 × 此比例從兩側各裁掉，中間為內容帶（文字與主圖）。
 */
export const LAYOUT_SIDE_INSET = 0.05

/** Pearl 插圖 SVG / 點陣的寬高比（與 viewBox 672×1024 一致）。 */
export const IMAGE_ASPECT = 672 / 1024

/**
 * 滾輪縮放插圖時，目前縮放向目標值收斂的速率（越大越快、越「跟手」）。
 */
export const PEARL_SCALE_SMOOTH_LAMBDA = 14

/** 使用者縮放插圖的最小倍率（相對於版面自動算的 pearlRect）。 */
export const PEARL_USER_SCALE_MIN = 0.5

/** 使用者縮放插圖的最大倍率。 */
export const PEARL_USER_SCALE_MAX = 2

/**
 * 拖曳插圖時，移動超過此像素數才視為拖曳；否則放開可當作「點擊旋轉」。
 */
export const LOGO_DRAG_CLICK_THRESHOLD_PX = 8
