# Quartic Pulse 1.0.0

Quartic Pulse 1.0.0 is the first stable major release of the Windows 11 audio-reactive fractal visualizer, live-performance workspace, and deterministic music-to-video exporter.

## Highlights

- Seven built-in audio-reactive visual systems plus validated Data Horizon visualizer packages and portable package palettes.
- Live playback, Windows audio capture, OBS output, profiles, modulation routing, Song Maps, the Mathematical Song Director, Show Composer, and performance packages.
- Deterministic SDR/HDR offline rendering, live capture, Quick Clips, encoder discovery, GPU/CPU preflight, benchmarking, recovery, and Standard 1×, Balanced Clarity 2×, and Maximum Clarity 4× sampling.
- A modular controller and engine architecture with automated security, relay, renderer, WebGL2, OBS, export, and packaged-application validation.

## Security and distribution

- Runs on Electron 44 with guarded local navigation, origin-bound media permissions, authenticated privileged IPC, constrained filesystem reveal actions, and strict imported Song Map/package validation.
- Uses a frozen pnpm workspace lockfile for the desktop application and anonymous report relay.
- The unpacked application, NSIS installer, and portable executable are Authenticode-signed through Azure Trusted Signing and timestamped. The build refuses to emit a release manifest if any signature is missing or invalid.
- Bundles FFmpeg 8.1.2 with the required GPL license, build, source, and corresponding-source notices.

## Packages

- `Quartic.Pulse.Setup.1.0.0.exe` — signed customizable Windows 11 x64 installer.
- `Quartic.Pulse.1.0.0.exe` — signed portable Windows 11 x64 executable.
- `SHA256SUMS-v1.0.0.txt` — SHA-256 integrity hashes.
- `RELEASE_MANIFEST-v1.0.0.json` — machine-readable sizes, hashes, stable channel, and Authenticode identity.

Microsoft SmartScreen reputation is separate from signature validity and may take time to accumulate for a new product or publisher.
