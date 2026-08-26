(() => {
  'use strict';

  const defaultStorageKey = 'quarticPulseModulationMatrixV1';

  function serializeMapping(mapping) {
    return {
      id: mapping.id,
      source: mapping.source,
      target: mapping.target,
      amount: mapping.amount,
      attack: mapping.attack,
      release: mapping.release,
      floor: mapping.floor,
      ceiling: mapping.ceiling,
      enabled: mapping.enabled
    };
  }

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const queryAll = options.queryAll || ((selector) => document.querySelectorAll(selector));
    const documentRef = options.documentRef || document;
    const storage = options.storage || localStorage;
    const storageKey = options.storageKey || defaultStorageKey;
    const state = options.state;
    const engine = options.engine;
    const sources = options.sources;
    const targets = options.targets;
    const visualCatalog = options.visualCatalog;
    const clamp = options.clamp || ((value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)));
    const createMapping = options.createMapping || ((values) => engine.createMapping(values));
    if (!state || !engine || !sources || !targets || !visualCatalog) throw new Error('Audio modulation controller dependencies are required.');
    let bound = false;
    let initialized = false;

    function persist() {
      try {
        storage.setItem(storageKey, JSON.stringify({
          enabled: state.modulationEnabled,
          mappings: state.modulationMappings.map(serializeMapping)
        }));
      } catch (_) { /* Matrix persistence is optional. */ }
    }

    function selectOptions(collection, selected, targetOptions = false) {
      return Object.entries(collection).map(([value, details]) => {
        const unsupported = targetOptions && !engine.supports(state.visualStyle, value);
        return `<option value="${value}"${value === selected ? ' selected' : ''}${unsupported ? ' disabled' : ''}>${details.label}${unsupported ? ' — unavailable here' : ''}</option>`;
      }).join('');
    }

    function updateVisualSupport() {
      const element = query('#modulationVisualSupport');
      if (!element) return;
      const style = visualCatalog.get(state.visualStyle);
      const supported = engine.supportedTargets(state.visualStyle);
      const custom = visualCatalog.isCustom(state.visualStyle);
      element.classList.toggle('authored', custom);
      element.textContent = custom
        ? `${style.name} uses the bindings authored in its Data Horizon package. Quartic Pulse mapping routes are paused for this visual.`
        : `${style.name}: ${supported.map((target) => targets[target].label).join(', ') || 'no Quartic Pulse mapping targets'}.`;
      for (const button of queryAll('#modulationPresets [data-modulation-preset]')) {
        const name = button.dataset.modulationPreset;
        button.disabled = name !== 'clear' && engine.preset(name, state.visualStyle).length === 0;
      }
    }

    function controlMarkup(label, field, value, minimum, maximum, defaultValue, tip) {
      return `<div class="modulation-control" title="${tip}">
        <label><span>${label}</span><span>${value}%</span></label>
        <div class="modulation-control-tools">
          <input type="range" min="${minimum}" max="${maximum}" step="1" value="${value}" data-modulation-field="${field}" aria-label="${label}" />
          <input type="number" min="${minimum}" max="${maximum}" step="1" value="${value}" data-modulation-field="${field}" aria-label="${label} numerical value" />
          <button type="button" data-reset-modulation="${field}" data-default-value="${defaultValue}" title="Reset ${label.toLowerCase()}">↺</button>
        </div>
      </div>`;
    }

    function render() {
      const list = query('#modulationRouteList');
      if (!list) return;
      list.replaceChildren();
      for (const mapping of state.modulationMappings) {
        const compatible = engine.supports(state.visualStyle, mapping.target);
        mapping.compatible = compatible;
        const amountMinimum = engine.amountMinimum(mapping.target);
        const amountIsBipolar = amountMinimum < 0;
        const route = documentRef.createElement('article');
        route.className = `modulation-route${mapping.enabled ? '' : ' disabled'}${compatible ? '' : ' incompatible'}`;
        route.dataset.mappingId = mapping.id;
        route.innerHTML = `
          <div class="modulation-route-head">
            <div class="modulation-route-title">${sources[mapping.source].label} → ${targets[mapping.target].label}</div>
            <input class="modulation-route-enable" type="checkbox" ${mapping.enabled ? 'checked' : ''} aria-label="Enable modulation route" />
            <button class="modulation-route-delete" type="button" title="Delete route" aria-label="Delete route">×</button>
          </div>
          <div class="modulation-route-selects">
            <label>SOURCE<select data-modulation-select="source">${selectOptions(sources, mapping.source)}</select></label>
            <label>TARGET<select data-modulation-select="target">${selectOptions(targets, mapping.target, true)}</select></label>
          </div>
          ${compatible ? '' : `<div class="modulation-route-status">PAUSED · ${targets[mapping.target].label.toUpperCase()} IS NOT USED BY ${visualCatalog.get(state.visualStyle).name.toUpperCase()}</div>`}
          ${controlMarkup(
            amountIsBipolar ? 'AMOUNT (− / +)' : 'AMOUNT',
            'amount', mapping.amount, amountMinimum, 100, 35,
            amountIsBipolar
              ? 'Negative values reverse the source response. Positive values add to the target.'
              : 'Controls how strongly the source increases this target.'
          )}
          <div class="modulation-route-meter"><i></i></div>
          <details>
            <summary>ADVANCED RESPONSE</summary>
            ${controlMarkup('ATTACK SPEED', 'attack', mapping.attack, 0, 100, 70, 'Higher values react faster when the source rises.')}
            ${controlMarkup('RELEASE SPEED', 'release', mapping.release, 0, 100, 35, 'Higher values return to the base setting faster.')}
            ${controlMarkup('INPUT FLOOR', 'floor', mapping.floor, 0, 99, 0, 'Audio below this percentage produces no modulation.')}
            ${controlMarkup('INPUT CEILING', 'ceiling', mapping.ceiling, 1, 100, 100, 'Audio at this percentage produces the full configured amount.')}
          </details>`;
        list.appendChild(route);
      }
      query('#modulationEmpty').hidden = state.modulationMappings.length > 0;
      query('#modulationCount').textContent = `${state.modulationMappings.length} ${state.modulationMappings.length === 1 ? 'ROUTE' : 'ROUTES'}`;
      const canAddRoute = engine.supportedTargets(state.visualStyle).length > 0;
      query('#addModulationRoute').disabled = state.modulationMappings.length >= 8 || !canAddRoute;
      query('#addModulationRoute').title = canAddRoute ? '' : 'This visual uses authored Data Horizon package bindings.';
      updateVisualSupport();
    }

    function findMapping(element) {
      const id = element.closest?.('.modulation-route')?.dataset.mappingId;
      return state.modulationMappings.find((mapping) => mapping.id === id) || null;
    }

    function setField(mapping, field, requestedValue, route) {
      const limits = {
        amount: [engine.amountMinimum(mapping.target), 100],
        attack: [0, 100], release: [0, 100], floor: [0, 99], ceiling: [1, 100]
      };
      if (!limits[field]) return;
      let value = Math.round(clamp(Number(requestedValue) || 0, limits[field][0], limits[field][1]));
      if (field === 'floor') value = Math.min(value, mapping.ceiling - 1);
      if (field === 'ceiling') value = Math.max(value, mapping.floor + 1);
      mapping[field] = value;
      route.querySelectorAll(`[data-modulation-field="${field}"]`).forEach((control) => { control.value = value; });
      const labelValue = route.querySelector(`[data-modulation-field="${field}"]`)?.closest('.modulation-control')?.querySelector('label span:last-child');
      if (labelValue) labelValue.textContent = `${value}%`;
      persist();
    }

    function applyPreset(name) {
      if (name === 'clear') state.modulationMappings = [];
      else state.modulationMappings = engine.preset(name, state.visualStyle);
      state.modulationEnabled = true;
      query('#modulationEnabled').checked = true;
      render();
      persist();
      const presetNames = { math: 'Math Drive', dimension: 'Deep Motion', conventional: 'Conventional', bulb: '3D Pulse' };
      options.onToast?.(name === 'clear'
        ? 'Modulation routes cleared'
        : `${presetNames[name] || name} modulation preset loaded for ${visualCatalog.get(state.visualStyle).name}`);
    }

    function updateMeters() {
      const sourceValues = { Bass: state.bass, Mids: state.mids, Highs: state.highs, Beat: state.beat, Rms: state.rms };
      for (const [name, value] of Object.entries(sourceValues)) {
        const meter = query(`#modSource${name}`);
        if (meter) meter.style.width = `${clamp(value * 100, 0, 100)}%`;
      }
      for (const route of queryAll('.modulation-route')) {
        const mapping = findMapping(route);
        const meter = route.querySelector('.modulation-route-meter i');
        if (mapping && meter) {
          const scale = targets[mapping.target]?.scale || 1;
          meter.style.width = `${clamp(Math.abs(mapping.output || 0) / scale * 100, 0, 100)}%`;
        }
      }
    }

    function replace(configuration = {}, { save = true } = {}) {
      state.modulationEnabled = configuration.enabled !== false;
      state.modulationMappings = Array.isArray(configuration.mappings)
        ? configuration.mappings.slice(0, 8).map(createMapping)
        : [];
      const enabled = query('#modulationEnabled');
      if (enabled) enabled.checked = state.modulationEnabled;
      render();
      if (save) persist();
    }

    function bind() {
      if (bound) return;
      bound = true;
      query('#modulationEnabled').addEventListener('change', (event) => {
        state.modulationEnabled = event.target.checked;
        persist();
      });
      query('#addModulationRoute').addEventListener('click', () => {
        if (state.modulationMappings.length >= 8) return;
        const target = engine.supportedTargets(state.visualStyle)[0];
        if (!target) return;
        state.modulationMappings.push(createMapping({ target }));
        render();
        persist();
      });
      query('#modulationPresets').addEventListener('click', (event) => {
        const button = event.target.closest?.('[data-modulation-preset]');
        if (button && !button.disabled) applyPreset(button.dataset.modulationPreset);
      });
      query('#modulationRouteList').addEventListener('click', (event) => {
        const mapping = findMapping(event.target);
        if (!mapping) return;
        if (event.target.closest?.('.modulation-route-delete')) {
          state.modulationMappings = state.modulationMappings.filter((item) => item !== mapping);
          render();
          persist();
          return;
        }
        const reset = event.target.closest?.('[data-reset-modulation]');
        if (reset) setField(mapping, reset.dataset.resetModulation, reset.dataset.defaultValue, reset.closest('.modulation-route'));
      });
      query('#modulationRouteList').addEventListener('input', (event) => {
        const field = event.target.dataset.modulationField;
        const mapping = findMapping(event.target);
        if (field && mapping) setField(mapping, field, event.target.value, event.target.closest('.modulation-route'));
      });
      query('#modulationRouteList').addEventListener('change', (event) => {
        const mapping = findMapping(event.target);
        if (!mapping) return;
        if (event.target.classList.contains('modulation-route-enable')) {
          mapping.enabled = event.target.checked;
          event.target.closest('.modulation-route').classList.toggle('disabled', !mapping.enabled);
        }
        const selectField = event.target.dataset.modulationSelect;
        if (selectField === 'source' && Object.hasOwn(sources, event.target.value)) mapping.source = event.target.value;
        let targetRangeChanged = false;
        if (selectField === 'target' && Object.hasOwn(targets, event.target.value) && engine.supports(state.visualStyle, event.target.value)) {
          mapping.target = event.target.value;
          mapping.amount = clamp(mapping.amount, engine.amountMinimum(mapping.target), 100);
          targetRangeChanged = true;
        }
        const title = event.target.closest('.modulation-route').querySelector('.modulation-route-title');
        title.textContent = `${sources[mapping.source].label} → ${targets[mapping.target].label}`;
        persist();
        if (targetRangeChanged) render();
      });
    }

    function initialize() {
      try {
        const stored = JSON.parse(storage.getItem(storageKey) || 'null');
        if (stored && typeof stored === 'object') replace(stored, { save: false });
      } catch (_) { state.modulationMappings = []; }
      query('#modulationEnabled').checked = state.modulationEnabled;
      bind();
      render();
      initialized = true;
    }

    return Object.freeze({
      applyPreset,
      bind,
      initialize,
      persist,
      render,
      replace,
      serializeMapping,
      updateMeters,
      updateVisualSupport,
      get diagnostics() { return Object.freeze({ ready: true, bound, initialized, routeCount: state.modulationMappings.length }); }
    });
  }

  window.QuarticAudioModulationController = Object.freeze({ create, serializeMapping });
})();
