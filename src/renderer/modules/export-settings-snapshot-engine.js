(() => {
  'use strict';

  function create(options = {}) {
    const profiles = options.profiles;
    const sampling = options.samplingEngine;
    if (!profiles?.profiles || typeof profiles.normalizeProfileId !== 'function') {
      throw new TypeError('Export settings snapshots require the export profile catalog.');
    }
    if (!sampling || typeof sampling.effectiveIterations !== 'function') {
      throw new TypeError('Export settings snapshots require the Export Sampling Engine.');
    }

    function positiveNumber(value, label) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${label} must be greater than zero.`);
      return number;
    }

    function parseResolution(value) {
      const match = String(value || '').trim().match(/^(\d+)x(\d+)$/i);
      if (!match) throw new RangeError('Export resolution must use WIDTHxHEIGHT format.');
      const width = Math.round(positiveNumber(match[1], 'Export width'));
      const height = Math.round(positiveNumber(match[2], 'Export height'));
      return Object.freeze({ value: `${width}x${height}`, width, height });
    }

    function capture(raw = {}, context = {}) {
      const resolution = parseResolution(raw.resolution);
      const fps = positiveNumber(raw.fps, 'Export frame rate');
      const detail = positiveNumber(raw.detail, 'Export detail');
      const requestedIterations = Math.round(positiveNumber(raw.requestedIterations, 'Export iterations'));
      const format = profiles.normalizeProfileId(raw.format);
      if (!profiles.profiles[format]) throw new RangeError(`Unsupported export format: ${raw.format || 'unknown'}`);
      const unleashed = Boolean(context.unleashed);
      const hdrOutput = Boolean(raw.hdrOutput);
      const hdrProfile = format === 'youtube_hdr' && hdrOutput;
      const snapshot = {
        resolution: resolution.value,
        width: resolution.width,
        height: resolution.height,
        fps,
        format,
        profile: profiles.profiles[format],
        detail,
        requestedIterations,
        effectiveIterations: sampling.effectiveIterations(requestedIterations, { unleashed }),
        supersampling: Boolean(raw.supersampling),
        hdrOutput,
        hdrProfile,
        tenBitProfile: hdrProfile || format === 'av1_quality' || format === 'gpu_auto',
        showPreview: Boolean(raw.showPreview),
        unleashed,
        audioDuration: Math.max(0, Number(context.audioDuration) || 0)
      };
      return Object.freeze(snapshot);
    }

    function preflight(snapshot, options = {}) {
      if (!snapshot?.resolution || !snapshot?.format) throw new TypeError('Export preflight requires a settings snapshot.');
      return Object.freeze({
        resolution: snapshot.resolution,
        fps: snapshot.fps,
        detail: snapshot.detail,
        requestedIterations: snapshot.requestedIterations,
        unleashed: snapshot.unleashed,
        audioDuration: snapshot.audioDuration,
        durationOverride: options.durationOverride ?? null,
        format: snapshot.format,
        hdrOutput: snapshot.hdrOutput,
        supersampling: snapshot.supersampling,
        refreshEncoder: Boolean(options.refreshEncoder)
      });
    }

    function selfTest() {
      const catalog = {
        profiles: { youtube_sdr: { label: 'YouTube SDR' }, youtube_hdr: { label: 'YouTube HDR' } },
        normalizeProfileId: (id) => id === 'youtube_hdr' ? id : 'youtube_sdr'
      };
      const engine = create({
        profiles: catalog,
        samplingEngine: { effectiveIterations: (value, { unleashed }) => unleashed ? value : Math.min(value, 1200) }
      });
      const snapshot = engine.capture({
        resolution: '3840x2160', fps: '60', format: 'youtube_hdr', detail: '1.6',
        requestedIterations: '1400', supersampling: true, hdrOutput: true, showPreview: true
      }, { unleashed: false, audioDuration: 90.5 });
      const request = engine.preflight(snapshot, { durationOverride: 5, refreshEncoder: true });
      let invalidRejected = false;
      try {
        engine.capture({ resolution: '4K', fps: 60, format: 'youtube_sdr', detail: 1, requestedIterations: 500 });
      } catch (error) {
        invalidRejected = /WIDTHxHEIGHT/.test(error?.message || '');
      }
      return snapshot.width === 3840
        && snapshot.height === 2160
        && snapshot.fps === 60
        && snapshot.effectiveIterations === 1200
        && snapshot.hdrProfile
        && snapshot.tenBitProfile
        && snapshot.supersampling
        && request.durationOverride === 5
        && request.refreshEncoder
        && invalidRejected;
    }

    return Object.freeze({
      capture,
      parseResolution,
      preflight,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportSettingsSnapshotEngine = Object.freeze({ create });
})();
