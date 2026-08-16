# Quartic Pulse Roadmap

This roadmap records intended development direction and is not a promise of a specific release date.

## Export profile expansion

Completed for v0.30.6:

- MP4 Compatible: H.264/AAC for broad playback and sharing. ✓
- MP4 Fractal Master: hardware-probed HEVC/H.265 10-bit for improved gradients and dense fractal detail. ✓
- WebM Open Quality: VP9/Opus without a final H.264 conversion. ✓
- MOV Editing Master: ProRes 422 HQ for nonlinear editing workflows. ✓
- PNG image sequence plus WAV: interruption-safe, frame-by-frame lossless master export. ✓
- MKV Lossless Archive: FFV1 with lossless audio for archival masters. ✓

Completed specialized export work:

- Automatic GPU Master: recommended 10-bit MP4 output probes hardware AV1 first, hardware HEVC Main 10 second, and CPU HEVC last. It deliberately avoids selecting CPU AV1 automatically. ✓
- Encoder Compatibility: Advanced users can scan the current PC and see verified AV1, HEVC, and H.264 GPU/CPU paths plus the reason Automatic chose its selected encoder. ✓
- Export Readiness: a no-file benchmark measures actual encoder throughput, estimates the current visual renderer's throughput, names the expected bottleneck, and projects time per minute of music. ✓
- Setting Advisor: benchmark results generate reversible Faster, Balanced, and Maximum Detail combinations using only supported resolutions, frame rates, and visible iteration recommendations. ✓
- Resolution selection now loads an editable iteration recommendation instead of enforcing a hidden floor, and optional 2×2 supersampling averages four subpixel renders for final-master antialiasing. ✓
- AV1: Advanced-only 10-bit AV1 WebM automatically prefers detected NVIDIA, Intel, or AMD hardware and clearly warns when it must use the much slower CPU fallback. ✓

The Export workspace now shows the selected container, codec, color depth, chroma format, estimated final bitrate, and estimated file-size range before rendering. ✓

## v0.40 completed release scope

Completed after v0.30.6:

- Phrase-aware motion reads smoothed multi-second Song Map contours so equation and camera movement follow musical development without beat-level strobing. ✓
- Visual motif memory recognizes similar recurring sections and recalls their directional motion signature while preserving current-section energy variation. ✓

Completed architecture and reliability work:

- Add a compact visual-dynamics monitor for understanding which musical layer is currently driving the equation, camera, color, and depth systems. ✓
- Add bounded transition-shape choices for users who want calmer or more theatrical section changes without manually editing modulation routes. ✓
- Extract the Song Director panel, dynamics monitor, and cue editor from `app.js` into a dedicated renderer controller without moving mathematical evaluation or changing output. ✓
- Extract deterministic export sampling policy and RGBA/RGB10 frame averaging from `app.js` into an independently tested engine. ✓
- Move Export settings events, preflight, encoder presentation, advisor options, and export-history presentation into the dedicated Export Controller while leaving render and encoder orchestration independent. ✓
- Extract export estimates, throughput modeling, benchmark interpretation, bottleneck classification, and Setting Advisor selection into an independently tested Export Planning Engine. ✓
- Extract recent-export persistence and recoverable-session normalization into a tested Export History Engine, and move recovery-card presentation/action binding into the Export Controller. ✓
- Extract deterministic offline frame scheduling, supersample traversal, pause/resume behavior, progress cadence, finish/cancel decisions, and frame cleanup into a tested Export Render Coordinator. ✓
- Extract offline preparation, session activation, finalization, abort handling, and state/UI restoration into a tested lifecycle module around the frame coordinator. ✓
- Extract WebGL frame-buffer allocation, RGBA/RGB10 readback, supersample accumulation, and sample-offset cleanup into a tested Export Frame Capture Engine. ✓
- Move offline preparing, rendering, finalizing, completion, cancellation/failure, settings-lock, and restoration presentation states into the tested Export Controller. ✓
- Move live preparing, recording, stopping, finalizing, completion, cancellation/failure, settings-lock, and restoration presentation states into the tested Export Controller. ✓
- Extract live session creation, recorder activation, stop/save, cancellation, desktop abort, and guaranteed restoration into a tested Live Export Lifecycle. ✓
- Move export-preflight Back, five-second test, and full-render choices into the Export Controller, and dispatch those choices through an independently tested Export Workflow Engine. ✓
- Extract export performance summaries, preflight fields/warnings, encoder capability rows, advisor cards, recent-history rows, and recovery descriptions into a tested Export Presentation Engine. ✓
- Extract Export Readiness benchmark execution, skipped/failure handling, result interpretation, and UI transitions into a tested workflow engine and controller-owned presentation states. ✓
- Extract Encoder Compatibility scan execution, invalid/failure handling, and guaranteed restoration into a tested workflow engine with controller-owned running, completed, failed, and restored states. ✓
- Extract export preflight resolution parsing, iteration limits, duration/bitrate calculation, desktop request construction, result normalization, and encoder-status refresh failure handling into a tested Preflight Engine. ✓
- Move Setting Advisor click decoding and export-field application into the Export Controller, and validate/dispatch recommendations through an independently tested Advisor Engine without passing DOM elements into `app.js`. ✓
- Extract interrupted-export recovery and discard sequencing, result validation, failure handling, session cleanup, and guaranteed restoration into a tested Recovery Engine with controller-owned recovery presentation states. ✓
- Extract recent-export clear authorization, Open/Folder routing, missing-entry handling, recoverable-list refresh, normalization, and action failures into a tested History Action Engine while keeping persistence in the existing History Engine. ✓
- Extract export elapsed/remaining timing, pause presentation, native finalizing/saving translation, completion state, delayed dismissal, and completion-stinger decisions into a tested Progress Workflow Engine. ✓
- Extract completed-result validation, current output/reveal state, recent-history recording, progress completion, specialized completion presentation, and success/warning notifications into a tested Result Workflow Engine. ✓
- Move export control reads into the Export Controller and normalize resolution, FPS, format, detail, iterations, HDR/10-bit, supersampling, preview, Unleashed, and duration through one tested immutable Settings Snapshot Engine used across planning and export workflows. ✓
- Coordinate export-setting changes, iteration recommendations, state synchronization, HDR availability, performance refresh, benchmark invalidation, encoder refresh, initialization, and atomic Setting Advisor application through one tested Settings Coordinator. ✓
- Snapshot and restore shared live/offline renderer state through one tested Runtime State Coordinator so completion, cancellation, and failure cannot leave export dimensions, mathematical depth, visual clocks, sampling offsets, HDR flags, or adaptive reactivity active. ✓
- Extract local-track validation, injected audio decoding, duration limiting, exact frame-count calculation, and native live/offline session request construction into a tested Export Preparation Engine. ✓
- Extract canvas/audio stream assembly, live bitrate selection, recorder startup/draining, and capture-only track cleanup into a tested Live Capture Engine shared by Live Export and Quick Clip. ✓
- Extract Quick Clip duration limits, timed stop, progress updates, native finish/abort, cancellation, result dispatch, and guaranteed cleanup into a tested workflow engine. ✓
- Established tested controller, engine, lifecycle, and coordinator boundaries around Song Director and export orchestration while preserving deterministic live, OBS, and offline behavior. ✓

## After v0.40

- Continue reducing the main renderer orchestration layer only where a change has a clear reliability, testability, or performance benefit.
- Prioritize real-world compatibility reports, export-quality evidence, accessibility, and workflow polish over adding broad new feature families.
- Keep public presets and bundled assets compatible with the GPL-3.0-or-later distribution and documented third-party notices.
