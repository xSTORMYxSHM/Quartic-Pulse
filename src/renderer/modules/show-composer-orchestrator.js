(() => {
  'use strict';

  function create(options = {}) {
    const {
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
      isSmokeTest = false
    } = options;
    if (!state || !audio || !profileService || !performanceShowController || !showComposerController || !songMapController) {
      throw new Error('Show Composer orchestrator requires state, profiles, Show, Song Map, and composer dependencies.');
    }

    function composerFullProfiles() {
      return profileService.profiles.filter((profile) => profile.kind === 'settings');
    }

    function ensureComposerBaseProfile() {
      let profiles = composerFullProfiles();
      if (profiles.length) return profiles;
      const profile = {
        id: crypto.randomUUID?.() || `composer-${Date.now()}`,
        name: 'Composer Base',
        kind: 'settings',
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: profileService.capture('settings')
      };
      profileService.profiles.unshift(profile);
      profileService.persist();
      profileService.render(profile.id);
      performanceShowController.renderProfileOptions();
      profiles = [profile];
      return profiles;
    }

    function songMapSectionEnergy(map, section) {
      return songMapDataEngine.sectionEnergy(map, section);
    }

    function composerCameraForSection(section, energy) {
      const label = String(section?.label || '').toLowerCase();
      if (/intro|outro|opening|ending/.test(label)) return 'drift';
      if (/peak|drop|build|climax|chorus/.test(label) || energy > .72) return 'orbit';
      if (/break|bridge|quiet|verse/.test(label) || energy < .34) return 'zoom';
      return 'off';
    }

    function composeShowEntriesFromSongMap(map, profiles) {
      if (!map?.sections?.length || !profiles?.length) return [];
      return map.sections.slice(0, 100).map((section, index) => {
        const energy = songMapSectionEnergy(map, section);
        return performanceShowController.sanitizeEntry({
          id: crypto.randomUUID?.() || `cue-${Date.now()}-${index}`,
          profileId: profiles[index % profiles.length].id,
          label: section.label || `Section ${index + 1}`,
          advance: 'time',
          value: Math.max(.1, Math.round((section.end - section.start) * 100) / 100),
          transition: index === 0 ? 'cut' : 'black',
          automation: {
            director: clamp(.3 + energy * .48, 0, 1),
            motion: clamp(.35 + energy * 1.2, 0, 2.5),
            equation: clamp(.025 + energy * .16, 0, 1.5),
            flow: clamp(.12 + energy * .56, 0, 1),
            camera: composerCameraForSection(section, energy)
          }
        });
      });
    }

    function buildShowFromSongMap() {
      if (!songMapController.activeMap?.sections?.length) {
        showToast('Create a Song Map for the loaded track first.', true);
        workspaceUi.activateTab('analysis');
        return;
      }
      if (state.showSequence.length && !window.confirm('Replace the current show sequence with Song Map cues?')) return;
      const profiles = ensureComposerBaseProfile();
      state.showPlaying = false;
      state.showIndex = -1;
      state.showSequence = composeShowEntriesFromSongMap(songMapController.activeMap, profiles);
      showComposerController.setSelectedCueId(state.showSequence[0]?.id || '');
      performanceShowController.persist();
      performanceShowController.renderSequence();
      renderShowComposer();
      showToast(`Built ${state.showSequence.length} cues from the Song Map.`);
    }

    function updateComposerPlayhead(entryProgress = 0) {
      showComposerController.updatePlayhead(entryProgress);
    }

    function renderShowComposer() {
      showComposerController.render();
    }

    function commitComposerCue(cueId, draft) {
      const index = state.showSequence.findIndex((entry) => entry.id === cueId);
      if (index < 0) return;
      const entry = state.showSequence[index];
      entry.label = draft.label;
      entry.profileId = draft.profileId;
      entry.advance = draft.advance;
      const durationValue = Number(draft.value) || 1;
      entry.value = entry.advance === 'time' ? clamp(Math.round(durationValue * 100) / 100, .1, 3600) : clamp(Math.round(durationValue), 1, 3600);
      entry.transition = draft.transition;
      entry.automation = performanceShowController.sanitizeAutomation(draft.automation);
      state.showSequence[index] = performanceShowController.sanitizeEntry(entry);
      performanceShowController.persist();
      performanceShowController.renderSequence();
    }

    function moveComposerCue(cueId, direction) {
      const index = state.showSequence.findIndex((entry) => entry.id === cueId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= state.showSequence.length) return;
      [state.showSequence[index], state.showSequence[target]] = [state.showSequence[target], state.showSequence[index]];
      state.showPlaying = false;
      state.showIndex = -1;
      performanceShowController.persist();
      performanceShowController.renderSequence();
    }

    function snapComposerCueToSection(cueId) {
      const index = state.showSequence.findIndex((entry) => entry.id === cueId);
      const section = songMapController.activeMap?.sections?.[index];
      if (index < 0 || !section) return showToast('This cue has no matching Song Map section.', true);
      const entry = state.showSequence[index];
      entry.label = section.label || entry.label;
      entry.advance = 'time';
      entry.value = Math.max(.1, Math.round((section.end - section.start) * 100) / 100);
      performanceShowController.persist();
      performanceShowController.renderSequence();
      showToast(`Cue snapped to ${section.label || `section ${index + 1}`}.`);
    }

    function handleComposerCueSelection(cueId, { apply = true, seek = true } = {}) {
      const index = state.showSequence.findIndex((entry) => entry.id === cueId);
      if (index < 0) return;
      if (apply) performanceShowController.applyEntry(index, true);
      if (seek && state.audioMode === 'deck' && Number.isFinite(audio.duration)) {
        audio.currentTime = clamp(performanceShowController.entryStart(index), 0, audio.duration);
        songMapController.updatePlayhead(audio.currentTime);
      }
    }

    function addComposerCue() {
      const profile = ensureComposerBaseProfile()[0];
      const entry = performanceShowController.sanitizeEntry({
        id: crypto.randomUUID?.() || `cue-${Date.now()}`,
        profileId: profile.id,
        label: `Cue ${state.showSequence.length + 1}`,
        advance: 'beats', value: 16, transition: state.showSequence.length ? 'black' : 'cut', automation: {}
      });
      state.showSequence.push(entry);
      performanceShowController.persist();
      performanceShowController.renderSequence();
      return entry.id;
    }

    function reorderComposerCue(sourceId, targetId) {
      const sourceIndex = state.showSequence.findIndex((entry) => entry.id === sourceId);
      const targetIndex = state.showSequence.findIndex((entry) => entry.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
      const [entry] = state.showSequence.splice(sourceIndex, 1);
      state.showSequence.splice(targetIndex, 0, entry);
      state.showPlaying = false;
      state.showIndex = -1;
      performanceShowController.persist();
      performanceShowController.renderSequence();
    }

    function deleteComposerCue(cueId) {
      const index = state.showSequence.findIndex((entry) => entry.id === cueId);
      if (index < 0) return '';
      state.showSequence.splice(index, 1);
      state.showPlaying = false;
      state.showIndex = -1;
      performanceShowController.persist();
      performanceShowController.renderSequence();
      return state.showSequence[Math.min(index, state.showSequence.length - 1)]?.id || '';
    }

    function recordComposerAutomation(cueId, key, value) {
      const entry = state.showSequence.find((candidate) => candidate.id === cueId);
      if (!entry) return;
      entry.automation = { ...performanceShowController.sanitizeAutomation(entry.automation), [key]: value };
      performanceShowController.persist();
    }

    function recordComposerCamera(cueId, camera) {
      const entry = state.showSequence.find((candidate) => candidate.id === cueId);
      if (!entry) return;
      entry.automation = { ...performanceShowController.sanitizeAutomation(entry.automation), camera };
      performanceShowController.persist();
    }

    function initializeShowComposer() {
      showComposerController.initialize();
      if (isSmokeTest) window.__quarticPulseComposeShowEntries = composeShowEntriesFromSongMap;
    }

    function applyShowCueAutomation(entry) {
      const application = performanceShowDataEngine.automationApplication(entry);
      profileService.applyFullControls(application.controls);
      if (application.camera) {
        state.cameraMotionPreset = application.camera;
        document.querySelectorAll('[data-camera-preset]').forEach((button) => button.classList.toggle('active', button.dataset.cameraPreset === application.camera));
      }
    }



    return Object.freeze({
      composerFullProfiles,
      ensureComposerBaseProfile,
      composeShowEntriesFromSongMap,
      buildShowFromSongMap,
      updateComposerPlayhead,
      renderShowComposer,
      commitComposerCue,
      moveComposerCue,
      snapComposerCueToSection,
      handleComposerCueSelection,
      addComposerCue,
      reorderComposerCue,
      deleteComposerCue,
      recordComposerAutomation,
      recordComposerCamera,
      initializeShowComposer,
      applyShowCueAutomation,
      get diagnostics() { return Object.freeze({ ready: true, initialized: showComposerController.initialized }); }
    });
  }

  window.QuarticShowComposerOrchestrator = Object.freeze({ create });
})();
