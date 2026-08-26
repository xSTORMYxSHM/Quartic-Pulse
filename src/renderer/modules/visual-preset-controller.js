(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const queryAll = options.queryAll || ((selector) => document.querySelectorAll(selector));
    const state = options.state;
    const effectPresets = options.effectPresets;
    const effectControlGroups = options.effectControlGroups;
    const pulsePresets = options.pulsePresets;
    const experiencePresets = options.experiencePresets;
    const equationProfiles = options.equationProfiles;
    const sliderConfigs = options.sliderConfigs;
    const storage = options.storage || localStorage;
    const requestFrame = options.requestFrame || requestAnimationFrame;
    const effectFeatureToggles = options.effectFeatureToggles || {
      fractal: { stateKey: 'fractalDimensional', controlSelector: '#fractalDimensional', controlsSelector: '#fractalDepthControls', label: 'Dimensional Rotation' },
      fold: { stateKey: 'equationFolding', controlSelector: '#equationFolding', controlsSelector: '#equationFoldControls', label: 'Equation Fold & Warp' }
    };
    if (!state || !effectPresets || !effectControlGroups || !pulsePresets || !experiencePresets || !sliderConfigs) {
      throw new Error('Visual preset controller dependencies are required.');
    }
    const applyingEffect = { fractal: false, fold: false, spectrum: false, radial: false, bulb: false };
    let applyingPulse = false;
    let bound = false;
    let initialized = false;

    function formatPercent(id, rangeValue) {
      const config = sliderConfigs[id];
      const displayed = config?.fromRange ? config.fromRange(Number(rangeValue)) : Number(rangeValue) * 100;
      return `${Math.round(displayed)}%`;
    }

    function effectOutput(id, rangeValue) {
      return id === 'bulbPower' ? String(Math.round(Number(rangeValue))) : formatPercent(id, rangeValue);
    }

    function updateToggleUi(controlSelector, enabled) {
      const controls = query(controlSelector);
      const disabled = !enabled;
      controls.classList.toggle('control-disabled', disabled);
      controls.inert = disabled;
      controls.setAttribute('aria-disabled', String(disabled));
      if (disabled) controls.querySelectorAll('details').forEach((details) => { details.open = false; });
    }

    function setEffectSelection(groupName, presetName = '') {
      for (const button of queryAll(`[data-effect-group="${groupName}"] .visual-preset`)) {
        const active = Boolean(presetName) && button.dataset.effectPreset === presetName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      }
    }

    function updateFeatureEffectUi(groupName) {
      const feature = effectFeatureToggles[groupName];
      if (!feature) return;
      const enabled = Boolean(state[feature.stateKey]);
      updateToggleUi(feature.controlsSelector, enabled);
      if (!enabled) setEffectSelection(groupName);
    }

    function updateDimensionalUi() {
      updateFeatureEffectUi('fractal');
    }

    function updateFoldingUi() {
      updateFeatureEffectUi('fold');
    }

    function markEffectCustom(groupName) {
      if (applyingEffect[groupName]) return;
      setEffectSelection(groupName);
    }

    function disableEffectFeature(groupName, { quiet = false } = {}) {
      const feature = effectFeatureToggles[groupName];
      if (!feature || !state[feature.stateKey]) return false;
      state[feature.stateKey] = false;
      const control = query(feature.controlSelector);
      if (control) {
        control.checked = false;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      updateFeatureEffectUi(groupName);
      if (!quiet) options.onToast?.(`${feature.label} turned off`);
      return true;
    }

    function dispatchControl(control) {
      control.dispatchEvent(new Event(control.type === 'range' ? 'input' : 'change', { bubbles: true }));
      control._syncNumericValue?.();
    }

    function applyEffect(groupName, presetName, { quiet = false } = {}) {
      const preset = effectPresets[groupName]?.[presetName];
      if (!preset) return false;
      applyingEffect[groupName] = true;
      for (const [id, value] of Object.entries(preset.values)) {
        const control = query(`#${id}`);
        if (!control) {
          if (Object.hasOwn(state, id)) state[id] = value;
          continue;
        }
        control.value = value;
        dispatchControl(control);
      }
      applyingEffect[groupName] = false;
      setEffectSelection(groupName, presetName);
      const labels = { fractal: 'Dimensional Rotation', fold: 'Equation Fold & Warp', spectrum: 'Spectrum Bars', radial: 'Radial Spectrum', bulb: '3D Mandelbulb' };
      if (!quiet) options.onToast?.(`${preset.label} ${labels[groupName]} preset selected`);
      return true;
    }

    function markPulseCustom() {
      if (applyingPulse) return;
      for (const button of queryAll('.pulse-preset')) button.classList.remove('active');
    }

    function applyPulse(presetName, { quiet = false } = {}) {
      const preset = pulsePresets[presetName];
      if (!preset) return false;
      applyingPulse = true;
      for (const [id, value] of Object.entries(preset.values)) {
        const control = query(`#${id}`);
        control.value = value;
        control.dispatchEvent(new Event('input', { bubbles: true }));
      }
      applyingPulse = false;
      for (const button of queryAll('.pulse-preset')) button.classList.toggle('active', button.dataset.pulsePreset === presetName);
      if (!quiet) options.onToast?.(`${preset.label} Pulse preset selected`);
      return true;
    }

    function applyControlDefaults(values) {
      for (const [id, value] of Object.entries(values)) {
        const control = query(`#${id}`);
        if (!control) continue;
        control.value = String(value);
        dispatchControl(control);
      }
    }

    function applyExperience(presetName, { quiet = false } = {}) {
      const preset = experiencePresets[presetName];
      if (!preset) return false;
      applyControlDefaults(preset.values);
      for (const [id, checked] of Object.entries(preset.checks)) {
        const control = query(`#${id}`);
        if (!control) continue;
        control.checked = checked;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      for (const button of queryAll('[data-experience-preset]')) {
        button.classList.toggle('active', button.dataset.experiencePreset === presetName);
      }
      if (!quiet) options.onToast?.(`${preset.label} visual response selected`);
      return true;
    }

    function applyFractalRecommended(preset) {
      const values = equationProfiles[preset.profile] || equationProfiles.signature;
      applyControlDefaults(values);
      query(`.palette[data-palette="${preset.palette}"]`)?.click();
    }

    function bind() {
      if (bound) return;
      bound = true;
      query('#barStyle')?.addEventListener('change', (event) => { state.barStyle = Number(event.target.value); });
      for (const [groupName, controlIds] of Object.entries(effectControlGroups)) {
        for (const id of controlIds) {
          query(`#${id}`).addEventListener('input', (event) => {
            state[id] = Number(event.target.value);
            query(`#${id}Value`).value = effectOutput(id, state[id]);
            markEffectCustom(groupName);
          });
          query(`#${id}Value`).value = effectOutput(id, state[id]);
        }
        query(`[data-effect-group="${groupName}"]`).addEventListener('click', (event) => {
          const button = event.target.closest?.('.visual-preset');
          if (!button) return;
          if (button.classList.contains('active') && disableEffectFeature(groupName)) return;
          applyEffect(groupName, button.dataset.effectPreset);
        });
      }
      query('#experiencePresetGrid').addEventListener('click', (event) => {
        const button = event.target.closest?.('[data-experience-preset]');
        if (button) applyExperience(button.dataset.experiencePreset);
      });
      query('#pulsePresetGrid').addEventListener('click', (event) => {
        const button = event.target.closest?.('.pulse-preset');
        if (button) applyPulse(button.dataset.pulsePreset);
      });
    }

    function initialize() {
      bind();
      updateDimensionalUi();
      updateFoldingUi();
      initialized = true;
    }

    function initializeSafety() {
      const dialog = query('#visualSafetyDialog');
      let acknowledged = false;
      try { acknowledged = storage.getItem('quarticPulseVisualSafetyV1') === 'acknowledged'; } catch (_) { /* Show warning. */ }
      if (acknowledged) return false;
      dialog.hidden = false;
      const dismiss = (presetName) => {
        applyExperience(presetName);
        dialog.hidden = true;
        try { storage.setItem('quarticPulseVisualSafetyV1', 'acknowledged'); } catch (_) { /* Storage is optional. */ }
      };
      query('#visualSafetyLowFlashButton').addEventListener('click', () => dismiss('lowFlash'), { once: true });
      query('#visualSafetyContinueButton').addEventListener('click', () => dismiss('balanced'), { once: true });
      requestFrame(() => query('#visualSafetyLowFlashButton').focus());
      return true;
    }

    return Object.freeze({
      applyControlDefaults,
      applyEffect,
      applyExperience,
      applyFractalRecommended,
      applyPulse,
      effectOutput,
      disableEffectFeature,
      formatPercent,
      initialize,
      initializeSafety,
      markEffectCustom,
      markPulseCustom,
      updateDimensionalUi,
      updateFoldingUi,
      get diagnostics() { return Object.freeze({ ready: true, bound, initialized }); }
    });
  }

  window.QuarticVisualPresetController = Object.freeze({ create });
})();
