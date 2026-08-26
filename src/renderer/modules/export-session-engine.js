(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const now = options.now || (() => performance.now());
    let session = null;
    let mode = '';
    let progress = 0;
    let startedAt = 0;
    let pauseStartedAt = 0;
    let pausedDuration = 0;
    let paused = false;
    let cancelRequested = false;
    let finishRequested = false;
    let completed = false;

    function begin(nextSession, nextMode) {
      session = nextSession || null;
      mode = nextMode || nextSession?.mode || '';
      if (session) session.mode = mode;
      progress = 0;
      startedAt = 0;
      pauseStartedAt = 0;
      pausedDuration = 0;
      paused = false;
      cancelRequested = false;
      finishRequested = false;
      completed = false;
      return session;
    }

    function clear() {
      session = null;
      mode = '';
      pauseStartedAt = 0;
      paused = false;
    }

    function startProgress(timestamp = now()) {
      progress = 0;
      startedAt = timestamp;
      pauseStartedAt = 0;
      pausedDuration = 0;
      paused = false;
      return timing(timestamp);
    }

    function updateProgress(value, timestamp = now()) {
      progress = clamp(Number(value) || 0, 0, 1);
      return timing(timestamp);
    }

    function pause(timestamp = now()) {
      if (paused) return timing(timestamp);
      paused = true;
      pauseStartedAt = timestamp;
      return timing(timestamp);
    }

    function resume(timestamp = now()) {
      if (pauseStartedAt) pausedDuration += Math.max(0, timestamp - pauseStartedAt);
      pauseStartedAt = 0;
      paused = false;
      return timing(timestamp);
    }

    function requestFinish() {
      finishRequested = true;
      return finishRequested;
    }

    function requestCancel() {
      cancelRequested = true;
      return cancelRequested;
    }

    function markCompleted(value = true) {
      completed = Boolean(value);
      if (completed) progress = 1;
      return completed;
    }

    function resetRequests() {
      cancelRequested = false;
      finishRequested = false;
      completed = false;
      pauseStartedAt = 0;
      paused = false;
    }

    function elapsed(timestamp = now()) {
      if (!startedAt) return 0;
      const activePause = pauseStartedAt ? Math.max(0, timestamp - pauseStartedAt) : 0;
      return Math.max(0, (timestamp - startedAt - pausedDuration - activePause) / 1000);
    }

    function timing(timestamp = now()) {
      const elapsedSeconds = elapsed(timestamp);
      const remainingSeconds = progress > .01 && progress < .995
        ? elapsedSeconds * (1 - progress) / progress
        : null;
      return { progress, elapsedSeconds, remainingSeconds, paused };
    }

    function matches(id) {
      return Boolean(session && id === session.id);
    }

    const diagnostics = {
      get ready() { return true; },
      get snapshot() {
        return {
          id: session?.id || null,
          mode,
          progress,
          startedAt,
          pausedDuration,
          pauseStartedAt,
          paused,
          cancelRequested,
          finishRequested,
          completed
        };
      }
    };

    return Object.freeze({
      begin,
      clear,
      elapsed,
      markCompleted,
      matches,
      pause,
      requestCancel,
      requestFinish,
      resetRequests,
      resume,
      startProgress,
      timing,
      updateProgress,
      get session() { return session; },
      get mode() { return mode; },
      get progress() { return progress; },
      get paused() { return paused; },
      get cancelRequested() { return cancelRequested; },
      get finishRequested() { return finishRequested; },
      get completed() { return completed; },
      get diagnostics() { return diagnostics; }
    });
  }

  window.QuarticExportSessionEngine = Object.freeze({ create });
})();
