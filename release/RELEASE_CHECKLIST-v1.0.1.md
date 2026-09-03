# Quartic Pulse 1.0.1 Release Checklist

## Automated validation

- [x] Package version matches shared application metadata and the stable release channel.
- [x] Frozen workspace installation and dependency audit pass with no known vulnerabilities.
- [x] JavaScript, license, third-party, FFmpeg, Windows audio, brand, icon, reporting, and updater validation pass.
- [x] Controller, engine, report relay, security-policy, updater, and visualizer-package tests pass.
- [x] Complete Electron/WebGL2 smoke matrix passes, including About and OBS workflows.
- [x] Signed installer and portable Windows x64 packages build successfully.
- [x] Packaged application quick release gate passes.
- [x] Unpacked app, installer, and portable executable have valid timestamped Authenticode signatures from one certificate.
- [x] Installer blockmap and `latest.yml` are generated and included in checksums and the release manifest.

## Release publication

- [x] Release branch is committed and pushed.
- [x] Annotated `v1.0.1` tag is pushed.
- [x] GitHub release is published with installer, portable executable, blockmap, update metadata, checksums, manifest, license, third-party notices, and source archive.
- [x] GitHub release is marked as the latest stable release.
- [x] Public release assets and `latest.yml` filenames match exactly.

## Recommended real-machine follow-up

- [ ] Upgrade an installed 1.0.0 copy with the 1.0.1 NSIS package and confirm application data is preserved.
- [ ] Check for an update from an installed 1.0.1 copy after a later test release exists.
- [ ] Launch the portable package and confirm it offers the manual release-page path.
- [ ] Verify background OBS output at both 30 and 60 FPS with the control window minimized.
- [ ] Complete representative 1080p60 Standard, Balanced, and Maximum Clarity exports.
