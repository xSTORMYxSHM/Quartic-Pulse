(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const documentRef = options.documentRef || document;
    const getModel = options.getModel || (() => ({}));
    const formatTime = options.formatTime || ((value) => String(value));
    const entryDuration = options.entryDuration || (() => 0);
    const sequenceDuration = options.sequenceDuration || (() => 0);
    const entryStart = options.entryStart || (() => 0);
    const profileForEntry = options.profileForEntry || (() => null);
    const sanitizeAutomation = options.sanitizeAutomation || ((value) => value || {});
    const escapeMarkup = options.escapeMarkup || ((value) => String(value ?? ''));
    let selectedCueId = '';
    let recording = false;
    let dragCueId = '';
    let timelineWidth = 960;
    let initialized = false;
    let bound = false;

    function model() {
      const value = getModel() || {};
      return {
        entries: Array.isArray(value.entries) ? value.entries : [],
        profiles: Array.isArray(value.profiles) ? value.profiles : [],
        currentIndex: Number.isInteger(value.currentIndex) ? value.currentIndex : -1,
        playing: Boolean(value.playing),
        hasSongMap: Boolean(value.hasSongMap)
      };
    }

    function selectedIndex() {
      return model().entries.findIndex((entry) => entry.id === selectedCueId);
    }

    function percent(value, maximum) {
      return Number.isFinite(value) ? String(Math.round(value / maximum * 100)) : '';
    }

    function laneValue(entry, key, maximum) {
      const automation = sanitizeAutomation(entry.automation);
      if (key === 'camera') return automation.camera ? automation.camera.toUpperCase() : 'PROFILE';
      const value = automation[key];
      return Number.isFinite(value) ? `${Math.round(value / maximum * 100)}%` : 'PROFILE';
    }

    function renderInspector() {
      if (!initialized) return;
      const current = model();
      const index = selectedIndex();
      const entry = current.entries[index];
      query('#composerInspector').querySelectorAll('input, select, button').forEach((control) => { control.disabled = !entry; });
      query('#composerSelectedStatus').textContent = entry ? `CUE ${index + 1} OF ${current.entries.length}` : 'NONE';
      const profileSelect = query('#composerCueProfile');
      profileSelect.replaceChildren();
      current.profiles.forEach((profile) => {
        const option = documentRef.createElement('option');
        option.value = profile.id;
        option.textContent = `${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`;
        profileSelect.appendChild(option);
      });
      if (!entry) {
        query('#composerCueLabel').value = '';
        query('#composerCueDuration').value = '16';
        ['composerCueDirector', 'composerCueMotion', 'composerCueEquation', 'composerCueFlow'].forEach((id) => { query(`#${id}`).value = ''; });
        return;
      }
      const automation = sanitizeAutomation(entry.automation);
      query('#composerCueLabel').value = entry.label || '';
      profileSelect.value = entry.profileId;
      query('#composerCueAdvance').value = entry.advance;
      query('#composerCueDuration').value = entry.value;
      query('#composerCueTransition').value = entry.transition;
      query('#composerCueCamera').value = automation.camera || '';
      query('#composerCueDirector').value = percent(automation.director, 1);
      query('#composerCueMotion').value = percent(automation.motion, 2.5);
      query('#composerCueEquation').value = percent(automation.equation, 1.5);
      query('#composerCueFlow').value = percent(automation.flow, 1);
      query('#composerMoveLeftButton').disabled = index <= 0;
      query('#composerMoveRightButton').disabled = index < 0 || index >= current.entries.length - 1;
      query('#composerSnapButton').disabled = !current.hasSongMap;
    }

    function updatePlayhead(entryProgress = 0) {
      if (!initialized) return;
      const current = model();
      const duration = sequenceDuration();
      const index = current.currentIndex;
      const seconds = index >= 0
        ? entryStart(index) + entryDuration(current.entries[index]) * clamp(entryProgress, 0, 1)
        : 0;
      query('#composerPlayhead').style.left = `${duration ? seconds / duration * timelineWidth : 0}px`;
    }

    function renderPlaybackState() {
      if (!initialized) return;
      const current = model();
      query('#composerPlayButton').textContent = current.playing ? 'PAUSE SHOW' : 'PLAY SHOW';
      documentRef.querySelectorAll('.composer-cue').forEach((element) => {
        const index = current.entries.findIndex((entry) => entry.id === element.dataset.cueId);
        element.classList.toggle('active', index === current.currentIndex);
      });
    }

    function render() {
      if (!initialized) return;
      const current = model();
      if (selectedCueId && selectedIndex() < 0) selectedCueId = '';
      if (!selectedCueId && current.entries.length) selectedCueId = current.entries[0].id;
      const duration = sequenceDuration();
      const count = current.entries.length;
      query('#composerCueCount').textContent = `${count} ${count === 1 ? 'CUE' : 'CUES'}`;
      query('#composerDuration').textContent = formatTime(duration);
      query('#composerPanelCueCount').textContent = String(count);
      query('#composerPanelDuration').textContent = formatTime(duration);
      query('#composerPanelStatus').textContent = current.hasSongMap ? 'SONG MAP READY' : 'MANUAL';
      query('#composerSnapStatus').textContent = current.hasSongMap ? 'SECTION / BEAT READY' : 'BEAT GRID READY';
      query('#composerPlayButton').textContent = current.playing ? 'PAUSE SHOW' : 'PLAY SHOW';
      query('#composerRecordButton').classList.toggle('active', recording);
      query('#composerRecordButton').textContent = recording ? 'RECORDING AUTOMATION' : 'RECORD AUTOMATION';

      timelineWidth = Math.max(960, Math.round(duration * 18));
      const ruler = query('#composerRuler');
      const track = query('#composerCueTrack');
      const lanes = query('#composerAutomationLanes');
      [ruler, track, lanes].forEach((element) => { element.style.width = `${timelineWidth}px`; });
      ruler.replaceChildren();
      const rulerStep = duration > 900 ? 120 : (duration > 360 ? 60 : (duration > 120 ? 30 : 10));
      for (let second = 0; second <= Math.max(duration, rulerStep); second += rulerStep) {
        const marker = documentRef.createElement('span');
        marker.style.left = `${duration ? second / duration * timelineWidth : 0}px`;
        marker.textContent = formatTime(second);
        ruler.appendChild(marker);
      }
      track.replaceChildren();
      const laneKeys = [['director', 1], ['motion', 2.5], ['equation', 1.5], ['flow', 1], ['camera', 1]];
      lanes.replaceChildren(...laneKeys.map(([key, maximum]) => {
        const lane = documentRef.createElement('div');
        lane.className = 'composer-automation-lane';
        current.entries.forEach((entry, index) => {
          const segment = documentRef.createElement('span');
          const width = duration ? entryDuration(entry) / duration * timelineWidth : timelineWidth;
          const automation = sanitizeAutomation(entry.automation);
          const normalized = key === 'camera' ? (automation.camera ? .7 : .12) : (Number.isFinite(automation[key]) ? automation[key] / maximum : .12);
          segment.style.width = `${Math.max(18, width)}px`;
          const level = clamp(normalized, .08, 1);
          segment.style.background = `linear-gradient(90deg, rgba(135,92,255,${(.05 + level * .18).toFixed(3)}), rgba(92,245,220,${(.025 + level * .11).toFixed(3)}))`;
          segment.style.color = `rgba(207,215,229,${(.48 + level * .46).toFixed(3)})`;
          segment.textContent = laneValue(entry, key, maximum);
          segment.dataset.index = String(index);
          lane.appendChild(segment);
        });
        return lane;
      }));
      current.entries.forEach((entry, index) => {
        const profile = profileForEntry(entry);
        const cue = documentRef.createElement('button');
        cue.type = 'button';
        cue.className = `composer-cue${entry.id === selectedCueId ? ' selected' : ''}${index === current.currentIndex ? ' active' : ''}`;
        cue.dataset.cueId = entry.id;
        cue.draggable = true;
        cue.style.width = `${Math.max(18, duration ? entryDuration(entry) / duration * timelineWidth : timelineWidth)}px`;
        cue.innerHTML = `<strong>${escapeMarkup(entry.label || `Cue ${index + 1}`)}</strong><span>${escapeMarkup(profile?.name || 'Missing profile')}</span><small>${formatTime(entryDuration(entry))}</small>`;
        track.appendChild(cue);
      });
      renderInspector();
      updatePlayhead();
    }

    function readDraft() {
      const readPercent = (id, maximum) => {
        const raw = query(`#${id}`).value.trim();
        return raw === '' ? undefined : clamp(Number(raw) || 0, 0, 100) / 100 * maximum;
      };
      return {
        label: query('#composerCueLabel').value,
        profileId: query('#composerCueProfile').value,
        advance: query('#composerCueAdvance').value,
        value: Number(query('#composerCueDuration').value) || 1,
        transition: query('#composerCueTransition').value,
        automation: {
          camera: query('#composerCueCamera').value,
          director: readPercent('composerCueDirector', 1),
          motion: readPercent('composerCueMotion', 2.5),
          equation: readPercent('composerCueEquation', 1.5),
          flow: readPercent('composerCueFlow', 1)
        }
      };
    }

    function selectCue(cueId, settings = {}) {
      selectedCueId = cueId || '';
      if (selectedIndex() < 0) return;
      options.onSelect?.(selectedCueId, settings);
      render();
    }

    function setOpen(open) {
      query('#showComposerWorkspace').hidden = !open;
      documentRef.body.classList.toggle('composer-mode', Boolean(open));
      if (open) render();
      options.onOpenChange?.(Boolean(open));
    }

    function bind() {
      if (bound) return;
      bound = true;
      query('#composerBuildButton').addEventListener('click', () => options.onBuild?.());
      query('#composerPanelBuildButton').addEventListener('click', () => options.onBuild?.());
      query('#openShowComposerButton').addEventListener('click', () => setOpen(true));
      query('#closeShowComposerButton').addEventListener('click', () => setOpen(false));
      query('#composerPlayButton').addEventListener('click', () => options.onPlay?.());
      query('#composerAddCueButton').addEventListener('click', () => {
        const cueId = options.onAdd?.();
        if (cueId) selectedCueId = cueId;
        render();
      });
      query('#composerRecordButton').addEventListener('click', () => {
        recording = !recording;
        options.onRecordingChange?.(recording);
        render();
      });
      query('#composerCueTrack').addEventListener('click', (event) => {
        const cue = event.target.closest('[data-cue-id]');
        if (cue) selectCue(cue.dataset.cueId, { apply: true, seek: true });
      });
      query('#composerCueTrack').addEventListener('dragstart', (event) => {
        dragCueId = event.target.closest('[data-cue-id]')?.dataset.cueId || '';
        if (dragCueId) event.dataTransfer.effectAllowed = 'move';
      });
      query('#composerCueTrack').addEventListener('dragover', (event) => { if (dragCueId) event.preventDefault(); });
      query('#composerCueTrack').addEventListener('drop', (event) => {
        event.preventDefault();
        const targetId = event.target.closest('[data-cue-id]')?.dataset.cueId;
        if (dragCueId && targetId && dragCueId !== targetId) options.onReorder?.(dragCueId, targetId);
        dragCueId = '';
        render();
      });
      query('#composerApplyCueButton').addEventListener('click', () => {
        if (selectedIndex() >= 0) options.onCommit?.(selectedCueId, readDraft());
        render();
      });
      query('#composerMoveLeftButton').addEventListener('click', () => { options.onMove?.(selectedCueId, -1); render(); });
      query('#composerMoveRightButton').addEventListener('click', () => { options.onMove?.(selectedCueId, 1); render(); });
      query('#composerSnapButton').addEventListener('click', () => { options.onSnap?.(selectedCueId); render(); });
      query('#composerDeleteCueButton').addEventListener('click', () => {
        selectedCueId = options.onDelete?.(selectedCueId) || '';
        render();
      });
      documentRef.addEventListener('input', (event) => {
        if (!recording || selectedIndex() < 0) return;
        const mapping = {
          songDirectorIntensity: ['director', 1], motion: ['motion', 2.5], equationMod: ['equation', 1.5], flow: ['flow', 1]
        }[event.target.id];
        if (!mapping) return;
        options.onRecordAutomation?.(selectedCueId, mapping[0], clamp(Number(event.target.value) || 0, 0, mapping[1]));
        render();
      });
      documentRef.addEventListener('click', (event) => {
        if (!recording || selectedIndex() < 0) return;
        const camera = event.target.closest?.('[data-camera-preset]')?.dataset.cameraPreset;
        if (!camera) return;
        options.onRecordCamera?.(selectedCueId, camera);
        render();
      });
    }

    function initialize() {
      initialized = true;
      bind();
      render();
    }

    const diagnostics = {
      get ready() { return true; },
      get bound() { return bound; },
      get initialized() { return initialized; }
    };

    return Object.freeze({
      bind,
      initialize,
      render,
      renderInspector,
      renderPlaybackState,
      selectCue,
      selectedIndex,
      setOpen,
      setSelectedCueId: (value) => { selectedCueId = value || ''; },
      updatePlayhead,
      get selectedCueId() { return selectedCueId; },
      get recording() { return recording; },
      get initialized() { return initialized; },
      get diagnostics() { return diagnostics; }
    });
  }

  window.QuarticPerformanceShowComposerController = Object.freeze({ create });
})();
