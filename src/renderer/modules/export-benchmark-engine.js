(() => {
  'use strict';

  function create(options = {}) {
    const planning = options.planningEngine;
    if (!planning || typeof planning.interpretBenchmark !== 'function') {
      throw new TypeError('Export benchmark workflow requires the Export Planning Engine.');
    }

    async function run(config = {}) {
      if (typeof config.prepare !== 'function' || typeof config.benchmarkEncoder !== 'function'
        || typeof config.estimateRenderFps !== 'function') {
        throw new TypeError('Export benchmark workflow requires prepare, encoder benchmark, and render estimate operations.');
      }
      let context = null;
      let result = null;
      let renderFps = 0;
      let benchmark = null;
      try {
        context = await config.prepare();
        await config.started?.({ context });
        result = await config.benchmarkEncoder(context);
        renderFps = Math.max(.01, Number(await config.estimateRenderFps(context, result)) || .01);
        if (result?.skipped) {
          await config.skipped?.({ context, result, renderFps });
          return Object.freeze({ status: 'skipped', context, result, renderFps, benchmark: null });
        }
        benchmark = planning.interpretBenchmark({
          renderFps,
          encoderFps: result.encodedFps,
          targetFps: context.fps
        });
        await config.completed?.({ context, result, renderFps, benchmark });
        return Object.freeze({ status: 'completed', context, result, renderFps, benchmark });
      } catch (error) {
        await config.failed?.({ context, result, renderFps, benchmark, error });
        throw error;
      } finally {
        await config.restored?.({ context, result, renderFps, benchmark });
      }
    }

    async function selfTest() {
      const completeEvents = [];
      const completed = await run({
        prepare: async () => ({ fps: 60 }),
        started: async () => completeEvents.push('started'),
        benchmarkEncoder: async () => ({ encodedFps: 90, encoder: { label: 'Smoke' } }),
        estimateRenderFps: async () => 45,
        completed: async ({ benchmark }) => completeEvents.push(`completed:${benchmark.bottleneck}`),
        restored: async () => completeEvents.push('restored')
      });

      const skipEvents = [];
      const skipped = await run({
        prepare: async () => ({ fps: 60 }),
        benchmarkEncoder: async () => ({ skipped: true, warning: 'Skip' }),
        estimateRenderFps: async () => 30,
        skipped: async () => skipEvents.push('skipped'),
        restored: async () => skipEvents.push('restored')
      });

      const failureEvents = [];
      let failureRethrown = false;
      try {
        await run({
          prepare: async () => ({ fps: 60 }),
          benchmarkEncoder: async () => { throw new Error('Expected benchmark failure'); },
          estimateRenderFps: async () => 30,
          failed: async ({ error }) => failureEvents.push(error.message),
          restored: async () => failureEvents.push('restored')
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected benchmark failure';
      }

      return completed.status === 'completed'
        && completed.benchmark.bottleneck === 'FRACTAL GPU'
        && completeEvents.join('|') === 'started|completed:FRACTAL GPU|restored'
        && skipped.status === 'skipped'
        && skipEvents.join('|') === 'skipped|restored'
        && failureRethrown
        && failureEvents.join('|') === 'Expected benchmark failure|restored';
    }

    return Object.freeze({
      run,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportBenchmarkEngine = Object.freeze({ create });
})();
