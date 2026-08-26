(() => {
  'use strict';

  const offsets = Object.freeze([
    Object.freeze([-.125, -.375]),
    Object.freeze([.375, -.125]),
    Object.freeze([-.375, .125]),
    Object.freeze([.125, .375])
  ]);
  const standardOffsets = Object.freeze([Object.freeze([0, 0])]);
  const balancedOffsets = Object.freeze([offsets[0], offsets[3]]);
  const hlgA = 0.17883277;
  const hlgB = 0.28466892;
  const hlgC = 0.55991073;

  function create(options = {}) {
    const standardMaximum = Math.max(240, Math.round(Number(options.standardMaximum) || 1200));
    const unleashedMaximum = Math.max(standardMaximum, Math.round(Number(options.unleashedMaximum) || 2400));

    function recommendedIterations(width, height) {
      const pixels = Math.max(1, Number(width) || 0) * Math.max(1, Number(height) || 0);
      if (pixels <= 854 * 480) return 320;
      if (pixels <= 1280 * 720) return 400;
      if (pixels <= 1920 * 1080) return 600;
      if (pixels <= 2560 * 1440) return 800;
      return 1000;
    }

    function effectiveIterations(requestedIterations, settings = {}) {
      const requested = Math.round(Math.max(1, Number(requestedIterations) || 1));
      const maximum = settings.unleashed ? unleashedMaximum : standardMaximum;
      const minimum = Math.max(1, Math.round(Number(settings.minimum) || 240));
      return Math.min(maximum, Math.max(minimum, requested));
    }

    function normalizeMode(value, legacySupersampling = false) {
      const mode = String(value || '').trim().toLowerCase();
      if (mode === 'standard' || mode === 'balanced' || mode === 'maximum') return mode;
      return legacySupersampling ? 'maximum' : 'standard';
    }

    function offsetsForMode(value, legacySupersampling = false) {
      const mode = normalizeMode(value, legacySupersampling);
      if (mode === 'maximum') return offsets;
      if (mode === 'balanced') return balancedOffsets;
      return standardOffsets;
    }

    function sampleCount(value, legacySupersampling = false) {
      return offsetsForMode(value, legacySupersampling).length;
    }

    function createFrameBuffers(width, height, settings = {}) {
      const pixelCount = Math.max(1, Math.floor(Number(width) || 0) * Math.floor(Number(height) || 0));
      const tenBit = Boolean(settings.tenBit);
      const supersampling = Boolean(settings.supersampling);
      const output = tenBit ? new Uint32Array(pixelCount) : new Uint8Array(pixelCount * 4);
      return {
        output,
        outputBytes: tenBit ? new Uint8Array(output.buffer) : output,
        sample: supersampling
          ? (tenBit ? new Uint32Array(pixelCount) : new Uint8Array(pixelCount * 4))
          : output,
        accumulator: supersampling ? new Float32Array(pixelCount * 4) : null
      };
    }

    function decodeDisplayChannel(value, maximum, hlg = false) {
      const signal = Math.max(0, Math.min(1, value / maximum));
      if (hlg) {
        return signal <= .5
          ? signal * signal / 3
          : (Math.exp((signal - hlgC) / hlgA) + hlgB) / 12;
      }
      return Math.pow(signal, 2.2);
    }

    function encodeDisplayChannel(value, maximum, hlg = false) {
      const linear = Math.max(0, Math.min(1, value));
      const signal = hlg
        ? (linear <= (1 / 12)
          ? Math.sqrt(3 * linear)
          : hlgA * Math.log(12 * linear - hlgB) + hlgC)
        : Math.pow(linear, 1 / 2.2);
      return Math.round(Math.max(0, Math.min(1, signal)) * maximum);
    }

    function accumulate(sample, accumulator, tenBit = false, hlg = false) {
      if (!sample || !accumulator) throw new TypeError('A sample and accumulator are required.');
      if (!tenBit) {
        if (sample.length !== accumulator.length) throw new RangeError('RGBA sample dimensions do not match the accumulator.');
        for (let index = 0; index < sample.length; index += 4) {
          accumulator[index] += decodeDisplayChannel(sample[index], 255, hlg);
          accumulator[index + 1] += decodeDisplayChannel(sample[index + 1], 255, hlg);
          accumulator[index + 2] += decodeDisplayChannel(sample[index + 2], 255, hlg);
          accumulator[index + 3] += sample[index + 3] / 255;
        }
        return;
      }
      if (sample.length * 4 !== accumulator.length) throw new RangeError('RGB10 sample dimensions do not match the accumulator.');
      for (let index = 0; index < sample.length; index++) {
        const word = sample[index] >>> 0;
        const target = index * 4;
        accumulator[target] += decodeDisplayChannel(word & 0x3ff, 1023, hlg);
        accumulator[target + 1] += decodeDisplayChannel((word >>> 10) & 0x3ff, 1023, hlg);
        accumulator[target + 2] += decodeDisplayChannel((word >>> 20) & 0x3ff, 1023, hlg);
        accumulator[target + 3] += ((word >>> 30) & 0x3) / 3;
      }
    }

    function resolve(accumulator, output, tenBit = false, sampleCount = offsets.length, hlg = false) {
      if (!accumulator || !output) throw new TypeError('An accumulator and output frame are required.');
      const count = Math.max(1, Math.round(Number(sampleCount) || 1));
      if (!tenBit) {
        if (accumulator.length !== output.length) throw new RangeError('RGBA output dimensions do not match the accumulator.');
        for (let index = 0; index < output.length; index += 4) {
          output[index] = encodeDisplayChannel(accumulator[index] / count, 255, hlg);
          output[index + 1] = encodeDisplayChannel(accumulator[index + 1] / count, 255, hlg);
          output[index + 2] = encodeDisplayChannel(accumulator[index + 2] / count, 255, hlg);
          output[index + 3] = Math.round(Math.max(0, Math.min(1, accumulator[index + 3] / count)) * 255);
        }
        return output;
      }
      if (output.length * 4 !== accumulator.length) throw new RangeError('RGB10 output dimensions do not match the accumulator.');
      for (let index = 0; index < output.length; index++) {
        const source = index * 4;
        const red = encodeDisplayChannel(accumulator[source] / count, 1023, hlg) & 0x3ff;
        const green = encodeDisplayChannel(accumulator[source + 1] / count, 1023, hlg) & 0x3ff;
        const blue = encodeDisplayChannel(accumulator[source + 2] / count, 1023, hlg) & 0x3ff;
        const alpha = Math.round(Math.max(0, Math.min(1, accumulator[source + 3] / count)) * 3) & 0x3;
        output[index] = (red | (green << 10) | (blue << 20) | (alpha << 30)) >>> 0;
      }
      return output;
    }

    function selfTest() {
      const rgbaAccumulator = new Float32Array(4);
      for (const sample of [
        new Uint8Array([10, 20, 30, 40]),
        new Uint8Array([20, 30, 40, 50]),
        new Uint8Array([30, 40, 50, 60]),
        new Uint8Array([40, 50, 60, 70])
      ]) accumulate(sample, rgbaAccumulator, false);
      const rgbaOutput = new Uint8Array(4);
      resolve(rgbaAccumulator, rgbaOutput, false, 4);

      const pack = (red, green, blue, alpha) => (red | (green << 10) | (blue << 20) | (alpha << 30)) >>> 0;
      const packedAccumulator = new Float32Array(4);
      for (const word of [
        pack(100, 200, 300, 3), pack(200, 300, 400, 3),
        pack(300, 400, 500, 3), pack(400, 500, 600, 3)
      ]) accumulate(new Uint32Array([word]), packedAccumulator, true);
      const packedOutput = new Uint32Array(1);
      resolve(packedAccumulator, packedOutput, true, 4);
      const result = packedOutput[0] >>> 0;
      const hlgWord = pack(512, 512, 512, 3);
      const hlgAccumulator = new Float32Array(4);
      for (let index = 0; index < 4; index++) {
        accumulate(new Uint32Array([hlgWord]), hlgAccumulator, true, true);
      }
      const hlgOutput = new Uint32Array(1);
      resolve(hlgAccumulator, hlgOutput, true, 4, true);
      const hlgResult = hlgOutput[0] >>> 0;
      return rgbaOutput[0] > 25 && rgbaOutput[0] < 30
        && rgbaOutput[1] > 35 && rgbaOutput[1] < 40
        && rgbaOutput[2] > 45 && rgbaOutput[2] < 50
        && rgbaOutput[3] === 55
        && (result & 0x3ff) > 250
        && ((result >>> 10) & 0x3ff) > 350
        && ((result >>> 20) & 0x3ff) > 450
        && ((result >>> 30) & 0x3) === 3
        && Math.abs((hlgResult & 0x3ff) - 512) <= 1
        && Math.abs(((hlgResult >>> 10) & 0x3ff) - 512) <= 1
        && Math.abs(((hlgResult >>> 20) & 0x3ff) - 512) <= 1;
    }

    return Object.freeze({
      offsets,
      standardOffsets,
      balancedOffsets,
      normalizeMode,
      offsetsForMode,
      sampleCount,
      recommendedIterations,
      effectiveIterations,
      createFrameBuffers,
      accumulate,
      resolve,
      selfTest,
      diagnostics: Object.freeze({
        ready: offsets.length === 4 && balancedOffsets.length === 2 && standardOffsets.length === 1,
        sampleCount: offsets.length,
        supportedSampleCounts: Object.freeze([1, 2, 4]),
        standardMaximum,
        unleashedMaximum
      })
    });
  }

  window.QuarticExportSamplingEngine = Object.freeze({ create });
})();
