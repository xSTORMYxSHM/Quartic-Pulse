(() => {
  'use strict';

  function create() {
    async function run(config = {}) {
      if (typeof config.requestChoice !== 'function' || typeof config.startOffline !== 'function') {
        throw new TypeError('Export workflow requires preflight choice and offline-start operations.');
      }
      try {
        const choice = await config.requestChoice();
        if (!choice) {
          await config.declined?.();
          return Object.freeze({ status: 'declined', result: null });
        }
        const test = Boolean(choice.test);
        const startOptions = test
          ? {
              preflight: choice.preflight,
              durationLimit: Math.min(5, Math.max(.1, Number(choice.preflight?.duration) || 5)),
              test: true
            }
          : { preflight: choice.preflight };
        const result = await config.startOffline(startOptions);
        await config.started?.({ choice, startOptions, result });
        return Object.freeze({ status: test ? 'test' : 'full', result });
      } catch (error) {
        await config.failed?.(error);
        throw error;
      }
    }

    async function selfTest() {
      const testEvents = [];
      const testResult = await run({
        requestChoice: async () => ({ preflight: { duration: 12 }, test: true }),
        startOffline: async (options) => {
          testEvents.push(`start:${options.durationLimit}:${options.test}`);
          return { status: 'completed' };
        },
        started: async ({ startOptions }) => testEvents.push(`started:${startOptions.test}`)
      });

      const fullEvents = [];
      const fullResult = await run({
        requestChoice: async () => ({ preflight: { duration: 90 }, test: false }),
        startOffline: async (options) => {
          fullEvents.push(`start:${Object.hasOwn(options, 'durationLimit')}`);
          return { status: 'completed' };
        }
      });

      const declinedEvents = [];
      const declinedResult = await run({
        requestChoice: async () => null,
        startOffline: async () => { throw new Error('Declined workflow must not start.'); },
        declined: async () => declinedEvents.push('declined')
      });

      const failureEvents = [];
      let failureRethrown = false;
      try {
        await run({
          requestChoice: async () => ({ preflight: {}, test: false }),
          startOffline: async () => { throw new Error('Expected workflow failure'); },
          failed: async (error) => failureEvents.push(error.message)
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected workflow failure';
      }

      return testResult.status === 'test'
        && testEvents.join('|') === 'start:5:true|started:true'
        && fullResult.status === 'full'
        && fullEvents.join('|') === 'start:false'
        && declinedResult.status === 'declined'
        && declinedEvents.join('|') === 'declined'
        && failureRethrown
        && failureEvents.join('|') === 'Expected workflow failure';
    }

    return Object.freeze({
      run,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportWorkflowEngine = Object.freeze({ create });
})();
