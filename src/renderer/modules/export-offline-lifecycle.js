(() => {
  'use strict';

  function create(options = {}) {
    const sessionEngine = options.sessionEngine;
    const finishOfflineExport = options.finishOfflineExport;
    const abortOfflineExport = options.abortOfflineExport;
    if (!sessionEngine || typeof sessionEngine.begin !== 'function') {
      throw new TypeError('Offline export lifecycle requires an export session engine.');
    }
    if (typeof finishOfflineExport !== 'function' || typeof abortOfflineExport !== 'function') {
      throw new TypeError('Offline export lifecycle requires finish and abort operations.');
    }

    function abortError(message = 'Offline export cancelled.') {
      if (typeof DOMException === 'function') return new DOMException(message, 'AbortError');
      const error = new Error(message);
      error.name = 'AbortError';
      return error;
    }

    async function run(config = {}) {
      let context = null;
      let session = null;
      let renderResult = null;
      let result = null;
      let renderedFrameCount = 0;
      let completed = false;
      let declined = false;
      let cancelled = false;
      let failure = null;

      try {
        context = await config.prepare?.();
        session = await config.beginSession?.(context);
        if (!session) {
          declined = true;
          await config.onDeclined?.({ context });
          return Object.freeze({ status: 'declined', renderedFrameCount: 0, result: null });
        }

        sessionEngine.begin(session, 'offline');
        await config.activate?.({ context, session });
        renderResult = await config.render?.({ context, session });
        renderedFrameCount = Math.max(0, Math.round(Number(renderResult?.renderedFrameCount) || 0));
        if (sessionEngine.cancelRequested) throw abortError();

        await config.beforeFinalize?.({ context, session, renderResult, renderedFrameCount });
        result = await finishOfflineExport(session.id, {
          allowPartial: Boolean(sessionEngine.finishRequested),
          renderedFrameCount
        });
        completed = true;
        sessionEngine.markCompleted?.();
        await config.complete?.({ context, session, renderResult, renderedFrameCount, result });
        sessionEngine.clear();
        return Object.freeze({ status: 'completed', renderedFrameCount, result });
      } catch (error) {
        failure = error;
        cancelled = error?.name === 'AbortError' || Boolean(sessionEngine.cancelRequested);
        if (session?.id && !completed) await abortOfflineExport(session.id).catch(() => {});
        sessionEngine.clear();
        if (cancelled) {
          await config.cancelled?.({ context, session, renderResult, renderedFrameCount, error });
          return Object.freeze({ status: 'cancelled', renderedFrameCount, result: null });
        }
        await config.failed?.({ context, session, renderResult, renderedFrameCount, error, completed });
        throw error;
      } finally {
        sessionEngine.resetRequests();
        await config.restore?.({
          context,
          session,
          renderResult,
          renderedFrameCount,
          result,
          completed,
          declined,
          cancelled,
          error: failure
        });
      }
    }

    async function selfTest() {
      function sessionHarness(events) {
        return {
          cancelRequested: false,
          finishRequested: false,
          begin(session, mode) { this.session = session; events.push(`begin:${mode}`); },
          markCompleted() { events.push('marked'); },
          clear() { this.session = null; events.push('clear'); },
          resetRequests() { this.cancelRequested = false; this.finishRequested = false; events.push('reset'); }
        };
      }

      const normalEvents = [];
      const normalSession = sessionHarness(normalEvents);
      const normal = create({
        sessionEngine: normalSession,
        finishOfflineExport: async (id, details) => {
          normalEvents.push(`finish:${id}:${details.renderedFrameCount}`);
          return { outputPath: 'smoke.mp4' };
        },
        abortOfflineExport: async () => normalEvents.push('abort')
      });
      const normalResult = await normal.run({
        prepare: async () => { normalEvents.push('prepare'); return { ready: true }; },
        beginSession: async () => { normalEvents.push('session'); return { id: 'normal' }; },
        activate: async () => normalEvents.push('activate'),
        render: async () => { normalEvents.push('render'); return { renderedFrameCount: 3 }; },
        beforeFinalize: async () => normalEvents.push('before-finalize'),
        complete: async () => normalEvents.push('complete'),
        restore: async ({ completed }) => normalEvents.push(`restore:${completed}`)
      });

      const cancelEvents = [];
      const cancelSession = sessionHarness(cancelEvents);
      const cancel = create({
        sessionEngine: cancelSession,
        finishOfflineExport: async () => { throw new Error('Finish must not run after cancellation.'); },
        abortOfflineExport: async () => cancelEvents.push('abort')
      });
      const cancelResult = await cancel.run({
        prepare: async () => ({}),
        beginSession: async () => ({ id: 'cancel' }),
        render: async () => {
          cancelSession.cancelRequested = true;
          return { renderedFrameCount: 1 };
        },
        cancelled: async () => cancelEvents.push('cancelled'),
        restore: async () => cancelEvents.push('restore')
      });

      const declineEvents = [];
      const declineSession = sessionHarness(declineEvents);
      const decline = create({
        sessionEngine: declineSession,
        finishOfflineExport: async () => ({}),
        abortOfflineExport: async () => declineEvents.push('abort')
      });
      const declineResult = await decline.run({
        prepare: async () => ({}),
        beginSession: async () => null,
        onDeclined: async () => declineEvents.push('declined'),
        restore: async ({ declined }) => declineEvents.push(`restore:${declined}`)
      });

      const failureEvents = [];
      const failureSession = sessionHarness(failureEvents);
      const failure = create({
        sessionEngine: failureSession,
        finishOfflineExport: async () => { throw new Error('Finish must not run after render failure.'); },
        abortOfflineExport: async () => failureEvents.push('abort')
      });
      let failureRethrown = false;
      try {
        await failure.run({
          prepare: async () => ({}),
          beginSession: async () => ({ id: 'failure' }),
          render: async () => { throw new Error('Expected lifecycle failure'); },
          failed: async () => failureEvents.push('failed'),
          restore: async ({ completed }) => failureEvents.push(`restore:${completed}`)
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected lifecycle failure';
      }

      return normalResult.status === 'completed'
        && normalResult.renderedFrameCount === 3
        && normalEvents.join('|') === 'prepare|session|begin:offline|activate|render|before-finalize|finish:normal:3|marked|complete|clear|reset|restore:true'
        && cancelResult.status === 'cancelled'
        && cancelEvents.includes('abort')
        && cancelEvents.includes('cancelled')
        && cancelEvents.at(-1) === 'restore'
        && declineResult.status === 'declined'
        && declineEvents.join('|') === 'declined|reset|restore:true'
        && failureRethrown
        && failureEvents.includes('abort')
        && failureEvents.includes('failed')
        && failureEvents.at(-1) === 'restore:false';
    }

    return Object.freeze({
      run,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportOfflineLifecycle = Object.freeze({ create });
})();
