(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const cacheVersion = Number(options.cacheVersion) || 1;
    const cacheLimit = Math.max(1, Number(options.cacheLimit) || 10);
    const overrideLimit = Math.max(1, Number(options.overrideLimit) || 20);
    const now = options.now || (() => new Date());

    function hashText(text) {
      const source = String(text);
      let hash = 2166136261;
      for (let index = 0; index < source.length; index++) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16).padStart(8, '0');
    }

    function profileSignature(model = {}) {
      const bands = model.bands || {};
      return [
        model.personality,
        bands.floor, bands.lowMid, bands.midHigh, bands.ceiling,
        (Number(model.bassGain) || 0).toFixed(3),
        (Number(model.midGain) || 0).toFixed(3),
        (Number(model.highGain) || 0).toFixed(3),
        (Number(model.smoothing) || 0).toFixed(3),
        (Number(model.beatSensitivity) || 0).toFixed(3),
        Math.round(Number(model.beatCooldownMs) || 0)
      ].join('|');
    }

    function mapKey(item, signature) {
      if (!item?.file) return '';
      const source = [item.file.name, item.file.size, item.file.lastModified, item.filePath || '', signature].join('|');
      return `map-${hashText(source)}`;
    }

    function isValidMap(map) {
      const pointCount = map?.energy?.length;
      return Boolean(map
        && map.version === cacheVersion
        && typeof map.key === 'string'
        && Number.isFinite(map.duration) && map.duration > 0
        && Number.isFinite(map.interval) && map.interval > 0
        && pointCount > 1
        && ['bass', 'mids', 'highs'].every((key) => Array.isArray(map[key]) && map[key].length === pointCount)
        && Array.isArray(map.beats)
        && Array.isArray(map.sections));
    }

    function parseCache(serialized) {
      try {
        const entries = typeof serialized === 'string' ? JSON.parse(serialized || '[]') : serialized;
        return Array.isArray(entries) ? entries.filter(isValidMap) : [];
      } catch (_) {
        return [];
      }
    }

    function prepareCache(entries, limit = cacheLimit) {
      return (Array.isArray(entries) ? entries : []).filter(isValidMap)
        .sort((first, second) => Date.parse(second.updatedAt || 0) - Date.parse(first.updatedAt || 0))
        .slice(0, Math.max(1, Number(limit) || cacheLimit));
    }

    function upsertCache(entries, map) {
      return prepareCache([map, ...parseCache(entries).filter((entry) => entry.key !== map?.key)]);
    }

    function sectionEnergy(map, section) {
      if (!map?.energy?.length || !map.duration) return .45;
      const startIndex = clamp(Math.floor(section.start / map.duration * map.energy.length), 0, map.energy.length - 1);
      const endIndex = clamp(Math.ceil(section.end / map.duration * map.energy.length), startIndex + 1, map.energy.length);
      let sum = 0;
      for (let index = startIndex; index < endIndex; index += 1) sum += Number(map.energy[index]) || 0;
      return clamp(sum / Math.max(1, endIndex - startIndex) / 255, 0, 1);
    }

    function parseOverrides(serialized) {
      try {
        const entries = typeof serialized === 'string' ? JSON.parse(serialized || '[]') : serialized;
        return Array.isArray(entries)
          ? entries.filter((entry) => entry && typeof entry.mapKey === 'string' && entry.cues && typeof entry.cues === 'object')
          : [];
      } catch (_) {
        return [];
      }
    }

    function normalizeOverride(override, allowAuto = true) {
      if (!override) return null;
      const emphases = allowAuto
        ? ['auto', 'camera', 'equation', 'color', 'dimension', 'fold']
        : ['camera', 'equation', 'color', 'dimension', 'fold'];
      return {
        strength: clamp(Number(override.strength), 0, 1),
        emphasis: emphases.includes(override.emphasis) ? override.emphasis : 'auto'
      };
    }

    function overrideFor(entries, mapKeyValue, index) {
      if (!mapKeyValue) return null;
      const set = parseOverrides(entries).find((entry) => entry.mapKey === mapKeyValue);
      return normalizeOverride(set?.cues?.[index]);
    }

    function replaceOverrideSet(entries, mapKeyValue, cues) {
      const remaining = parseOverrides(entries).filter((entry) => entry.mapKey !== mapKeyValue);
      if (mapKeyValue && cues && typeof cues === 'object' && Object.keys(cues).length) {
        remaining.unshift({ mapKey: mapKeyValue, updatedAt: now().toISOString(), cues: { ...cues } });
      }
      return remaining.slice(0, overrideLimit);
    }

    function updateOverride(entries, mapKeyValue, index, override) {
      if (!mapKeyValue || index < 0) return parseOverrides(entries);
      const existing = parseOverrides(entries).find((entry) => entry.mapKey === mapKeyValue) || { cues: {} };
      const cues = { ...existing.cues };
      const normalized = normalizeOverride(override, false);
      if (!normalized || (Math.abs(normalized.strength - 1) < .0001 && normalized.emphasis === 'auto')) delete cues[index];
      else cues[index] = normalized;
      return replaceOverrideSet(entries, mapKeyValue, cues);
    }

    const diagnostics = Object.freeze({ ready: true, cacheVersion, cacheLimit, overrideLimit });

    return Object.freeze({
      hashText,
      isValidMap,
      mapKey,
      normalizeOverride,
      overrideFor,
      parseCache,
      parseOverrides,
      prepareCache,
      profileSignature,
      replaceOverrideSet,
      sectionEnergy,
      updateOverride,
      upsertCache,
      diagnostics
    });
  }

  window.QuarticSongMapDataEngine = Object.freeze({ create });
})();
