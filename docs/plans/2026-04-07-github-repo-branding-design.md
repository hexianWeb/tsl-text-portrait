# GitHub repository name and description (design)

**Date:** 2026-04-07  
**Decision driver:** Technical positioning — TSL, WebGPU, learning template (not exhibition-first branding).

## Repository name (recommended)

**`three-webgpu-tsl-ascii-template`**

**Rationale:**

- **`three` / `webgpu` / `tsl`** appear early for search and skim (matches primary stack).
- **`ascii`** signals the text-grid / character-atlas rendering without claiming a specific painting.
- **`template`** matches README intent: starter for learning TSL, not a finished “product” name.

**Alternatives (shorter, slightly less explicit):**

- `tsl-webgpu-ascii-starter` — drops “three”; fine if Three.js is obvious from context.
- `three-tsl-ascii-template` — omits WebGPU keyword; use if length matters more than WGPU discoverability.

## GitHub “About” description (English, single line)

> Starter template for Three.js TSL on WebGPU: ASCII / text-grid rendering, layout experiments, and interactive viewport controls—aimed at learning shaders and node materials.

**Shorter variant (if GitHub UI truncates aggressively):**

> Three.js TSL + WebGPU starter: ASCII text-grid rendering and shader learning experiments.

## Suggested repository topics (GitHub Topics)

`threejs` `webgpu` `tsl` `three-js-shading-language` `ascii-art` `vite` `shader` `learning`

## Chinese blurb (optional — e.g. 个人主页 / 国内镜像说明)

基于 Three.js TSL 与 WebGPU 的学习用模板：彩色字符栅格（ASCII 风格）渲染、排版与交互视口，适合练 TSL / 节点材质。

## Scope note

This document records naming and marketing copy only. Renaming the local folder, `package.json` `name`, or remote URL is a separate follow-up if desired.
