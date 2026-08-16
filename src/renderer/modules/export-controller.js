(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const root = options.root || document.body;
    const offlineControlSelectors = Object.freeze([
      '#resolution', '#fps', '#videoFormat', '#exportIterations', '#exportDetail',
      '#exportSupersampling', '#exportHdrOutput', '#exportMode', '#unleashedMode', '#performanceMode'
    ]);
    const liveControlSelectors = Object.freeze([
      '#resolution', '#fps', '#videoFormat', '#exportDetail',
      '#exportMode', '#unleashedMode', '#performanceMode'
    ]);
    let bound = false;
    let offlineState = 'idle';
    let liveState = 'idle';
    let benchmarkState = 'idle';
    let encoderScanState = 'idle';
    let recoveryState = 'idle';

    function listen(selector, type, callback) {
      query(selector)?.addEventListener(type, callback);
    }

    function bind() {
      if (bound) return;
      listen('#endExportButton', 'click', () => options.onEnd?.());
      listen('#cancelExportButton', 'click', () => options.onCancel?.());
      listen('#pauseExportButton', 'click', () => options.onPause?.());
      listen('#resolution', 'change', (event) => options.onResolutionChange?.(event));
      listen('#exportIterations', 'input', (event) => options.onIterationsInput?.(event));
      listen('#fps', 'change', (event) => options.onFpsChange?.(event));
      listen('#exportMode', 'change', (event) => options.onModeChange?.(event));
      listen('#exportDetail', 'change', (event) => options.onDetailChange?.(event));
      listen('#exportSupersampling', 'change', (event) => options.onSupersamplingChange?.(event));
      listen('#videoFormat', 'change', (event) => options.onFormatChange?.(event));
      listen('#exportHdrOutput', 'change', (event) => options.onHdrChange?.(event));
      listen('#scanExportEncodersButton', 'click', () => options.onScanEncoders?.());
      listen('#benchmarkExportButton', 'click', () => options.onBenchmark?.());
      listen('#clearExportHistoryButton', 'click', () => options.onClearHistory?.());
      listen('#exportAdvisorList', 'click', (event) => {
        const button = event.target?.closest?.('.export-advisor-option');
        if (button) options.onAdvisorApply?.(Object.freeze({
          resolution: button.dataset.resolution,
          fps: Number(button.dataset.fps),
          iterations: Number(button.dataset.iterations),
          label: button.querySelector?.('strong')?.textContent || 'Recommended settings'
        }));
      });
      listen('#exportHistoryList', 'click', (event) => {
        const button = event.target?.closest?.('[data-export-action]');
        if (button) options.onHistoryAction?.(button.dataset.exportAction, button.dataset.exportId);
      });
      listen('#exportRecoveryList', 'click', (event) => {
        const button = event.target?.closest?.('[data-recovery-action]');
        if (button) options.onRecoveryAction?.(button.dataset.recoveryAction, button.dataset.recoveryId);
      });
      bound = true;
    }

    function readSettings() {
      return Object.freeze({
        resolution: query('#resolution')?.value || '',
        fps: query('#fps')?.value || '',
        format: query('#videoFormat')?.value || '',
        requestedIterations: query('#exportIterations')?.value || '',
        detail: query('#exportDetail')?.value || '',
        supersampling: Boolean(query('#exportSupersampling')?.checked),
        hdrOutput: Boolean(query('#exportHdrOutput')?.checked),
        showPreview: Boolean(query('#showExportPreview')?.checked)
      });
    }

    function readSettingChoices() {
      return Object.freeze({
        resolutions: Object.freeze(Array.from(query('#resolution')?.options || []).map((option) => option.value)),
        frameRates: Object.freeze(Array.from(query('#fps')?.options || []).map((option) => Number(option.value)))
      });
    }

    function renderPerformance(view = {}) {
      const note = query('#exportPerformanceNote');
      if (note) {
        note.textContent = view.message || '';
        note.classList.toggle('warning', Boolean(view.warning));
      }
      const summary = query('#exportProfileSummary');
      if (!summary) return;
      const title = summary.querySelector?.('strong');
      const subtitle = summary.querySelector?.('span');
      const detail = summary.querySelector?.('small');
      if (title) title.textContent = view.profileTitle || '';
      if (subtitle) subtitle.textContent = view.profileSubtitle || '';
      if (detail) detail.textContent = view.profileDetail || '';
    }

    function renderEncoderStatus(view = {}) {
      const status = query('#exportEncoderStatus');
      if (!status) return;
      status.classList.toggle('ready', view.ready !== false);
      const title = status.querySelector?.('strong');
      const detail = status.querySelector?.('small');
      if (title) title.textContent = view.title || '';
      if (detail) detail.textContent = view.detail || '';
    }

    function renderPreflight(view = {}) {
      const fields = {
        '#preflightVideo': view.video,
        '#preflightEncoder': view.encoder,
        '#preflightFormat': view.format,
        '#preflightColor': view.color,
        '#preflightBitrate': view.bitrate,
        '#preflightOutput': view.output,
        '#preflightSpace': view.space,
        '#preflightFree': view.free,
        '#preflightDuration': view.duration
      };
      for (const [selector, value] of Object.entries(fields)) {
        const element = query(selector);
        if (element) element.textContent = value || '—';
      }
      const summary = query('#exportPreflightSummary');
      if (summary) summary.textContent = view.summary || '';
      const warning = query('#preflightWarning');
      if (warning) {
        warning.hidden = !view.warning;
        warning.textContent = view.warning || '';
      }
      const testButton = query('#preflightTestButton');
      if (testButton) testButton.disabled = Boolean(view.testDisabled);
    }

    function showPreflightLoading(message = 'Testing encoders and estimating storage…') {
      const summary = query('#exportPreflightSummary');
      if (summary) summary.textContent = message;
      const dialog = query('#exportPreflightDialog');
      if (dialog) dialog.hidden = false;
    }

    function setPreflightVisible(visible) {
      const dialog = query('#exportPreflightDialog');
      if (dialog) dialog.hidden = !visible;
    }

    function setPreflightTestDisabled(disabled) {
      const button = query('#preflightTestButton');
      if (button) button.disabled = Boolean(disabled);
    }

    async function requestPreflightChoice(options = {}) {
      if (typeof options.load !== 'function') {
        throw new TypeError('Export preflight choice requires a load operation.');
      }
      showPreflightLoading(options.loadingMessage);
      let preflight;
      try {
        preflight = await options.load();
        await options.loaded?.(preflight);
      } catch (error) {
        setPreflightVisible(false);
        throw error;
      }

      const cancelButton = query('#preflightCancelButton');
      const startButton = query('#preflightStartButton');
      const testButton = query('#preflightTestButton');
      return new Promise((resolve) => {
        let settled = false;
        const cleanup = () => {
          if (cancelButton) cancelButton.onclick = null;
          if (startButton) startButton.onclick = null;
          if (testButton) testButton.onclick = null;
        };
        const close = (choice) => {
          if (settled) return;
          settled = true;
          cleanup();
          setPreflightVisible(false);
          resolve(choice);
        };
        if (cancelButton) cancelButton.onclick = () => close(null);
        if (startButton) startButton.onclick = () => close({ preflight, test: false });
        if (testButton) testButton.onclick = async () => {
          setPreflightTestDisabled(true);
          try {
            if (typeof options.loadTest !== 'function') throw new Error('Test export preflight is unavailable.');
            const testPreflight = await options.loadTest(preflight);
            close({ preflight: testPreflight, test: true });
          } catch (error) {
            setPreflightTestDisabled(false);
            await options.failed?.(error);
          }
        };
      });
    }

    function renderEncoderCapabilities(view = {}) {
      const devices = query('#exportEncoderDevices');
      const list = query('#exportEncoderCapabilityList');
      if (!devices || !list) return;
      devices.replaceChildren();
      list.replaceChildren();
      devices.textContent = view.devicesText || 'Detected: no named GPU devices';
      const decision = query('#exportEncoderDecision');
      if (decision) decision.textContent = view.decisionText || '';
      for (const encoder of view.encoders || []) {
        const row = document.createElement('div');
        row.className = 'export-encoder-capability-row';
        row.classList.toggle('available', Boolean(encoder.available));
        row.classList.toggle('selected', Boolean(encoder.selected));
        const description = document.createElement('span');
        const name = document.createElement('strong');
        const details = document.createElement('small');
        const status = document.createElement('b');
        name.textContent = encoder.label || '';
        details.textContent = encoder.details || '';
        status.textContent = encoder.status || '';
        description.append(name, details);
        row.append(description, status);
        list.append(row);
      }
    }

    function renderEncoderScanState(nextState, view = {}) {
      encoderScanState = String(nextState || 'idle');
      const button = query('#scanExportEncodersButton');
      const decision = query('#exportEncoderDecision');
      if (encoderScanState === 'running') {
        if (button) {
          button.disabled = true;
          button.textContent = view.buttonText || 'SCANNING ENCODERS…';
        }
        if (decision && view.message !== undefined) decision.textContent = view.message;
        return;
      }
      if (encoderScanState === 'completed') {
        if (view.capabilities) renderEncoderCapabilities(view.capabilities);
        else if (decision && view.message !== undefined) decision.textContent = view.message;
        return;
      }
      if (encoderScanState === 'failed') {
        if (decision) decision.textContent = view.message || 'Encoder compatibility scan failed.';
        return;
      }
      if (encoderScanState === 'restored' || encoderScanState === 'idle') {
        if (button) {
          button.disabled = false;
          button.textContent = view.buttonText || (encoderScanState === 'idle' ? 'SCAN THIS PC' : 'SCAN AGAIN');
        }
        return;
      }
      throw new RangeError(`Unknown encoder scan presentation state: ${encoderScanState}`);
    }

    function renderAdvisor(view = {}) {
      const advisor = query('#exportAdvisor');
      const list = query('#exportAdvisorList');
      if (!advisor || !list) return;
      list.replaceChildren();
      for (const recommendation of view.recommendations || []) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'export-advisor-option';
        button.dataset.resolution = recommendation.resolution;
        button.dataset.fps = String(recommendation.fps);
        button.dataset.iterations = String(recommendation.iterations);
        button.classList.toggle('current', Boolean(recommendation.current));
        const description = document.createElement('span');
        const title = document.createElement('strong');
        const settings = document.createElement('small');
        const time = document.createElement('small');
        title.textContent = recommendation.label || '';
        settings.textContent = recommendation.settings || '';
        time.textContent = recommendation.time || '';
        description.append(title, settings);
        button.append(description, time);
        list.append(button);
      }
      advisor.hidden = false;
    }

    function applyAdvisorSelection(selection = {}, config = {}) {
      const resolution = query('#resolution');
      const fps = query('#fps');
      const iterations = query('#exportIterations');
      if (!resolution || !fps || !iterations) {
        throw new Error('Export advisor controls are unavailable.');
      }
      resolution.value = String(selection.resolution || '');
      fps.value = String(selection.fps || '');
      iterations.value = String(selection.iterations || '');
      if (config.dispatch !== false) {
        resolution.dispatchEvent(new Event('change', { bubbles: true }));
        fps.dispatchEvent(new Event('change', { bubbles: true }));
        iterations.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return Object.freeze({
        resolution: resolution.value,
        fps: Number(fps.value),
        iterations: Number(iterations.value)
      });
    }

    function invalidateBenchmark(message = 'Settings changed. Run the benchmark again for an updated estimate.') {
      const summary = query('#exportReadinessSummary');
      if (summary?.dataset.complete === 'true') {
        summary.dataset.complete = 'false';
        summary.textContent = message;
      }
      const advisor = query('#exportAdvisor');
      if (advisor) advisor.hidden = true;
    }

    function renderBenchmarkState(nextState, view = {}) {
      benchmarkState = String(nextState || 'idle');
      const button = query('#benchmarkExportButton');
      const summary = query('#exportReadinessSummary');
      const note = query('#exportReadinessNote');
      const advisor = query('#exportAdvisor');
      const fields = {
        '#benchmarkEncoderFps': view.encoderFps,
        '#benchmarkRenderFps': view.renderFps,
        '#benchmarkBottleneck': view.bottleneck,
        '#benchmarkMinuteTime': view.minuteTime
      };
      const applyView = () => {
        if (view.summary !== undefined && summary) summary.textContent = view.summary;
        if (view.note !== undefined && note) note.textContent = view.note;
        for (const [selector, value] of Object.entries(fields)) {
          const element = query(selector);
          if (value !== undefined && element) element.textContent = value;
        }
      };
      if (benchmarkState === 'running') {
        if (button) {
          button.disabled = true;
          button.textContent = view.buttonText || 'BENCHMARKING…';
        }
        if (summary) summary.dataset.complete = 'false';
        if (advisor) advisor.hidden = true;
        applyView();
        return;
      }
      if (benchmarkState === 'completed') {
        applyView();
        if (summary) summary.dataset.complete = 'true';
        return;
      }
      if (benchmarkState === 'skipped' || benchmarkState === 'failed') {
        applyView();
        if (summary) summary.dataset.complete = 'false';
        if (advisor) advisor.hidden = true;
        return;
      }
      if (benchmarkState === 'restored' || benchmarkState === 'idle') {
        if (button) {
          button.disabled = false;
          button.textContent = view.buttonText || 'BENCHMARK AGAIN';
        }
        return;
      }
      throw new RangeError(`Unknown export benchmark presentation state: ${benchmarkState}`);
    }

    function renderHistory(entries = []) {
      const list = query('#exportHistoryList');
      if (!list) return;
      list.replaceChildren();
      if (!entries.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No completed exports yet.';
        list.appendChild(empty);
        return;
      }
      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'export-history-entry';
        const details = document.createElement('div');
        const name = document.createElement('strong');
        const meta = document.createElement('small');
        name.textContent = entry.name || '';
        meta.textContent = entry.meta || '';
        details.append(name, meta);
        const actions = document.createElement('div');
        actions.className = 'export-entry-actions';
        for (const [action, label] of [['open', 'OPEN'], ['reveal', 'FOLDER']]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.exportAction = action;
          button.dataset.exportId = entry.id;
          button.textContent = label;
          actions.appendChild(button);
        }
        row.append(details, actions);
        list.appendChild(row);
      }
    }

    function renderRecoveries(entries = []) {
      const card = query('#exportRecoveryCard');
      const list = query('#exportRecoveryList');
      if (!card || !list) return;
      list.replaceChildren();
      card.hidden = entries.length === 0;
      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'export-recovery-entry';
        const details = document.createElement('div');
        const name = document.createElement('strong');
        const meta = document.createElement('small');
        name.textContent = entry.name || '';
        meta.textContent = entry.meta || '';
        details.append(name, meta);
        const actions = document.createElement('div');
        actions.className = 'export-entry-actions';
        for (const [action, label] of [['recover', 'FINISH'], ['discard', 'DISCARD']]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.recoveryAction = action;
          button.dataset.recoveryId = entry.id;
          button.textContent = label;
          if (action === 'recover' && !entry.recoverable) button.disabled = true;
          actions.appendChild(button);
        }
        row.append(details, actions);
        list.appendChild(row);
      }
    }

    function renderRecoveryState(nextState, view = {}) {
      recoveryState = String(nextState || 'idle');
      const exportButton = query('#exportButton');
      const revealButton = query('#revealButton');
      if (recoveryState === 'preparing') {
        root?.classList?.add('exporting');
        root?.classList?.add('hide-export-preview');
        if (exportButton) exportButton.disabled = true;
        if (revealButton) revealButton.hidden = true;
        setOfflineControlsDisabled(true);
        setMode('offline');
        setActions(false, false);
        begin();
        renderProgress({
          overall: 0,
          panelText: view.panelText || 'Recovering interrupted export | overall 0%',
          stageText: view.stageText || 'Inspecting saved frames…',
          metaText: view.metaText || ''
        });
        setNote(view.note || 'Quartic Pulse is validating the saved master and finishing the interrupted video.');
        return;
      }
      if (recoveryState === 'completed') {
        if (revealButton) revealButton.hidden = false;
        if (view.note) setNote(view.note);
        return;
      }
      if (recoveryState === 'failed') {
        if (view.panelText || view.stageText) {
          renderProgress({ overall: 0, panelText: view.panelText, stageText: view.stageText, metaText: '' });
        }
        if (view.note) setNote(view.note);
        return;
      }
      if (recoveryState === 'restored' || recoveryState === 'idle') {
        root?.classList?.remove('exporting');
        root?.classList?.remove('hide-export-preview');
        if (exportButton) exportButton.disabled = false;
        setOfflineControlsDisabled(false);
        if (!view.completed) hide();
        return;
      }
      throw new RangeError(`Unknown export recovery presentation state: ${recoveryState}`);
    }

    function setHdrAvailability(available) {
      const control = query('#exportHdrOutput');
      if (!control) return;
      control.disabled = !available;
      control.closest?.('.toggle-row')?.classList.toggle('disabled', !available);
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

    function setOfflineControlsDisabled(disabled) {
      for (const selector of offlineControlSelectors) {
        const control = query(selector);
        if (control) control.disabled = Boolean(disabled);
      }
    }

    function setLiveControlsDisabled(disabled) {
      for (const selector of liveControlSelectors) {
        const control = query(selector);
        if (control) control.disabled = Boolean(disabled);
      }
      const loopPlayback = query('#loopPlayback');
      if (loopPlayback) loopPlayback.disabled = Boolean(disabled);
    }

    function renderLiveState(nextState, view = {}) {
      liveState = String(nextState || 'idle');
      const exportButton = query('#exportButton');
      const exportLabel = query('#exportLabel');
      const exportIcon = query('#exportIcon');
      const revealButton = query('#revealButton');
      if (liveState === 'preparing') {
        if (exportLabel) exportLabel.textContent = view.label || 'PREPARING LIVE EXPORT…';
        if (exportButton) exportButton.disabled = true;
        if (revealButton) revealButton.hidden = true;
        return;
      }
      if (liveState === 'recording') {
        root?.classList?.add('exporting');
        root?.classList?.toggle('hide-export-preview', Boolean(view.hidePreview));
        if (revealButton) revealButton.hidden = true;
        if (exportButton) {
          exportButton.disabled = false;
          exportButton.classList.add('recording');
        }
        if (exportLabel) exportLabel.textContent = view.label || 'STOP & SAVE';
        if (exportIcon) exportIcon.textContent = '■';
        setLiveControlsDisabled(true);
        setMode('live');
        setActions(true, true);
        begin();
        return;
      }
      if (liveState === 'stopping' || liveState === 'finalizing' || liveState === 'cancelling') {
        const labels = {
          stopping: 'ENDING & FINISHING…',
          finalizing: 'FINALIZING…',
          cancelling: 'CANCELLING…'
        };
        if (exportLabel) exportLabel.textContent = view.label || labels[liveState];
        if (exportButton) exportButton.disabled = true;
        if (view.note) setNote(view.note);
        else if (liveState === 'stopping') setNote('Stopping the live recording, then finishing and saving the shortened video.');
        else if (liveState === 'cancelling') setNote('Cancelling the export and discarding its temporary output.');
        setActions(false, liveState === 'stopping');
        return;
      }
      if (liveState === 'completed') {
        if (revealButton) revealButton.hidden = false;
        return;
      }
      if (liveState === 'cancelled' || liveState === 'failed') {
        hide();
        return;
      }
      if (liveState === 'restored' || liveState === 'idle') {
        root?.classList?.remove('exporting');
        root?.classList?.remove('hide-export-preview');
        if (exportButton) {
          exportButton.classList.remove('recording');
          exportButton.disabled = false;
        }
        if (exportLabel) exportLabel.textContent = 'EXPORT VIDEO';
        if (exportIcon) exportIcon.textContent = '●';
        setLiveControlsDisabled(false);
        if (!view.completed) hide();
        return;
      }
      throw new RangeError(`Unknown live export presentation state: ${liveState}`);
    }

    function renderOfflineState(nextState, view = {}) {
      offlineState = String(nextState || 'idle');
      const exportButton = query('#exportButton');
      const exportLabel = query('#exportLabel');
      const exportIcon = query('#exportIcon');
      const revealButton = query('#revealButton');
      if (offlineState === 'preparing') {
        if (exportLabel) exportLabel.textContent = view.label || 'PREPARING OFFLINE AUDIO…';
        if (exportButton) exportButton.disabled = true;
        return;
      }
      if (offlineState === 'rendering') {
        root?.classList?.add('exporting');
        root?.classList?.toggle('hide-export-preview', Boolean(view.hidePreview));
        if (revealButton) revealButton.hidden = true;
        if (exportButton) {
          exportButton.disabled = false;
          exportButton.classList.add('recording');
        }
        if (exportLabel) exportLabel.textContent = view.label || 'END & FINISH';
        if (exportIcon) exportIcon.textContent = '■';
        setOfflineControlsDisabled(true);
        setMode('offline');
        setActions(true, true);
        begin();
        return;
      }
      if (offlineState === 'ending' || offlineState === 'cancelling') {
        const cancelling = offlineState === 'cancelling';
        setPaused(false);
        if (exportLabel) exportLabel.textContent = view.label || (cancelling ? 'CANCELLING…' : 'ENDING & FINISHING…');
        if (exportButton) exportButton.disabled = true;
        setNote(view.note || (cancelling
          ? 'Cancelling the export and discarding its temporary output.'
          : 'Stopping after the current frame, then finishing and saving the shortened video.'));
        setActions(false, !cancelling);
        return;
      }
      if (offlineState === 'finalizing') {
        setActions(false, true);
        if (exportLabel) exportLabel.textContent = view.shortened
          ? 'FINISHING SHORT EXPORT…'
          : 'FINALIZING QUALITY MASTER…';
        if (exportButton) exportButton.disabled = true;
        return;
      }
      if (offlineState === 'completed') {
        if (revealButton) revealButton.hidden = false;
        return;
      }
      if (offlineState === 'cancelled' || offlineState === 'failed') {
        hide();
        return;
      }
      if (offlineState === 'restored' || offlineState === 'idle') {
        root?.classList?.remove('exporting');
        root?.classList?.remove('hide-export-preview');
        if (exportButton) {
          exportButton.classList.remove('recording');
          exportButton.disabled = false;
        }
        if (exportLabel) exportLabel.textContent = 'EXPORT VIDEO';
        if (exportIcon) exportIcon.textContent = '●';
        setOfflineControlsDisabled(false);
        if (!view.completed) hide();
        return;
      }
      throw new RangeError(`Unknown offline export presentation state: ${offlineState}`);
    }

    return {
      bind,
      begin,
      applyAdvisorSelection,
      getPanelText,
      hide,
      invalidateBenchmark,
      readSettings,
      readSettingChoices,
      renderAdvisor,
      renderBenchmarkState,
      renderEncoderCapabilities,
      renderEncoderScanState,
      renderEncoderStatus,
      renderHistory,
      renderLiveState,
      renderOfflineState,
      renderRecoveryState,
      renderRecoveries,
      renderPerformance,
      renderPreflight,
      renderProgress,
      requestPreflightChoice,
      setActions,
      setHdrAvailability,
      setMode,
      setNote,
      setPaused,
      setPreflightTestDisabled,
      setPreflightVisible,
      showPreflightLoading,
      get diagnostics() {
        return {
          ready: Boolean(query('#exportProgress') && query('#stageRenderText') && query('#stageRenderMeta')),
          presentationReady: Boolean(query('#exportPerformanceNote') && query('#exportEncoderStatus')
            && query('#exportPreflightDialog') && query('#exportHistoryList') && query('#exportRecoveryList')),
          preflightChoiceReady: Boolean(query('#preflightCancelButton') && query('#preflightStartButton')
            && query('#preflightTestButton')),
          benchmarkStateReady: Boolean(query('#benchmarkExportButton') && query('#exportReadinessSummary')
            && query('#exportReadinessNote') && query('#benchmarkEncoderFps') && query('#benchmarkRenderFps')
            && query('#benchmarkBottleneck') && query('#benchmarkMinuteTime')),
          encoderScanStateReady: Boolean(query('#scanExportEncodersButton') && query('#exportEncoderDecision')
            && query('#exportEncoderDevices') && query('#exportEncoderCapabilityList')),
          advisorApplicationReady: Boolean(query('#exportAdvisorList') && query('#resolution')
            && query('#fps') && query('#exportIterations')),
          recoveryStateReady: Boolean(query('#exportRecoveryCard') && query('#exportRecoveryList')
            && query('#exportProgress') && query('#revealButton')),
          offlineStateReady: Boolean(query('#exportButton') && query('#exportLabel') && query('#exportIcon')
            && query('#revealButton') && offlineControlSelectors.every((selector) => query(selector))),
          liveStateReady: Boolean(query('#exportButton') && query('#exportLabel') && query('#exportIcon')
            && query('#revealButton') && query('#loopPlayback')
            && liveControlSelectors.every((selector) => query(selector))),
          offlineState,
          liveState,
          benchmarkState,
          encoderScanState,
          recoveryState,
          bound
        };
      }
    };
  }

  window.QuarticExportController = Object.freeze({ create });
})();
