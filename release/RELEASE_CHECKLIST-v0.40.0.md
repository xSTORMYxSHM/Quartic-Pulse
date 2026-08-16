# Quartic Pulse 0.40.0 Release Checklist

## Automated gate

- [x] Package version matches shared renderer metadata.
- [x] JavaScript source parses without syntax errors.
- [x] GPL, third-party notices, brand notice, Windows audio helper, FFmpeg notices, logos, stinger, icon, and scene assets are present.
- [x] Bundled FFmpeg is version 8.1.2 or newer and exposes required master/share encoders.
- [x] Controller and engine smoke suite passes.
- [x] Secure report-relay tests pass and no Discord webhook is embedded in public application source.
- [x] Electron/WebGL2 smoke matrix passes Music, Visuals, Perform, Stream, Export, System, Reports, and About.

Run the complete automated gate from the Development Build folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release-gate.ps1
```

Build both Windows packages without requiring global `node`, `npm`, or `pnpm` commands:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-release.ps1
```

Validate the packaged application instead of the development Electron host:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release-gate.ps1 -Quick -DesktopExecutablePath '.\release\win-unpacked\Quartic Pulse.exe'
```

## Real-machine release-candidate tests

- [ ] Load, play, pause, seek, drag-seek, replace, and finish a local song.
- [ ] Confirm playlist selection, move, and delete do not start playback.
- [ ] Confirm Windows playback, input, and SteelSeries Sonar endpoints enumerate and capture.
- [ ] Test a calm, bass-heavy, dense, and highly dynamic song with Auto Reactivity.
- [ ] Confirm modulation routes individually affect their selected targets and bypass cleanly.
- [ ] Confirm Song Map, motif recall, transition feel, cue overrides, and Performance Package round-trip.
- [ ] Confirm 2D fractal, 3D Mandelbulb, Spectrum Bars, Radial Spectrum, Pulse Rings, Waveform Field, and Tempest Data Horizon.
- [ ] Confirm OBS output opens, moves, resizes, mirrors controls, and closes; test chroma background when needed.
- [ ] Complete a 5-second 1080p60 SDR Automatic GPU Master export.
- [ ] Complete a 5-second 4K60 SDR Automatic GPU Master export using recommended iterations and supersampling.
- [ ] Complete one HDR export on an HDR display and verify it separately from SDR.
- [ ] Verify Pause/Resume, End & Finish, Cancel, completion stinger, recent Open/Folder, and interrupted-sequence recovery.
- [ ] Install the NSIS package to a chosen folder, launch it, uninstall it, and verify the portable package launches independently.
- [ ] Confirm About reports 0.40.0 Release Candidate and bundled license/notice files are present.
- [ ] Confirm no crash report is sent without the user's explicit action.

## Stable promotion

- [ ] Record any defects found during candidate testing in the changelog.
- [ ] Re-run the complete automated release gate after fixes.
- [ ] Change `releaseChannel` in `src/shared/app-metadata.js` from `release-candidate` to `stable`.
- [ ] Rebuild installer and portable packages from a clean application shutdown.
- [ ] Re-test package installation and portable startup.
- [ ] Publish checksums, release notes, GPL license, and third-party notices with the GitHub release.
