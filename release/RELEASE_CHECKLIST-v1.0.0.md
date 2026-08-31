# Quartic Pulse 1.0.0 Release Checklist

## Automated validation

- [x] Package version matches shared application metadata and the stable release channel.
- [x] Frozen workspace installation and dependency audit pass with no known vulnerabilities.
- [x] JavaScript, license, third-party, FFmpeg, Windows audio, brand, icon, and reporting validation pass.
- [x] Controller, engine, report relay, security-policy, and visualizer-package tests pass.
- [x] Complete Electron/WebGL2 smoke matrix passes.
- [x] Signed installer and portable Windows x64 packages build successfully.
- [x] Packaged application quick release gate passes.
- [x] Unpacked app, installer, and portable executable have valid timestamped Authenticode signatures from one certificate.
- [x] SHA-256 checksums and the machine-readable release manifest are generated and verified.

## Release publication

- [ ] Release branch is committed and pushed.
- [ ] Annotated `v1.0.0` tag is pushed.
- [ ] GitHub release is published with installer, portable executable, checksums, manifest, license, third-party notices, and source archive.
- [ ] GitHub release is marked as the latest stable release.

## Recommended real-machine follow-up

- [ ] Install, launch, and uninstall the NSIS package on a clean Windows 11 machine.
- [ ] Launch the portable package independently.
- [ ] Complete representative 1080p60 Standard, Balanced, and Maximum Clarity exports.
- [ ] Verify HDR output on an HDR display.
- [ ] Verify Windows playback/input capture and OBS automation with the intended production devices.
