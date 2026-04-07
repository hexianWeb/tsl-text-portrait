import { ASCII_FONT_PRESETS } from '../render/ascii-font-presets.js'

/**
 * Inspector: luminance exponent, color/source toggles, glyph jitter and time animation.
 *
 * @param {import('three/addons/inspector/Inspector.js').Inspector} inspector
 * @param {object} uniforms
 * @param {{ includeLuminanceExponent?: boolean }} [options] - Layout page drives exponent from pearl scale; set false to hide slider.
 */

export function setupInspector(
  inspector,
  {
    luminanceExponentUniform,
    useTextureColorUniform,
    showOriginalImageUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
  },
  options = {},
) {
  const { includeLuminanceExponent = true } = options
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

  if (includeLuminanceExponent) {
    group.add(ui, 'luminanceExponent', 0.1, 3, 0.05)
  }
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
 * @param {{ includeGridCols?: boolean }} [options] - Pearl scale drives column count; set false to hide slider.
 */
export function setupAsciiLayoutInspector(inspector, api, options = {}) {
  const { includeGridCols = true } = options
  const presetLabels = ASCII_FONT_PRESETS.map((p) => p.label)

  const atlasGroup = inspector.createParameters('ASCII atlas')
  atlasGroup.add(api, 'fontPresetLabel', presetLabels)

  const gridGroup = inspector.createParameters('Grid')
  if (includeGridCols) {
    gridGroup.add(api, 'gridCols', 2, 192, 1)
  }
  gridGroup.add(api, 'cellSize', 0.02, 0.5, 0.005)

  setupInspector(
    inspector,
    {
      luminanceExponentUniform: api.luminanceExponentUniform,
      useTextureColorUniform: api.useTextureColorUniform,
      showOriginalImageUniform: api.showOriginalImageUniform,
      glyphLuminanceJitterUniform: api.glyphLuminanceJitterUniform,
      glyphTimeOscillationUniform: api.glyphTimeOscillationUniform,
      oscTimeScaleUniform: api.oscTimeScaleUniform,
    },
    { includeLuminanceExponent: false },
  )
}
