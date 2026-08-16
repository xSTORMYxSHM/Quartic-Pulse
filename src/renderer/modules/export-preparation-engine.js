(() => {
  'use strict';

  function create() {
    function positiveNumber(value, label) {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${label} must be greater than zero.`);
      return number;
    }

    function validateSettings(settings = {}) {
      const width = Math.round(positiveNumber(settings.width, 'Export width'));
      const height = Math.round(positiveNumber(settings.height, 'Export height'));
      const fps = positiveNumber(settings.fps, 'Export frame rate');
      const format = String(settings.format || '').trim();
      if (!format) throw new RangeError('Export format is required.');
      return { width, height, fps, format };
    }

    function encoderMetadata(preflight = {}) {
      return {
        requiredBytes: Number.isFinite(Number(preflight.requiredBytes))
          ? Math.max(0, Number(preflight.requiredBytes))
          : undefined,
        finalEncoder: preflight.encoder?.id ? String(preflight.encoder.id) : undefined
      };
    }

    function exportName(audioName, fallback, suffix = '') {
      return `${String(audioName || '').trim() || fallback}${suffix}`;
    }

    async function prepareOffline(input = {}, operations = {}) {
      const item = input.item;
      if (!item?.file || !item.filePath) {
        throw new Error('Offline export requires a local song file. Reload the song if it was added by an older session.');
      }
      if (typeof operations.readAudioData !== 'function' || typeof operations.decodeAudioData !== 'function') {
        throw new TypeError('Offline export preparation requires audio read and decode operations.');
      }

      const settings = input.settings || {};
      const { width, height, fps, format } = validateSettings(settings);
      const rawAudio = await operations.readAudioData(item);
      if (!(rawAudio instanceof ArrayBuffer)) throw new TypeError('The selected song did not return readable audio data.');
      const audioBuffer = await operations.decodeAudioData(rawAudio.slice(0));
      const audioDuration = positiveNumber(audioBuffer?.duration, 'Decoded audio duration');
      const requestedLimit = Number(input.durationLimit);
      const duration = Math.min(
        audioDuration,
        Number.isFinite(requestedLimit) && requestedLimit !== 0 ? Math.max(.1, requestedLimit) : audioDuration
      );
      const frameCount = Math.max(1, Math.ceil(duration * fps));
      const testSuffix = input.test ? '-5-second-test' : '';
      const sessionRequest = Object.freeze({
        suggestedName: exportName(input.audioName, 'quartic-pulse', testSuffix),
        format,
        width,
        height,
        fps,
        frameCount,
        pixelFormat: settings.tenBitProfile ? 'x2bgr10le' : 'rgba',
        hdrOutput: Boolean(settings.hdrProfile),
        audioPath: String(item.filePath),
        ...encoderMetadata(input.preflight)
      });

      return {
        item,
        width,
        height,
        fps,
        format,
        hdrProfile: Boolean(settings.hdrProfile),
        tenBitProfile: Boolean(settings.tenBitProfile),
        supersampling: Boolean(settings.supersampling),
        exportDetail: positiveNumber(settings.detail, 'Export detail'),
        showPreview: Boolean(settings.showPreview),
        exportIterations: Math.round(positiveNumber(settings.effectiveIterations, 'Export iterations')),
        audioBuffer,
        duration,
        frameCount,
        sessionRequest
      };
    }

    function prepareLive(input = {}) {
      const settings = input.settings || {};
      const { width, height, fps, format } = validateSettings(settings);
      const sessionRequest = Object.freeze({
        suggestedName: exportName(input.audioName, 'quartic-pulse'),
        format,
        ...encoderMetadata(input.preflight)
      });
      return {
        ...settings,
        width,
        height,
        fps,
        format,
        sessionRequest
      };
    }

    async function selfTest() {
      const settings = {
        width: 1920,
        height: 1080,
        fps: 60,
        format: 'youtube_sdr',
        hdrProfile: false,
        tenBitProfile: false,
        supersampling: true,
        detail: 1.6,
        showPreview: false,
        effectiveIterations: 600
      };
      const offline = await prepareOffline({
        item: { file: {}, filePath: 'C:/Music/smoke.wav' },
        settings,
        audioName: 'Smoke',
        test: true,
        durationLimit: 5,
        preflight: { requiredBytes: 2048, encoder: { id: 'h264_nvenc' } }
      }, {
        readAudioData: async () => new ArrayBuffer(8),
        decodeAudioData: async () => ({ duration: 12.25 })
      });
      const live = prepareLive({
        settings,
        audioName: '',
        preflight: { requiredBytes: 4096, encoder: { id: 'libx264' } }
      });
      let missingTrackRejected = false;
      try {
        await prepareOffline({ settings }, {
          readAudioData: async () => new ArrayBuffer(1),
          decodeAudioData: async () => ({ duration: 1 })
        });
      } catch (error) {
        missingTrackRejected = /local song file/.test(error?.message || '');
      }
      return offline.duration === 5
        && offline.frameCount === 300
        && offline.sessionRequest.suggestedName === 'Smoke-5-second-test'
        && offline.sessionRequest.finalEncoder === 'h264_nvenc'
        && offline.sessionRequest.pixelFormat === 'rgba'
        && offline.supersampling
        && live.sessionRequest.suggestedName === 'quartic-pulse'
        && live.sessionRequest.finalEncoder === 'libx264'
        && live.width === 1920
        && missingTrackRejected;
    }

    return Object.freeze({
      prepareOffline,
      prepareLive,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportPreparationEngine = Object.freeze({ create });
})();
