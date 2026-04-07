import * as THREE from 'three/webgpu'

/**
 * Ordered by apparent stroke density (sparse → dense), used as luminance ramp.
 * Matches the reference snippet: one char per 64×64 cell in a horizontal atlas.
 */
// Same order as reference: space, quote, then density ramp to '@'
export const ASCII_CHARSET =
  " \".-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@"

const CELL_PX = 64

const DEFAULT_FONT_CSS = 'bold 60px "UnifrakturCook", cursive'

/**
 * Rasterize each character into a single horizontal strip (black background, white glyphs).
 * Do not append the canvas to the DOM — only upload to GPU via CanvasTexture.
 *
 * @param {string} [charset] - defaults to {@link ASCII_CHARSET}
 * @param {{ fontCss?: string }} [options]
 * @returns {{ texture: THREE.CanvasTexture, charCount: number }}
 */
export function createASCIITexture(charset = ASCII_CHARSET, options = {}) {
  const fontCss = options.fontCss ?? DEFAULT_FONT_CSS
  const n = charset.length
  const canvas = document.createElement('canvas')
  canvas.width = n * CELL_PX
  canvas.height = CELL_PX

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('createASCIITexture: 2D context unavailable')
  }

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.font = fontCss
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const cx = i * CELL_PX + CELL_PX / 2
    const cy = CELL_PX / 2
    ctx.fillText(charset[i], cx, cy)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  return { texture, charCount: n }
}
