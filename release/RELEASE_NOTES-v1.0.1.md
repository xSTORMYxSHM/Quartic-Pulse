# Quartic Pulse 1.0.1

Quartic Pulse 1.0.1 is the first maintenance release of the stable Windows 11 audio-reactive visualizer and introduces the installed-app update path for future releases.

## Highlights

- Adds an automatic startup check and **System → About → Check for Updates** for installed copies.
- Downloads the signed NSIS installer with visible progress and asks before restarting to install.
- Keeps a manual signed-installer path for in-place upgrades; portable copies open the latest release instead of attempting an unsupported self-install.
- Makes 30 FPS the default OBS output rate and applies the selected 30/60 FPS rate to both rendering and visual-state synchronization.
- Keeps audio analysis and OBS state delivery active in the background while suspending the hidden control window's duplicate WebGL preview and interface updates.

## Updating from 1.0.0

Version 1.0.0 predates the built-in updater, so install the signed 1.0.1 setup package manually once. Installed builds can use the built-in updater beginning with 1.0.1. The installer preserves Quartic Pulse application data and upgrades the existing all-users installation in place.

## Security and distribution

- The updater trusts only main-window IPC and uses the fixed public Quartic Pulse GitHub Releases feed.
- Windows verifies the downloaded installer against the configured application publisher before installation.
- The unpacked application, NSIS installer, and portable executable are Authenticode-signed through Azure Trusted Signing and timestamped.
- The release build refuses to emit final metadata unless all executable signatures are valid and consistent.

## Packages

- `Quartic.Pulse.Setup.1.0.1.exe` — signed customizable Windows 11 x64 installer and manual in-place upgrade.
- `Quartic.Pulse.Portable.1.0.1.exe` — signed portable Windows 11 x64 executable.
- `Quartic.Pulse.Setup.1.0.1.exe.blockmap` — differential update map.
- `latest.yml` — signed-installer update metadata consumed by 1.0.1 and later.
- `SHA256SUMS-v1.0.1.txt` — SHA-256 integrity hashes for the installer, portable executable, blockmap, and update metadata.
- `RELEASE_MANIFEST-v1.0.1.json` — machine-readable sizes, hashes, stable channel, and Authenticode identity.

Microsoft SmartScreen reputation is separate from signature validity and may take time to accumulate for a new product or publisher.
