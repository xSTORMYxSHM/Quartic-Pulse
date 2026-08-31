(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const documentRef = options.documentRef || document;
    const state = options.state;
    const audio = options.audio;
    const styles = options.styles || {};
    const behaviors = options.behaviors || {};
    const transitions = options.transitions || {};
    const sectionColors = options.sectionColors || ['#45ddcf', '#826dff', '#ed68df', '#f2bd59', '#55a8ff', '#78df78'];
    const clamp = options.clamp || ((value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)));
    const formatTime = options.formatTime || ((value) => String(value));
    let initialized = false;
    let bound = false;
    let lastUiUpdate = 0;
    let selectedCueIndex = -1;
    let selectedMapKey = '';

    function activeMap() {
      return options.getActiveMap?.() || null;
    }

    function activePlan() {
      const plan = options.getPlan?.();
      return Array.isArray(plan) ? plan : [];
    }

    function renderCueEditor() {
      if (!initialized) return;
      const editor = query('#songDirectorCueEditor');
      const cue = activePlan()[selectedCueIndex];
      editor.hidden = !cue;
      if (!cue) return;
      const override = options.getOverride?.(selectedCueIndex) || null;
      query('#songDirectorCueName').textContent = cue.label;
      query('#songDirectorCueState').textContent = override ? 'EDITED' : 'AUTO';
      query('#songDirectorCueEmphasis').value = override?.emphasis || 'auto';
      query('#songDirectorCueStrength').value = String(override?.strength ?? 1);
      query('#songDirectorCueStrength')._syncNumericValue?.();
      query('#songDirectorCueStrengthValue').value = `${Math.round((override?.strength ?? 1) * 100)}%`;
      query('#resetSongDirectorCue').disabled = !override;
    }

    function updateNow(cue, values = {}, time = 0, dynamics = null) {
      if (!initialized || performance.now() - lastUiUpdate < 120) return;
      lastUiUpdate = performance.now();
      const now = query('#songDirectorNow');
      if (!now) return;
      const map = activeMap();
      const plan = activePlan();
      const label = now.querySelector('strong');
      const phraseLabel = now.querySelector('small');
      const dynamicsLead = query('#songDirectorDynamicsLead');
      const displayCue = cue || plan.find((candidate) => time >= candidate.start && time < candidate.end) || plan.at(-1);
      if (!map) {
        phraseLabel.textContent = 'CURRENT PHRASE';
        label.textContent = 'WAITING FOR SONG MAP';
        dynamicsLead.textContent = 'WAITING FOR AUDIO DIRECTION';
      } else if (!state.songDirectorEnabled) {
        phraseLabel.textContent = 'CURRENT PHRASE';
        label.textContent = 'DIRECTOR STANDBY';
        dynamicsLead.textContent = 'DYNAMICS MONITOR · STANDBY';
      } else {
        const phraseEnergy = values.phraseEnergy ?? displayCue?.energy ?? 0;
        phraseLabel.textContent = `${displayCue?.motifLabel || 'PHRASE MOTION'} · ${Math.round(clamp(phraseEnergy, 0, 1) * 100)}% ENERGY`;
        label.textContent = `${displayCue?.label || 'MOVEMENT'} · ${formatTime(time)}`;
        const driverLabels = { energy: 'ENERGY', bass: 'BASS', mids: 'MIDS', highs: 'HIGHS' };
        const targetLabels = { camera: 'CAMERA', equation: 'MATH', color: 'COLOR', depth: 'DEPTH' };
        dynamicsLead.textContent = dynamics
          ? `${driverLabels[dynamics.driver] || 'ENERGY'} → ${targetLabels[dynamics.target] || 'MATH'} · ${Math.round(clamp(dynamics.targetLevel || 0, 0, 1) * 100)}%`
          : 'ANALYZING CURRENT PHRASE';
      }
      const meters = now.querySelectorAll('.song-director-meters i');
      const levels = dynamics
        ? [dynamics.domains.camera, dynamics.domains.equation, dynamics.domains.color, dynamics.domains.depth]
        : [0, 0, 0, 0];
      meters.forEach((meter, index) => { meter.style.height = `${8 + clamp(levels[index], 0, 1) * 92}%`; });
      now.querySelector('.song-director-meters')?.setAttribute('aria-label', dynamics
        ? `Visual dynamics: Camera ${Math.round(levels[0] * 100)} percent, Math ${Math.round(levels[1] * 100)} percent, Color ${Math.round(levels[2] * 100)} percent, Depth ${Math.round(levels[3] * 100)} percent`
        : 'Visual dynamics monitor inactive');
      documentRef.querySelectorAll('.song-director-cue').forEach((button) => {
        button.classList.toggle('active', Number(button.dataset.cueIndex) === values.cueIndex);
      });
    }

    function render() {
      if (!initialized) return;
      if (state.songDirectorTransition !== 'auto' && !transitions[state.songDirectorTransition]) {
        state.songDirectorTransition = 'auto';
      }
      const map = activeMap();
      const generatedPlan = options.generatePlan?.(map) || [];
      options.setPlan?.(generatedPlan);
      const plan = activePlan();
      const ready = plan.length > 0;
      const resolvedBehaviorId = options.resolveBehavior?.(map) || 'balanced';
      const resolvedBehavior = behaviors[resolvedBehaviorId] || behaviors.balanced || { label: 'Balanced' };
      const status = query('#songDirectorStatus');
      status.textContent = ready ? (state.songDirectorEnabled ? 'ACTIVE' : 'PLAN READY') : 'NEEDS SONG MAP';
      status.dataset.tone = state.songDirectorEnabled && ready ? 'active' : '';
      query('#songDirectorEnabled').disabled = !ready;
      query('#songDirectorEnabled').checked = state.songDirectorEnabled && ready;
      query('#songDirectorIntensity').disabled = !ready;
      query('#songDirectorBehavior').disabled = !ready;
      query('#songDirectorBehavior').value = state.songDirectorBehavior;
      query('#songDirectorBehaviorResolved').textContent = `${state.songDirectorBehavior === 'auto' ? 'AUTO · ' : ''}${resolvedBehavior.label.toUpperCase()}`;
      query('#songDirectorTransition').disabled = !ready;
      query('#songDirectorTransition').value = state.songDirectorTransition;
      query('#songDirectorTransitionResolved').textContent = state.songDirectorTransition === 'auto'
        ? `AUTO · ${resolvedBehavior.label.toUpperCase()}`
        : transitions[state.songDirectorTransition].label.toUpperCase();
      if ((map?.key || '') !== selectedMapKey) {
        selectedMapKey = map?.key || '';
        selectedCueIndex = -1;
      }
      if (selectedCueIndex >= plan.length) selectedCueIndex = -1;
      documentRef.querySelectorAll('[data-director-style]').forEach((button) => {
        const active = button.dataset.directorStyle === state.songDirectorStyle;
        button.disabled = !ready;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
      query('#songDirectorPlan').replaceChildren(...plan.map((cue, index) => {
        const button = documentRef.createElement('button');
        button.type = 'button';
        button.className = 'song-director-cue';
        button.classList.toggle('edited', Boolean(options.getOverride?.(index)));
        button.classList.toggle('selected', selectedCueIndex === index);
        button.dataset.cueIndex = String(index);
        button.style.setProperty('--cue-color', sectionColors[index % sectionColors.length]);
        button.title = `${cue.label} · ${cue.motifLabel}`;
        const label = documentRef.createElement('strong');
        const details = documentRef.createElement('small');
        label.textContent = String(cue.label || `Cue ${index + 1}`);
        details.textContent = `${formatTime(cue.start)} · ${String(cue.kind || 'section').toUpperCase()} · ${String(cue.motifLabel || 'PHRASE')}`;
        button.append(label, details);
        button.addEventListener('click', () => {
          selectedCueIndex = index;
          renderCueEditor();
          documentRef.querySelectorAll('.song-director-cue').forEach((cueButton) => {
            cueButton.classList.toggle('selected', Number(cueButton.dataset.cueIndex) === index);
          });
          if (state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
          audio.currentTime = Math.min(audio.duration, cue.start);
          options.updateSongMapPlayhead?.(audio.currentTime);
          options.updateDirector?.(audio.currentTime);
        });
        return button;
      }));
      renderCueEditor();
      lastUiUpdate = 0;
      if (ready && state.songDirectorEnabled) options.updateDirector?.(audio.currentTime);
      else updateNow(null, {}, audio.currentTime);
    }

    function saveCueEditor() {
      if (!activePlan()[selectedCueIndex]) return;
      options.writeOverride?.(selectedCueIndex, {
        strength: Number(query('#songDirectorCueStrength').value),
        emphasis: query('#songDirectorCueEmphasis').value
      });
      const edited = Boolean(options.getOverride?.(selectedCueIndex));
      documentRef.querySelector(`.song-director-cue[data-cue-index="${selectedCueIndex}"]`)?.classList.toggle('edited', edited);
      renderCueEditor();
      options.updateDirector?.(options.getDirectorTime?.() ?? audio.currentTime);
    }

    function bind() {
      if (bound) return;
      bound = true;
      query('#songDirectorEnabled').addEventListener('change', (event) => {
        state.songDirectorEnabled = event.target.checked;
        if (!state.songDirectorEnabled) state.songDirectorValues = {};
        render();
        options.showToast?.(state.songDirectorEnabled ? 'Mathematical Song Director enabled' : 'Song Director standing by');
      });
      query('#songDirectorIntensity').addEventListener('input', (event) => {
        state.songDirectorIntensity = Number(event.target.value);
        query('#songDirectorIntensityValue').value = `${Math.round(state.songDirectorIntensity * 100)}%`;
      });
      query('#songDirectorStyleGrid').addEventListener('click', (event) => {
        const button = event.target.closest('[data-director-style]');
        if (!button || button.disabled) return;
        state.songDirectorStyle = button.dataset.directorStyle;
        query('#songDirectorStyle').value = state.songDirectorStyle;
        render();
        options.showToast?.(`${styles[state.songDirectorStyle].label} Song Director selected`);
      });
      query('#songDirectorStyle').addEventListener('change', (event) => {
        state.songDirectorStyle = styles[event.target.value] ? event.target.value : 'cinematic';
        render();
      });
      query('#songDirectorBehavior').addEventListener('change', (event) => {
        state.songDirectorBehavior = event.target.value === 'auto' || behaviors[event.target.value]
          ? event.target.value
          : 'auto';
        render();
        const resolved = behaviors[options.resolveBehavior?.(activeMap())] || behaviors.balanced;
        options.showToast?.(`${resolved.label} musical behavior ${state.songDirectorBehavior === 'auto' ? 'selected automatically' : 'selected'}`);
      });
      query('#songDirectorTransition').addEventListener('change', (event) => {
        state.songDirectorTransition = transitions[event.target.value] ? event.target.value : 'auto';
        render();
        options.showToast?.(`${transitions[state.songDirectorTransition].label} Song Director transitions selected`);
      });
      query('#songDirectorCueStrength').addEventListener('input', (event) => {
        query('#songDirectorCueStrengthValue').value = `${Math.round(Number(event.target.value) * 100)}%`;
        saveCueEditor();
      });
      query('#songDirectorCueEmphasis').addEventListener('change', saveCueEditor);
      query('#resetSongDirectorCue').addEventListener('click', () => {
        if (selectedCueIndex < 0) return;
        options.writeOverride?.(selectedCueIndex, null);
        documentRef.querySelector(`.song-director-cue[data-cue-index="${selectedCueIndex}"]`)?.classList.remove('edited');
        renderCueEditor();
        options.updateDirector?.(options.getDirectorTime?.() ?? audio.currentTime);
        options.showToast?.('Section cue returned to its automatic plan');
      });
    }

    function initialize() {
      if (initialized) return;
      initialized = true;
      bind();
      render();
    }

    const diagnostics = {
      get ready() { return true; },
      get bound() { return bound; },
      get initialized() { return initialized; },
      get selectedCueIndex() { return selectedCueIndex; }
    };

    return Object.freeze({
      initialize,
      render,
      renderCueEditor,
      updateNow,
      get diagnostics() { return diagnostics; }
    });
  }

  window.QuarticSongDirectorController = Object.freeze({ create });
})();
