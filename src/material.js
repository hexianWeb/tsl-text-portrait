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
  floor,
  uv,
  vec2,
  dot,
  clamp,
  hash,
  remapClamp,
  time,
  oscSine,
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
 * Instanced grid: `aUv` samples the photo; `uv` maps each cell quad into one glyph in `asciiAtlas`.
 * Palette uses original curved luminance. Glyph index uses spatial `hash(aUv)` plus
 * optional time-based `oscSine(time)` — both scaled and combined, then clamped.
 *
 * @param {THREE.Texture} map - Source image (per-instance UV in aUv).
 * @param {THREE.Texture} asciiAtlas - Horizontal strip, one char per cell (see asciiTexture.js).
 * @param {number} charCount - Glyph count N; must match atlas width / cell width.
 */
export function createInstancedGridMaterial(map, asciiAtlas, charCount) {
  const material = new THREE.NodeMaterial({
    wireframe: false,
    side: THREE.DoubleSide,
  })

  /** Contrast on luminance: pow(l, exponent). Typical 2.2 for display-like separation. */
  const luminanceExponentUniform = uniform(0.65)
  const vaporwaveUniform = uniform(1)
  /** Spatial: remapClamp(hash,0,1,-1,1) * this, added to lCurve for glyph pick. */
  const glyphLuminanceJitterUniform = uniform(0.12)
  /** Temporal: remapClamp(oscSine,0,1,-1,1) * this; 0 disables oscillation. */
  const glyphTimeOscillationUniform = uniform(0.06)
  /** Multiplies `time` before oscSine for exponent + glyph paths (glyph uses 0.5× this). */
  const oscTimeScaleUniform = uniform(0.3)

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
  const charCountUniform = uniform(charCount)

  const asciiCodeStyle = Fn(() => {
    const aUv = attribute('aUv', 'vec2')
    const cellUv = uv()
    const texColor = texture(map, aUv)
    const l = luminance(texColor.rgb)
    // Exponent ±0.2 around the slider value (oscSine → [-1,1]).
    const expOscSigned = remapClamp(oscSine(time.mul(oscTimeScaleUniform)), 0, 1, -1, 1)
    const effectiveExponent = clamp(luminanceExponentUniform.add(expOscSigned.mul(0.10)), 0.05, 8)
    const lCurve = pow(l, effectiveExponent)
    const linearGray = vec3(lCurve, lCurve, lCurve)

    // 10 ranges: same curved luminance for palette selection.
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
    const tint = mix(linearGray, vaporRgb, vaporwaveUniform)

    // Spatial jitter (TSL hash + remapClamp); temporal jitter (oscSine in [0,1] → [-1,1]).
    const cellHash = hash(dot(aUv, vec2(12.9898, 78.233)))
    const hashSigned = remapClamp(cellHash, 0, 1, -1, 1)
    const oscPhase = oscSine(time.mul(oscTimeScaleUniform.mul(0.5)))
    const oscSigned = remapClamp(oscPhase, 0, 1, -1, 1)
    const perturb = hashSigned
      .mul(glyphLuminanceJitterUniform)
      .add(oscSigned.mul(glyphTimeOscillationUniform))
    const lForGlyph = clamp(lCurve.add(perturb), 0, 1)

    // Glyph index from perturbed luminance; atlas U spans [idx/N, (idx+1)/N), V uses mesh UV.
    const maxIdx = charCountUniform.sub(1)
    const glyphIdx = floor(lForGlyph.mul(maxIdx))
    const uAtlas = glyphIdx.add(cellUv.x).div(charCountUniform)
    const vAtlas = cellUv.y
    const asciiSample = texture(asciiAtlas, vec2(uAtlas, vAtlas))
    const shaded = asciiSample.rgb.mul(tint)

    return vec4(shaded, 1.0)
  })

  material.outputNode = asciiCodeStyle()

  return {
    material,
    luminanceExponentUniform,
    vaporwaveUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
    bandThresholdUniforms: { t1, t2, t3, t4, t5, t6, t7, t8, t9 },
  }
}
