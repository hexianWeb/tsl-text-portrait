/**
 * Three.js Inspector (profiler + parameters) is only enabled when the URL fragment
 * is exactly `#debug`, e.g. `http://localhost:5173/#debug`.
 * @returns {boolean}
 */
export function isInspectorDebugEnabled() {
  return window.location.hash === '#debug'
}
