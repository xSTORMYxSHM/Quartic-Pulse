(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const application = options.application || 'quartic-pulse-performance';
    const schemaVersion = Number(options.schemaVersion) || 1;
    const appVersion = options.appVersion || '0.30.0-dev.1';
    const hashText = options.hashText || ((value) => String(value.length));
    const sanitizeEntry = options.sanitizeEntry || ((entry) => ({ ...entry }));
    const isValidProfile = options.isValidProfile || (() => true);
    const isValidSongMap = options.isValidSongMap || (() => true);
    const createId = options.createId || (() => `${Date.now()}-${Math.random()}`);
    const now = options.now || (() => new Date());

    function stableStringify(value) {
      if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
      if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
      }
      return JSON.stringify(value);
    }

    function clone(value) {
      if (value === undefined) return undefined;
      return JSON.parse(JSON.stringify(value));
    }

    function cleanText(value, maximum, fallback = '') {
      return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maximum) || fallback;
    }

    function fingerprint(performance) {
      return `QP-${hashText(stableStringify(performance)).toUpperCase()}`;
    }

    function trackIdentity(item, map) {
      if (!item?.file) return null;
      const fileName = cleanText(item.file.name, 240, 'Unknown audio file');
      const duration = Number.isFinite(Number(map?.duration)) ? Number(Number(map.duration).toFixed(3)) : 0;
      const portableSource = [fileName.toLowerCase(), Number(item.file.size) || 0, duration.toFixed(3)].join('|');
      return {
        displayName: cleanText(item.name, 160, fileName.replace(/\.[^.]+$/, '')),
        fileName,
        size: Math.max(0, Number(item.file.size) || 0),
        lastModified: Math.max(0, Number(item.file.lastModified) || 0),
        duration,
        fingerprint: `TRACK-${hashText(portableSource).toUpperCase()}`
      };
    }

    function trackMatches(identity, item, audioDuration) {
      if (!identity || !item?.file) return false;
      const nameMatches = String(identity.fileName || '').toLowerCase() === String(item.file.name || '').toLowerCase();
      const sizeMatches = Number(identity.size) > 0 && Number(identity.size) === Number(item.file.size);
      const duration = Number(identity.duration) || 0;
      const durationMatches = !duration || !Number.isFinite(audioDuration) || Math.abs(duration - audioDuration) <= 1.25;
      return nameMatches && sizeMatches && durationMatches;
    }

    function portableSongMap(map) {
      if (!map || !isValidSongMap(map)) return null;
      const portable = clone(map);
      delete portable.key;
      return portable;
    }

    function referencedProfiles(entries, profiles) {
      const referencedIds = new Set((Array.isArray(entries) ? entries : []).map((entry) => entry.profileId));
      return (Array.isArray(profiles) ? profiles : [])
        .filter((profile) => referencedIds.has(profile.id) && isValidProfile(profile))
        .slice(0, 100)
        .map(clone);
    }

    function createDocument(performance) {
      const packageData = clone(performance);
      return {
        application,
        schemaVersion,
        appVersion,
        exportedAt: now().toISOString(),
        fingerprint: fingerprint(packageData),
        performance: packageData
      };
    }

    function validateDocument(documentData) {
      if (documentData?.application !== application || Number(documentData?.schemaVersion) !== schemaVersion) {
        throw new Error('This is not a compatible Quartic Pulse performance package.');
      }
      const performance = documentData.performance;
      if (!performance || typeof performance !== 'object' || !isValidProfile(performance.currentVisual)) {
        throw new Error('The performance package is incomplete or damaged.');
      }
      const expectedFingerprint = fingerprint(performance);
      if (documentData.fingerprint !== expectedFingerprint) throw new Error('The package fingerprint does not match its contents.');
      return { performance, fingerprint: expectedFingerprint };
    }

    function remapImportedShow(performance, existingProfiles = []) {
      const imported = Array.isArray(performance?.show?.profiles)
        ? performance.show.profiles.filter(isValidProfile).slice(0, 100)
        : [];
      const idMap = new Map();
      const timestamp = now().toISOString();
      const importedProfiles = imported.map((profile, index) => {
        const id = createId();
        idMap.set(profile.id, id);
        return {
          id,
          name: cleanText(profile.name, 60, `Imported Show Profile ${index + 1}`),
          kind: profile.kind,
          createdAt: timestamp,
          updatedAt: timestamp,
          data: clone(profile.data)
        };
      });
      const profiles = [...importedProfiles, ...(Array.isArray(existingProfiles) ? existingProfiles : [])].slice(0, 100);
      const entries = (Array.isArray(performance?.show?.entries) ? performance.show.entries : [])
        .slice(0, 100)
        .map((entry) => ({
          ...sanitizeEntry({ ...entry, profileId: idMap.get(entry.profileId) || '' }),
          id: createId()
        }))
        .filter((entry) => profiles.some((profile) => profile.id === entry.profileId));
      return {
        profiles,
        importedProfiles,
        entries,
        loop: performance?.show?.loop !== false,
        shuffle: Boolean(performance?.show?.shuffle),
        autoBpm: performance?.show?.autoBpm !== false,
        manualBpm: clamp(Number(performance?.show?.manualBpm) || 120, 60, 200),
        beatOffsetMs: clamp(Math.round(Number(performance?.show?.beatOffsetMs) || 0), -500, 500)
      };
    }

    function suggestedFilename(title) {
      return cleanText(title, 80, 'quartic-pulse-performance')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'quartic-pulse-performance';
    }

    const diagnostics = Object.freeze({ ready: true, application, schemaVersion, appVersion });

    return Object.freeze({
      cleanText,
      clone,
      createDocument,
      fingerprint,
      portableSongMap,
      referencedProfiles,
      remapImportedShow,
      stableStringify,
      suggestedFilename,
      trackIdentity,
      trackMatches,
      validateDocument,
      diagnostics
    });
  }

  window.QuarticPerformancePackageEngine = Object.freeze({ create });
})();
