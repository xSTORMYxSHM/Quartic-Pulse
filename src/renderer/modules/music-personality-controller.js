(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const state = options.state;
    const profiles = options.profiles;
    const defaultBands = options.defaultBands;
    const clamp = options.clamp || ((value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)));
    if (!state || !profiles || !defaultBands) throw new Error('Music Personality controller dependencies are required.');
    let applying = false;
    let bound = false;
    let initialized = false;

    function getBands() {
      const personality = profiles[state.musicPersonality];
      if (personality) return personality.bands;
      if (state.frequencyBandMode === 'basic') return defaultBands;
      return {
        floor: state.frequencyFloor,
        lowMid: state.lowMidSplit,
        midHigh: state.midHighSplit,
        ceiling: state.frequencyCeiling
      };
    }

    function formatFrequency(value) {
      return Math.round(value).toLocaleString('en-US');
    }

    function updateBandUi() {
      const advanced = state.frequencyBandMode === 'advanced';
      const bands = getBands();
      query('#advancedFrequencyBands').hidden = !advanced;
      query('#frequencyBandSummary').textContent = `LOW ${formatFrequency(bands.floor)}–${formatFrequency(bands.lowMid)} Hz · MIDS ${formatFrequency(bands.lowMid)}–${formatFrequency(bands.midHigh)} Hz · HIGHS ${formatFrequency(bands.midHigh)}–${formatFrequency(bands.ceiling)} Hz`;
    }

    function render() {
      const mount = query('#musicPersonalityMount');
      if (!mount) return;
      const activeProfile = profiles[state.musicPersonality];
      const bands = getBands();
      mount.innerHTML = `
        <div class="section-heading personality-heading"><span>MUSIC PERSONALITY</span><small>${activeProfile ? 'PROFILE ACTIVE' : 'MANUAL'}</small></div>
        <div class="music-personality-grid" role="radiogroup" aria-label="Music Personality profiles">
          ${Object.entries(profiles).map(([id, profile]) => `
            <button class="music-personality-card${state.musicPersonality === id ? ' active' : ''}" type="button" data-music-personality="${id}" role="radio" aria-checked="${state.musicPersonality === id}">
              <span class="personality-icon" aria-hidden="true">${profile.icon.map((height) => `<i data-height="${height}"></i>`).join('')}</span>
              <span><strong>${profile.label}</strong><small>${profile.description}</small></span>
            </button>`).join('')}
          <button class="music-personality-card${state.musicPersonality === 'custom' ? ' active' : ''}" type="button" data-music-personality="custom" role="radio" aria-checked="${state.musicPersonality === 'custom'}">
            <span class="personality-icon custom" aria-hidden="true"><i></i><i></i><i></i></span>
            <span><strong>Custom</strong><small>Use your advanced analyzer controls</small></span>
          </button>
        </div>
        <div class="personality-summary">
          <div><strong>${activeProfile?.label || 'Custom analyzer'}</strong><small>${formatFrequency(bands.floor)}-${formatFrequency(bands.lowMid)} Hz low · ${formatFrequency(bands.lowMid)}-${formatFrequency(bands.midHigh)} Hz mid · ${formatFrequency(bands.midHigh)}-${formatFrequency(bands.ceiling)} Hz high</small></div>
          <div class="personality-response"><span>BASS ${Math.round(state.analysisBassGain * 100)}%</span><span>MIDS ${Math.round(state.analysisMidGain * 100)}%</span><span>HIGHS ${Math.round(state.analysisHighGain * 100)}%</span></div>
        </div>`;
    }

    function syncBandControls() {
      for (const id of ['frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling']) {
        const control = query(`#${id}`);
        control.value = String(state[id]);
        control._syncNumericValue?.();
      }
    }

    function markCustom({ preserveProfileBands = true } = {}) {
      if (applying || state.musicPersonality === 'custom') return;
      const activeBands = getBands();
      state.musicPersonality = 'custom';
      const control = query('#musicPersonality');
      if (control) control.value = 'custom';
      if (preserveProfileBands) {
        state.frequencyFloor = activeBands.floor;
        state.lowMidSplit = activeBands.lowMid;
        state.midHighSplit = activeBands.midHigh;
        state.frequencyCeiling = activeBands.ceiling;
        state.frequencyBandMode = 'advanced';
        query('#frequencyBandMode').value = 'advanced';
        syncBandControls();
      }
      render();
      updateBandUi();
      options.onRefreshAnalysis?.();
    }

    function syncResponseControls(profile) {
      query('#analysisSmoothing').value = String(profile.smoothing);
      query('#analysisSmoothing')._syncNumericValue?.();
      query('#analysisSmoothingValue').value = `${Math.round(profile.smoothing * 100)}%`;
      query('#beatSensitivity').value = String(profile.beatSensitivity);
      query('#beatSensitivity')._syncNumericValue?.();
      query('#beatSensitivityValue').value = `${Math.round(profile.beatSensitivity * 100)}%`;
      query('#beatCooldown').value = String(profile.beatCooldownMs);
      query('#beatCooldown')._syncNumericValue?.();
      query('#beatCooldownValue').value = `${Math.round(profile.beatCooldownMs)} ms`;
    }

    function apply(requestedId, { quiet = false } = {}) {
      const id = profiles[requestedId] ? requestedId : 'custom';
      const profile = profiles[id];
      applying = true;
      state.musicPersonality = id;
      query('#musicPersonality').value = id;
      if (profile) {
        [state.analysisBassGain, state.analysisMidGain, state.analysisHighGain] = profile.gains;
        state.frequencyFloor = profile.bands.floor;
        state.lowMidSplit = profile.bands.lowMid;
        state.midHighSplit = profile.bands.midHigh;
        state.frequencyCeiling = profile.bands.ceiling;
        syncBandControls();
        state.analysisSmoothing = profile.smoothing;
        state.beatSensitivity = profile.beatSensitivity;
        state.beatCooldownMs = profile.beatCooldownMs;
        state.autoReactivityTarget = profile.autoTarget;
        syncResponseControls(profile);
        options.onProfileApplied?.(profile);
      } else {
        state.analysisBassGain = 1;
        state.analysisMidGain = 1;
        state.analysisHighGain = 1;
      }
      applying = false;
      updateBandUi();
      render();
      options.onRefreshAnalysis?.();
      if (!quiet) options.onToast?.(`${profile?.label || 'Custom'} music response selected`);
      return id;
    }

    function setBoundary(key, requestedValue) {
      if (key === 'frequencyFloor') state.frequencyFloor = clamp(requestedValue, 20, state.lowMidSplit - 10);
      if (key === 'lowMidSplit') state.lowMidSplit = clamp(requestedValue, state.frequencyFloor + 10, state.midHighSplit - 50);
      if (key === 'midHighSplit') state.midHighSplit = clamp(requestedValue, state.lowMidSplit + 50, state.frequencyCeiling - 100);
      if (key === 'frequencyCeiling') state.frequencyCeiling = clamp(requestedValue, state.midHighSplit + 100, 20000);
      const range = query(`#${key}`);
      range.value = state[key];
      range._syncNumericValue?.();
      updateBandUi();
      return state[key];
    }

    function bind() {
      if (bound) return;
      bound = true;
      query('#musicPersonalityMount')?.addEventListener('click', (event) => {
        const button = event.target.closest?.('[data-music-personality]');
        if (button) apply(button.dataset.musicPersonality);
      });
      query('#musicPersonality').addEventListener('change', (event) => apply(event.target.value));
      query('#frequencyBandMode').addEventListener('change', (event) => {
        state.frequencyBandMode = event.target.value;
        markCustom({ preserveProfileBands: false });
        updateBandUi();
      });
      for (const id of ['frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling']) {
        query(`#${id}`).addEventListener('input', (event) => {
          markCustom();
          setBoundary(id, Number(event.target.value));
        });
      }
    }

    function initialize() {
      bind();
      apply(state.musicPersonality, { quiet: true });
      initialized = true;
    }

    return Object.freeze({
      apply,
      bind,
      formatFrequency,
      getBands,
      initialize,
      markCustom,
      render,
      setBoundary,
      updateBandUi,
      get diagnostics() { return Object.freeze({ ready: true, bound, initialized, activeProfile: state.musicPersonality }); }
    });
  }

  window.QuarticMusicPersonalityController = Object.freeze({ create });
})();
