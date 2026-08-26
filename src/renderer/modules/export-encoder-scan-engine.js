(() => {
  'use strict';

  function create() {
    async function run(config = {}) {
      if (typeof config.scan !== 'function') {
        throw new TypeError('Encoder compatibility workflow requires a scan operation.');
      }
      let report = null;
      try {
        await config.started?.();
        report = await config.scan();
        if (!report || typeof report !== 'object') {
          throw new TypeError('Encoder compatibility scan returned an invalid report.');
        }
        await config.completed?.({ report });
        return Object.freeze({ status: 'completed', report });
      } catch (error) {
        await config.failed?.({ report, error });
        throw error;
      } finally {
        await config.restored?.({ report });
      }
    }

    async function selfTest() {
      const completeEvents = [];
      const completed = await run({
        started: async () => completeEvents.push('started'),
        scan: async () => ({ selected: { id: 'gpu' }, encoders: [{ id: 'gpu', available: true }] }),
        completed: async ({ report }) => completeEvents.push(`completed:${report.selected.id}`),
        restored: async () => completeEvents.push('restored')
      });

      const failureEvents = [];
      let failureRethrown = false;
      try {
        await run({
          scan: async () => { throw new Error('Expected encoder scan failure'); },
          failed: async ({ error }) => failureEvents.push(error.message),
          restored: async () => failureEvents.push('restored')
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected encoder scan failure';
      }

      let invalidRejected = false;
      try {
        await run({ scan: async () => null });
      } catch (error) {
        invalidRejected = error instanceof TypeError;
      }

      return completed.status === 'completed'
        && completed.report.selected.id === 'gpu'
        && completeEvents.join('|') === 'started|completed:gpu|restored'
        && failureRethrown
        && failureEvents.join('|') === 'Expected encoder scan failure|restored'
        && invalidRejected;
    }

    return Object.freeze({
      run,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportEncoderScanEngine = Object.freeze({ create });
})();
