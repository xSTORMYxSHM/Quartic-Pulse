(() => {
  'use strict';

  function create(options = {}) {
    const history = options.historyEngine;
    const session = options.sessionEngine;
    if (!history || typeof history.record !== 'function' || typeof history.list !== 'function') {
      throw new TypeError('Export result workflow requires the Export History Engine.');
    }
    if (!session || typeof session.mode === 'undefined') {
      throw new TypeError('Export result workflow requires the Export Session Engine.');
    }
    let outputPath = '';

    function messageFor(result, mode) {
      if (result.warning) return String(result.warning);
      if (mode === 'recovered') return `Recovered export complete: ${result.outputPath}`;
      if (mode === 'live') return `Export complete: ${result.outputPath}`;
      return `${result.partial ? 'Shortened export' : 'Offline export'} complete: ${result.outputPath}`;
    }

    function reset(config = {}) {
      const previousPath = outputPath;
      outputPath = '';
      config.changed?.({ outputPath, previousPath });
      return Object.freeze({ status: 'reset', outputPath, previousPath });
    }

    async function complete(result = {}, config = {}) {
      const normalizedPath = typeof result.outputPath === 'string' ? result.outputPath.trim() : '';
      if (!normalizedPath) {
        const error = new TypeError('Completed export result is missing its output path.');
        await config.failed?.({ error, result });
        throw error;
      }
      const normalizedResult = { ...result, outputPath: normalizedPath };
      const details = { ...(config.details || {}) };
      const defaults = { ...(config.defaults || {}) };
      const mode = String(details.mode || defaults.mode || session.mode || 'offline');
      details.mode = mode;
      try {
        const entry = history.record(normalizedResult, details, defaults);
        if (!entry) throw new Error('Completed export could not be added to recent history.');
        outputPath = normalizedPath;
        await config.pathChanged?.({ outputPath, result: normalizedResult, entry });
        await config.historyChanged?.({ entry, entries: history.list(config.historyLimit ?? 12) });
        await config.progressCompleted?.({ outputPath, result: normalizedResult, entry });
        await config.presentCompleted?.({ outputPath, result: normalizedResult, entry });
        const notification = Object.freeze({
          message: messageFor(normalizedResult, mode),
          error: Boolean(normalizedResult.warning)
        });
        await config.notify?.(notification);
        await config.completed?.({ outputPath, result: normalizedResult, entry, notification });
        return Object.freeze({ status: 'completed', outputPath, result: normalizedResult, entry, notification });
      } catch (error) {
        await config.failed?.({ error, result: normalizedResult });
        throw error;
      }
    }

    async function reveal(config = {}) {
      if (!outputPath) {
        await config.empty?.();
        return Object.freeze({ status: 'empty', outputPath: '' });
      }
      if (typeof config.reveal !== 'function') {
        throw new TypeError('Completed export reveal operation is unavailable.');
      }
      try {
        const result = await config.reveal(outputPath);
        await config.completed?.({ outputPath, result });
        return Object.freeze({ status: 'revealed', outputPath, result });
      } catch (error) {
        await config.failed?.({ outputPath, error });
        throw error;
      }
    }

    async function selfTest() {
      const records = [];
      const testHistory = {
        record: (result, details, defaults) => {
          const entry = { id: `result-${records.length + 1}`, ...defaults, ...details, ...result };
          records.unshift(entry);
          return entry;
        },
        list: (limit) => records.slice(0, limit)
      };
      const engine = create({ historyEngine: testHistory, sessionEngine: { mode: 'offline' } });
      const events = [];
      const finished = await engine.complete({ outputPath: ' C:/Exports/final.mp4 ', sizeBytes: 100 }, {
        details: { width: 1920, height: 1080, fps: 60 },
        pathChanged: ({ outputPath: path }) => events.push(`path:${path}`),
        historyChanged: ({ entries }) => events.push(`history:${entries.length}`),
        progressCompleted: () => events.push('progress'),
        presentCompleted: () => events.push('present'),
        notify: ({ message, error }) => events.push(`notify:${error}:${message}`)
      });
      const revealed = await engine.reveal({ reveal: async (path) => events.push(`reveal:${path}`) });
      const resetResult = engine.reset();
      const emptyReveal = await engine.reveal();
      let rejectedMissingPath = false;
      try {
        await engine.complete({ sizeBytes: 1 });
      } catch (error) {
        rejectedMissingPath = /output path/.test(error?.message || '');
      }
      return finished.status === 'completed'
        && finished.outputPath === 'C:/Exports/final.mp4'
        && finished.entry.width === 1920
        && finished.notification.message === 'Offline export complete: C:/Exports/final.mp4'
        && revealed.status === 'revealed'
        && resetResult.previousPath === 'C:/Exports/final.mp4'
        && emptyReveal.status === 'empty'
        && rejectedMissingPath
        && events.join('|') === 'path:C:/Exports/final.mp4|history:1|progress|present|notify:false:Offline export complete: C:/Exports/final.mp4|reveal:C:/Exports/final.mp4';
    }

    return Object.freeze({
      complete,
      messageFor,
      reset,
      reveal,
      selfTest,
      get outputPath() { return outputPath; },
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportResultWorkflowEngine = Object.freeze({ create });
})();
