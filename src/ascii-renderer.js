import * as THREE from 'three/webgpu'
import { pass, renderOutput } from 'three/tsl'
import { createASCIITexture } from './asciiTexture.js'
import { createInstancedGridMaterial } from './material.js'
import imageUrl from './image.png'

const IMAGE_ASPECT = 672 / 1024
const GRID_COLS = 192
const GRID_ROWS = Math.round(GRID_COLS * IMAGE_ASPECT)
const CELL_SIZE = 0.1
const MESH_NATIVE_H = GRID_COLS * CELL_SIZE
const MESH_NATIVE_W = GRID_ROWS * CELL_SIZE

/**
 * Initialize the ASCII art renderer on the given canvas.
 * Call {@link startRenderLoop} after the first layout frame so sync runs once first.
 * @param {HTMLCanvasElement} canvas
 */
export async function initAsciiRenderer(canvas) {
  const renderer = new THREE.WebGPURenderer({ canvas, forceWebGL: false })
  await renderer.init()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#000000', 1)

  const scene = new THREE.Scene()

  const w = canvas.clientWidth || window.innerWidth
  const h = canvas.clientHeight || window.innerHeight
  renderer.setSize(w, h)

  // OrthographicCamera(left, right, top, bottom): must have top > bottom (Y-up).
  // Match logical size from renderer (same as setSize) so pixels stay square with DPR.
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
  await document.fonts.load('700 48px "UnifrakturCook"')
  await document.fonts.ready

  imageTexture.colorSpace = THREE.SRGBColorSpace
  imageTexture.wrapS = THREE.ClampToEdgeWrapping
  imageTexture.wrapT = THREE.ClampToEdgeWrapping
  imageTexture.minFilter = THREE.LinearMipmapLinearFilter
  imageTexture.magFilter = THREE.LinearFilter
  imageTexture.generateMipmaps = true

  const { texture: asciiAtlas, charCount } = createASCIITexture()

  const { material } = createInstancedGridMaterial(imageTexture, asciiAtlas, charCount)

  const count = GRID_ROWS * GRID_COLS
  const geometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE, 1, 1)
  const aUvArray = new Float32Array(count * 2)
  const mesh = new THREE.InstancedMesh(geometry, material, count)

  const mat4 = new THREE.Matrix4()
  const pos = new THREE.Vector3()

  for (let i = 0; i < GRID_ROWS; i++) {
    for (let j = 0; j < GRID_COLS; j++) {
      const idx = i * GRID_COLS + j
      pos.set(i * CELL_SIZE, j * CELL_SIZE, 0)
      mat4.identity().setPosition(pos)
      mesh.setMatrixAt(idx, mat4)
      aUvArray[idx * 2] = GRID_ROWS > 1 ? i / (GRID_ROWS - 1) : 0.5
      aUvArray[idx * 2 + 1] = GRID_COLS > 1 ? j / (GRID_COLS - 1) : 0.5
    }
  }

  geometry.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUvArray, 2))
  mesh.instanceMatrix.needsUpdate = true

  const group = new THREE.Group()
  mesh.position.set(-MESH_NATIVE_W / 2, -MESH_NATIVE_H / 2, 0)
  group.add(mesh)
  scene.add(group)

  /** Independent render clock: TSL `time` advances even when layout RAF is idle. */
  function startRenderLoop() {
    renderer.setAnimationLoop(() => {
      postProcessing.render()
    })
  }

  return {
    sync(rect, angle) {
      // Same height-driven uniform scale as layout pearlRect (672:1024); camera uses renderer logical size so cells stay square with DPR.
      const scale = rect.height / MESH_NATIVE_H
      const cx = rect.x + rect.width / 2
      const cyDom = rect.y + rect.height / 2
      const cyWorld = viewHeight - cyDom
      group.position.set(cx, cyWorld, 0)
      group.scale.set(scale, scale, 1)
      group.rotation.z = angle
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
      geometry.dispose()
      material.dispose()
      imageTexture.dispose()
      asciiAtlas.dispose()
    },
  }
}
