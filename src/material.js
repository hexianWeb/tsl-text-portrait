import * as THREE from 'three/webgpu'
import {
  vec3,
  vec4,
  Fn,
  attribute,
  texture,
  luminance,
  uniform,
  mix,
  int,
  step,
  pow,
  uniformArray,
} from 'three/tsl'

/**
 * 10-step synthwave / vaporwave ramp (image: bottom → top).
 * Index 0 = dark (low luminance): indigo / blue-violet.
 * Index 9 = bright (high luminance): emerald green.
 */
const VAPORWAVE_HEX = [
  '#1E0F4A',
  '#4A1E7A',
  '#7B1FA2',
  '#BA68C8',
  '#E91E8C',
  '#FF6B9D',
  '#FF9E7A',
  '#FFEA7A',
  '#B2FF59',
  '#00FF9A',
]

function linearRgbFromHex(hex) {
  const c = new THREE.Color(hex)
  c.convertSRGBToLinear()
  return new THREE.Vector3(c.r, c.g, c.b)
}

/**
 * Instanced grid material: samples `map` with per-instance aUv (main.js InstancedBufferAttribute).
 * Luminance is raised to a configurable exponent (default 2.2) to stretch/crush contrast,
 * then remapped into 10 bands; thresholds t1…t9 split [0,1] in that adjusted space.
 *
 * @param {THREE.Texture} map - Loaded color texture; luminance is derived in the shader.
 */
export function createInstancedGridMaterial(map) {
  const material = new THREE.NodeMaterial({
    wireframe: false,
    side: THREE.DoubleSide,
  })

  /** Contrast on luminance: pow(l, exponent). Typical 2.2 for display-like separation. */
  const luminanceExponentUniform = uniform(0.65)
  const vaporwaveUniform = uniform(1)

  const t1 = uniform(0.1)
  const t2 = uniform(0.2)
  const t3 = uniform(0.3)
  const t4 = uniform(0.4)
  const t5 = uniform(0.5)
  const t6 = uniform(0.6)
  const t7 = uniform(0.7)
  const t8 = uniform(0.8)
  const t9 = uniform(0.9)

  const paletteLinear = uniformArray(VAPORWAVE_HEX.map(linearRgbFromHex), 'vec3')

  const asciiCodeStyle = Fn(() => {
    const aUv = attribute('aUv', 'vec2')
    const texColor = texture(map, aUv)
    const l = luminance(texColor.rgb)
    const lCurve = pow(l, luminanceExponentUniform)
    const linearGray = vec3(lCurve, lCurve, lCurve)

    // 10 ranges: step uses the same curved luminance as the grayscale preview.
    const bandIdx = int(
      step(t1, lCurve)
        .add(step(t2, lCurve))
        .add(step(t3, lCurve))
        .add(step(t4, lCurve))
        .add(step(t5, lCurve))
        .add(step(t6, lCurve))
        .add(step(t7, lCurve))
        .add(step(t8, lCurve))
        .add(step(t9, lCurve)),
    )

    const vaporRgb = paletteLinear.element(bandIdx)
    const mappedLinear = mix(linearGray, vaporRgb, vaporwaveUniform)

    return vec4(mappedLinear, 1.0)
  })

  material.outputNode = asciiCodeStyle()

  return {
    material,
    luminanceExponentUniform,
    vaporwaveUniform,
    bandThresholdUniforms: { t1, t2, t3, t4, t5, t6, t7, t8, t9 },
  }
}
