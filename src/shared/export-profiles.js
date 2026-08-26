(function exposeQuarticExportProfiles(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.QuarticExportProfiles = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const profiles = Object.freeze({
    gpu_auto: Object.freeze({
      id: 'gpu_auto',
      label: 'Automatic GPU Master · AV1 / HEVC / MP4',
      name: 'Automatic GPU upload master (AV1 or HEVC Main 10)',
      extension: 'mp4',
      container: 'MP4',
      videoCodec: 'Automatic AV1 or HEVC Main 10',
      colorDepth: '10-bit',
      chroma: '4:2:0',
      audioCodec: 'AAC 320 kb/s',
      bitrateKind: 'youtube',
      summary: 'Recommended upload master: hardware AV1 when available, otherwise hardware HEVC Main 10, with CPU HEVC as the universal fallback.'
    }),
    youtube_hdr: Object.freeze({
      id: 'youtube_hdr',
      label: 'YouTube Fractal Master · HEVC Main 10 / MP4',
      name: 'YouTube fractal master (HEVC Main 10)',
      extension: 'mp4',
      container: 'MP4',
      videoCodec: 'HEVC / H.265 Main 10',
      colorDepth: '10-bit',
      chroma: '4:2:0',
      audioCodec: 'AAC 320 kb/s',
      bitrateKind: 'youtube',
      summary: 'High-detail YouTube upload master with optional Rec.2020 HLG HDR.'
    }),
    mp4_compatible: Object.freeze({
      id: 'mp4_compatible',
      label: 'Compatible MP4 · H.264 / AAC',
      name: 'Compatible MP4 (H.264 and AAC)',
      extension: 'mp4',
      container: 'MP4',
      videoCodec: 'H.264 High Profile',
      colorDepth: '8-bit',
      chroma: '4:2:0',
      audioCodec: 'AAC 320 kb/s',
      bitrateKind: 'h264',
      summary: 'High-quality SDR file for broad playback, sharing, and editing compatibility.'
    }),
    webm_quality: Object.freeze({
      id: 'webm_quality',
      label: 'Open Quality · VP9 / Opus / WebM',
      name: 'Open quality WebM (VP9 and Opus)',
      extension: 'webm',
      container: 'WebM',
      videoCodec: 'VP9 Profile 1',
      colorDepth: '8-bit',
      chroma: '4:4:4',
      audioCodec: 'Opus 256 kb/s',
      bitrateKind: 'vp9',
      summary: 'Open-format SDR master that preserves full chroma detail without an H.264 conversion.'
    }),
    av1_quality: Object.freeze({
      id: 'av1_quality',
      label: 'Advanced AV1 Master · 10-bit / Opus / WebM',
      name: 'Advanced AV1 upload master (10-bit AV1 and Opus)',
      extension: 'webm',
      container: 'WebM',
      videoCodec: 'AV1 Main 10',
      colorDepth: '10-bit',
      chroma: '4:2:0',
      audioCodec: 'Opus 256 kb/s',
      bitrateKind: 'av1',
      advanced: true,
      summary: 'High-efficiency 10-bit SDR upload master. Hardware AV1 is preferred; CPU fallback is exceptionally slow.'
    }),
    prores_422_hq: Object.freeze({
      id: 'prores_422_hq',
      label: 'Editing Master · ProRes 422 HQ / MOV',
      name: 'Editing master (ProRes 422 HQ)',
      extension: 'mov',
      container: 'MOV',
      videoCodec: 'Apple ProRes 422 HQ',
      colorDepth: '10-bit',
      chroma: '4:2:2',
      audioCodec: 'PCM 24-bit',
      bitrateKind: 'prores',
      summary: 'Fast-scrubbing intraframe master for nonlinear editors; large but editing-friendly.'
    }),
    png_sequence: Object.freeze({
      id: 'png_sequence',
      label: 'Recoverable Master · PNG Sequence + WAV / Folder',
      name: 'Recoverable PNG image sequence with WAV audio',
      extension: 'png',
      directory: true,
      container: 'Numbered PNG frames in a folder',
      videoCodec: 'PNG lossless',
      colorDepth: '8-bit',
      chroma: 'RGBA 4:4:4:4',
      audioCodec: 'PCM 24-bit WAV',
      bitrateKind: 'png',
      summary: 'Interruption-safe lossless frames, matching WAV audio, and a sequence manifest for editing or later encoding.'
    }),
    utvideo: Object.freeze({
      id: 'utvideo',
      label: 'Playback Lossless · Ut Video RGB / FLAC / MKV',
      name: 'Lossless playback master (Ut Video RGB)',
      extension: 'mkv',
      container: 'Matroska MKV',
      videoCodec: 'Ut Video RGB',
      colorDepth: '8-bit',
      chroma: 'RGB 4:4:4',
      audioCodec: 'FLAC',
      bitrateKind: 'utvideo',
      summary: 'Exact RGB playback master with no quality loss and very high storage demand.'
    }),
    ffv1: Object.freeze({
      id: 'ffv1',
      label: 'Archive Lossless · FFV1 RGB / FLAC / MKV',
      name: 'Lossless archive master (FFV1 RGB)',
      extension: 'mkv',
      container: 'Matroska MKV',
      videoCodec: 'FFV1 Level 3',
      colorDepth: '8-bit',
      chroma: 'RGB 4:4:4',
      audioCodec: 'FLAC',
      bitrateKind: 'ffv1',
      summary: 'Archive-grade exact RGB master with checksummed lossless video and audio.'
    })
  });

  const orderedIds = Object.freeze(Object.keys(profiles));

  function normalizeProfileId(value) {
    return profiles[value] ? value : 'gpu_auto';
  }

  function bitrateRange(profileId, width, height, fps) {
    const profile = profiles[normalizeProfileId(profileId)];
    const pixelsPerSecond = Math.max(1, Number(width) || 1920) * Math.max(1, Number(height) || 1080) * Math.max(1, Number(fps) || 60);
    const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
    let center;
    let spread;
    switch (profile.bitrateKind) {
      case 'youtube': {
        center = clamp(pixelsPerSecond * 1.45, 90000000, 300000000);
        return Object.freeze({
          minimum: Math.round(center * .66),
          maximum: Math.round(Math.min(300000000, center * 1.66)),
          center: Math.round(center)
        });
      }
      case 'h264': center = clamp(pixelsPerSecond * .42, 18000000, 180000000); spread = .30; break;
      case 'vp9': center = clamp(pixelsPerSecond * .52, 22000000, 240000000); spread = .32; break;
      case 'av1': center = clamp(pixelsPerSecond * .35, 30000000, 240000000); spread = .30; break;
      case 'prores': center = pixelsPerSecond * 3.5; spread = .10; break;
      case 'png': center = pixelsPerSecond * 16; spread = .40; break;
      case 'utvideo': center = pixelsPerSecond * 19.8; spread = .18; break;
      default: center = pixelsPerSecond * 18.5; spread = .25; break;
    }
    return Object.freeze({
      minimum: Math.round(center * (1 - spread)),
      maximum: Math.round(center * (1 + spread)),
      center: Math.round(center)
    });
  }

  function estimatedSizeRange(profileId, width, height, fps, duration) {
    const bitrate = bitrateRange(profileId, width, height, fps);
    const seconds = Math.max(0, Number(duration) || 0);
    const audioBitsPerSecond = profiles[normalizeProfileId(profileId)].audioCodec.includes('PCM')
      ? 2304000
      : profiles[normalizeProfileId(profileId)].audioCodec.includes('FLAC') ? 1100000 : 320000;
    return Object.freeze({
      minimum: Math.ceil((bitrate.minimum + audioBitsPerSecond) * seconds / 8),
      maximum: Math.ceil((bitrate.maximum + audioBitsPerSecond) * seconds / 8),
      center: Math.ceil((bitrate.center + audioBitsPerSecond) * seconds / 8)
    });
  }

  return Object.freeze({ profiles, orderedIds, normalizeProfileId, bitrateRange, estimatedSizeRange });
});
