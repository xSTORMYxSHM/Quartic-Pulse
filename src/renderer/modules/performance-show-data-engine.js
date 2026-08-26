(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const showLimit = 100;
  const profileLimit = 100;

  function create(options = {}) {
    const createId = options.createId || (() => `${Date.now()}-${Math.random()}`);

    function sanitizeAutomation(automation) {
      const source = automation && typeof automation === 'object' ? automation : {};
      const result = {};
      const numericRanges = {
        director: [0, 1],
        motion: [0, 2.5],
        equation: [0, 1.5],
        flow: [0, 1]
      };
      for (const [key, range] of Object.entries(numericRanges)) {
        const value = Number(source[key]);
        if (Number.isFinite(value)) result[key] = clamp(value, range[0], range[1]);
      }
      if (['off', 'orbit', 'drift', 'zoom'].includes(source.camera)) result.camera = source.camera;
      return result;
    }

    function sanitizeEntry(entry = {}) {
      const advance = entry.advance === 'time' ? 'time' : 'beats';
      const numericValue = Number(entry.value) || 1;
      return {
        id: entry.id,
        profileId: entry.profileId,
        label: String(entry.label || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 50),
        advance,
        value: advance === 'time'
          ? clamp(Math.round(numericValue * 100) / 100, .1, 3600)
          : clamp(Math.round(numericValue), 1, 3600),
        transition: entry.transition === 'cut' ? 'cut' : 'black',
        automation: sanitizeAutomation(entry.automation)
      };
    }

    function createShowDocument(model = {}) {
      return {
        entries: (Array.isArray(model.entries) ? model.entries : []).slice(0, showLimit).map(sanitizeEntry),
        loop: model.loop !== false,
        shuffle: Boolean(model.shuffle),
        autoBpm: model.autoBpm !== false,
        manualBpm: clamp(Number(model.manualBpm) || 120, 60, 200),
        beatOffsetMs: clamp(Math.round(Number(model.beatOffsetMs) || 0), -500, 500)
      };
    }

    function parseShowDocument(serialized) {
      let source = serialized;
      try {
        if (typeof serialized === 'string') source = JSON.parse(serialized || 'null');
      } catch (_) {
        source = null;
      }
      const document = createShowDocument(source && typeof source === 'object' ? source : {});
      document.entries = document.entries.map((entry) => ({
        ...entry,
        id: String(entry.id || createId())
      }));
      return document;
    }

    function automationApplication(entry) {
      const automation = sanitizeAutomation(entry?.automation);
      const controls = {};
      if (Number.isFinite(automation.director)) controls.songDirectorIntensity = automation.director;
      if (Number.isFinite(automation.motion)) controls.motion = automation.motion;
      if (Number.isFinite(automation.equation)) controls.equationMod = automation.equation;
      if (Number.isFinite(automation.flow)) controls.flow = automation.flow;
      return { controls, camera: automation.camera || '' };
    }

    function isValidProfile(profile) {
      return Boolean(profile
        && typeof profile === 'object'
        && typeof profile.name === 'string'
        && ['colors', 'settings'].includes(profile.kind)
        && profile.data
        && typeof profile.data === 'object');
    }

    function normalizeProfiles(profiles) {
      return (Array.isArray(profiles) ? profiles : []).filter(isValidProfile).slice(0, profileLimit);
    }

    function parseProfiles(serialized) {
      try {
        const parsed = typeof serialized === 'string' ? JSON.parse(serialized || '[]') : serialized;
        return normalizeProfiles(parsed);
      } catch (_) {
        return [];
      }
    }

    function serializeProfiles(profiles) {
      return JSON.stringify(normalizeProfiles(profiles));
    }

    function findProfile(profiles, id) {
      return (Array.isArray(profiles) ? profiles : []).find((profile) => profile.id === id) || null;
    }

    const diagnostics = Object.freeze({ ready: true, showLimit, profileLimit });

    return Object.freeze({
      automationApplication,
      createShowDocument,
      findProfile,
      isValidProfile,
      normalizeProfiles,
      parseProfiles,
      parseShowDocument,
      sanitizeAutomation,
      sanitizeEntry,
      serializeProfiles,
      diagnostics
    });
  }

  window.QuarticPerformanceShowDataEngine = Object.freeze({ create });
})();
