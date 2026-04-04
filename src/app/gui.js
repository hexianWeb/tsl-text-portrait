import { ASCII_FONT_PRESETS } from '../render/ascii-font-presets.js'

/**
 * Inspector: luminance exponent, color/source toggles, glyph jitter and time animation.
 *
 * @param {import('three/addons/inspector/Inspector.js').Inspector} inspector
 * @param {object} uniforms
 */

export function setupInspector(inspector, {
  luminanceExponentUniform,
  useTextureColorUniform,
  showOriginalImageUniform,
  glyphLuminanceJitterUniform,
  glyphTimeOscillationUniform,
  oscTimeScaleUniform,
}) {
  const group = inspector.createParameters('Instanced grid')

  const ui = {
    get luminanceExponent() {
      return luminanceExponentUniform.value
    },
    set luminanceExponent(v) {
      luminanceExponentUniform.value = v
    },

    get useTextureColor() {
      return useTextureColorUniform.value > 0.5
    },
    set useTextureColor(v) {
      useTextureColorUniform.value = v ? 1 : 0
    },

    get showOriginalImage() {
      return showOriginalImageUniform.value > 0.5
    },
    set showOriginalImage(v) {
      showOriginalImageUniform.value = v ? 1 : 0
    },

    get glyphLuminanceJitter() {
      return glyphLuminanceJitterUniform.value
    },
    set glyphLuminanceJitter(v) {
      glyphLuminanceJitterUniform.value = v
    },

    get glyphTimeOscillation() {
      return glyphTimeOscillationUniform.value
    },
    set glyphTimeOscillation(v) {
      glyphTimeOscillationUniform.value = v
    },

    get oscTimeScale() {
      return oscTimeScaleUniform.value
    },
    set oscTimeScale(v) {
      oscTimeScaleUniform.value = v
    },
  }

  group.add(ui, 'luminanceExponent', 0.1, 5, 0.05)
  group.add(ui, 'useTextureColor')
  group.add(ui, 'showOriginalImage')
  group.add(ui, 'glyphLuminanceJitter', 0, 0.5, 0.005)
  group.add(ui, 'glyphTimeOscillation', 0, 0.35, 0.005)
  group.add(ui, 'oscTimeScale', 0.05, 6, 0.05)
}

/**
 * Layout ASCII demo: font preset, grid resolution, and instanced-grid uniforms.
 *
 * @param {import('three/addons/inspector/Inspector.js').Inspector} inspector
 * @param {object} api
 */
export function setupAsciiLayoutInspector(inspector, api) {
  const presetLabels = ASCII_FONT_PRESETS.map((p) => p.label)

  const atlasGroup = inspector.createParameters('ASCII atlas')
  atlasGroup.add(api, 'fontPresetLabel', presetLabels)

  const gridGroup = inspector.createParameters('Grid')
  gridGroup.add(api, 'gridCols', 8, 512, 1)
  gridGroup.add(api, 'cellSize', 0.02, 0.5, 0.005)

  setupInspector(inspector, {
    luminanceExponentUniform: api.luminanceExponentUniform,
    useTextureColorUniform: api.useTextureColorUniform,
    showOriginalImageUniform: api.showOriginalImageUniform,
    glyphLuminanceJitterUniform: api.glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform: api.glyphTimeOscillationUniform,
    oscTimeScaleUniform: api.oscTimeScaleUniform,
  })
}
