# Quartic Pulse 0.50.0

Quartic Pulse 0.50.0 is the stable release of the modular visualizer, custom-content, and high-clarity export work completed after 0.40.1.

## Export clarity and high-iteration rendering

- Replaces the single Supersampling switch with Standard 1×, Balanced Clarity 2×, and Maximum Clarity 4× modes.
- Adds a two-sample linear-light resolve that improves dense fractal edges at about half the render cost of Maximum Clarity.
- Removes time-varying one-pixel shader grain from exported frames, reducing crawling static and improving compression at high iteration counts while preserving the live visual treatment.
- Restores direct access to Live Iterations in Advanced Export and keeps Match Live Mathematics behavior explicit.
- Preserves old Full Visual Settings profiles: an enabled legacy Supersampling setting restores as Maximum Clarity.

## Data Horizon packages

- Imports validated Data Horizon visualizer folders without executing package JavaScript.
- Bundles the tested Data Horizon Studio 0.15-compatible renderer for image, group, text, shape, spectrum, waveform, particle, and animated path layers.
- Supports authored effects, masks, audio bindings, deterministic timeline tracks, live preview, OBS output, SDR offline export, and optional package palettes.
- Keeps package identity, updates, removal, profile references, and palette cleanup deterministic.

## Application architecture and reliability

- Promotes the modular renderer, audio-response, FFT, Song Map, playlist, camera, profile, palette, Mapping, OBS, performance, and export subsystems into the public Git source.
- Uses the same deterministic audio and transport state across live playback, OBS, and offline rendering.
- Retains the complete controller, WebGL2, Data Horizon, OBS, offline-export, reporting, and packaged-application release gates.

## Packages

- `Quartic Pulse Setup 0.50.0.exe` — customizable Windows 11 x64 installer.
- `Quartic Pulse 0.50.0.exe` — portable Windows 11 x64 executable.
- `SHA256SUMS-v0.50.0.txt` — SHA-256 integrity hashes.
- `RELEASE_MANIFEST-v0.50.0.json` — machine-readable sizes, hashes, release channel, and signing state.

This release is not Authenticode-signed and may trigger Windows SmartScreen or Smart App Control.
