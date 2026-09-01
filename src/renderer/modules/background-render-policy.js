(() => {
  'use strict';

  function normalizeObsFps(value) {
    return Number(value) === 30 ? 30 : 60;
  }

  function evaluate(options = {}) {
    const isObsOutput = Boolean(options.isObsOutput);
    const keepMainVisualActive = Boolean(options.keepMainVisualActive || options.exporting || options.offlineExporting);
    const controlOnly = !isObsOutput && Boolean(options.backgrounded) && !keepMainVisualActive;
    const targetFps = isObsOutput
      ? normalizeObsFps(options.obsSyncFps)
      : controlOnly ? (options.obsOutputOpen ? normalizeObsFps(options.obsSyncFps) : 30) : 0;

    return Object.freeze({
      controlOnly,
      drawVisual: !controlOnly,
      collectPerformance: !controlOnly,
      updateInterface: !isObsOutput && !controlOnly,
      targetFps
    });
  }

  window.QuarticBackgroundRenderPolicy = Object.freeze({ evaluate, normalizeObsFps });
})();
