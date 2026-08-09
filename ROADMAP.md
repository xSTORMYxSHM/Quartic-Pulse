# Quartic Pulse Roadmap

This roadmap records intended development direction and is not a promise of a specific release date.

## Export profile expansion

Planned after the v0.30 format-preservation fix:

- MP4 Compatible: H.264/AAC for broad playback and sharing.
- MP4 Fractal Master: hardware-probed HEVC/H.265 10-bit for improved gradients and dense fractal detail.
- WebM Open Quality: VP9/Opus without the final H.264 conversion.
- MOV Editing Master: ProRes 422 HQ for nonlinear editing workflows.
- MKV Lossless Archive: FFV1 with lossless audio for archival masters.
- PNG image sequence plus WAV: recoverable frame-by-frame master export.
- AV1: an advanced future option when supported by detected hardware, with a clearly disclosed software fallback cost.

The Export workspace should show the selected container, codec, color depth, chroma format, estimated final bitrate, and estimated file-size range before rendering.
