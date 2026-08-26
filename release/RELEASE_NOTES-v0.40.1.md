# Quartic Pulse 0.40.1 Release Candidate

Quartic Pulse 0.40.1 fixes the principal causes of offline fractal exports looking worse or structurally different from the live visualizer.

## Export parity and supersampling

- Added Match Live Mathematics and enabled it by default, preserving the live fractal set during offline export.
- Synchronized live deck animation to the audio timeline so offline frames use matching framing and rotation.
- Reset audio-reactive visual history deterministically at the beginning of live and offline export sessions.
- Replaced display-encoded box averaging with a rotated four-sample linear-light resolve that preserves thin colored details.
- Added transfer-correct supersampling for 10-bit Rec.2020 HLG exports.
- Retained Export Iterations as an alternate mathematical-depth control when Match Live Mathematics is disabled.

## Packages

- `Quartic Pulse Setup 0.40.1.exe` — customizable Windows 11 x64 installer.
- `Quartic Pulse 0.40.1.exe` — portable Windows 11 x64 executable.
- `SHA256SUMS-v0.40.1.txt` — SHA-256 integrity hashes.
- `RELEASE_MANIFEST-v0.40.1.json` — machine-readable sizes, hashes, channel, and signing state.

The complete automated release gate and packaged-application smoke test passed. This build remains a release candidate pending real-machine export, installation, and HDR checks. Packages are not Authenticode-signed and may trigger Windows SmartScreen or Smart App Control.
