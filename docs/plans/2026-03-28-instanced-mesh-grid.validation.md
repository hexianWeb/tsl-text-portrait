## 验证报告：2026-03-28-instanced-mesh-grid.md

**计划目标**：移除 TorusKnot，添加 50×50 的 InstancedMesh 绿色平面网格  
**验证日期**：2026-03-28  
**代码库路径**：E:\圖形學\TSL\three.js-tsl-template

---

### ✅ 通过的检查

1. **Three.js 导入路径一致** - 使用 `three/webgpu` 符合项目规范
2. **文件路径有效** - 所有要修改的文件（`src/main.js`、`src/gui.js`）都存在
3. **Git 提交规范** - 提交信息遵循 conventional commits 格式
4. **构建验证步骤** - 计划中包含 `pnpm build` 验证环节
5. **API 选择正确** - 使用 `InstancedMesh` 渲染网格是合适的选择

---

### ⚠️ 警告

1. **[引用一致性问题]**：`setupInspector` 的参数可能不一致
   - 位置：Task 1，Step 1
   - 当前代码：`setupInspector(inspector, uniforms)` 在 main.js 第 50 行调用
   - 问题说明：计划建议移除 `uniforms`，但 `setupInspector` 函数可能需要它
   - 建议：确保 `gui.js` 能处理缺失的 `uniforms` 参数，或修改函数签名
   - 严重程度：中

2. **[文件删除影响]**：删除 `material.js` 可能影响其他计划
   - 位置：Task 2
   - 问题说明：`docs/plans/2026-03-24-script-modularization.md` 创建了 `material.js`
   - 建议：检查是否有其他计划依赖此文件
   - 严重程度：高

3. **[相机视角建议]**：网格位置可能影响可视性
   - 当前网格范围：从 (0, 0) 到 (4.9, 4.9)，共 2500 个实例
   - 当前相机位置：(6, 3, 10) 看向原点
   - 建议：考虑将网格居中或调整相机目标点，以获得更好的视角
   - 严重程度：低

---

### ❌ 错误

未发现错误。✅

---

### 📋 改进建议

1. **解决计划冲突**：
   - `2026-03-24-script-modularization.md`：创建并使用 `material.js`
   - `2026-03-28-instanced-mesh-grid.md`：删除 `material.js`
   - **行动建议**：这两个计划互相矛盾，请选择执行其中一个，或合并修改

2. **添加显式导入检查**：
   - 删除 `material.js` 后，验证是否有测试文件或示例文件导入它
   - 运行命令：`rg "from ['\"]./material['\"]|import.*material" --type js`

3. **考虑网格居中**：
   ```javascript
   // 可选：将网格居中到原点
   position.set(
     (i - rows/2) * cellSize, 
     (j - columns/2) * cellSize, 
     0
   )
   ```

4. **WebGPU 兼容性提示**：
   - 计划正确指出 WebGPU + InstancedMesh 应该可以正常工作
   - 建议添加 `forceWebGL: true` 的降级方案注释

---

### 🔍 冲突分析

**对比 `docs/plans/2026-03-24-script-modularization.md`**：

| 方面 | 模块化计划 | InstancedMesh 网格计划 |
|------|-----------|----------------------|
| material.js | ✅ 创建并使用 | ❌ 删除 |
| TorusKnot | ✅ 保留 | ❌ 移除 |
| TSL 着色器 | ✅ 活跃使用 | ❌ 全部移除 |
| 入口文件 | 重构 main.js | 替换内容 |

**结论**：两个计划**互斥**，无法同时执行。

**可选方案**：
- **方案 A**：先执行模块化计划，然后在此结构基础上适配网格功能
- **方案 B**：直接执行网格计划（更简单，移除所有 TSL 复杂性）

---

### 📊 验证总结

| 检查类别 | 结果 | 备注 |
|---------|------|------|
| API 正确性 | ✅ 通过 | `setMatrixAt` 调用顺序正确 |
| 代码完整性 | ✅ 通过 | 所有变量已定义，步骤顺序合理 |
| 可行性 | ⚠️ 警告 | 与现有计划存在冲突 |
| 风险等级 | 🔴 高 | 计划不兼容 |

**整体状态**：⚠️ **需要决策**后才能执行

**建议操作**：请在以下两个方案中选择：
1. **TSL 演示方案**（模块化计划）：适合学习 TSL 材质系统
2. **InstancedMesh 方案**（网格计划）：适合学习实例化渲染

---

**验证完成** ✅  
*由 plan-validator 技能 v1.0 生成*
