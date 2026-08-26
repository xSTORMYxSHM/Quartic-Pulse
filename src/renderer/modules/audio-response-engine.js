(() => {
  'use strict';

  const NOMINAL_FPS = 60;
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function frameDelta(value) {
    return clamp(finite(value, 1 / NOMINAL_FPS), 1 / 240, .1);
  }

  function responseAtDelta(responseAt60Fps, delta) {
    const response = clamp(finite(responseAt60Fps), 0, 1);
    return 1 - Math.pow(1 - response, frameDelta(delta) * NOMINAL_FPS);
  }

  function smoothingResponse(smoothing, fast, slow) {
    const shaped = Math.pow(clamp(finite(smoothing), 0, 1), 1.35);
    return fast + (slow - fast) * shaped;
  }

  function follow(current, target, delta, attack, release) {
    const from = finite(current);
    const to = finite(target);
    const response = to > from ? attack : release;
    return from + (to - from) * responseAtDelta(response, delta);
  }

  function create() {
    const bandFields = Object.freeze(['bass', 'mids', 'highs']);
    const clockFields = Object.freeze(['musicClockBass', 'musicClockMids', 'musicClockHighs', 'musicClockRms', 'musicClockBeat']);
    const clockSourceFields = Object.freeze(['bass', 'mids', 'highs', 'rms', 'beat']);
    const clockPreviousFields = Object.freeze([
      'musicClockPreviousBass', 'musicClockPreviousMids',
      'musicClockPreviousHighs', 'musicClockPreviousRms', 'musicClockPreviousBeat'
    ]);

    function resolveGain(target, rawPeak, delta) {
      const manualGain = Math.max(0, finite(target.reactivity, 1));
      const peak = Math.max(0, finite(rawPeak));
      const automatic = Boolean(target.autoReactivity);
      let automaticGain = Math.max(.01, finite(target.autoReactivityGain, 1));
      if (automatic && peak > .03) {
        const desired = clamp(finite(target.autoReactivityTarget, .74) / Math.max(.03, peak * manualGain), .25, 3);
        const response = desired < automaticGain ? .18 : .015;
        automaticGain += (desired - automaticGain) * responseAtDelta(response, delta);
      } else if (!automatic) {
        automaticGain += (1 - automaticGain) * responseAtDelta(.08, delta);
      }
      target.autoReactivityGain = automaticGain;
      return Object.freeze({
        effectiveGain: manualGain * (automatic ? automaticGain : 1),
        maximumLevel: automatic ? .96 : 1
      });
    }

    function applyFrame(target, frame = {}, delta) {
      const dt = frameDelta(delta);
      const smoothing = clamp(finite(target.analysisSmoothing, .8), 0, 1);
      const maximumLevel = clamp(finite(frame.maximumLevel, 1), 0, 1.5);
      const levels = Array.isArray(frame.levels) || ArrayBuffer.isView(frame.levels)
        ? frame.levels
        : [0, 0, 0];
      const responseProfiles = [
        { attack: smoothingResponse(smoothing, .52, .18), release: smoothingResponse(smoothing, .30, .085) },
        { attack: smoothingResponse(smoothing, .44, .15), release: smoothingResponse(smoothing, .25, .070) },
        { attack: smoothingResponse(smoothing, .56, .17), release: smoothingResponse(smoothing, .34, .095) }
      ];

      for (let index = 0; index < bandFields.length; index++) {
        const field = bandFields[index];
        const profile = responseProfiles[index];
        const value = clamp(finite(levels[index]), 0, maximumLevel);
        target[field] = follow(target[field], value, dt, profile.attack, profile.release);
      }

      const rmsAttack = smoothingResponse(smoothing, .48, .16);
      const rmsRelease = smoothingResponse(smoothing, .27, .075);
      target.rms = follow(target.rms, clamp(finite(frame.rms), 0, maximumLevel), dt, rmsAttack, rmsRelease);

      const spectrum = frame.spectrum;
      if (target.spectrumData && spectrum) {
        const attack = smoothingResponse(smoothing, .50, .16);
        const release = smoothingResponse(smoothing, .28, .065);
        const count = Math.min(target.spectrumData.length, spectrum.length);
        for (let index = 0; index < count; index++) {
          target.spectrumData[index] = follow(
            target.spectrumData[index],
            clamp(finite(spectrum[index]), 0, maximumLevel),
            dt,
            attack,
            release
          );
        }
      }

      const waveform = frame.waveform;
      if (target.waveformData && waveform) {
        const waveformResponse = smoothingResponse(smoothing, .66, .30);
        const count = Math.min(target.waveformData.length, waveform.length);
        for (let index = 0; index < count; index++) {
          target.waveformData[index] = follow(
            target.waveformData[index],
            clamp(finite(waveform[index]), -1, 1),
            dt,
            waveformResponse,
            waveformResponse
          );
        }
      }

      const colorEnergy = target.bass + target.mids + target.highs;
      if (colorEnergy > .035) {
        const hueTarget = (target.bass * .06 + target.mids * .45 + target.highs * .88) / colorEnergy;
        const hueResponse = .04 + (1 - smoothing) * .28;
        target.frequencyHue = follow(target.frequencyHue, hueTarget, dt, hueResponse, hueResponse);
        const strongest = Math.max(target.bass, target.mids, target.highs);
        target.dominantBand = strongest === target.bass ? 'bass' : (strongest === target.mids ? 'mids' : 'highs');
      } else {
        target.dominantBand = 'silence';
      }

      return Object.freeze({ levels: [target.bass, target.mids, target.highs], rms: target.rms });
    }

    function decay(target, delta) {
      const dt = frameDelta(delta);
      const bandDecay = Math.pow(.94, dt * NOMINAL_FPS);
      const beatDecay = Math.pow(.86, dt * NOMINAL_FPS);
      const waveformDecay = Math.pow(.88, dt * NOMINAL_FPS);
      target.bass = finite(target.bass) * bandDecay;
      target.mids = finite(target.mids) * bandDecay;
      target.highs = finite(target.highs) * bandDecay;
      target.rms = finite(target.rms) * bandDecay;
      target.beat = finite(target.beat) * beatDecay;
      for (let band = 0; band < 3; band++) {
        if (target.pulsePreviousLevels) target.pulsePreviousLevels[band] *= bandDecay;
      }
      if (target.spectrumData) {
        for (let index = 0; index < target.spectrumData.length; index++) target.spectrumData[index] *= bandDecay;
      }
      if (target.waveformData) {
        for (let index = 0; index < target.waveformData.length; index++) target.waveformData[index] *= waveformDecay;
      }
      if (target.bass + target.mids + target.highs < .035) {
        target.dominantBand = 'silence';
        target.frequencyHue = finite(target.frequencyHue) * Math.pow(.97, dt * NOMINAL_FPS);
      }
    }

    function advanceClocks(target, delta) {
      const dt = frameDelta(delta);
      for (let index = 0; index < clockFields.length; index++) {
        const clockField = clockFields[index];
        const source = clamp(finite(target[clockSourceFields[index]]), 0, 1.5);
        const previousField = clockPreviousFields[index];
        const previous = Number.isFinite(Number(target[previousField])) ? Number(target[previousField]) : source;
        target[clockField] = Math.max(0, finite(target[clockField])) + (previous + source) * .5 * dt;
        target[previousField] = source;
      }
    }

    function resetClocks(target) {
      for (const field of clockFields) target[field] = 0;
      for (const field of clockPreviousFields) target[field] = 0;
    }

    function reset(target, options = {}) {
      for (const field of [...bandFields, 'rms', 'frequencyHue']) target[field] = 0;
      target.dominantBand = 'silence';
      if (target.spectrumData) target.spectrumData.fill(0);
      if (target.waveformData) target.waveformData.fill(0);
      if (options.clocks !== false) resetClocks(target);
    }

    return Object.freeze({
      resolveGain,
      applyFrame,
      decay,
      advanceClocks,
      reset,
      resetClocks,
      diagnostics: Object.freeze({ ready: true, nominalFps: NOMINAL_FPS })
    });
  }

  window.QuarticAudioResponseEngine = Object.freeze({ create, responseAtDelta });
})();
