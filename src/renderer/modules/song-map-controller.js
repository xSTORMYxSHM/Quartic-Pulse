(() => {
  'use strict';

  function create(options = {}) {
    const {
      query: $,
      documentRef = document,
      windowRef = window,
      storage = localStorage,
      state,
      audio,
      dataEngine,
      analysisEngine,
      directorEngine,
      directorController,
      audioSourceController,
      musicPersonalityController,
      musicPersonalityProfiles = {},
      currentPlaylistItem = () => null,
      tryRestorePendingMap = () => {},
      renderComposer = () => {},
      composerInitialized = () => false,
      clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)),
      formatTime = (value) => String(value),
      showToast = () => {},
      isObsOutput = false,
      ResizeObserverCtor = window.ResizeObserver
    } = options;
    if (!$ || !state || !audio || !dataEngine || !analysisEngine || !directorEngine || !directorController || !audioSourceController) {
      throw new Error('Song Map controller requires UI, audio, analysis, and director dependencies.');
    }

    const cacheStorageKey = 'quarticPulseSongMapsV1';
    const overridesStorageKey = 'quarticPulseDirectorOverridesV1';
    const sectionColors = ['#45ddcf', '#826dff', '#ed68df', '#f2bd59', '#55a8ff', '#78df78'];
    const cacheVersion = dataEngine.diagnostics.cacheVersion;
    let activeMap = null;
    let analyzing = false;
    let analysisJob = 0;
    let initialized = false;
    let refreshTimer = 0;
    let directorPlan = [];

    function resolveDirectorBehavior(map = activeMap) {
      return directorEngine.resolveBehavior(state.songDirectorBehavior, map);
    }

    function readDirectorOverrides() {
      return dataEngine.parseOverrides(storage.getItem(overridesStorageKey) || '[]');
    }

    function directorOverrideFor(index) {
      return dataEngine.overrideFor(readDirectorOverrides(), activeMap?.key, index);
    }

    function writeDirectorOverride(index, override) {
      if (!activeMap?.key || index < 0) return;
      replaceDirectorOverrides(dataEngine.updateOverride(readDirectorOverrides(), activeMap.key, index, override));
    }

    function replaceDirectorOverrides(entries) {
      try { storage.setItem(overridesStorageKey, JSON.stringify(entries)); }
      catch (_) { /* Cue edits remain optional if storage is unavailable. */ }
    }

    function generateDirectorPlan(map = activeMap) {
      return directorEngine.generatePlan(map, state.songDirectorBehavior);
    }

    function updateDirector(time) {
      if (isObsOutput) return state.songDirectorValues || {};
      if (!state.songDirectorEnabled || !activeMap || !directorPlan.length) {
        state.songDirectorValues = {};
        directorController.updateNow(null, {}, time);
        return state.songDirectorValues;
      }
      const result = directorEngine.evaluate({
        plan: directorPlan,
        map: activeMap,
        time,
        styleId: state.songDirectorStyle,
        transitionId: state.songDirectorTransition,
        intensity: state.songDirectorIntensity,
        getOverride: directorOverrideFor,
        dimensionalEnabled: state.fractalDimensional,
        foldingEnabled: state.equationFolding
      });
      state.songDirectorValues = result.values;
      directorController.updateNow(result.cue, result.values, result.songTime, result.dynamics);
      return result.values;
    }

    function profileSignature() {
      const bands = musicPersonalityController.getBands();
      return dataEngine.profileSignature({
        personality: state.musicPersonality,
        bands,
        bassGain: state.analysisBassGain,
        midGain: state.analysisMidGain,
        highGain: state.analysisHighGain,
        smoothing: state.analysisSmoothing,
        beatSensitivity: state.beatSensitivity,
        beatCooldownMs: state.beatCooldownMs
      });
    }

    function mapKey(item = currentPlaylistItem()) {
      return dataEngine.mapKey(item, profileSignature());
    }

    function readCache() {
      return dataEngine.parseCache(storage.getItem(cacheStorageKey) || '[]');
    }

    function writeCache(entries) {
      const ordered = dataEngine.prepareCache(entries);
      try {
        storage.setItem(cacheStorageKey, JSON.stringify(ordered));
      } catch (_) {
        try { storage.setItem(cacheStorageKey, JSON.stringify(ordered.slice(0, 4))); }
        catch (_) { /* Song maps remain usable for the current session. */ }
      }
    }

    function cacheMap(map) {
      writeCache(dataEngine.upsertCache(readCache(), map));
    }

    async function analyzeBuffer(audioBuffer, job, onProgress) {
      return analysisEngine.analyzeBuffer(audioBuffer, {
        version: cacheVersion,
        bands: musicPersonalityController.getBands(),
        gains: [state.analysisBassGain, state.analysisMidGain, state.analysisHighGain],
        beatSensitivity: state.beatSensitivity,
        beatCooldownMs: state.beatCooldownMs,
        isCancelled: () => job !== analysisJob,
        onProgress
      });
    }

    function setStatus(message, tone = '') {
      const status = $('#songMapStatus');
      if (!status) return;
      status.textContent = message;
      status.dataset.tone = tone;
    }

    function updateProgress(progress, message) {
      $('#songMapProgress').hidden = false;
      $('#songMapProgressFill').style.width = `${clamp(progress, 0, 1) * 100}%`;
      $('#songMapProgressText').textContent = message;
    }

    function draw() {
      const canvasElement = $('#songMapCanvas');
      const map = activeMap;
      if (!canvasElement || !map || $('#songMapResults').hidden) return;
      const rect = canvasElement.getBoundingClientRect();
      const scale = Math.min(2, windowRef.devicePixelRatio || 1);
      const width = Math.max(2, Math.round(rect.width * scale));
      const height = Math.max(2, Math.round(rect.height * scale));
      if (canvasElement.width !== width || canvasElement.height !== height) {
        canvasElement.width = width;
        canvasElement.height = height;
      }
      const context = canvasElement.getContext('2d');
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const w = rect.width;
      const h = rect.height;
      context.clearRect(0, 0, w, h);
      context.fillStyle = '#05070d';
      context.fillRect(0, 0, w, h);
      map.sections.forEach((section, index) => {
        const x = section.start / map.duration * w;
        const sectionWidth = Math.max(1, (section.end - section.start) / map.duration * w);
        const color = sectionColors[index % sectionColors.length];
        context.globalAlpha = .055 + (index % 2) * .025;
        context.fillStyle = color;
        context.fillRect(x, 0, sectionWidth, h);
        context.globalAlpha = .42;
        context.fillRect(x, 0, 1, h);
        if (sectionWidth > 58) {
          context.globalAlpha = .56;
          context.fillStyle = '#c3ccdc';
          context.font = '700 7px Segoe UI';
          context.fillText(section.label.toUpperCase(), x + 5, 11);
        }
      });
      context.globalAlpha = 1;
      context.strokeStyle = 'rgba(122,137,169,.11)';
      context.lineWidth = 1;
      for (let row = 1; row < 4; row += 1) {
        context.beginPath();
        context.moveTo(0, h * row / 4);
        context.lineTo(w, h * row / 4);
        context.stroke();
      }
      const linePath = (values, color, amplitude, lift = 0) => {
        context.beginPath();
        values.forEach((value, index) => {
          const x = index / Math.max(1, values.length - 1) * w;
          const y = h - 8 - lift - (value / 255) * amplitude;
          if (!index) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.strokeStyle = color;
        context.lineWidth = 1.15;
        context.stroke();
      };
      context.beginPath();
      context.moveTo(0, h);
      map.energy.forEach((value, index) => {
        const x = index / Math.max(1, map.energy.length - 1) * w;
        context.lineTo(x, h - (value / 255) * (h - 18));
      });
      context.lineTo(w, h);
      context.closePath();
      const energyGradient = context.createLinearGradient(0, 18, 0, h);
      energyGradient.addColorStop(0, 'rgba(132,98,255,.42)');
      energyGradient.addColorStop(1, 'rgba(56,37,115,.04)');
      context.fillStyle = energyGradient;
      context.fill();
      linePath(map.bass, 'rgba(66,228,208,.92)', h * .42, h * .49);
      linePath(map.mids, 'rgba(232,108,240,.88)', h * .35, h * .29);
      linePath(map.highs, 'rgba(245,199,93,.88)', h * .28, h * .12);
      context.strokeStyle = 'rgba(248,250,255,.42)';
      context.lineWidth = 1;
      for (const beat of map.beats) {
        const x = beat / map.duration * w;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, 6);
        context.stroke();
      }
    }

    function updatePlayhead(time = audio.currentTime) {
      if (!initialized || !activeMap) return;
      const progress = clamp((Number(time) || 0) / activeMap.duration, 0, 1);
      $('#songMapPlayhead').style.left = `${progress * 100}%`;
      $('#songMapCanvas').setAttribute('aria-valuemax', String(Math.round(activeMap.duration)));
      $('#songMapCanvas').setAttribute('aria-valuenow', String(Math.round(progress * activeMap.duration)));
      $('#songMapCanvas').setAttribute('aria-valuetext', `${formatTime(progress * activeMap.duration)} of ${formatTime(activeMap.duration)}`);
    }

    function render() {
      if (!initialized) return;
      const item = currentPlaylistItem();
      const map = activeMap;
      $('#songMapEmpty').hidden = Boolean(map);
      $('#songMapResults').hidden = !map;
      $('#clearSongMapButton').disabled = !map || analyzing;
      $('#analyzeSongButton').disabled = !item?.file || state.exporting;
      $('#analyzeSongButton').textContent = analyzing ? 'CANCEL ANALYSIS' : (map ? 'REANALYZE SONG' : 'ANALYZE SONG');
      if (!item?.file) setStatus('LOAD A SONG');
      else if (!map && !analyzing) setStatus('READY');
      directorController.render();
      if (composerInitialized()) renderComposer();
      if (!map) return;
      const profile = musicPersonalityProfiles[map.personality]?.label || (map.personality === 'custom' ? 'Custom' : 'Analyzer');
      setStatus(`CACHED · ${profile}`);
      $('#songMapStats').innerHTML = `
        <div class="song-map-stat"><strong>${formatTime(map.duration)}</strong><small>DURATION</small></div>
        <div class="song-map-stat"><strong>${map.bpm || '--'}</strong><small>EST. BPM</small></div>
        <div class="song-map-stat"><strong>${map.beats.length}</strong><small>BEATS</small></div>
        <div class="song-map-stat"><strong>${map.sections.length}</strong><small>SECTIONS</small></div>`;
      $('#songMapSections').replaceChildren(...map.sections.map((section, index) => {
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.className = 'song-map-section';
        button.style.setProperty('--section-color', sectionColors[index % sectionColors.length]);
        const marker = documentRef.createElement('i');
        const details = documentRef.createElement('span');
        const label = documentRef.createElement('strong');
        const range = documentRef.createElement('small');
        const time = documentRef.createElement('time');
        label.textContent = String(section.label || `Section ${index + 1}`);
        range.textContent = `${formatTime(section.start)}-${formatTime(section.end)}`;
        time.textContent = formatTime(section.start);
        details.append(label, range);
        button.append(marker, details, time);
        button.addEventListener('click', () => {
          if (state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
          audio.currentTime = Math.min(audio.duration, section.start);
          updatePlayhead(audio.currentTime);
        });
        return button;
      }));
      windowRef.requestAnimationFrame(() => { draw(); updatePlayhead(); });
    }

    function loadCurrent() {
      if (!initialized) return;
      const key = mapKey();
      activeMap = key ? readCache().find((entry) => entry.key === key) || null : null;
      if (!activeMap) tryRestorePendingMap();
      $('#songMapProgress').hidden = true;
      render();
    }

    function scheduleRefresh() {
      if (!initialized) return;
      if (analyzing) cancelAnalysis();
      clearTimeout(refreshTimer);
      refreshTimer = windowRef.setTimeout(loadCurrent, 0);
    }

    function cancelAnalysis({ clearMap = false } = {}) {
      if (analyzing) analysisJob += 1;
      analyzing = false;
      if (clearMap) activeMap = null;
      $('#songMapProgress') && ($('#songMapProgress').hidden = true);
    }

    async function analyzeCurrent() {
      const item = currentPlaylistItem();
      if (!item?.file) return showToast('Load a local song before creating a Song Map.', true);
      if (analyzing) {
        cancelAnalysis();
        setStatus('CANCELLED');
        loadCurrent();
        return;
      }
      const key = mapKey(item);
      const job = ++analysisJob;
      analyzing = true;
      activeMap = null;
      setStatus('ANALYZING', 'active');
      updateProgress(0, 'DECODING AUDIO');
      render();
      try {
        audioSourceController.createGraph();
        const audioBuffer = await audioSourceController.context.decodeAudioData((await item.file.arrayBuffer()).slice(0));
        if (job !== analysisJob) throw new Error('SONG_MAP_CANCELLED');
        const map = await analyzeBuffer(audioBuffer, job, (progress) => updateProgress(progress, `ANALYZING ${Math.round(progress * 100)}%`));
        map.key = key;
        map.trackName = item.name;
        map.personality = state.musicPersonality;
        map.profileSignature = profileSignature();
        map.updatedAt = new Date().toISOString();
        cacheMap(map);
        if (job === analysisJob && mapKey() === key) activeMap = map;
        setStatus('MAP COMPLETE');
        updateProgress(1, 'MAP COMPLETE');
        showToast(`${item.name} Song Map created and cached`);
        windowRef.setTimeout(() => { if (job === analysisJob) $('#songMapProgress').hidden = true; }, 900);
      } catch (error) {
        if (error.message !== 'SONG_MAP_CANCELLED') {
          setStatus('ANALYSIS FAILED', 'error');
          showToast(`Song analysis failed: ${error.message}`, true);
        }
        $('#songMapProgress').hidden = true;
      } finally {
        if (job === analysisJob) analyzing = false;
        render();
      }
    }

    function clearCurrent() {
      const key = mapKey();
      if (!key) return;
      writeCache(readCache().filter((entry) => entry.key !== key));
      activeMap = null;
      render();
      showToast('Cached Song Map cleared');
    }

    function setActiveMap(map, { cache = false, renderNow = false } = {}) {
      activeMap = map || null;
      if (cache && activeMap) cacheMap(activeMap);
      if (renderNow) render();
      return activeMap;
    }

    function initialize() {
      if (initialized) return;
      initialized = true;
      $('#analyzeSongButton').addEventListener('click', () => analyzeCurrent().catch((error) => showToast(error.message, true)));
      $('#clearSongMapButton').addEventListener('click', clearCurrent);
      const timeline = $('#songMapCanvas');
      let pointerId = null;
      const seek = (event) => {
        if (!activeMap || state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
        const rect = timeline.getBoundingClientRect();
        const progress = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
        audio.currentTime = Math.min(audio.duration, progress * activeMap.duration);
        updatePlayhead(audio.currentTime);
      };
      timeline.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        pointerId = event.pointerId;
        timeline.setPointerCapture(pointerId);
        seek(event);
      });
      timeline.addEventListener('pointermove', (event) => { if (pointerId === event.pointerId) seek(event); });
      const finish = (event) => {
        if (pointerId !== event.pointerId) return;
        if (event.type === 'pointerup') seek(event);
        if (timeline.hasPointerCapture(pointerId)) timeline.releasePointerCapture(pointerId);
        pointerId = null;
      };
      timeline.addEventListener('pointerup', finish);
      timeline.addEventListener('pointercancel', finish);
      timeline.addEventListener('keydown', (event) => {
        if (!activeMap || state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
        let target = audio.currentTime;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target -= event.shiftKey ? 15 : 5;
        else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') target += event.shiftKey ? 15 : 5;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = activeMap.duration;
        else return;
        event.preventDefault();
        audio.currentTime = clamp(target, 0, Math.min(audio.duration, activeMap.duration));
        updatePlayhead(audio.currentTime);
      });
      new ResizeObserverCtor(() => draw()).observe($('#songMapTimeline'));
      loadCurrent();
    }

    return Object.freeze({
      initialize,
      render,
      draw,
      updatePlayhead,
      loadCurrent,
      scheduleRefresh,
      cancelAnalysis,
      analyzeCurrent,
      clearCurrent,
      setActiveMap,
      mapKey,
      profileSignature,
      isValidMap: dataEngine.isValidMap,
      readCache,
      writeCache,
      cacheMap,
      readDirectorOverrides,
      replaceDirectorOverrides,
      directorOverrideFor,
      writeDirectorOverride,
      resolveDirectorBehavior,
      generateDirectorPlan,
      updateDirector,
      renderDirector: () => directorController.render(),
      initializeDirector: () => directorController.initialize(),
      get activeMap() { return activeMap; },
      get directorPlan() { return directorPlan; },
      set directorPlan(plan) { directorPlan = Array.isArray(plan) ? plan : []; },
      get styles() { return directorEngine.styles; },
      get behaviors() { return directorEngine.behaviors; },
      get transitions() { return directorEngine.transitions; },
      get diagnostics() { return Object.freeze({ ready: true, initialized, analyzing, hasMap: Boolean(activeMap) }); }
    });
  }

  window.QuarticSongMapController = Object.freeze({ create });
})();
