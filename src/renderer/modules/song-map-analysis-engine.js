(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const fftInPlace = options.fftInPlace;
    if (typeof fftInPlace !== 'function') throw new Error('Song Map analysis requires an FFT implementation.');

  function percentile(values, amount) {
    const sorted = Array.from(values || []).filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * amount)))];
  }

  function estimateSongMapBpm(beatTimes) {
    if (beatTimes.length < 4) return { bpm: 0, confidence: 0 };
    const candidates = [];
    for (let index = 1; index < beatTimes.length; index++) {
      const gap = beatTimes[index] - beatTimes[index - 1];
      if (gap < .18 || gap > 2.2) continue;
      let bpm = 60 / gap;
      while (bpm < 72) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      candidates.push(bpm);
    }
    if (candidates.length < 3) return { bpm: 0, confidence: 0 };
    const histogram = new Float32Array(181);
    for (const bpm of candidates) {
      const center = Math.round(bpm);
      for (let offset = -2; offset <= 2; offset++) {
        const bin = center + offset;
        if (bin >= 0 && bin < histogram.length) histogram[bin] += 1 - Math.abs(offset) * .17;
      }
    }
    let bestBin = 0;
    for (let bin = 1; bin < histogram.length; bin++) if (histogram[bin] > histogram[bestBin]) bestBin = bin;
    const close = candidates.filter((bpm) => Math.abs(bpm - bestBin) <= 3);
    const bpm = close.length ? close.reduce((sum, value) => sum + value, 0) / close.length : bestBin;
    return { bpm: Math.round(bpm), confidence: clamp(close.length / candidates.length, 0, 1) };
  }

  function averageSongMapRange(values, from, to) {
    let total = 0;
    const end = Math.min(values.length, Math.max(from + 1, to));
    for (let index = from; index < end; index++) total += values[index] || 0;
    return total / Math.max(1, end - from) / 255;
  }

  function deriveSongMapSections(series, duration, interval) {
    const pointCount = series.energy.length;
    if (!pointCount) return [];
    const chunkPoints = Math.max(2, Math.round(6 / interval));
    const chunks = [];
    for (let start = 0; start < pointCount; start += chunkPoints) {
      const end = Math.min(pointCount, start + chunkPoints);
      chunks.push({
        time: start * interval,
        energy: averageSongMapRange(series.energy, start, end),
        bass: averageSongMapRange(series.bass, start, end),
        mids: averageSongMapRange(series.mids, start, end),
        highs: averageSongMapRange(series.highs, start, end)
      });
    }
    if (chunks.length < 2) return [{ start: 0, end: duration, label: 'Full Track', kind: 'steady', energy: chunks[0]?.energy || 0 }];
    const novelty = chunks.map((chunk, index) => {
      if (!index) return 0;
      const previous = chunks[index - 1];
      return Math.abs(chunk.energy - previous.energy) * 1.25
        + Math.abs(chunk.bass - previous.bass) * .75
        + Math.abs(chunk.mids - previous.mids) * .62
        + Math.abs(chunk.highs - previous.highs) * .68;
    });
    const threshold = percentile(novelty.slice(1), .68);
    const candidates = [];
    for (let index = 1; index < novelty.length - 1; index++) {
      if (novelty[index] >= threshold && novelty[index] >= novelty[index - 1] && novelty[index] >= novelty[index + 1]) {
        candidates.push({ time: chunks[index].time, strength: novelty[index] });
      }
    }
    candidates.sort((a, b) => b.strength - a.strength);
    const boundaries = [0, duration];
    const minimumGap = Math.min(14, Math.max(8, duration / 16));
    for (const candidate of candidates) {
      if (boundaries.length >= 10) break;
      if (candidate.time < minimumGap || duration - candidate.time < minimumGap) continue;
      if (boundaries.every((time) => Math.abs(time - candidate.time) >= minimumGap)) boundaries.push(candidate.time);
    }
    if (boundaries.length < 4 && duration >= 60) {
      for (const fraction of [1 / 3, 2 / 3]) {
        const target = duration * fraction;
        const nearby = candidates.filter((candidate) => Math.abs(candidate.time - target) <= duration * .14)
          .sort((a, b) => Math.abs(a.time - target) - Math.abs(b.time - target))[0];
        const time = nearby?.time || target;
        if (boundaries.every((boundary) => Math.abs(boundary - time) >= minimumGap)) boundaries.push(time);
      }
    }
    boundaries.sort((a, b) => a - b);
    const sections = [];
    for (let index = 0; index < boundaries.length - 1; index++) {
      const start = boundaries[index];
      const end = boundaries[index + 1];
      const from = Math.max(0, Math.floor(start / interval));
      const to = Math.min(pointCount, Math.ceil(end / interval));
      sections.push({
        start, end,
        energy: averageSongMapRange(series.energy, from, to),
        bass: averageSongMapRange(series.bass, from, to),
        mids: averageSongMapRange(series.mids, from, to),
        highs: averageSongMapRange(series.highs, from, to)
      });
    }
    const globalEnergy = sections.reduce((sum, section) => sum + section.energy, 0) / Math.max(1, sections.length);
    let peakIndex = 0;
    for (let index = 1; index < sections.length; index++) if (sections[index].energy > sections[peakIndex].energy) peakIndex = index;
    let movementNumber = 1;
    sections.forEach((section, index) => {
      const from = Math.max(0, Math.floor(section.start / interval));
      const to = Math.min(pointCount, Math.ceil(section.end / interval));
      const midpoint = Math.floor((from + to) / 2);
      const early = averageSongMapRange(series.energy, from, midpoint);
      const late = averageSongMapRange(series.energy, midpoint, to);
      if (sections.length > 1 && index === 0) {
        section.label = 'Intro'; section.kind = 'intro';
      } else if (sections.length > 1 && index === sections.length - 1) {
        section.label = 'Outro'; section.kind = 'outro';
      } else if (index === peakIndex && section.energy >= globalEnergy * 1.04) {
        section.label = 'Peak'; section.kind = 'peak';
      } else if (section.energy < globalEnergy * .72) {
        section.label = 'Breakdown'; section.kind = 'breakdown';
      } else if (late - early > .11) {
        section.label = 'Build'; section.kind = 'build';
      } else if (section.bass > Math.max(section.mids, section.highs) * 1.16) {
        section.label = 'Bass Drive'; section.kind = 'bass';
      } else if (section.highs > Math.max(section.bass, section.mids) * 1.14) {
        section.label = 'Lift'; section.kind = 'lift';
      } else {
        section.label = `Movement ${movementNumber++}`; section.kind = 'steady';
      }
    });
    if (sections.length === 1) {
      sections[0].label = 'Full Track';
      sections[0].kind = 'steady';
    }
    return sections;
  }

  async function analyzeBuffer(audioBuffer, options = {}) {
    const onProgress = options.onProgress;
    const bands = { ...(options.bands || { floor: 25, lowMid: 180, midHigh: 2400, ceiling: 12000 }) };
    const gains = Array.isArray(options.gains) ? options.gains.map((value) => Number(value) || 0) : [1, 1, 1];
    const beatSensitivity = Math.max(0, Math.min(1, Number(options.beatSensitivity) || 0));
    const beatCooldownMs = Math.max(0, Number(options.beatCooldownMs) || 0);
    const fftSize = 2048;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const interval = Math.max(.2, duration / 1400);
    const pointCount = Math.max(2, Math.ceil(duration / interval));
    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) => audioBuffer.getChannelData(index));
    const real = new Float64Array(fftSize);
    const imaginary = new Float64Array(fftSize);
    const magnitudes = new Float32Array(fftSize / 2);
    const energyRaw = new Float32Array(pointCount);
    const bassRaw = new Float32Array(pointCount);
    const midsRaw = new Float32Array(pointCount);
    const highsRaw = new Float32Array(pointCount);
    const beatEnergy = new Float32Array(pointCount);
    const sampleAt = (sampleIndex) => {
      if (sampleIndex < 0 || sampleIndex >= audioBuffer.length) return 0;
      let value = 0;
      for (const channel of channels) value += channel[sampleIndex] || 0;
      return value / channels.length;
    };
    const averageHz = (lowHz, highHz) => {
      const lowBin = clamp(Math.floor(lowHz * fftSize / sampleRate), 0, magnitudes.length - 1);
      const highBin = clamp(Math.ceil(highHz * fftSize / sampleRate), lowBin + 1, magnitudes.length);
      let total = 0;
      for (let bin = lowBin; bin < highBin; bin++) total += magnitudes[bin];
      return total / Math.max(1, highBin - lowBin);
    };
    for (let point = 0; point < pointCount; point++) {
      if (options.isCancelled?.()) throw new Error('SONG_MAP_CANCELLED');
      const centerSample = Math.round(Math.min(duration, point * interval) * sampleRate);
      let squareSum = 0;
      for (let index = 0; index < fftSize; index++) {
        const sample = sampleAt(centerSample - fftSize / 2 + index);
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
      bassRaw[point] = averageHz(bands.floor, bands.lowMid) * 1.6 * gains[0];
      midsRaw[point] = averageHz(bands.lowMid, bands.midHigh) * 1.45 * gains[1];
      highsRaw[point] = averageHz(bands.midHigh, bands.ceiling) * 1.8 * gains[2];
      const rms = Math.sqrt(squareSum / fftSize) * 3.1;
      energyRaw[point] = rms * .52 + bassRaw[point] * .2 + midsRaw[point] * .17 + highsRaw[point] * .11;
      beatEnergy[point] = bassRaw[point] * .74 + midsRaw[point] * .26;
      if (point % 18 === 0 || point === pointCount - 1) {
        onProgress?.((point + 1) / pointCount);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    const bandScale = Math.max(.05, percentile([...bassRaw, ...midsRaw, ...highsRaw], .96));
    const energyScale = Math.max(.05, percentile(energyRaw, .96));
    const quantize = (values, scale) => Array.from(values, (value) => Math.round(Math.pow(clamp(value / scale, 0, 1), .82) * 255));
    const series = {
      energy: quantize(energyRaw, energyScale),
      bass: quantize(bassRaw, bandScale),
      mids: quantize(midsRaw, bandScale),
      highs: quantize(highsRaw, bandScale)
    };
    const onset = new Float32Array(pointCount);
    let fast = 0;
    let slow = 0;
    for (let index = 0; index < pointCount; index++) {
      fast += (beatEnergy[index] - fast) * (1 - Math.exp(-interval / .055));
      slow += (beatEnergy[index] - slow) * (1 - Math.exp(-interval / .62));
      onset[index] = Math.max(0, fast - slow);
    }
    const onsetThreshold = Math.max(.004, percentile(onset, .7) * (1.22 - beatSensitivity * .5));
    const energyGate = percentile(beatEnergy, .34);
    const cooldownPoints = Math.max(1, Math.round(beatCooldownMs / 1000 / interval));
    const beats = [];
    let lastBeatPoint = -cooldownPoints;
    for (let index = 1; index < pointCount - 1; index++) {
      if (index - lastBeatPoint < cooldownPoints) continue;
      if (onset[index] >= onsetThreshold && onset[index] >= onset[index - 1] && onset[index] > onset[index + 1] && beatEnergy[index] >= energyGate) {
        beats.push(Number((index * interval).toFixed(3)));
        lastBeatPoint = index;
      }
    }
    const tempo = estimateSongMapBpm(beats);
    const sections = deriveSongMapSections(series, duration, interval);
    return {
      version: Math.max(1, Number(options.version) || 1),
      duration,
      interval,
      ...series,
      beats,
      bpm: tempo.bpm,
      bpmConfidence: tempo.confidence,
      sections
    };
  }

    return Object.freeze({
      analyzeBuffer,
      deriveSections: deriveSongMapSections,
      estimateBpm: estimateSongMapBpm,
      percentile
    });
  }

  window.QuarticSongMapAnalysisEngine = Object.freeze({ create });
})();
