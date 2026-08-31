# Changelog

All notable Quartic Pulse changes are documented here. Quartic Pulse follows semantic versioning where practical.

## 1.0.0 - 2026-08-30

### Added

- Added Balanced Clarity for offline exports. It averages two opposed rotated subpixel samples in linear light, improving dense high-iteration fractal edges at about half the render cost of the existing four-sample path.

### Changed

- Replaced the Supersampling switch with explicit Standard 1×, Balanced Clarity 2×, and Maximum Clarity 4× export modes. Performance estimates and preflight summaries now show the selected render multiplier.
- Preserved Full Visual Settings profile compatibility: older profiles with Supersampling enabled restore as Maximum Clarity 4×, while new profiles retain the exact clarity mode.
- Upgraded the desktop runtime to Electron 44 and moved the desktop app plus report relay onto one frozen pnpm workspace lockfile.
- Made clean Windows installs locate their actual Node runtime before bootstrapping Electron, including pnpm environments where Node is not globally available.
- Promoted the validated desktop application, installer, portable package, and public metadata to the first 1.0.0 stable release.

### Fixed

- Restored the Advanced Export Live Iterations control so Match Live Mathematics no longer leaves the active iteration count locked behind a hidden slider.
- Removed the shader's time-varying one-pixel grain from export frames so high-iteration fractal boundaries remain clearer and compress without crawling static; the live visual treatment is unchanged.
- Rendered imported Song Map and Song Director labels as text, added strict map structure limits, blocked non-local window navigation, origin-bound media permissions, and authenticated privileged IPC senders.
- Restricted export Open and Reveal actions to local Quartic Pulse media targets instead of arbitrary filesystem paths.
- Replaced the imported-visualizer smoke test's fixed startup delay with bounded readiness polling so cold checkouts validate reliably.
- Added mandatory timestamped Authenticode verification for the unpacked app, NSIS installer, and portable executable before release metadata is emitted.

## 0.45.0 - 2026-08-21

### Added

- Added compatibility with Data Horizon Studio 0.15.0 visualizer packages and its reusable preset authoring workflow.
- Added packaged regression coverage for the synchronized Data Horizon 0.15.0 runtime, all seven native layer types, effects, masks, audio bindings, animation tracks, and package palettes.

### Changed

- Regenerated the isolated first-party Data Horizon vendor runtime from the tested 0.15.0 source while preserving Quartic Pulse's small host adapter and data-only package security boundary.
- Promoted the modular custom-visualizer, palette-library, profiles, mapping, shader, renderer, audio-response, and controller work completed since 0.40.2 into the 0.45.0 release line.

### Fixed

- Kept imported Data Horizon projects on the same deterministic live, OBS, and offline audio/transport path used by the built-in visualizers after the runtime upgrade.
- Made Equation Fold & Warp and Dimensional Rotation preset cards reflect their actual feature state: clicking the active card again now turns the feature off, and disabling it elsewhere clears the highlight.

## 0.40.2 - 2026-08-21

### Added

- Added an independently tested Audio Modulation Engine with per-visual target capabilities, applied-output diagnostics, compatible preset adaptation, and a dedicated 3D Pulse preset for Mandelbulb.
- Added an independently tested Audio Response Engine that owns frame-rate-independent band, spectrum, waveform, hue, gain, decay, and continuous music-clock state for both live and offline rendering.
- Added persistent custom visualizer packages exported by Data Horizon, including strict manifest/project/path/asset validation, stable style identities, preview cards, import/update/remove controls, shared main/OBS rendering, deterministic audio-feature and transport-clock input, and SDR/8-bit offline-frame support.
- Added a built-in compatible Data Horizon project renderer so imported visualizers remain same-canvas WebGL2 compositions without executing package JavaScript or adding a runtime dependency on the exported bundle.
- Expanded the bundled first-party Data Horizon renderer to version 0.10 with native text, shape, spectrum, waveform, particle, and animated path layers; region and painted masks; posterize, bloom, scanlines, and displacement; authored timeline evaluation; and direct audio-frame input.
- Added a reproducible runtime synchronization tool so reviewed Data Horizon renderer upgrades generate a dedicated vendor module while the Quartic host adapter remains small and auditable.
- Added a My Palettes browser backed by portable Color Palette profiles, with one-click custom-color saving, named gradient cards, favorite ordering, and immediate application of saved or imported palettes.
- Added optional, validated four-color palettes to Data Horizon packages, with pre-install package previews, package attribution, stable update identities, preserved favorites, and automatic cleanup on package removal.
- Added a documented Data Horizon package contract and reference export fixture for visualizer and palette round-trip testing.
- Full Visual Settings profiles now retain the stable Data Horizon package identity for custom visualizers and report a missing package while safely applying the rest of the profile.

### Changed

- Reduced `app.js` from 5,060 to 2,769 lines by moving Show/Performance ownership, audio-source and Windows-device lifecycle, Song Map presentation/cache coordination, profiles, performance packages/session restore, operator tools, workspace UI, and Show Composer orchestration into focused controllers.
- Kept `app.js` as the composition root for cross-controller callbacks, the render/audio-response loop, and export job orchestration rather than relocating those shared workflows into feature modules.
- Added release readiness diagnostics and required-asset checks for every newly extracted renderer controller.
- Moved dimensional, fold, spectrum, radial, Mandelbulb, pulse, experience, recommended-fractal, and visual-safety preset ownership out of `app.js` into a dedicated tested controller with consistent control dispatch and Custom-state tracking.
- Moved Music Personality profile application, manual-mode transitions, ordered frequency-band boundaries, response-control synchronization, panel rendering, and event binding out of `app.js` into a dedicated tested controller shared by live analysis, Song Map, capture, and export consumers.
- Moved Audio Modulation Matrix persistence, route rendering, preset application, compatibility messaging, event binding, profile replacement, and live meter presentation out of `app.js` into a dedicated tested controller.
- Mapping now identifies the active visual's supported targets, pauses incompatible saved routes without deleting them, disables unavailable preset/target choices, and distinguishes Quartic routes from authored Data Horizon package bindings.
- Included the deterministic Data Horizon signal fixture in packaged resources so release builds can exercise custom visualizer installation and rendering during their packaged-application smoke test.
- Upgraded the packaged Data Horizon fixture and smoke diagnostics to require all seven native visual layer types, timeline animation, native effects, and bundled palettes in the live WebGL path.

### Fixed

- Fixed a stale Show serializer reference exposed during controller extraction and a latent unload-time OSC reference that could raise a renderer error while closing the app.
- Fixed playlist performance updates still targeting the retired in-file Performance Dock function after Show ownership moved to its controller.
- Fixed release builds leaving stale checksum and manifest files behind; packaging now regenerates artifact sizes and SHA-256 hashes after a successful build and packaged smoke test.
- Added one bounded electron-builder retry when Windows or OneDrive briefly locks the staged executable during release packaging.
- Fixed Color Position routes being suppressed when Color by Frequency was disabled; mapped palette movement now has its own shader input and works independently.
- Fixed route meters displaying source-envelope motion for zero-output or incompatible routes instead of the modulation actually applied to the renderer.
- Fixed the enabled Audio Modulation Matrix muting all built-in bass, mids, highs, beat, and motion response for Fractal and 3D Mandelbulb, including when the matrix had no active routes. Matrix routes now layer over the normal visual response as intended.
- Removed a duplicate live pulse-event advancement that made emitted rings age twice per rendered frame.

- Replaced duplicated live/offline audio smoothing with one deterministic response path and converted audio-driven shader phase motion to accumulated music clocks, preventing changing band levels from causing late-song phase jumps.
- Moved analyzer smoothing out of Web Audio's renderer-dependent history and into shared time-based envelopes while preserving existing Music Personality controls and modulation routing.
- Moved the WebGL2 vertex and fragment shader source out of `app.js` into a dedicated immutable renderer module without changing compilation or uniform ownership.
- Moved visual, audio-personality, modulation, effect, and control configuration data into a dedicated renderer settings catalog.
- Moved WebGL2 context creation, shader compilation, uniform uploads, canvas sizing, HDR framebuffer ownership, and GPU draw submission into a dedicated visual renderer module.
- Moved reusable FFT math and Song Map tempo, section, and full-buffer analysis out of `app.js` into independently tested audio-analysis modules.
- Moved frame-sample classification and hardware-mode recommendations into a pure performance analysis engine.
- Moved OBS WebSocket authentication, request tracking, scene/source control, profile links, and automation UI ownership into a dedicated controller.
- Moved MIDI learning, keyboard bindings, OSC routing, persistence, and live-control UI ownership into a dedicated controller while keeping application commands in the composition root.
- Moved camera bookmarks, path interpolation, motion presets, mouse-wheel zoom, drag, and pinch interaction into a dedicated camera controller.
- Moved deterministic offline FFT frame extraction and response application into a dedicated offline audio analysis engine shared by export orchestration.
- Moved playlist files, selection, transport state, object-URL cleanup, and playlist rendering into a dedicated controller.
- Moved application-state construction into a factory so the composition root owns a fresh state instance instead of embedding its schema.

## 0.40.1 - 2026-08-16

### Added

- Added Match Live Mathematics to offline export and enabled it by default. Export resolution and sampling can now increase image quality without silently changing the live fractal set.

### Changed

- Synchronized deck visuals to the audio timeline so live playback and deterministic offline frames use the same animation time and framing.
- Replaced the original box-grid supersampling resolve with a rotated four-sample pattern averaged in linear light, including transfer-correct 10-bit Rec.2020 HLG handling.
- Reframed Export Iterations as an explicit alternate mathematical-depth control used only when Match Live Mathematics is disabled.

### Fixed

- Fixed offline exports using the 1080p recommendation of 600 iterations when the live visualizer was using a lower iteration count, which changed the fractal structure and made exports appear denser or muddier instead of sharper.
- Fixed supersampling averaging display-encoded pixels directly, which darkened and softened thin cyan, purple, and blue details.
- Fixed export frame zero inheriting bass, mids, highs, RMS, beat, hue, and analyzer history from the live frame present when Export was clicked.

## 0.40.0 - 2026-08-15

### Added

- Added optional 2×2 offline supersampling. Each exported frame can now average four stable subpixel renders before encoding, reducing fine-boundary grain, shimmer, and stair-stepping without changing codec bitrate.
- Added visible resolution-based iteration recommendations: 320 at 480p, 400 at 720p, 600 at 1080p, 800 at 1440p, and 1000 at 4K.
- Added phrase-aware Mathematical Song Director motion. The Director now reads multi-second energy and frequency contours inside each Song Map section, producing deterministic slow equation, camera, color, depth, and fold evolution that matches live playback and offline export without beat-level strobing.
- Added deterministic visual motif memory to the Mathematical Song Director. Similar recurring sections of the same musical type now reuse a recognizable equation and camera motion signature while their current phrase energy continues to shape its strength.
- Added visible Motif A/B/C labels to the Director timeline and current-phrase display without adding another control or configuration step.
- Added a compact Mathematical Song Director dynamics monitor with labeled Camera, Math, Color, and Depth meters plus a live bass/mids/highs/energy-to-visual readout.
- Added bounded Song Director Transition Feel profiles: Auto, Gentle, Balanced, and Theatrical. They reshape deterministic section crossfades without introducing hard cuts or beat-level jumps.
- Preserved Transition Feel through saved profiles, automatic session restore, OBS synchronization, and portable Performance Packages while retaining Director standby safety.

### Changed

- Added a tested Export Job Coordinator that admits and launches offline and live jobs through their dedicated lifecycle engines, prevents overlapping launch preparation, validates renderer adapters, and preserves the original request through adapter construction. Offline and live start commands in `app.js` now delegate to one job boundary while WebGL, audio, and desktop operations remain explicit renderer adapters.
- Added a tested Export Progress Coordinator that binds and disposes the native FFmpeg progress listener and owns the presentation bridge for progress start, frame/live updates, native finalizing/saving events, completion actions, delayed hiding, and the completion stinger. `app.js` now sends progress facts through one coordinator instead of maintaining separate rendering, native-event, and completion helpers.
- Added a tested Export Command Coordinator that owns Pause/Resume, End & Finish, and confirmed Cancel routing across offline and live exports. Export command decisions now preserve pause timing, shortened-finalization requests, native aborts, audio pausing, and recorder stopping without directly editing UI from `app.js`; the Export Controller owns the visible ending and cancelling states.
- Added a tested Quick Clip Workflow Engine that owns 5/10/15-second duration limits, timed recorder stop, progress cadence, native session finalization/abort, cancellation requests, completion/failure dispatch, and guaranteed capture cleanup. Creative Tools now supplies only the visible Quick Clip state and authorized audio/desktop operations.
- Added a tested Live Capture Engine that owns canvas/audio stream assembly, resolution-aware recording bitrate, recorder creation, serialized draining, stop waiting, and idempotent cleanup. Live Export and Quick Clip now share the same capture path, and temporary canvas video tracks are reliably stopped without interrupting the shared audio graph.
- Added a tested Export Preparation Engine that validates local tracks and settings, decodes injected audio data, applies five-second/full-duration limits, calculates deterministic frame counts, and constructs native live/offline session requests with the selected format, pixel type, HDR mode, storage estimate, and encoder. `app.js` now provides audio/desktop operations instead of assembling export contexts and IPC payloads itself.
- Added a tested Export Runtime State Coordinator that snapshots and restores renderer dimensions, detail, mathematical depth, visual time, dimensional rotation phase, adaptive-reactivity gain, sampling offsets, HDR/10-bit flags, offline timing, playback-loop state, and active-export flags across live and offline activation, finalization, cancellation, and failure. Live export now restores the same pre-export visual timeline that offline export already preserved.
- Fixed offline supersampling activation reading outside its prepared export context, which could stop a supersampled render as its frame-capture session began.
- Added a tested Export Settings Coordinator that sequences resolution-based iteration recommendations, numeric/state synchronization, HDR availability, performance-summary refresh, benchmark invalidation, encoder refresh, initialization, audio/visual changes, and Setting Advisor application. Advisor presets now apply atomically without triggering three redundant control-change refresh cycles.
- Added a tested Export Settings Snapshot Engine and controller-owned settings reader. Resolution, dimensions, FPS, format/profile, detail, requested/effective iterations, HDR/10-bit state, supersampling, preview state, Unleashed state, and audio duration now enter estimates, preflight, benchmarking, offline export, live export, and result metadata through one immutable validated snapshot.
- Added a tested Export Result Workflow Engine that validates completed output paths, records normalized recent-history entries, owns the current revealable result, resets stale results when a new export or recovery begins, dispatches progress completion, and creates consistent offline, live, recovered, shortened, and warning notifications.
- Added a tested Export Progress Workflow Engine that owns elapsed/remaining-time presentation, pause timing, native finalizing/saving progress translation, completion state, delayed progress dismissal, and completion-stinger decisions. `app.js` now supplies controller rendering, current export state, and the authorized media playback callback.
- Added a tested Export History Action Engine that coordinates recent-history clear confirmation, Open/Folder desktop routing, missing entries, recoverable-export refresh, normalization, and failures. Export-history persistence remains isolated in the existing History Engine, while `app.js` now supplies only user confirmation, authorized desktop operations, and presentation callbacks.
- Added a tested Export Recovery Engine that owns interrupted-master recovery and discard sequencing, validates recovered results, and guarantees session cleanup and restoration after success or failure. Recovery preparation, progress, completion, failure, control locking, output reveal, and restoration now use controller-owned presentation states instead of direct DOM changes in `app.js`.
- Added a tested Export Advisor Engine that validates recommended resolution, frame rate, and iteration values against the options available in the current build before applying them. The Export Controller now decodes advisor clicks and updates the three export fields, so `app.js` receives plain settings instead of UI buttons.
- Added a tested Export Preflight Engine that owns resolution parsing, iteration limiting, duration and master-bitrate calculation, desktop request construction, result normalization, and encoder-status refresh failures. Format changes now show an explicit quality-pipeline checking state while the renderer supplies only current settings and the authorized desktop operation.
- Added a tested Export Encoder Scan Engine that owns compatibility-scan execution, report validation, failure handling, and guaranteed restoration. The Export Controller now owns running, completed, failed, and restored scan states, and `app.js` no longer manipulates encoder-capability UI fields directly.
- Added a tested Export Benchmark Engine that owns Export Readiness preparation, encoder measurement, modeled render throughput, skipped and failed paths, and guaranteed restoration. Benchmark running, completed, skipped, failed, and restored UI states now belong to the Export Controller, while the Export Presentation Engine supplies their user-facing values and explanations.
- Added a tested Export Presentation Engine that builds performance summaries, preflight fields and storage warnings, encoder status/capability rows, Setting Advisor cards, recent-export rows, and recovery descriptions. `app.js` now supplies current settings and domain results instead of constructing Export workspace text and view objects itself.
- Added a tested Export Workflow Engine that owns Back, five-second test, full-render, and failure dispatch while keeping preflight calculations and offline frame rendering injectable. The Export Controller now owns the preflight modal’s button lifecycle and prevents stale handlers from surviving between export attempts.
- Added an independently tested Live Export Lifecycle that keeps a live session active across recorder startup and its asynchronous stop event, then owns finish, cancel, abort, failure, and guaranteed cleanup sequencing.
- Moved live-export presentation transitions into the Export Controller. Preparing, recording, Stop & Save, cancelling, finalizing, completed, failed, settings-lock, preview, and restoration states now use the same tested presentation boundary as offline export.
- Moved offline-export presentation transitions into the Export Controller. Preparing, rendering, finalizing, completed, cancelled/failed, and restored states now consistently control button labels, action availability, settings locks, preview composition, progress visibility, and output reveal behavior through one tested interface.
- Extracted WebGL export readback into an independently tested Export Frame Capture Engine. It now owns RGBA/RGB10 pixel-type selection, frame-buffer allocation, visual-frame synchronization, four-pass supersample accumulation/resolution, output-byte access, and sample-offset cleanup.
- Added an independently tested Offline Export Lifecycle that sequences audio preparation, desktop session creation, renderer activation, finalization, cancellation, abort, and global state/UI restoration around the frame coordinator. Preparation failures and cancelled save dialogs now use the same deterministic cleanup path as interrupted renders.
- Extracted deterministic offline frame scheduling into an independently tested Export Render Coordinator. It now owns frame timing, supersample passes, pause/resume polling, progress cadence, end-and-finish boundaries, cancellation checks, and per-frame cleanup while WebGL drawing and desktop encoding remain injected pipeline operations.
- Added an independently tested Export History Engine that validates, limits, deduplicates, records, reloads, and clears recent-export metadata while safely surviving invalid or unavailable local storage.
- Moved interrupted-export card rendering and recovery/discard event routing into the Export Controller. The main renderer now retains only the authorized desktop recovery operations and export lifecycle transitions.
- Extracted export profile estimates, bitrate/file-size formatting, render-throughput modeling, benchmark interpretation, bottleneck classification, and three-goal Setting Advisor selection into an independently tested Export Planning Engine.
- Expanded the dedicated Export Controller to own Export workspace settings events plus performance-summary, preflight, encoder-status/capability, setting-advisor, and recent-history presentation. Export calculations, persistence, benchmark modeling, and render orchestration remain isolated in the main application layer.
- Extracted resolution recommendations, iteration ceilings, frame-buffer allocation, subpixel offsets, and RGBA/RGB10 averaging from `app.js` into a dedicated deterministic Export Sampling Engine with independent tests.
- Export Iterations is now the exact user-controlled mathematical depth. Selecting a resolution visibly loads its recommended starting value, but manual changes are no longer silently raised by a hidden resolution floor.
- Export estimates and preflight summaries now identify 4× supersampling and include its four-render-per-frame performance cost.
- Extracted Mathematical Song Director panel rendering, dynamics display, cue selection, cue editing, and control binding from the main renderer into a dedicated controller module. Mathematical evaluation and shared render state remain in the main orchestration layer, preserving identical live, OBS, and offline behavior while making future work safer.

## 0.30.6 - 2026-08-14

### Added

- Added Automatic GPU Master as the recommended 10-bit MP4 profile. It probes hardware AV1 first, then hardware HEVC Main 10, and uses CPU HEVC only when no compatible GPU encoder can initialize.
- Added NVIDIA, Intel, and AMD HEVC Main 10 hardware profiles plus a quality-first x265 fallback for Automatic GPU Master.
- Added an Advanced Encoder Compatibility panel that scans the current PC, lists working and unavailable AV1, HEVC, and H.264 paths, distinguishes GPU and CPU encoders, and explains the Automatic selection.
- Added an Advanced Export Readiness benchmark that measures the selected FFmpeg encoder at the chosen resolution and frame rate, models current fractal-render throughput, identifies the likely bottleneck, and estimates export time per minute of music.
- Added a safety rule that skips CPU AV1 stress testing and directs users to Automatic GPU Master instead of accidentally launching an extremely slow high-resolution benchmark.
- Added a post-benchmark Setting Advisor with Faster Turnaround, Balanced Master, and Maximum Detail recommendations. Each option shows resolution, FPS, minimum iterations, and estimated time per minute before applying it.
- Added an Advanced-only 10-bit AV1/Opus 256 kb/s WebM upload master with automatic NVIDIA NVENC, Intel Quick Sync, AMD AMF, and CPU libaom encoder selection.
- Added an explicit preflight warning when AV1 must use its exceptionally slow software fallback.
- Added Compatible MP4 (H.264/AAC), Open Quality WebM (VP9 Profile 1/Opus), and ProRes 422 HQ MOV editing-master profiles to the deterministic offline exporter.
- Added one shared export-profile catalog so the renderer, save dialog, destination extension, codec policy, color/chroma description, and storage estimates use the same definitions.
- Added visible export-profile details and expanded preflight reporting for container, video codec, color depth, chroma format, audio codec, estimated bitrate range, and estimated file-size range.
- Added a recoverable PNG image-sequence master that writes each lossless frame independently, then creates matching 24-bit WAV audio and a portable JSON sequence manifest.
- Added image-sequence crash recovery based on the PNG files actually present, allowing an interrupted sequence to be completed as a shortened usable master without repacking its frames.
- Added a persistent Music Deck playback-output selector that routes loaded songs directly to Windows and SteelSeries Sonar virtual devices without relying on Sonar app-tile discovery.

### Changed

- Automatic export never selects CPU AV1: systems without AV1 encoding hardware move to HEVC so high-quality full-song exports remain practical on GPUs such as the RTX 3080.
- Changing the export quality profile now refreshes its encoder status immediately instead of retaining the previous profile's encoder label.
- Export benchmark results mark themselves stale when resolution, FPS, quality profile, HDR mode, visual type, or live/export iteration settings change.
- Applying an advisor recommendation changes only resolution, FPS, and minimum export iterations; the chosen codec/profile and all visual settings remain untouched.
- Audio Modulation Matrix amounts now use target-aware ranges. Strength-only targets use a clear 0–100% scale, while targets with a meaningful reverse direction retain −100% to +100%.
- Switching a modulation route target immediately updates its allowed amount range; older negative values on strength-only targets migrate safely to 0%.
- Assigned Quartic Pulse its explicit Windows AppUserModelID at startup so installed builds expose a stable application identity to Windows integration services.

### Fixed

- Playlist selection is now independent from the track loaded in the Music Deck. Single-clicking, reordering, or removing another playlist row no longer interrupts or starts playback; double-click remains the explicit load-and-play action, and removing the loaded track stops cleanly without auto-starting its replacement.

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
