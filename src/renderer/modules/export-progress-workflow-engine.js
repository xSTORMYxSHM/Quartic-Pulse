(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const session = options.sessionEngine;
    if (!session || typeof session.startProgress !== 'function'
      || typeof session.updateProgress !== 'function'
      || typeof session.markCompleted !== 'function'
      || typeof session.elapsed !== 'function'
      || typeof session.pause !== 'function'
      || typeof session.resume !== 'function'
      || typeof session.matches !== 'function') {
      throw new TypeError('Export progress workflow requires the Export Session Engine.');
    }
    const formatTime = typeof options.formatTime === 'function'
      ? options.formatTime
      : (seconds) => String(Math.max(0, Math.floor(Number(seconds) || 0)));
    const fileName = typeof options.fileName === 'function'
      ? options.fileName
      : (path) => String(path || '').split(/[\\/]/).pop() || 'video';
    const schedule = options.schedule || ((callback, delay) => window.setTimeout(callback, delay));
    const cancelSchedule = options.cancelSchedule || ((timer) => window.clearTimeout(timer));
    const hideDelay = Math.max(0, Number(options.hideDelay) || 2200);
    let hideTimer = null;

    function cancelScheduledHide() {
      if (hideTimer !== null) cancelSchedule(hideTimer);
      hideTimer = null;
    }

    function progressView(overall, panelText, stageText = panelText, timestamp) {
      const timing = session.updateProgress(overall, timestamp);
      let metaText = '';
      if (session.diagnostics?.snapshot?.startedAt) {
        if (timing.paused) metaText = `Paused · elapsed ${formatTime(timing.elapsedSeconds)}`;
        else if (timing.remainingSeconds !== null) {
          metaText = `Elapsed ${formatTime(timing.elapsedSeconds)} · estimated remaining ${formatTime(timing.remainingSeconds)}`;
        } else metaText = `Elapsed ${formatTime(timing.elapsedSeconds)}`;
      }
      return Object.freeze({
        overall: timing.progress,
        panelText: String(panelText || ''),
        stageText: String(stageText || panelText || ''),
        metaText,
        timing
      });
    }

    function update(overall, panelText, stageText = panelText, config = {}) {
      const view = progressView(overall, panelText, stageText, config.timestamp);
      config.render?.(view);
      return view;
    }

    function begin(panelText, stageText = panelText, config = {}) {
      cancelScheduledHide();
      session.startProgress(config.timestamp);
      config.started?.();
      const view = update(0, panelText, stageText, config);
      return Object.freeze({ status: 'started', view });
    }

    function pause(config = {}) {
      const timing = session.pause(config.timestamp);
      const view = Object.freeze({
        note: 'Offline rendering is paused safely between frames.',
        stageText: `Paused at ${Math.floor(session.progress * 100)}%`,
        metaText: `Paused · elapsed ${formatTime(timing.elapsedSeconds)}`
      });
      config.paused?.(view, timing);
      return Object.freeze({ status: 'paused', view, timing });
    }

    function resume(config = {}) {
      const timing = session.resume(config.timestamp);
      config.resumed?.(timing);
      return Object.freeze({ status: 'resumed', timing });
    }

    function complete(outputPath, config = {}) {
      cancelScheduledHide();
      session.markCompleted();
      const name = fileName(outputPath);
      const elapsedSeconds = session.elapsed(config.timestamp);
      const view = Object.freeze({
        overall: 1,
        panelText: `Saved 100% | ${name}`,
        stageText: 'Export saved 100%',
        metaText: `Completed in ${formatTime(elapsedSeconds)}`,
        timing: Object.freeze({ progress: 1, elapsedSeconds, remainingSeconds: null, paused: false })
      });
      config.render?.(view);
      config.note?.('The finished video has been saved successfully.');
      config.setActions?.(false, false);
      if (config.shouldPlayStinger?.()) config.playStinger?.();
      if (typeof config.hide === 'function') {
        hideTimer = schedule(() => {
          hideTimer = null;
          if (!config.isExporting?.()) config.hide();
        }, hideDelay);
      }
      return Object.freeze({ status: 'completed', outputPath, view });
    }

    function handleNative(updateMessage, config = {}) {
      if (!updateMessage || !session.matches(updateMessage.id)) {
        return Object.freeze({ status: 'ignored', view: null });
      }
      const phaseProgress = clamp(Number(updateMessage.progress) || 0, 0, 1);
      const renderShare = session.mode === 'offline' ? .85 : .80;
      let overall;
      let phaseLabel;
      let note;
      if (updateMessage.stage === 'saving') {
        const start = Math.max(renderShare, session.progress);
        overall = start + (.995 - start) * phaseProgress;
        phaseLabel = `Saving ${Math.round(phaseProgress * 100)}%`;
        note = 'The completed video is being written to the selected destination.';
      } else {
        overall = renderShare + (.99 - renderShare) * phaseProgress;
        phaseLabel = `Finalizing ${Math.round(phaseProgress * 100)}%`;
        note = 'All visual frames are complete; audio and the final video container are being finished.';
      }
      const overallPercent = overall >= 1 ? 100 : Math.min(99, Math.floor(overall * 100));
      const detail = String(updateMessage.message || phaseLabel).replace(/\.{3}$/, '');
      config.note?.(note);
      const view = update(
        overall,
        `${phaseLabel} | overall ${overallPercent}% | ${detail}`,
        `${phaseLabel} | overall ${overallPercent}%`,
        config
      );
      return Object.freeze({ status: updateMessage.stage === 'saving' ? 'saving' : 'finalizing', view });
    }

    async function selfTest() {
      let now = 1000;
      let progress = 0;
      let startedAt = 0;
      let completed = false;
      let scheduled;
      const testSession = {
        mode: 'offline',
        get progress() { return progress; },
        diagnostics: { get snapshot() { return { startedAt }; } },
        startProgress(timestamp = now) { startedAt = timestamp; progress = 0; },
        updateProgress(value, timestamp = now) {
          progress = clamp(Number(value) || 0, 0, 1);
          const elapsedSeconds = (timestamp - startedAt) / 1000;
          return { progress, elapsedSeconds, remainingSeconds: progress > .01 && progress < .995 ? elapsedSeconds * (1 - progress) / progress : null, paused: false };
        },
        markCompleted() { completed = true; progress = 1; },
        elapsed(timestamp = now) { return (timestamp - startedAt) / 1000; },
        pause(timestamp = now) { return { progress, elapsedSeconds: (timestamp - startedAt) / 1000, remainingSeconds: null, paused: true }; },
        resume(timestamp = now) { return { progress, elapsedSeconds: (timestamp - startedAt) / 1000, remainingSeconds: null, paused: false }; },
        matches(id) { return id === 'test'; }
      };
      const engine = create({
        sessionEngine: testSession,
        formatTime: (seconds) => `${Math.floor(seconds)}s`,
        fileName: (path) => path.split('/').pop(),
        schedule: (callback, delay) => { scheduled = { callback, delay }; return 7; },
        cancelSchedule: () => {},
        hideDelay: 25
      });
      const events = [];
      engine.begin('Starting', 'Starting stage', { started: () => events.push('started'), render: (view) => events.push(view.panelText) });
      now = 3000;
      const rendering = engine.update(.5, 'Rendering', 'Rendering stage', { render: (view) => events.push(view.metaText) });
      const native = engine.handleNative({ id: 'test', stage: 'finalize', progress: .5, message: 'Muxing...' }, {
        note: (message) => events.push(message.startsWith('All visual') ? 'finalize-note' : 'wrong-note'),
        render: (view) => events.push(view.stageText)
      });
      const ignored = engine.handleNative({ id: 'other', stage: 'saving', progress: 1 });
      const paused = engine.pause();
      const resumed = engine.resume();
      now = 5000;
      const finished = engine.complete('C:/Exports/final.mp4', {
        render: (view) => events.push(view.panelText),
        note: () => events.push('note'),
        setActions: (end, cancel) => events.push(`actions:${end}:${cancel}`),
        shouldPlayStinger: () => true,
        playStinger: () => events.push('stinger'),
        isExporting: () => false,
        hide: () => events.push('hide')
      });
      scheduled.callback();
      return rendering.metaText === 'Elapsed 2s · estimated remaining 2s'
        && native.status === 'finalizing'
        && native.view.overall > .9
        && ignored.status === 'ignored'
        && paused.view.stageText === 'Paused at 92%'
        && resumed.status === 'resumed'
        && completed
        && finished.view.panelText === 'Saved 100% | final.mp4'
        && finished.view.metaText === 'Completed in 4s'
        && scheduled.delay === 25
        && events.join('|') === 'started|Starting|Elapsed 2s · estimated remaining 2s|finalize-note|Finalizing 50% | overall 92%|Saved 100% | final.mp4|note|actions:false:false|stinger|hide';
    }

    return Object.freeze({
      begin,
      cancelScheduledHide,
      complete,
      handleNative,
      pause,
      progressView,
      resume,
      selfTest,
      update,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportProgressWorkflowEngine = Object.freeze({ create });
})();
