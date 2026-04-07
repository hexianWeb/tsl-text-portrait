# Inspector — URL `#debug` Gate

## Goal

Only attach Three.js `Inspector` to `WebGPURenderer` when the page URL hash is exactly `#debug`. Default visits (no hash or other hashes) run without the inspector UI or profiler.

## Behavior

- **Enable:** `window.location.hash === '#debug'` (e.g. `index.html#debug`).
- **Disable:** any other hash, empty hash, or no hash.

## Architecture

- Single exported helper (e.g. `isInspectorDebugEnabled()`) in `src/app/inspector-debug.js` holds the rule so `main.js` and `ascii-renderer.js` stay consistent.
- When disabled: do not `new Inspector()`, do not set `renderer.inspector`, do not call `setupInspector` / `setupAsciiLayoutInspector`.
- When enabled: keep the existing order — assign `renderer.inspector` before `await renderer.init()` so the renderer can initialize the inspector as today.

## Out of scope

- Reacting to `hashchange` without reload (not required).
- Query parameters such as `?debug=1` (use hash only).

## Manual verification

- Open app without `#debug`: no inspector panel.
- Append `#debug` and reload: inspector appears and controls work as before.
