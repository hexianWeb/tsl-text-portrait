# Three.js TSL + WebGPU — ASCII portrait template

English | [简体中文](README_CN.md)

Starter template for learning **Three.js Shading Language (TSL)** on **WebGPU**: a classical portrait rendered as a **colorful character grid** (luminance-mapped glyphs), plus a **curatorial article layout** in the page chrome. The demo scene showcases instanced text, shader uniforms, and interactive viewport controls.

## Preview

<img src="src/UI/page.png" width="960" alt="Web page with curatorial text on the left and a Girl with a Pearl Earring portrait rendered as ASCII-style character mosaic on the right" />

*Screenshot: gallery-style typography + GPU text-grid illustration.*

## Features

- **WebGPU + TSL** — Node materials and WGSL-oriented workflow via Three.js TSL.
- **ASCII / glyph mosaic** — Dense instanced characters; brightness follows image luminance; inspector toggles for color source, jitter, and animation (when debug UI is enabled).
- **Layout engine** — Article flow, wrapping, and stage composition for long-form text next to the WebGL canvas.
- **Interactive illustration** — Drag to pan, wheel to zoom, short press to rotate the portrait plane.
- **Debug** — `D` toggles a semi-transparent alignment overlay; append `#debug` to the URL for the Three.js Inspector panel (parameters depend on build).

## Pretext (`@chenglou/pretext`)

The page copy is laid out with **[Pretext](https://www.npmjs.com/package/@chenglou/pretext)** — a small library for **browser-side typographic preparation**. The layout engine imports `prepareWithSegments`, `layoutNextLine`, and `walkLineRanges` so headline, body, and credit lines are broken into measured segments and flowed into **two columns** that **wrap around** the portrait obstacle (SVG hull), instead of driving layout from ad-hoc DOM `getBoundingClientRect` loops. When the illustration is dragged, scaled, or rotated, text **reflows** against the updated wrap geometry while staying in sync with the same strings used for rendering.

## Controls

| Action | Input |
| --- | --- |
| Move illustration | Drag |
| Scale | Mouse wheel |
| Rotate | Short press / tap (see on-screen hint) |
| Debug overlay (alignment) | `D` |
| Shader inspector (optional) | Open URL with hash `#debug` |

On-screen copy matches `src/index.html` (hint pill at the top).

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- A browser with **WebGPU** support (e.g. recent Chrome / Edge).

## Getting started

```bash
npm install
npm run dev
```

The dev server uses Vite with `host: true` (see `vite.config.js`); use the URL printed in the terminal (typically `http://localhost:5173/`).

### Build

```bash
npm run build
```

Output goes to `dist/` at the repository root.

## Project structure (high level)

| Path | Role |
| --- | --- |
| `src/app/` | Entry, frame loop, GUI / inspector wiring |
| `src/render/` | ASCII renderer, materials, font presets, textures |
| `src/layout/` | Layout engine, text wrap, geometry helpers |
| `src/index.html` / `src/style.css` | Page shell and styles |
| `static/` | Static assets (served via Vite `publicDir`) |
| `docs/plans/` | Design notes for features and layout |

## Learn TSL

- [TSL introduction (wiki)](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [TSL Q&A (tsl-textures)](https://github.com/boytchev/tsl-textures/wiki/Q&A)
- [WebGPU examples](https://threejs.org/examples/?q=webgpu#webgpu_parallax_uv)
- [Node list (source)](https://github.com/mrdoob/three.js/blob/dev/src/nodes/Nodes.js)
- [TSL editor example](https://threejs.org/examples/?q=webgpu#webgpu_tsl_editor) · [GLSL → TSL transpiler](https://threejs.org/examples/?q=webgpu#webgpu_tsl_transpiler)
- [tsl-textures](https://github.com/boytchev/tsl-textures) ([demos](https://boytchev.github.io/tsl-textures/))

## Repository branding

Suggested GitHub name and “About” text for a **technical** audience are documented in [`docs/plans/2026-04-07-github-repo-branding-design.md`](docs/plans/2026-04-07-github-repo-branding-design.md).
