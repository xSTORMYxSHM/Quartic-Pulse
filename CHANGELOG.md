# Changelog

All notable Quartic Pulse changes are documented here. Quartic Pulse follows semantic versioning where practical.

## Unreleased

- No unreleased changes yet.

## 0.28.3 - 2026-08-07

### Added

- Added automatic final-encoder detection with the following preference chain:
  1. NVIDIA NVENC on supported NVIDIA systems.
  2. Intel Quick Sync on supported Intel systems.
  3. AMD AMF on supported AMD systems.
  4. CPU-based x264 as the universal fallback.
- Added an export preflight window that reports resolution, frame rate, duration, encoder, estimated output size, temporary storage requirements, and available disk space.
- Added a five-second test-export option before starting a complete song render.
- Added elapsed time and adaptive estimated-time-remaining information to the centered export-status display.
- Added Pause and Resume for offline exact-frame rendering.
- Added separate **End & Finish** and **Cancel Export** actions. End & Finish creates a valid shortened video; Cancel Export confirms the destructive action and discards the job.
- Added recent export history with format details, encoder information, file size, Open, and Folder actions.
- Added interrupted offline-export recovery. Completed IVF frames and recovery metadata are retained after an unexpected shutdown and can be finalized or discarded after relaunching.
- Added automatic visual-session snapshots every ten seconds, including visual settings, camera position, modulation routes, last local song, and playback position.
- Added search and favorites for the 20-equation fractal library.
- Added search and favorites for locally saved visual and color profiles.
- Added a live Visual Safety Estimate that labels the current visual response as Calm, Active, or Intense using motion, color movement, equation deformation, folding, beat response, and audio energy.
- Added an optional completion stinger that plays only after the exported video has been completely finalized and saved.

### Changed

- Offline export now uses a high-bitrate VP9/VP8 quality master followed by a high-quality final encode, improving preservation of dense fractal detail and rapid color changes.
- MP4, MOV, and MKV finalization now prefers verified hardware encoding while automatically retrying with CPU x264 if the hardware path fails.
- Export progress now reserves 0–80% for frame rendering, 80–85% for encoder flushing, and 85–100% for final encoding, audio muxing, and destination writing.
- Progress reporting is locked to the active export mode so deck-time live progress can no longer overwrite offline finalization status.
- Offline exports are the default. Live export remains available through Unleashed mode.
- Beat detection now uses an independent, lightly smoothed low/low-mid onset path with adaptive baseline tracking, sensitivity, and cooldown controls.
- Beat-routed rotation now drives angular velocity instead of directly replacing the angle, removing abrupt counter-clockwise image jumps.
- Equation response uses stronger smoothing and compressed music envelopes, greatly reducing popping and strobe-like topology changes, especially in Julia sets.
- Fold and Warp controls now use perceptual response curves and bounded nonlinear deformation so useful motion is available at low percentages without immediately destroying the underlying fractal.
- OBS chroma mode reserves pure green for the background and shifts green-dominant visual colors away from the key range.
- The OBS output window includes a draggable top strip and preserves its position when output settings change.
- Custom palette fields are named Shadow Color, Field Color, Accent Color, and Detail Color.
- The renderer control panel, main tabs, responsive subtab layout, and centered transport received spacing and resizing refinements.

### Fixed

- Fixed exported video appearing substantially more distorted and compressed than the live visual.
- Fixed export progress remaining at 100% while final muxing or OneDrive destination writes were still active.
- Fixed final audio mux progress rapidly alternating with live-recording progress.
- Fixed interrupted offline frame streams being deleted during application shutdown before recovery could use them.
- Fixed partial offline exports reporting the original full frame count instead of patching the IVF header to the completed frame count.
- Fixed camera and conventional-visual placement changing when switching between main control tabs.
- Fixed control-panel content using only part of the available vertical height.
- Fixed advanced controls and the Unleashed switch overlapping or escaping their cards at narrow sidebar widths.
- Fixed the main navigation labels being clipped at smaller panel sizes.
- Fixed missing Windows audio endpoints by retaining separate WASAPI output-device and input-device enumeration.
- Fixed Pulse Ring wave creation, layering, center-emitter priority, ring density, jaggedness, trails, and music-triggered creation behavior.

### Packaging

- Bundled FFmpeg 8.1.1 and its license notice inside installer and portable releases. Destination PCs no longer require a separate FFmpeg installation for video export.
- Added `npm run bundle:ffmpeg` and `tools/prepare-ffmpeg.ps1` for repeatable release preparation.
- Kept the large FFmpeg executable out of Git while retaining automatic inclusion during release packaging.
- Built Windows 11 x64 installer and portable artifacts at version 0.28.3.
- Verified the packaged portable application, bundled FFmpeg, NVIDIA NVENC path, CPU x264 fallback, WebGL2 renderer, Windows audio enumeration, and export QoL interface.

### Compatibility notes

- Existing Quartic Pulse color and full-setting profiles remain compatible.
- Hardware encoding is optional. Systems without a supported hardware encoder automatically use CPU x264.
- Installer and portable executables are currently unsigned and may display a Windows SmartScreen or Smart App Control warning.
