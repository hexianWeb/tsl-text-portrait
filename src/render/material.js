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
  pow,
  floor,
  uv,
  vec2,
  dot,
  clamp,
  hash,
  remapClamp,
  time,
  oscSine,
  uniformTexture,
} from 'three/tsl'

/**
 * Instanced grid: `aUv` samples the photo; `uv` maps each cell quad into one glyph in `asciiAtlas`.
 * Glyph tint can switch between grayscale and original texture color.
 * Glyph index uses spatial `hash(aUv)` plus
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
  const useTextureColorUniform = uniform(1)
  const showOriginalImageUniform = uniform(0)
  /** Spatial: remapClamp(hash,0,1,-1,1) * this, added to lCurve for glyph pick. */
  const glyphLuminanceJitterUniform = uniform(0.12)
  /** Temporal: remapClamp(oscSine,0,1,-1,1) * this; 0 disables oscillation. */
  const glyphTimeOscillationUniform = uniform(0.06)
  /** Multiplies `time` before oscSine for exponent + glyph paths (glyph uses 0.5× this). */
  const oscTimeScaleUniform = uniform(0.3)

  const charCountUniform = uniform(charCount)
  /** Swappable atlas; update `.value` when regenerating `createASCIITexture`. */
  const asciiAtlasNode = uniformTexture(asciiAtlas)

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
    const tint = mix(linearGray, texColor.rgb, useTextureColorUniform)

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
    const asciiSample = texture(asciiAtlasNode, vec2(uAtlas, vAtlas))
    const shaded = asciiSample.rgb.mul(tint)
    const finalRgb = mix(shaded, texColor.rgb, showOriginalImageUniform)

    return vec4(finalRgb, 1.0)
  })

  material.outputNode = asciiCodeStyle()

  return {
    material,
    asciiAtlasNode,
    charCountUniform,
    luminanceExponentUniform,
    useTextureColorUniform,
    showOriginalImageUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
  }
}
