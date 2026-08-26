(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const fftInPlace = options.fftInPlace;
    const responseEngine = options.responseEngine;
    if (typeof fftInPlace !== 'function' || !responseEngine) throw new Error('Offline audio analysis dependencies are incomplete.');

  function createAnalyzer(audioBuffer, fps, runtime = {}) {
    const target = runtime.target;
    const getBands = runtime.getBands;
    const gains = Array.isArray(runtime.gains) ? runtime.gains : [1, 1, 1];
    const onBeat = runtime.onBeat || (() => {});
    const onPulse = runtime.onPulse || (() => {});
    if (!target || typeof getBands !== 'function') throw new Error('Offline audio analysis requires target state and frequency bands.');
    const fftSize = 2048;
    const sampleRate = audioBuffer.sampleRate;
    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) => audioBuffer.getChannelData(index));
    const real = new Float64Array(fftSize);
    const imaginary = new Float64Array(fftSize);
    const rawWindow = new Float32Array(fftSize);
    const magnitudes = new Float32Array(fftSize / 2);
    const spectrumFrame = new Float32Array(64);
    const waveformFrame = new Float32Array(64);
    const frameDelta = 1 / fps;

    const sampleAt = (index) => {
      if (index < 0 || index >= audioBuffer.length) return 0;
      let sample = 0;
      for (const channel of channels) sample += channel[index] || 0;
      return sample / channels.length;
    };
    const averageHz = (lowHz, highHz) => {
      const lowBin = clamp(Math.floor(lowHz * fftSize / sampleRate), 0, magnitudes.length - 1);
      const highBin = clamp(Math.ceil(highHz * fftSize / sampleRate), lowBin + 1, magnitudes.length);
      let sum = 0;
      for (let bin = lowBin; bin < highBin; bin++) sum += magnitudes[bin];
      return sum / Math.max(1, highBin - lowBin);
    };

    return (timeSeconds) => {
      const centerSample = Math.round(timeSeconds * sampleRate);
      let squareSum = 0;
      for (let index = 0; index < fftSize; index++) {
        const sample = sampleAt(centerSample - fftSize / 2 + index);
        rawWindow[index] = sample;
        squareSum += sample * sample;
        const windowValue = .5 - .5 * Math.cos(2 * Math.PI * index / (fftSize - 1));
        real[index] = sample * windowValue;
        imaginary[index] = 0;
      }
      fftInPlace(real, imaginary);
      for (let bin = 0; bin < magnitudes.length; bin++) {
        const amplitude = Math.hypot(real[bin], imaginary[bin]) / (fftSize * .5);
        const decibels = 20 * Math.log10(Math.max(1e-8, amplitude));
        magnitudes[bin] = clamp((decibels + 90) / 70, 0, 1);
      }
      const bands = getBands();
      const rawBass = averageHz(bands.floor, bands.lowMid) * 1.6 * gains[0];
      const rawMids = averageHz(bands.lowMid, bands.midHigh) * 1.45 * gains[1];
      const rawHighs = averageHz(bands.midHigh, bands.ceiling) * 1.8 * gains[2];
      const rawPeak = Math.max(rawBass, rawMids, rawHighs);
      const { effectiveGain, maximumLevel } = responseEngine.resolveGain(target, rawPeak, frameDelta);
      const spectrumCeiling = Math.min(20000, sampleRate / 2);
      for (let index = 0; index < 64; index++) {
        const lowHz = 20 * Math.pow(spectrumCeiling / 20, index / 64);
        const highHz = 20 * Math.pow(spectrumCeiling / 20, (index + 1) / 64);
        spectrumFrame[index] = Math.min(maximumLevel, averageHz(lowHz, highHz) * 1.55 * effectiveGain);
        const timeIndex = Math.round(index / 63 * (fftSize - 1));
        waveformFrame[index] = clamp(rawWindow[timeIndex] * effectiveGain, -1, 1);
      }
      const bass = Math.min(maximumLevel, rawBass * effectiveGain);
      const mids = Math.min(maximumLevel, rawMids * effectiveGain);
      const highs = Math.min(maximumLevel, rawHighs * effectiveGain);
      const rms = Math.sqrt(squareSum / fftSize);
      responseEngine.applyFrame(target, {
        levels: [bass, mids, highs],
        rms: Math.min(maximumLevel, rms * 3.2 * effectiveGain),
        spectrum: spectrumFrame,
        waveform: waveformFrame,
        maximumLevel
      }, frameDelta);
      const beatLow = averageHz(30, 190) * 1.35;
      const beatLowMid = averageHz(150, 520) * 1.18;
      onBeat(beatLow, beatLowMid, frameDelta);
      onPulse([bass, mids, highs]);
    };
  }

    return Object.freeze({ createAnalyzer });
  }

  window.QuarticOfflineAudioAnalysisEngine = Object.freeze({ create });
})();
