(() => {
  'use strict';

  function create(options = {}) {
    const {
      query: $,
      documentRef = document,
      windowRef = window,
      storage = localStorage,
      desktop,
      state,
      audio,
      packageEngine,
      songMapDataEngine,
      songMapController,
      performanceShowController,
      getProfiles = () => [],
      setProfiles = () => {},
      persistProfiles = () => {},
      renderProfiles = () => {},
      captureProfileData = () => ({}),
      applyProfile = () => {},
      isValidProfile = () => false,
      currentPlaylistItem = () => null,
      selectPlaylistIndex = async () => {},
      clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)),
      showToast = () => {},
      isObsOutput = false,
      isSmokeTest = false
    } = options;
    if (!$ || !desktop || !state || !audio || !packageEngine || !songMapController || !performanceShowController) {
      throw new Error('Performance package/session controller requires UI, state, package, Song Map, and Show dependencies.');
    }

    const pendingMapStorageKey = 'quarticPulsePendingPerformanceMapV1';
    const sessionStorageKey = 'quarticPulseSessionAutosaveV1';
    let sessionAutosaveTimer = 0;
    let sessionRestoreActive = false;
    let packagesInitialized = false;
    let sessionInitialized = false;

    const clone = (value) => packageEngine.clone(value);
    const cleanText = (value, maximum, fallback = '') => packageEngine.cleanText(value, maximum, fallback);
    const trackIdentity = (item = currentPlaylistItem(), map = songMapController.activeMap) => packageEngine.trackIdentity(item, map);
    const trackMatches = (identity, item = currentPlaylistItem()) => packageEngine.trackMatches(identity, item, audio.duration);

    function currentDirectorCues() {
      if (!songMapController.activeMap?.key) return {};
      const entry = songMapController.readDirectorOverrides().find((candidate) => candidate.mapKey === songMapController.activeMap.key);
      return entry?.cues && typeof entry.cues === 'object' ? clone(entry.cues) : {};
    }

    function createDocument() {
      const title = cleanText($('#performancePackageTitle').value, 80,
        state.audioName ? `${state.audioName} Performance` : 'Quartic Pulse Performance');
      const creator = cleanText($('#performancePackageCreator').value, 80, 'Quartic Pulse Creator');
      const notes = cleanText($('#performancePackageNotes').value, 500);
      const packageData = {
        metadata: { title, creator, notes },
        track: trackIdentity(),
        currentVisual: {
          id: 'performance-current-visual',
          name: title,
          kind: 'settings',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: captureProfileData('settings')
        },
        show: {
          entries: state.showSequence.map((entry) => performanceShowController.sanitizeEntry(entry)),
          profiles: packageEngine.referencedProfiles(state.showSequence, getProfiles()),
          loop: state.showLoop,
          shuffle: state.showShuffle,
          autoBpm: state.autoBpm,
          manualBpm: Number(state.manualBpm.toFixed(3)),
          beatOffsetMs: state.beatOffsetMs
        },
        director: {
          enabled: state.songDirectorEnabled,
          style: state.songDirectorStyle,
          behavior: state.songDirectorBehavior,
          transition: state.songDirectorTransition,
          intensity: Number(state.songDirectorIntensity.toFixed(4)),
          map: packageEngine.portableSongMap(songMapController.activeMap),
          cueOverrides: currentDirectorCues()
        }
      };
      return packageEngine.createDocument(packageData);
    }

    function setStatus(message) {
      const status = $('#performancePackageStatus');
      if (status) status.textContent = message;
    }

    async function exportPackage() {
      const documentData = createDocument();
      const suggestedName = packageEngine.suggestedFilename(documentData.performance.metadata.title);
      const outputPath = await desktop.exportPerformancePackage(suggestedName, JSON.stringify(documentData, null, 2));
      if (!outputPath) return;
      setStatus(`${documentData.fingerprint} · Package exported without audio.`);
      showToast(`Performance package exported: ${outputPath}`);
    }

    function installSongMap(performance) {
      const portableMap = performance?.director?.map;
      const identity = performance?.track;
      if (!portableMap || !identity) return 'No Song Map was included.';
      if (!trackMatches(identity)) {
        try {
          storage.setItem(pendingMapStorageKey, JSON.stringify({
            track: identity,
            map: portableMap,
            cues: performance.director.cueOverrides || {},
            savedAt: new Date().toISOString()
          }));
        } catch (_) { /* Pending attachment is optional. */ }
        return `Load ${identity.fileName} to attach its packaged Song Map.`;
      }
      const key = songMapController.mapKey();
      const map = { ...clone(portableMap), key, trackName: currentPlaylistItem()?.name || identity.displayName, updatedAt: new Date().toISOString() };
      if (!key || !songMapController.isValidMap(map)) return 'The packaged Song Map was not compatible.';
      songMapController.setActiveMap(map, { cache: true });
      const cues = performance.director.cueOverrides && typeof performance.director.cueOverrides === 'object'
        ? clone(performance.director.cueOverrides) : {};
      songMapController.replaceDirectorOverrides(songMapDataEngine.replaceOverrideSet(songMapController.readDirectorOverrides(), key, cues));
      try { storage.removeItem(pendingMapStorageKey); } catch (_) { /* Optional cleanup. */ }
      songMapController.render();
      return `Song Map matched ${identity.fingerprint}.`;
    }

    function tryRestorePendingMap() {
      if (!currentPlaylistItem()?.file) return false;
      try {
        const pending = JSON.parse(storage.getItem(pendingMapStorageKey) || 'null');
        if (!pending?.map || !trackMatches(pending.track)) return false;
        const message = installSongMap({ track: pending.track, director: { map: pending.map, cueOverrides: pending.cues || {} } });
        setStatus(message);
        showToast('Packaged Song Map attached to the loaded track');
        return true;
      } catch (_) {
        return false;
      }
    }

    function importProfiles(performance) {
      const imported = packageEngine.remapImportedShow(performance, getProfiles());
      setProfiles(imported.profiles);
      persistProfiles();
      state.showSequence = imported.entries;
      state.showLoop = imported.loop;
      state.showShuffle = imported.shuffle;
      state.autoBpm = imported.autoBpm;
      state.manualBpm = imported.manualBpm;
      state.beatOffsetMs = imported.beatOffsetMs;
      state.showPlaying = false;
      state.showIndex = -1;
      performanceShowController.persist();
      renderProfiles(imported.importedProfiles[0]?.id || '');
      performanceShowController.renderSequence();
      $('#showLoop').checked = state.showLoop;
      $('#showShuffle').checked = state.showShuffle;
      $('#autoBpm').checked = state.autoBpm;
      $('#beatBpm').value = state.manualBpm;
      $('#beatOffset').value = state.beatOffsetMs;
      $('#beatBpm')._syncNumericValue?.();
      $('#beatOffset')._syncNumericValue?.();
      performanceShowController.updateBeatGridUi();
    }

    async function importPackageFile(file) {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) throw new Error('Performance packages must be smaller than 10 MB.');
      const { performance, fingerprint } = packageEngine.validateDocument(JSON.parse(await file.text()));
      try { storage.removeItem(pendingMapStorageKey); } catch (_) { /* Optional cleanup. */ }
      applyProfile(performance.currentVisual, { quiet: true });
      importProfiles(performance);
      const mapMessage = installSongMap(performance);
      const director = performance.director && typeof performance.director === 'object' ? performance.director : {};
      state.songDirectorEnabled = false;
      state.songDirectorValues = {};
      state.songDirectorStyle = songMapController.styles[director.style] ? director.style : state.songDirectorStyle;
      state.songDirectorBehavior = director.behavior === 'auto' || songMapController.behaviors[director.behavior]
        ? director.behavior : state.songDirectorBehavior;
      state.songDirectorTransition = songMapController.transitions[director.transition]
        ? director.transition : state.songDirectorTransition;
      const intensity = Number(director.intensity);
      state.songDirectorIntensity = Number.isFinite(intensity) ? clamp(intensity, 0, 1) : state.songDirectorIntensity;
      $('#songDirectorEnabled').checked = false;
      $('#songDirectorStyle').value = state.songDirectorStyle;
      $('#songDirectorBehavior').value = state.songDirectorBehavior;
      $('#songDirectorTransition').value = state.songDirectorTransition;
      $('#songDirectorIntensity').value = String(state.songDirectorIntensity);
      $('#songDirectorIntensity')._syncNumericValue?.();
      $('#songDirectorIntensityValue').value = `${Math.round(state.songDirectorIntensity * 100)}%`;
      songMapController.renderDirector();
      $('#performancePackageTitle').value = cleanText(performance.metadata?.title, 80, 'Imported Performance');
      $('#performancePackageCreator').value = cleanText(performance.metadata?.creator, 80, 'Unknown creator');
      $('#performancePackageNotes').value = cleanText(performance.metadata?.notes, 500);
      setStatus(`${fingerprint} · ${mapMessage}`);
      showToast(`${performance.metadata?.title || 'Performance package'} imported in standby without audio`);
    }

    function initializePackages() {
      if (packagesInitialized) return;
      packagesInitialized = true;
      $('#exportPerformancePackageButton').addEventListener('click', () => exportPackage().catch((error) => showToast(`Package export failed: ${error.message}`, true)));
      $('#importPerformancePackageButton').addEventListener('click', () => $('#importPerformancePackageInput').click());
      $('#importPerformancePackageInput').addEventListener('change', async (event) => {
        try { await importPackageFile(event.target.files[0]); }
        catch (error) { showToast(`Package import failed: ${error.message}`, true); }
        finally { event.target.value = ''; }
      });
      if (isSmokeTest) windowRef.__quarticPulseCreatePerformancePackage = createDocument;
    }

    function saveSession() {
      if (isObsOutput || sessionRestoreActive) return;
      const item = currentPlaylistItem();
      const snapshot = {
        version: 1,
        source: 'interactive',
        savedAt: new Date().toISOString(),
        profile: { name: 'Automatic Session', kind: 'settings', data: captureProfileData('settings') },
        audioPath: item?.filePath || '',
        audioTime: state.audioMode === 'deck' && Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      };
      try { storage.setItem(sessionStorageKey, JSON.stringify(snapshot)); }
      catch (_) { /* Session restore is optional. */ }
    }

    function scheduleSessionSave() {
      if (sessionRestoreActive) return;
      clearTimeout(sessionAutosaveTimer);
      sessionAutosaveTimer = windowRef.setTimeout(saveSession, 900);
    }

    function restoredAudioMime(name) {
      const extension = String(name || '').split('.').pop().toLowerCase();
      return ({ mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', opus: 'audio/ogg' })[extension] || 'audio/*';
    }

    async function restoreSession() {
      let snapshot = null;
      try { snapshot = JSON.parse(storage.getItem(sessionStorageKey) || 'null'); }
      catch (_) { return; }
      if (!snapshot || snapshot.version !== 1 || snapshot.source !== 'interactive' || !isValidProfile(snapshot.profile)) return;
      const savedAt = Date.parse(snapshot.savedAt);
      if (!Number.isFinite(savedAt) || Date.now() - savedAt > 30 * 24 * 60 * 60 * 1000) return;
      sessionRestoreActive = true;
      try {
        applyProfile(snapshot.profile, { quiet: true });
        if (snapshot.audioPath) {
          try {
            const restored = await desktop.readSessionAudioFile(snapshot.audioPath);
            const bytes = restored?.bytes instanceof Uint8Array ? restored.bytes : new Uint8Array(restored?.bytes?.data || restored?.bytes || []);
            const file = new File([bytes], restored.name, { type: restoredAudioMime(restored.name), lastModified: restored.lastModified });
            state.playlist.push({
              id: ++state.playlistId,
              name: restored.name.replace(/\.[^.]+$/, ''),
              meta: `RESTORED SESSION · ${(file.size / 1048576).toFixed(1)} MB`,
              source: URL.createObjectURL(file),
              file,
              filePath: restored.path
            });
            await selectPlaylistIndex(state.playlist.length - 1, false);
            const restoreTime = Math.max(0, Number(snapshot.audioTime) || 0);
            if (restoreTime) audio.addEventListener('loadedmetadata', () => {
              audio.currentTime = Math.min(restoreTime, Math.max(0, audio.duration - .05));
            }, { once: true });
          } catch (error) {
            showToast(`Settings restored; the last song could not be reopened: ${error.message}`, true);
          }
        }
        state.showPlaying = false;
        state.showIndex = -1;
        state.songDirectorEnabled = false;
        state.songDirectorValues = {};
        $('#songDirectorEnabled').checked = false;
        songMapController.renderDirector();
        performanceShowController.updateUi();
        showToast('Previous session restored · show and Song Director remain in standby');
      } finally {
        sessionRestoreActive = false;
        saveSession();
      }
    }

    function initializeSession() {
      if (sessionInitialized || isSmokeTest) return;
      sessionInitialized = true;
      documentRef.addEventListener('input', scheduleSessionSave, { passive: true });
      documentRef.addEventListener('change', scheduleSessionSave, { passive: true });
      windowRef.addEventListener('beforeunload', saveSession);
      windowRef.setInterval(saveSession, 10000);
      restoreSession().catch((error) => showToast(`Session restore failed: ${error.message}`, true));
    }

    return Object.freeze({
      createDocument,
      exportPackage,
      importPackageFile,
      installSongMap,
      tryRestorePendingMap,
      initializePackages,
      saveSession,
      restoreSession,
      initializeSession,
      get diagnostics() { return Object.freeze({ ready: true, packagesInitialized, sessionInitialized }); }
    });
  }

  window.QuarticPerformancePackageSessionController = Object.freeze({ create });
})();
