(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const random = options.random || Math.random;

    function entryDurationSeconds(entry, bpm = 120) {
      const value = clamp(Number(entry?.value) || 1, 1, 3600);
      return entry?.advance === 'time' ? value : value * 60 / Math.max(1, Number(bpm) || 120);
    }

    function sequenceDurationSeconds(entries, bpm = 120) {
      return (Array.isArray(entries) ? entries : [])
        .reduce((total, entry) => total + entryDurationSeconds(entry, bpm), 0);
    }

    function entryStartSeconds(entries, index, bpm = 120) {
      return (Array.isArray(entries) ? entries : [])
        .slice(0, Math.max(0, Number(index) || 0))
        .reduce((total, entry) => total + entryDurationSeconds(entry, bpm), 0);
    }

    function wrapIndex(index, length) {
      if (length <= 0) return -1;
      return ((index % length) + length) % length;
    }

    function previewNextIndex({ length, index = -1, loop = true } = {}) {
      const count = Math.max(0, Math.floor(Number(length) || 0));
      if (!count) return -1;
      const next = Number(index) < 0 ? 0 : Math.floor(Number(index)) + 1;
      if (next >= count && !loop) return -1;
      return wrapIndex(next, count);
    }

    function decideAdvance({ length, index = -1, direction = 1, loop = true, shuffle = false } = {}) {
      const count = Math.max(0, Math.floor(Number(length) || 0));
      const current = Math.floor(Number(index) || 0);
      const step = Number(direction) < 0 ? -1 : 1;
      if (!count) return { index: -1, stop: true, shuffled: false };

      if (shuffle && count > 1 && step > 0) {
        if (current < 0 || current >= count) {
          return { index: Math.min(count - 1, Math.floor(clamp(random(), 0, .999999) * count)), stop: false, shuffled: true };
        }
        let next = Math.floor(clamp(random(), 0, .999999) * (count - 1));
        if (next >= current) next += 1;
        return { index: next, stop: false, shuffled: true };
      }

      const next = current + step;
      if (step > 0 && next >= count && !loop) return { index: current, stop: true, shuffled: false };
      return { index: wrapIndex(next, count), stop: false, shuffled: false };
    }

    function clockSnapshot({ time = 0, beat = 0 } = {}) {
      return {
        time: Number.isFinite(Number(time)) ? Number(time) : 0,
        beat: Number.isFinite(Number(beat)) ? Number(beat) : 0
      };
    }

    function calculateProgress({
      entry,
      startTime = 0,
      startBeat = 0,
      currentTime = 0,
      beatIndex = 0,
      beatPhase = 0
    } = {}) {
      const value = clamp(Number(entry?.value) || 1, entry?.advance === 'time' ? .1 : 1, 3600);
      if (entry?.advance === 'time') return Math.max(0, (Number(currentTime) - Number(startTime)) / value);
      return Math.max(0, (Number(beatIndex) - Number(startBeat) + Number(beatPhase)) / value);
    }

    function shouldAdvance(entry, progress, beatChanged = false) {
      if (Number(progress) < 1) return false;
      return entry?.advance === 'time' || Boolean(beatChanged);
    }

    const diagnostics = Object.freeze({ ready: true });

    return Object.freeze({
      calculateProgress,
      clockSnapshot,
      decideAdvance,
      entryDurationSeconds,
      entryStartSeconds,
      previewNextIndex,
      sequenceDurationSeconds,
      shouldAdvance,
      wrapIndex,
      diagnostics
    });
  }

  window.QuarticPerformanceSequencerEngine = Object.freeze({ create });
})();
