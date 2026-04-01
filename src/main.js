import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Inspector } from 'three/addons/inspector/Inspector.js'
// import { sobel } from 'three/addons/tsl/display/SobelOperatorNode.js'
import { pass, renderOutput } from 'three/tsl'
import * as THREE from 'three/webgpu'
import { setupInspector } from './gui.js'
import { startLoop } from './loop.js'
import { createASCIITexture } from './asciiTexture.js'
import { createInstancedGridMaterial } from './material.js'
import imageUrl from './image.png'

async function init() {
  const canvas = document.querySelector('canvas.webgl')

  const scene = new THREE.Scene()

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
  camera.position.set(6, 3, 10)
  scene.add(camera)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true

  const renderer = new THREE.WebGPURenderer({
    canvas,
    forceWebGL: false,
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#222')

  const inspector = new Inspector()
  renderer.inspector = inspector

  const postProcessing = new THREE.RenderPipeline(renderer)
  postProcessing.outputColorTransform = false

  const scenePass = pass(scene, camera)
  const outputPass = renderOutput(scenePass)
  postProcessing.outputNode = outputPass

  const imageTexture = await new THREE.TextureLoader().loadAsync(imageUrl)
  imageTexture.colorSpace = THREE.SRGBColorSpace
  imageTexture.wrapS = THREE.ClampToEdgeWrapping
  imageTexture.wrapT = THREE.ClampToEdgeWrapping
  imageTexture.minFilter = THREE.LinearMipmapLinearFilter
  imageTexture.magFilter = THREE.LinearFilter
  imageTexture.generateMipmaps = true

  const { texture: asciiAtlas, charCount } = createASCIITexture()

  const {
    material,
    luminanceExponentUniform,
    vaporwaveUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
    bandThresholdUniforms,
  } = createInstancedGridMaterial(imageTexture, asciiAtlas, charCount)

  const rows = 128
  const columns = 128
  const count = rows * columns
  const cellSize = 0.1
  const halfWidth = ((rows - 1) * cellSize) / 2
  const halfHeight = ((columns - 1) * cellSize) / 2

  const gridGeometry = new THREE.PlaneGeometry(cellSize, cellSize, 1, 1)

  // Per-instance aUv: treat the whole grid as one [0,1]x[0,1] canvas (not per-vertex uv).
  const aUvArray = new Float32Array(count * 2)
  const instancedMesh = new THREE.InstancedMesh(gridGeometry, material, count)

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const index = i * columns + j
      position.set(i * cellSize, j * cellSize, 0)
      matrix.identity()
      matrix.setPosition(position)
      instancedMesh.setMatrixAt(index, matrix)

      const u = rows > 1 ? i / (rows - 1) : 0.5
      const v = columns > 1 ? j / (columns - 1) : 0.5
      aUvArray[index * 2] = u
      aUvArray[index * 2 + 1] = v
    }
  }

  gridGeometry.setAttribute('aUv', new THREE.InstancedBufferAttribute(aUvArray, 2))

  instancedMesh.instanceMatrix.needsUpdate = true
  // Offset the whole InstancedMesh so the grid center sits at world origin.
  instancedMesh.position.set(-halfWidth, -halfHeight, 0)
  scene.add(instancedMesh)

  scene.add(new THREE.AxesHelper(3))
  setupInspector(inspector, {
    luminanceExponentUniform,
    vaporwaveUniform,
    glyphLuminanceJitterUniform,
    glyphTimeOscillationUniform,
    oscTimeScaleUniform,
    bandThresholdUniforms,
  })
  startLoop({ renderer, postProcessing, controls })

  window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })
}

init().catch((err) => {
  console.error(err)
})
