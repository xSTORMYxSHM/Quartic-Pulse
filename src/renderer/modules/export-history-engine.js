(() => {
  'use strict';

  function create(options = {}) {
    const storage = options.storage || window.localStorage;
    const storageKey = options.storageKey || 'quarticPulseExportHistoryV1';
    const maximumEntries = Math.max(1, Math.round(Number(options.maximumEntries) || 30));
    const createId = options.createId || (() => crypto.randomUUID());
    const now = options.now || (() => new Date().toISOString());
    let entries = [];

    function finiteNumber(value, fallback = 0) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }

    function sanitizeEntry(entry = {}) {
      const outputPath = typeof entry.outputPath === 'string' ? entry.outputPath.trim() : '';
      if (!outputPath) return null;
      return Object.freeze({
        id: typeof entry.id === 'string' && entry.id ? entry.id : createId(),
        completedAt: typeof entry.completedAt === 'string' && entry.completedAt ? entry.completedAt : now(),
        outputPath,
        sizeBytes: Math.max(0, finiteNumber(entry.sizeBytes)),
        encoderLabel: typeof entry.encoderLabel === 'string' ? entry.encoderLabel : '',
        format: typeof entry.format === 'string' ? entry.format : '',
        mode: typeof entry.mode === 'string' && entry.mode ? entry.mode : 'offline',
        width: Math.max(0, Math.round(finiteNumber(entry.width))),
        height: Math.max(0, Math.round(finiteNumber(entry.height))),
        fps: Math.max(0, finiteNumber(entry.fps)),
        duration: Math.max(0, finiteNumber(entry.duration)),
        partial: Boolean(entry.partial),
        recovered: Boolean(entry.recovered)
      });
    }

    function persist() {
      storage.setItem(storageKey, JSON.stringify(entries));
    }

    function load() {
      try {
        const stored = JSON.parse(storage.getItem(storageKey) || '[]');
        entries = Array.isArray(stored)
          ? stored.map(sanitizeEntry).filter(Boolean).slice(0, maximumEntries)
          : [];
      } catch (_) {
        entries = [];
      }
      return list();
    }

    function record(result = {}, details = {}, defaults = {}) {
      if (!result?.outputPath) return null;
      const entry = sanitizeEntry({
        id: createId(),
        completedAt: now(),
        outputPath: result.outputPath,
        sizeBytes: result.sizeBytes,
        encoderLabel: result.encoderLabel || details.encoderLabel,
        format: result.format || details.format,
        mode: details.mode || defaults.mode || 'offline',
        width: details.width ?? defaults.width,
        height: details.height ?? defaults.height,
        fps: details.fps ?? defaults.fps,
        duration: details.duration,
        partial: result.partial,
        recovered: result.recovered
      });
      if (!entry) return null;
      entries = [entry, ...entries.filter((item) => item.outputPath !== entry.outputPath)].slice(0, maximumEntries);
      try { persist(); } catch (_) { /* History remains available for this session. */ }
      return entry;
    }

    function clear() {
      entries = [];
      try { storage.removeItem(storageKey); } catch (_) { /* In-memory history is still cleared. */ }
    }

    function list(limit = maximumEntries) {
      return entries.slice(0, Math.max(0, Math.round(Number(limit) || 0)));
    }

    function find(id) {
      return entries.find((entry) => entry.id === id) || null;
    }

    function normalizeRecoveries(recoveries) {
      if (!Array.isArray(recoveries)) return [];
      return recoveries.map((entry) => ({
        id: typeof entry?.id === 'string' ? entry.id : '',
        outputPath: typeof entry?.outputPath === 'string' ? entry.outputPath : '',
        format: typeof entry?.format === 'string' ? entry.format : '',
        recoverable: Boolean(entry?.recoverable),
        width: Math.max(0, Math.round(finiteNumber(entry?.width))),
        height: Math.max(0, Math.round(finiteNumber(entry?.height))),
        fps: Math.max(0, finiteNumber(entry?.fps)),
        encodedFrames: Math.max(0, Math.round(finiteNumber(entry?.encodedFrames))),
        tempBytes: Math.max(0, finiteNumber(entry?.tempBytes))
      })).filter((entry) => entry.id && entry.outputPath);
    }

    function selfTest() {
      const memory = new Map();
      const testStorage = {
        getItem: (key) => memory.get(key) || null,
        setItem: (key, value) => memory.set(key, value),
        removeItem: (key) => memory.delete(key)
      };
      const testEngine = create({
        storage: testStorage,
        storageKey: 'test',
        maximumEntries: 2,
        createId: (() => { let id = 0; return () => `test-${++id}`; })(),
        now: () => '2026-01-01T00:00:00.000Z'
      });
      testEngine.record({ outputPath: 'A.mp4', sizeBytes: 10 }, { width: 1920, height: 1080, fps: 60 });
      testEngine.record({ outputPath: 'B.mkv', sizeBytes: 20 }, { mode: 'recovered' });
      testEngine.record({ outputPath: 'C.webm', sizeBytes: 30 });
      const reloaded = create({ storage: testStorage, storageKey: 'test', maximumEntries: 2 }).load();
      return reloaded.length === 2
        && reloaded[0].outputPath === 'C.webm'
        && reloaded[1].outputPath === 'B.mkv'
        && testEngine.normalizeRecoveries([{ id: 'r1', outputPath: 'R', recoverable: true }]).length === 1;
    }

    return Object.freeze({
      load,
      record,
      clear,
      list,
      find,
      normalizeRecoveries,
      selfTest,
      get size() { return entries.length; },
      diagnostics: Object.freeze({ ready: Boolean(storage && storageKey), storageKey, maximumEntries })
    });
  }

  window.QuarticExportHistoryEngine = Object.freeze({ create });
})();
