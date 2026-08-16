(() => {
  'use strict';

  const offsets = Object.freeze([
    Object.freeze([-.25, -.25]),
    Object.freeze([.25, -.25]),
    Object.freeze([-.25, .25]),
    Object.freeze([.25, .25])
  ]);

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
      return Math.min(maximum, Math.max(240, requested));
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
        accumulator: supersampling ? new Uint16Array(pixelCount * 4) : null
      };
    }

    function accumulate(sample, accumulator, tenBit = false) {
      if (!sample || !accumulator) throw new TypeError('A sample and accumulator are required.');
      if (!tenBit) {
        if (sample.length !== accumulator.length) throw new RangeError('RGBA sample dimensions do not match the accumulator.');
        for (let index = 0; index < sample.length; index++) accumulator[index] += sample[index];
        return;
      }
      if (sample.length * 4 !== accumulator.length) throw new RangeError('RGB10 sample dimensions do not match the accumulator.');
      for (let index = 0; index < sample.length; index++) {
        const word = sample[index] >>> 0;
        const target = index * 4;
        accumulator[target] += word & 0x3ff;
        accumulator[target + 1] += (word >>> 10) & 0x3ff;
        accumulator[target + 2] += (word >>> 20) & 0x3ff;
        accumulator[target + 3] += (word >>> 30) & 0x3;
      }
    }

    function resolve(accumulator, output, tenBit = false, sampleCount = offsets.length) {
      if (!accumulator || !output) throw new TypeError('An accumulator and output frame are required.');
      const count = Math.max(1, Math.round(Number(sampleCount) || 1));
      if (!tenBit) {
        if (accumulator.length !== output.length) throw new RangeError('RGBA output dimensions do not match the accumulator.');
        for (let index = 0; index < output.length; index++) output[index] = Math.round(accumulator[index] / count);
        return output;
      }
      if (output.length * 4 !== accumulator.length) throw new RangeError('RGB10 output dimensions do not match the accumulator.');
      for (let index = 0; index < output.length; index++) {
        const source = index * 4;
        const red = Math.round(accumulator[source] / count) & 0x3ff;
        const green = Math.round(accumulator[source + 1] / count) & 0x3ff;
        const blue = Math.round(accumulator[source + 2] / count) & 0x3ff;
        const alpha = Math.round(accumulator[source + 3] / count) & 0x3;
        output[index] = (red | (green << 10) | (blue << 20) | (alpha << 30)) >>> 0;
      }
      return output;
    }

    function selfTest() {
      const rgbaAccumulator = new Uint16Array(4);
      for (const sample of [
        new Uint8Array([10, 20, 30, 40]),
        new Uint8Array([20, 30, 40, 50]),
        new Uint8Array([30, 40, 50, 60]),
        new Uint8Array([40, 50, 60, 70])
      ]) accumulate(sample, rgbaAccumulator, false);
      const rgbaOutput = new Uint8Array(4);
      resolve(rgbaAccumulator, rgbaOutput, false, 4);

      const pack = (red, green, blue, alpha) => (red | (green << 10) | (blue << 20) | (alpha << 30)) >>> 0;
      const packedAccumulator = new Uint16Array(4);
      for (const word of [
        pack(100, 200, 300, 3), pack(200, 300, 400, 3),
        pack(300, 400, 500, 3), pack(400, 500, 600, 3)
      ]) accumulate(new Uint32Array([word]), packedAccumulator, true);
      const packedOutput = new Uint32Array(1);
      resolve(packedAccumulator, packedOutput, true, 4);
      const result = packedOutput[0] >>> 0;
      return rgbaOutput.join(',') === '25,35,45,55'
        && (result & 0x3ff) === 250
        && ((result >>> 10) & 0x3ff) === 350
        && ((result >>> 20) & 0x3ff) === 450
        && ((result >>> 30) & 0x3) === 3;
    }

    return Object.freeze({
      offsets,
      recommendedIterations,
      effectiveIterations,
      createFrameBuffers,
      accumulate,
      resolve,
      selfTest,
      diagnostics: Object.freeze({
        ready: offsets.length === 4,
        sampleCount: offsets.length,
        standardMaximum,
        unleashedMaximum
      })
    });
  }

  window.QuarticExportSamplingEngine = Object.freeze({ create });
})();
