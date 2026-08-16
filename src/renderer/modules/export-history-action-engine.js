(() => {
  'use strict';

  function create(options = {}) {
    const history = options.historyEngine;
    if (!history || typeof history.find !== 'function' || typeof history.clear !== 'function'
      || typeof history.list !== 'function' || typeof history.normalizeRecoveries !== 'function') {
      throw new TypeError('Export history actions require the Export History Engine.');
    }

    async function clear(config = {}) {
      if (!history.size) {
        await config.empty?.();
        return Object.freeze({ status: 'empty', entries: history.list() });
      }
      try {
        const confirmed = typeof config.confirm === 'function' ? await config.confirm() : true;
        if (!confirmed) {
          await config.declined?.();
          return Object.freeze({ status: 'declined', entries: history.list() });
        }
        history.clear();
        const entries = history.list();
        await config.completed?.({ entries });
        return Object.freeze({ status: 'cleared', entries });
      } catch (error) {
        await config.failed?.({ error });
        throw error;
      }
    }

    async function perform(action, id, config = {}) {
      const normalizedAction = String(action || '');
      if (normalizedAction !== 'open' && normalizedAction !== 'reveal') {
        throw new RangeError('Export history action must be open or reveal.');
      }
      const entry = history.find(String(id || ''));
      if (!entry) {
        await config.missing?.({ action: normalizedAction, id });
        return Object.freeze({ status: 'missing', action: normalizedAction, entry: null });
      }
      const operation = config[normalizedAction];
      if (typeof operation !== 'function') {
        throw new TypeError(`Export history ${normalizedAction} action is unavailable.`);
      }
      try {
        const result = await operation(entry.outputPath, entry);
        await config.completed?.({ action: normalizedAction, entry, result });
        return Object.freeze({ status: normalizedAction, action: normalizedAction, entry, result });
      } catch (error) {
        await config.failed?.({ action: normalizedAction, entry, error });
        throw error;
      }
    }

    async function refreshRecoveries(config = {}) {
      if (typeof config.load !== 'function') {
        throw new TypeError('Recoverable export refresh requires a desktop load operation.');
      }
      try {
        const raw = await config.load();
        const recoveries = history.normalizeRecoveries(raw);
        await config.completed?.({ recoveries });
        return Object.freeze({ status: 'completed', recoveries });
      } catch (error) {
        const recoveries = [];
        await config.failed?.({ error, recoveries });
        return Object.freeze({ status: 'failed', recoveries, error });
      }
    }

    async function selfTest() {
      const entries = new Map([['one', { id: 'one', outputPath: 'C:/Exports/one.mp4' }]]);
      const testHistory = {
        find: (id) => entries.get(id) || null,
        clear: () => entries.clear(),
        list: () => [...entries.values()],
        normalizeRecoveries: (items) => Array.isArray(items) ? items.filter((item) => item?.id && item?.outputPath) : [],
        get size() { return entries.size; }
      };
      const engine = create({ historyEngine: testHistory });
      const events = [];
      const opened = await engine.perform('open', 'one', {
        open: async (outputPath) => events.push(`open:${outputPath}`),
        completed: async ({ action }) => events.push(`completed:${action}`)
      });
      const missing = await engine.perform('reveal', 'missing', {
        reveal: async () => { throw new Error('Missing entry must not run.'); }
      });
      const refreshed = await engine.refreshRecoveries({
        load: async () => [{ id: 'recovery', outputPath: 'C:/Recovery/master.mkv' }]
      });
      const declined = await engine.clear({ confirm: async () => false });
      const cleared = await engine.clear({ confirm: async () => true });
      let failureRethrown = false;
      entries.set('failure', { id: 'failure', outputPath: 'C:/failure.mp4' });
      try {
        await engine.perform('open', 'failure', {
          open: async () => { throw new Error('Expected history action failure'); }
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected history action failure';
      }
      return opened.status === 'open'
        && events.join('|') === 'open:C:/Exports/one.mp4|completed:open'
        && missing.status === 'missing'
        && refreshed.recoveries.length === 1
        && declined.status === 'declined'
        && cleared.status === 'cleared'
        && cleared.entries.length === 0
        && failureRethrown;
    }

    return Object.freeze({
      clear,
      perform,
      refreshRecoveries,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportHistoryActionEngine = Object.freeze({ create });
})();
