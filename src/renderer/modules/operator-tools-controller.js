(() => {
  'use strict';

  function create(options = {}) {
    const {
      query: $,
      state,
      storage = localStorage,
      desktop,
      profileService,
      cameraControllerFactory,
      canvas,
      combinedRenderModulation,
      updateZoomControls,
      exportQuickClipWorkflowEngine,
      audioSourceController,
      exportLiveCaptureEngine,
      performanceAnalysisEngine,
      coordinateExportSettingsChange,
      gl,
      clamp,
      formatByteSize,
      showToast,
      isObsOutput = false
    } = options;
    if (!$ || !state || !desktop || !profileService || !cameraControllerFactory || !canvas || !performanceAnalysisEngine) {
      throw new Error('Operator tools controller requires UI, state, profile, camera, performance, and desktop dependencies.');
    }

    const creativeToolsStorageKey = 'quarticPulseCreativeToolsV1';
    let randomizerUndoSnapshot = null;
    let performanceAnalysis = null;
    let performanceReport = null;
    let pendingScreenshotRequest = null;
    const cameraController = cameraControllerFactory.create({
      query: $,
      canvas,
      state,
      storage: localStorage,
      showToast,
      combineModulation: combinedRenderModulation,
      updateZoomControls
    });

    function currentNowPlayingTitle() {
      if (state.nowPlayingTitle.trim()) return state.nowPlayingTitle.trim();
      const source = state.audioName || state.liveAudioLabel || 'Quartic Pulse';
      return source.replace(/\.[a-z0-9]{2,5}$/i, '');
    }

    function updateNowPlayingOverlay() {
      const overlay = $('#nowPlayingOverlay');
      if (!overlay) return;
      overlay.classList.remove('bottom-left', 'bottom-right', 'top-left', 'top-right');
      overlay.classList.add(['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(state.nowPlayingPosition) ? state.nowPlayingPosition : 'bottom-left');
      overlay.classList.toggle('visible', Boolean(state.nowPlayingEnabled));
      overlay.setAttribute('aria-hidden', String(!state.nowPlayingEnabled));
      $('#nowPlayingTitle').textContent = currentNowPlayingTitle();
      $('#nowPlayingArtist').textContent = state.nowPlayingArtist.trim() || 'Tempest Mainframe';
    }


    function setRangeRandom(id, minimum, maximum) {
      const control = $(`#${id}`);
      if (!control) return;
      control.value = String(minimum + Math.random() * (maximum - minimum));
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control._syncNumericValue?.();
    }

    function randomizeVisuals(level) {
      randomizerUndoSnapshot = profileService.capture('settings');
      const amount = level === 'gentle' ? .3 : (level === 'bold' ? .65 : 1);
      if (!$('#lockVisual').checked) {
        const control = $('#visualStyle');
        control.value = String(Math.floor(Math.random() * control.options.length));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (!$('#lockEquation').checked && state.visualStyle === 0) {
        const control = $('#fractalType');
        control.value = String(Math.floor(Math.random() * control.options.length));
        control.dispatchEvent(new Event('change', { bubbles: true }));
        if (level !== 'gentle') {
          $('#equationFolding').checked = Math.random() > .35;
          $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
          setRangeRandom('equationFold', .15, .25 + amount * .7);
          setRangeRandom('equationWarp', .08, .2 + amount * 1.1);
        }
      }
      if (!$('#lockColors').checked) document.querySelector(`.palette[data-palette="${Math.floor(Math.random() * 5)}"]`)?.click();
      if (!$('#lockMotion').checked) {
        setRangeRandom('flow', .12, .25 + amount * 1.6);
        setRangeRandom('motion', .45, .8 + amount * 2.5);
        setRangeRandom('spin', -.15 - amount * .55, .15 + amount * .55);
      }
      if (!$('#lockReactivity').checked) {
        setRangeRandom('reactivity', .65, .8 + amount * 2.2);
        setRangeRandom('frequencyColorAmount', .35, .5 + amount * 1.1);
      }
      if (!$('#lockCamera').checked) {
        state.center.x += (Math.random() - .5) * amount * .35 / Math.sqrt(state.zoom);
        state.center.y += (Math.random() - .5) * amount * .28 / Math.sqrt(state.zoom);
        state.zoom = clamp(state.zoom * Math.exp((Math.random() - .35) * amount * 2), .4, 12000);
        updateZoomControls();
      }
      $('#randomizerUndoButton').disabled = false;
      $('#randomizerStatus').textContent = level.toUpperCase();
      showToast(`${level[0].toUpperCase()}${level.slice(1)} variation created`);
    }

    function undoRandomizer() {
      if (!randomizerUndoSnapshot) return;
      profileService.applyColors(randomizerUndoSnapshot);
      profileService.applyFullControls(randomizerUndoSnapshot.controls);
      if (randomizerUndoSnapshot.center) state.center = { ...randomizerUndoSnapshot.center };
      updateZoomControls();
      randomizerUndoSnapshot = null;
      $('#randomizerUndoButton').disabled = true;
      $('#randomizerStatus').textContent = 'RESTORED';
      showToast('Previous settings restored');
    }

    async function captureScreenshot() {
      if (pendingScreenshotRequest) throw new Error('A screenshot is already being captured.');
      const blob = await new Promise((resolve, reject) => { pendingScreenshotRequest = { resolve, reject }; });
      const outputPath = await window.quarticDesktop.saveScreenshot(await blob.arrayBuffer());
      if (outputPath) showToast(`Screenshot saved: ${outputPath}`);
    }

    async function captureQuickClip() {
      if (exportQuickClipWorkflowEngine.diagnostics.active || state.exporting) {
        return showToast('A recording is already active.', true);
      }
      return exportQuickClipWorkflowEngine.run({
        duration: $('#quickClipDuration').value,
        beginSession: () => window.quarticDesktop.beginExport({
          suggestedName: `${state.audioName || 'Quartic-Pulse'}-clip`,
          format: 'mp4'
        }),
        prepare: async () => {
          audioSourceController.createGraph();
          await audioSourceController.context.resume();
        },
        createCapture: ({ session }) => exportLiveCaptureEngine.createCapture({
          canvas,
          audioStream: audioSourceController.recordingDestination.stream,
          width: canvas.width,
          height: canvas.height,
          fps: 60,
          onChunk: (bytes) => window.quarticDesktop.appendExport(session.id, bytes)
        }),
        started: ({ duration }) => {
          $('#quickCaptureStatus').textContent = `RECORDING ${duration}s`;
          $('#captureClipButton').disabled = true;
        },
        progress: ({ progress }) => {
          $('#quickCaptureProgress').style.width = `${Math.round(progress * 1000) / 10}%`;
        },
        finalize: (sessionId) => window.quarticDesktop.finishExport(sessionId),
        abort: (sessionId) => window.quarticDesktop.abortExport(sessionId),
        completed: ({ result }) => {
          $('#quickCaptureProgress').style.width = '100%';
          $('#quickCaptureStatus').textContent = 'SAVED';
          showToast(result.warning || `Quick clip saved: ${result.outputPath}`, Boolean(result.warning));
        },
        failed: () => { $('#quickCaptureStatus').textContent = 'FAILED'; },
        restored: () => {
          $('#captureClipButton').disabled = false;
          setTimeout(() => {
            if (!exportQuickClipWorkflowEngine.diagnostics.active) $('#quickCaptureProgress').style.width = '0%';
          }, 1200);
        }
      });
    }

    function initializeCreativeTools() {
      try {
        const settings = JSON.parse(localStorage.getItem(creativeToolsStorageKey) || '{}');
        state.nowPlayingEnabled = Boolean(settings.nowPlayingEnabled);
        state.nowPlayingTitle = typeof settings.nowPlayingTitle === 'string' ? settings.nowPlayingTitle.slice(0, 80) : '';
        state.nowPlayingArtist = typeof settings.nowPlayingArtist === 'string' ? settings.nowPlayingArtist.slice(0, 80) : 'Tempest Mainframe';
        state.nowPlayingPosition = ['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(settings.nowPlayingPosition) ? settings.nowPlayingPosition : 'bottom-left';
      } catch (_) { /* Creative-tool persistence is optional. */ }
      $('#nowPlayingEnabled').checked = state.nowPlayingEnabled;
      $('#nowPlayingTitleInput').value = state.nowPlayingTitle;
      $('#nowPlayingArtistInput').value = state.nowPlayingArtist;
      $('#nowPlayingPosition').value = state.nowPlayingPosition;
      const persistPresentation = () => localStorage.setItem(creativeToolsStorageKey, JSON.stringify({
        nowPlayingEnabled: state.nowPlayingEnabled,
        nowPlayingTitle: state.nowPlayingTitle,
        nowPlayingArtist: state.nowPlayingArtist,
        nowPlayingPosition: state.nowPlayingPosition
      }));
      document.querySelector('.randomizer-actions').addEventListener('click', (event) => {
        const level = event.target.closest('[data-randomize]')?.dataset.randomize;
        if (level) randomizeVisuals(level);
      });
      $('#randomizerUndoButton').addEventListener('click', undoRandomizer);
      $('#captureScreenshotButton').addEventListener('click', () => captureScreenshot().catch((error) => showToast(`Screenshot: ${error.message}`, true)));
      $('#captureClipButton').addEventListener('click', () => captureQuickClip().catch((error) => showToast(`Quick clip: ${error.message}`, true)));
      $('#nowPlayingEnabled').addEventListener('change', (event) => { state.nowPlayingEnabled = event.target.checked; updateNowPlayingOverlay(); persistPresentation(); });
      $('#nowPlayingTitleInput').addEventListener('input', (event) => { state.nowPlayingTitle = event.target.value; updateNowPlayingOverlay(); persistPresentation(); });
      $('#nowPlayingArtistInput').addEventListener('input', (event) => { state.nowPlayingArtist = event.target.value; updateNowPlayingOverlay(); persistPresentation(); });
      $('#nowPlayingPosition').addEventListener('change', (event) => { state.nowPlayingPosition = event.target.value; updateNowPlayingOverlay(); persistPresentation(); });
      updateNowPlayingOverlay();
    }

    function finishPerformanceAnalysis() {
      if (!performanceAnalysis) return;
      performanceReport = performanceAnalysisEngine.analyzeSamples({
        samples: performanceAnalysis.samples,
        frameTime: state.frameTime,
        iterations: state.iterations,
        dimensional: state.fractalDimensional,
        folding: state.equationFolding
      });
      performanceAnalysis = null;
      const { tier, p95, averageFps, iterations, disableHeavy, detail } = performanceReport;
      $('#performanceAssistantStatus').textContent = tier.toUpperCase();
      $('#performanceAnalysisProgress').style.width = '100%';
      $('#performanceRecommendations').innerHTML = `<strong>${Math.round(averageFps)} FPS typical · ${p95.toFixed(1)} ms 95th percentile</strong><br>${detail}<br>Suggested live iterations: ${iterations}${disableHeavy ? ' · turn off Dimensional Rotation and Equation Folding' : ''}.`;
      $('#applyPerformanceButton').disabled = false;
      $('#analyzePerformanceButton').disabled = false;
      $('#analyzePerformanceButton').textContent = 'ANALYZE AGAIN';
    }

    function collectPerformanceSample(frameMilliseconds, now) {
      if (!performanceAnalysis || isObsOutput) return;
      performanceAnalysis.samples.push(frameMilliseconds);
      const progress = (now - performanceAnalysis.startedAt) / performanceAnalysis.durationMs;
      $('#performanceAnalysisProgress').style.width = `${clamp(progress * 100, 0, 100)}%`;
      $('#performanceAssistantStatus').textContent = `ANALYZING ${Math.round(clamp(progress, 0, 1) * 100)}%`;
      if (progress >= 1) finishPerformanceAnalysis();
    }

    function updatePerformanceAssistantUi() {
      if (!$('#performanceFpsValue')) return;
      $('#performanceFpsValue').textContent = String(Math.round(1000 / Math.max(1, state.frameTime)));
      $('#performanceFrameValue').textContent = state.frameTime.toFixed(1);
      $('#performanceScaleValue').textContent = String(Math.round(state.performanceScale * 100));
      $('#performanceProtection').checked = state.adaptiveQuality;
    }

    function applyPerformancePreset(name) {
      const presets = {
        average: { iterations: 160, dimensional: false, folding: false, detail: 1.6 },
        balanced: { iterations: 220, dimensional: false, folding: false, detail: 1.6 },
        showcase: { iterations: 340, dimensional: state.fractalDimensional, folding: state.equationFolding, detail: 2.3 }
      };
      const preset = presets[name];
      if (!preset) return;
      $('#adaptiveQuality').checked = true;
      $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
      $('#iterations').value = String(preset.iterations);
      $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
      $('#iterations')._syncNumericValue?.();
      if (name !== 'showcase') {
        $('#fractalDimensional').checked = preset.dimensional;
        $('#fractalDimensional').dispatchEvent(new Event('change', { bubbles: true }));
        $('#equationFolding').checked = preset.folding;
        $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
      }
      $('#exportDetail').value = String(preset.detail);
      $('#performanceAssistantStatus').textContent = `${name.toUpperCase()} PRESET`;
      showToast(`${name[0].toUpperCase()}${name.slice(1)} performance preset applied`);
    }

    const performanceSettingsKey = 'quarticPulsePerformanceModeV1';

    function persistPerformanceMode() {
      localStorage.setItem(performanceSettingsKey, JSON.stringify({
        mode: state.performanceMode,
        unleashed: state.unleashedMode
      }));
    }

    function updateUnleashedMode(enabled, { announce = false } = {}) {
      state.unleashedMode = Boolean(enabled);
      $('#unleashedMode').checked = state.unleashedMode;
      $('#iterations').max = state.unleashedMode ? '800' : '500';
      const numericInput = $('#iterations').closest('.slider-group')?.querySelector('.numeric-value-input');
      if (numericInput) numericInput.max = state.unleashedMode ? '800' : '500';
      $('#unleashedExportDetail').disabled = !state.unleashedMode;
      if (!state.unleashedMode) {
        if (Number($('#iterations').value) > 500) {
          $('#iterations').value = '500';
          $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
          $('#iterations')._syncNumericValue?.();
        }
        if (Number($('#exportDetail').value) > 2.3) $('#exportDetail').value = '2.3';
      }
      coordinateExportSettingsChange('unleashed');
      persistPerformanceMode();
      if (announce) showToast(state.unleashedMode
        ? 'Unleashed mode enabled · raised shader limits and live export unlocked'
        : 'Unleashed mode disabled · standard safety limits restored');
    }

    function applyHardwarePerformanceMode(requestedMode, announce = true) {
      const mode = requestedMode === 'auto' ? state.hardwareRecommendation : requestedMode;
      const settings = {
        efficient: { iterations: 150, dimensional: false, folding: false, bulbBudget: .72 },
        balanced: { iterations: 220, dimensional: false, folding: false, bulbBudget: .88 },
        performance: { iterations: 320, dimensional: state.fractalDimensional, folding: state.equationFolding, bulbBudget: 1 }
      }[mode] || { iterations: 220, dimensional: false, folding: false, bulbBudget: .88 };
      state.bulbLiveBudget = settings.bulbBudget;
      $('#adaptiveQuality').checked = true;
      $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
      $('#iterations').value = String(settings.iterations);
      $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
      $('#iterations')._syncNumericValue?.();
      if (mode !== 'performance') {
        $('#fractalDimensional').checked = settings.dimensional;
        $('#fractalDimensional').dispatchEvent(new Event('change', { bubbles: true }));
        $('#equationFolding').checked = settings.folding;
        $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (announce) showToast(`${mode[0].toUpperCase()}${mode.slice(1)} hardware profile applied`);
    }

    async function scanHardware({ applyAutomatic = false } = {}) {
      $('#hardwareSummary').innerHTML = '<strong>SCANNING HARDWARE</strong><small>Reading local CPU, memory, and graphics capabilities…</small>';
      const info = await window.quarticDesktop.getHardwareInfo();
      state.hardwareInfo = info;
      let rendererLabel = 'WebGL renderer';
      try { rendererLabel = gl.getParameter(gl.RENDERER) || rendererLabel; } catch (_) { /* Renderer name is optional. */ }
      state.hardwareRecommendation = performanceAnalysisEngine.recommendHardwareMode(info, rendererLabel);
      const memoryGb = Number(info.totalMemoryBytes || 0) / 1073741824;
      const gpuName = (info.gpuDevices || []).find((device) => device.active)?.deviceString
        || (info.gpuDevices || [])[0]?.deviceString
        || rendererLabel;
      $('#hardwareSummary').replaceChildren();
      const title = document.createElement('strong');
      const details = document.createElement('small');
      title.textContent = `RECOMMENDED · ${state.hardwareRecommendation.toUpperCase()}`;
      const videoMemory = Number(info.videoMemoryMb) > 0 ? ` · ${Math.round(Number(info.videoMemoryMb))} MB reported VRAM` : '';
      details.textContent = `${info.cpuModel} · ${info.logicalProcessors} logical threads · ${memoryGb.toFixed(0)} GB RAM · ${gpuName}${videoMemory}`;
      $('#hardwareSummary').append(title, details);
      if (state.performanceMode === 'auto' && applyAutomatic) applyHardwarePerformanceMode('auto', false);
      return info;
    }

    function initializePerformanceAssistant() {
      let rendererLabel = 'WebGL renderer';
      try { rendererLabel = gl.getParameter(gl.RENDERER) || rendererLabel; } catch (_) { /* Renderer name is optional. */ }
      $('#performanceGpuLabel').textContent = `GPU path: ${rendererLabel}`;
      let storedSettings = null;
      try { storedSettings = JSON.parse(localStorage.getItem(performanceSettingsKey) || 'null'); } catch (_) { /* Use automatic defaults. */ }
      state.performanceMode = ['auto', 'efficient', 'balanced', 'performance'].includes(storedSettings?.mode) ? storedSettings.mode : 'auto';
      $('#performanceMode').value = state.performanceMode;
      updateUnleashedMode(Boolean(storedSettings?.unleashed));
      if (state.performanceMode !== 'auto') applyHardwarePerformanceMode(state.performanceMode, false);
      $('#performanceMode').addEventListener('change', (event) => {
        state.performanceMode = event.target.value;
        persistPerformanceMode();
        applyHardwarePerformanceMode(state.performanceMode);
      });
      $('#unleashedMode').addEventListener('change', (event) => updateUnleashedMode(event.target.checked, { announce: true }));
      $('#rescanHardwareButton').addEventListener('click', () => scanHardware({ applyAutomatic: true }).then(() => showToast('Hardware profile refreshed')).catch((error) => showToast(`Hardware scan: ${error.message}`, true)));
      $('#performanceProtection').checked = state.adaptiveQuality;
      $('#performanceProtection').addEventListener('change', (event) => {
        $('#adaptiveQuality').checked = event.target.checked;
        $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
      });
      $('#analyzePerformanceButton').addEventListener('click', () => {
        performanceReport = null;
        performanceAnalysis = { startedAt: performance.now(), durationMs: 8000, samples: [] };
        $('#performanceAnalysisProgress').style.width = '0%';
        $('#performanceRecommendations').textContent = 'Keep music playing and leave the visual you want to test on screen.';
        $('#applyPerformanceButton').disabled = true;
        $('#analyzePerformanceButton').disabled = true;
        $('#analyzePerformanceButton').textContent = 'ANALYZING…';
      });
      $('#applyPerformanceButton').addEventListener('click', () => {
        if (!performanceReport) return;
        $('#adaptiveQuality').checked = true;
        $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
        $('#iterations').value = String(performanceReport.iterations);
        $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
        $('#iterations')._syncNumericValue?.();
        if (performanceReport.disableHeavy) {
          $('#fractalDimensional').checked = false;
          $('#fractalDimensional').dispatchEvent(new Event('change', { bubbles: true }));
          $('#equationFolding').checked = false;
          $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
        }
        showToast('Performance recommendations applied');
      });
      document.querySelector('.performance-presets').addEventListener('click', (event) => {
        const name = event.target.closest('[data-performance-preset]')?.dataset.performancePreset;
        if (name) applyPerformancePreset(name);
      });
      updatePerformanceAssistantUi();
      scanHardware({ applyAutomatic: true }).catch((error) => {
        $('#hardwareSummary').replaceChildren();
        const title = document.createElement('strong');
        const details = document.createElement('small');
        title.textContent = 'HARDWARE SCAN UNAVAILABLE';
        details.textContent = error.message;
        $('#hardwareSummary').append(title, details);
      });
    }

    let reportDiagnostics = null;
    let reportSelectedIncidentId = '';
    let reportGeneratedId = '';

    function rendererReportSnapshot() {
      let webglRenderer = 'Unknown WebGL renderer';
      try { webglRenderer = gl.getParameter(gl.RENDERER) || webglRenderer; } catch (_) { /* Renderer label is optional. */ }
      return {
        visualStyle: state.visualStyle,
        fractalType: state.fractalType,
        audioMode: state.audioMode,
        exporting: state.exporting,
        exportMode: $('#exportMode')?.value || 'offline',
        resolution: $('#resolution')?.value || '',
        fps: $('#fps')?.value || '',
        performanceMode: state.performanceMode,
        unleashed: state.unleashedMode,
        adaptiveQuality: state.adaptiveQuality,
        interfaceMode: state.interfaceMode,
        webglRenderer
      };
    }

    function reportIncidentLabel(incident) {
      const time = new Date(incident.timestamp);
      const date = Number.isNaN(time.getTime()) ? 'Unknown time' : time.toLocaleString();
      return `${date} · ${incident.source} · ${incident.message}`.slice(0, 180);
    }

    function renderReportIncidents() {
      const incidents = reportDiagnostics?.incidents || [];
      const select = $('#reportIncidentSelect');
      select.replaceChildren();
      if (!incidents.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No captured crashes';
        select.appendChild(option);
        reportSelectedIncidentId = '';
      } else {
        incidents.forEach((incident) => {
          const option = document.createElement('option');
          option.value = incident.id;
          option.textContent = reportIncidentLabel(incident);
          select.appendChild(option);
        });
        if (!incidents.some((incident) => incident.id === select.value)) select.value = incidents[0].id;
      }
      $('#reportIncidentCount').textContent = `${incidents.length} SAVED`;
      $('#reportUseIncidentButton').disabled = !incidents.length;
      $('#reportClearIncidentsButton').disabled = !incidents.length;
      const selected = Boolean(reportSelectedIncidentId && incidents.some((incident) => incident.id === reportSelectedIncidentId));
      $('#reportUseIncidentButton').classList.toggle('active', selected);
      $('#reportUseIncidentButton').textContent = selected ? 'REMOVE SELECTED' : 'INCLUDE SELECTED';
    }

    function reportValue(id, fallback = 'Not provided') {
      const value = $(`#${id}`).value.trim();
      return value || fallback;
    }

    function sanitizeGeneratedReport(value) {
      return String(value || '')
        .replace(/https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+/gi, '[REDACTED_DISCORD_WEBHOOK]')
        .replace(/([?&](?:token|key|secret|password)=)[^&\s]+/gi, '$1[REDACTED]');
    }

    function buildReportText(diagnostics) {
      const incident = diagnostics?.incidents?.find((candidate) => candidate.id === reportSelectedIncidentId);
      const appInfo = diagnostics?.application || {};
      const system = diagnostics?.system || {};
      const renderer = diagnostics?.renderer || {};
      reportGeneratedId = `QP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
      const lines = [
        '# Quartic Pulse Report',
        '',
        `Report ID: ${reportGeneratedId}`,
        `Created: ${new Date().toISOString()}`,
        `Type: ${$('#reportCategory').selectedOptions[0]?.textContent || 'Bug'}`,
        `Summary: ${reportValue('reportSummary')}`,
        `Contact: ${reportValue('reportContact')}`,
        '',
        '## What happened',
        reportValue('reportActual'),
        '',
        '## Steps to reproduce',
        reportValue('reportSteps'),
        '',
        '## Expected result',
        reportValue('reportExpected')
      ];
      if (incident) {
        lines.push('', '## Captured incident',
          `Time: ${incident.timestamp}`,
          `Source: ${incident.source}`,
          `Message: ${incident.message}`,
          incident.stack ? `Stack:\n${incident.stack}` : 'Stack: Not available',
          incident.details ? `Details: ${incident.details}` : '');
      }
      if ($('#reportIncludeDiagnostics').checked) {
        const gpuNames = (system.gpuDevices || []).map((device) => device.deviceString).filter(Boolean);
        lines.push('', '## Sanitized diagnostics',
          `Quartic Pulse: ${appInfo.version || 'Unknown'}${appInfo.packaged ? ' packaged' : ' development'}`,
          `Electron / Chromium: ${appInfo.electron || '?'} / ${appInfo.chromium || '?'}`,
          `Windows: ${system.windowsVersion || system.windowsRelease || 'Unknown'} · ${system.architecture || '?'}`,
          `CPU: ${system.cpuModel || 'Unknown'} · ${system.logicalProcessors || '?'} logical processors`,
          `Memory: ${formatByteSize(system.totalMemoryBytes || 0)} total · ${formatByteSize(system.freeMemoryBytes || 0)} free`,
          `GPU: ${gpuNames.join(' | ') || renderer.webglRenderer || 'Unknown'}`,
          `Visual: style ${renderer.visualStyle ?? '?'} · equation ${renderer.fractalType ?? '?'} · ${renderer.interfaceMode || '?'} UI`,
          `Audio: ${renderer.audioMode || '?'} · Export active: ${renderer.exporting || 'false'}`,
          `Performance: ${renderer.performanceMode || '?'} · Unleashed: ${renderer.unleashed || 'false'} · Adaptive: ${renderer.adaptiveQuality || 'false'}`);
      }
      lines.push('', 'Privacy: Quartic Pulse removes known local user paths, temporary paths, query-string secrets, and Discord webhook URLs. Audio files and audio content are not included.');
      return sanitizeGeneratedReport(lines.filter((line) => line !== '').join('\n\n').replace(/\n{3,}/g, '\n\n')).slice(0, 50000);
    }

    async function refreshReportDiagnostics() {
      reportDiagnostics = await window.quarticDesktop.getReportDiagnostics(rendererReportSnapshot());
      renderReportIncidents();
      const canSubmit = Boolean(reportDiagnostics.submission?.enabled);
      $('#submitReportButton').disabled = !canSubmit || !$('#reportOutput').value;
      $('#reportSubmitNote').classList.toggle('available', canSubmit);
      $('#reportSubmitNote').textContent = canSubmit
        ? 'Secure submission is available. The public relay forwards the sanitized report without revealing Discord credentials.'
        : 'Online submission is not configured in this build. Copy, Save, Print/PDF, and GitHub remain available; Discord credentials are never stored in the public app.';
      return reportDiagnostics;
    }

    function setReportActionsEnabled(enabled) {
      ['copyReportButton', 'saveReportButton', 'printReportButton', 'githubReportButton'].forEach((id) => { $(`#${id}`).disabled = !enabled; });
      $('#submitReportButton').disabled = !enabled || !reportDiagnostics?.submission?.enabled;
    }

    function initializeReportCenter() {
      $('#reportUseIncidentButton').addEventListener('click', () => {
        const selected = $('#reportIncidentSelect').value;
        reportSelectedIncidentId = reportSelectedIncidentId === selected ? '' : selected;
        renderReportIncidents();
      });
      $('#reportClearIncidentsButton').addEventListener('click', async () => {
        if (!window.confirm('Clear the locally saved crash and error history?')) return;
        await window.quarticDesktop.clearReportIncidents();
        reportSelectedIncidentId = '';
        await refreshReportDiagnostics();
        showToast('Local incident history cleared');
      });
      $('#generateReportButton').addEventListener('click', async () => {
        $('#reportCenterStatus').textContent = 'COLLECTING';
        try {
          const diagnostics = await refreshReportDiagnostics();
          const report = buildReportText(diagnostics);
          $('#reportOutput').value = report;
          $('#reportLengthStatus').textContent = `${report.length.toLocaleString()} CHARACTERS`;
          $('#reportCenterStatus').textContent = 'REPORT READY';
          setReportActionsEnabled(true);
        } catch (error) {
          $('#reportCenterStatus').textContent = 'FAILED';
          showToast(`Report generation failed: ${error.message}`, true);
        }
      });
      $('#copyReportButton').addEventListener('click', async () => {
        await navigator.clipboard.writeText($('#reportOutput').value);
        showToast(`${reportGeneratedId || 'Report'} copied to the clipboard`);
      });
      $('#saveReportButton').addEventListener('click', async () => {
        const outputPath = await window.quarticDesktop.saveReport($('#reportOutput').value);
        if (outputPath) showToast('Diagnostic report saved');
      });
      $('#printReportButton').addEventListener('click', async () => {
        const printed = await window.quarticDesktop.printReport($('#reportOutput').value);
        showToast(printed ? 'Report sent to the selected printer' : 'Printing cancelled');
      });
      $('#githubReportButton').addEventListener('click', async () => {
        await navigator.clipboard.writeText($('#reportOutput').value);
        await window.quarticDesktop.openReportIssues();
        showToast('Report copied; paste it into the new GitHub issue');
      });
      $('#submitReportButton').addEventListener('click', async () => {
        $('#submitReportButton').disabled = true;
        $('#reportCenterStatus').textContent = 'SENDING';
        try {
          const result = await window.quarticDesktop.submitReport($('#reportOutput').value);
          $('#reportCenterStatus').textContent = 'SENT';
          showToast(result?.reportId ? `Report ${result.reportId} sent successfully` : 'Report sent successfully');
        } catch (error) {
          $('#reportCenterStatus').textContent = 'SEND FAILED';
          showToast(error.message, true);
        } finally { $('#submitReportButton').disabled = !reportDiagnostics?.submission?.enabled; }
      });
      refreshReportDiagnostics().catch((error) => {
        $('#reportCenterStatus').textContent = 'DIAGNOSTICS UNAVAILABLE';
        showToast(error.message, true);
      });
    }


    function resolvePendingScreenshot() {
      if (!pendingScreenshotRequest || isObsOutput) return false;
      const request = pendingScreenshotRequest;
      pendingScreenshotRequest = null;
      canvas.toBlob((blob) => {
        if (blob) request.resolve(blob);
        else request.reject(new Error('Could not read the rendered visual.'));
      }, 'image/png');
      return true;
    }

    return Object.freeze({
      cameraController,
      currentNowPlayingTitle,
      updateNowPlayingOverlay,
      collectPerformanceSample,
      updatePerformanceAssistantUi,
      updateUnleashedMode,
      resolvePendingScreenshot,
      initializeCreativeTools,
      initializePerformanceAssistant,
      initializeReportCenter,
      get diagnostics() {
        return Object.freeze({ ready: true, screenshotPending: Boolean(pendingScreenshotRequest), performanceAnalysisActive: Boolean(performanceAnalysis) });
      }
    });
  }

  window.QuarticOperatorToolsController = Object.freeze({ create });
})();
