# Data Horizon → Quartic Pulse Package Format

Quartic Pulse 0.50.0 accepts a folder exported by Data Horizon. Import is data-only: Quartic Pulse validates the bundle and renders `project.horizon.json` with its own compatible engine. JavaScript shipped inside the bundle is not executed.

## Required bundle layout

```text
manifest.json
project.horizon.json
runtime/index.html
runtime/app.js
runtime/styles.css
runtime/project.js
```

Images may be embedded in the project as `data:image/...` assets. Optional preview images and other supported package files must remain inside the bundle. Absolute paths, `..` segments, symbolic links, and unsupported file types are rejected.

## Manifest schema version 1

```json
{
  "schemaVersion": 1,
  "format": "data-horizon.quartic-visualizer",
  "target": "quartic-pulse",
  "id": "com.example.visualizer.signal-field",
  "name": "Signal Field",
  "version": "1.0.0",
  "createdBy": "Data Horizon Studio",
  "engine": { "id": "data-horizon-runtime", "version": "0.15.0" },
  "project": "project.horizon.json",
  "entrypoint": "runtime/index.html",
  "canvas": { "width": 1920, "height": 1080, "transparent": false },
  "audio": {
    "contract": "tempest.audio-features.v1",
    "sources": ["bass", "mids", "highs", "beat", "rms"]
  },
  "runtime": {
    "browser": "chromium-webgl2",
    "localFile": true,
    "deterministic": true
  },
  "visualizer": {
    "key": "signal-field",
    "category": "CUSTOM",
    "mode": "full-canvas",
    "acceptsTransportClock": true,
    "acceptsOfflineFrames": true
  },
  "palettes": [
    {
      "id": "signal-neon",
      "name": "Signal Neon",
      "colors": ["#091125", "#20466E", "#63558E", "#6BA8B5"],
      "favorite": true
    }
  ]
}
```

`palettes` is optional and may contain up to 32 entries. Each entry requires:

- A stable, package-local `id` of 2–80 lowercase letters, digits, `.`, `_`, or `-`, beginning with a letter or digit.
- A display `name` of at most 80 characters.
- Exactly four six-digit hexadecimal colors. Their order maps to Quartic Pulse's Shadow, Field, Accent, and Detail roles.
- An optional `favorite` boolean. It supplies the initial favorite state; Quartic Pulse preserves the user's later choice across package updates.

Package and palette IDs form the stable identity. Updating a package replaces its managed palettes in place, adds new IDs, and removes IDs no longer exported. Uninstalling a package removes its managed palettes but never removes user-created palettes. Managed package palettes can be applied and favorited in Quartic Pulse, but their colors and names are owned by the Data Horizon export.

Quartic Pulse previews the package name, author, version, size, file count, palette count, and whether the operation is an update before installation. A package must use WebGL2, the `tempest.audio-features.v1` inputs, a deterministic transport clock, and offline-frame rendering.

The bundled first-party Data Horizon 0.15 renderer accepts image, group, text, shape, spectrum, waveform, particle, and path layers. It supports cel shading, outline, color grade, luminance and region masks, painted masks, posterize, bloom, scanlines, and displacement. Authored timeline tracks and audio bindings are evaluated from Quartic Pulse's deterministic transport clock for the main preview, OBS output, and offline rendering. Package layer, effect, mask, path, particle, binding, and keyframe counts are bounded during import before any project data reaches WebGL.

The reference fixture is in `tools/fixtures/data-horizon-signal-test` and is validated by the release test suite.
