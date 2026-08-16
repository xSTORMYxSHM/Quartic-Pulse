(() => {
  'use strict';

  function create(options = {}) {
    const session = options.sessionEngine;
    const progress = options.progressWorkflow;
    const live = options.liveLifecycle;
    if (!session || typeof session.requestFinish !== 'function' || typeof session.requestCancel !== 'function') {
      throw new TypeError('Export command coordinator requires the Export Session Engine.');
    }
    if (!progress || typeof progress.pause !== 'function' || typeof progress.resume !== 'function') {
      throw new TypeError('Export command coordinator requires the Export Progress Workflow Engine.');
    }
    if (!live || typeof live.requestFinish !== 'function' || typeof live.requestCancel !== 'function') {
      throw new TypeError('Export command coordinator requires the Live Export Lifecycle.');
    }

    function resumeOffline(config = {}) {
      return progress.resume({
        resumed: (timing) => config.resumed?.({
          timing,
          progress: session.progress,
          percent: Math.floor(session.progress * 100)
        })
      });
    }

    function togglePause(config = {}) {
      if (session.mode !== 'offline' || !config.offlineRendering || session.cancelRequested) {
        return Object.freeze({ status: 'ignored', reason: 'offline-render-inactive' });
      }
      if (session.paused) {
        const result = resumeOffline({ resumed: config.resumed });
        return Object.freeze({ status: 'resumed', timing: result.timing });
      }
      const result = progress.pause({ paused: config.paused });
      return Object.freeze({ status: 'paused', view: result.view, timing: result.timing });
    }

    function finish(config = {}) {
      if (session.mode === 'offline') {
        if (!config.offlineRendering) {
          return Object.freeze({ status: 'ignored', reason: 'offline-render-inactive' });
        }
        resumeOffline({ resumed: config.resumed });
        session.requestFinish();
        config.offlineFinishing?.({ session: session.session, progress: session.progress });
        return Object.freeze({ status: 'offline-finishing', session: session.session });
      }

      if (!config.liveCaptureActive?.()) {
        return Object.freeze({ status: 'ignored', reason: 'live-capture-inactive' });
      }
      if (!live.requestFinish()) {
        return Object.freeze({ status: 'ignored', reason: 'live-lifecycle-inactive' });
      }
      config.pauseAudio?.();
      config.stopLiveCapture?.();
      return Object.freeze({ status: 'live-finishing', session: session.session });
    }

    async function cancel(config = {}) {
      if (!config.exporting || !session.session) {
        return Object.freeze({ status: 'ignored', reason: 'export-inactive' });
      }
      const confirmed = await config.confirm?.();
      if (!confirmed) return Object.freeze({ status: 'declined' });

      config.cancelling?.({ mode: session.mode, session: session.session });
      if (session.mode === 'offline') {
        config.offlineCancelling?.({ session: session.session });
        resumeOffline({ resumed: config.resumed });
        session.requestCancel();
        if (!config.offlineRendering && typeof config.abortOffline === 'function') {
          await config.abortOffline(session.session.id).catch((error) => config.abortFailed?.(error));
        }
        return Object.freeze({ status: 'offline-cancelling', session: session.session });
      }

      if (!live.requestCancel()) {
        return Object.freeze({ status: 'ignored', reason: 'live-lifecycle-inactive' });
      }
      config.pauseAudio?.();
      if (config.liveCaptureActive?.()) config.stopLiveCapture?.();
      return Object.freeze({ status: 'live-cancelling', session: session.session });
    }

    async function selfTest() {
      const events = [];
      const testSession = {
        mode: 'offline',
        session: { id: 'offline' },
        progress: .42,
        paused: false,
        cancelRequested: false,
        requestFinish() { events.push('request-finish'); },
        requestCancel() { this.cancelRequested = true; events.push('request-cancel'); }
      };
      const testProgress = {
        pause(config) {
          testSession.paused = true;
          const view = { note: 'paused' };
          config.paused?.(view, { paused: true });
          events.push('pause');
          return { view, timing: { paused: true } };
        },
        resume(config) {
          testSession.paused = false;
          config.resumed?.({ paused: false });
          events.push('resume');
          return { timing: { paused: false } };
        }
      };
      const testLive = {
        requestFinish: () => { events.push('live-request-finish'); return true; },
        requestCancel: () => { events.push('live-request-cancel'); return true; }
      };
      const coordinator = create({ sessionEngine: testSession, progressWorkflow: testProgress, liveLifecycle: testLive });

      const paused = coordinator.togglePause({ offlineRendering: true, paused: () => events.push('present-paused') });
      const resumed = coordinator.togglePause({ offlineRendering: true, resumed: ({ percent }) => events.push(`present-resumed:${percent}`) });
      const finishing = coordinator.finish({
        offlineRendering: true,
        resumed: () => events.push('finish-resumed'),
        offlineFinishing: () => events.push('present-finish')
      });
      const declined = await coordinator.cancel({ exporting: true, confirm: async () => false });
      const cancelling = await coordinator.cancel({
        exporting: true,
        offlineRendering: false,
        confirm: async () => true,
        cancelling: () => events.push('present-cancelling'),
        offlineCancelling: () => events.push('present-offline-cancelling'),
        resumed: () => events.push('cancel-resumed'),
        abortOffline: async (id) => events.push(`abort:${id}`)
      });

      testSession.mode = 'live';
      testSession.session = { id: 'live' };
      testSession.cancelRequested = false;
      const liveFinishing = coordinator.finish({
        liveCaptureActive: () => true,
        pauseAudio: () => events.push('pause-audio'),
        stopLiveCapture: () => events.push('stop-live')
      });
      const liveCancelling = await coordinator.cancel({
        exporting: true,
        confirm: () => true,
        cancelling: () => events.push('present-live-cancelling'),
        liveCaptureActive: () => true,
        pauseAudio: () => events.push('pause-audio-cancel'),
        stopLiveCapture: () => events.push('stop-live-cancel')
      });

      return paused.status === 'paused'
        && resumed.status === 'resumed'
        && finishing.status === 'offline-finishing'
        && declined.status === 'declined'
        && cancelling.status === 'offline-cancelling'
        && liveFinishing.status === 'live-finishing'
        && liveCancelling.status === 'live-cancelling'
        && events.join('|') === 'present-paused|pause|present-resumed:42|resume|finish-resumed|resume|request-finish|present-finish|present-cancelling|present-offline-cancelling|cancel-resumed|resume|request-cancel|abort:offline|live-request-finish|pause-audio|stop-live|present-live-cancelling|live-request-cancel|pause-audio-cancel|stop-live-cancel';
    }

    return Object.freeze({
      cancel,
      finish,
      togglePause,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportCommandCoordinator = Object.freeze({ create });
})();
