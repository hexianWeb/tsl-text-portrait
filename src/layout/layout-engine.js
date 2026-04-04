/*
Pearl Maiden showcase — demonstrates layout APIs:
- Title lines are measured and placed by our own layout engine, not inferred from DOM flow.
- Title font size is fit using repeated API calls so whole words survive.
- The title participates in obstacle routing against the hero illustration hull.
- The author line is placed from the measured title result, respecting the same geometry.
- The body is one continuous text stream, not two unrelated excerpts.
- The left column consumes text first, and the right column resumes from the same cursor.
- Both columns route around the title geometry and the Pearl Maiden SVG hull.
- Logo contours are derived once from rasterized SVG alpha, cached, then transformed per render.
- Hover/click hit testing uses transformed logo hulls too.
- Clicking the illustration rotates it, and the text reflows live around the rotated geometry.
- Dragging the illustration moves it (pointer offset); wheel still scales; short drag counts as a click for spin.
- Obstacle exclusion is based on the full line band, not a single y sample.
- The page is a fixed-height viewport-bound spread:
  - vertical resize changes reflow
  - overflow after the second column truncates
- The first visible render waits for fonts and hull preload.
- There is no DOM text measurement loop feeding layout.
*/
import { layoutNextLine, prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
import { BODY_COPY, CREDIT_TEXT, HEADLINE_TEXT } from './layout-text.js'
import pearlMaidenArtUrl from '../assets/occupy.svg'
import {
  carveTextLineSlots,
  getPolygonIntervalForBand,
  getRectIntervalsForBand,
  getWrapHull,
  isPointInPolygon,
  transformWrapPoints,
} from './wrap-geometry.js'
import { initAsciiRenderer } from '../render/ascii-renderer.js'
import {
  BODY_FONT,
  BODY_LINE_HEIGHT,
  CREDIT_FONT,
  CREDIT_LINE_HEIGHT,
  HEADLINE_FONT_FAMILY,
  HINT_PILL_SAFE_TOP,
  IMAGE_ASPECT,
  LAYOUT_SIDE_INSET,
  LOGO_DRAG_CLICK_THRESHOLD_PX,
  NARROW_BREAKPOINT,
  NARROW_COLUMN_MAX_WIDTH,
  PEARL_SCALE_SMOOTH_LAMBDA,
  PEARL_USER_SCALE_MAX,
  PEARL_USER_SCALE_MIN,
  mapPearlScaleToLuminanceExponent,
} from './config.js'

/** Extra scale on top of responsive `pearlRect` (wheel while hovering the illustration). */
let pearlUserScale = 1
/** Wheel sets this; `pearlUserScale` eases toward it (see `updatePearlScaleSmooth`). */
let pearlScaleTarget = 1
let scaleSmoothLastTime = null

/** Pixel offset from the auto layout position (pointer drag). */
let pearlDragOffset = { x: 0, y: 0 }

let pearlDragSession = null

/** Toggle with D key: show semi-transparent SVG over ASCII for alignment checks. */
let debugOverlay = false

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

// Scale the pearl rect by the given factor
function scalePearlRect(layout, scale) {
  const r = layout.pearlRect
  const cx = r.x + r.width / 2
  const cy = r.y + r.height / 2
  const nw = Math.max(1, Math.round(r.width * scale))
  const nh = Math.max(1, Math.round(r.height * scale))
  return {
    ...layout,
    pearlRect: {
      x: Math.round(cx - nw / 2),
      y: Math.round(cy - nh / 2),
      width: nw,
      height: nh,
    },
  }
}

// Move the pearl rect by the given offset
function translatePearlRect(layout, dx, dy) {
  const r = layout.pearlRect
  return {
    ...layout,
    pearlRect: {
      ...r,
      x: r.x + dx,
      y: r.y + dy,
    },
  }
}

// Resolve the imported asset url
function resolveImportedAssetUrl(assetUrl) {
  if (/^(?:[a-z]+:)?\/\//i.test(assetUrl) || assetUrl.startsWith('data:') || assetUrl.startsWith('blob:')) {
    return assetUrl
  }
  if (assetUrl.startsWith('/')) {
    return new URL(assetUrl, window.location.origin).href
  }
  return new URL(assetUrl, import.meta.url).href
}

const PEARL_MAIDEN_ART_SRC = resolveImportedAssetUrl(pearlMaidenArtUrl)

const stageNode = document.getElementById('stage')
if (!(stageNode instanceof HTMLDivElement)) throw new Error('#stage not found')
const stage = stageNode
const pageNode = document.querySelector('.page')
if (!(pageNode instanceof HTMLElement)) throw new Error('.page not found')

const preparedByKey = new Map()
const scheduled = { value: false }
const events = {
  mousemove: null,
  blur: false,
}
const pointer = { x: -Infinity, y: -Infinity }
let currentLogoHits
let hoveredLogo = null
let committedTextProjection = null
const logoAnimations = {
  pearl: { angle: 0, spin: null },
}

const domCache = {
  page: pageNode,
  headline: createHeadline(),
  credit: createCredit(),
  pearlArt: createLogo('logo logo--pearl', 'Girl with a Pearl Earring', PEARL_MAIDEN_ART_SRC),
  headlineLines: [],
  bodyLines: [],
}

function createHeadline() {
  const element = document.createElement('h1')
  element.className = 'headline'
  return element
}

function createCredit() {
  const element = document.createElement('p')
  element.className = 'credit'
  element.textContent = CREDIT_TEXT
  return element
}

function createLogo(className, alt, src) {
  const element = document.createElement('img')
  element.className = className
  element.alt = alt
  element.src = src
  element.draggable = false
  return element
}

function mountStaticNodes() {
  stage.append(
    domCache.headline,
    domCache.credit,
    domCache.pearlArt,
  )
}

const [, pearlLayout, pearlHit] = await Promise.all([
  document.fonts.ready,
  getWrapHull(PEARL_MAIDEN_ART_SRC, { smoothRadius: 6, mode: 'mean' }),
  getWrapHull(PEARL_MAIDEN_ART_SRC, { smoothRadius: 3, mode: 'mean' }),
])
const wrapHulls = { pearlLayout, pearlHit }

const canvasEl = document.querySelector('canvas.webgl')
if (!(canvasEl instanceof HTMLCanvasElement)) throw new Error('canvas.webgl not found')
const asciiRenderer = await initAsciiRenderer(canvasEl)
asciiRenderer.resize(document.documentElement.clientWidth, document.documentElement.clientHeight)

const preparedBody = getPrepared(BODY_COPY, BODY_FONT)
const preparedCredit = getPrepared(CREDIT_TEXT, CREDIT_FONT)
const creditWidth = Math.ceil(getPreparedSingleLineWidth(preparedCredit))

function getTypography() {
  return { font: BODY_FONT, lineHeight: BODY_LINE_HEIGHT }
}

function getPrepared(text, font) {
  const key = `${font}::${text}`
  const cached = preparedByKey.get(key)
  if (cached !== undefined) return cached
  const prepared = prepareWithSegments(text, font)
  preparedByKey.set(key, prepared)
  return prepared
}

function getPreparedSingleLineWidth(prepared) {
  let width = 0
  walkLineRanges(prepared, 100_000, line => {
    width = line.width
  })
  return width
}

function headlineBreaksInsideWord(prepared, maxWidth) {
  let breaksInsideWord = false
  walkLineRanges(prepared, maxWidth, line => {
    if (line.end.graphemeIndex !== 0) breaksInsideWord = true
  })
  return breaksInsideWord
}

function getObstacleIntervals(obstacle, bandTop, bandBottom) {
  switch (obstacle.kind) {
    case 'polygon': {
      const interval = getPolygonIntervalForBand(
        obstacle.points,
        bandTop,
        bandBottom,
        obstacle.horizontalPadding,
        obstacle.verticalPadding,
      )
      return interval === null ? [] : [interval]
    }
    case 'rects':
      return getRectIntervalsForBand(
        obstacle.rects,
        bandTop,
        bandBottom,
        obstacle.horizontalPadding,
        obstacle.verticalPadding,
      )
  }
}

function layoutColumn(
  prepared,
  startCursor,
  region,
  lineHeight,
  obstacles,
  side,
) {
  let cursor = startCursor
  let lineTop = region.y
  const lines = []
  while (true) {
    if (lineTop + lineHeight > region.y + region.height) break

    const bandTop = lineTop
    const bandBottom = lineTop + lineHeight
    const blocked = []
    for (let obstacleIndex = 0; obstacleIndex < obstacles.length; obstacleIndex++) {
      const obstacle = obstacles[obstacleIndex]
      const intervals = getObstacleIntervals(obstacle, bandTop, bandBottom)
      for (let intervalIndex = 0; intervalIndex < intervals.length; intervalIndex++) {
        blocked.push(intervals[intervalIndex])
      }
    }

    const slots = carveTextLineSlots(
      { left: region.x, right: region.x + region.width },
      blocked,
    )
    if (slots.length === 0) {
      lineTop += lineHeight
      continue
    }

    let slot = slots[0]
    for (let slotIndex = 1; slotIndex < slots.length; slotIndex++) {
      const candidate = slots[slotIndex]
      const bestWidth = slot.right - slot.left
      const candidateWidth = candidate.right - candidate.left
      if (candidateWidth > bestWidth) {
        slot = candidate
        continue
      }
      if (candidateWidth < bestWidth) continue
      if (side === 'left') {
        if (candidate.left > slot.left) slot = candidate
        continue
      }
      if (candidate.left < slot.left) slot = candidate
    }
    const width = slot.right - slot.left
    const line = layoutNextLine(prepared, cursor, width)
    if (line === null) break

    lines.push({
      x: Math.round(slot.left),
      y: Math.round(lineTop),
      width: line.width,
      text: line.text,
    })

    cursor = line.end
    lineTop += lineHeight
  }

  return { lines, cursor }
}

function syncPool(pool, length, create, parent = stage) {
  while (pool.length < length) {
    const element = create()
    pool.push(element)
    parent.appendChild(element)
  }
  while (pool.length > length) {
    const element = pool.pop()
    element.remove()
  }
}

function projectHeadlineLines(lines, font, lineHeight) {
  syncPool(domCache.headlineLines, lines.length, () => {
    const element = document.createElement('span')
    element.className = 'headline-line'
    return element
  }, domCache.headline)

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const element = domCache.headlineLines[index]
    element.textContent = line.text
    element.style.left = `${line.x}px`
    element.style.top = `${line.y}px`
    element.style.font = font
    element.style.lineHeight = `${lineHeight}px`
  }
}

function projectChromeLayout(layout, contentHeight) {
  domCache.page.className = layout.isNarrow ? 'page page--mobile' : 'page'
  stage.style.height = `${contentHeight}px`

  domCache.pearlArt.style.left = `${layout.pearlRect.x}px`
  domCache.pearlArt.style.top = `${layout.pearlRect.y}px`
  domCache.pearlArt.style.width = `${layout.pearlRect.width}px`
  domCache.pearlArt.style.height = `${layout.pearlRect.height}px`
  domCache.pearlArt.style.transform = `rotate(${logoAnimations.pearl.angle}rad)`
  domCache.pearlArt.style.opacity = debugOverlay ? '0.35' : '0'
  domCache.pearlArt.style.pointerEvents = 'none'
}

function positionedLinesEqual(a, b) {
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index++) {
    const left = a[index]
    const right = b[index]
    if (
      left.x !== right.x ||
      left.y !== right.y ||
      left.width !== right.width ||
      left.text !== right.text
    ) {
      return false
    }
  }
  return true
}

function projectedBodyLinesEqual(a, b) {
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index++) {
    const left = a[index]
    const right = b[index]
    if (
      left.className !== right.className ||
      left.x !== right.x ||
      left.y !== right.y ||
      left.width !== right.width ||
      left.text !== right.text
    ) {
      return false
    }
  }
  return true
}

function textProjectionEqual(a, b) {
  return a !== null &&
    a.pageWidth === b.pageWidth &&
    a.pageHeight === b.pageHeight &&
    a.headlineFont === b.headlineFont &&
    a.headlineLineHeight === b.headlineLineHeight &&
    a.creditLeft === b.creditLeft &&
    a.creditTop === b.creditTop &&
    a.bodyFont === b.bodyFont &&
    a.bodyLineHeight === b.bodyLineHeight &&
    positionedLinesEqual(a.headlineLines, b.headlineLines) &&
    projectedBodyLinesEqual(a.bodyLines, b.bodyLines)
}

/**
 * Wikipedia-style numeric refs only, e.g. [17] or [21][22]. Excludes [nl], etc.
 * Use a fresh RegExp per operation so split/match do not share lastIndex.
 */
const CITE_NUMERIC_SPLIT = /\[\d+\]/g

/**
 * Fills `element` with text nodes and `.line__cite` spans for each [n] match.
 * @param {HTMLElement} element
 * @param {string} text
 */
function setBodyLineContentWithCitations(element, text) {
  const parts = text.split(CITE_NUMERIC_SPLIT)
  const matches = text.match(/\[\d+\]/g) ?? []
  const nodes = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) nodes.push(document.createTextNode(parts[i]))
    if (i < matches.length) {
      const cite = document.createElement('span')
      cite.className = 'line__cite'
      cite.textContent = matches[i]
      nodes.push(cite)
    }
  }
  element.replaceChildren(...nodes)
}

function projectTextProjection(projection) {
  domCache.headline.style.left = '0px'
  domCache.headline.style.top = '0px'
  domCache.headline.style.width = `${projection.pageWidth}px`
  domCache.headline.style.height = `${projection.pageHeight}px`
  domCache.headline.style.font = projection.headlineFont
  domCache.headline.style.lineHeight = `${projection.headlineLineHeight}px`
  domCache.headline.style.letterSpacing = '0px'

  projectHeadlineLines(projection.headlineLines, projection.headlineFont, projection.headlineLineHeight)

  domCache.credit.style.left = `${projection.creditLeft}px`
  domCache.credit.style.top = `${projection.creditTop}px`
  domCache.credit.style.width = 'auto'
  domCache.credit.style.font = CREDIT_FONT
  domCache.credit.style.lineHeight = `${CREDIT_LINE_HEIGHT}px`

  syncPool(domCache.bodyLines, projection.bodyLines.length, () => {
    const element = document.createElement('span')
    element.className = 'line'
    return element
  })
  for (let index = 0; index < projection.bodyLines.length; index++) {
    const line = projection.bodyLines[index]
    const element = domCache.bodyLines[index]
    element.className = line.className
    setBodyLineContentWithCitations(element, line.text)
    element.style.left = `${line.x}px`
    element.style.top = `${line.y}px`
    element.style.font = projection.bodyFont
    element.style.lineHeight = `${projection.bodyLineHeight}px`
  }
}

function fitHeadlineFontSize(headlineWidth, pageWidth) {
  let low = Math.ceil(Math.max(22, pageWidth * 0.026))
  let high = Math.floor(Math.min(94.4, Math.max(55.2, pageWidth * 0.055)))
  let best = low

  while (low <= high) {
    const size = Math.floor((low + high) / 2)
    const font = `400 ${size}px ${HEADLINE_FONT_FAMILY}`
    const headlinePrepared = getPrepared(HEADLINE_TEXT, font)
    if (!headlineBreaksInsideWord(headlinePrepared, headlineWidth)) {
      best = size
      low = size + 1
    } else {
      high = size - 1
    }
  }

  return best
}

function easeSpin(t) {
  const oneMinusT = 1 - t
  return 1 - oneMinusT * oneMinusT * oneMinusT
}

function getLogoAnimation(kind) {
  switch (kind) {
    case 'pearl':
      return logoAnimations.pearl
  }
}

function updateLogoSpin(logo, now) {
  if (logo.spin === null) return false

  const progress = Math.min(1, (now - logo.spin.start) / logo.spin.duration)
  logo.angle = logo.spin.from + (logo.spin.to - logo.spin.from) * easeSpin(progress)
  if (progress >= 1) {
    logo.angle = logo.spin.to
    logo.spin = null
    return false
  }
  return true
}

function updateSpinState(now) {
  return updateLogoSpin(logoAnimations.pearl, now)
}

/** Frame-rate independent ease: `pearlUserScale` → `pearlScaleTarget`. */
function updatePearlScaleSmooth(now) {
  const diff = pearlScaleTarget - pearlUserScale
  if (Math.abs(diff) < 1e-5) {
    pearlUserScale = pearlScaleTarget
    scaleSmoothLastTime = null
    return false
  }
  const dt =
    scaleSmoothLastTime === null
      ? 1 / 60
      : Math.min(0.1, (now - scaleSmoothLastTime) / 1000)
  scaleSmoothLastTime = now
  const t = 1 - Math.exp(-PEARL_SCALE_SMOOTH_LAMBDA * dt)
  pearlUserScale += diff * t
  return true
}

function startLogoSpin(kind, direction, now) {
  const logo = getLogoAnimation(kind)
  const delta = direction * Math.PI
  logo.spin = {
    from: logo.angle,
    to: logo.angle + delta,
    start: now,
    duration: 900,
  }
}

function getLogoProjection(layout, lineHeight) {
  const pearlWrap = transformWrapPoints(wrapHulls.pearlLayout, layout.pearlRect, logoAnimations.pearl.angle)
  return {
    pearlObstacle: {
      kind: 'polygon',
      points: pearlWrap,
      horizontalPadding: Math.round(lineHeight * -0.75),
      verticalPadding: Math.round(lineHeight * 0.15),
    },
    hits: {
      pearl: transformWrapPoints(wrapHulls.pearlHit, layout.pearlRect, logoAnimations.pearl.angle),
    },
  }
}

function buildLayout(pageWidth, pageHeight, lineHeight) {
  const contentInsetX = Math.round(pageWidth * LAYOUT_SIDE_INSET)
  const contentWidth = Math.max(1, pageWidth - contentInsetX * 2)

  const isNarrow = pageWidth < NARROW_BREAKPOINT
  if (isNarrow) {
    const gutter = Math.round(Math.max(18, Math.min(28, contentWidth * 0.06)))
    const centerGap = 0
    const columnWidth = Math.round(Math.min(contentWidth - gutter * 2, NARROW_COLUMN_MAX_WIDTH))
    const headlineTop = 28
    const headlineWidth = contentWidth - gutter * 2
    const headlineFontSize = Math.min(48, fitHeadlineFontSize(headlineWidth, pageWidth))
    const headlineLineHeight = Math.round(headlineFontSize * 0.92)
    const headlineFont = `400 ${headlineFontSize}px ${HEADLINE_FONT_FAMILY}`
    const creditGap = Math.round(Math.max(12, lineHeight * 0.5))
    const copyGap = Math.round(Math.max(18, lineHeight * 0.7))
    const pearlHeight = Math.round(Math.min(92, contentWidth * 0.23, pageHeight * 0.11))
    const pearlWidth = Math.round(pearlHeight * IMAGE_ASPECT)
    const headlineRegion = {
      x: contentInsetX + gutter,
      y: headlineTop,
      width: headlineWidth,
      height: Math.max(320, pageHeight - headlineTop - gutter),
    }
    const pearlRect = {
      x: contentInsetX + contentWidth - gutter - Math.round(pearlWidth * 0.88),
      y: 4,
      width: pearlWidth,
      height: pearlHeight,
    }

    return {
      isNarrow,
      gutter,
      pageWidth,
      pageHeight,
      contentWidth,
      contentInsetX,
      centerGap,
      columnWidth,
      headlineRegion,
      headlineFont,
      headlineLineHeight,
      creditGap,
      copyGap,
      pearlRect,
    }
  }

  const gutter = Math.round(Math.max(52, contentWidth * 0.048))
  const centerGap = Math.round(Math.max(28, contentWidth * 0.025))
  const columnWidth = Math.round((contentWidth - gutter * 2 - centerGap) / 2)

  const headlineTop = Math.round(Math.max(42, pageWidth * 0.04, HINT_PILL_SAFE_TOP))
  const headlineWidth = Math.round(Math.min(contentWidth - gutter * 2, Math.max(columnWidth, contentWidth * 0.5)))
  const headlineFontSize = fitHeadlineFontSize(headlineWidth, pageWidth)
  const headlineLineHeight = Math.round(headlineFontSize * 0.92)
  const headlineFont = `400 ${headlineFontSize}px ${HEADLINE_FONT_FAMILY}`
  const creditGap = Math.round(Math.max(14, lineHeight * 0.6))
  const copyGap = Math.round(Math.max(20, lineHeight * 0.9))
  // Wide: large right-side illustration inside the content band; may extend past viewport top/bottom by design
  const pearlHeight = Math.round(Math.max(600, Math.min(1440, contentWidth * 0.84, pageHeight * 1.16)))
  const pearlWidth = Math.round(pearlHeight * IMAGE_ASPECT)
  const headlineRegion = {
    x: contentInsetX + gutter,
    y: headlineTop,
    width: headlineWidth,
    height: pageHeight - headlineTop - gutter,
  }

  const pearlRect = {
    x: contentInsetX + contentWidth - Math.round(pearlWidth * 0.9),
    y: 0,
    width: pearlWidth,
    height: pearlHeight,
  }

  return {
    isNarrow,
    gutter,
    pageWidth,
    pageHeight,
    contentWidth,
    contentInsetX,
    centerGap,
    columnWidth,
    headlineRegion,
    headlineFont,
    headlineLineHeight,
    creditGap,
    copyGap,
    pearlRect,
  }
}

function evaluateLayout(
  layout,
  lineHeight,
  preparedBody,
) {
  const { pearlObstacle, hits } = getLogoProjection(layout, lineHeight)

  const headlinePrepared = getPrepared(HEADLINE_TEXT, layout.headlineFont)
  const headlineResult = layoutColumn(
    headlinePrepared,
    { segmentIndex: 0, graphemeIndex: 0 },
    layout.headlineRegion,
    layout.headlineLineHeight,
    [pearlObstacle],
    'left',
  )
  const headlineLines = headlineResult.lines
  const headlineRects = headlineLines.map(line => ({
      x: line.x,
      y: line.y,
      width: Math.ceil(line.width),
      height: layout.headlineLineHeight,
    }))
  const headlineBottom = headlineLines.length === 0
    ? layout.headlineRegion.y
    : Math.max(...headlineLines.map(line => line.y + layout.headlineLineHeight))
  const creditTop = headlineBottom + layout.creditGap
  const creditRegion = {
    x: layout.headlineRegion.x + 4,
    y: creditTop,
    width: layout.headlineRegion.width,
    height: CREDIT_LINE_HEIGHT,
  }
  const copyTop = creditTop + CREDIT_LINE_HEIGHT + layout.copyGap
  const leftRegion = {
    x: layout.headlineRegion.x,
    y: copyTop,
    width: layout.columnWidth,
    height: layout.pageHeight - copyTop - layout.gutter,
  }
  const rightRegion = {
    x: layout.headlineRegion.x + layout.columnWidth + layout.centerGap,
    y: layout.headlineRegion.y,
    width: layout.columnWidth,
    height: layout.pageHeight - layout.headlineRegion.y - layout.gutter,
  }
  const titleObstacle = {
    kind: 'rects',
    rects: headlineRects,
    horizontalPadding: Math.round(lineHeight * 0.65),
    verticalPadding: Math.round(lineHeight * 0.18),
  }

  const creditBlocked = getObstacleIntervals(
    pearlObstacle,
    creditRegion.y,
    creditRegion.y + creditRegion.height,
  )
  const creditSlots = carveTextLineSlots(
    {
      left: creditRegion.x,
      right: creditRegion.x + creditRegion.width,
    },
    creditBlocked,
  )
  let creditLeft = creditRegion.x
  for (let index = 0; index < creditSlots.length; index++) {
    const slot = creditSlots[index]
    if (slot.right - slot.left >= creditWidth) {
      creditLeft = Math.round(slot.left)
      break
    }
  }

  if (layout.isNarrow) {
    const bodyRegion = {
      x: layout.contentInsetX + Math.round((layout.contentWidth - layout.columnWidth) / 2),
      y: copyTop,
      width: layout.columnWidth,
      height: Math.max(0, layout.pageHeight - copyTop - layout.gutter),
    }

    const bodyResult = layoutColumn(
      preparedBody,
      { segmentIndex: 0, graphemeIndex: 0 },
      bodyRegion,
      lineHeight,
      [pearlObstacle],
      'left',
    )

    return {
      headlineLines,
      creditLeft,
      creditTop,
      leftLines: bodyResult.lines,
      rightLines: [],
      contentHeight: layout.pageHeight,
      hits,
    }
  }

  const leftResult = layoutColumn(
    preparedBody,
    { segmentIndex: 0, graphemeIndex: 0 },
    leftRegion,
    lineHeight,
    [titleObstacle, pearlObstacle],
    'left',
  )

  const rightResult = layoutColumn(
    preparedBody,
    leftResult.cursor,
    rightRegion,
    lineHeight,
    [titleObstacle, pearlObstacle],
    'right',
  )

  return {
    headlineLines,
    creditLeft,
    creditTop,
    leftLines: leftResult.lines,
    rightLines: rightResult.lines,
    contentHeight: layout.pageHeight,
    hits,
  }
}

function commitFrame(now) {
  const { font, lineHeight } = getTypography()
  const root = document.documentElement
  const pageWidth = root.clientWidth
  const pageHeight = root.clientHeight
  const animatingSpin = updateSpinState(now)
  const animatingScale = updatePearlScaleSmooth(now)
  const animating = animatingSpin || animatingScale
  const layout = translatePearlRect(
    scalePearlRect(buildLayout(pageWidth, pageHeight, lineHeight), pearlUserScale),
    pearlDragOffset.x,
    pearlDragOffset.y,
  )
  const { headlineLines, creditLeft, creditTop, leftLines, rightLines, contentHeight, hits } = evaluateLayout(layout, lineHeight, preparedBody)

  currentLogoHits = hits

  projectChromeLayout(layout, contentHeight)

  const bodyLines = [
    ...leftLines.map(line => ({ ...line, className: 'line line--left' })),
    ...rightLines.map(line => ({ ...line, className: 'line line--right' })),
  ]
  const textProjection = {
    pageWidth: layout.pageWidth,
    pageHeight: layout.pageHeight,
    headlineFont: layout.headlineFont,
    headlineLineHeight: layout.headlineLineHeight,
    headlineLines,
    creditLeft,
    creditTop,
    bodyFont: font,
    bodyLineHeight: lineHeight,
    bodyLines,
  }

  if (!textProjectionEqual(committedTextProjection, textProjection)) {
    projectTextProjection(textProjection)
    committedTextProjection = textProjection
  }

  document.body.style.cursor =
    pearlDragSession !== null ? 'grabbing' : hoveredLogo === null ? '' : 'pointer'

  asciiRenderer.sync(
    layout.pearlRect,
    logoAnimations.pearl.angle,
    mapPearlScaleToLuminanceExponent(pearlUserScale),
  )

  return animating
}

function render(now) {
  // === handle inputs against the previous committed hit geometry
  if (events.mousemove !== null) {
    pointer.x = events.mousemove.clientX
    pointer.y = events.mousemove.clientY
  }

  const nextHovered =
    events.blur
      ? null
      : isPointInPolygon(currentLogoHits.pearl, pointer.x, pointer.y)
        ? 'pearl'
        : null
  hoveredLogo = nextHovered

  // === commit state
  events.mousemove = null
  events.blur = false

  return commitFrame(now)
}

function scheduleRender() {
  if (scheduled.value) return
  scheduled.value = true
  requestAnimationFrame(function renderAndMaybeScheduleAnotherRender(now) {
    scheduled.value = false
    if (render(now)) scheduleRender()
  })
}

function hasActiveTextSelection() {
  const selection = window.getSelection()
  return selection !== null && !selection.isCollapsed && selection.rangeCount > 0
}

window.addEventListener('resize', () => {
  const root = document.documentElement
  asciiRenderer.resize(root.clientWidth, root.clientHeight)
  scheduleRender()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'd' && !event.ctrlKey && !event.metaKey) {
    debugOverlay = !debugOverlay
    scheduleRender()
  }
})
pageNode.addEventListener('touchmove', event => {
  if (hasActiveTextSelection()) return
  event.preventDefault()
}, { passive: false })
document.addEventListener('mousemove', event => {
  events.mousemove = event
  scheduleRender()
})
window.addEventListener('blur', () => {
  events.blur = true
  scheduleRender()
})

function endPearlDragSession(event, now) {
  const session = pearlDragSession
  if (session === null || event.pointerId !== session.pointerId) return
  pearlDragSession = null
  try {
    document.documentElement.releasePointerCapture(event.pointerId)
  } catch {
    // ignore if capture already released
  }
  const dx = event.clientX - session.originClientX
  const dy = event.clientY - session.originClientY
  if (Math.hypot(dx, dy) < LOGO_DRAG_CLICK_THRESHOLD_PX) {
    startLogoSpin('pearl', 1, now)
  }
}

document.addEventListener(
  'pointerdown',
  event => {
    if (event.button !== 0) return
    if (!isPointInPolygon(currentLogoHits.pearl, event.clientX, event.clientY)) return
    event.preventDefault()
    pearlDragSession = {
      pointerId: event.pointerId,
      originClientX: event.clientX,
      originClientY: event.clientY,
      offsetAtDown: { x: pearlDragOffset.x, y: pearlDragOffset.y },
    }
    try {
      document.documentElement.setPointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    scheduleRender()
  },
  true,
)

document.addEventListener('pointermove', event => {
  if (pearlDragSession === null || event.pointerId !== pearlDragSession.pointerId) return
  const session = pearlDragSession
  pearlDragOffset.x = session.offsetAtDown.x + (event.clientX - session.originClientX)
  pearlDragOffset.y = session.offsetAtDown.y + (event.clientY - session.originClientY)
  scheduleRender()
})

document.addEventListener('pointerup', event => {
  if (pearlDragSession === null || event.pointerId !== pearlDragSession.pointerId) return
  endPearlDragSession(event, performance.now())
  scheduleRender()
})

document.addEventListener('pointercancel', event => {
  if (pearlDragSession === null || event.pointerId !== pearlDragSession.pointerId) return
  try {
    document.documentElement.releasePointerCapture(event.pointerId)
  } catch {
    // ignore
  }
  pearlDragSession = null
  scheduleRender()
})

document.addEventListener(
  'wheel',
  event => {
    if (!isPointInPolygon(currentLogoHits.pearl, event.clientX, event.clientY)) return
    event.preventDefault()
    const factor = Math.exp(-event.deltaY * 0.0015)
    pearlScaleTarget = clamp(pearlScaleTarget * factor, PEARL_USER_SCALE_MIN, PEARL_USER_SCALE_MAX)
    scheduleRender()
  },
  { passive: false },
)

mountStaticNodes()
commitFrame(performance.now())
asciiRenderer.startRenderLoop()
