(() => {
  'use strict';

  function create() {
    function normalize(selection = {}, constraints = {}) {
      const resolution = String(selection.resolution || '');
      const match = /^(\d+)x(\d+)$/.exec(resolution);
      const fps = Number(selection.fps);
      const iterations = Math.round(Number(selection.iterations));
      const allowedResolutions = (constraints.allowedResolutions || []).map(String);
      const allowedFrameRates = (constraints.allowedFrameRates || []).map(Number);
      if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) {
        throw new RangeError('The Setting Advisor returned an invalid resolution.');
      }
      if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(iterations) || iterations < 1) {
        throw new RangeError('The Setting Advisor returned an invalid frame rate or iteration value.');
      }
      if (allowedResolutions.length && !allowedResolutions.includes(resolution)) {
        throw new RangeError('The recommended resolution is not available in this build.');
      }
      if (allowedFrameRates.length && !allowedFrameRates.includes(fps)) {
        throw new RangeError('The recommended frame rate is not available in this build.');
      }
      return Object.freeze({
        resolution,
        width: Number(match[1]),
        height: Number(match[2]),
        fps,
        iterations,
        label: String(selection.label || 'Recommended settings')
      });
    }

    async function apply(selection, config = {}) {
      if (typeof config.applySettings !== 'function') {
        throw new TypeError('Setting Advisor application requires an apply operation.');
      }
      try {
        const recommendation = normalize(selection, config);
        const applied = await config.applySettings(recommendation);
        await config.completed?.({ recommendation, applied });
        return Object.freeze({ status: 'applied', recommendation, applied });
      } catch (error) {
        await config.failed?.({ error });
        throw error;
      }
    }

    async function selfTest() {
      const events = [];
      const result = await apply({
        resolution: '1920x1080',
        fps: 60,
        iterations: 600,
        label: 'Balanced Master'
      }, {
        allowedResolutions: ['1280x720', '1920x1080'],
        allowedFrameRates: [30, 60],
        applySettings: async (recommendation) => {
          events.push(`apply:${recommendation.width}x${recommendation.height}`);
          return { iterations: recommendation.iterations };
        },
        completed: async ({ recommendation }) => events.push(`completed:${recommendation.label}`)
      });
      let invalidRejected = false;
      try {
        await apply({ resolution: '3840x2160', fps: 120, iterations: 1000 }, {
          allowedResolutions: ['1920x1080'],
          allowedFrameRates: [60],
          applySettings: async () => {}
        });
      } catch (error) {
        invalidRejected = error instanceof RangeError;
      }
      return result.status === 'applied'
        && result.recommendation.iterations === 600
        && events.join('|') === 'apply:1920x1080|completed:Balanced Master'
        && invalidRejected;
    }

    return Object.freeze({
      normalize,
      apply,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportAdvisorEngine = Object.freeze({ create });
})();
