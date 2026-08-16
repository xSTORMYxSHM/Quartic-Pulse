(() => {
  'use strict';

  const SNAPSHOT_FIELDS = Object.freeze([
    'loopBeforeExport', 'exporting', 'exportWidth', 'exportHeight', 'exportDetail',
    'exportIterationTarget', 'offlineFps', 'offlineExporting', 'offlineHdrExport',
    'offlineTenBitExport', 'offlineSamplePass', 'exportSampleOffsetX',
    'exportSampleOffsetY', 'offlineBaseModulation', 'visualTime',
    'modulationRotationPhase', 'autoReactivityGain'
  ]);

  function create(options = {}) {
    const state = options.state;
    if (!state || typeof state !== 'object') {
      throw new TypeError('Export runtime state coordinator requires renderer state.');
    }

    let activeSession = null;

    function normalizeMode(mode) {
      const normalized = String(mode || '').toLowerCase();
      if (normalized !== 'offline' && normalized !== 'live') {
        throw new RangeError(`Unknown export runtime mode: ${normalized || 'empty'}`);
      }
      return normalized;
    }

    function positiveNumber(value, fallback) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : fallback;
    }

    function positiveInteger(value, fallback) {
      return Math.max(1, Math.round(positiveNumber(value, fallback)));
    }

    function snapshot(loopPlayback) {
      const values = {};
      for (const field of SNAPSHOT_FIELDS) values[field] = state[field];
      return Object.freeze({ values: Object.freeze(values), loopPlayback: Boolean(loopPlayback) });
    }

    function activate(mode, settings = {}, config = {}) {
      const normalizedMode = normalizeMode(mode);
      if (activeSession) throw new Error(`The ${activeSession.mode} export runtime is already active.`);

      const previous = snapshot(config.loopPlayback);
      activeSession = { mode: normalizedMode, previous };

      state.loopBeforeExport = previous.loopPlayback;
      state.exportWidth = positiveInteger(settings.width, state.exportWidth || 1920);
      state.exportHeight = positiveInteger(settings.height, state.exportHeight || 1080);
      state.exportDetail = positiveNumber(settings.detail ?? settings.exportDetail, state.exportDetail || 1);
      state.exportIterationTarget = normalizedMode === 'offline'
        ? positiveInteger(settings.effectiveIterations ?? settings.exportIterations, state.exportIterationTarget || 1)
        : 0;
      state.offlineFps = normalizedMode === 'offline'
        ? positiveInteger(settings.fps, state.offlineFps || 60)
        : state.offlineFps;
      state.offlineExporting = normalizedMode === 'offline';
      state.offlineHdrExport = normalizedMode === 'offline' && Boolean(settings.hdrProfile);
      state.offlineTenBitExport = normalizedMode === 'offline' && Boolean(settings.tenBitProfile);
      state.offlineSamplePass = 0;
      state.exportSampleOffsetX = 0;
      state.exportSampleOffsetY = 0;
      state.offlineBaseModulation = null;
      state.exporting = true;
      state.visualTime = 0;
      state.modulationRotationPhase = 0;
      if (normalizedMode === 'offline') state.autoReactivityGain = 1;

      return Object.freeze({
        mode: normalizedMode,
        loopPlayback: previous.loopPlayback,
        width: state.exportWidth,
        height: state.exportHeight,
        detail: state.exportDetail,
        iterations: state.exportIterationTarget,
        fps: state.offlineFps
      });
    }

    function markFinalizing(mode) {
      const normalizedMode = normalizeMode(mode);
      if (!activeSession || activeSession.mode !== normalizedMode) return false;
      if (normalizedMode === 'offline') state.offlineExporting = false;
      return true;
    }

    function restore(mode) {
      const normalizedMode = normalizeMode(mode);
      if (!activeSession) {
        return Object.freeze({ restored: false, mode: normalizedMode, loopPlayback: Boolean(state.loopBeforeExport) });
      }
      if (activeSession.mode !== normalizedMode) {
        throw new Error(`Cannot restore ${normalizedMode} while ${activeSession.mode} export runtime is active.`);
      }

      const { previous } = activeSession;
      for (const field of SNAPSHOT_FIELDS) state[field] = previous.values[field];
      activeSession = null;
      return Object.freeze({ restored: true, mode: normalizedMode, loopPlayback: previous.loopPlayback });
    }

    function selfTest() {
      const testState = {
        loopBeforeExport: false, exporting: false, exportWidth: 1280, exportHeight: 720,
        exportDetail: 1, exportIterationTarget: 0, offlineFps: 30,
        offlineExporting: false, offlineHdrExport: false, offlineTenBitExport: false,
        offlineSamplePass: 2, exportSampleOffsetX: .25, exportSampleOffsetY: -.25,
        offlineBaseModulation: { bass: .2 }, visualTime: 42,
        modulationRotationPhase: .75, autoReactivityGain: .6
      };
      const engine = create({ state: testState });
      const offline = engine.activate('offline', {
        width: 3840, height: 2160, fps: 60, exportDetail: 2,
        exportIterations: 1000, hdrProfile: true, tenBitProfile: true
      }, { loopPlayback: true });
      const activated = offline.iterations === 1000 && testState.exporting
        && testState.offlineExporting && testState.offlineHdrExport
        && testState.offlineTenBitExport && testState.visualTime === 0
        && testState.offlineSamplePass === 0;
      const finalizing = engine.markFinalizing('offline') && !testState.offlineExporting;
      const offlineRestore = engine.restore('offline');
      const restored = offlineRestore.restored && offlineRestore.loopPlayback
        && testState.exportWidth === 1280 && testState.exportHeight === 720
        && testState.visualTime === 42 && testState.modulationRotationPhase === .75
        && testState.autoReactivityGain === .6 && testState.offlineSamplePass === 2;
      const live = engine.activate('live', { width: 1920, height: 1080, detail: 1.6 }, { loopPlayback: false });
      const liveActivated = live.iterations === 0 && testState.exporting
        && !testState.offlineExporting && testState.visualTime === 0;
      const liveRestore = engine.restore('live');
      return activated && finalizing && restored && liveActivated && liveRestore.restored
        && !liveRestore.loopPlayback && testState.visualTime === 42 && !engine.diagnostics.active;
    }

    return Object.freeze({
      activate,
      markFinalizing,
      restore,
      selfTest,
      get diagnostics() {
        return Object.freeze({ ready: true, active: Boolean(activeSession), mode: activeSession?.mode || null });
      }
    });
  }

  window.QuarticExportRuntimeStateCoordinator = Object.freeze({ create });
})();
