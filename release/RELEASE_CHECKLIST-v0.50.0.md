# Quartic Pulse 0.50.0 Release Checklist

## Automated validation

- [x] Package version matches shared application metadata and the stable release channel.
- [x] JavaScript source and release metadata validation pass.
- [x] License, third-party, FFmpeg, Windows audio helper, brand, icon, and reporting assets pass validation.
- [x] Controller, engine, report relay, and visualizer-package tests pass.
- [x] Complete Electron/WebGL2 smoke matrix passes.
- [x] Installer and portable Windows x64 packages build successfully.
- [x] Packaged application quick release gate passes.
- [x] SHA-256 checksums and the machine-readable release manifest are generated and verified.

## Release publication

- [ ] Release branch is committed and pushed.
- [ ] Annotated `v0.50.0` tag is pushed.
- [ ] GitHub release is published with installer, portable executable, checksums, manifest, license, and third-party notices.
- [ ] GitHub release is marked as the latest stable release.

## Recommended real-machine follow-up

- [ ] Install and uninstall the NSIS package on a clean Windows 11 machine.
- [ ] Launch the portable package independently.
- [ ] Complete representative 1080p60 Standard, Balanced, and Maximum Clarity exports.
- [ ] Verify HDR output on an HDR display.
- [ ] Verify Windows playback/input capture and OBS automation with the intended production devices.
