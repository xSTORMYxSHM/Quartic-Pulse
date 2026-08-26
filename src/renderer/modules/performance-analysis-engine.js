(() => {
  'use strict';

  function percentile(values, ratio) {
    if (!values.length) return 0;
    const ordered = [...values].sort((first, second) => first - second);
    return ordered[Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * ratio))];
  }

  function analyzeSamples(options = {}) {
    const samples = Array.from(options.samples || []).filter((value) => value > 0 && value < 100);
    const frameTime = Math.max(1, Number(options.frameTime) || 16.7);
    const currentIterations = Math.max(1, Number(options.iterations) || 220);
    const median = percentile(samples, .5) || frameTime;
    const p95 = percentile(samples, .95) || frameTime;
    const averageFps = 1000 / Math.max(1, median);
    let tier = 'strong';
    let iterations = Math.max(180, currentIterations);
    let disableHeavy = false;
    let detail = 'Live performance is healthy. Current visual settings have useful headroom.';
    if (p95 > 32 || averageFps < 38) {
      tier = 'limited';
      iterations = 150;
      disableHeavy = true;
      detail = 'Frame pacing is under heavy load. Use lighter live math and reserve dimensional effects for export.';
    } else if (p95 > 23 || averageFps < 50) {
      tier = 'average';
      iterations = 190;
      disableHeavy = Boolean(options.dimensional && options.folding);
      detail = 'The system is usable but close to its live limit. Adaptive scale and moderate iterations are recommended.';
    } else if (p95 > 18.5 || averageFps < 57) {
      tier = 'balanced';
      iterations = 220;
      detail = 'Performance is balanced. Keep adaptive scale on for complex songs and OBS sessions.';
    } else {
      iterations = Math.max(260, Math.min(360, currentIterations));
    }
    return Object.freeze({ tier, median, p95, averageFps, iterations, disableHeavy, detail });
  }

  function recommendHardwareMode(info = {}, rendererLabel = '') {
    const memoryGb = Number(info.totalMemoryBytes || 0) / 1073741824;
    const gpuText = `${rendererLabel} ${(info.gpuDevices || []).map((device) => `${device.vendorString} ${device.deviceString}`).join(' ')}`.toLowerCase();
    const discrete = /nvidia|geforce|radeon|amd/.test(gpuText);
    let score = 0;
    if (info.logicalProcessors >= 8) score += 1;
    if (info.logicalProcessors >= 16) score += 1;
    if (memoryGb >= 16) score += 1;
    if (memoryGb >= 32) score += 1;
    if (discrete) score += 2;
    if (Number(info.videoMemoryMb) >= 6144) score += 1;
    if (score <= 2) return 'efficient';
    if (score <= 4) return 'balanced';
    return 'performance';
  }

  window.QuarticPerformanceAnalysisEngine = Object.freeze({
    analyzeSamples,
    percentile,
    recommendHardwareMode
  });
})();
