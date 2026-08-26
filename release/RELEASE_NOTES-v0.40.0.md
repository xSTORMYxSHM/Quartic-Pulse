# Quartic Pulse 0.40.0 Release Candidate

Quartic Pulse 0.40.0 brings the musical-performance and export-hardening work developed after 0.30.6 into one release candidate. The focus is not simply more effects: it is smoother equation-level musical motion, reproducible shows, cleaner final renders, and safer internal boundaries around long-running exports.

## Musical motion

- The Mathematical Song Director reads phrase-scale energy and frequency contours rather than driving every change from individual peaks.
- Recurring song sections reuse deterministic visual motifs, giving verses, choruses, and related passages a recognizable visual identity.
- Auto, Gentle, Balanced, and Theatrical transition profiles shape section changes without hard cuts or beat-level strobing.
- A compact dynamics monitor explains how Camera, Math, Color, and Depth are being driven.
- Song Director settings and transitions are preserved by profiles, session restore, OBS synchronization, and portable Performance Packages.

## Export quality

- Resolution selection loads a visible starting recommendation while Export Iterations remains an exact user-controlled mathematical depth.
- Optional 2×2 supersampling renders and averages four stable subpixel samples per output frame to reduce fine-boundary grain and shimmer.
- Export estimates and preflight identify the supersampling cost before rendering begins.
- Deterministic offline rendering, encoder preflight, recovery, recent-history actions, completion behavior, pause/resume, End & Finish, and Cancel now run through tested lifecycle and coordinator boundaries.
- Automatic GPU Master, HEVC Main 10, AV1, H.264, VP9, ProRes, FFV1, and recoverable PNG/WAV workflows remain available through the bundled FFmpeg distribution.

## Reliability and maintainability

- Song Director presentation was separated from its mathematical evaluation.
- Export sampling, frame capture, planning, preparation, progress, results, history, recovery, settings, encoder checks, live capture, Quick Clips, and offline/live lifecycle behavior now have dedicated tested modules.
- The application version is defined through shared metadata and checked against package metadata during every release gate.
- A repeatable release gate validates JavaScript syntax, GPL and third-party assets, CSP safety, bundled FFmpeg version and encoder availability, controller tests, report-relay tests, WebGL2 startup, and every major workspace.

## Candidate status

This build is a release candidate until it passes the real-machine checklist in `release/RELEASE_CHECKLIST-v0.40.0.md`. Promotion to Stable changes only the release channel after those results are recorded; it does not bypass testing.

## Candidate packages

- `Quartic Pulse Setup 0.40.0.exe` — customizable Windows 11 x64 installer with selectable destination.
- `Quartic Pulse 0.40.0.exe` — portable Windows 11 x64 executable.
- `SHA256SUMS-v0.40.0.txt` — integrity hashes for both packages.
- `RELEASE_MANIFEST-v0.40.0.json` — machine-readable package sizes, hashes, channel, and signing state.

Quartic Pulse is licensed under GPL-3.0-or-later. Bundled FFmpeg, NAudio, and other third-party notices are included with both installer and portable packages. Unsigned packages may still trigger Windows SmartScreen or Smart App Control.
