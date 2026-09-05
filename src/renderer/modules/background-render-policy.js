(() => {
  'use strict';

  function normalizeObsFps(value) {
    return Number(value) === 30 ? 30 : 60;
  }

  function evaluate(options = {}) {
    const isObsOutput = Boolean(options.isObsOutput);
    const backgrounded = !isObsOutput && Boolean(options.backgrounded);
    const obsOutputOpen = Boolean(options.obsOutputOpen);
    const keepMainVisualActive = Boolean(options.keepMainVisualActive || options.exporting || options.offlineExporting);
    const controlOnly = backgrounded && obsOutputOpen && !keepMainVisualActive;
    const targetFps = isObsOutput
      ? normalizeObsFps(options.obsSyncFps)
      : backgrounded && !keepMainVisualActive
        ? (obsOutputOpen ? normalizeObsFps(options.obsSyncFps) : 30)
        : 0;

    return Object.freeze({
      controlOnly,
      drawVisual: !controlOnly,
      collectPerformance: !controlOnly,
      updateInterface: !isObsOutput && (!backgrounded || keepMainVisualActive),
      targetFps
    });
  }

  window.QuarticBackgroundRenderPolicy = Object.freeze({ evaluate, normalizeObsFps });
})();
