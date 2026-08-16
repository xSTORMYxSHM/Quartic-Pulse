(() => {
  'use strict';

  function create(options = {}) {
    const sessionEngine = options.sessionEngine;
    const abortExport = options.abortExport;
    if (!sessionEngine || typeof sessionEngine.begin !== 'function') {
      throw new TypeError('Live export lifecycle requires an export session engine.');
    }
    if (typeof abortExport !== 'function') {
      throw new TypeError('Live export lifecycle requires an abort operation.');
    }

    let activeJob = null;
    let finishingPromise = null;

    async function restoreJob(job, details) {
      sessionEngine.clear();
      sessionEngine.resetRequests();
      activeJob = null;
      finishingPromise = null;
      await job?.config?.restore?.({
        context: job.context,
        session: job.session,
        ...details
      });
    }

    async function start(config = {}) {
      if (activeJob) throw new Error('A live export session is already active.');
      let context = null;
      let session = null;
      try {
        context = await config.prepare?.();
        session = await config.beginSession?.(context);
        if (!session) {
          await config.onDeclined?.({ context });
          sessionEngine.resetRequests();
          await config.restore?.({ context, session: null, completed: false, declined: true, cancelled: false, error: null });
          return Object.freeze({ status: 'declined', session: null });
        }

        sessionEngine.begin(session, 'live');
        activeJob = { config, context, session };
        await config.activate?.({ context, session });
        await config.record?.({ context, session });
        await config.started?.({ context, session });
        return Object.freeze({ status: 'recording', session });
      } catch (error) {
        if (session?.id) await abortExport(session.id).catch(() => {});
        const job = activeJob || { config, context, session };
        await config.failed?.({ context, session, error, completed: false });
        await restoreJob(job, { result: null, completed: false, declined: false, cancelled: false, error });
        throw error;
      }
    }

    async function finish() {
      if (!activeJob) return Object.freeze({ status: 'inactive', result: null });
      if (finishingPromise) return finishingPromise;
      const job = activeJob;
      finishingPromise = (async () => {
        let result = null;
        let completed = false;
        let cancelled = false;
        let failure = null;
        try {
          await job.config.beforeFinalize?.({ context: job.context, session: job.session });
          cancelled = Boolean(sessionEngine.cancelRequested);
          if (cancelled) {
            await abortExport(job.session.id).catch(() => {});
            await job.config.cancelled?.({ context: job.context, session: job.session });
            return Object.freeze({ status: 'cancelled', result: null });
          }
          if (typeof job.config.finalize !== 'function') {
            throw new TypeError('Live export lifecycle requires a finalize operation.');
          }
          result = await job.config.finalize({ context: job.context, session: job.session });
          completed = true;
          sessionEngine.markCompleted?.();
          await job.config.complete?.({ context: job.context, session: job.session, result });
          return Object.freeze({ status: 'completed', result });
        } catch (error) {
          failure = error;
          if (!completed) await abortExport(job.session.id).catch(() => {});
          await job.config.failed?.({ context: job.context, session: job.session, result, error, completed });
          throw error;
        } finally {
          await restoreJob(job, { result, completed, declined: false, cancelled, error: failure });
        }
      })();
      return finishingPromise;
    }

    function requestFinish() {
      if (!activeJob) return false;
      sessionEngine.requestFinish?.();
      activeJob.config.finishing?.({ context: activeJob.context, session: activeJob.session });
      return true;
    }

    function requestCancel() {
      if (!activeJob) return false;
      sessionEngine.requestCancel?.();
      activeJob.config.cancelling?.({ context: activeJob.context, session: activeJob.session });
      return true;
    }

    async function selfTest() {
      function sessionHarness(events) {
        return {
          cancelRequested: false,
          begin: (_session, mode) => events.push(`begin:${mode}`),
          requestFinish() { events.push('request-finish'); },
          requestCancel() { this.cancelRequested = true; events.push('request-cancel'); },
          markCompleted: () => events.push('marked'),
          clear: () => events.push('clear'),
          resetRequests() { this.cancelRequested = false; events.push('reset'); }
        };
      }

      const normalEvents = [];
      const normalSession = sessionHarness(normalEvents);
      const normal = create({
        sessionEngine: normalSession,
        abortExport: async () => normalEvents.push('abort')
      });
      const started = await normal.start({
        prepare: async () => { normalEvents.push('prepare'); return { ready: true }; },
        beginSession: async () => { normalEvents.push('session'); return { id: 'normal' }; },
        activate: async () => normalEvents.push('activate'),
        record: async () => normalEvents.push('record'),
        started: async () => normalEvents.push('started'),
        finishing: () => normalEvents.push('finishing'),
        beforeFinalize: async () => normalEvents.push('before-finalize'),
        finalize: async () => { normalEvents.push('finalize'); return { outputPath: 'live.webm' }; },
        complete: async () => normalEvents.push('complete'),
        restore: async ({ completed }) => normalEvents.push(`restore:${completed}`)
      });
      normal.requestFinish();
      const finished = await normal.finish();

      const cancelEvents = [];
      const cancelSession = sessionHarness(cancelEvents);
      const cancel = create({
        sessionEngine: cancelSession,
        abortExport: async () => cancelEvents.push('abort')
      });
      await cancel.start({
        beginSession: async () => ({ id: 'cancel' }),
        record: async () => cancelEvents.push('record'),
        cancelling: () => cancelEvents.push('cancelling'),
        beforeFinalize: async () => cancelEvents.push('before-finalize'),
        finalize: async () => { throw new Error('Finalize must not run after cancellation.'); },
        cancelled: async () => cancelEvents.push('cancelled'),
        restore: async ({ cancelled }) => cancelEvents.push(`restore:${cancelled}`)
      });
      cancel.requestCancel();
      const cancelled = await cancel.finish();

      const failureEvents = [];
      const failureSession = sessionHarness(failureEvents);
      const failure = create({
        sessionEngine: failureSession,
        abortExport: async () => failureEvents.push('abort')
      });
      let failureRethrown = false;
      try {
        await failure.start({
          beginSession: async () => ({ id: 'failure' }),
          record: async () => { throw new Error('Expected live start failure'); },
          failed: async () => failureEvents.push('failed'),
          restore: async ({ completed }) => failureEvents.push(`restore:${completed}`)
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected live start failure';
      }

      return started.status === 'recording'
        && finished.status === 'completed'
        && normalEvents.join('|') === 'prepare|session|begin:live|activate|record|started|request-finish|finishing|before-finalize|finalize|marked|complete|clear|reset|restore:true'
        && cancelled.status === 'cancelled'
        && cancelEvents.join('|') === 'begin:live|record|request-cancel|cancelling|before-finalize|abort|cancelled|clear|reset|restore:true'
        && failureRethrown
        && failureEvents.join('|') === 'begin:live|abort|failed|clear|reset|restore:false';
    }

    return Object.freeze({
      start,
      finish,
      requestFinish,
      requestCancel,
      selfTest,
      get diagnostics() {
        return Object.freeze({ ready: true, active: Boolean(activeJob), finishing: Boolean(finishingPromise) });
      }
    });
  }

  window.QuarticExportLiveLifecycle = Object.freeze({ create });
})();
