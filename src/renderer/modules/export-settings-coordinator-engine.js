(() => {
  'use strict';

  function create(options = {}) {
    const advisor = options.advisorEngine;
    if (!advisor || typeof advisor.apply !== 'function') {
      throw new TypeError('Export settings coordinator requires the Export Advisor Engine.');
    }

    async function invoke(operation, ...args) {
      if (typeof operation === 'function') return operation(...args);
      return undefined;
    }

    async function change(kind, payload = {}, config = {}) {
      const normalizedKind = String(kind || '');
      const validKinds = new Set([
        'resolution', 'iterations', 'fps', 'mode', 'detail', 'supersampling',
        'format', 'hdr', 'audio', 'visual', 'unleashed', 'initialize'
      ]);
      if (!validKinds.has(normalizedKind)) throw new RangeError(`Unknown export settings change: ${normalizedKind || 'empty'}`);
      const steps = [];
      const run = async (name, operation, ...args) => {
        if (typeof operation !== 'function') return undefined;
        const result = await invoke(operation, ...args);
        steps.push(name);
        return result;
      };
      try {
        if (normalizedKind === 'resolution') {
          await run('recommend', config.recommendIterations, { announce: Boolean(payload.announce) });
        } else if (normalizedKind === 'iterations') {
          await run('sync-iterations', config.syncIterations, payload.value);
        } else if (normalizedKind === 'supersampling') {
          await run('sync-supersampling', config.syncSupersampling, Boolean(payload.checked));
        }

        if (normalizedKind === 'format' || normalizedKind === 'initialize') {
          await run('hdr-availability', config.updateHdrAvailability);
        }

        if (normalizedKind !== 'visual') {
          await run('performance', config.refreshPerformance);
        }

        if (['resolution', 'iterations', 'fps', 'supersampling', 'format', 'hdr', 'visual'].includes(normalizedKind)) {
          await run('invalidate-benchmark', config.invalidateBenchmark);
        }

        if (normalizedKind === 'format' || (normalizedKind === 'initialize' && payload.refreshEncoder !== false)) {
          await run('refresh-encoder', config.refreshEncoder);
        }

        return Object.freeze({ status: 'completed', kind: normalizedKind, steps: Object.freeze(steps) });
      } catch (error) {
        await config.failed?.({ kind: normalizedKind, error, steps: Object.freeze(steps) });
        throw error;
      }
    }

    async function applyAdvisor(selection, config = {}) {
      const choices = await invoke(config.readChoices) || {};
      return advisor.apply(selection, {
        allowedResolutions: choices.resolutions || [],
        allowedFrameRates: choices.frameRates || [],
        applySettings: (recommendation) => invoke(config.applySettings, recommendation),
        completed: async ({ recommendation, applied }) => {
          await invoke(config.syncIterations, recommendation.iterations);
          await invoke(config.refreshPerformance);
          await invoke(config.invalidateBenchmark);
          await config.completed?.({ recommendation, applied });
        },
        failed: config.failed
      });
    }

    async function selfTest() {
      const testAdvisor = {
        apply: async (selection, config) => {
          const recommendation = { ...selection, label: selection.label || 'Test' };
          const applied = await config.applySettings(recommendation);
          await config.completed({ recommendation, applied });
          return { status: 'applied', recommendation };
        }
      };
      const engine = create({ advisorEngine: testAdvisor });
      const events = [];
      const format = await engine.change('format', {}, {
        updateHdrAvailability: () => events.push('hdr'),
        refreshPerformance: () => events.push('performance'),
        invalidateBenchmark: () => events.push('invalidate'),
        refreshEncoder: () => events.push('encoder')
      });
      const resolution = await engine.change('resolution', { announce: true }, {
        recommendIterations: ({ announce }) => events.push(`recommend:${announce}`),
        refreshPerformance: () => events.push('performance-2'),
        invalidateBenchmark: () => events.push('invalidate-2')
      });
      const applied = await engine.applyAdvisor({ resolution: '1920x1080', fps: 60, iterations: 600 }, {
        readChoices: () => ({ resolutions: ['1920x1080'], frameRates: [60] }),
        applySettings: () => { events.push('apply'); return { resolution: '1920x1080' }; },
        syncIterations: (value) => events.push(`sync:${value}`),
        refreshPerformance: () => events.push('performance-3'),
        invalidateBenchmark: () => events.push('invalidate-3'),
        completed: () => events.push('completed')
      });
      return format.steps.join('|') === 'hdr-availability|performance|invalidate-benchmark|refresh-encoder'
        && resolution.steps.join('|') === 'recommend|performance|invalidate-benchmark'
        && applied.status === 'applied'
        && events.join('|') === 'hdr|performance|invalidate|encoder|recommend:true|performance-2|invalidate-2|apply|sync:600|performance-3|invalidate-3|completed';
    }

    return Object.freeze({
      applyAdvisor,
      change,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportSettingsCoordinatorEngine = Object.freeze({ create });
})();
