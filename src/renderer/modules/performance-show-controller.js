(() => {
  'use strict';

  function escapeMarkup(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const queryAll = options.queryAll || ((selector) => document.querySelectorAll(selector));
    const documentRef = options.documentRef || document;
    const storage = options.storage || localStorage;
    const state = options.state;
    const sequencer = options.sequencer;
    const dataEngine = options.dataEngine;
    const dock = options.performanceController;
    const composer = options.composerController;
    const clamp = options.clamp || ((value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)));
    const beatClock = options.beatClock || (() => performance.now() / 1000);
    const getProfiles = options.getProfiles || (() => []);
    const createId = options.createId || (() => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
    const requestFrame = options.requestFrame || globalThis.requestAnimationFrame || ((callback) => callback());
    const delay = options.setTimeout || setTimeout;
    if (!state || !sequencer || !dataEngine || !dock || !composer) throw new Error('Performance Show controller dependencies are required.');
    let showBound = false;
    let showInitialized = false;
    let performanceBound = false;
    let performanceInitialized = false;

    function effectiveBpm() {
      return state.autoBpm && state.bpmConfidence >= .18 ? state.detectedBpm : state.manualBpm;
    }

    function updateBeatGrid() {
      const bpm = effectiveBpm();
      const position = (beatClock() - state.beatGridAnchor - state.beatOffsetMs / 1000) * bpm / 60;
      const nextIndex = Math.floor(position);
      const changed = nextIndex !== state.beatGridIndex;
      state.beatGridIndex = nextIndex;
      state.beatGridPhase = position - nextIndex;
      return changed;
    }

    const sanitizeAutomation = (automation) => dataEngine.sanitizeAutomation(automation);
    const sanitizeEntry = (entry) => dataEngine.sanitizeEntry(entry);
    const entryDuration = (entry) => sequencer.entryDurationSeconds(entry, effectiveBpm());
    const sequenceDuration = () => sequencer.sequenceDurationSeconds(state.showSequence, effectiveBpm());
    const entryStart = (index) => sequencer.entryStartSeconds(state.showSequence, index, effectiveBpm());

    function persist() {
      try {
        storage.setItem('quarticPulseShowSequenceV1', JSON.stringify(dataEngine.createShowDocument({
          entries: state.showSequence.map(sanitizeEntry),
          loop: state.showLoop,
          shuffle: state.showShuffle,
          autoBpm: state.autoBpm,
          manualBpm: state.manualBpm,
          beatOffsetMs: state.beatOffsetMs
        })));
      } catch (_) { /* Show persistence is optional. */ }
    }

    function profileForEntry(entry) {
      return dataEngine.findProfile(getProfiles(), entry?.profileId);
    }

    function resetEntryClock() {
      const snapshot = sequencer.clockSnapshot({ time: beatClock(), beat: state.beatGridIndex });
      state.showEntryStartTime = snapshot.time;
      state.showEntryStartBeat = snapshot.beat;
    }

    function nextProfileLabel() {
      if (!state.showSequence.length) return 'No show sequence queued';
      if (state.showShuffle && state.showPlaying) return 'Next: shuffled entry';
      const nextIndex = sequencer.previewNextIndex({ length: state.showSequence.length, index: state.showIndex, loop: state.showLoop });
      if (nextIndex < 0) return 'Next: end of show';
      return `Next: ${profileForEntry(state.showSequence[nextIndex])?.name || 'Missing profile'}`;
    }

    function updateDock() {
      const entry = state.showSequence[state.showIndex];
      const profile = profileForEntry(entry);
      dock.renderDock({
        stateLabel: state.performanceBlackout ? 'BLACKOUT ACTIVE'
          : (state.showPlaying ? 'SHOW PLAYING' : (state.showIndex >= 0 ? 'SHOW PAUSED' : 'PERFORMANCE MODE')),
        currentLabel: profile ? `${state.showIndex + 1}/${state.showSequence.length} · ${profile.name}` : (state.audioName || 'Manual visual'),
        nextLabel: nextProfileLabel(),
        playLabel: state.showPlaying ? 'PAUSE' : (state.showIndex >= 0 ? 'RESUME' : 'START'),
        hasEntries: state.showSequence.length > 0,
        blackout: state.performanceBlackout
      });
    }

    function updateUi() {
      const hasEntries = state.showSequence.length > 0;
      query('#showPlayButton').disabled = !hasEntries;
      query('#showPreviousButton').disabled = !hasEntries;
      query('#showNextButton').disabled = !hasEntries;
      query('#showStopButton').disabled = !state.showPlaying;
      query('#showPlayButton').textContent = state.showPlaying ? 'PAUSE SHOW' : (state.showIndex >= 0 ? 'RESUME SHOW' : 'START SHOW');
      query('#showStatus').textContent = state.showPlaying ? 'PLAYING' : (state.showIndex >= 0 ? 'PAUSED' : 'STOPPED');
      const entry = state.showSequence[state.showIndex];
      const profile = profileForEntry(entry);
      query('#showCurrentLabel').textContent = profile ? `${state.showIndex + 1}/${state.showSequence.length} · ${entry.label || profile.name}` : 'Nothing queued';
      for (const element of queryAll('.show-entry')) element.classList.toggle('active', Number(element.dataset.index) === state.showIndex);
      if (composer.initialized) composer.renderPlaybackState();
      updateDock();
    }

    function renderSequence() {
      const list = query('#showSequenceList');
      if (!list) return;
      list.replaceChildren();
      state.showSequence.forEach((entry, index) => {
        const profile = profileForEntry(entry);
        const element = documentRef.createElement('article');
        element.className = `show-entry${index === state.showIndex ? ' active' : ''}`;
        element.dataset.index = String(index);
        element.innerHTML = `
          <span class="show-entry-index">${index + 1}</span>
          <div class="show-entry-body" data-show-action="select" tabindex="0"><strong>${escapeMarkup(entry.label || profile?.name || 'Missing profile')}</strong><small>${escapeMarkup(profile?.name || 'Missing profile')} · ${entry.advance === 'time' ? `${entry.value} seconds` : `${entry.value} beats`} · ${entry.transition === 'cut' ? 'Cut' : 'Fade through black'}</small></div>
          <button type="button" data-show-action="up" title="Move up">↑</button>
          <button type="button" data-show-action="down" title="Move down">↓</button>
          <button type="button" data-show-action="delete" title="Remove">×</button>`;
        list.appendChild(element);
      });
      query('#showSequenceEmpty').hidden = state.showSequence.length > 0;
      updateUi();
      if (composer.initialized) options.onRenderComposer?.();
    }

    function renderProfileOptions() {
      const select = query('#showProfileSelect');
      if (!select) return;
      const profiles = getProfiles();
      const previous = select.value;
      select.replaceChildren();
      if (!profiles.length) {
        const option = documentRef.createElement('option');
        option.value = '';
        option.textContent = 'No saved profiles';
        select.appendChild(option);
      } else {
        for (const profile of profiles) {
          const option = documentRef.createElement('option');
          option.value = profile.id;
          option.textContent = `${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`;
          select.appendChild(option);
        }
        if (profiles.some((profile) => profile.id === previous)) select.value = previous;
      }
      query('#addShowEntryButton').disabled = !profiles.length;
      renderSequence();
      if (composer.initialized) options.onRenderComposer?.();
    }

    function updateBeatGridUi() {
      const display = query('#beatBpmDisplay');
      if (!display) return;
      display.textContent = effectiveBpm().toFixed(1);
      query('#beatBpmValue').value = `${state.manualBpm.toFixed(1)} BPM`;
      query('#beatOffsetValue').value = `${state.beatOffsetMs} ms`;
      query('#beatGridStatus').textContent = state.autoBpm ? (state.bpmConfidence >= .18 ? 'AUTO LOCKED' : 'AUTO LISTENING') : 'MANUAL';
      query('#beatConfidence').textContent = state.autoBpm
        ? (state.bpmConfidence >= .18 ? `${Math.round(state.bpmConfidence * 100)}% confidence` : 'Waiting for clear beats')
        : 'Using the manual tempo';
      const activeLight = ((state.beatGridIndex % 4) + 4) % 4;
      [...queryAll('#beatGridLights i')].forEach((light, index) => light.classList.toggle('active', index === activeLight && state.beatGridPhase < .32));
    }

    function setBlackout(enabled) {
      state.performanceBlackout = Boolean(enabled);
      documentRef.body.classList.toggle('performance-blackout', state.performanceBlackout);
      query('#performanceBlackoutOverlay')?.setAttribute('aria-hidden', String(!state.performanceBlackout));
      updateDock();
    }

    async function setPerformanceMode(enabled) {
      if (options.isObsOutput) return;
      state.operatorMode = Boolean(enabled);
      const keepHud = query('#performanceShowHud').checked;
      documentRef.body.classList.toggle('performance-mode', state.operatorMode);
      documentRef.body.classList.toggle('performance-hide-hud', state.operatorMode && !keepHud);
      dock.setVisible(state.operatorMode);
      try {
        storage.setItem('quarticPulsePerformanceModeV1', JSON.stringify({
          fullscreen: query('#performanceFullscreen').checked,
          showHud: keepHud
        }));
      } catch (_) { /* Preferences are optional. */ }
      if (state.operatorMode && query('#performanceFullscreen').checked && !documentRef.fullscreenElement) {
        try { await documentRef.documentElement.requestFullscreen(); }
        catch (error) { options.onToast?.(`Fullscreen was not available: ${error.message}`, true); }
      } else if (!state.operatorMode && documentRef.fullscreenElement) {
        try { await documentRef.exitFullscreen(); } catch (_) { /* Already leaving fullscreen. */ }
      }
      if (!state.operatorMode) setBlackout(false);
      updateDock();
      requestFrame(() => options.onResize?.());
    }

    function initializePerformanceMode() {
      if (performanceInitialized) return;
      try {
        const saved = JSON.parse(storage.getItem('quarticPulsePerformanceModeV1') || 'null');
        if (saved && typeof saved === 'object') {
          query('#performanceFullscreen').checked = saved.fullscreen !== false;
          query('#performanceShowHud').checked = saved.showHud !== false;
        }
      } catch (_) { /* Safe defaults. */ }
      if (!performanceBound) {
        performanceBound = true;
        query('#enterPerformanceModeButton').addEventListener('click', () => setPerformanceMode(true));
        query('#exitPerformanceModeButton').addEventListener('click', () => setPerformanceMode(false));
        query('#performanceShowHud').addEventListener('change', (event) => {
          if (state.operatorMode) documentRef.body.classList.toggle('performance-hide-hud', !event.target.checked);
        });
        dock.bind();
        documentRef.addEventListener('fullscreenchange', () => {
          if (state.operatorMode && query('#performanceFullscreen').checked && !documentRef.fullscreenElement) return setPerformanceMode(false);
          if (state.operatorMode) requestFrame(() => options.onResize?.());
        });
      }
      updateDock();
      performanceInitialized = true;
    }

    function applyEntry(index, forceCut = false) {
      if (!state.showSequence.length || state.showTransitioning) return false;
      const safeIndex = sequencer.wrapIndex(index, state.showSequence.length);
      const entry = state.showSequence[safeIndex];
      const profile = profileForEntry(entry);
      if (!profile) return false;
      const finish = () => {
        state.showIndex = safeIndex;
        options.onApplyEntry?.(profile, entry);
        resetEntryClock();
        updateUi();
      };
      if (entry.transition === 'black' && !forceCut) {
        state.showTransitioning = true;
        state.showTransitionBlack = true;
        query('#showTransitionOverlay').classList.add('visible');
        delay(() => {
          finish();
          delay(() => {
            query('#showTransitionOverlay').classList.remove('visible');
            state.showTransitionBlack = false;
            state.showTransitioning = false;
          }, 300);
        }, 290);
      } else finish();
      return true;
    }

    function advance(direction = 1) {
      if (!state.showSequence.length) return;
      const decision = sequencer.decideAdvance({
        length: state.showSequence.length, index: state.showIndex, direction,
        loop: state.showLoop, shuffle: state.showShuffle
      });
      if (decision.stop) {
        state.showPlaying = false;
        updateUi();
      } else applyEntry(decision.index);
    }

    function update(beatChanged) {
      if (!state.showPlaying || state.showIndex < 0 || state.showTransitioning) {
        if (composer.initialized && state.showIndex < 0) options.onComposerPlayhead?.(0);
        return;
      }
      const entry = state.showSequence[state.showIndex];
      if (!entry) return;
      const progress = sequencer.calculateProgress({
        entry,
        startTime: state.showEntryStartTime,
        startBeat: state.showEntryStartBeat,
        currentTime: beatClock(),
        beatIndex: state.beatGridIndex,
        beatPhase: state.beatGridPhase
      });
      query('#showProgressFill').style.width = `${clamp(progress * 100, 0, 100)}%`;
      dock.setProgress(progress);
      options.onComposerPlayhead?.(progress);
      if (sequencer.shouldAdvance(entry, progress, beatChanged)) advance(1);
    }

    function initializeShow() {
      if (showInitialized) return;
      const stored = dataEngine.parseShowDocument(storage.getItem('quarticPulseShowSequenceV1') || 'null');
      Object.assign(state, {
        showSequence: stored.entries, showLoop: stored.loop, showShuffle: stored.shuffle,
        autoBpm: stored.autoBpm, manualBpm: stored.manualBpm, beatOffsetMs: stored.beatOffsetMs
      });
      query('#showLoop').checked = state.showLoop;
      query('#showShuffle').checked = state.showShuffle;
      query('#autoBpm').checked = state.autoBpm;
      query('#beatBpm').value = state.manualBpm;
      query('#beatOffset').value = state.beatOffsetMs;
      query('#beatBpm')._syncNumericValue?.();
      query('#beatOffset')._syncNumericValue?.();
      if (!showBound) bindShow();
      renderProfileOptions();
      renderSequence();
      updateBeatGridUi();
      showInitialized = true;
    }

    function bindShow() {
      showBound = true;
      query('#beatBpm').addEventListener('input', (event) => { state.manualBpm = Number(event.target.value); persist(); updateBeatGridUi(); });
      query('#beatOffset').addEventListener('input', (event) => { state.beatOffsetMs = Number(event.target.value); persist(); updateBeatGridUi(); });
      query('#autoBpm').addEventListener('change', (event) => { state.autoBpm = event.target.checked; persist(); updateBeatGridUi(); });
      let tapTimes = [];
      query('#tapTempoButton').addEventListener('click', () => {
        const now = beatClock();
        if (tapTimes.length && now - tapTimes.at(-1) > 2) tapTimes = [];
        tapTimes.push(now);
        tapTimes = tapTimes.slice(-8);
        if (tapTimes.length < 2) return;
        const intervals = tapTimes.slice(1).map((time, index) => time - tapTimes[index]);
        state.manualBpm = clamp(60 / (intervals.reduce((sum, value) => sum + value, 0) / intervals.length), 60, 200);
        query('#beatBpm').value = state.manualBpm;
        query('#beatBpm')._syncNumericValue?.();
        state.autoBpm = false;
        query('#autoBpm').checked = false;
        state.beatGridAnchor = tapTimes[0];
        persist();
        updateBeatGridUi();
      });
      query('#resetBeatGridButton').addEventListener('click', () => {
        state.detectedBeatTimes = [];
        state.detectedBpm = 120;
        state.bpmConfidence = 0;
        state.beatOffsetMs = 0;
        state.beatGridAnchor = beatClock();
        query('#beatOffset').value = 0;
        query('#beatOffset')._syncNumericValue?.();
        persist();
        options.onToast?.('Beat grid reset');
      });
      query('#addShowEntryButton').addEventListener('click', () => {
        const profileId = query('#showProfileSelect').value;
        if (!getProfiles().some((profile) => profile.id === profileId)) return;
        state.showSequence.push(sanitizeEntry({
          id: createId(), profileId,
          advance: query('#showAdvanceMode').value === 'time' ? 'time' : 'beats',
          value: clamp(Math.round(Number(query('#showAdvanceValue').value) || 1), 1, 3600),
          transition: query('#showTransition').value === 'cut' ? 'cut' : 'black'
        }));
        persist();
        renderSequence();
      });
      query('#showSequenceList').addEventListener('click', (event) => {
        const element = event.target.closest?.('.show-entry');
        const action = event.target.closest?.('[data-show-action]')?.dataset.showAction;
        if (!element || !action) return;
        const index = Number(element.dataset.index);
        if (action === 'delete') {
          state.showSequence.splice(index, 1);
          if (state.showIndex === index) state.showIndex = -1;
          else if (state.showIndex > index) state.showIndex -= 1;
        } else if (action === 'up' && index > 0) {
          [state.showSequence[index - 1], state.showSequence[index]] = [state.showSequence[index], state.showSequence[index - 1]];
        } else if (action === 'down' && index < state.showSequence.length - 1) {
          [state.showSequence[index + 1], state.showSequence[index]] = [state.showSequence[index], state.showSequence[index + 1]];
        } else if (action === 'select') applyEntry(index, true);
        persist();
        renderSequence();
      });
      query('#showPlayButton').addEventListener('click', () => {
        if (!state.showSequence.length) return;
        state.showPlaying = !state.showPlaying;
        if (state.showPlaying) state.showIndex < 0 ? applyEntry(0, true) : resetEntryClock();
        updateUi();
      });
      query('#showPreviousButton').addEventListener('click', () => advance(-1));
      query('#showNextButton').addEventListener('click', () => advance(1));
      query('#showStopButton').addEventListener('click', () => {
        state.showPlaying = false;
        state.showIndex = -1;
        query('#showProgressFill').style.width = '0%';
        dock.setProgress(0);
        updateUi();
      });
      query('#showLoop').addEventListener('change', (event) => { state.showLoop = event.target.checked; persist(); });
      query('#showShuffle').addEventListener('change', (event) => { state.showShuffle = event.target.checked; persist(); });
    }

    return Object.freeze({
      advance, applyEntry, effectiveBpm, entryDuration, entryStart, initializePerformanceMode, initializeShow,
      persist, profileForEntry, renderProfileOptions, renderSequence, resetEntryClock, sanitizeAutomation,
      sanitizeEntry, sequenceDuration, setBlackout, setPerformanceMode, update, updateBeatGrid,
      updateBeatGridUi, updateDock, updateUi,
      get diagnostics() { return Object.freeze({ ready: true, showBound, showInitialized, performanceBound, performanceInitialized }); }
    });
  }

  window.QuarticPerformanceShowController = Object.freeze({ create, escapeMarkup });
})();
