(() => {
  'use strict';

  function create(options = {}) {
    const now = options.now || (() => performance.now());
    const scheduleInterval = options.setInterval || ((callback, delay) => setInterval(callback, delay));
    const cancelInterval = options.clearInterval || ((id) => clearInterval(id));
    const scheduleTimeout = options.setTimeout || ((callback, delay) => setTimeout(callback, delay));
    const cancelTimeout = options.clearTimeout || ((id) => clearTimeout(id));
    let activeJob = null;

    function durationSeconds(value) {
      const parsed = Number(value);
      return Math.max(5, Math.min(15, Number.isFinite(parsed) ? parsed : 10));
    }

    async function run(config = {}) {
      if (activeJob) throw new Error('A Quick Clip recording is already active.');
      if (typeof config.beginSession !== 'function' || typeof config.createCapture !== 'function'
        || typeof config.finalize !== 'function' || typeof config.abort !== 'function') {
        throw new TypeError('Quick Clip requires session, capture, finalize, and abort operations.');
      }

      const duration = durationSeconds(config.duration);
      const job = { duration, session: null, capture: null, cancelRequested: false };
      activeJob = job;
      let progressTimer = null;
      let stopTimer = null;
      let result = null;
      let completed = false;
      let declined = false;
      let cancelled = false;
      let failure = null;
      let aborted = false;

      const abortSession = async () => {
        if (!job.session?.id || aborted) return;
        aborted = true;
        await config.abort(job.session.id, job.session).catch(() => {});
      };

      try {
        job.session = await config.beginSession({ duration });
        if (!job.session) {
          declined = true;
          await config.declined?.({ duration });
          return Object.freeze({ status: 'declined', result: null, duration });
        }

        await config.prepare?.({ duration, session: job.session });
        job.capture = await config.createCapture({ duration, session: job.session });
        if (!job.capture || typeof job.capture.start !== 'function'
          || typeof job.capture.waitForStop !== 'function' || typeof job.capture.drain !== 'function') {
          throw new TypeError('Quick Clip capture is invalid.');
        }
        if (job.cancelRequested) {
          cancelled = true;
          await abortSession();
          await config.cancelled?.({ duration, session: job.session });
          return Object.freeze({ status: 'cancelled', result: null, duration });
        }

        await config.started?.({ duration, session: job.session });
        const startedAt = now();
        progressTimer = scheduleInterval(() => {
          const elapsedMilliseconds = Math.max(0, now() - startedAt);
          const progress = Math.max(0, Math.min(1, elapsedMilliseconds / (duration * 1000)));
          config.progress?.({ duration, elapsedMilliseconds, progress, session: job.session });
        }, Math.max(16, Number(config.progressInterval) || 100));

        job.capture.start(Math.max(100, Number(config.timeslice) || 1000));
        stopTimer = scheduleTimeout(() => {
          if (job.capture?.state !== 'inactive') job.capture?.stop?.();
        }, duration * 1000);
        await job.capture.waitForStop();
        cancelInterval(progressTimer);
        progressTimer = null;
        cancelTimeout(stopTimer);
        stopTimer = null;
        await job.capture.drain();

        if (job.cancelRequested) {
          cancelled = true;
          await abortSession();
          await config.cancelled?.({ duration, session: job.session });
          return Object.freeze({ status: 'cancelled', result: null, duration });
        }

        result = await config.finalize(job.session.id, job.session);
        completed = true;
        await config.completed?.({ duration, session: job.session, result });
        return Object.freeze({ status: 'completed', result, duration });
      } catch (error) {
        failure = error;
        job.capture?.stop?.();
        await abortSession();
        await config.failed?.({ duration, session: job.session, error });
        throw error;
      } finally {
        if (progressTimer !== null) cancelInterval(progressTimer);
        if (stopTimer !== null) cancelTimeout(stopTimer);
        await job.capture?.dispose?.();
        activeJob = null;
        await config.restored?.({
          duration,
          session: job.session,
          result,
          completed,
          declined,
          cancelled,
          error: failure
        });
      }
    }

    function requestCancel() {
      if (!activeJob) return false;
      activeJob.cancelRequested = true;
      activeJob.capture?.stop?.();
      return true;
    }

    async function selfTest() {
      let clock = 0;
      let timeoutId = 0;
      const timers = new Map();
      const engine = create({
        now: () => clock,
        setInterval: (callback) => { clock = 2500; callback(); return 1; },
        clearInterval: () => {},
        setTimeout: (callback) => { const id = ++timeoutId; timers.set(id, callback); callback(); return id; },
        clearTimeout: (id) => timers.delete(id)
      });
      const events = [];
      let captureState = 'inactive';
      const completed = await engine.run({
        duration: 5,
        beginSession: async () => { events.push('begin'); return { id: 'clip' }; },
        prepare: async () => events.push('prepare'),
        createCapture: async () => ({
          start: () => { captureState = 'recording'; events.push('start'); },
          stop: () => { captureState = 'inactive'; events.push('stop'); },
          waitForStop: async () => events.push('wait'),
          drain: async () => events.push('drain'),
          dispose: async () => events.push('dispose'),
          get state() { return captureState; }
        }),
        progress: ({ progress }) => events.push(`progress:${progress}`),
        started: async () => events.push('started'),
        finalize: async () => { events.push('finalize'); return { outputPath: 'clip.mp4' }; },
        completed: async () => events.push('completed'),
        abort: async () => events.push('abort'),
        restored: async () => events.push('restored')
      });

      const failureEvents = [];
      let failureRethrown = false;
      try {
        await engine.run({
          beginSession: async () => ({ id: 'failure' }),
          createCapture: async () => { throw new Error('Expected clip failure'); },
          finalize: async () => ({}),
          abort: async () => failureEvents.push('abort'),
          failed: async ({ error }) => failureEvents.push(error.message),
          restored: async () => failureEvents.push('restored')
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected clip failure';
      }

      return completed.status === 'completed'
        && completed.result.outputPath === 'clip.mp4'
        && events.join('|') === 'begin|prepare|started|progress:0.5|start|stop|wait|drain|finalize|completed|dispose|restored'
        && failureRethrown
        && failureEvents.join('|') === 'abort|Expected clip failure|restored'
        && durationSeconds(1) === 5
        && durationSeconds(30) === 15
        && !engine.diagnostics.active;
    }

    return Object.freeze({
      run,
      requestCancel,
      durationSeconds,
      selfTest,
      get diagnostics() {
        return Object.freeze({ ready: true, active: Boolean(activeJob), duration: activeJob?.duration || 0 });
      }
    });
  }

  window.QuarticExportQuickClipWorkflowEngine = Object.freeze({ create });
})();
