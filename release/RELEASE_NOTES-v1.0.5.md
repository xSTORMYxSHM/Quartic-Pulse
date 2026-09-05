# Quartic Pulse 1.0.5

Quartic Pulse 1.0.5 is a stable maintenance release focused on Song Map readability and predictable live rendering when the control window is not focused.

## Highlights

- Corrects the Song Map canvas so bass, mids, and highs remain inside their intended chart lanes.
- Keeps the app's live visual preview running at an efficient 30 FPS while the window is unfocused and no dedicated OBS Output is open.
- Retains the low-resource OBS path: when OBS Output is open, the unfocused control window stops its duplicate WebGL render while audio analysis and synchronized visual state continue.
- Preserves the shared Song Map frequency normalization used by section analysis and Song Director; this release changes only the chart coordinates.
- Hardens release checksum generation against PowerShell module-session command availability issues.

## Updating from 1.0.1

Installed 1.0.1 copies can use the automatic startup check or **System → About → Check for Updates**. The signed installer can also be downloaded and run manually as an in-place upgrade. Existing application data is preserved.

## Security and distribution

- Windows verifies the downloaded installer against the configured Quartic Pulse publisher before installation.
- The unpacked application, NSIS installer, and portable executable are Authenticode-signed through Azure Trusted Signing and timestamped.
- The release build refuses to emit final metadata unless all executable signatures are valid and consistent.

## Packages

- `Quartic.Pulse.Setup.1.0.5.exe` — signed customizable Windows 11 x64 installer and manual in-place upgrade.
- `Quartic.Pulse.Portable.1.0.5.exe` — signed portable Windows 11 x64 executable.
- `Quartic.Pulse.Setup.1.0.5.exe.blockmap` — differential update map.
- `latest.yml` — installer update metadata consumed by updater-enabled releases.
- `SHA256SUMS-v1.0.5.txt` — SHA-256 integrity hashes for the installer, portable executable, blockmap, and update metadata.
- `RELEASE_MANIFEST-v1.0.5.json` — machine-readable sizes, hashes, stable channel, and Authenticode identity.

Microsoft SmartScreen reputation is separate from signature validity and may take time to accumulate for a new product or publisher.
