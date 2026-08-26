(() => {
  'use strict';

  const builtInCapabilities = Object.freeze({
    0: Object.freeze(['equation', 'equationFold', 'equationWarp', 'fractalTilt', 'fractalSlice', 'zoom', 'rotation', 'frequencyHue', 'flow', 'motion']),
    1: Object.freeze(['frequencyHue']),
    2: Object.freeze(['frequencyHue']),
    3: Object.freeze(['frequencyHue', 'pulseJagged']),
    4: Object.freeze(['frequencyHue', 'motion']),
    5: Object.freeze(['frequencyHue', 'flow', 'motion', 'bulbPower', 'bulbFold', 'bulbGlow']),
    6: Object.freeze(['frequencyHue', 'flow', 'motion'])
  });

  function create({ sources, targets, presets, clamp }) {
    const clampValue = clamp || ((value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)));
    const supportedTargets = (styleId) => builtInCapabilities[Number(styleId)] || Object.freeze([]);
    const supports = (styleId, target) => supportedTargets(styleId).includes(target);
    const amountMinimum = (target) => targets[target]?.bipolar ? -100 : 0;

    function createMapping(values = {}) {
      const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
      const source = Object.hasOwn(sources, values.source) ? values.source : 'bass';
      const target = Object.hasOwn(targets, values.target) ? values.target : supportedTargets(0)[0];
      const floor = clampValue(finiteOr(values.floor, 0), 0, 99);
      const ceiling = clampValue(finiteOr(values.ceiling, 100), floor + 1, 100);
      return {
        id: String(values.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`),
        source,
        target,
        amount: clampValue(finiteOr(values.amount, 35), amountMinimum(target), 100),
        attack: clampValue(finiteOr(values.attack, 70), 0, 100),
        release: clampValue(finiteOr(values.release, 35), 0, 100),
        floor,
        ceiling,
        enabled: values.enabled !== false,
        current: clampValue(finiteOr(values.current, 0), 0, 1),
        output: 0,
        compatible: true
      };
    }

    function update({ enabled, mappings, state, delta, styleId }) {
      const values = {};
      for (const mapping of mappings) {
        mapping.compatible = supports(styleId, mapping.target);
        mapping.output = 0;
        if (!enabled || !mapping.enabled || !mapping.compatible) {
          mapping.current = 0;
          continue;
        }
        const sourceSpec = sources[mapping.source];
        const targetSpec = targets[mapping.target];
        if (!sourceSpec || !targetSpec) continue;
        const rawValue = clampValue(Number(state[sourceSpec.stateKey]) || 0, 0, 1);
        const floor = mapping.floor / 100;
        const ceiling = Math.max(floor + .01, mapping.ceiling / 100);
        const normalized = clampValue((rawValue - floor) / (ceiling - floor), 0, 1);
        const speed = (normalized > mapping.current ? mapping.attack : mapping.release) / 100;
        const timeConstant = .015 + Math.pow(1 - speed, 2) * .8;
        const response = 1 - Math.exp(-Math.max(0, delta) / timeConstant);
        mapping.current += (normalized - mapping.current) * response;
        const contribution = mapping.current * (mapping.amount / 100) * targetSpec.scale;
        mapping.output = contribution;
        values[mapping.target] = clampValue((values[mapping.target] || 0) + contribution, -2, 2);
      }
      return values;
    }

    function preset(name, styleId) {
      return (presets[name] || []).filter((route) => supports(styleId, route.target)).map(createMapping);
    }

    function isTargetRouted({ enabled, mappings, styleId }, ...requestedTargets) {
      if (!enabled) return false;
      return mappings.some((mapping) => mapping.enabled
        && mapping.amount !== 0
        && supports(styleId, mapping.target)
        && requestedTargets.includes(mapping.target));
    }

    return Object.freeze({ amountMinimum, createMapping, isTargetRouted, preset, supportedTargets, supports, update });
  }

  window.QuarticAudioModulationEngine = Object.freeze({ builtInCapabilities, create });
})();
