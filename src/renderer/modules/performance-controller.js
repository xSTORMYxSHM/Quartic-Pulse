(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const dock = query('#performanceDock');
    let bound = false;

    function bind() {
      if (bound) return;
      query('#performancePreviousButton')?.addEventListener('click', () => options.onPrevious?.());
      query('#performancePlayButton')?.addEventListener('click', () => options.onPlayPause?.());
      query('#performanceNextButton')?.addEventListener('click', () => options.onNext?.());
      query('#performanceBlackoutButton')?.addEventListener('click', () => options.onToggleBlackout?.());
      bound = true;
    }

    function renderDock(view = {}) {
      if (!dock) return;
      query('#performanceDockState').textContent = view.stateLabel || 'PERFORMANCE MODE';
      query('#performanceDockCurrent').textContent = view.currentLabel || 'Manual visual';
      query('#performanceDockNext').textContent = view.nextLabel || 'No show sequence queued';
      const play = query('#performancePlayButton');
      play.textContent = view.playLabel || 'START';
      play.disabled = !view.hasEntries;
      query('#performancePreviousButton').disabled = !view.hasEntries;
      query('#performanceNextButton').disabled = !view.hasEntries;
      query('#performanceBlackoutButton').textContent = view.blackout ? 'RESTORE' : 'BLACKOUT';
    }

    function setVisible(visible) {
      if (dock) dock.hidden = !visible;
    }

    function setProgress(progress) {
      const fill = query('#performanceDockProgress');
      if (fill) fill.style.width = `${Math.max(0, Math.min(100, (Number(progress) || 0) * 100))}%`;
    }

    return {
      bind,
      renderDock,
      setVisible,
      setProgress,
      get diagnostics() { return { ready: Boolean(dock), bound }; }
    };
  }

  window.QuarticPerformanceController = Object.freeze({ create });
})();
