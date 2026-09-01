(() => {
  'use strict';

  const pageParameters = new URLSearchParams(window.location.search);
  const isObsOutput = pageParameters.get('obs') === '1';
  const isSmokeTest = pageParameters.get('smoke') === '1';
  if (!isObsOutput) {
    window.addEventListener('error', (event) => window.quarticDesktop?.reportRendererError?.({
      kind: 'error',
      message: event.message || event.error?.message || 'Renderer error',
      stack: event.error?.stack || ''
    }));
    window.addEventListener('unhandledrejection', (event) => window.quarticDesktop?.reportRendererError?.({
      kind: 'unhandled-rejection',
      message: event.reason?.message || String(event.reason || 'Unhandled renderer rejection'),
      stack: event.reason?.stack || ''
    }));
  }
  if (isObsOutput) {
    document.body.classList.add('obs-output');
    const obsDragStrip = document.createElement('div');
    obsDragStrip.className = 'obs-window-drag-strip';
    obsDragStrip.title = 'Drag to move the OBS output window';
    document.body.appendChild(obsDragStrip);
    document.title = 'Quartic Pulse — OBS Output';
  }

  const $ = (selector) => document.querySelector(selector);
  const appMetadata = window.QuarticAppMetadata;
  if (!appMetadata) throw new Error('Quartic application metadata failed to load.');
  const appVersionText = $('#appVersionText');
  if (appVersionText) {
    const channelLabel = appMetadata.releaseChannel === 'stable'
      ? 'Stable Release'
      : appMetadata.releaseChannel === 'release-candidate' ? 'Release Candidate' : 'Testing Build';
    appVersionText.textContent = `Version ${appMetadata.version} ${channelLabel}`;
  }
  const exportProfileCatalog = window.QuarticExportProfiles;
  if (!exportProfileCatalog) throw new Error('Quartic export profile catalog failed to load.');
  const workspaceShell = window.QuarticWorkspaceShell;
  if (!workspaceShell) throw new Error('Quartic workspace shell failed to load.');
  const workspaceUiControllerFactory = window.QuarticWorkspaceUiController;
  if (!workspaceUiControllerFactory) throw new Error('Quartic workspace UI controller failed to load.');
  const visualCatalog = window.QuarticVisualCatalog;
  if (!visualCatalog) throw new Error('Quartic visual catalog failed to load.');
  const visualSettingsCatalog = window.QuarticVisualSettingsCatalog;
  if (!visualSettingsCatalog) throw new Error('Quartic visual settings catalog failed to load.');
  const audioModulationEngineFactory = window.QuarticAudioModulationEngine;
  if (!audioModulationEngineFactory) throw new Error('Quartic audio modulation engine failed to load.');
  const audioModulationControllerFactory = window.QuarticAudioModulationController;
  if (!audioModulationControllerFactory) throw new Error('Quartic audio modulation controller failed to load.');
  const musicPersonalityControllerFactory = window.QuarticMusicPersonalityController;
  if (!musicPersonalityControllerFactory) throw new Error('Quartic Music Personality controller failed to load.');
  const visualPresetControllerFactory = window.QuarticVisualPresetController;
  if (!visualPresetControllerFactory) throw new Error('Quartic visual preset controller failed to load.');
  const appStateFactory = window.QuarticAppState;
  if (!appStateFactory) throw new Error('Quartic application state factory failed to load.');
  const backgroundRenderPolicy = window.QuarticBackgroundRenderPolicy;
  if (!backgroundRenderPolicy) throw new Error('Quartic background render policy failed to load.');
  const visualRendererFactory = window.QuarticVisualRenderer;
  if (!visualRendererFactory) throw new Error('Quartic visual renderer failed to load.');
  const dataHorizonRuntimeFactory = window.QuarticDataHorizonRuntime;
  if (!dataHorizonRuntimeFactory) throw new Error('Quartic Data Horizon runtime failed to load.');
  const visualizerPackageControllerFactory = window.QuarticVisualizerPackageController;
  if (!visualizerPackageControllerFactory) throw new Error('Quartic visualizer package controller failed to load.');
  const audioControllerFactory = window.QuarticAudioController;
  if (!audioControllerFactory) throw new Error('Quartic audio controller failed to load.');
  const audioSourceControllerFactory = window.QuarticAudioSourceController;
  if (!audioSourceControllerFactory) throw new Error('Quartic audio source controller failed to load.');
  const playlistControllerFactory = window.QuarticPlaylistController;
  if (!playlistControllerFactory) throw new Error('Quartic playlist controller failed to load.');
  const audioResponseEngineFactory = window.QuarticAudioResponseEngine;
  if (!audioResponseEngineFactory) throw new Error('Quartic audio response engine failed to load.');
  const audioAnalysisEngineFactory = window.QuarticAudioAnalysisEngine;
  if (!audioAnalysisEngineFactory) throw new Error('Quartic audio analysis engine failed to load.');
  const audioFftEngine = window.QuarticAudioFftEngine;
  if (!audioFftEngine) throw new Error('Quartic audio FFT engine failed to load.');
  const offlineAudioAnalysisEngineFactory = window.QuarticOfflineAudioAnalysisEngine;
  if (!offlineAudioAnalysisEngineFactory) throw new Error('Quartic offline audio analysis engine failed to load.');
  const performanceControllerFactory = window.QuarticPerformanceController;
  if (!performanceControllerFactory) throw new Error('Quartic performance controller failed to load.');
  const performanceAnalysisEngine = window.QuarticPerformanceAnalysisEngine;
  if (!performanceAnalysisEngine) throw new Error('Quartic performance analysis engine failed to load.');
  const performanceSequencerEngineFactory = window.QuarticPerformanceSequencerEngine;
  if (!performanceSequencerEngineFactory) throw new Error('Quartic performance sequencer engine failed to load.');
  const performanceShowDataEngineFactory = window.QuarticPerformanceShowDataEngine;
  if (!performanceShowDataEngineFactory) throw new Error('Quartic performance show data engine failed to load.');
  const performanceShowControllerFactory = window.QuarticPerformanceShowController;
  if (!performanceShowControllerFactory) throw new Error('Quartic performance show controller failed to load.');
  const performanceShowComposerControllerFactory = window.QuarticPerformanceShowComposerController;
  if (!performanceShowComposerControllerFactory) throw new Error('Quartic performance show composer controller failed to load.');
  const showComposerOrchestratorFactory = window.QuarticShowComposerOrchestrator;
  if (!showComposerOrchestratorFactory) throw new Error('Quartic Show Composer orchestrator failed to load.');
  const profileManagerControllerFactory = window.QuarticProfileManagerController;
  if (!profileManagerControllerFactory) throw new Error('Quartic profile manager controller failed to load.');
  const paletteLibraryControllerFactory = window.QuarticPaletteLibraryController;
  if (!paletteLibraryControllerFactory) throw new Error('Quartic palette library controller failed to load.');
  const profileServiceControllerFactory = window.QuarticProfileServiceController;
  if (!profileServiceControllerFactory) throw new Error('Quartic profile service controller failed to load.');
  const obsAutomationControllerFactory = window.QuarticObsAutomationController;
  if (!obsAutomationControllerFactory) throw new Error('Quartic OBS automation controller failed to load.');
  const liveControlControllerFactory = window.QuarticLiveControlController;
  if (!liveControlControllerFactory) throw new Error('Quartic live-control controller failed to load.');
  const cameraControllerFactory = window.QuarticCameraController;
  if (!cameraControllerFactory) throw new Error('Quartic camera controller failed to load.');
  const operatorToolsControllerFactory = window.QuarticOperatorToolsController;
  if (!operatorToolsControllerFactory) throw new Error('Quartic operator tools controller failed to load.');
  const songMapDataEngineFactory = window.QuarticSongMapDataEngine;
  if (!songMapDataEngineFactory) throw new Error('Quartic Song Map data engine failed to load.');
  const songMapAnalysisEngineFactory = window.QuarticSongMapAnalysisEngine;
  if (!songMapAnalysisEngineFactory) throw new Error('Quartic Song Map analysis engine failed to load.');
  const songMapControllerFactory = window.QuarticSongMapController;
  if (!songMapControllerFactory) throw new Error('Quartic Song Map controller failed to load.');
  const songDirectorEngineFactory = window.QuarticSongDirectorEngine;
  if (!songDirectorEngineFactory) throw new Error('Quartic Song Director engine failed to load.');
  const songDirectorControllerFactory = window.QuarticSongDirectorController;
  if (!songDirectorControllerFactory) throw new Error('Quartic Song Director controller failed to load.');
  const performancePackageEngineFactory = window.QuarticPerformancePackageEngine;
  if (!performancePackageEngineFactory) throw new Error('Quartic performance package engine failed to load.');
  const performancePackageSessionControllerFactory = window.QuarticPerformancePackageSessionController;
  if (!performancePackageSessionControllerFactory) throw new Error('Quartic performance package/session controller failed to load.');
  const exportControllerFactory = window.QuarticExportController;
  if (!exportControllerFactory) throw new Error('Quartic export controller failed to load.');
  const exportSessionEngineFactory = window.QuarticExportSessionEngine;
  if (!exportSessionEngineFactory) throw new Error('Quartic export session engine failed to load.');
  const exportProgressWorkflowEngineFactory = window.QuarticExportProgressWorkflowEngine;
  if (!exportProgressWorkflowEngineFactory) throw new Error('Quartic export progress workflow engine failed to load.');
  const exportProgressCoordinatorFactory = window.QuarticExportProgressCoordinator;
  if (!exportProgressCoordinatorFactory) throw new Error('Quartic export progress coordinator failed to load.');
  const exportCommandCoordinatorFactory = window.QuarticExportCommandCoordinator;
  if (!exportCommandCoordinatorFactory) throw new Error('Quartic export command coordinator failed to load.');
  const exportJobCoordinatorFactory = window.QuarticExportJobCoordinator;
  if (!exportJobCoordinatorFactory) throw new Error('Quartic export job coordinator failed to load.');
  const exportResultWorkflowEngineFactory = window.QuarticExportResultWorkflowEngine;
  if (!exportResultWorkflowEngineFactory) throw new Error('Quartic export result workflow engine failed to load.');
  const exportEncoderEngineFactory = window.QuarticExportEncoderEngine;
  if (!exportEncoderEngineFactory) throw new Error('Quartic export encoder engine failed to load.');
  const exportLiveCaptureEngineFactory = window.QuarticExportLiveCaptureEngine;
  if (!exportLiveCaptureEngineFactory) throw new Error('Quartic Live Capture Engine failed to load.');
  const exportQuickClipWorkflowEngineFactory = window.QuarticExportQuickClipWorkflowEngine;
  if (!exportQuickClipWorkflowEngineFactory) throw new Error('Quartic Quick Clip Workflow Engine failed to load.');
  const exportSamplingEngineFactory = window.QuarticExportSamplingEngine;
  if (!exportSamplingEngineFactory) throw new Error('Quartic export sampling engine failed to load.');
  const exportSettingsSnapshotEngineFactory = window.QuarticExportSettingsSnapshotEngine;
  if (!exportSettingsSnapshotEngineFactory) throw new Error('Quartic export settings snapshot engine failed to load.');
  const exportPreparationEngineFactory = window.QuarticExportPreparationEngine;
  if (!exportPreparationEngineFactory) throw new Error('Quartic export preparation engine failed to load.');
  const exportFrameCaptureEngineFactory = window.QuarticExportFrameCaptureEngine;
  if (!exportFrameCaptureEngineFactory) throw new Error('Quartic export frame capture engine failed to load.');
  const exportPlanningEngineFactory = window.QuarticExportPlanningEngine;
  if (!exportPlanningEngineFactory) throw new Error('Quartic export planning engine failed to load.');
  const exportPresentationEngineFactory = window.QuarticExportPresentationEngine;
  if (!exportPresentationEngineFactory) throw new Error('Quartic export presentation engine failed to load.');
  const exportPreflightEngineFactory = window.QuarticExportPreflightEngine;
  if (!exportPreflightEngineFactory) throw new Error('Quartic export preflight engine failed to load.');
  const exportAdvisorEngineFactory = window.QuarticExportAdvisorEngine;
  if (!exportAdvisorEngineFactory) throw new Error('Quartic export advisor engine failed to load.');
  const exportSettingsCoordinatorEngineFactory = window.QuarticExportSettingsCoordinatorEngine;
  if (!exportSettingsCoordinatorEngineFactory) throw new Error('Quartic export settings coordinator failed to load.');
  const exportRuntimeStateCoordinatorFactory = window.QuarticExportRuntimeStateCoordinator;
  if (!exportRuntimeStateCoordinatorFactory) throw new Error('Quartic export runtime state coordinator failed to load.');
  const exportEncoderScanEngineFactory = window.QuarticExportEncoderScanEngine;
  if (!exportEncoderScanEngineFactory) throw new Error('Quartic export encoder scan engine failed to load.');
  const exportBenchmarkEngineFactory = window.QuarticExportBenchmarkEngine;
  if (!exportBenchmarkEngineFactory) throw new Error('Quartic export benchmark engine failed to load.');
  const exportHistoryEngineFactory = window.QuarticExportHistoryEngine;
  if (!exportHistoryEngineFactory) throw new Error('Quartic export history engine failed to load.');
  const exportHistoryActionEngineFactory = window.QuarticExportHistoryActionEngine;
  if (!exportHistoryActionEngineFactory) throw new Error('Quartic export history action engine failed to load.');
  const exportRecoveryEngineFactory = window.QuarticExportRecoveryEngine;
  if (!exportRecoveryEngineFactory) throw new Error('Quartic export recovery engine failed to load.');
  const exportRenderCoordinatorFactory = window.QuarticExportRenderCoordinator;
  if (!exportRenderCoordinatorFactory) throw new Error('Quartic export render coordinator failed to load.');
  const exportWorkflowEngineFactory = window.QuarticExportWorkflowEngine;
  if (!exportWorkflowEngineFactory) throw new Error('Quartic export workflow engine failed to load.');
  const exportOfflineLifecycleFactory = window.QuarticExportOfflineLifecycle;
  if (!exportOfflineLifecycleFactory) throw new Error('Quartic offline export lifecycle failed to load.');
  const exportLiveLifecycleFactory = window.QuarticExportLiveLifecycle;
  if (!exportLiveLifecycleFactory) throw new Error('Quartic live export lifecycle failed to load.');
  const canvas = $('#fractalCanvas');
  const stage = $('#stage');
  const audio = $('#audio');
  const visualRenderer = visualRendererFactory.create({
    canvas,
    shaderSource: window.QuarticShaderSource,
    maximumPulseEvents: 16
  });
  const gl = visualRenderer.gl;
  if (!gl) {
    document.body.innerHTML = '<div class="webgl-error">Quartic Pulse requires a WebGL2-capable graphics driver.</div>';
    return;
  }
  const { ensureHdrExportTarget, releaseHdrExportTarget } = visualRenderer;
  const {
    defaultFrequencyBands,
    musicPersonalityProfiles,
    modulationSources,
    modulationTargets,
    modulationPresets,
    fractalEquationProfiles,
    fractalPresets,
    effectPresets,
    effectControlGroups,
    pulsePresets,
    experiencePresets,
    numericSliderConfigs,
    selectSettingConfigs,
    checkboxSettingDefaults
  } = visualSettingsCatalog;
  const maximumPulseEvents = 16;
  const audioModulationEngine = audioModulationEngineFactory.create({
    sources: modulationSources,
    targets: modulationTargets,
    presets: modulationPresets,
    clamp
  });

  const state = appStateFactory.create({
    defaultFrequencyBands,
    now: () => performance.now()
  });
  const audioModulationController = audioModulationControllerFactory.create({
    query: $,
    queryAll: (selector) => document.querySelectorAll(selector),
    documentRef: document,
    storage: localStorage,
    state,
    engine: audioModulationEngine,
    sources: modulationSources,
    targets: modulationTargets,
    visualCatalog,
    clamp,
    createMapping: createModulationMapping,
    onToast: showToast
  });
  const musicPersonalityController = musicPersonalityControllerFactory.create({
    query: $,
    state,
    profiles: musicPersonalityProfiles,
    defaultBands: defaultFrequencyBands,
    clamp,
    onProfileApplied: () => {
      if (audioSourceController.analyser) audioSourceController.analyser.smoothingTimeConstant = 0;
      resetBeatDetector({ keepTotal: true });
    },
    onRefreshAnalysis: () => songMapController.scheduleRefresh(),
    onToast: showToast
  });
  const visualPresetController = visualPresetControllerFactory.create({
    query: $,
    queryAll: (selector) => document.querySelectorAll(selector),
    state,
    effectPresets,
    effectControlGroups,
    pulsePresets,
    experiencePresets,
    equationProfiles: fractalEquationProfiles,
    sliderConfigs: numericSliderConfigs,
    storage: localStorage,
    requestFrame: requestAnimationFrame,
    onToast: showToast
  });
  let visualizerPackageController = null;

  const obsSynchronizedStateKeys = [
    'fractalType', 'visualStyle', 'zoom', 'iterations', 'flow', 'motion',
    'fractalDimensional', 'fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth',
    'equationFolding', 'equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio',
    'coreCStrength', 'coreBiasReal', 'coreBiasImag',
    'barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid', 'barStyle',
    'radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere',
    'pulseDensity', 'pulseSize', 'pulseCooldown', 'pulseJagged', 'pulseTrail', 'pulseDetail',
    'bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera', 'bulbYaw', 'bulbPitch',
    'spin', 'modulationRotationPhase', 'equation', 'equationSmoothing', 'visualTime', 'palette', 'reactivity', 'frequencyColorEnabled', 'frequencyColorAmount', 'frequencyHue',
    'bass', 'mids', 'highs', 'rms', 'beat',
    'musicClockBass', 'musicClockMids', 'musicClockHighs', 'musicClockRms', 'musicClockBeat',
    'equationBass', 'equationMids', 'equationHighs', 'equationBeat',
    'musicMotionBass', 'musicMotionMids', 'musicMotionHighs', 'musicMotionBeat',
    'musicBaselineBass', 'musicBaselineMids', 'musicBaselineHighs',
    'autoDrift', 'beatPulse', 'obsChromaKey', 'obsChromaThreshold',
    'modulationEnabled', 'showTransitionBlack', 'performanceBlackout',
    'nowPlayingEnabled', 'nowPlayingTitle', 'nowPlayingArtist', 'nowPlayingPosition', 'cameraMotionPreset'
    ,'songDirectorEnabled', 'songDirectorStyle', 'songDirectorBehavior', 'songDirectorTransition', 'songDirectorIntensity'
  ];
  let obsSyncFps = backgroundRenderPolicy.normalizeObsFps(pageParameters.get('fps'));
  let obsLastStateSent = 0;
  let obsRemoteAudioActive = false;
  let scheduledRenderDeadline = 0;

  function controlWindowBackgrounded() {
    return !isObsOutput && (document.hidden || !document.hasFocus() || (isSmokeTest && window.__quarticSimulateBackground === true));
  }

  function currentBackgroundRenderPolicy() {
    const simulatedBackground = isSmokeTest && window.__quarticSimulateBackground === true;
    return backgroundRenderPolicy.evaluate({
      isObsOutput,
      backgrounded: controlWindowBackgrounded(),
      keepMainVisualActive: isSmokeTest && !simulatedBackground,
      exporting: state.exporting,
      offlineExporting: state.offlineExporting,
      obsOutputOpen,
      obsSyncFps
    });
  }

  function scheduleNextRender(policy) {
    const targetFps = Number(policy?.targetFps) || 0;
    if (!targetFps) {
      scheduledRenderDeadline = 0;
      requestAnimationFrame(render);
      return;
    }
    const interval = 1000 / targetFps;
    const now = performance.now();
    if (!scheduledRenderDeadline || scheduledRenderDeadline < now - interval) scheduledRenderDeadline = now;
    scheduledRenderDeadline += interval;
    window.setTimeout(() => render(performance.now()), Math.max(0, scheduledRenderDeadline - performance.now()));
  }

  function createObsVisualSnapshot() {
    const snapshot = {};
    for (const key of obsSynchronizedStateKeys) snapshot[key] = state[key];
    snapshot.center = { x: state.center.x, y: state.center.y };
    snapshot.customColors = state.customColors.map((color) => [...color]);
    snapshot.spectrumData = Array.from(state.spectrumData);
    snapshot.waveformData = Array.from(state.waveformData);
    snapshot.pulseEvents = state.pulseEvents.map((event) => ({ ...event }));
    snapshot.modulationValues = { ...state.modulationValues };
    snapshot.modulationMappings = state.modulationMappings.map((mapping) => ({ ...mapping }));
    snapshot.songDirectorValues = { ...state.songDirectorValues };
    snapshot.audioActive = audioSourceController.isActive();
    snapshot.nowPlayingTitle = operatorTools.currentNowPlayingTitle();
    return snapshot;
  }

  function applyObsVisualSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    const previousVisualStyle = state.visualStyle;
    for (const key of obsSynchronizedStateKeys) {
      if (Object.hasOwn(snapshot, key)) state[key] = snapshot[key];
    }
    if (snapshot.center) state.center = { x: Number(snapshot.center.x), y: Number(snapshot.center.y) };
    if (Array.isArray(snapshot.customColors)) state.customColors = snapshot.customColors.map((color) => [...color]);
    if (Array.isArray(snapshot.spectrumData)) state.spectrumData.set(snapshot.spectrumData.slice(0, 64));
    if (Array.isArray(snapshot.waveformData)) state.waveformData.set(snapshot.waveformData.slice(0, 64));
    if (Array.isArray(snapshot.pulseEvents)) state.pulseEvents = snapshot.pulseEvents.map((event) => ({ ...event }));
    if (snapshot.modulationValues && typeof snapshot.modulationValues === 'object') state.modulationValues = { ...snapshot.modulationValues };
    if (Array.isArray(snapshot.modulationMappings)) state.modulationMappings = snapshot.modulationMappings.slice(0, 8).map(createModulationMapping);
    if (snapshot.songDirectorValues && typeof snapshot.songDirectorValues === 'object') state.songDirectorValues = { ...snapshot.songDirectorValues };
    obsRemoteAudioActive = Boolean(snapshot.audioActive);
    if (state.visualStyle !== previousVisualStyle) {
      $('#visualStyle').value = String(state.visualStyle);
      workspaceUi.updateVisualStyleOptions();
    }
    if (isObsOutput) {
      $('#showTransitionOverlay')?.classList.toggle('visible', Boolean(state.showTransitionBlack));
      document.body.classList.toggle('performance-blackout', Boolean(state.performanceBlackout));
      operatorTools.updateNowPlayingOverlay();
    }
  }

  if (isObsOutput) window.quarticDesktop.onObsVisualState(applyObsVisualSnapshot);


  function modulationAmountMinimum(target) {
    return audioModulationEngine.amountMinimum(target);
  }

  function createModulationMapping(values = {}) {
    return audioModulationEngine.createMapping(values);
  }

  function updateAudioModulation(delta) {
    if (isObsOutput) return state.modulationValues;
    const values = audioModulationEngine.update({
      enabled: state.modulationEnabled,
      mappings: state.modulationMappings,
      state,
      delta,
      styleId: state.visualStyle
    });
    state.modulationValues = values;
    window.__quarticModulationDiagnostics = {
      styleId: state.visualStyle,
      values: { ...values },
      routes: state.modulationMappings.map(({ source, target, current, output, compatible, enabled }) => ({ source, target, current, output, compatible, enabled }))
    };
    return values;
  }

  function modulationTargetIsRouted(...targets) {
    return audioModulationEngine.isTargetRouted({
      enabled: state.modulationEnabled,
      mappings: state.modulationMappings,
      styleId: state.visualStyle
    }, ...targets);
  }


  let liveExportCapture;
  let pendingOfflineRender = null;
  let lastExportPreflight = null;
  let toastTimer;

  const performanceController = performanceControllerFactory.create({
    query: $,
    onPrevious: () => performanceShowController.advance(-1),
    onPlayPause: () => $('#showPlayButton').click(),
    onNext: () => performanceShowController.advance(1),
    onToggleBlackout: () => performanceShowController.setBlackout(!state.performanceBlackout)
  });
  const exportController = exportControllerFactory.create({
    query: $,
    root: document.body,
    onEnd: endAndFinishExport,
    onCancel: cancelExport,
    onPause: togglePauseExport,
    onResolutionChange: (event) => coordinateExportSettingsChange('resolution', { announce: event.isTrusted }),
    onIterationsInput: (event) => coordinateExportSettingsChange('iterations', { value: event.target.value }),
    onFpsChange: () => coordinateExportSettingsChange('fps'),
    onModeChange: () => coordinateExportSettingsChange('mode'),
    onDetailChange: () => coordinateExportSettingsChange('detail'),
    onMatchLiveChange: (event) => coordinateExportSettingsChange('parity', { checked: event.target.checked }),
    onSamplingModeChange: (event) => coordinateExportSettingsChange('supersampling', { mode: event.target.value }),
    onSupersamplingChange: (event) => coordinateExportSettingsChange('supersampling', { checked: event.target.checked }),
    onFormatChange: () => coordinateExportSettingsChange('format'),
    onHdrChange: () => coordinateExportSettingsChange('hdr'),
    onScanEncoders: scanExportEncoderCapabilities,
    onBenchmark: benchmarkSelectedExportSettings,
    onAdvisorApply: applyExportAdvisorRecommendation,
    onClearHistory: clearExportHistory,
    onHistoryAction: handleExportHistoryAction,
    onRecoveryAction: handleExportRecoveryAction
  });
  const audioController = audioControllerFactory.create({
    query: $,
    audio,
    formatTime,
    getState: () => state,
    reportError: (error) => showToast(error?.message || String(error), true),
    onTogglePlayback: togglePlayback,
    onRestart: () => {
      audio.currentTime = 0;
      resetPulseEvents();
    },
    onSkip: (seconds) => {
      if (Number.isFinite(audio.duration) && !state.exporting) {
        audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
      }
    },
    onSeek: (time) => songMapController.updatePlayhead(time),
    onVolume: (value) => {
      state.monitorVolume = value;
      $('#volumeValue').value = `${Math.round(state.monitorVolume * 100)}%`;
      audioSourceController.updateMonitorGain();
    },
    onMute: () => {
      state.monitorMuted = !state.monitorMuted;
      $('#muteButton').setAttribute('aria-pressed', String(state.monitorMuted));
      $('#muteButton').textContent = state.monitorMuted ? 'UNMUTE MONITOR' : 'MUTE MONITOR';
      audioSourceController.updateMonitorGain();
    },
    onPlaybackRate: (value) => {
      audio.playbackRate = value;
      audio.defaultPlaybackRate = value;
    },
    onLoop: (enabled) => { audio.loop = enabled; }
  });
  const audioResponseEngine = audioResponseEngineFactory.create();
  const audioAnalysisEngine = audioAnalysisEngineFactory.create({ responseEngine: audioResponseEngine });
  const audioSourceController = audioSourceControllerFactory.create({
    query: $,
    documentRef: document,
    navigatorRef: navigator,
    state,
    audio,
    audioController,
    audioAnalysisEngine,
    desktop: window.quarticDesktop,
    storage: localStorage,
    resetPulseEvents,
    currentPlaylistItem,
    updateTrackControls,
    setPlayState,
    showToast
  });
  const offlineAudioAnalysisEngine = offlineAudioAnalysisEngineFactory.create({
    fftInPlace: audioFftEngine.fftInPlace,
    responseEngine: audioResponseEngine
  });
  const performanceSequencerEngine = performanceSequencerEngineFactory.create();
  const performanceShowDataEngine = performanceShowDataEngineFactory.create({
    createId: () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
  });
  const showComposerController = performanceShowComposerControllerFactory.create({
    query: $,
    documentRef: document,
    getModel: () => ({
      entries: state.showSequence,
      profiles: profileService.profiles,
      currentIndex: state.showIndex,
      playing: state.showPlaying,
      hasSongMap: Boolean(songMapController.activeMap?.sections?.length)
    }),
    formatTime,
    entryDuration: (entry) => performanceShowController.entryDuration(entry),
    sequenceDuration: () => performanceShowController.sequenceDuration(),
    entryStart: (index) => performanceShowController.entryStart(index),
    profileForEntry: (entry) => performanceShowController.profileForEntry(entry),
    sanitizeAutomation: (automation) => performanceShowController.sanitizeAutomation(automation),
    escapeMarkup: performanceShowControllerFactory.escapeMarkup,
    onBuild: () => showComposerOrchestrator.buildShowFromSongMap(),
    onPlay: () => $('#showPlayButton').click(),
    onAdd: () => showComposerOrchestrator.addComposerCue(),
    onSelect: (...args) => showComposerOrchestrator.handleComposerCueSelection(...args),
    onCommit: (...args) => showComposerOrchestrator.commitComposerCue(...args),
    onMove: (...args) => showComposerOrchestrator.moveComposerCue(...args),
    onSnap: (...args) => showComposerOrchestrator.snapComposerCueToSection(...args),
    onDelete: (...args) => showComposerOrchestrator.deleteComposerCue(...args),
    onReorder: (...args) => showComposerOrchestrator.reorderComposerCue(...args),
    onRecordingChange: (recording) => showToast(recording ? 'Automation recording armed. Live control changes will update the selected cue.' : 'Automation recording stopped.'),
    onRecordAutomation: (...args) => showComposerOrchestrator.recordComposerAutomation(...args),
    onRecordCamera: (...args) => showComposerOrchestrator.recordComposerCamera(...args),
    onOpenChange: () => requestAnimationFrame(setCanvasSize)
  });
  const performanceShowController = performanceShowControllerFactory.create({
    query: $,
    queryAll: (selector) => document.querySelectorAll(selector),
    documentRef: document,
    storage: localStorage,
    state,
    sequencer: performanceSequencerEngine,
    dataEngine: performanceShowDataEngine,
    performanceController,
    composerController: showComposerController,
    clamp,
    beatClock,
    getProfiles: () => profileService.profiles,
    createId: () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    requestFrame: requestAnimationFrame,
    isObsOutput,
    onApplyEntry: (profile, entry) => {
      profileService.apply(profile);
      showComposerOrchestrator.applyShowCueAutomation(entry);
    },
    onRenderComposer: () => showComposerOrchestrator.renderShowComposer(),
    onComposerPlayhead: (progress) => showComposerOrchestrator.updateComposerPlayhead(progress),
    onResize: setCanvasSize,
    onToast: showToast
  });
  const obsAutomationController = obsAutomationControllerFactory.create({
    query: $,
    storage: localStorage,
    getProfiles: () => profileService.profiles,
    applyProfile: (profile) => profileService.apply(profile),
    showToast
  });
  const profileManagerController = profileManagerControllerFactory.create({
    query: $,
    documentRef: document,
    getProfiles: () => profileService.profiles,
    findProfile: (profiles, id) => performanceShowDataEngine.findProfile(profiles, id),
    onSave: (options) => profileService.save(options),
    onQuickSave: () => profileService.quickSaveVisual(),
    onReset: () => workspaceUi.resetActiveVisual(),
    onApply: (profile, options) => profileService.apply(profile, options),
    onFavorite: (profile) => profileService.favorite(profile),
    onDelete: (profile) => profileService.remove(profile),
    onExport: (profile) => profileService.exportProfile(profile),
    onImport: (file) => profileService.importFile(file),
    onRendered: () => {
      performanceShowController.renderProfileOptions();
      obsAutomationController.renderProfileOptions();
    },
    onError: (message) => showToast(message, true)
  });
  const paletteLibraryController = paletteLibraryControllerFactory.create({
    container: $('#savedPaletteGrid'),
    section: $('#savedPaletteLibrary'),
    documentRef: document,
    getProfiles: () => profileService.profiles,
    onApply: (profile) => profileService.apply(profile)
  });
  const songMapDataEngine = songMapDataEngineFactory.create();
  const workspaceUi = workspaceUiControllerFactory.create({
    query: $,
    workspaceShell,
    state,
    visualCatalog,
    getVisualizerPackageController: () => visualizerPackageController,
    isObsOutput,
    updateExportHdrAvailability,
    fractalPresets,
    audioModulationController,
    coordinateExportSettingsChange,
    showToast,
    visualPresetController,
    effectPresets,
    paletteLibraryController
  });
  const profileService = profileServiceControllerFactory.create({
    query: $,
    documentRef: document,
    windowRef: window,
    storage: localStorage,
    desktop: window.quarticDesktop,
    state,
    dataEngine: performanceShowDataEngine,
    profileManagerController,
    paletteLibraryController,
    audioModulationController,
    visualCatalog,
    getVisualizerPackages: () => visualizerPackageController?.packages || [],
    setCustomColor: workspaceUi.setCustomColor,
    clamp,
    showToast
  });
  const songMapAnalysisEngine = songMapAnalysisEngineFactory.create({
    fftInPlace: audioFftEngine.fftInPlace
  });
  const songDirectorEngine = songDirectorEngineFactory.create({ hashText: songMapDataEngine.hashText });
  const songDirectorController = songDirectorControllerFactory.create({
    query: $,
    documentRef: document,
    state,
    audio,
    styles: songDirectorEngine.styles,
    behaviors: songDirectorEngine.behaviors,
    transitions: songDirectorEngine.transitions,
    clamp,
    formatTime,
    getActiveMap: () => songMapController.activeMap,
    getPlan: () => songMapController.directorPlan,
    setPlan: (plan) => { songMapController.directorPlan = plan; },
    generatePlan: (map) => songMapController.generateDirectorPlan(map),
    resolveBehavior: (map) => songMapController.resolveDirectorBehavior(map),
    getOverride: (index) => songMapController.directorOverrideFor(index),
    writeOverride: (index, override) => songMapController.writeDirectorOverride(index, override),
    updateSongMapPlayhead: (time) => songMapController.updatePlayhead(time),
    updateDirector: (time) => songMapController.updateDirector(time),
    getDirectorTime: () => state.offlineExporting ? (state.offlineCurrentTime || 0) : audio.currentTime,
    showToast
  });
  const songMapController = songMapControllerFactory.create({
    query: $,
    documentRef: document,
    windowRef: window,
    storage: localStorage,
    state,
    audio,
    dataEngine: songMapDataEngine,
    analysisEngine: songMapAnalysisEngine,
    directorEngine: songDirectorEngine,
    directorController: songDirectorController,
    audioSourceController,
    musicPersonalityController,
    musicPersonalityProfiles,
    currentPlaylistItem,
    tryRestorePendingMap: () => performancePackageController.tryRestorePendingMap(),
    renderComposer: () => showComposerOrchestrator.renderShowComposer(),
    composerInitialized: () => showComposerController.initialized,
    clamp,
    formatTime,
    showToast,
    isObsOutput
  });
  const showComposerOrchestrator = showComposerOrchestratorFactory.create({
    state,
    audio,
    profileService,
    performanceShowController,
    showComposerController,
    songMapDataEngine,
    songMapController,
    workspaceUi,
    clamp,
    showToast,
    isSmokeTest
  });
  const performancePackageEngine = performancePackageEngineFactory.create({
    appVersion: appMetadata.version,
    hashText: songMapDataEngine.hashText,
    sanitizeEntry: (entry) => performanceShowController.sanitizeEntry(entry),
    isValidProfile: (profile) => profileService.isValid(profile),
    isValidSongMap: (map) => songMapController.isValidMap(map),
    createId: () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
  });
  const performancePackageController = performancePackageSessionControllerFactory.create({
    query: $,
    documentRef: document,
    windowRef: window,
    storage: localStorage,
    desktop: window.quarticDesktop,
    state,
    audio,
    packageEngine: performancePackageEngine,
    songMapDataEngine,
    songMapController,
    performanceShowController,
    getProfiles: () => profileService.profiles,
    setProfiles: (profiles) => profileService.replace(profiles),
    persistProfiles: () => profileService.persist(),
    renderProfiles: (preferredId) => profileService.render(preferredId),
    captureProfileData: (kind) => profileService.capture(kind),
    applyProfile: (profile, options) => profileService.apply(profile, options),
    isValidProfile: (profile) => profileService.isValid(profile),
    currentPlaylistItem,
    selectPlaylistIndex,
    clamp,
    showToast,
    isObsOutput,
    isSmokeTest
  });
  const exportSessionEngine = exportSessionEngineFactory.create();
  const exportProgressWorkflowEngine = exportProgressWorkflowEngineFactory.create({
    sessionEngine: exportSessionEngine,
    formatTime,
    fileName: exportedFileName
  });
  const exportProgressCoordinator = exportProgressCoordinatorFactory.create({
    workflow: exportProgressWorkflowEngine,
    controller: exportController,
    shouldPlayStinger: () => Boolean($('#exportCompleteSound')?.checked),
    playStinger: playExportCompleteStinger,
    isExporting: () => state.exporting
  });
  exportProgressCoordinator.bindNative((callback) => window.quarticDesktop.onExportProgress?.(callback));
  const exportEncoderEngine = exportEncoderEngineFactory.create();
  const exportLiveCaptureEngine = exportLiveCaptureEngineFactory.create({ encoderEngine: exportEncoderEngine });
  const exportQuickClipWorkflowEngine = exportQuickClipWorkflowEngineFactory.create();
  const exportSamplingEngine = exportSamplingEngineFactory.create();
  const exportSettingsSnapshotEngine = exportSettingsSnapshotEngineFactory.create({
    profiles: exportProfileCatalog,
    samplingEngine: exportSamplingEngine
  });
  const exportPreparationEngine = exportPreparationEngineFactory.create();
  const exportFrameCaptureEngine = exportFrameCaptureEngineFactory.create({
    gl,
    samplingEngine: exportSamplingEngine,
    requestFrame: requestOfflineVisualFrame,
    onSampleState: ({ sampleIndex, offset }) => {
      state.offlineSamplePass = sampleIndex;
      state.exportSampleOffsetX = offset[0];
      state.exportSampleOffsetY = offset[1];
    }
  });
  const exportPlanningEngine = exportPlanningEngineFactory.create({ profiles: exportProfileCatalog });
  const exportPresentationEngine = exportPresentationEngineFactory.create({
    profiles: exportProfileCatalog,
    planningEngine: exportPlanningEngine,
    formatTime,
    fileName: exportedFileName
  });
  const exportPreflightEngine = exportPreflightEngineFactory.create({
    encoderEngine: exportEncoderEngine,
    samplingEngine: exportSamplingEngine
  });
  const exportAdvisorEngine = exportAdvisorEngineFactory.create();
  const exportSettingsCoordinatorEngine = exportSettingsCoordinatorEngineFactory.create({
    advisorEngine: exportAdvisorEngine
  });
  const exportRuntimeStateCoordinator = exportRuntimeStateCoordinatorFactory.create({ state });
  const exportEncoderScanEngine = exportEncoderScanEngineFactory.create();
  const exportBenchmarkEngine = exportBenchmarkEngineFactory.create({ planningEngine: exportPlanningEngine });
  const exportHistoryEngine = exportHistoryEngineFactory.create({
    storage: localStorage,
    createId: () => crypto.randomUUID(),
    now: () => new Date().toISOString()
  });
  const exportResultWorkflowEngine = exportResultWorkflowEngineFactory.create({
    historyEngine: exportHistoryEngine,
    sessionEngine: exportSessionEngine
  });
  const exportHistoryActionEngine = exportHistoryActionEngineFactory.create({ historyEngine: exportHistoryEngine });
  const exportRecoveryEngine = exportRecoveryEngineFactory.create({ sessionEngine: exportSessionEngine });
  const exportRenderCoordinator = exportRenderCoordinatorFactory.create();
  const exportWorkflowEngine = exportWorkflowEngineFactory.create();
  const exportOfflineLifecycle = exportOfflineLifecycleFactory.create({
    sessionEngine: exportSessionEngine,
    finishOfflineExport: (...args) => window.quarticDesktop.finishOfflineExport(...args),
    abortOfflineExport: (...args) => window.quarticDesktop.abortOfflineExport(...args)
  });
  const exportLiveLifecycle = exportLiveLifecycleFactory.create({
    sessionEngine: exportSessionEngine,
    abortExport: (...args) => window.quarticDesktop.abortExport(...args)
  });
  const exportCommandCoordinator = exportCommandCoordinatorFactory.create({
    sessionEngine: exportSessionEngine,
    progressWorkflow: exportProgressWorkflowEngine,
    liveLifecycle: exportLiveLifecycle
  });
  const exportJobCoordinator = exportJobCoordinatorFactory.create({
    offlineLifecycle: exportOfflineLifecycle,
    liveLifecycle: exportLiveLifecycle,
    buildOfflineJob: createOfflineExportJob,
    buildLiveJob: createLiveExportJob,
    validateLive: () => {
      if (!state.unleashedMode) throw new Error('Live export requires Unleashed mode. Use Offline export for exact frames.');
      return Boolean(audio.src);
    }
  });
  const operatorTools = operatorToolsControllerFactory.create({
    query: $,
    state,
    storage: localStorage,
    desktop: window.quarticDesktop,
    profileService,
    cameraControllerFactory,
    canvas,
    combinedRenderModulation,
    updateZoomControls: workspaceUi.updateZoomControls,
    exportQuickClipWorkflowEngine,
    audioSourceController,
    exportLiveCaptureEngine,
    performanceAnalysisEngine,
    coordinateExportSettingsChange,
    gl,
    clamp,
    formatByteSize,
    showToast,
    isObsOutput
  });
  const cameraController = operatorTools.cameraController;
  window.__quarticControllers = Object.freeze({ audio: audioController, audioSource: audioSourceController, modulation: audioModulationController, musicPersonality: musicPersonalityController, visualPresets: visualPresetController, workspaceUi, performance: performanceController, performanceShow: performanceShowController, showComposer: showComposerController, showComposerOrchestrator, profileManager: profileManagerController, profileService, paletteLibrary: paletteLibraryController, performancePackage: performancePackageController, songMap: songMapController, songDirector: songDirectorController, obsAutomation: obsAutomationController, operatorTools, camera: cameraController, export: exportController });
  window.__quarticEngines = Object.freeze({
    audioResponse: audioResponseEngine,
    audioAnalysis: audioAnalysisEngine,
    offlineAudioAnalysis: offlineAudioAnalysisEngine,
    performanceSequencer: performanceSequencerEngine,
    performanceShowData: performanceShowDataEngine,
    audioFft: audioFftEngine,
    songMapData: songMapDataEngine,
    songMapAnalysis: songMapAnalysisEngine,
    songDirector: songDirectorEngine,
    performancePackage: performancePackageEngine,
    exportSession: exportSessionEngine,
    exportProgressWorkflow: exportProgressWorkflowEngine,
    exportProgressCoordinator,
    exportCommandCoordinator,
    exportJobCoordinator,
    exportResultWorkflow: exportResultWorkflowEngine,
    exportEncoder: exportEncoderEngine,
    exportLiveCapture: exportLiveCaptureEngine,
    exportQuickClipWorkflow: exportQuickClipWorkflowEngine,
    exportSampling: exportSamplingEngine,
    exportSettingsSnapshot: exportSettingsSnapshotEngine,
    exportPreparation: exportPreparationEngine,
    exportFrameCapture: exportFrameCaptureEngine,
    exportPlanning: exportPlanningEngine,
    exportPresentation: exportPresentationEngine,
    exportPreflight: exportPreflightEngine,
    exportAdvisor: exportAdvisorEngine,
    exportSettingsCoordinator: exportSettingsCoordinatorEngine,
    exportRuntimeState: exportRuntimeStateCoordinator,
    exportEncoderScan: exportEncoderScanEngine,
    exportBenchmark: exportBenchmarkEngine,
    exportHistory: exportHistoryEngine,
    exportHistoryAction: exportHistoryActionEngine,
    exportRecovery: exportRecoveryEngine,
    exportRenderCoordinator,
    exportWorkflow: exportWorkflowEngine,
    exportOfflineLifecycle,
    exportLiveLifecycle
  });

  function resetPulseEvents() {
    state.pulseEvents.length = 0;
    state.pulsePreviousLevels.fill(0);
    state.pulseLastLevels.fill(0);
    state.pulseArmed.fill(true);
    state.pulseCooldowns.fill(0);
    state.pulseGlobalCooldown = 0;
    state.pulseAcceptedTotal = 0;
    audioResponseEngine.resetClocks(state);
    resetEquationAudioEnvelope();
    resetBeatDetector();
  }

  function resetExportAudioVisualState() {
    audioResponseEngine.reset(state);
    state.beat = 0;
    state.autoReactivityGain = 1;
    resetPulseEvents();
  }

  function resetEquationAudioEnvelope() {
    state.equationBass = 0;
    state.equationMids = 0;
    state.equationHighs = 0;
    state.equationBeat = 0;
    state.musicMotionBass = 0;
    state.musicMotionMids = 0;
    state.musicMotionHighs = 0;
    state.musicMotionBeat = 0;
    state.musicBaselineBass = 0;
    state.musicBaselineMids = 0;
    state.musicBaselineHighs = 0;
  }

  function resetBeatDetector({ keepTotal = false } = {}) {
    audioAnalysisEngine.resetBeatDetector(state, { keepTotal });
  }

  function updateAdaptiveBeatDetector(lowEnergy, lowMidEnergy, delta, { register = true } = {}) {
    const detectedBeat = audioAnalysisEngine.updateBeatDetector(state, lowEnergy, lowMidEnergy, delta, {
      register,
      onBeat: registerDetectedBeat
    });
    const diagnostics = audioAnalysisEngine.diagnostics.beat;
    window.__quarticPulseBeatDetectedTotal = state.beatDetectedTotal;
    window.__quarticPulseBeatEnergy = diagnostics.energy;
    window.__quarticPulseBeatOnset = diagnostics.onset;
    window.__quarticPulseBeatThreshold = diagnostics.threshold;
    return detectedBeat;
  }

  function activePulseEventLimit() {
    return Math.min(maximumPulseEvents, Math.max(1, Math.ceil(clamp(state.pulseDensity, 0, 1) * 4)));
  }

  function advancePulseEvents(delta) {
    const playbackRate = audioSourceController.isActive() ? 1 : .18;
    for (const event of state.pulseEvents) event.age += delta * playbackRate;
    state.pulseEvents = state.pulseEvents.filter((event) => event.age < 4.6);
    for (let band = 0; band < 3; band++) {
      state.pulseCooldowns[band] = Math.max(0, state.pulseCooldowns[band] - delta);
    }
    state.pulseGlobalCooldown = Math.max(0, state.pulseGlobalCooldown - delta);
  }

  function createMusicPulseEvents(levels) {
    const density = clamp(state.pulseDensity, 0, 1);
    const sensitivityMultiplier = 1.55 - density * .65;
    const thresholds = [.030, .024, .018];
    const minimumLevels = [.075, .055, .040];
    const cooldowns = [.36, .30, .24];
    const candidates = [];
    for (let band = 0; band < 3; band++) {
      const level = levels[band];
      const baseline = state.pulsePreviousLevels[band];
      const lastLevel = state.pulseLastLevels[band];
      const onset = Math.max(0, level - baseline);
      const localRise = Math.max(0, level - lastLevel);
      const threshold = thresholds[band] * sensitivityMultiplier;
      const bassHit = band === 0 && (state.beat > .25 || localRise >= .0025);
      if (!state.pulseArmed[band]
        && (level < lastLevel - .0015 || level <= baseline + threshold * 1.50)) state.pulseArmed[band] = true;
      const transientReady = state.pulseArmed[band] && onset >= threshold;
      const triggered = density > 0 && state.pulseArmed[band] && state.pulseCooldowns[band] <= 0
        && level >= minimumLevels[band]
        && (transientReady || bassHit);
      if (triggered) {
        candidates.push({
          band,
          bassHit,
          intensity: clamp(level + onset * 2.2 + (bassHit ? state.beat * .20 : 0), .16, 1),
          score: onset / threshold + level * .75 + (bassHit ? 1.8 : 0)
        });
      }
      const baselineResponse = level > baseline ? .025 : .14;
      state.pulsePreviousLevels[band] += (level - baseline) * baselineResponse;
      state.pulseLastLevels[band] = level;
    }

    if (state.pulseGlobalCooldown > 0 || candidates.length === 0) return;
    candidates.sort((first, second) => second.score - first.score);
    const chosen = candidates[0];
    state.pulseEvents.push({
      age: 0,
      band: chosen.band,
      strength: chosen.intensity,
      seed: state.pulseAcceptedTotal + 1 + chosen.band * .37
    });
    state.pulseAcceptedTotal += 1;
    const eventLimit = activePulseEventLimit();
    if (state.pulseEvents.length > eventLimit) {
      state.pulseEvents.splice(0, state.pulseEvents.length - eventLimit);
    }
    // Collapse simultaneous low/mid/high attacks into the single strongest event.
    for (const candidate of candidates) state.pulseArmed[candidate.band] = false;
    state.pulseCooldowns[chosen.band] = cooldowns[chosen.band] * state.pulseCooldown;
    state.pulseGlobalCooldown = (1.10 - density * .80) * state.pulseCooldown;
  }

  function updateAudioAnalysis(delta) {
    const result = audioAnalysisEngine.update(state, {
      active: Boolean(audioSourceController.analyser && audioSourceController.isActive()),
      delta,
      bands: musicPersonalityController.getBands(),
      onBeat: registerDetectedBeat,
      onPulse: createMusicPulseEvents
    });
    window.__quarticPulseBeatDetectedTotal = state.beatDetectedTotal;
    window.__quarticPulseBeatEnergy = result.beat.energy;
    window.__quarticPulseBeatOnset = result.beat.onset;
    window.__quarticPulseBeatThreshold = result.beat.threshold;
  }

  function updateEquationAudioEnvelope(delta) {
    const smoothing = clamp(Number(state.equationSmoothing) || 0, 0, 1);
    const smoothingCurve = smoothing * smoothing;
    const frameDelta = clamp(Number(delta) || 0, 1 / 240, .1);
    const shaped = (value) => Math.pow(clamp(Number(value) || 0, 0, 1), 1.45);
    const compressed = (value) => Math.pow(clamp(Number(value) || 0, 0, 1), .78);
    const follow = (current, target, attackBase, releaseBase) => {
      const timeConstant = target > current
        ? attackBase + .32 * smoothingCurve
        : releaseBase + .58 * smoothingCurve;
      return current + (target - current) * (1 - Math.exp(-frameDelta / timeConstant));
    };
    const followMotion = (current, target, attackBase, releaseBase) => {
      // Even at maximum equation smoothing, rhythmic motion remains legible.
      // The release is deliberately longer than the attack so hits become
      // flowing gestures instead of single-frame jumps.
      const timeConstant = target > current
        ? attackBase + .075 * smoothingCurve
        : releaseBase + .20 * smoothingCurve;
      return current + (target - current) * (1 - Math.exp(-frameDelta / timeConstant));
    };
    const followBaseline = (current, target, seconds) => current
      + (target - current) * (1 - Math.exp(-frameDelta / seconds));

    const bassBody = compressed(state.bass);
    const midsBody = compressed(state.mids);
    const highsBody = compressed(state.highs);
    state.musicBaselineBass = followBaseline(state.musicBaselineBass, bassBody, 1.35);
    state.musicBaselineMids = followBaseline(state.musicBaselineMids, midsBody, 1.55);
    state.musicBaselineHighs = followBaseline(state.musicBaselineHighs, highsBody, 1.15);

    const bassAccent = clamp((bassBody - state.musicBaselineBass) * 2.65, 0, 1);
    const midsAccent = clamp((midsBody - state.musicBaselineMids) * 2.35, 0, 1);
    const highsAccent = clamp((highsBody - state.musicBaselineHighs) * 2.15, 0, 1);
    const bassMotionTarget = clamp(bassBody * .30 + bassAccent * .70, 0, 1);
    const midsMotionTarget = clamp(midsBody * .34 + midsAccent * .66, 0, 1);
    const highsMotionTarget = clamp(highsBody * .24 + highsAccent * .58, 0, .82);
    const beatMotionTarget = clamp(Math.pow(clamp(state.beat, 0, 1), .82) * .72, 0, .72);

    state.equationBass = follow(state.equationBass, shaped(state.bass), .045, .12);
    state.equationMids = follow(state.equationMids, shaped(state.mids), .050, .14);
    state.equationHighs = follow(state.equationHighs, shaped(state.highs), .055, .16);
    state.equationBeat = follow(state.equationBeat, shaped(state.beat) * .55, .035, .18);
    state.musicMotionBass = followMotion(state.musicMotionBass, bassMotionTarget, .040, .18);
    state.musicMotionMids = followMotion(state.musicMotionMids, midsMotionTarget, .055, .24);
    state.musicMotionHighs = followMotion(state.musicMotionHighs, highsMotionTarget, .045, .16);
    state.musicMotionBeat = followMotion(state.musicMotionBeat, beatMotionTarget, .030, .20);
  }

  function beatClock() {
    return performance.now() / 1000;
  }

  function registerDetectedBeat() {
    const now = beatClock();
    const times = state.detectedBeatTimes;
    if (times.length && now - times[times.length - 1] < .18) return;
    times.push(now);
    if (times.length > 18) times.shift();
    if (times.length < 3) return;
    const intervals = [];
    for (let index = 1; index < times.length; index++) {
      let interval = times[index] - times[index - 1];
      while (interval < .3) interval *= 2;
      while (interval > 1) interval /= 2;
      if (interval >= .3 && interval <= 1) intervals.push(interval);
    }
    if (intervals.length < 2) return;
    const sorted = [...intervals].sort((first, second) => first - second);
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviations = intervals.map((interval) => Math.abs(interval - median));
    const averageDeviation = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
    state.detectedBpm += (clamp(60 / median, 60, 200) - state.detectedBpm) * .32;
    state.bpmConfidence = clamp((intervals.length / 10) * (1 - averageDeviation / Math.max(.01, median) * 4), 0, 1);
    if (state.bpmConfidence >= .18) {
      const position = (now - state.beatGridAnchor - state.beatOffsetMs / 1000) * state.detectedBpm / 60;
      const phaseError = position - Math.round(position);
      state.beatGridAnchor += phaseError * 60 / state.detectedBpm * .35;
    }
  }


  function setCanvasSize() {
    visualRenderer.resize({
      exporting: state.exporting,
      exportWidth: state.exportWidth,
      exportHeight: state.exportHeight,
      performanceScale: state.performanceScale,
      stageWidth: stage.clientWidth,
      stageHeight: stage.clientHeight,
      devicePixelRatio: window.devicePixelRatio
    });
  }


  if (new URLSearchParams(window.location.search).get('smoke') === '1') {
    window.__quarticHdrExportReady = ensureHdrExportTarget(64, 64);
    releaseHdrExportTarget();
  }


  function combinedRenderModulation(base = {}, director = {}) {
    const combined = { ...base };
    for (const [key, value] of Object.entries(director)) {
      if (!Number.isFinite(value) || ['cueIndex', 'sectionProgress', 'phraseEnergy', 'phraseContour', 'phraseProgress', 'rotationOffset', 'panX', 'panY'].includes(key)) continue;
      combined[key] = clamp((combined[key] || 0) + value, -2, 2);
    }
    combined.rotationOffset = Number(director.rotationOffset) || 0;
    combined.panX = Number(director.panX) || 0;
    combined.panY = Number(director.panY) || 0;
    return combined;
  }

  function render(now) {
    const renderPolicy = currentBackgroundRenderPolicy();
    const rawDelta = Math.max(0, (now - state.lastFrame) / 1000);
    if (state.offlineExporting && !pendingOfflineRender) {
      state.lastFrame = now;
      scheduleNextRender(renderPolicy);
      return;
    }
    const secondaryOfflineSample = state.offlineExporting && state.offlineSamplePass > 0;
    const delta = state.offlineExporting
      ? (secondaryOfflineSample ? 0 : 1 / state.offlineFps)
      : Math.min(.05, rawDelta);
    state.lastFrame = now;
    if (!state.offlineExporting && renderPolicy.collectPerformance) operatorTools.collectPerformanceSample(rawDelta * 1000, now);
    if (!isObsOutput && !state.offlineExporting) cameraController.updatePath(now);
    if (renderPolicy.collectPerformance && rawDelta < .25) {
      state.frameTime += (Math.min(50, rawDelta * 1000) - state.frameTime) * .045;
    }
    const targetFrameTime = 1000 / (renderPolicy.targetFps || 60);
    if (renderPolicy.collectPerformance && !state.exporting && state.adaptiveQuality) {
      if (state.frameTime > targetFrameTime * 1.38) state.performanceScale = Math.max(.62, state.performanceScale - delta * .16);
      else if (state.frameTime < targetFrameTime * 1.08) state.performanceScale = Math.min(1, state.performanceScale + delta * .07);
    } else if (renderPolicy.collectPerformance && !state.exporting) {
      state.performanceScale = Math.min(1, state.performanceScale + delta * .8);
    }
    if (renderPolicy.drawVisual) setCanvasSize();
    const customVisualizerActive = Boolean(visualizerPackageController?.isCustom(state.visualStyle));
    const renderingTenBitExport = renderPolicy.drawVisual
      ? visualRenderer.beginFrame(!customVisualizerActive && state.offlineExporting && state.offlineTenBitExport)
      : false;
    if (!secondaryOfflineSample) advancePulseEvents(delta);
    if (!isObsOutput && !state.offlineExporting) updateAudioAnalysis(delta);
    if (!secondaryOfflineSample) {
      updateEquationAudioEnvelope(delta);
      if (!isObsOutput) audioResponseEngine.advanceClocks(state, delta);
    }

    if (!state.offlineExporting) {
      const deckTimeAvailable = state.audioMode === 'deck'
        && Boolean(currentPlaylistItem())
        && Number.isFinite(audio.currentTime);
      state.visualTime = deckTimeAvailable
        ? audio.currentTime
        : state.visualTime + delta * ((isObsOutput ? obsRemoteAudioActive : audioSourceController.isActive()) ? 1 : .18);
    }
    const baseModulation = secondaryOfflineSample && state.offlineBaseModulation
      ? state.offlineBaseModulation
      : updateAudioModulation(delta);
    if (state.offlineExporting && !secondaryOfflineSample) state.offlineBaseModulation = baseModulation;
    const directorTime = state.offlineExporting
      ? (state.offlineCurrentTime || 0)
      : (state.audioMode === 'deck' && Number.isFinite(audio.currentTime) ? audio.currentTime : state.visualTime);
    const director = isObsOutput ? (state.songDirectorValues || {}) : songMapController.updateDirector(directorTime);
    const modulation = combinedRenderModulation(baseModulation, director);
    const cameraMotion = cameraController.presetTransform();
    // Matrix routes are additive modifiers. Enabling the matrix must not mute
    // the built-in fractal and Mandelbulb audio response when routes are empty
    // or target only one visual parameter.
    const matrixOwnsFractalAudio = false;
    const directBass = state.bass;
    const directMids = state.mids;
    const directHighs = state.highs;
    const directRms = state.rms;
    const directBeat = state.beat;
    const musicClockBass = state.musicClockBass;
    const musicClockMids = state.musicClockMids;
    const musicClockHighs = state.musicClockHighs;
    const musicClockRms = state.musicClockRms;
    const musicClockBeat = state.musicClockBeat;
    const equationBass = state.equationBass;
    const equationMids = state.equationMids;
    const equationHighs = state.equationHighs;
    const equationBeat = state.equationBeat;
    const musicMotionBass = state.musicMotionBass;
    const musicMotionMids = state.musicMotionMids;
    const musicMotionHighs = state.musicMotionHighs;
    const musicMotionBeat = state.musicMotionBeat;
    window.__quarticFractalAudioDiagnostics = {
      matrixOwnsFractalAudio,
      directBass,
      directMids,
      directHighs,
      equationBass,
      equationMids,
      equationHighs,
      equationBeat
    };
    const routedDimensional = modulationTargetIsRouted('fractalTilt', 'fractalSlice');
    const routedFolding = modulationTargetIsRouted('equationFold', 'equationWarp');
    const beatChanged = (isObsOutput || state.offlineExporting) ? false : performanceShowController.updateBeatGrid();
    if (!isObsOutput && !state.offlineExporting) performanceShowController.update(beatChanged);
    if (!isObsOutput && !state.offlineExporting && obsOutputOpen && now - obsLastStateSent >= 1000 / obsSyncFps) {
      window.quarticDesktop.publishObsVisualState(createObsVisualSnapshot());
      obsLastStateSent = now;
    }
    const modulatedMotion = clamp(state.motion + (modulation.motion || 0), 0, 4);
    const modulatedZoom = Math.max(.15, 1 + (modulation.zoom || 0));
    const motionEnergy = modulatedMotion * (.32 + directRms * .34 + directMids * .26);
    const orbitRadius = state.autoDrift ? (.012 + .022 * directMids) * motionEnergy / Math.sqrt(state.zoom * modulatedZoom) : 0;
    const orbitAngle = (state.visualTime * .21 + musicClockMids * .12) * Math.sign(state.spin || 1);
    const renderCenterX = state.center.x + Math.cos(orbitAngle) * orbitRadius + cameraMotion.x + modulation.panX;
    const renderCenterY = state.center.y + Math.sin(orbitAngle * 1.17) * orbitRadius + cameraMotion.y + modulation.panY;
    if (!isObsOutput && !secondaryOfflineSample) {
      const nextModulationRotationPhase = state.modulationRotationPhase + (modulation.rotation || 0) * delta;
      state.modulationRotationPhase = Math.atan2(Math.sin(nextModulationRotationPhase), Math.cos(nextModulationRotationPhase));
    }
    const rotation = state.visualTime * state.spin * modulatedMotion
      + Math.sin(state.visualTime * .63) * .035 * directMids * modulatedMotion
      + state.modulationRotationPhase
      + modulation.rotationOffset;
    if (Number.isFinite(window.__quarticPulseRotation)) {
      const rotationDelta = Math.atan2(Math.sin(rotation - window.__quarticPulseRotation), Math.cos(rotation - window.__quarticPulseRotation));
      window.__quarticPulseMaxRotationStep = Math.max(Number(window.__quarticPulseMaxRotationStep || 0), Math.abs(rotationDelta));
    }
    window.__quarticPulseRotation = rotation;

    const rendererFrame = {
      state,
      modulation,
      renderCenterX,
      renderCenterY,
      cameraZoom: cameraMotion.zoom,
      modulatedZoom,
      modulatedMotion,
      routedDimensional,
      routedFolding,
      matrixOwnsFractalAudio,
      rotation,
      renderingTenBitExport,
      isObsOutput,
      showExportPreview: Boolean($('#showExportPreview')?.checked),
      activePulseEventLimit: activePulseEventLimit(),
      direct: {
        directBass,
        directMids,
        directHighs,
        directRms,
        directBeat,
        musicClockBass,
        musicClockMids,
        musicClockHighs,
        musicClockRms,
        musicClockBeat,
        equationBass,
        equationMids,
        equationHighs,
        equationBeat,
        musicMotionBass,
        musicMotionMids,
        musicMotionHighs,
        musicMotionBeat
      }
    };
    if (renderPolicy.drawVisual) {
      if (customVisualizerActive) {
        window.__quarticCustomVisualizerDiagnostics = visualizerPackageController.render({
          timestampSeconds: state.visualTime,
          deltaSeconds: delta,
          bass: directBass,
          mids: directMids,
          highs: directHighs,
          rms: directRms,
          beat: state.beatPulse ? directBeat : 0,
          spectrum: state.spectrumData
        });
      } else visualRenderer.drawFrame(rendererFrame);
    }
    if (pendingOfflineRender && state.offlineExporting) {
      if (customVisualizerActive) visualizerPackageController.finish();
      else visualRenderer.finish();
      const resolveOfflineRender = pendingOfflineRender;
      pendingOfflineRender = null;
      resolveOfflineRender();
    }
    if (renderPolicy.drawVisual) operatorTools.resolvePendingScreenshot();
    window.__quarticReady = true;
    window.__quarticBackgroundRenderDiagnostics = {
      controlOnly: renderPolicy.controlOnly,
      drawVisual: renderPolicy.drawVisual,
      targetFps: renderPolicy.targetFps,
      obsOutputOpen,
      backgrounded: controlWindowBackgrounded()
    };

    if (renderPolicy.updateInterface && (!state.exporting || now - state.lastUiUpdate >= 100)) {
      updateUiMeters();
      state.lastUiUpdate = now;
    }
    scheduleNextRender(renderPolicy);
  }

  function updateUiMeters() {
    const values = [state.bass, state.mids, state.highs];
    ['bass','mid','high'].forEach((name, index) => {
      const percent = Math.round(values[index] * 100);
      $(`#${name}Meter`).style.width = `${percent}%`;
      $(`#${name}Value`).value = `${percent}%`;
    });
    const displayedScale = Math.round(state.performanceScale * 20) * 5;
    $('#adaptiveQualityText').textContent = `${displayedScale}% render scale`;
    $('#autoReactivityText').textContent = state.autoReactivity
      ? `Target ${Math.round(state.autoReactivityTarget * 100)}% · ${state.autoReactivityGain.toFixed(2)}× gain`
      : 'Manual sensitivity only';
    $('#frequencyColorMarker').style.left = `${Math.max(0, Math.min(100, state.frequencyHue * 100))}%`;
    $('#dominantFrequencyValue').textContent = state.dominantBand.toUpperCase();
    audioModulationController.updateMeters();
    performanceShowController.updateBeatGridUi();
    cameraController.updateUi();
    operatorTools.updatePerformanceAssistantUi();
    updateVisualIntensityMeter();
    if (state.audioMode === 'deck' && Number.isFinite(audio.duration)) {
      const offlineSessionActive = state.exporting && exportSessionEngine.mode === 'offline';
      const displayTime = offlineSessionActive ? (state.offlineCurrentTime || 0) : audio.currentTime;
      const progress = audioController.renderTimeline(displayTime, audio.duration);
      songMapController.updatePlayhead(displayTime);
      const liveRecordingActive = state.exporting
        && exportSessionEngine.mode === 'live'
        && liveExportCapture?.state === 'recording';
      if (liveRecordingActive) {
        const overall = progress * .80;
        exportProgressCoordinator.update(
          overall,
          `Live recording ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}% | ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`,
          `Live recording ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}%`
        );
      }
    }
  }

  let visualIntensityDisplayScore = null;
  let visualIntensityDisplayedPercent = null;
  let visualIntensityDisplayedLevel = 'calm';
  let visualIntensityLastSampleAt = 0;
  let visualIntensityLastPaintAt = 0;

  function stableVisualIntensityLevel(score) {
    if (visualIntensityDisplayedLevel === 'intense') {
      if (score >= .64) return 'intense';
      return score >= .35 ? 'active' : 'calm';
    }
    if (visualIntensityDisplayedLevel === 'active') {
      if (score >= .70) return 'intense';
      return score >= .35 ? 'active' : 'calm';
    }
    if (score >= .70) return 'intense';
    return score >= .40 ? 'active' : 'calm';
  }

  function updateVisualIntensityMeter() {
    const card = $('#visualIntensityCard');
    if (!card) return;
    const reactivity = clamp(state.reactivity / 3, 0, 1);
    const motion = clamp(Math.abs(state.motion) / 2.5, 0, 1);
    const equation = clamp(Number($('#equationMod')?.value || 0) / 1.5, 0, 1);
    const folding = state.equationFolding
      ? clamp((Number($('#equationFold')?.value || 0) + Number($('#equationWarp')?.value || 0) / 1.5 + Number($('#equationFoldAudio')?.value || 0)) / 3, 0, 1)
      : 0;
    const color = state.frequencyColorEnabled ? clamp(state.frequencyColorAmount || 0, 0, 1) : 0;
    const liveEnergy = clamp((state.rms * .55) + (state.beat * .45), 0, 1);
    const beatWeight = $('#beatPulse')?.checked ? .11 : 0;
    const rawScore = clamp(
      reactivity * .26 + motion * .18 + equation * .21 + folding * .16 + color * .08 + liveEnergy * .11 + beatWeight,
      0,
      1
    );

    const now = performance.now();
    if (visualIntensityDisplayScore === null) {
      visualIntensityDisplayScore = rawScore;
    } else {
      const elapsed = clamp((now - visualIntensityLastSampleAt) / 1000, 1 / 240, .25);
      const timeConstant = rawScore > visualIntensityDisplayScore ? .45 : 2.2;
      const envelopeAmount = 1 - Math.exp(-elapsed / timeConstant);
      visualIntensityDisplayScore += (rawScore - visualIntensityDisplayScore) * envelopeAmount;
    }
    visualIntensityLastSampleAt = now;

    const candidatePercent = Math.round(visualIntensityDisplayScore * 100);
    const candidateLevel = stableVisualIntensityLevel(visualIntensityDisplayScore);
    const levelChanged = candidateLevel !== visualIntensityDisplayedLevel;
    const percentChangedEnough = visualIntensityDisplayedPercent === null
      || Math.abs(candidatePercent - visualIntensityDisplayedPercent) >= 2;
    if (!levelChanged && (!percentChangedEnough || now - visualIntensityLastPaintAt < 300)) return;

    visualIntensityDisplayedLevel = candidateLevel;
    visualIntensityDisplayedPercent = candidatePercent;
    visualIntensityLastPaintAt = now;
    const presentation = {
      calm: {
        label: 'CALM',
        description: 'Current motion and audio response are unlikely to create rapid flashes.'
      },
      active: {
        label: 'ACTIVE',
        description: 'Moderate movement and music response are active; review before streaming to a broad audience.'
      },
      intense: {
        label: 'INTENSE',
        description: 'Strong motion or rapid color/math changes are active. Consider Low Flash for sensitive viewers.'
      }
    }[visualIntensityDisplayedLevel];
    card.dataset.level = visualIntensityDisplayedLevel;
    $('#visualIntensityLabel').textContent = `${presentation.label} · ${visualIntensityDisplayedPercent}%`;
    $('#visualIntensityFill').style.width = `${Math.max(3, visualIntensityDisplayedPercent)}%`;
    $('#visualIntensityText').textContent = presentation.description;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const whole = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function exportedFileName(filePath) {
    return String(filePath || '').split(/[\\/]/).pop() || 'video';
  }

  function playExportCompleteStinger() {
    const stinger = $('#exportCompleteStinger');
    if (!stinger) return;
    stinger.pause();
    stinger.currentTime = 0;
    stinger.volume = 0.7;
    const playback = stinger.play();
    playback?.catch?.((error) => console.warn('Export completion stinger could not play:', error));
  }

  function showToast(message, error = false) {
    const toast = $('#toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function initializeNumericSliders() {
    Object.entries(numericSliderConfigs).forEach(([id, config]) => {
      const range = $(`#${id}`);
      const group = range?.closest('.slider-group');
      const label = group?.querySelector('label');
      if (!range || !group || !label) return;

      const fromRange = config.fromRange || ((value) => value);
      const toRange = config.toRange || ((value) => value);
      const settingName = label.querySelector('span')?.textContent?.trim() || id;
      const tools = document.createElement('span');
      const input = document.createElement('input');
      const tipButton = document.createElement('button');
      const resetButton = document.createElement('button');
      tools.className = 'numeric-value-tools';
      input.className = 'numeric-value-input';
      input.type = 'number';
      input.min = String(config.min);
      input.max = String(config.max);
      input.step = String(config.step);
      input.setAttribute('aria-label', `${settingName} numerical value`);
      tipButton.className = 'setting-tool-button tip-button';
      tipButton.type = 'button';
      tipButton.textContent = '?';
      tipButton.title = config.tip;
      tipButton.setAttribute('aria-label', `${settingName} help`);
      resetButton.className = 'setting-tool-button reset-button';
      resetButton.type = 'button';
      resetButton.textContent = '↺';
      resetButton.title = `Reset ${settingName.toLowerCase()} to default`;
      resetButton.setAttribute('aria-label', `Reset ${settingName} to default`);
      tools.append(input, tipButton, resetButton);
      label.appendChild(tools);
      group.classList.add('numeric-enhanced');

      const syncInput = () => {
        const numericValue = fromRange(Number(range.value));
        const decimals = numericValue >= 100 && config.decimals > 0 ? 0 : config.decimals;
        input.value = Number(numericValue.toFixed(decimals));
      };
      const commitInput = () => {
        if (input.value === '' || !Number.isFinite(Number(input.value))) return syncInput();
        const numericValue = clamp(Number(input.value), config.min, config.max);
        range.value = clamp(toRange(numericValue), Number(range.min), Number(range.max));
        range.dispatchEvent(new Event('input', { bubbles: true }));
        syncInput();
      };
      range.addEventListener('input', syncInput);
      input.addEventListener('change', commitInput);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commitInput();
          input.blur();
        }
      });
      tipButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showToast(config.tip);
      });
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        range.value = config.defaultRange;
        range.dispatchEvent(new Event('input', { bubbles: true }));
        syncInput();
      });
      range._syncNumericValue = syncInput;
      syncInput();
    });
  }

  function initializeSettingTools() {
    Object.entries(selectSettingConfigs).forEach(([id, config]) => {
      const control = $(`#${id}`);
      const label = control?.closest('label');
      if (!control || !label) return;
      const row = document.createElement('span');
      const tipButton = document.createElement('button');
      const resetButton = document.createElement('button');
      row.className = 'select-setting-row';
      tipButton.className = 'setting-tool-button tip-button';
      tipButton.type = 'button';
      tipButton.textContent = '?';
      tipButton.title = config.tip;
      resetButton.className = 'setting-tool-button reset-button';
      resetButton.type = 'button';
      resetButton.textContent = '↺';
      resetButton.title = 'Reset to default';
      control.replaceWith(row);
      row.append(control, tipButton, resetButton);
      tipButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showToast(config.tip);
      });
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        control.value = config.defaultValue;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    Object.entries(checkboxSettingDefaults).forEach(([id, defaultValue]) => {
      const control = $(`#${id}`);
      const label = control?.closest('.toggle-row');
      if (!control || !label) return;
      const resetButton = document.createElement('button');
      resetButton.className = 'setting-tool-button reset-button toggle-reset-button';
      resetButton.type = 'button';
      resetButton.textContent = '↺';
      resetButton.title = 'Reset to default';
      resetButton.setAttribute('aria-label', 'Reset setting to default');
      label.appendChild(resetButton);
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        control.checked = defaultValue;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function initializePaletteTools() {
    const label = document.querySelector('.control-label[for="palette"]');
    if (!label) return;
    const resetButton = document.createElement('button');
    resetButton.className = 'setting-tool-button reset-button inline-reset-button';
    resetButton.type = 'button';
    resetButton.textContent = '↺';
    resetButton.title = 'Reset color system to Ion';
    label.appendChild(resetButton);
    resetButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.querySelector('.palette[data-palette="0"]')?.click();
    });
  }

  function recommendedExportIterations(width, height) {
    return exportSamplingEngine.recommendedIterations(width, height);
  }
  window.__quarticRecommendedExportIterations = recommendedExportIterations;

  function effectiveExportIterations(width, height, requestedIterations = state.exportIterations) {
    return exportSamplingEngine.effectiveIterations(requestedIterations, { unleashed: state.unleashedMode });
  }
  window.__quarticEffectiveExportIterations = effectiveExportIterations;

  function applyResolutionIterationRecommendation({ announce = false } = {}) {
    const { width, height } = exportSettingsSnapshotEngine.parseResolution(exportController.readSettings().resolution);
    const recommendation = recommendedExportIterations(width, height);
    state.exportIterations = recommendation;
    $('#exportIterations').value = String(recommendation);
    renderExportMathParity();
    if (announce) showToast(state.exportMatchLive
      ? `${width}×${height} selected · matching ${state.iterations} live iterations`
      : `${width}×${height} selected · ${recommendation} alternate-look iterations recommended`);
    return recommendation;
  }

  function currentExportSettings(audioDuration = Number(audio.duration) || 0) {
    return exportSettingsSnapshotEngine.capture(exportController.readSettings(), {
      unleashed: state.unleashedMode,
      liveIterations: state.iterations,
      audioDuration
    });
  }

  function selectedExportProfile() {
    return currentExportSettings().profile;
  }

  function updateExportPerformanceNote() {
    const settings = currentExportSettings();
    const estimate = exportPlanningEngine.profileEstimate({
      profileId: settings.format,
      width: settings.width,
      height: settings.height,
      fps: settings.fps,
      duration: settings.audioDuration,
      hdrOutput: settings.hdrOutput
    });
    exportController.renderPerformance(exportPresentationEngine.performanceView({
      estimate,
      iterations: settings.effectiveIterations,
      samplingSamples: settings.samplingSamples,
      supersampling: settings.supersampling
    }));
  }

  function formatByteSize(bytes) {
    return exportPlanningEngine.formatByteSize(bytes);
  }

  function currentExportPreflightSettings(durationOverride = null, refreshEncoder = false) {
    return exportSettingsSnapshotEngine.preflight(currentExportSettings(), { durationOverride, refreshEncoder });
  }

  function requestExportPreflight(durationOverride = null, refreshEncoder = false) {
    return exportPreflightEngine.load(
      currentExportPreflightSettings(durationOverride, refreshEncoder),
      (request) => window.quarticDesktop.getExportPreflight(request)
    );
  }

  function updateEncoderStatus(preflight) {
    const view = exportPresentationEngine.encoderStatusView(preflight, currentExportSettings().format);
    if (view) exportController.renderEncoderStatus(view);
  }

  function populateExportPreflight(preflight) {
    const settings = currentExportSettings();
    exportController.renderPreflight(exportPresentationEngine.preflightView({
      preflight,
      fallbackProfileId: settings.format,
      hdrOutput: settings.hdrOutput,
      testDisabled: state.audioMode !== 'deck' || !currentPlaylistItem()?.filePath
    }));
    updateEncoderStatus(preflight);
  }

  function refreshExportEncoderStatus() {
    return exportPreflightEngine.refresh({
      settings: currentExportPreflightSettings(1),
      requestPreflight: (request) => window.quarticDesktop.getExportPreflight(request),
      started: () => exportController.renderEncoderStatus(exportPresentationEngine.encoderCheckingView()),
      completed: ({ preflight }) => updateEncoderStatus(preflight),
      failed: ({ error }) => exportController.renderEncoderStatus(exportPresentationEngine.encoderFailureView(error))
    });
  }

  function scanExportEncoderCapabilities() {
    return exportEncoderScanEngine.run({
      started: () => exportController.renderEncoderScanState(
        'running',
        exportPresentationEngine.encoderScanRunningView()
      ),
      scan: () => window.quarticDesktop.getExportEncoderCapabilities(),
      completed: ({ report }) => {
        exportController.renderEncoderScanState(
          'completed',
          exportPresentationEngine.encoderScanCompletedView(report)
        );
        if (currentExportSettings().format === 'gpu_auto') {
          updateEncoderStatus({ encoder: report.selected, profile: selectedExportProfile() });
        }
        showToast('Encoder compatibility scan complete');
      },
      failed: ({ error }) => {
        exportController.renderEncoderScanState(
          'failed',
          exportPresentationEngine.encoderScanFailedView(error)
        );
        showToast(error?.message || String(error), true);
      },
      restored: () => exportController.renderEncoderScanState(
        'restored',
        exportPresentationEngine.encoderScanRestoredView()
      )
    }).catch(() => {});
  }

  function modeledExportRenderFps(width, height, exportIterations) {
    const settings = currentExportSettings();
    return exportPlanningEngine.modeledRenderFps({
      liveFps: 1000 / Math.max(1, state.frameTime),
      livePixels: Math.max(1, canvas.width * canvas.height),
      width,
      height,
      visualStyle: state.visualStyle,
      liveIterations: state.iterations,
      exportIterations,
      samplingSamples: settings.samplingSamples,
      supersampling: settings.supersampling
    });
  }

  let lastExportBenchmark = null;

  function exportAdvisorRecommendations(reference) {
    const settings = currentExportSettings();
    const resolutions = Array.from($('#resolution').options).map((option) => {
      const [width, height] = option.value.split('x').map(Number);
      return { value: option.value, width, height };
    });
    const frameRates = Array.from($('#fps').options).map((option) => Number(option.value));
    return exportPlanningEngine.advisorRecommendations({
      reference,
      resolutions,
      frameRates,
      currentIterations: settings.requestedIterations,
      unleashed: state.unleashedMode,
      recommendedIterations: recommendedExportIterations,
      liveContext: {
        liveFps: 1000 / Math.max(1, state.frameTime),
        livePixels: Math.max(1, canvas.width * canvas.height),
        visualStyle: state.visualStyle,
        liveIterations: state.iterations,
        samplingSamples: settings.samplingSamples,
        supersampling: settings.supersampling
      }
    });
  }

  function renderExportAdvisor(reference) {
    const settings = currentExportSettings();
    exportController.renderAdvisor(exportPresentationEngine.advisorView({
      recommendations: exportAdvisorRecommendations(reference),
      currentResolution: settings.resolution,
      currentFps: settings.fps,
      currentIterations: settings.requestedIterations
    }));
  }

  function applyExportAdvisorRecommendation(selection) {
    return exportSettingsCoordinatorEngine.applyAdvisor(selection, {
      readChoices: () => exportController.readSettingChoices(),
      applySettings: (recommendation) => exportController.applyAdvisorSelection(recommendation, { dispatch: false }),
      syncIterations: syncExportIterations,
      refreshPerformance: updateExportPerformanceNote,
      invalidateBenchmark: invalidateExportBenchmark,
      completed: ({ recommendation }) => showToast(`${recommendation.label} applied · benchmark again to verify`),
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  function invalidateExportBenchmark() {
    exportController.invalidateBenchmark();
    lastExportBenchmark = null;
  }

  function syncExportIterations(value) {
    state.exportIterations = Number(value);
    renderExportMathParity();
  }

  function renderExportMathParity() {
    const matchLive = Boolean(state.exportMatchLive);
    const group = $('#exportIterations')?.closest('.slider-group');
    group?.classList.toggle('control-disabled', matchLive);
    $('#exportIterations')?.setAttribute('aria-disabled', String(matchLive));
    if ($('#exportIterationsValue')) {
      $('#exportIterationsValue').value = matchLive ? `${state.iterations} · LIVE` : state.exportIterations;
    }
  }

  function syncExportMatchLive(checked) {
    state.exportMatchLive = Boolean(checked);
    renderExportMathParity();
  }

  function syncExportSupersampling(value) {
    const mode = exportSamplingEngine.normalizeMode(
      typeof value === 'string' ? value : '',
      typeof value === 'boolean' ? value : state.exportSupersampling
    );
    state.exportSamplingMode = mode;
    state.exportSupersampling = mode !== 'standard';
    if ($('#exportSamplingMode')) $('#exportSamplingMode').value = mode;
    if ($('#exportSupersampling')) $('#exportSupersampling').checked = state.exportSupersampling;
    const description = $('#exportSamplingDescription');
    if (description) {
      description.textContent = mode === 'balanced'
        ? 'Two opposed linear-light subpixel samples improve dense fractal edges at about half the cost of Maximum.'
        : mode === 'maximum'
          ? 'Four rotated linear-light subpixel samples provide the cleanest final master at about 4× render time.'
          : 'One grain-free sample per frame gives the fastest export and is recommended for previews.';
    }
  }

  function coordinateExportSettingsChange(kind, payload = {}) {
    return exportSettingsCoordinatorEngine.change(kind, payload, {
      recommendIterations: applyResolutionIterationRecommendation,
      syncIterations: syncExportIterations,
      syncParity: syncExportMatchLive,
      syncSupersampling: syncExportSupersampling,
      updateHdrAvailability: updateExportHdrAvailability,
      refreshPerformance: updateExportPerformanceNote,
      invalidateBenchmark: invalidateExportBenchmark,
      refreshEncoder: isObsOutput ? null : refreshExportEncoderStatus,
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  async function benchmarkSelectedExportSettings() {
    return exportBenchmarkEngine.run({
      prepare: async () => {
        const settings = currentExportSettings();
        return {
          width: settings.width,
          height: settings.height,
          fps: settings.fps,
          iterations: settings.effectiveIterations,
          format: settings.format,
          visualKind: state.visualStyle === 0 ? 'fractal iteration' : 'visual shader'
        };
      },
      started: async ({ context }) => {
        exportController.renderBenchmarkState('running', exportPresentationEngine.benchmarkRunningView(context));
      },
      benchmarkEncoder: (context) => window.quarticDesktop.benchmarkExportEncoder({
        format: context.format,
        width: context.width,
        height: context.height,
        fps: context.fps
      }),
      estimateRenderFps: (context) => modeledExportRenderFps(context.width, context.height, context.iterations),
      skipped: async ({ result, renderFps }) => {
        exportController.renderBenchmarkState('skipped', exportPresentationEngine.benchmarkSkippedView({ result, renderFps }));
      },
      completed: async ({ context, result, renderFps, benchmark }) => {
        exportController.renderBenchmarkState('completed', exportPresentationEngine.benchmarkCompletedView({
          result,
          renderFps,
          benchmark,
          visualKind: context.visualKind
        }));
        lastExportBenchmark = { ...result, encodedFps: benchmark.encoderFps };
        renderExportAdvisor(lastExportBenchmark);
        showToast('Export readiness benchmark complete');
      },
      failed: async ({ error }) => {
        exportController.renderBenchmarkState('failed', exportPresentationEngine.benchmarkFailedView(error));
        showToast(error.message, true);
      },
      restored: async () => exportController.renderBenchmarkState('restored')
    }).catch(() => {});
  }

  function loadExportHistory() {
    exportHistoryEngine.load();
    renderExportHistory();
  }

  function renderExportHistory() {
    exportController.renderHistory(exportPresentationEngine.historyView(exportHistoryEngine.list(12)));
  }

  function clearExportHistory() {
    return exportHistoryActionEngine.clear({
      confirm: () => window.confirm('Clear the recent export history? Exported video files will not be deleted.'),
      completed: renderExportHistory,
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  function handleExportHistoryAction(action, id) {
    return exportHistoryActionEngine.perform(action, id, {
      open: (outputPath) => window.quarticDesktop.openExport(outputPath),
      reveal: (outputPath) => window.quarticDesktop.revealExport(outputPath),
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  function completeExportResult(result, details = {}, presentCompleted) {
    const settings = currentExportSettings();
    return exportResultWorkflowEngine.complete(result, {
      details,
      defaults: {
        mode: exportSessionEngine.mode || 'offline',
        width: settings.width,
        height: settings.height,
        fps: settings.fps
      },
      historyChanged: renderExportHistory,
      progressCompleted: ({ outputPath }) => exportProgressCoordinator.complete(outputPath),
      presentCompleted,
      notify: ({ message, error }) => showToast(message, error)
    });
  }

  function refreshRecoverableExports() {
    return exportHistoryActionEngine.refreshRecoveries({
      load: () => window.quarticDesktop.getRecoverableExports(),
      completed: ({ recoveries }) => exportController.renderRecoveries(exportPresentationEngine.recoveryView(recoveries)),
      failed: ({ recoveries }) => exportController.renderRecoveries(exportPresentationEngine.recoveryView(recoveries))
    });
  }

  function handleExportRecoveryAction(action, id) {
    if (state.exporting) return;
    if (action === 'recover') {
      recoverInterruptedExport(id);
    } else if (window.confirm('Discard this interrupted export and its temporary master?')) {
      exportRecoveryEngine.discard(id, {
        discard: (recoveryId) => window.quarticDesktop.discardRecoverableExport(recoveryId),
        completed: async () => {
          await refreshRecoverableExports();
          showToast('Interrupted export discarded');
        },
        failed: ({ error }) => showToast(error?.message || String(error), true)
      }).catch(() => {});
    }
  }

  function recoverInterruptedExport(id) {
    return exportRecoveryEngine.recover(id, {
      started: () => {
        state.exporting = true;
        exportResultWorkflowEngine.reset();
        exportController.renderRecoveryState('preparing', exportPresentationEngine.recoveryPreparingView());
        exportSessionEngine.startProgress();
      },
      recover: (recoveryId) => window.quarticDesktop.recoverExport(recoveryId),
      completed: ({ result }) => completeExportResult(
        result,
        { mode: 'recovered' },
        () => exportController.renderRecoveryState('completed', exportPresentationEngine.recoveryCompletedView())
      ),
      failed: ({ error }) => {
        exportController.renderRecoveryState('failed', exportPresentationEngine.recoveryFailedView(error));
        showToast(`Recovery failed: ${error?.message || String(error)}`, true);
      },
      restored: async ({ completed }) => {
        state.exporting = false;
        exportController.renderRecoveryState('restored', { completed });
        await refreshRecoverableExports();
      }
    }).catch(() => {});
  }

  let obsOutputOpen = false;

  function getObsOutputOptions() {
    return {
      resolution: $('#obsResolution').value,
      fps: Number($('#obsFps').value),
      alwaysOnTop: $('#obsAlwaysOnTop').checked
    };
  }

  function updateObsChromaUi() {
    const enabled = $('#obsChromaKey').checked;
    $('#obsChromaControls').classList.toggle('control-disabled', !enabled);
    $('#obsChromaControls').inert = !enabled;
  }

  function updateObsOutputUi(open) {
    obsOutputOpen = Boolean(open);
    $('#obsOutputStatus').textContent = obsOutputOpen ? 'OUTPUT LIVE' : 'OUTPUT CLOSED';
    $('#obsLiveCard').classList.toggle('live', obsOutputOpen);
    $('#obsLiveTitle').textContent = obsOutputOpen ? 'OBS OUTPUT IS LIVE' : 'READY FOR OBS';
    $('#obsLiveDetail').textContent = obsOutputOpen
      ? `${$('#obsResolution').selectedOptions[0].textContent} · ${$('#obsFps').value} FPS output`
      : 'Choose a size, then open the output window.';
    $('#obsOutputButton').classList.toggle('live', obsOutputOpen);
    $('#obsOutputButton').textContent = obsOutputOpen ? 'CLOSE OBS OUTPUT' : 'OPEN OBS OUTPUT';
  }

  async function toggleObsOutput() {
    if (obsOutputOpen) {
      await window.quarticDesktop.closeObsOutput();
      updateObsOutputUi(false);
      return;
    }
    const settings = await window.quarticDesktop.openObsOutput(getObsOutputOptions());
    obsSyncFps = settings.fps;
    updateObsOutputUi(true);
    showToast(`OBS output opened at ${settings.width}×${settings.height} · ${settings.fps} FPS`);
  }

  async function applyObsWindowOptions() {
    obsSyncFps = backgroundRenderPolicy.normalizeObsFps($('#obsFps').value);
    if (!obsOutputOpen) return updateObsOutputUi(false);
    await window.quarticDesktop.openObsOutput(getObsOutputOptions());
    updateObsOutputUi(true);
  }


  async function refreshAdvancedOutputCapabilities() {
    const capabilities = await window.quarticDesktop.getOutputCapabilities();
    const available = Boolean(capabilities?.spout2Sender);
    $('#spoutCapabilityLight').classList.toggle('ready', available);
    $('#spoutCapabilityText').textContent = available
      ? 'Optional native sender detected · OBS Spout2 plugin also required'
      : 'Native sender not installed · use the built-in OBS output window';
    $('#advancedOutputStatus').textContent = available ? 'SPOUT SENDER DETECTED' : 'WINDOW OUTPUT READY';
    return capabilities;
  }

  function initializeAdvancedOutput() {
    $('#checkAdvancedOutputButton').addEventListener('click', () => {
      refreshAdvancedOutputCapabilities()
        .then((capabilities) => showToast(capabilities.spout2Sender ? 'Optional Spout2 sender detected' : 'Window Capture is ready · native Spout2 sender is not installed'))
        .catch((error) => showToast(`Output check: ${error.message}`, true));
    });
    refreshAdvancedOutputCapabilities().catch(() => { $('#advancedOutputStatus').textContent = 'WINDOW OUTPUT READY'; });
  }

  const liveControlActions = {
    musicToggle: { label: 'Music · Play / Pause', mode: 'trigger', run: () => togglePlayback().catch((error) => showToast(error.message, true)) },
    showToggle: { label: 'Show · Start / Pause', mode: 'trigger', run: () => $('#showPlayButton').click() },
    showPrevious: { label: 'Show · Previous Entry', mode: 'trigger', run: () => performanceShowController.advance(-1) },
    showNext: { label: 'Show · Next Entry', mode: 'trigger', run: () => performanceShowController.advance(1) },
    showStop: { label: 'Show · Stop', mode: 'trigger', run: () => $('#showStopButton').click() },
    performanceMode: { label: 'Performance · Toggle Operator Mode', mode: 'trigger', run: () => performanceShowController.setPerformanceMode(!state.operatorMode) },
    performanceBlackout: { label: 'Performance · Toggle Blackout', mode: 'trigger', run: () => performanceShowController.setBlackout(!state.performanceBlackout) },
    tapTempo: { label: 'Beat Grid · Tap Tempo', mode: 'trigger', run: () => $('#tapTempoButton').click() },
    visualNext: { label: 'Visual · Next Type', mode: 'trigger', run: () => {
      const control = $('#visualStyle');
      control.value = String((Number(control.value) + 1) % control.options.length);
      control.dispatchEvent(new Event('change', { bubbles: true }));
    } },
    paletteNext: { label: 'Color · Next Palette', mode: 'trigger', run: () => {
      const buttons = [...document.querySelectorAll('.palette')];
      const current = buttons.findIndex((button) => button.classList.contains('active'));
      buttons[(current + 1 + buttons.length) % buttons.length]?.click();
    } },
    obsOutput: { label: 'OBS · Toggle Output Window', mode: 'trigger', run: () => toggleObsOutput().catch((error) => showToast(error.message, true)) },
    resetView: { label: 'Fractal · Reset View', mode: 'trigger', run: () => workspaceUi.resetFractalView() },
    reactivity: { label: 'Continuous · Reactivity', mode: 'continuous', controlId: 'reactivity' },
    motion: { label: 'Continuous · Motion', mode: 'continuous', controlId: 'motion' },
    equation: { label: 'Continuous · Equation Modulation', mode: 'continuous', controlId: 'equationMod' },
    frequencyColor: { label: 'Continuous · Frequency Color', mode: 'continuous', controlId: 'frequencyColorAmount' },
    zoom: { label: 'Continuous · Zoom', mode: 'continuous', controlId: 'zoom' }
  };

  const liveControlController = liveControlControllerFactory.create({
    query: $,
    storage: localStorage,
    desktop: window.quarticDesktop,
    actions: liveControlActions,
    showToast
  });

  const playlistController = playlistControllerFactory.create({
    query: $,
    state,
    audio,
    audioController,
    desktop: window.quarticDesktop,
    showToast,
    isSupportedAudioFile: audioSourceController.isSupportedFile,
    stopLiveAudio: audioSourceController.stopLive,
    setAudioSourceStatus: audioSourceController.setSourceStatus,
    resetPulseEvents,
    ensureAudioGraph: audioSourceController.createGraph,
    resumeAudio: () => audioSourceController.context.resume(),
    audioIsActive: audioSourceController.isActive,
    cancelSongMapAnalysis: () => songMapController.cancelAnalysis({ clearMap: true }),
    onTrackChanged: () => songMapController.loadCurrent(),
    onDeckReset: () => songMapController.render(),
    onNowPlayingChange: () => operatorTools.updateNowPlayingOverlay(),
    onPerformanceChange: () => performanceShowController.updateDock()
  });

  function currentPlaylistIndex() { return playlistController.currentIndex(); }
  function currentPlaylistItem() { return playlistController.currentItem(); }
  function selectPlaylistRow(index) { return playlistController.selectRow(index); }
  function updateTrackControls() { return playlistController.updateTrackControls(); }
  function updatePlaylistControls() { return playlistController.updateControls(); }
  function renderPlaylist() { return playlistController.render(); }
  function selectPlaylistIndex(index, autoplay = false) { return playlistController.selectIndex(index, autoplay); }
  function addLocalFiles(files, options = {}) { return playlistController.addFiles(files, options); }
  function loadAudio(file) { return playlistController.loadAudio(file); }
  function movePlaylistItem(direction) { return playlistController.moveItem(direction); }
  function removeCurrentPlaylistItem() { return playlistController.removeCurrent(); }
  function resetAudioDeck() { return playlistController.resetDeck(); }
  function clearPlaylist() { return playlistController.clear(); }
  function changePlaylistTrack(direction, forcePlay = false) { return playlistController.changeTrack(direction, forcePlay); }
  function togglePlayback() { return playlistController.togglePlayback(); }
  function setPlayState() { return playlistController.setPlayState(); }

  function createOfflineAudioAnalyzer(audioBuffer, fps) {
    return offlineAudioAnalysisEngine.createAnalyzer(audioBuffer, fps, {
      target: state,
      getBands: musicPersonalityController.getBands,
      gains: [state.analysisBassGain, state.analysisMidGain, state.analysisHighGain],
      onBeat: (low, lowMid, delta) => updateAdaptiveBeatDetector(low, lowMid, delta, { register: false }),
      onPulse: createMusicPulseEvents
    });
  }

  function requestOfflineVisualFrame() {
    if (pendingOfflineRender) return Promise.reject(new Error('The previous offline frame is still rendering.'));
    return new Promise((resolve) => { pendingOfflineRender = resolve; });
  }

  if (isSmokeTest) {
    window.__quarticTestExportSampling = () => exportSamplingEngine.selfTest();
  }

  function createOfflineExportJob(options = {}) {
    const item = currentPlaylistItem();
    return {
      prepare: async () => {
        if (state.audioMode !== 'deck') audioSourceController.stopLive();
        audio.pause();
        const settings = currentExportSettings();
        exportController.renderOfflineState('preparing');
        audioSourceController.createGraph();
        const context = await exportPreparationEngine.prepareOffline({
          item,
          settings,
          audioName: state.audioName,
          test: options.test,
          durationLimit: options.durationLimit,
          preflight: options.preflight
        }, {
          readAudioData: (track) => track.file.arrayBuffer(),
          decodeAudioData: (bytes) => audioSourceController.context.decodeAudioData(bytes)
        });
        if (visualCatalog.isCustom(state.visualStyle) && context.tenBitProfile) {
          throw new Error('Imported Data Horizon visualizers currently use the 8-bit SDR canvas path. Choose Compatible H.264, VP9 WebM, ProRes, Ut Video, FFV1, or PNG Sequence for offline export.');
        }
        return context;
      },
      beginSession: (context) => window.quarticDesktop.beginOfflineExport(context.sessionRequest),
      activate: ({ context }) => {
        const {
          width, height, fps, format, frameCount, hdrProfile, tenBitProfile,
          samplingMode, supersampling, exportDetail, exportIterations
        } = context;
        context.sampleOffsets = exportSamplingEngine.offsetsForMode(samplingMode, supersampling);
        if (tenBitProfile && !ensureHdrExportTarget(width, height)) {
          throw new Error('This GPU/driver could not create the required 10-bit RGB export framebuffer. Use a lossless RGB profile or update the graphics driver.');
        }
        context.frameCapture = exportFrameCaptureEngine.createCapture({
          width,
          height,
          tenBit: tenBitProfile,
          hdr: hdrProfile,
          supersampling,
          sampleOffsets: context.sampleOffsets
        });
        exportRuntimeStateCoordinator.activate('offline', {
          width, height, fps, hdrProfile, tenBitProfile, exportDetail, exportIterations
        }, { loopPlayback: audio.loop });
        resetExportAudioVisualState();
        renderPlaylist();
        exportResultWorkflowEngine.reset();
        exportController.renderOfflineState('rendering', { hidePreview: !context.showPreview });
        exportProgressCoordinator.begin(`Rendering frames 0 / ${frameCount} | overall 0%`, 'Rendering frames 0% | overall 0%');
        audioController.renderLiveStatus('OFFLINE RENDER', true);
        setCanvasSize();
        const exportProfile = exportProfileCatalog.profiles[format];
        exportProgressCoordinator.update(
          0,
          hdrProfile
            ? '10-bit Rec.2020 HLG target ready | HEVC Main 10 pipeline | rendering next'
            : `${exportProfile.container} | ${exportProfile.videoCodec} | rendering next`,
          hdrProfile
            ? 'YouTube HDR master ready | quality-priority HEVC'
            : `${exportProfile.label} ready`
        );
      },
      render: ({ context, session }) => {
        const { fps, frameCount, supersampling, sampleOffsets, audioBuffer, frameCapture } = context;
        const analyzeFrame = createOfflineAudioAnalyzer(audioBuffer, fps);
        return exportRenderCoordinator.renderFrames({
          sessionEngine: exportSessionEngine,
          frameCount,
          fps,
          supersampling,
          sampleOffsets,
          onFrameStart: ({ time }) => {
            state.offlineCurrentTime = time;
            state.visualTime = time;
            analyzeFrame(time);
            state.offlineBaseModulation = null;
            frameCapture.beginFrame();
          },
          onSample: (sample) => frameCapture.captureSample(sample),
          onFrameReady: () => frameCapture.resolveFrame(),
          onAppendFrame: () => window.quarticDesktop.appendOfflineFrame(session.id, frameCapture.outputBytes),
          onFrameEnd: () => frameCapture.cleanup(),
          onProgress: ({ renderedFrameCount, progress, overallProgress }) => {
            exportProgressCoordinator.update(
              overallProgress,
              `Rendering frames ${renderedFrameCount} / ${frameCount} | render ${Math.round(progress * 100)}% | overall ${Math.round(overallProgress * 100)}%`,
              `Rendering frames ${Math.round(progress * 100)}% | overall ${Math.round(overallProgress * 100)}%`
            );
          }
        });
      },
      beforeFinalize: () => {
        exportProgressCoordinator.update(.80, 'Frames rendered | closing the quality master and audio | overall 80%', 'Frames rendered | finalizing master | overall 80%');
        exportProgressCoordinator.update(.85, 'Encoded frames written | preparing final video | overall 85%', 'Encoded frames written | finalizing next | overall 85%');
        exportRuntimeStateCoordinator.markFinalizing('offline');
        exportController.renderOfflineState('finalizing', { shortened: exportSessionEngine.finishRequested });
        exportProgressCoordinator.update(.85, 'Frames complete | finalizing and saving | overall 85%', 'Frames complete | finalizing 0% | overall 85%');
      },
      complete: ({ context, renderedFrameCount, result }) => completeExportResult(result, {
          mode: options.test ? 'test' : 'offline',
          width: context.width,
          height: context.height,
          fps: context.fps,
          duration: renderedFrameCount / context.fps
        }, () => exportController.renderOfflineState('completed')),
      cancelled: () => {
        exportController.renderOfflineState('cancelled');
        showToast('Offline export cancelled and temporary files discarded');
      },
      failed: () => exportController.renderOfflineState('failed'),
      restore: ({ context, completed }) => {
        pendingOfflineRender = null;
        context?.frameCapture?.cleanup();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (context?.tenBitProfile) releaseHdrExportTarget();
        exportRuntimeStateCoordinator.restore('offline');
        resetExportAudioVisualState();
        exportController.renderOfflineState('restored', { completed });
        operatorTools.updateUnleashedMode(state.unleashedMode);
        renderExportMathParity();
        audioController.renderLiveStatus('IDLE');
        updateTrackControls();
        renderPlaylist();
        setCanvasSize();
        setPlayState();
      }
    };
  }

  async function startOfflineExport(options = {}) {
    return exportJobCoordinator.startOffline(options);
  }

  async function startExport() {
    return exportWorkflowEngine.run({
      requestChoice: () => exportController.requestPreflightChoice({
        load: () => requestExportPreflight(),
        loaded: (preflight) => {
          lastExportPreflight = preflight;
          populateExportPreflight(preflight);
        },
        loadTest: (preflight) => requestExportPreflight(Math.min(5, preflight.duration)),
        failed: (error) => showToast(error.message, true)
      }),
      startOffline: startOfflineExport,
      failed: () => {
        if (!state.exporting) exportController.renderOfflineState('restored', { completed: false });
      }
    });
  }

  function createLiveExportJob(options = {}) {
    const settings = currentExportSettings();
    return {
      prepare: async () => {
        exportController.renderLiveState('preparing');
        if (state.audioMode !== 'deck') audioSourceController.stopLive();
        audioSourceController.createGraph();
        await audioSourceController.context.resume();
        return exportPreparationEngine.prepareLive({
          settings,
          audioName: state.audioName,
          preflight: options.preflight
        });
      },
      beginSession: (context) => window.quarticDesktop.beginExport(context.sessionRequest),
      activate: async ({ context }) => {
        exportRuntimeStateCoordinator.activate('live', context, { loopPlayback: audio.loop });
        resetExportAudioVisualState();
        renderPlaylist();
        audio.loop = false;
        exportResultWorkflowEngine.reset();
        exportController.renderLiveState('recording', { hidePreview: !context.showPreview });
        exportProgressCoordinator.begin('Live recording 0% | overall 0%', 'Live recording 0% | overall 0%');
        setCanvasSize();
      },
      record: async ({ context, session }) => {
        liveExportCapture = exportLiveCaptureEngine.createCapture({
          canvas,
          audioStream: audioSourceController.recordingDestination.stream,
          width: context.width,
          height: context.height,
          fps: context.fps,
          onChunk: (bytes) => window.quarticDesktop.appendExport(session.id, bytes),
          onError: (error) => showToast(`Recorder error: ${error?.message || 'unknown error'}`, true),
          onStop: finishLiveExport
        });
        audio.currentTime = 0;
        liveExportCapture.start(1000);
        await audio.play();
      },
      started: async ({ context }) => {
        audioController.renderLiveStatus('RECORDING', true);
        showToast(`Recording ${context.width}×${context.height} at ${context.fps} FPS for ${context.format.toUpperCase()} export`);
      },
      finishing: () => exportController.renderLiveState('stopping'),
      cancelling: () => exportController.renderLiveState('cancelling'),
      beforeFinalize: async () => {
        if (!exportSessionEngine.cancelRequested) exportController.renderLiveState('finalizing');
        await liveExportCapture?.drain();
      },
      finalize: async ({ session }) => {
        exportProgressCoordinator.update(.80, 'Recording complete | finalizing and saving | overall 80%', 'Recording complete | finalizing 0% | overall 80%');
        return window.quarticDesktop.finishExport(session.id);
      },
      complete: ({ context, result }) => completeExportResult(
        result,
        { mode: 'live', width: context.width, height: context.height, fps: context.fps, duration: audio.currentTime },
        () => exportController.renderLiveState('completed')
      ),
      cancelled: async () => {
        exportController.renderLiveState('cancelled');
        showToast('Live export cancelled and temporary files discarded');
      },
      failed: async ({ error }) => {
        exportController.renderLiveState('failed');
        showToast(error?.message || 'Video export failed.', true);
      },
      restore: async ({ completed }) => {
        const runtime = exportRuntimeStateCoordinator.restore('live');
        if (runtime.restored) audio.loop = runtime.loopPlayback;
        await liveExportCapture?.dispose();
        liveExportCapture = null;
        exportController.renderLiveState('restored', { completed });
        updateTrackControls();
        renderPlaylist();
        operatorTools.updateUnleashedMode(state.unleashedMode);
        audioController.renderLiveStatus('IDLE');
        setCanvasSize();
        setPlayState();
      }
    };
  }

  async function startLiveExport(options = {}) {
    return exportJobCoordinator.startLive(options);
  }

  function togglePauseExport() {
    return exportCommandCoordinator.togglePause({
      offlineRendering: state.offlineExporting,
      paused: (view) => exportController.setPaused(true, view),
      resumed: ({ progress, percent }) => {
        exportController.setPaused(false, { note: 'Offline rendering resumed from the next exact frame.' });
        exportProgressCoordinator.update(progress, exportController.getPanelText(), `Rendering resumed · overall ${percent}%`);
      }
    });
  }

  function endAndFinishExport() {
    return exportCommandCoordinator.finish({
      offlineRendering: state.offlineExporting,
      resumed: () => exportController.setPaused(false),
      offlineFinishing: () => exportController.renderOfflineState('ending'),
      liveCaptureActive: () => Boolean(liveExportCapture && liveExportCapture.state !== 'inactive'),
      pauseAudio: () => audio.pause(),
      stopLiveCapture: () => liveExportCapture?.stop()
    });
  }

  async function cancelExport() {
    return exportCommandCoordinator.cancel({
      exporting: state.exporting,
      offlineRendering: state.offlineExporting,
      confirm: () => window.confirm('Cancel this export and permanently discard its temporary output?'),
      cancelling: ({ mode }) => {
        if (mode !== 'offline') exportController.setNote('Cancelling the export and discarding its temporary output.');
      },
      offlineCancelling: () => exportController.renderOfflineState('cancelling'),
      resumed: () => exportController.setPaused(false),
      abortOffline: (id) => window.quarticDesktop.abortOfflineExport(id),
      liveCaptureActive: () => Boolean(liveExportCapture && liveExportCapture.state !== 'inactive'),
      pauseAudio: () => audio.pause(),
      stopLiveCapture: () => liveExportCapture?.stop()
    });
  }

  function stopExport() {
    endAndFinishExport();
  }

  async function finishLiveExport() {
    return exportLiveLifecycle.finish().catch(() => {});
  }

  $('#loadButton').addEventListener('click', () => $('#audioInput').click());
  $('#useAudioSourceButton').addEventListener('click', () => audioSourceController.useSelectedSource().catch((error) => showToast(error.message, true)));
  $('#refreshAudioSourcesButton').addEventListener('click', () => audioSourceController.refreshAllDevices().catch((error) => showToast(error.message, true)));
  $('#audioSourceSelect').addEventListener('pointerdown', () => {
    if (!$('#audioOutputOptions').children.length) audioSourceController.refreshWindowsOutputs({ silent: true }).catch(() => {});
  });
  $('#audioSourceSelect').addEventListener('change', () => {
    if (state.audioMode !== 'live') audioSourceController.setSourceStatus('READY', false);
  });
  $('#deckOutputSelect').addEventListener('change', (event) => {
    audioSourceController.applyDeckOutput(event.target.value).catch((error) => {
      event.target.value = audioSourceController.deckOutputDeviceId;
      showToast(`Playback output: ${error.message}`, true);
    });
  });
  $('#audioInput').addEventListener('change', async (event) => {
    await loadAudio(event.target.files[0]);
    event.target.value = '';
  });
  $('#playlistFilesButton').addEventListener('click', () => $('#playlistFilesInput').click());
  $('#playlistFolderButton').addEventListener('click', () => $('#playlistFolderInput').click());
  $('#playlistFilesInput').addEventListener('change', async (event) => {
    await addLocalFiles(event.target.files, { activate: state.playlistIndex < 0 });
    event.target.value = '';
  });
  $('#playlistFolderInput').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files).sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name));
    await addLocalFiles(files, { activate: state.playlistIndex < 0 });
    event.target.value = '';
  });
  $('#playlistPreviousButton').addEventListener('click', () => changePlaylistTrack(-1).catch((error) => showToast(error.message, true)));
  $('#playlistNextButton').addEventListener('click', () => changePlaylistTrack(1).catch((error) => showToast(error.message, true)));
  $('#playlistMoveUpButton').addEventListener('click', () => movePlaylistItem(-1));
  $('#playlistMoveDownButton').addEventListener('click', () => movePlaylistItem(1));
  $('#playlistRemoveButton').addEventListener('click', removeCurrentPlaylistItem);
  $('#playlistClearButton').addEventListener('click', clearPlaylist);
  audioController.bind();
  $('#frequencyColor').addEventListener('change', (event) => { state.frequencyColorEnabled = event.target.checked; });
  $('#frequencyColorAmount').addEventListener('input', (event) => {
    state.frequencyColorAmount = Number(event.target.value);
    $('#frequencyColorAmountValue').value = visualPresetController.formatPercent('frequencyColorAmount', state.frequencyColorAmount);
  });
  $('#analysisSmoothing').addEventListener('input', (event) => {
    state.analysisSmoothing = Number(event.target.value);
    $('#analysisSmoothingValue').value = `${Math.round(state.analysisSmoothing * 100)}%`;
    if (audioSourceController.analyser) audioSourceController.analyser.smoothingTimeConstant = 0;
    musicPersonalityController.markCustom();
  });
  $('#beatSensitivity').addEventListener('input', (event) => {
    state.beatSensitivity = Number(event.target.value);
    $('#beatSensitivityValue').value = `${Math.round(state.beatSensitivity * 100)}%`;
    resetBeatDetector({ keepTotal: true });
    musicPersonalityController.markCustom();
  });
  $('#beatCooldown').addEventListener('input', (event) => {
    state.beatCooldownMs = Number(event.target.value);
    $('#beatCooldownValue').value = `${Math.round(state.beatCooldownMs)} ms`;
    state.beatCooldownRemaining = Math.min(state.beatCooldownRemaining, state.beatCooldownMs / 1000);
    musicPersonalityController.markCustom();
  });
  $('#autoReactivity').addEventListener('change', (event) => {
    state.autoReactivity = event.target.checked;
    if (!state.autoReactivity) state.autoReactivityGain = 1;
    updateUiMeters();
  });
  audio.addEventListener('play', setPlayState);
  audio.addEventListener('pause', setPlayState);
  audio.addEventListener('ended', () => {
    setPlayState();
    if (state.exporting) stopExport();
    else if (currentPlaylistIndex() < state.playlist.length - 1) changePlaylistTrack(1, true).catch((error) => showToast(error.message, true));
  });
  audio.addEventListener('loadedmetadata', () => {
    updateUiMeters();
    coordinateExportSettingsChange('audio');
  });
  audio.addEventListener('error', () => {
    showToast('The local audio file could not be decoded.', true);
  });

  $('#iterations').addEventListener('input', (event) => {
    state.iterations = Number(event.target.value);
    $('#iterationsValue').value = state.iterations;
    if (state.exportMatchLive) renderExportMathParity();
    coordinateExportSettingsChange('visual');
  });
  $('#visualStyle').addEventListener('change', (event) => {
    const requestedStyle = Number(event.target.value);
    state.visualStyle = visualCatalog.styles.some((style) => style.id === requestedStyle) ? requestedStyle : 0;
    event.target.value = String(state.visualStyle);
    document.body.dataset.visualStyle = String(state.visualStyle);
    workspaceUi.updateVisualStyleOptions();
    coordinateExportSettingsChange('visual');
    showToast(`${visualCatalog.get(state.visualStyle).name} selected`);
  });
  $('#showAdvancedControlsButton').addEventListener('click', () => {
    workspaceUi.setInterfaceMode('advanced');
    showToast('Advanced controls enabled');
  });
  const visualStylePicker = $('#visualStylePicker');
  visualStylePicker.addEventListener('click', (event) => {
    const button = event.target.closest('[data-visual-style]');
    if (!button) return;
    const control = $('#visualStyle');
    if (control.value === button.dataset.visualStyle) return;
    control.value = button.dataset.visualStyle;
    control.dispatchEvent(new Event('change', { bubbles: true }));
  });
  visualStylePicker.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const buttons = [...visualStylePicker.querySelectorAll('[data-visual-style]')];
    const current = Math.max(0, buttons.indexOf(document.activeElement));
    const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
    const next = buttons[(current + direction + buttons.length) % buttons.length];
    event.preventDefault();
    next.focus();
    next.click();
  });
  $('#fractalType').addEventListener('change', (event) => {
    state.fractalType = Number(event.target.value);
    const preset = fractalPresets[state.fractalType] || fractalPresets[0];
    $('#formulaLabel').textContent = preset.formula;
    workspaceUi.resetFractalView();
    if (state.interfaceMode === 'basic') visualPresetController.applyFractalRecommended(preset);
    workspaceUi.renderFractalLibrary();
    showToast(`${preset.name} selected${state.interfaceMode === 'basic' ? ' · recommended preset loaded' : ''}`);
  });
  $('#flow').addEventListener('input', (event) => {
    state.flow = Number(event.target.value);
    $('#flowValue').value = visualPresetController.formatPercent('flow', state.flow);
  });
  ['coreCStrength', 'coreBiasReal', 'coreBiasImag'].forEach((id) => {
    $(`#${id}`).addEventListener('input', (event) => {
      state[id] = Number(event.target.value);
      $(`#${id}Value`).value = visualPresetController.formatPercent(id, state[id]);
    });
  });
  $('#reactivity').addEventListener('input', (event) => {
    state.reactivity = Number(event.target.value);
    $('#reactivityValue').value = visualPresetController.formatPercent('reactivity', state.reactivity);
  });
  $('#motion').addEventListener('input', (event) => {
    state.motion = Number(event.target.value);
    $('#motionValue').value = visualPresetController.formatPercent('motion', state.motion);
  });
  $('#pulseDensity').addEventListener('input', (event) => {
    state.pulseDensity = Number(event.target.value);
    $('#pulseDensityValue').value = `${Math.round(state.pulseDensity * 100)}%`;
    if (state.pulseDensity === 0) state.pulseEvents.length = 0;
    else if (state.pulseEvents.length > activePulseEventLimit()) {
      state.pulseEvents.splice(0, state.pulseEvents.length - activePulseEventLimit());
    }
    visualPresetController.markPulseCustom();
  });
  $('#pulseSize').addEventListener('input', (event) => {
    state.pulseSize = Number(event.target.value);
    $('#pulseSizeValue').value = visualPresetController.formatPercent('pulseSize', state.pulseSize);
    visualPresetController.markPulseCustom();
  });
  $('#pulseCooldown').addEventListener('input', (event) => {
    state.pulseCooldown = Number(event.target.value);
    $('#pulseCooldownValue').value = visualPresetController.formatPercent('pulseCooldown', state.pulseCooldown);
    visualPresetController.markPulseCustom();
  });
  $('#pulseJagged').addEventListener('input', (event) => {
    state.pulseJagged = Number(event.target.value);
    $('#pulseJaggedValue').value = visualPresetController.formatPercent('pulseJagged', state.pulseJagged);
    visualPresetController.markPulseCustom();
  });
  $('#pulseTrail').addEventListener('input', (event) => {
    state.pulseTrail = Number(event.target.value);
    $('#pulseTrailValue').value = visualPresetController.formatPercent('pulseTrail', state.pulseTrail);
    visualPresetController.markPulseCustom();
  });
  $('#pulseDetail').addEventListener('input', (event) => {
    state.pulseDetail = Number(event.target.value);
    $('#pulseDetailValue').value = visualPresetController.formatPercent('pulseDetail', state.pulseDetail);
    visualPresetController.markPulseCustom();
  });
  $('#spin').addEventListener('input', (event) => {
    state.spin = Number(event.target.value);
    $('#spinValue').value = visualPresetController.formatPercent('spin', state.spin);
  });
  $('#equationSmoothing').addEventListener('input', (event) => {
    state.equationSmoothing = Number(event.target.value);
    $('#equationSmoothingValue').value = visualPresetController.formatPercent('equationSmoothing', state.equationSmoothing);
  });
  $('#equationMod').addEventListener('input', (event) => {
    state.equation = Number(event.target.value);
    $('#equationValue').value = visualPresetController.formatPercent('equationMod', state.equation);
  });
  $('#adaptiveQuality').addEventListener('change', (event) => {
    state.adaptiveQuality = event.target.checked;
    if (!state.adaptiveQuality) state.performanceScale = 1;
  });
  $('#fractalDimensional').addEventListener('change', (event) => {
    state.fractalDimensional = event.target.checked;
    visualPresetController.updateDimensionalUi();
    if (state.fractalDimensional) showToast('Dimensional Rotation enabled · GPU intensive');
  });
  $('#equationFolding').addEventListener('change', (event) => {
    state.equationFolding = event.target.checked;
    visualPresetController.updateFoldingUi();
    if (state.equationFolding) showToast('Equation Fold & Warp enabled · GPU intensive');
  });
  $('#zoom').addEventListener('input', (event) => {
    state.zoom = Math.pow(10, Number(event.target.value) / 25 - .4);
    $('#zoomValue').value = `${state.zoom < 10 ? state.zoom.toFixed(2) : state.zoom.toFixed(0)}×`;
  });
  $('#beatPulse').addEventListener('change', (event) => { state.beatPulse = event.target.checked; });
  $('#autoDrift').addEventListener('change', (event) => { state.autoDrift = event.target.checked; });
  $('#paletteGrid').addEventListener('click', (event) => {
    const button = event.target.closest('.palette');
    if (!button) return;
    document.querySelectorAll('.palette').forEach((item) => item.classList.toggle('active', item === button));
    state.palette = Number(button.dataset.palette);
    $('#customPaletteEditor').hidden = state.palette !== 4;
    paletteLibraryController.clearActive();
  });
  $('#saveCurrentPaletteButton').addEventListener('click', () => profileService.quickSavePalette());

  workspaceShell.bindNavigation(workspaceUi.activateTab);
  $('#showExportPreview').addEventListener('change', (event) => {
    if (state.exporting) document.body.classList.toggle('hide-export-preview', !event.target.checked);
  });
  const savedExportCompleteSound = localStorage.getItem('quarticPulseExportCompleteSound');
  if (savedExportCompleteSound !== null) $('#exportCompleteSound').checked = savedExportCompleteSound === 'true';
  $('#exportCompleteSound').addEventListener('change', (event) => {
    localStorage.setItem('quarticPulseExportCompleteSound', String(event.target.checked));
  });
  syncExportSupersampling($('#exportSamplingMode')?.value
    || ($('#exportSupersampling').checked ? 'maximum' : 'standard'));
  state.exportMatchLive = $('#exportMatchLive').checked;
  renderExportMathParity();
  function updateExportHdrAvailability() {
    const available = exportController.readSettings().format === 'youtube_hdr'
      && !visualCatalog.isCustom(state.visualStyle);
    if (!available && visualCatalog.isCustom(state.visualStyle)) $('#exportHdrOutput').checked = false;
    exportController.setHdrAvailability(available);
    return available;
  }
  $('#obsOutputButton').addEventListener('click', () => toggleObsOutput().catch((error) => showToast(`OBS output: ${error.message}`, true)));
  $('#obsResolution').addEventListener('change', () => applyObsWindowOptions().catch((error) => showToast(error.message, true)));
  $('#obsFps').addEventListener('change', () => applyObsWindowOptions().catch((error) => showToast(error.message, true)));
  $('#obsAlwaysOnTop').addEventListener('change', () => applyObsWindowOptions().catch((error) => showToast(error.message, true)));
  $('#obsChromaKey').addEventListener('change', (event) => {
    state.obsChromaKey = event.target.checked;
    updateObsChromaUi();
    if (state.obsChromaKey) showToast('Chroma-safe green screen enabled · subject greens are shifted away from the OBS key');
  });
  $('#obsChromaThreshold').addEventListener('input', (event) => {
    state.obsChromaThreshold = Number(event.target.value);
    $('#obsChromaThresholdValue').value = `${Math.round(state.obsChromaThreshold / .5 * 100)}%`;
  });


  let dragDepth = 0;
  window.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragDepth += 1;
    $('#dropOverlay').classList.add('visible');
  });
  window.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragDepth -= 1;
    if (dragDepth <= 0) $('#dropOverlay').classList.remove('visible');
  });
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    dragDepth = 0;
    $('#dropOverlay').classList.remove('visible');
    addLocalFiles(event.dataTransfer.files, { activate: true }).catch((error) => showToast(error.message, true));
  });

  $('#exportButton').addEventListener('click', () => {
    if (state.exporting) endAndFinishExport();
    else startExport().catch((error) => showToast(error.message, true));
  });
  exportController.bind();
  $('#revealButton').addEventListener('click', () => {
    exportResultWorkflowEngine.reveal({
      reveal: (outputPath) => window.quarticDesktop.revealExport(outputPath),
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  });

  window.addEventListener('keydown', (event) => {
    const focusedControl = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName);
    if (state.operatorMode && !focusedControl && !event.repeat) {
      if (event.code === 'Escape') {
        event.preventDefault();
        performanceShowController.setPerformanceMode(false);
        return;
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        performanceShowController.advance(-1);
        return;
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        performanceShowController.advance(1);
        return;
      }
      if (event.code === 'KeyB') {
        event.preventDefault();
        performanceShowController.setBlackout(!state.performanceBlackout);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        $('#showPlayButton').click();
        return;
      }
    }
    if (event.code === 'Space' && !focusedControl) {
      event.preventDefault();
      togglePlayback().catch((error) => showToast(error.message, true));
    }
    if (event.code === 'KeyR' && !state.exporting) {
      workspaceUi.resetFractalView();
    }
  });

  window.addEventListener('beforeunload', () => {
    audioSourceController.stopLive({ restoreDeck: false });
    obsAutomationController.close({ quiet: true });
    liveControlController.close();
  });
  workspaceUi.bindCustomPalette();
  renderPlaylist();
  loadExportHistory();
  if (!isObsOutput) refreshRecoverableExports();
  visualPresetController.initialize();
  visualizerPackageController = visualizerPackageControllerFactory.create({
    catalog: visualCatalog,
    desktop: window.quarticDesktop,
    canvas,
    runtimeFactory: dataHorizonRuntimeFactory,
    picker: $('#visualStylePicker'),
    select: $('#visualStyle'),
    packageSelect: $('#installedVisualizerPackage'),
    packageStatus: $('#visualizerPackageStatus'),
    customOptionsAnchor: document.querySelector('label[for="palette"]'),
    importButton: $('#importVisualizerPackageButton'),
    removeButton: $('#removeVisualizerPackageButton'),
    showToast,
    onCatalogChanged: () => workspaceUi.updateVisualStyleOptions(),
    onPackagesChanged: (packages) => profileService.syncPackagePalettes(packages)
  });
  visualizerPackageController.initialize();
  visualCatalog.decorate();
  workspaceUi.initializeFractalLibrary();
  initializeNumericSliders();
  initializeSettingTools();
  initializePaletteTools();
  workspaceUi.initializeInterfaceMode();
  workspaceUi.activateTab(document.querySelector('.tab-panel.active')?.dataset.tabPanel || 'music');
  musicPersonalityController.initialize();
  songMapController.initialize();
  songMapController.initializeDirector();
  musicPersonalityController.updateBandUi();
  workspaceUi.updateVisualStyleOptions();
  visualPresetController.updateDimensionalUi();
  visualPresetController.updateFoldingUi();
  const normalizedStateControls = {
    frequencyColorAmount: 'frequencyColorAmount',
    beatSensitivity: 'beatSensitivity',
    flow: 'flow', reactivity: 'reactivity', motion: 'motion', spin: 'spin', equationSmoothing: 'equationSmoothing', equationMod: 'equation',
    coreCStrength: 'coreCStrength', coreBiasReal: 'coreBiasReal', coreBiasImag: 'coreBiasImag',
    pulseDensity: 'pulseDensity', pulseSize: 'pulseSize', pulseCooldown: 'pulseCooldown',
    pulseJagged: 'pulseJagged', pulseTrail: 'pulseTrail', pulseDetail: 'pulseDetail',
    bulbDetail: 'bulbDetail', bulbAudio: 'bulbAudio', bulbOrbit: 'bulbOrbit',
    bulbFold: 'bulbFold', bulbGlow: 'bulbGlow', bulbCamera: 'bulbCamera'
  };
  Object.entries(normalizedStateControls).forEach(([id, stateKey]) => {
    const outputId = id === 'equationMod' ? 'equationValue' : `${id}Value`;
    $(`#${outputId}`).value = visualPresetController.formatPercent(id, state[stateKey]);
  });
  coordinateExportSettingsChange('initialize', { refreshEncoder: !isObsOutput });
  updateObsChromaUi();
  updateObsOutputUi(false);
  workspaceUi.initializePanelResizer();
  if (!isObsOutput) {
    audioSourceController.initialize();
    audioModulationController.initialize();
    profileService.initialize();
    performanceShowController.initializeShow();
    showComposerOrchestrator.initializeShowComposer();
    performanceShowController.initializePerformanceMode();
    performancePackageController.initializePackages();
    obsAutomationController.initialize();
    initializeAdvancedOutput();
    liveControlController.initialize();
    cameraController.initialize();
    operatorTools.initializeCreativeTools();
    operatorTools.initializePerformanceAssistant();
    operatorTools.initializeReportCenter();
    performancePackageController.initializeSession();
    audioSourceController.refreshInputs({ requestPermission: false, silent: true }).catch(() => {});
    audioSourceController.refreshWindowsOutputs({ silent: true }).catch(() => {});
    audioSourceController.refreshDeckOutputs({ silent: true }).catch(() => {});
    window.quarticDesktop.onObsOutputStatus(updateObsOutputUi);
    window.quarticDesktop.getObsOutputStatus().then(updateObsOutputUi).catch(() => {});
    visualPresetController.initializeSafety();
  }
  workspaceUi.activateTab('music');
  requestAnimationFrame(render);
})();
