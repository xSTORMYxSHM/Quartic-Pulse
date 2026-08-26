(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const responseEngineFactory = window.QuarticAudioResponseEngine;
  if (!responseEngineFactory) throw new Error('Quartic audio response engine failed to load.');

  function create(options = {}) {
    const responseEngine = options.responseEngine || responseEngineFactory.create();
    let audioContext = null;
    let analyser = null;
    let beatAnalyser = null;
    let frequencyData = null;
    let beatFrequencyData = null;
    let timeData = null;
    const spectrumFrame = new Float32Array(64);
    const waveformFrame = new Float32Array(64);
    let lastBeatDiagnostics = { energy: 0, onset: 0, threshold: 0, detected: false };

    function attach(context, spectrumAnalyser, onsetAnalyser) {
      audioContext = context;
      analyser = spectrumAnalyser;
      beatAnalyser = onsetAnalyser;
      frequencyData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
      beatFrequencyData = beatAnalyser ? new Uint8Array(beatAnalyser.frequencyBinCount) : null;
      timeData = analyser ? new Uint8Array(analyser.fftSize) : null;
      return diagnostics;
    }

    function averageBand(data, lowHz, highHz) {
      if (!data || !audioContext) return 0;
      const nyquist = audioContext.sampleRate / 2;
      const low = Math.max(0, Math.floor(lowHz / nyquist * data.length));
      const high = Math.min(data.length - 1, Math.ceil(highHz / nyquist * data.length));
      let total = 0;
      for (let index = low; index <= high; index++) total += data[index];
      return total / Math.max(1, high - low + 1) / 255;
    }

    function resetBeatDetector(target, { keepTotal = false } = {}) {
      target.beatFastEnvelope = 0;
      target.beatSlowEnvelope = 0;
      target.beatOnsetAverage = .008;
      target.beatCooldownRemaining = 0;
      target.beatDetectorArmed = true;
      if (!keepTotal) target.beatDetectedTotal = 0;
      lastBeatDiagnostics = { energy: 0, onset: 0, threshold: 0, detected: false };
    }

    function updateBeatDetector(target, lowEnergy, lowMidEnergy, delta, options = {}) {
      const frameDelta = clamp(Number(delta) || 1 / 60, 1 / 240, .1);
      const sensitivity = clamp(Number(target.beatSensitivity) || 0, 0, 1);
      const energy = clamp(lowEnergy * .72 + lowMidEnergy * .28, 0, 1);
      const fastTime = energy > target.beatFastEnvelope ? .022 : .115;
      const slowTime = energy > target.beatSlowEnvelope ? .46 : .78;
      target.beatFastEnvelope += (energy - target.beatFastEnvelope) * (1 - Math.exp(-frameDelta / fastTime));
      target.beatSlowEnvelope += (energy - target.beatSlowEnvelope) * (1 - Math.exp(-frameDelta / slowTime));
      const onset = Math.max(0, target.beatFastEnvelope - target.beatSlowEnvelope);
      target.beatOnsetAverage += (onset - target.beatOnsetAverage) * (1 - Math.exp(-frameDelta / .68));
      target.beatCooldownRemaining = Math.max(0, target.beatCooldownRemaining - frameDelta);

      const minimumEnergy = .13 - sensitivity * .095;
      const thresholdFloor = .024 - sensitivity * .017;
      const adaptiveThreshold = thresholdFloor + target.beatOnsetAverage * (2.45 - sensitivity * 1.55);
      if (!target.beatDetectorArmed && (onset < adaptiveThreshold * .52 || energy < target.beatSlowEnvelope * 1.025)) {
        target.beatDetectorArmed = true;
      }
      const detectedBeat = target.beatDetectorArmed
        && target.beatCooldownRemaining <= 0
        && energy >= minimumEnergy
        && onset >= adaptiveThreshold;
      if (detectedBeat) {
        target.beatDetectorArmed = false;
        target.beatCooldownRemaining = clamp(Number(target.beatCooldownMs) || 150, 80, 300) / 1000;
        target.beatDetectedTotal += 1;
        if (options.register !== false) options.onBeat?.();
        if (target.beatPulse) target.beat = clamp(.28 + energy * .54 + onset * 3.2, .35, 1);
      } else target.beat *= Math.exp(-frameDelta / .105);
      lastBeatDiagnostics = { energy, onset, threshold: adaptiveThreshold, detected: detectedBeat };
      return detectedBeat;
    }

    function update(target, options = {}) {
      if (!analyser || !options.active) {
        responseEngine.decay(target, options.delta);
        return { levels: [target.bass, target.mids, target.highs], beat: lastBeatDiagnostics };
      }
      analyser.getByteFrequencyData(frequencyData);
      beatAnalyser?.getByteFrequencyData(beatFrequencyData);
      analyser.getByteTimeDomainData(timeData);
      let squareSum = 0;
      for (const sample of timeData) {
        const normalized = (sample - 128) / 128;
        squareSum += normalized * normalized;
      }
      const rms = Math.sqrt(squareSum / timeData.length);
      const bands = options.bands;
      const rawBass = averageBand(frequencyData, bands.floor, bands.lowMid) * 1.6 * target.analysisBassGain;
      const rawMids = averageBand(frequencyData, bands.lowMid, bands.midHigh) * 1.45 * target.analysisMidGain;
      const rawHighs = averageBand(frequencyData, bands.midHigh, bands.ceiling) * 1.8 * target.analysisHighGain;
      const rawPeak = Math.max(rawBass, rawMids, rawHighs);
      const { effectiveGain, maximumLevel } = responseEngine.resolveGain(target, rawPeak, options.delta);
      const spectrumFloor = 20;
      const spectrumCeiling = Math.min(20000, audioContext.sampleRate / 2);
      for (let index = 0; index < 64; index++) {
        const lowPosition = index / 64;
        const highPosition = (index + 1) / 64;
        const lowHz = spectrumFloor * Math.pow(spectrumCeiling / spectrumFloor, lowPosition);
        const highHz = spectrumFloor * Math.pow(spectrumCeiling / spectrumFloor, highPosition);
        spectrumFrame[index] = Math.min(maximumLevel, averageBand(frequencyData, lowHz, highHz) * 1.55 * effectiveGain);
        const timeIndex = Math.min(timeData.length - 1, Math.round(index / 63 * (timeData.length - 1)));
        waveformFrame[index] = clamp((timeData[timeIndex] - 128) / 128 * effectiveGain, -1, 1);
      }
      const bass = Math.min(maximumLevel, rawBass * effectiveGain);
      const mids = Math.min(maximumLevel, rawMids * effectiveGain);
      const highs = Math.min(maximumLevel, rawHighs * effectiveGain);
      responseEngine.applyFrame(target, {
        levels: [bass, mids, highs],
        rms: Math.min(maximumLevel, rms * 3.2 * effectiveGain),
        spectrum: spectrumFrame,
        waveform: waveformFrame,
        maximumLevel
      }, options.delta);
      const beatLow = averageBand(beatFrequencyData, 30, 190) * 1.35;
      const beatLowMid = averageBand(beatFrequencyData, 150, 520) * 1.18;
      updateBeatDetector(target, beatLow, beatLowMid, options.delta, { onBeat: options.onBeat });
      options.onPulse?.([bass, mids, highs]);
      return { levels: [bass, mids, highs], beat: lastBeatDiagnostics };
    }

    const diagnostics = {
      get ready() { return Boolean(audioContext && analyser && frequencyData && timeData); },
      get frequencyBins() { return frequencyData?.length || 0; },
      get timeSamples() { return timeData?.length || 0; },
      get beat() { return { ...lastBeatDiagnostics }; }
    };

    return Object.freeze({ attach, resetBeatDetector, update, updateBeatDetector, diagnostics });
  }

  window.QuarticAudioAnalysisEngine = Object.freeze({ create });
})();
