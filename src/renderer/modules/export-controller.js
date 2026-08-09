(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    let bound = false;

    function bind() {
      if (bound) return;
      query('#endExportButton')?.addEventListener('click', () => options.onEnd?.());
      query('#cancelExportButton')?.addEventListener('click', () => options.onCancel?.());
      query('#pauseExportButton')?.addEventListener('click', () => options.onPause?.());
      bound = true;
    }

    function renderProgress(view = {}) {
      const overall = Math.max(0, Math.min(1, Number(view.overall) || 0));
      const percent = overall >= 1 ? 100 : Math.min(99, Math.floor(overall * 100));
      query('#exportProgressFill').style.width = `${overall * 100}%`;
      query('#exportProgressText').textContent = view.panelText || `Exporting ${percent}%`;
      query('#stageRenderFill').style.width = `${overall * 100}%`;
      query('#stageRenderText').textContent = view.stageText || `Exporting ${percent}%`;
      if (view.metaText !== undefined) query('#stageRenderMeta').textContent = view.metaText;
    }

    function begin() {
      query('#exportProgress').hidden = false;
    }

    function hide() {
      query('#exportProgress').hidden = true;
    }

    function setMode(mode) {
      const offline = mode === 'offline';
      query('#stageRenderMode').textContent = offline ? 'OFFLINE MASTER EXPORT' : 'LIVE VIDEO EXPORT';
      query('#stageRenderNote').textContent = offline
        ? 'Every frame is being completed independently for maximum detail and consistency.'
        : 'Quartic Pulse is recording in real time. Keep the visualizer running until the track finishes.';
      const pause = query('#pauseExportButton');
      pause.hidden = !offline;
      pause.disabled = !offline;
      pause.textContent = 'PAUSE';
    }

    function setActions(endEnabled, cancelEnabled) {
      query('#endExportButton').disabled = !endEnabled;
      query('#cancelExportButton').disabled = !cancelEnabled;
      const pause = query('#pauseExportButton');
      if (!pause.hidden) pause.disabled = !endEnabled;
    }

    function setNote(text) {
      query('#stageRenderNote').textContent = text;
    }

    function getPanelText() {
      return query('#exportProgressText')?.textContent || '';
    }

    function setPaused(paused, view = {}) {
      query('#pauseExportButton').textContent = paused ? 'RESUME' : 'PAUSE';
      if (view.note) setNote(view.note);
      if (view.stageText) query('#stageRenderText').textContent = view.stageText;
      if (view.metaText) query('#stageRenderMeta').textContent = view.metaText;
    }

    return {
      bind,
      begin,
      getPanelText,
      hide,
      renderProgress,
      setActions,
      setMode,
      setNote,
      setPaused,
      get diagnostics() {
        return { ready: Boolean(query('#exportProgress') && query('#stageRenderText') && query('#stageRenderMeta')), bound };
      }
    };
  }

  window.QuarticExportController = Object.freeze({ create });
})();
