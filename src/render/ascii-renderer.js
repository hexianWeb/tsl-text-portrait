import * as THREE from 'three/webgpu'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import { pass, renderOutput } from 'three/tsl'
import { createASCIITexture, ASCII_CHARSET } from './asciiTexture.js'
import { createInstancedGridMaterial } from './material.js'
import { getPresetById, ASCII_FONT_PRESETS } from './ascii-font-presets.js'
import { setupAsciiLayoutInspector } from '../app/gui.js'
import { isInspectorDebugEnabled } from '../app/inspector-debug.js'
import {
  mapPearlScaleToGridCols,
  mapPearlScaleToLuminanceExponent,
} from '../layout/config.js'
import imageUrl from '../assets/image.png'

const IMAGE_ASPECT = 672 / 1024
/** Avoid freezing the tab when grid resolution is set too high. */
const MAX_GRID_INSTANCES = 400_000

/**
 * @param {number} cols
 * @returns {number}
 */
function clampGridCols(cols) {
  let c = Math.max(4, Math.round(Number(cols)))
  let rows = Math.max(1, Math.round(c * IMAGE_ASPECT))
  let count = c * rows
  while (count > MAX_GRID_INSTANCES && c > 4) {
    c--
    rows = Math.max(1, Math.round(c * IMAGE_ASPECT))
    count = c * rows
  }
  if (count > MAX_GRID_INSTANCES) {
    console.warn(
      `initAsciiRenderer: grid capped at ${MAX_GRID_INSTANCES} instances (cols=${c}, rows=${rows})`,
    )
  }
  return c
}

/**
 * Initialize the ASCII art renderer on the given canvas.
 * Call {@link startRenderLoop} after the first layout frame so sync runs once first.
 * @param {HTMLCanvasElement} canvas
 */
export async function initAsciiRenderer(canvas) {
  const renderer = new THREE.WebGPURenderer({ canvas, forceWebGL: false })
  // When `#debug` is in the URL, assign before `init()` so `Renderer` calls `Inspector.init()` (profiler UI on `canvas.parentElement`).
  const inspector = isInspectorDebugEnabled() ? new Inspector() : null
  if (inspector) renderer.inspector = inspector

  await renderer.init()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#000000', 0)

  const scene = new THREE.Scene()

  const w = canvas.clientWidth || window.innerWidth
  const h = canvas.clientHeight || window.innerHeight
  renderer.setSize(w, h)

  // OrthographicCamera(left, right, top, bottom): must have top > bottom (Y-up).
  let viewHeight = h
  const camera = new THREE.OrthographicCamera(0, w, h, 0, -1, 1)
  camera.position.set(0, 0, 0)

  const sizeScratch = new THREE.Vector2()
  function updateCameraFromRendererSize() {
    renderer.getSize(sizeScratch)
    viewHeight = sizeScratch.y
    camera.left = 0
    camera.right = sizeScratch.x
    camera.top = sizeScratch.y
    camera.bottom = 0
    camera.updateProjectionMatrix()
  }
  updateCameraFromRendererSize()

  const postProcessing = new THREE.RenderPipeline(renderer)
  postProcessing.outputColorTransform = false
  const scenePass = pass(scene, camera)
  postProcessing.outputNode = renderOutput(scenePass)

  const imageTexture = await new THREE.TextureLoader().loadAsync(imageUrl)
  await Promise.all([
    document.fonts.load('700 48px "UnifrakturCook"'),
    document.fonts.load('400 48px "IM Fell English"'),
  ])
  await document.fonts.ready

  imageTexture.colorSpace = THREE.SRGBColorSpace
  imageTexture.wrapS = THREE.ClampToEdgeWrapping
  imageTexture.wrapT = THREE.ClampToEdgeWrapping
  imageTexture.minFilter = THREE.LinearMipmapLinearFilter
  imageTexture.magFilter = THREE.LinearFilter
  imageTexture.generateMipmaps = true

  const initialPreset = getPresetById(ASCII_FONT_PRESETS[0].id)
  const { texture: asciiAtlas, charCount } = createASCIITexture(ASCII_CHARSET, {
    fontCss: initialPreset.fontCss,
  })

  const {
    material,
    asciiAtlasNode,
    charCountUniform,
    luminanceExponentUniform,
    useTextureColorUniform,
    showOriginalImageUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
  } = createInstancedGridMaterial(imageTexture, asciiAtlas, charCount)

  const group = new THREE.Group()
  scene.add(group)

  /** Driven by pearl wheel scale via {@link mapPearlScaleToGridCols}; rebuild only when rounded value changes. */
  let gridCols = mapPearlScaleToGridCols(1)
  let cellSize = 0.1
  let gridRows = Math.max(1, Math.round(gridCols * IMAGE_ASPECT))
  let meshNativeH = gridCols * cellSize
  let meshNativeW = gridRows * cellSize

  let instancedMesh = null

  const mat4 = new THREE.Matrix4()
  const pos = new THREE.Vector3()

  function buildGrid() {
    gridCols = clampGridCols(gridCols)
    gridRows = Math.max(1, Math.round(gridCols * IMAGE_ASPECT))
    meshNativeH = gridCols * cellSize
    meshNativeW = gridRows * cellSize

    const count = gridRows * gridCols

    if (instancedMesh) {
      group.remove(instancedMesh)
      instancedMesh.geometry.dispose()
      instancedMesh = null
    }

    const geometry = new THREE.PlaneGeometry(cellSize, cellSize, 1, 1)
    const aUvArray = new Float32Array(count * 2)
    instancedMesh = new THREE.InstancedMesh(geometry, material, count)

    for (let i = 0; i < gridRows; i++) {
      for (let j = 0; j < gridCols; j++) {
        const idx = i * gridCols + j
        pos.set(i * cellSize, j * cellSize, 0)
        mat4.identity().setPosition(pos)
        instancedMesh.setMatrixAt(idx, mat4)
        aUvArray[idx * 2] = gridRows > 1 ? i / (gridRows - 1) : 0.5
        aUvArray[idx * 2 + 1] = gridCols > 1 ? j / (gridCols - 1) : 0.5
      }
    }

    geometry.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUvArray, 2))
    instancedMesh.instanceMatrix.needsUpdate = true

    instancedMesh.position.set(-meshNativeW / 2, -meshNativeH / 2, 0)
    group.add(instancedMesh)
  }

  buildGrid()

  /** Matched to {@link ASCII_FONT_PRESETS} labels for Inspector ValueSelect. */
  let fontPreset = initialPreset
  let currentAsciiTexture = asciiAtlas

  async function rebuildAsciiAtlas(presetId) {
    const preset = getPresetById(presetId)
    try {
      await document.fonts.load(preset.fontCss)
    } catch (err) {
      console.warn('ASCII atlas: font load failed, keeping previous atlas', err)
      return
    }

    const created = createASCIITexture(ASCII_CHARSET, { fontCss: preset.fontCss })
    currentAsciiTexture.dispose()
    currentAsciiTexture = created.texture
    asciiAtlasNode.value = currentAsciiTexture
    charCountUniform.value = created.charCount
    currentAsciiTexture.needsUpdate = true
    material.needsUpdate = true
  }

  const asciiLayoutApi = {
    get fontPresetLabel() {
      return fontPreset.label
    },
    set fontPresetLabel(label) {
      const next = ASCII_FONT_PRESETS.find((p) => p.label === label)
      if (!next) return
      fontPreset = next
      void rebuildAsciiAtlas(next.id)
    },

    get gridCols() {
      return gridCols
    },
    set gridCols(v) {
      gridCols = clampGridCols(v)
      buildGrid()
    },

    get cellSize() {
      return cellSize
    },
    set cellSize(v) {
      cellSize = Math.max(0.01, Number(v))
      buildGrid()
    },

    luminanceExponentUniform,
    useTextureColorUniform,
    showOriginalImageUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
  }

  if (inspector) {
    setupAsciiLayoutInspector(inspector, asciiLayoutApi, { includeGridCols: false })
  }

  /** Independent render clock: TSL `time` advances even when layout RAF is idle. */
  function startRenderLoop() {
    renderer.setAnimationLoop(() => {
      postProcessing.render()
    })
  }

  return {
    /**
     * @param {{ x: number, y: number, width: number, height: number }} rect
     * @param {number} angle
     * @param {number} [pearlUserScale] - If set, drives luminance exponent and grid column count from layout config mappers.
     */
    sync(rect, angle, pearlUserScale) {
      if (pearlUserScale !== undefined) {
        luminanceExponentUniform.value = mapPearlScaleToLuminanceExponent(pearlUserScale)
        const nextCols = mapPearlScaleToGridCols(pearlUserScale)
        if (nextCols !== gridCols) {
          gridCols = nextCols
          buildGrid()
        }
      }
      const scale = rect.height / meshNativeH
      const cx = rect.x + rect.width / 2
      const cyDom = rect.y + rect.height / 2
      const cyWorld = viewHeight - cyDom
      group.position.set(cx, cyWorld, 0)
      group.scale.set(scale, scale, 1)
      group.rotation.z = -angle
    },

    startRenderLoop,

    resize(width, height) {
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      updateCameraFromRendererSize()
    },

    dispose() {
      renderer.setAnimationLoop(null)
      renderer.dispose()
      if (instancedMesh) {
        instancedMesh.geometry.dispose()
      }
      material.dispose()
      imageTexture.dispose()
      currentAsciiTexture.dispose()
    },
  }
}
