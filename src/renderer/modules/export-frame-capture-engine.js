(() => {
  'use strict';

  function create(options = {}) {
    const gl = options.gl;
    const samplingEngine = options.samplingEngine;
    const requestFrame = options.requestFrame;
    const onSampleState = options.onSampleState || (() => {});
    if (!gl || typeof gl.readPixels !== 'function') {
      throw new TypeError('Export frame capture requires a WebGL rendering context.');
    }
    if (!samplingEngine || typeof samplingEngine.createFrameBuffers !== 'function') {
      throw new TypeError('Export frame capture requires the Export Sampling Engine.');
    }
    if (typeof requestFrame !== 'function') {
      throw new TypeError('Export frame capture requires a visual-frame request callback.');
    }

    function resetSampleState() {
      onSampleState({ sampleIndex: 0, offset: [0, 0], active: false });
    }

    function createCapture(settings = {}) {
      const width = Math.max(1, Math.floor(Number(settings.width) || 1));
      const height = Math.max(1, Math.floor(Number(settings.height) || 1));
      const tenBit = Boolean(settings.tenBit);
      const hlg = Boolean(settings.hdr);
      const supersampling = Boolean(settings.supersampling);
      const buffers = samplingEngine.createFrameBuffers(width, height, { tenBit, supersampling });
      const sampleOffsets = supersampling && Array.isArray(settings.sampleOffsets) && settings.sampleOffsets.length
        ? settings.sampleOffsets
        : supersampling ? samplingEngine.offsets : samplingEngine.standardOffsets || [[0, 0]];
      const sampleCount = sampleOffsets.length;
      let frameOpen = false;

      function beginFrame() {
        if (frameOpen) throw new Error('The previous export frame capture is still open.');
        frameOpen = true;
        if (supersampling) buffers.accumulator.fill(0);
      }

      async function captureSample(sample = {}) {
        if (!frameOpen) throw new Error('Export frame capture must begin before reading a sample.');
        const sampleIndex = Math.max(0, Math.round(Number(sample.sampleIndex) || 0));
        const offset = Array.isArray(sample.offset) ? sample.offset : [0, 0];
        onSampleState({ sampleIndex, offset, active: true });
        await requestFrame();
        gl.readPixels(
          0,
          0,
          width,
          height,
          gl.RGBA,
          tenBit ? gl.UNSIGNED_INT_2_10_10_10_REV : gl.UNSIGNED_BYTE,
          supersampling ? buffers.sample : buffers.output
        );
        if (supersampling) samplingEngine.accumulate(buffers.sample, buffers.accumulator, tenBit, hlg);
      }

      function resolveFrame() {
        if (!frameOpen) throw new Error('Export frame capture must begin before resolving a frame.');
        try {
          if (supersampling) samplingEngine.resolve(buffers.accumulator, buffers.output, tenBit, sampleCount, hlg);
          return buffers.outputBytes;
        } finally {
          resetSampleState();
        }
      }

      function cleanup() {
        frameOpen = false;
        resetSampleState();
      }

      return Object.freeze({
        beginFrame,
        captureSample,
        resolveFrame,
        cleanup,
        get output() { return buffers.output; },
        get outputBytes() { return buffers.outputBytes; },
        diagnostics: Object.freeze({ width, height, tenBit, hlg, supersampling, sampleCount })
      });
    }

    async function selfTest() {
      const reads = [];
      const values = [];
      const sampleStates = [];
      const fakeGl = {
        RGBA: 6408,
        UNSIGNED_BYTE: 5121,
        UNSIGNED_INT_2_10_10_10_REV: 33640,
        readPixels: (_x, _y, _width, _height, _format, type, target) => {
          reads.push(type);
          target.fill(values.shift() ?? 0);
        }
      };
      const harness = create({
        gl: fakeGl,
        samplingEngine,
        requestFrame: async () => {},
        onSampleState: (sample) => sampleStates.push(`${sample.active ? 'sample' : 'reset'}:${sample.sampleIndex}`)
      });

      values.push(77);
      const standard = harness.createCapture({ width: 1, height: 1 });
      standard.beginFrame();
      await standard.captureSample({ sampleIndex: 0, offset: [0, 0] });
      standard.resolveFrame();
      standard.cleanup();

      values.push(10, 20, 30, 40);
      const supersampled = harness.createCapture({ width: 1, height: 1, supersampling: true });
      supersampled.beginFrame();
      for (let index = 0; index < samplingEngine.offsets.length; index++) {
        await supersampled.captureSample({ sampleIndex: index, offset: samplingEngine.offsets[index] });
      }
      supersampled.resolveFrame();
      supersampled.cleanup();

      values.push(20, 40);
      const balanced = harness.createCapture({
        width: 1, height: 1, supersampling: true, sampleOffsets: samplingEngine.balancedOffsets
      });
      balanced.beginFrame();
      for (let index = 0; index < samplingEngine.balancedOffsets.length; index++) {
        await balanced.captureSample({ sampleIndex: index, offset: samplingEngine.balancedOffsets[index] });
      }
      balanced.resolveFrame();
      balanced.cleanup();

      const packed = (100 | (200 << 10) | (300 << 20) | (3 << 30)) >>> 0;
      values.push(packed);
      const tenBit = harness.createCapture({ width: 1, height: 1, tenBit: true });
      tenBit.beginFrame();
      await tenBit.captureSample({ sampleIndex: 0, offset: [0, 0] });
      tenBit.resolveFrame();
      tenBit.cleanup();

      return standard.output[0] === 77
        && supersampled.output[0] > 25 && supersampled.output[0] < 30
        && balanced.output[0] > 30 && balanced.output[0] < 35
        && tenBit.output[0] === packed
        && reads.join(',') === '5121,5121,5121,5121,5121,5121,5121,33640'
        && sampleStates.filter((entry) => entry.startsWith('sample')).length === 8
        && sampleStates.at(-1) === 'reset:0';
    }

    return Object.freeze({
      createCapture,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportFrameCaptureEngine = Object.freeze({ create });
})();
