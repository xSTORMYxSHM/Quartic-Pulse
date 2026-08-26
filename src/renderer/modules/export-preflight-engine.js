(() => {
  'use strict';

  function create(options = {}) {
    const encoder = options.encoderEngine;
    const sampling = options.samplingEngine;
    if (!encoder || typeof encoder.offlineVideoBitrate !== 'function') {
      throw new TypeError('Export preflight requires the Export Encoder Engine.');
    }
    if (!sampling || typeof sampling.effectiveIterations !== 'function') {
      throw new TypeError('Export preflight requires the Export Sampling Engine.');
    }

    function build(settings = {}) {
      const resolution = String(settings.resolution || '');
      const [parsedWidth, parsedHeight] = resolution.split('x').map(Number);
      const width = Math.round(Number(settings.width) || parsedWidth || 0);
      const height = Math.round(Number(settings.height) || parsedHeight || 0);
      const fps = Number(settings.fps);
      const detail = Number(settings.detail);
      if (width < 1 || height < 1 || !Number.isFinite(fps) || fps <= 0 || !Number.isFinite(detail) || detail <= 0) {
        throw new RangeError('Export preflight requires a valid resolution, frame rate, and detail level.');
      }
      const duration = Math.max(.1, Number(settings.durationOverride) || Number(settings.audioDuration) || 0);
      const matchLive = Boolean(settings.matchLive);
      const iterationSource = matchLive ? settings.effectiveIterations : settings.requestedIterations;
      const iterations = sampling.effectiveIterations(iterationSource, {
        unleashed: Boolean(settings.unleashed),
        minimum: matchLive ? 1 : 240
      });
      const masterBitrate = encoder.offlineVideoBitrate(width, height, fps, detail);
      const context = Object.freeze({
        width,
        height,
        fps,
        detail,
        iterations,
        mode: 'offline',
        duration,
        masterBitrate,
        format: String(settings.format || ''),
        hdrOutput: Boolean(settings.hdrOutput),
        samplingMode: sampling.normalizeMode(settings.samplingMode, settings.supersampling),
        samplingSamples: sampling.sampleCount(settings.samplingMode, settings.supersampling),
        supersampling: Boolean(settings.supersampling),
        matchLive,
        refreshEncoder: Boolean(settings.refreshEncoder)
      });
      const request = Object.freeze({
        width: context.width,
        height: context.height,
        fps: context.fps,
        detail: context.detail,
        mode: context.mode,
        duration: context.duration,
        masterBitrate: context.masterBitrate,
        format: context.format,
        hdrOutput: context.hdrOutput,
        samplingMode: context.samplingMode,
        samplingSamples: context.samplingSamples,
        supersampling: context.supersampling,
        matchLive: context.matchLive,
        refreshEncoder: context.refreshEncoder
      });
      return Object.freeze({ context, request });
    }

    async function load(settings = {}, requestPreflight) {
      if (typeof requestPreflight !== 'function') {
        throw new TypeError('Export preflight requires a desktop request operation.');
      }
      const prepared = build(settings);
      const result = await requestPreflight(prepared.request);
      if (!result || typeof result !== 'object') {
        throw new TypeError('Export preflight returned an invalid result.');
      }
      return Object.freeze({ ...result, ...prepared.context });
    }

    async function refresh(config = {}) {
      if (typeof config.requestPreflight !== 'function') {
        throw new TypeError('Encoder status refresh requires a desktop preflight operation.');
      }
      try {
        await config.started?.();
        const preflight = await load(config.settings, config.requestPreflight);
        await config.completed?.({ preflight });
        return Object.freeze({ status: 'completed', preflight });
      } catch (error) {
        await config.failed?.({ error });
        return Object.freeze({ status: 'failed', error });
      }
    }

    async function selfTest() {
      const prepared = build({
        resolution: '1920x1080',
        fps: 60,
        detail: 1.6,
        requestedIterations: 620,
        audioDuration: 120,
        durationOverride: 5,
        format: 'gpu_auto',
        hdrOutput: true,
        samplingMode: 'balanced',
        supersampling: true,
        refreshEncoder: true
      });
      const loaded = await load({
        resolution: '1280x720',
        fps: 30,
        detail: 1,
        requestedIterations: 400,
        audioDuration: 60,
        format: 'mp4_compatible'
      }, async (request) => ({ encoder: { id: 'smoke' }, echoedWidth: request.width }));
      const failureEvents = [];
      const failed = await refresh({
        settings: { resolution: '1920x1080', fps: 60, detail: 1.6, requestedIterations: 600 },
        started: async () => failureEvents.push('started'),
        requestPreflight: async () => { throw new Error('Expected preflight failure'); },
        failed: async ({ error }) => failureEvents.push(error.message)
      });
      return prepared.request.duration === 5
        && prepared.context.iterations === 620
        && prepared.request.hdrOutput
        && prepared.request.samplingMode === 'balanced'
        && prepared.request.samplingSamples === 2
        && prepared.request.supersampling
        && prepared.request.refreshEncoder
        && prepared.request.masterBitrate > 0
        && loaded.width === 1280
        && loaded.height === 720
        && loaded.echoedWidth === 1280
        && loaded.iterations === 400
        && failed.status === 'failed'
        && failureEvents.join('|') === 'started|Expected preflight failure';
    }

    return Object.freeze({
      build,
      load,
      refresh,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportPreflightEngine = Object.freeze({ create });
})();
