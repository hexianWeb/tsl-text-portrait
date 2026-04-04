/**
 * Preset fonts for ASCII atlas rasterization (canvas 2D `ctx.font`).
 * Extend this list as you add @font-face or system fonts.
 */

/** @typedef {{ id: string, label: string, fontCss: string }} AsciiFontPreset */

/** @type {AsciiFontPreset[]} */
export const ASCII_FONT_PRESETS = [
  {
    id: 'unifraktur-default',
    label: 'UnifrakturCook (default)',
    fontCss: 'bold 60px "UnifrakturCook", cursive',
  },
]

/**
 * @param {string} id
 * @returns {AsciiFontPreset}
 */
export function getPresetById(id) {
  const found = ASCII_FONT_PRESETS.find((p) => p.id === id)
  return found ?? ASCII_FONT_PRESETS[0]
}
