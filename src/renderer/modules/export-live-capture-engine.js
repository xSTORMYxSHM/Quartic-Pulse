(() => {
  'use strict';

  function create(options = {}) {
    const encoderEngine = options.encoderEngine;
    const MediaStreamClass = options.MediaStreamClass || window.MediaStream;
    if (!encoderEngine || typeof encoderEngine.createLive !== 'function') {
      throw new TypeError('Live Capture Engine requires the Export Encoder Engine.');
    }
    if (typeof MediaStreamClass !== 'function') {
      throw new TypeError('Live Capture Engine requires MediaStream support.');
    }

    let activeCapture = null;

    function positiveNumber(value, label) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${label} must be greater than zero.`);
      return number;
    }

    function videoBitrate(width, height, fps, bitsPerPixel) {
      const normalizedWidth = positiveNumber(width, 'Capture width');
      const normalizedHeight = positiveNumber(height, 'Capture height');
      const normalizedFps = positiveNumber(fps, 'Capture frame rate');
      const density = Number.isFinite(Number(bitsPerPixel)) && Number(bitsPerPixel) > 0
        ? Number(bitsPerPixel)
        : (normalizedWidth >= 3840 ? .13 : .1);
      return Math.round(normalizedWidth * normalizedHeight * normalizedFps * density);
    }

    function createCapture(config = {}) {
      if (activeCapture) throw new Error('A live capture stream is already active.');
      if (!config.canvas || typeof config.canvas.captureStream !== 'function') {
        throw new TypeError('Live capture requires a canvas capture source.');
      }
      if (!config.audioStream || typeof config.audioStream.getAudioTracks !== 'function') {
        throw new TypeError('Live capture requires an audio stream.');
      }

      const fps = positiveNumber(config.fps, 'Capture frame rate');
      const canvasStream = config.canvas.captureStream(fps);
      const videoTracks = Array.from(canvasStream?.getVideoTracks?.() || []);
      const audioTracks = Array.from(config.audioStream.getAudioTracks() || []);
      if (!videoTracks.length) throw new Error('Canvas capture did not produce a video track.');
      const stream = new MediaStreamClass([...videoTracks, ...audioTracks]);
      let encoder;
      let disposed = false;

      try {
        encoder = encoderEngine.createLive({
          stream,
          mimeType: config.mimeType,
          videoBitsPerSecond: videoBitrate(config.width, config.height, fps, config.bitsPerPixel),
          timeslice: config.timeslice,
          onChunk: config.onChunk,
          onError: config.onError,
          onStop: config.onStop
        });
      } catch (error) {
        videoTracks.forEach((track) => track.stop?.());
        throw error;
      }

      const capture = Object.freeze({
        start: (timeslice = config.timeslice || 1000) => encoder.start(timeslice),
        stop: () => encoder.stop(),
        drain: () => encoder.drain(),
        waitForStop: () => encoder.waitForStop(),
        async dispose() {
          if (disposed) return false;
          disposed = true;
          if (encoder.state !== 'inactive') {
            encoder.stop();
            await encoder.waitForStop().catch(() => {});
          }
          await encoder.drain().catch(() => {});
          videoTracks.forEach((track) => track.stop?.());
          if (activeCapture === capture) activeCapture = null;
          return true;
        },
        get state() { return encoder.state; },
        get bitrate() { return videoBitrate(config.width, config.height, fps, config.bitsPerPixel); },
        get stream() { return stream; },
        get encoder() { return encoder; }
      });
      activeCapture = capture;
      return capture;
    }

    async function selfTest() {
      const events = [];
      const videoTrack = { stop: () => events.push('video-stop') };
      const audioTrack = { stop: () => events.push('audio-stop') };
      class FakeMediaStream {
        constructor(tracks) { this.tracks = tracks; }
      }
      const fakeEncoder = {
        createLive: ({ stream, videoBitsPerSecond }) => {
          events.push(`tracks:${stream.tracks.length}`);
          events.push(`bitrate:${videoBitsPerSecond}`);
          let state = 'inactive';
          return {
            start: (timeslice) => { state = 'recording'; events.push(`start:${timeslice}`); },
            stop: () => { state = 'inactive'; events.push('stop'); },
            drain: async () => events.push('drain'),
            waitForStop: async () => events.push('wait'),
            get state() { return state; }
          };
        }
      };
      const engine = create({ encoderEngine: fakeEncoder, MediaStreamClass: FakeMediaStream });
      const capture = engine.createCapture({
        canvas: { captureStream: (fps) => ({
          getVideoTracks: () => { events.push(`fps:${fps}`); return [videoTrack]; }
        }) },
        audioStream: { getAudioTracks: () => [audioTrack] },
        width: 1920,
        height: 1080,
        fps: 60
      });
      capture.start(500);
      const bitrate = capture.bitrate;
      await capture.dispose();
      await capture.dispose();
      return bitrate === 12441600
        && videoBitrate(3840, 2160, 60) === 64696320
        && events.join('|') === 'fps:60|tracks:2|bitrate:12441600|start:500|stop|wait|drain|video-stop'
        && !events.includes('audio-stop')
        && !engine.diagnostics.active;
    }

    return Object.freeze({
      createCapture,
      videoBitrate,
      selfTest,
      get diagnostics() {
        return Object.freeze({ ready: true, active: Boolean(activeCapture), state: activeCapture?.state || 'inactive' });
      }
    });
  }

  window.QuarticExportLiveCaptureEngine = Object.freeze({ create });
})();
