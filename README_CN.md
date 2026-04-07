# Three.js TSL + WebGPU — ASCII 肖像模板

[English](README.md) | 简体中文

面向 **Three.js Shading Language (TSL)** 与 **WebGPU** 的学习用模板：将古典肖像渲染为 **彩色字符栅格**（按亮度映射字形），页面区搭配 **策展式长文排版**。示例场景展示实例化文字、着色器 uniform，以及可交互视口。

## 预览

<img src="src/UI/page.png" width="960" alt="页面左侧为策展长文，右侧为戴珍珠耳环的少女 ASCII 风格字符马赛克肖像" />

*截图：画廊风排版 + GPU 字符栅格画面。*

## 特性

- **WebGPU + TSL** — 通过 Three.js TSL 使用节点材质与面向 WGSL 的流程。
- **ASCII / 字形马赛克** — 高密度实例化字符；亮度跟随图像亮度；在开启调试 UI 时可调节颜色来源、抖动与动画等 Inspector 项。
- **排版引擎** — 文章流、换行与舞台编排，使长文与 WebGL 画布并排呈现。
- **可交互插图** — 拖拽平移、滚轮缩放、短按旋转肖像平面。
- **调试** — `D` 切换半透明对齐叠层；在 URL 加上 `#debug` 可打开 Three.js Inspector 面板（具体参数随构建而定）。

## Pretext（`@chenglou/pretext`）

正文与标题排版使用 **[Pretext](https://www.npmjs.com/package/@chenglou/pretext)**：面向浏览器的**文字量测与断行**库。`layout-engine` 通过 `prepareWithSegments`、`layoutNextLine`、`walkLineRanges` 将主标题、长正文与署名等拆成已量测片段，再流入**双栏**并沿肖像障碍（SVG 包络）**绕排**，而不是用零散的 DOM `getBoundingClientRect` 循环驱动布局。插图被拖拽、缩放或旋转时，文字会随更新后的绕排几何**重排**，并与用于渲染的同一套字符串保持一致。

## 操作

| 操作 | 输入 |
| --- | --- |
| 移动画面 | 拖拽 |
| 缩放 | 鼠标滚轮 |
| 旋转 | 短按 / 点按（见页面顶部提示） |
| 调试叠层（对齐检查） | `D` |
| 着色器 Inspector（可选） | 使用带 `#debug` 的 URL |

页面文案与 `src/index.html` 中顶部提示条一致。

## 环境要求

- [Node.js](https://nodejs.org/)（建议 LTS）
- 支持 **WebGPU** 的浏览器（如较新的 Chrome / Edge）。

## 快速开始

```bash
npm install
npm run dev
```

开发服务器使用 Vite，并启用 `host: true`（见 `vite.config.js`）；请使用终端输出的地址（一般为 `http://localhost:5173/`）。

### 构建

```bash
npm run build
```

产物输出到仓库根目录下的 `dist/`。

## 项目结构（概览）

| 路径 | 作用 |
| --- | --- |
| `src/app/` | 入口、帧循环、GUI / Inspector 接线 |
| `src/render/` | ASCII 渲染、材质、字体预设、纹理 |
| `src/layout/` | 排版引擎、文本换行、几何辅助 |
| `src/index.html` / `src/style.css` | 页面壳与样式 |
| `static/` | 静态资源（经 Vite `publicDir` 提供） |
| `docs/plans/` | 功能与排版相关设计笔记 |

## 学习 TSL

- [TSL 介绍（wiki）](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [TSL Q&A（tsl-textures）](https://github.com/boytchev/tsl-textures/wiki/Q&A)
- [WebGPU 示例](https://threejs.org/examples/?q=webgpu#webgpu_parallax_uv)
- [节点列表（源码）](https://github.com/mrdoob/three.js/blob/dev/src/nodes/Nodes.js)
- [TSL 编辑器示例](https://threejs.org/examples/?q=webgpu#webgpu_tsl_editor) · [GLSL → TSL 转译器](https://threejs.org/examples/?q=webgpu#webgpu_tsl_transpiler)
- [tsl-textures](https://github.com/boytchev/tsl-textures)（[演示](https://boytchev.github.io/tsl-textures/)）

## 仓库命名与简介

面向 **技术向** 读者的 GitHub 仓库名与 About 文案建议见 [`docs/plans/2026-04-07-github-repo-branding-design.md`](docs/plans/2026-04-07-github-repo-branding-design.md)。
