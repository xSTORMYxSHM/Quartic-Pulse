# Quartic Pulse 1.0.5 Release Checklist

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
- [x] Annotated `v1.0.5` tag is pushed.
- [x] GitHub release is published with installer, portable executable, blockmap, update metadata, checksums, manifest, license, third-party notices, and source archive.
- [x] GitHub release is marked as the latest stable release.
- [x] Public release assets and `latest.yml` filenames match exactly.

## Recommended real-machine follow-up

- [ ] Upgrade an installed 1.0.1 copy through the built-in updater and confirm application data is preserved.
- [ ] Run the signed 1.0.5 installer manually over an existing installation.
- [ ] Confirm the live preview continues while the control window is unfocused and OBS Output is closed.
- [ ] Confirm an unfocused control window stops its duplicate render while OBS Output remains active at both 30 and 60 FPS.
- [ ] Analyze representative bass-heavy and balanced tracks and confirm every Song Map lane remains visible.
