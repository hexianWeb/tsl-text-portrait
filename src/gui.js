/**
 * Inspector Parameters: luminance pow exponent, vaporwave toggle, and 9 band boundaries (10 ranges).
 *
 * @param {import('three/addons/inspector/Inspector.js').Inspector} inspector
 * @param {object} uniforms
 */

const THRESH_EPS = 0.008

/**
 * Keep t1 < … < t9 with minimum spacing.
 *
 * @param {{ t1: import('three/tsl').UniformNode<number>, t2: import('three/tsl').UniformNode<number>, t3: import('three/tsl').UniformNode<number>, t4: import('three/tsl').UniformNode<number>, t5: import('three/tsl').UniformNode<number>, t6: import('three/tsl').UniformNode<number>, t7: import('three/tsl').UniformNode<number>, t8: import('three/tsl').UniformNode<number>, t9: import('three/tsl').UniformNode<number> }} u
 */
function clampBandThresholds(u) {
  const min = THRESH_EPS
  const max = 1 - THRESH_EPS

  u.t1.value = Math.min(Math.max(u.t1.value, min), u.t2.value - THRESH_EPS)
  u.t2.value = Math.min(Math.max(u.t2.value, u.t1.value + THRESH_EPS), u.t3.value - THRESH_EPS)
  u.t3.value = Math.min(Math.max(u.t3.value, u.t2.value + THRESH_EPS), u.t4.value - THRESH_EPS)
  u.t4.value = Math.min(Math.max(u.t4.value, u.t3.value + THRESH_EPS), u.t5.value - THRESH_EPS)
  u.t5.value = Math.min(Math.max(u.t5.value, u.t4.value + THRESH_EPS), u.t6.value - THRESH_EPS)
  u.t6.value = Math.min(Math.max(u.t6.value, u.t5.value + THRESH_EPS), u.t7.value - THRESH_EPS)
  u.t7.value = Math.min(Math.max(u.t7.value, u.t6.value + THRESH_EPS), u.t8.value - THRESH_EPS)
  u.t8.value = Math.min(Math.max(u.t8.value, u.t7.value + THRESH_EPS), u.t9.value - THRESH_EPS)
  u.t9.value = Math.min(Math.max(u.t9.value, u.t8.value + THRESH_EPS), max)
}

export function setupInspector(inspector, { luminanceExponentUniform, vaporwaveUniform, bandThresholdUniforms }) {
  const group = inspector.createParameters('Instanced grid')
  const { t1, t2, t3, t4, t5, t6, t7, t8, t9 } = bandThresholdUniforms

  const ui = {
    get luminanceExponent() {
      return luminanceExponentUniform.value
    },
    set luminanceExponent(v) {
      luminanceExponentUniform.value = v
    },

    get vaporwaveBands() {
      return vaporwaveUniform.value > 0.5
    },
    set vaporwaveBands(v) {
      vaporwaveUniform.value = v ? 1 : 0
    },

    get bandEdge1() {
      return t1.value
    },
    set bandEdge1(v) {
      t1.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge2() {
      return t2.value
    },
    set bandEdge2(v) {
      t2.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge3() {
      return t3.value
    },
    set bandEdge3(v) {
      t3.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge4() {
      return t4.value
    },
    set bandEdge4(v) {
      t4.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge5() {
      return t5.value
    },
    set bandEdge5(v) {
      t5.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge6() {
      return t6.value
    },
    set bandEdge6(v) {
      t6.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge7() {
      return t7.value
    },
    set bandEdge7(v) {
      t7.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge8() {
      return t8.value
    },
    set bandEdge8(v) {
      t8.value = v
      clampBandThresholds(bandThresholdUniforms)
    },

    get bandEdge9() {
      return t9.value
    },
    set bandEdge9(v) {
      t9.value = v
      clampBandThresholds(bandThresholdUniforms)
    },
  }

  group.add(ui, 'luminanceExponent', 0.1, 5, 0.05)
  group.add(ui, 'vaporwaveBands')

  const bandFolder = group.addFolder('Band thresholds (10 ranges)')
  const sliderMax = 1 - THRESH_EPS
  const sliderStep = 0.005
  bandFolder.add(ui, 'bandEdge1', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge2', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge3', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge4', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge5', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge6', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge7', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge8', THRESH_EPS, sliderMax, sliderStep)
  bandFolder.add(ui, 'bandEdge9', THRESH_EPS, sliderMax, sliderStep)
}
