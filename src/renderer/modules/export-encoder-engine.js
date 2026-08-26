(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const MediaRecorderClass = options.MediaRecorderClass || window.MediaRecorder;
    const VideoEncoderClass = options.VideoEncoderClass || window.VideoEncoder;
    const VideoFrameClass = options.VideoFrameClass || window.VideoFrame;

    function chooseRecorderType() {
      const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      return types.find((type) => MediaRecorderClass?.isTypeSupported?.(type)) || '';
    }

    function offlineVideoBitrate(width, height, fps, detail = 1.6) {
      const bitsPerPixel = detail >= 3 ? 1.2 : (detail >= 2 ? .95 : (detail >= 1.5 ? .72 : .5));
      return Math.round(clamp(width * height * fps * bitsPerPixel, 12000000, 420000000));
    }

    async function chooseOfflineConfig(width, height, fps, detail) {
      if (!VideoEncoderClass || !VideoFrameClass) throw new Error('This graphics driver does not expose the offline video encoder.');
      const bitrate = offlineVideoBitrate(width, height, fps, detail);
      const candidates = [
        { codecName: 'vp9', codec: 'vp09.00.10.08', hardwareAcceleration: 'prefer-software' },
        { codecName: 'vp9', codec: 'vp09.00.10.08', hardwareAcceleration: 'prefer-hardware' },
        { codecName: 'vp8', codec: 'vp8', hardwareAcceleration: 'prefer-software' },
        { codecName: 'vp8', codec: 'vp8', hardwareAcceleration: 'prefer-hardware' }
      ];
      for (const candidate of candidates) {
        const config = {
          codec: candidate.codec,
          width,
          height,
          framerate: fps,
          bitrate,
          bitrateMode: 'variable',
          latencyMode: 'quality',
          hardwareAcceleration: candidate.hardwareAcceleration
        };
        try {
          const support = await VideoEncoderClass.isConfigSupported(config);
          if (support.supported) return { codecName: candidate.codecName, config: support.config || config, bitrate };
        } catch (_) { /* Try the next encoder. */ }
      }
      throw new Error(`No offline VP9/VP8 encoder supports ${width}×${height} at ${fps} FPS.`);
    }

    function createLive(config = {}) {
      if (!MediaRecorderClass) throw new Error('MediaRecorder is unavailable.');
      let queue = Promise.resolve();
      let failure = null;
      let stopResolved = false;
      let resolveStopped;
      const stopped = new Promise((resolve) => { resolveStopped = resolve; });
      const recorder = new MediaRecorderClass(config.stream, {
        mimeType: config.mimeType ?? chooseRecorderType(),
        videoBitsPerSecond: config.videoBitsPerSecond
      });
      const resolveStop = () => {
        if (stopResolved) return;
        stopResolved = true;
        resolveStopped();
      };
      recorder.addEventListener('dataavailable', (event) => {
        if (!event.data?.size) return;
        queue = queue.then(async () => config.onChunk?.(await event.data.arrayBuffer()));
      });
      recorder.addEventListener('error', (event) => {
        failure = event.error || new Error('Media recorder failed.');
        config.onError?.(failure);
        resolveStop();
      });
      recorder.addEventListener('stop', () => {
        config.onStop?.();
        resolveStop();
      }, { once: true });

      return Object.freeze({
        start: (timeslice = config.timeslice || 1000) => recorder.start(timeslice),
        stop: () => { if (recorder.state !== 'inactive') recorder.stop(); },
        async waitForStop() {
          await stopped;
          if (failure) throw failure;
        },
        async drain() {
          await queue;
          if (failure) throw failure;
        },
        get state() { return recorder.state; },
        get recorder() { return recorder; }
      });
    }

    function createOffline(config = {}) {
      if (!VideoEncoderClass || !VideoFrameClass) throw new Error('The offline video encoder is unavailable.');
      let queue = Promise.resolve();
      let failure = null;
      const encoder = new VideoEncoderClass({
        output: (chunk) => {
          const bytes = new Uint8Array(chunk.byteLength);
          chunk.copyTo(bytes);
          queue = queue.then(() => config.onChunk?.(bytes));
        },
        error: (error) => {
          failure = error;
          config.onError?.(error);
        }
      });
      encoder.configure(config.encoderConfig);

      function throwIfFailed() {
        if (failure) throw failure;
      }

      return Object.freeze({
        encode(source, frame = {}) {
          throwIfFailed();
          const videoFrame = new VideoFrameClass(source, {
            timestamp: frame.timestamp,
            duration: frame.duration,
            alpha: 'discard'
          });
          encoder.encode(videoFrame, { keyFrame: Boolean(frame.keyFrame) });
          videoFrame.close();
        },
        async flushIfBackpressured(limit = 5) {
          throwIfFailed();
          if (encoder.encodeQueueSize <= limit) return false;
          await encoder.flush();
          await queue;
          throwIfFailed();
          return true;
        },
        async finish() {
          throwIfFailed();
          await encoder.flush();
          await queue;
          throwIfFailed();
          if (encoder.state !== 'closed') encoder.close();
        },
        async abort() {
          if (encoder.state !== 'closed') encoder.close();
          await queue.catch(() => {});
        },
        async drain() { await queue; throwIfFailed(); },
        get error() { return failure; },
        get state() { return encoder.state; },
        get queueSize() { return encoder.encodeQueueSize; }
      });
    }

    const diagnostics = {
      get ready() { return Boolean(MediaRecorderClass || (VideoEncoderClass && VideoFrameClass)); },
      get liveSupported() { return Boolean(MediaRecorderClass); },
      get offlineSupported() { return Boolean(VideoEncoderClass && VideoFrameClass); }
    };

    return Object.freeze({ chooseRecorderType, offlineVideoBitrate, chooseOfflineConfig, createLive, createOffline, diagnostics });
  }

  window.QuarticExportEncoderEngine = Object.freeze({ create });
})();
