# Changelog

All notable Quartic Pulse changes are documented here. Quartic Pulse follows semantic versioning where practical.

## 0.30.5 - 2026-08-11

### Added

- Added resolution-aware mathematical detail for offline exports. Quartic Pulse now enforces effective iteration floors of 480 at 1080p, 640 at 1440p, and 800 at 4K while preserving any higher Minimum Export Iterations value selected by the user.
- Added a profile-based, offline-only export engine with a YouTube HEVC master, playback-lossless Ut Video master, and archive-lossless FFV1 master.
- Added an HDR Output toggle to the YouTube profile. Standard BT.709 SDR is the compatibility default; enabling HDR switches the render target, shader transform, metadata, and encoder pipeline to 10-bit Rec.2020 HLG.
- Added a 10-bit RGB WebGL export framebuffer and shader-side Rec.2020 HLG output transform for the YouTube HDR profile.
- Added NVIDIA HEVC Main 10 quality encoding with a CPU x265 Main 10 fallback, explicit HDR color metadata, and 320 kb/s AAC audio.
- Added exact raw-frame streaming to Ut Video RGB/FLAC and FFV1 RGB/FLAC without WebCodecs, MediaRecorder, or intermediate bitrate limits.

- Began the v0.30 workspace redesign with a Photoshop-style left rail for Music, Visuals, Perform, Export, and System while retaining the scalable contextual inspector on the right.
- Added an always-visible Basic / Advanced control in the inspector header with workspace-specific guidance for each mode.
- Added a standalone renderer workspace-shell module that owns workspace definitions, navigation groups, active-state synchronization, and interface-mode routing as the first step toward breaking up the monolithic renderer.
- Added a four-step Audio, Visual, Perform, and Export workflow navigator to Basic mode so new users can move through the creation process without learning every advanced subtab first.
- Added a standalone visual-catalog module with stable IDs, names, categories, descriptions, DOM decoration, and integrity validation for all seven visual families.

### Changed

- Replaced the confusing Base Iterations × Export Detail workflow with one direct Minimum Export Iterations control ranging from 240 to 1200. Export definition is now independent from the lighter live-preview iteration budget, while automatic resolution floors remain active.
- Simplified the Basic Export workspace to the controls most users need: resolution, frame rate, quality profile, HDR, export action, and recent files. Minimum export iterations, encoder diagnostics, preview, and completion-sound controls remain available in Advanced mode, while the redundant Export Engine and Export Detail fields are hidden.
- Reworked the Ion, Ember, Aurora, and Mono color systems as restrained four-stop ramps with smoother transitions, lower saturation, and softer highlight colors for more comfortable SDR and HDR viewing.
- Softened the default and reset colors for the Custom palette so it starts from the same eye-friendly tonal range as the built-in presets.
- Export is now deterministic and offline-only. Quality profiles own the renderer pixel format, codec, container, audio codec, metadata, estimates, and destination extension as one validated pipeline.
- Development launches now use the bundled FFmpeg binary before falling back to the system PATH, matching packaged builds more closely.
- Replaced the crowded five-item inspector tab row with the dedicated workspace rail, leaving the right panel focused on only the controls and subtabs relevant to the selected workspace.
- Added responsive compact and touchscreen layouts for the workspace rail without changing canvas camera state while navigating.
- Basic mode now presents Deck, Playlist, Analysis, Show, Stream, Performance, Reports, and About as its essential tools. Frequency Color, Show Composer, external controls, camera paths, and creative utilities remain available in Advanced mode.
- Switching from Advanced to Basic now redirects any advanced-only panel to the nearest essential panel in the same workspace instead of leaving a hidden or empty inspector.

### Fixed

- Fixed Offline export reverting WebM, MOV, or MKV requests to MP4 because the Windows save dialog always opened with MP4 as its first file-type filter.
- Centralized export-format ordering and extension resolution so Live and Offline exports preserve the requested default while still respecting a format explicitly chosen in the save dialog.

## 0.29.1 - 2026-08-08

### Fixed

- Show playback and the Mathematical Song Director now start in standby after application launch, session restoration, and Performance Package import. Full visual profiles no longer persist or activate the Director's live enable switch. Director style, behavior, intensity, Song Maps, cue edits, and show sequences still restore normally; a Director the user explicitly enabled remains active while changing visual profiles.

### Packaging

- Built refreshed Windows 11 x64 installer and portable artifacts with the complete 0.29 feature set, standby safety fix, bundled FFmpeg 8.1.2, and GPL, third-party, FFmpeg source, and brand notices.

## 0.29.0 - 2026-08-07

### Added

- Added a Music Analysis workspace with dependency-free Music Personality profiles for Balanced, Electronic / EDM, Hip-Hop, Rock / Metal, Pop, Ambient / Classical, and Custom response.
- Music Personality profiles tune frequency boundaries, relative low/mid/high weighting, analyzer smoothing, beat sensitivity, beat cooldown, and automatic reactivity targets in both live playback and deterministic offline export.
- Added cached whole-song Song Maps that visualize energy, bass, mids, highs, detected beats, estimated tempo, and major musical sections without playing the track.
- Song Map timelines support mouse, pen, touch, and keyboard seeking. Detected section cards jump directly to their start times.
- Added the Mathematical Song Director, a non-destructive cue layer that converts Song Map sections into smoothly blended camera, equation, palette, motion, dimensional, fold/warp, Mandelbulb, and pulse-shape direction.
- Added Subtle, Cinematic, Mathematical, and Storm directing styles plus a normalized Director Intensity control and a clickable section cue plan.
- Added genre-aware Director behavior profiles for Balanced, Electronic / EDM, Hip-Hop, Rock / Metal, Pop, and Ambient / Classical music. Auto mode follows the Music Personality stored with the analyzed Song Map, while manual overrides remain independent of analyzer settings.
- Added per-section Director cue editing from the visual timeline. Selecting a section exposes a normalized strength control and Camera, Equation, Color, Dimension, or Fold / Warp emphasis, with a one-click return to the generated automatic cue.
- Added portable `.quartic-performance.json` show packages containing the current full visual, modulation routes, Director configuration, deterministic Song Map, section cue edits, beat grid, show sequence, and its referenced saved profiles.
- Added deterministic package fingerprints, compatibility metadata, and delayed Song Map attachment when a package is imported before its matching local track is loaded.
- Added a distraction-free Performance Mode with optional fullscreen and music HUD, a persistent operator dock, current/next cue information, show progress, and dedicated live transport controls.
- Added a synchronized emergency blackout that also reaches the OBS Output window and can be assigned through MIDI, keyboard, or OSC live-control mappings.
- Added Show Composer, a full-window performance-authoring timeline layered over the existing Show Sequencer. Cues can be selected, scrubbed, reordered by drag and drop, moved with buttons, renamed, deleted, and snapped back to matching Song Map sections.
- Added deterministic **Build from Song Map** authoring. Musical sections become precisely timed cues, saved full profiles rotate across the arrangement, and bounded section-energy curves set Director, motion, equation, color-flow, and camera automation.
- Added optional per-cue visual automation with blank-value profile inheritance, plus a Record Automation mode that writes live Director, motion, equation, color-flow, and camera changes into the selected cue.
- Added a compact Perform > Composer workspace for basic setup and a scalable expanded editor with a global playhead, time ruler, visual-profile track, five automation lanes, and a selected-cue inspector.
- Added a System > Reports workspace that generates paste-ready Markdown bug, crash, export, audio, performance, and feedback reports with optional sanitized diagnostics.
- Added local capture for renderer JavaScript failures, unhandled main-process rejections, uncaught main-process exceptions, renderer termination, unresponsive windows, and Electron child-process failures. Only the 20 newest sanitized incidents are retained locally and nothing is uploaded automatically.
- Added Copy, Save Text, Windows Print/PDF, and GitHub Issue actions, plus opt-in online submission through a configurable HTTPS report relay.
- Added `REPORTING.md` with the relay contract, Azure deployment outline, privacy model, and webhook/rate-limit security checklist.
- Added a deployable Azure Functions Node.js v4 report relay with duplicate server-side sanitization, schema and size validation, mention suppression, best-effort throttling, report receipts, and automated core tests.

### Changed

- Reorganized the control panel into five scalable workspaces: Music, Visuals, Perform, Export, and System.
- Moved OBS and stream automation into Perform, moved About beside performance controls under System, and replaced narrow subtab labels with descriptive two-column cards.
- Added Music Personality to full visual profiles and session state. Manually editing analyzer controls changes the personality to Custom without discarding the user's values.
- Song analysis uses an adaptive sampling interval capped to roughly 1,400 FFT windows, keeping long tracks bounded while preserving deterministic results. Up to ten profile-specific maps are cached locally.
- Song Director plans are deterministic per track and use the same song-time clock during live playback, OBS synchronization, and offline export. Dimensional and folding cues remain inactive unless the user has enabled those GPU-heavy systems.
- Musical behavior profiles reshape cue timing and emphasis rather than replacing visuals: Electronic favors quicker color and pulse movement, Hip-Hop favors bass-weighted camera pushes, Rock / Metal emphasizes midrange motion and folding, Pop favors palette travel, and Ambient / Classical favors slower dimensional arcs.
- Cue edits are stored locally by Song Map key, blended through the same smooth section transitions, and applied without modifying the automatic plan, saved visual preset, or source audio analysis.
- Performance packages intentionally exclude audio bytes, network locations, and local file paths. Cross-PC track matching uses only a portable file-name, size, and analyzed-duration fingerprint.
- Performance Mode reserves Space, Left/Right, B, and Escape for show operation while active; ordinary deck and view shortcuts retain their existing behavior outside that mode.
- Show cues now support hundredth-second timing for accurate Song Map section boundaries while beat-based cues remain whole beats. Cue labels and automation travel inside the existing local show state and portable Performance Packages.
- Direct Discord webhook URLs are rejected as report endpoints. The public app contains only a relay URL; the Discord bearer token must remain in server-side secret storage.
- Secure report submissions now return their report ID as a visible delivery receipt while the relay logs only the report ID and delivery outcome.

### Development policy

- Added public-contribution rules requiring GPL-3.0-or-later compatibility, source and license records for third-party additions, separately verified machine-learning model terms, and updates to third-party notices.

### Packaging

- Built the Windows 11 x64 installer and portable artifacts for the 0.29 feature milestone with bundled FFmpeg 8.1.2 and the GPL, third-party, FFmpeg source, and brand notices.

## 0.28.6 - 2026-08-07

### Added

- Added pointer-captured drag seeking to the track progress bar, plus keyboard seeking and accessible position updates.
- Added Windows tablet support with one-finger canvas manipulation, two-finger pinch zoom and pan/orbit gestures, seamless gesture handoff, touch-safe scrolling, larger coarse-pointer controls, and a wider touch target for the resizable sidebar divider.

### Changed

- Tightened the Mainframe Room contour detector to favor major architectural edges and added luminance-aware highlight compression so energetic passages retain depth instead of bleaching the whole chamber.
- Kept the 3D Mandelbulb recurrence on seam-safe whole-number powers and redirected music and mapped power modulation into continuous Cartesian recurrence warping, preserving localized surface motion without an angular branch cut.

### Fixed

- Removed the horizontal geometry split that appeared when music drove the 3D Mandelbulb recurrence between whole-number powers.
- Reset the centered music transport to its Play state immediately when a newly loaded or selected track replaces the song that was playing.

### Packaging

- Built Windows 11 x64 installer and portable artifacts at version 0.28.6 with bundled FFmpeg 8.1.2 and the GPL, third-party, FFmpeg source, and brand notices.

## 0.28.5 - 2026-08-07

### Added

- Added `THIRD_PARTY_NOTICES.md` with original project, source, and license links for FFmpeg, Electron, Chromium, NAudio, Electron Builder, and NSIS.
- Added an FFmpeg corresponding-source notice to every future packaged application.
- Added a release-packaging guard that rejects FFmpeg versions older than 8.1.2, nonfree builds, missing distributor notices, and builds that do not match the GPL packaging policy.
- Made the Quartic Pulse GPL license, third-party notices, and brand-asset permissions directly accessible in the packaged resources directory.
- Clarified ownership of the Tempest Mainframe, Storm Horizon Media, Storm Horizon Radio, and Quartic Pulse names and official branding.
- Smoothed the Visual Safety Estimate with a fast-attack/slow-release display envelope, two-percent display hysteresis, and stable Calm/Active/Intense boundaries so normal one-percent audio fluctuations no longer make it twitch.
- Added smoothly migrating, music-driven surface hotspots and localized beat waves to the 3D Mandelbulb, and replaced its angular palette mapping with a seamless three-dimensional color field.
- Added the Tempest Mainframe Room as a pseudo-3D visual with depth parallax, bass-driven floor conduits, high-frequency server-wall packets, reactor illumination, expanding beat waves, storm flashes, palette integration, OBS output, and offline export support.

### Changed

- Strengthened the Mainframe Room's frequency response with perceptually boosted band envelopes, faster music-driven data packets, reactor breathing, rack activity, console sweeps, and stronger beat echoes.
- Routed Mainframe Room energy through texture-derived architectural contours so effects illuminate machinery edges, reactor rings, floor seams, and server details instead of appearing as broad overlays.

### Packaging

- Updated the bundled FFmpeg release requirement to 8.1.2 or later and retained NVIDIA NVENC, Intel Quick Sync, AMD AMF, and CPU x264 fallback support.
- Built Windows 11 x64 installer and portable artifacts at version 0.28.5.

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
