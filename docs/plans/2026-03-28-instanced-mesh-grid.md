# InstancedMesh 平面网格 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**计划维护（重要）：** 后续需求变更请**直接修改本文件**（`docs/plans/2026-03-28-instanced-mesh-grid.md`）中的任务、代码片段与备注；**不要**再新建同主题的平行 plan 文件（例如重复的 `*-instanced-mesh-grid.md`），以免分叉与过时。

**Goal:** 移除 `TorusKnotGeometry` 与原先 Torus 用的 TSL 位移/动画演示逻辑；保留 `src/material.js` 模块，改为导出供 `InstancedMesh` 使用的 **`MeshBasicNodeMaterial`**，颜色为**绿色**；在场景中加入 50×50、`PlaneGeometry(0.1)` 的 `InstancedMesh` 网格，实例位姿使用标准 Three.js `setMatrixAt` API。

**Architecture:** 几何体与 `InstancedMesh` 的创建仍在 `main.js`（或可选 `src/instancedGrid.js`）；**材质由 `material.js` 工厂函数创建**（例如 `createInstancedGridMaterial()`），使用 `MeshBasicNodeMaterial`，通过 TSL 的 `colorNode` 设为纯绿（如 `vec3(0, 1, 0)`），不删除 `material.js` 文件。用 `Matrix4`/`Vector3` 写入每个实例矩阵；先 `new InstancedMesh(...)`，再循环 `setMatrixAt`，最后 `instancedMesh.instanceMatrix.needsUpdate = true`。图片中的 `this.matrices.setRow` 非标准 API，应替换为 `instancedMesh.setMatrixAt(index, matrix)`。移除与旧演示相关的 `setupInspector(..., uniforms)` 或改为无 uniform 的占位，避免悬空引用。

**Tech Stack:** Three.js r183 WebGPU (`three/webgpu`)、Vite、现有 `OrbitControls` / `RenderPipeline` / `postProcessing` 不变。

**参考技能:** @webgpu-threejs-tsl（WebGPU 渲染器与材质兼容性）；实现阶段若需创意扩展再用 @brainstorming。

---

### Task 1: 重构 `material.js` — `MeshBasicNodeMaterial` 纯绿（保留文件）

**Files:**

- Modify: `src/material.js`

**Step 1: 替换旧 Torus 演示逻辑**

- **保留** `src/material.js` 文件与对 `three/webgpu`、`three/tsl` 的用法；删除（或不再使用）原先的 `limitPosition`、`positionNode` 位移、`oscSine` 动画色等与 Torus 演示绑定的节点逻辑。
- 导出单一工厂函数（名称任选，建议语义清晰，例如 `createInstancedGridMaterial`；若希望少改 `main.js` 可暂时保留函数名 `createDemoMaterial` 但实现改为网格材质——以可读性优先）。

**Step 2: 最小实现片段（绿色 + Node Material）**

```javascript
import { vec3 } from 'three/tsl'
import * as THREE from 'three/webgpu'

export function createInstancedGridMaterial() {
  const material = new THREE.MeshBasicNodeMaterial()
  material.colorNode = vec3(0, 1, 0)
  return { material }
}
```

说明：`MeshBasicNodeMaterial` 与 WebGPU 渲染器一致；无动态参数时可不返回 `uniforms`。

**Step 3: 构建验证**

Run: `pnpm build`  
Expected: 成功；`material.js` 无未使用导入。

**Step 4: Commit**

```bash
git add src/material.js
git commit -m "refactor(material): MeshBasicNodeMaterial solid green for instanced grid"
```

---

### Task 2: 从入口移除 Torus，改用 `material.js` 中的材质

**Files:**

- Modify: `src/main.js`（约第 8、45–50 行）
- Modify: `src/gui.js`（若不再暴露任何 Inspector 参数，可整文件简化或保留空壳）

**Step 1: 更新导入与场景对象**

在 `main.js` 中：

- 将 `createDemoMaterial` 的导入改为 Task 1 中的新导出名（例如 `createInstancedGridMaterial`）。
- 使用 `const { material } = createInstancedGridMaterial()`（无 `uniforms` 则不要解构 `uniforms`）。该 `material` 供 Task 3 的 `InstancedMesh` 使用。
- 移除 `TorusKnotGeometry` 的 `Mesh` 以及 `scene.add(torusKnot)`（Task 3 再挂上 `InstancedMesh`）。
- 移除或改写 `setupInspector(inspector, uniforms)`：无 `uniforms` 时删除该调用，或改为 `setupInspector(inspector)` 且 `gui.js` 内不再注册依赖 `uniforms` 的滑块。

**Step 2: 手动验证**

Run: `pnpm dev`  
Expected: 应用能启动；无 Torus；在接上 Task 3 之前场景可能仅有坐标轴（属预期）。

**Step 3: Commit**

```bash
git add src/main.js src/gui.js
git commit -m "refactor: remove torus; wire grid material from material.js"
```

---

### Task 3: 实现 50×50 InstancedMesh 网格

**Files:**

- Modify: `src/main.js`（在相机、渲染器、后处理就绪后、`scene.add` 区域）
- Optional Create: `src/instancedGrid.js`（若希望 `main.js` 保持精简，可导出 `createInstancedPlaneGrid(scene, options)`）

**Step 1: 常量与几何/材质**

`material` 必须来自 Task 1 的 `material.js`（`MeshBasicNodeMaterial`），**不要**在 `main.js` 里再 `new THREE.MeshBasicMaterial`。

Task 2 若已在 `main.js` 中执行 `const { material } = createInstancedGridMaterial()`，此处**只复用该 `material`**，不要再调用工厂。

```javascript
const rows = 50
const columns = 50
const count = rows * columns
const cellSize = 0.1

const geometry = new THREE.PlaneGeometry(cellSize, cellSize, 1, 1)
const instancedMesh = new THREE.InstancedMesh(geometry, material, count)
```

说明：`PlaneGeometry` 默认在 XY 平面；相机在 `(6, 3, 10)` 时可看到网格。若需与图片完全一致可把实例放在 XY 上（见 Step 2）。

**合并实现提示：** 若希望减少提交次数，可将 Task 2 与 Task 3 在同一次编辑中完成：顶部一次 `createInstancedGridMaterial()`，紧接着创建 `InstancedMesh` 并 `scene.add`。

**Step 2: 写入实例矩阵（标准 API）**

```javascript
const matrix = new THREE.Matrix4()
const position = new THREE.Vector3()

for (let i = 0; i < rows; i++) {
  for (let j = 0; j < columns; j++) {
    const index = i * columns + j
    position.set(i * cellSize, j * cellSize, 0)
    matrix.identity()
    matrix.setPosition(position)
    instancedMesh.setMatrixAt(index, matrix)
  }
}

instancedMesh.instanceMatrix.needsUpdate = true
scene.add(instancedMesh)
```

注意：必须先 `new InstancedMesh(...)`，再循环 `setMatrixAt`，最后 `needsUpdate = true`。图片里在创建前访问 `instanceMatrix` 的顺序是错误的。

**Step 3: 构建验证**

Run: `pnpm build`  
Expected: 构建成功，无未使用导入或未定义符号。

**Step 4: 视觉验证**

Run: `pnpm dev`，浏览器中确认约 2500 个绿色小平面排成网格。

**Step 5: Commit**

```bash
git add src/main.js
# 若新增 instancedGrid.js 则一并 add
git commit -m "feat: add 50x50 instanced plane grid with NodeMaterial from material.js"
```

---

### Task 4:（可选）相机与网格居中

**Files:**

- Modify: `src/main.js`（仅当默认视角看不清网格时）

**Step 1:** 网格中心约在 `((rows-1)*cellSize/2, (columns-1)*cellSize/2, 0)`。可将 `controls.target` 或相机位置微调，使网格在视锥内居中。

**Step 2:** `pnpm dev` 再次目视确认。

**Step 3: Commit**

```bash
git commit -m "chore: frame instanced grid in camera view"
```

---

## 测试与文档说明

- 本项目无 `test` 脚本；回归以 `pnpm build` + `pnpm dev` 目视为主。
- 无需为本功能新增 README（除非用户单独要求）；与 @create-project-readme 无关。

---

## 风险与备注

- **WebGPU + InstancedMesh + MeshBasicNodeMaterial：** 与当前模板的 `WebGPURenderer` 一致；若遇驱动问题，可暂时 `forceWebGL: true` 做对比（非本计划必做项）。
- **Inspector：** 移除旧 `uniforms` 后，若仍希望保留 Inspector 面板，可在 `gui.js` 中注册与网格无关的占位控件，或完全去掉 `setupInspector` 调用。
- **`material.js`：** 作为唯一材质入口，后续若要改颜色/节点效果，只改该文件即可，无需删文件重建。
