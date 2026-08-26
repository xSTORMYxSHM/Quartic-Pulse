(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const profiles = options.profiles;
    if (!profiles?.profiles || typeof profiles.normalizeProfileId !== 'function') {
      throw new TypeError('The Export Planning Engine requires the shared export profile catalog.');
    }

    function formatBitrate(bitsPerSecond) {
      const value = Math.max(0, Number(bitsPerSecond) || 0);
      if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)} Gb/s`;
      return `${(value / 1000000).toFixed(value >= 100000000 ? 0 : 1)} Mb/s`;
    }

    function formatByteSize(bytes) {
      const value = Math.max(0, Number(bytes) || 0);
      if (value >= 1073741824) return `${(value / 1073741824).toFixed(value >= 10737418240 ? 1 : 2)} GB`;
      if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
      return `${Math.round(value / 1024)} KB`;
    }

    function formatByteRange(range) {
      if (!range) return 'Unknown';
      return `${formatByteSize(range.minimum)}–${formatByteSize(range.maximum)}`;
    }

    function profileEstimate(settings = {}) {
      const width = Math.max(1, Number(settings.width) || 1920);
      const height = Math.max(1, Number(settings.height) || 1080);
      const fps = Math.max(1, Number(settings.fps) || 60);
      const duration = Math.max(0, Number(settings.duration) || 0);
      const profileId = profiles.normalizeProfileId(settings.profileId);
      const profile = profiles.profiles[profileId];
      const hdrOutput = profileId === 'youtube_hdr' && Boolean(settings.hdrOutput);
      const bitrate = profiles.bitrateRange(profileId, width, height, fps);
      const size = profiles.estimatedSizeRange(profileId, width, height, fps, duration || 60);
      const load = width * height * fps;
      const loadLevel = load >= 3840 * 2160 * 90 ? 'extreme' : load >= 2560 * 1440 * 60 ? 'high' : 'normal';
      return Object.freeze({
        width,
        height,
        fps,
        duration,
        profileId,
        profile,
        hdrOutput,
        bitrate,
        size,
        load,
        loadLevel,
        colorDescription: hdrOutput ? '10-bit Rec.2020 HLG' : `${profile.colorDepth} ${profile.chroma} BT.709`
      });
    }

    function modeledRenderFps(settings = {}) {
      const liveFps = Math.max(.01, Number(settings.liveFps) || .01);
      const livePixels = Math.max(1, Number(settings.livePixels) || 1);
      const exportPixels = Math.max(1, Number(settings.width) || 1) * Math.max(1, Number(settings.height) || 1);
      const resolutionFactor = clamp(livePixels / exportPixels, .02, 8);
      const visualStyle = Number(settings.visualStyle) || 0;
      let detailFactor = 1;
      if (visualStyle === 0) {
        detailFactor = clamp(
          Math.max(80, Number(settings.liveIterations) || 80) / Math.max(80, Number(settings.exportIterations) || 80),
          .04,
          2
        );
      } else if (visualStyle === 5) detailFactor = .58;
      else if (visualStyle === 6) detailFactor = .76;
      const samplingSamples = Math.max(1, Math.round(Number(settings.samplingSamples)
        || (settings.supersampling ? 4 : 1)));
      detailFactor /= samplingSamples;
      return clamp(liveFps * resolutionFactor * detailFactor * .82, .05, 500);
    }

    function interpretBenchmark(settings = {}) {
      const renderFps = Math.max(.01, Number(settings.renderFps) || .01);
      const encoderFps = Math.max(.01, Number(settings.encoderFps) || .01);
      const targetFps = Math.max(1, Number(settings.targetFps) || 60);
      const effectiveEncoderFps = encoderFps * .9;
      const completedFps = Math.max(.01, Math.min(renderFps, effectiveEncoderFps));
      const realtimeRatio = completedFps / targetFps;
      const secondsPerSongMinute = 60 / Math.max(.001, realtimeRatio);
      return Object.freeze({
        renderFps,
        encoderFps,
        effectiveEncoderFps,
        completedFps,
        realtimeRatio,
        secondsPerSongMinute,
        bottleneck: renderFps <= effectiveEncoderFps ? 'FRACTAL GPU' : 'ENCODER',
        rating: realtimeRatio >= 1
          ? 'Real-time headroom'
          : realtimeRatio >= .5 ? 'Fast offline'
            : realtimeRatio >= .2 ? 'Quality offline'
              : 'Heavy offline'
      });
    }

    function advisorCandidate(reference, settings = {}) {
      const referencePixels = Math.max(1, Number(reference.width) * Number(reference.height));
      const width = Math.max(1, Number(settings.width) || 1);
      const height = Math.max(1, Number(settings.height) || 1);
      const candidatePixels = width * height;
      const encoderFps = clamp(
        Math.max(.01, Number(reference.encodedFps) || .01) * referencePixels / candidatePixels,
        .01,
        Math.max(.01, Number(reference.encodedFps) || .01) * 6
      );
      const renderFps = modeledRenderFps({ ...settings, width, height });
      const completedFps = Math.max(.01, Math.min(renderFps, encoderFps * .9));
      const fps = Math.max(1, Number(settings.fps) || 60);
      return {
        width,
        height,
        fps,
        iterations: settings.exportIterations,
        encoderFps,
        renderFps,
        completedFps,
        secondsPerSongMinute: 60 * fps / completedFps
      };
    }

    function advisorRecommendations(settings = {}) {
      if (typeof settings.recommendedIterations !== 'function') {
        throw new TypeError('Advisor recommendations require an iteration recommendation function.');
      }
      const maximumIterations = settings.unleashed ? 2400 : 1200;
      const goals = [
        { id: 'fast', label: 'FASTER TURNAROUND', limit: 120, iterationScale: 1 },
        { id: 'balanced', label: 'BALANCED MASTER', limit: 300, iterationScale: 1.08 },
        { id: 'maximum', label: 'MAXIMUM DETAIL', limit: 600, iterationScale: 1.35 }
      ];
      return goals.map((goal) => {
        const candidates = [];
        for (const resolution of settings.resolutions || []) {
          const floor = settings.recommendedIterations(resolution.width, resolution.height);
          const desired = goal.id === 'fast'
            ? floor
            : goal.id === 'balanced'
              ? Math.max(floor, settings.currentIterations)
              : Math.max(settings.currentIterations, floor * goal.iterationScale);
          const exportIterations = Math.min(maximumIterations, Math.max(240, Math.round(desired / 20) * 20));
          for (const fps of settings.frameRates || []) {
            const candidate = advisorCandidate(settings.reference, {
              ...settings.liveContext,
              width: resolution.width,
              height: resolution.height,
              fps,
              exportIterations
            });
            const iterationQuality = Math.pow(exportIterations / Math.max(1, floor), .32);
            candidate.qualityScore = resolution.width * resolution.height * (1 + fps / 360) * iterationQuality;
            candidates.push(candidate);
          }
        }
        if (!candidates.length) throw new RangeError('Advisor recommendations require resolutions and frame rates.');
        const eligible = candidates.filter((candidate) => candidate.secondsPerSongMinute <= goal.limit);
        const chosen = eligible.length
          ? eligible.sort((a, b) => b.qualityScore - a.qualityScore)[0]
          : candidates.sort((a, b) => a.secondsPerSongMinute - b.secondsPerSongMinute)[0];
        return { ...chosen, goalId: goal.id, goalLabel: goal.label, targetSeconds: goal.limit };
      });
    }

    function selfTest() {
      const estimate = profileEstimate({ profileId: 'gpu_auto', width: 1920, height: 1080, fps: 60, duration: 60 });
      const renderFps = modeledRenderFps({
        liveFps: 60,
        livePixels: 1920 * 1080,
        width: 1920,
        height: 1080,
        visualStyle: 0,
        liveIterations: 300,
        exportIterations: 600,
        supersampling: false
      });
      const benchmark = interpretBenchmark({ renderFps: 20, encoderFps: 40, targetFps: 60 });
      return estimate.profile.id === 'gpu_auto'
        && estimate.loadLevel === 'normal'
        && Math.abs(renderFps - 24.6) < .001
        && benchmark.bottleneck === 'FRACTAL GPU'
        && benchmark.rating === 'Quality offline'
        && formatBitrate(90000000) === '90.0 Mb/s';
    }

    return Object.freeze({
      formatBitrate,
      formatByteSize,
      formatByteRange,
      profileEstimate,
      modeledRenderFps,
      interpretBenchmark,
      advisorCandidate,
      advisorRecommendations,
      selfTest,
      diagnostics: Object.freeze({ ready: true, goals: 3 })
    });
  }

  window.QuarticExportPlanningEngine = Object.freeze({ create });
})();
