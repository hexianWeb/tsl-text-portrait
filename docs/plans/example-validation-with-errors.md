## 验证报告示例：展示错误检测能力（演示用）

这份示例展示了技能如何检测计划中的常见错误。

---

### ❌ 错误检测示例

#### 1. API 调用顺序错误

**计划中的错误代码：**
```javascript
// ❌ 错误 - 顺序不对
instancedMesh.instanceMatrix.needsUpdate = true
for (let i = 0; i < count; i++) {
  instancedMesh.setMatrixAt(i, matrix)
}
```

**技能会这样报告：**
```markdown
### ❌ 错误
- **[调用顺序错误]**：在设置任何矩阵之前就标记了 needsUpdate
  - 位置：InstancedMesh 初始化部分
  - 当前代码：`instancedMesh.instanceMatrix.needsUpdate = true` 在循环之前
  - 影响：不会有任何可视化输出 - 矩阵从未正确初始化
  - 修复方案：将 `needsUpdate = true` 移到所有 `setMatrixAt` 调用之后：
    ```javascript
    for (let i = 0; i < count; i++) {
      instancedMesh.setMatrixAt(i, matrix)
    }
    instancedMesh.instanceMatrix.needsUpdate = true  // ← 放在循环后面
    ```
```

---

#### 2. 非标准 API 使用

**计划中的错误代码：**
```javascript
// ❌ 错误 - 不是 Three.js 的 API
this.matrices.setRow(index, x, y, z)
```

**技能会这样报告：**
```markdown
### ❌ 错误
- **[API 使用错误]**：`this.matrices.setRow` 不是 Three.js 的标准 API
  - 位置：矩阵赋值部分
  - 当前代码：`this.matrices.setRow(index, x, y, z)`
  - 影响：运行时报错 "Cannot read property 'setRow' of undefined"
  - 修复方案：使用标准 Three.js API：
    ```javascript
    const matrix = new THREE.Matrix4()
    matrix.setPosition(x, y, z)
    instancedMesh.setMatrixAt(index, matrix)
    ```
```

---

#### 3. 变量未定义

**计划中的错误代码：**
```javascript
// ❌ 错误 - uniforms 未在此作用域定义
setupInspector(inspector, uniforms)
```

**技能会这样报告：**
```markdown
### ❌ 错误
- **[变量未定义]**：`uniforms` 在当前作用域未定义
  - 位置：setupInspector 调用处
  - 当前代码：`setupInspector(inspector, uniforms)`
  - 影响：运行时报 ReferenceError
  - 修复方案：从材质模块导入 uniforms 或作为参数传递：
    ```javascript
    import { createDemoMaterial } from './material.js'
    const { uniforms } = createDemoMaterial()
    setupInspector(inspector, uniforms)
    ```
```

---

#### 4. 导入路径错误

**计划中的错误代码：**
```javascript
// ❌ 错误 - 混用模块类型
import { Mesh } from 'three'  // ES 模块
const THREE = require('three')  // CommonJS
```

**技能会这样报告：**
```markdown
### ❌ 错误
- **[导入不一致]**：混用 ES 模块和 CommonJS
  - 位置：导入语句部分
  - 当前代码：同时使用 `import` 和 `require`
  - 影响：Vite/Webpack 构建错误
  - 修复方案：统一使用 ES 模块：
    ```javascript
    import * as THREE from 'three/webgpu'
    import { Mesh } from 'three/webgpu'
    ```
```

---

#### 5. 缺少必要步骤

**计划中的错误代码：**
```javascript
// ❌ 错误 - scene 未导入/创建
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)  // scene 从何而来？
```

**技能会这样报告：**
```markdown
### ❌ 错误
- **[缺少设置]**：`scene` 变量已使用但未定义
  - 位置：scene.add() 调用处
  - 当前代码：`scene.add(mesh)`
  - 影响：报 ReferenceError
  - 修复方案：添加场景创建步骤：
    ```javascript
    const scene = new THREE.Scene()
    // ... 其他代码 ...
    scene.add(mesh)
    ```
```

---

### ⚠️ 警告检测示例

#### 1. 潜在破坏性变更

```markdown
### ⚠️ 警告
- **[破坏性变更]**：移除了 setupInspector() 调用
  - 位置：main.js 清理部分
  - 影响：GUI 面板将消失 - 这是预期行为吗？
  - 建议：添加注释说明为什么不再需要 Inspector
  - 严重程度：中
```

#### 2. 未使用的导入

```markdown
### ⚠️ 警告
- **[未使用的导入]**：导入的 `OrbitControls` 在计划中未使用
  - 位置：导入部分
  - 建议：如果确实不需要就移除，或添加相机控制器设置代码
  - 严重程度：低
```

#### 3. 性能问题

```markdown
### ⚠️ 警告
- **[性能问题]**：在循环中创建 2500 个 Matrix4 对象
  - 位置：InstancedMesh 初始化
  - 当前代码：每次循环都 `new THREE.Matrix4()`
  - 建议：复用单个 Matrix4 实例：
    ```javascript
    const matrix = new THREE.Matrix4()  // 只创建一次
    for (let i = 0; i < count; i++) {
      matrix.makeTranslation(x, y, z)
      instancedMesh.setMatrixAt(i, matrix)
    }
    ```
  - 严重程度：中
```

---

### 📊 验证覆盖范围

技能可以检测以下问题：

| 检查类型 | 是否支持 | 说明 |
|---------|---------|------|
| API 正确性 | ✅ | 调用顺序、参数数量 |
| 调用顺序 | ✅ | 前置条件检查 |
| 变量定义 | ✅ | 使用前先定义 |
| 导入一致性 | ✅ | 路径、模块类型 |
| 文件存在性 | ✅ | 目标文件检查 |
| 计划冲突 | ✅ | 多计划对比 |
| 破坏性变更 | ✅ | 影响范围分析 |
| 性能问题 | ⚠️ | 基础检查 |
| 安全问题 | ❌ | 超出范围 |

---

**这是一份示例报告，展示技能的检测能力。**
