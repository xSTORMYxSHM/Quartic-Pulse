(() => {
  'use strict';

  function create(options = {}) {
    const delay = options.delay || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    const pausePollMilliseconds = Math.max(10, Math.round(Number(options.pausePollMilliseconds) || 100));

    function abortError(message = 'Offline export cancelled.') {
      if (typeof DOMException === 'function') return new DOMException(message, 'AbortError');
      const error = new Error(message);
      error.name = 'AbortError';
      return error;
    }

    function assertActive(sessionEngine, frameIndex) {
      if (sessionEngine.cancelRequested) throw abortError();
      return !(sessionEngine.finishRequested && frameIndex > 0);
    }

    async function waitUntilRunnable(sessionEngine, frameIndex) {
      if (!assertActive(sessionEngine, frameIndex)) return false;
      while (sessionEngine.paused && !sessionEngine.cancelRequested && !sessionEngine.finishRequested) {
        await delay(pausePollMilliseconds);
      }
      return assertActive(sessionEngine, frameIndex);
    }

    async function renderFrames(config = {}) {
      const sessionEngine = config.sessionEngine;
      if (!sessionEngine) throw new TypeError('Offline rendering requires an export session engine.');
      const frameCount = Math.max(1, Math.round(Number(config.frameCount) || 1));
      const fps = Math.max(1, Number(config.fps) || 60);
      const supersampling = Boolean(config.supersampling);
      const sampleOffsets = supersampling && Array.isArray(config.sampleOffsets) && config.sampleOffsets.length
        ? config.sampleOffsets
        : [[0, 0]];
      const progressInterval = Math.max(1, Math.floor(fps / 5));
      let renderedFrameCount = 0;

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        if (!(await waitUntilRunnable(sessionEngine, frameIndex))) break;
        const time = frameIndex / fps;
        const frame = Object.freeze({ frameIndex, frameCount, fps, time, supersampling, sampleCount: sampleOffsets.length });
        await config.onFrameStart?.(frame);
        try {
          for (let sampleIndex = 0; sampleIndex < sampleOffsets.length; sampleIndex++) {
            const offset = sampleOffsets[sampleIndex];
            await config.onSample?.({ ...frame, sampleIndex, offset });
          }
          await config.onFrameReady?.(frame);
          await config.onAppendFrame?.(frame);
        } finally {
          await config.onFrameEnd?.(frame);
        }
        renderedFrameCount = frameIndex + 1;
        const progress = renderedFrameCount / frameCount;
        if (frameIndex % progressInterval === 0 || renderedFrameCount === frameCount) {
          await config.onProgress?.({
            ...frame,
            renderedFrameCount,
            progress,
            overallProgress: progress * .8
          });
        }
      }

      return Object.freeze({
        renderedFrameCount,
        frameCount,
        fps,
        finishRequested: Boolean(sessionEngine.finishRequested),
        completedAllFrames: renderedFrameCount === frameCount
      });
    }

    async function selfTest() {
      const control = { paused: false, cancelRequested: false, finishRequested: false };
      const samples = [];
      const appended = [];
      const progress = [];
      const result = await renderFrames({
        sessionEngine: control,
        frameCount: 3,
        fps: 30,
        supersampling: true,
        sampleOffsets: [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]],
        onSample: ({ frameIndex, sampleIndex }) => samples.push(`${frameIndex}:${sampleIndex}`),
        onAppendFrame: ({ frameIndex }) => appended.push(frameIndex),
        onProgress: ({ renderedFrameCount }) => progress.push(renderedFrameCount)
      });
      const shortControl = { paused: false, cancelRequested: false, finishRequested: false };
      const short = await renderFrames({
        sessionEngine: shortControl,
        frameCount: 4,
        fps: 30,
        onAppendFrame: () => { shortControl.finishRequested = true; }
      });
      let cancelled = false;
      try {
        await renderFrames({
          sessionEngine: { paused: false, cancelRequested: true, finishRequested: false },
          frameCount: 1,
          fps: 30
        });
      } catch (error) {
        cancelled = error?.name === 'AbortError';
      }
      return result.renderedFrameCount === 3
        && result.completedAllFrames
        && samples.length === 12
        && appended.join(',') === '0,1,2'
        && progress.join(',') === '1,3'
        && short.renderedFrameCount === 1
        && short.finishRequested
        && cancelled;
    }

    return Object.freeze({
      renderFrames,
      selfTest,
      diagnostics: Object.freeze({ ready: true, pausePollMilliseconds })
    });
  }

  window.QuarticExportRenderCoordinator = Object.freeze({ create });
})();
