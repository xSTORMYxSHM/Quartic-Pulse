(() => {
  'use strict';

  function create(options = {}) {
    const profiles = options.profiles;
    const planning = options.planningEngine;
    const formatTime = options.formatTime || ((seconds) => `${Math.round(Number(seconds) || 0)}s`);
    const fileName = options.fileName || ((path) => String(path || '').split(/[\\/]/).pop() || 'video');
    if (!profiles?.profiles || typeof profiles.normalizeProfileId !== 'function') {
      throw new TypeError('Export presentation requires the shared export profile catalog.');
    }
    if (!planning || typeof planning.formatBitrate !== 'function'
      || typeof planning.formatByteRange !== 'function' || typeof planning.formatByteSize !== 'function') {
      throw new TypeError('Export presentation requires export planning formatters.');
    }

    function profileFor(candidate, fallbackId) {
      return candidate || profiles.profiles[profiles.normalizeProfileId(fallbackId)];
    }

    function samplingLabel(settings = {}) {
      const samples = Math.max(1, Math.round(Number(settings.samplingSamples)
        || (settings.supersampling ? 4 : 1)));
      if (samples === 2) return 'Balanced Clarity · 2× sampling';
      if (samples >= 4) return 'Maximum Clarity · 4× sampling';
      return 'Standard Clarity · 1× sampling';
    }

    function performanceView(settings = {}) {
      const estimate = settings.estimate;
      if (!estimate?.profile || !estimate.bitrate || !estimate.size) {
        throw new TypeError('Export performance presentation requires a profile estimate.');
      }
      const { profile, bitrate, size, colorDescription } = estimate;
      const iterations = Math.max(1, Math.round(Number(settings.iterations) || 1));
      let message = `${profile.container} · ${profile.videoCodec} · ${estimate.width}×${estimate.height} at ${estimate.fps} FPS · ${colorDescription}`;
      message += ` · ${planning.formatBitrate(bitrate.minimum)}–${planning.formatBitrate(bitrate.maximum)}`;
      message += estimate.duration
        ? ` · about ${planning.formatByteRange(size)}`
        : ` · about ${planning.formatByteRange(size)} per minute`;
      message += ` · ${iterations} math iterations`;
      message += ` · ${samplingLabel(settings)}`;
      if (estimate.loadLevel === 'extreme') message += ' · extreme GPU, encoder, and storage load';
      else if (estimate.loadLevel === 'high') message += ' · high GPU and storage load';
      return Object.freeze({
        message,
        warning: estimate.loadLevel !== 'normal',
        profileTitle: `${profile.container} · ${profile.videoCodec}`,
        profileSubtitle: `${colorDescription} · ${profile.audioCodec}`,
        profileDetail: `${profile.summary} Estimated ${planning.formatBitrate(bitrate.minimum)}–${planning.formatBitrate(bitrate.maximum)}${estimate.duration ? ` and ${planning.formatByteRange(size)} for this song` : ''}.`
      });
    }

    function encoderStatusView(preflight = {}, fallbackProfileId) {
      if (!preflight.encoder) return null;
      const profile = profileFor(preflight.profile, fallbackProfileId);
      const acceleration = preflight.encoder.hardware ? 'hardware accelerated' : 'software encoded';
      return Object.freeze({
        title: String(preflight.encoder.label || 'Encoder').toUpperCase(),
        detail: `${profile.container} · ${profile.videoCodec} · ${profile.colorDepth} ${profile.chroma} · ${profile.audioCodec} · ${acceleration}`,
        ready: true
      });
    }

    function encoderFailureView(error) {
      return Object.freeze({
        title: 'ENCODER CHECK FAILED',
        detail: error?.message || String(error || 'Unknown encoder error'),
        ready: false
      });
    }

    function encoderCheckingView() {
      return Object.freeze({
        title: 'CHECKING QUALITY PIPELINE',
        detail: 'Verifying the selected format and encoder on this PC…',
        ready: false
      });
    }

    function preflightView(settings = {}) {
      const preflight = settings.preflight;
      if (!preflight) throw new TypeError('Export preflight presentation requires preflight data.');
      const profile = profileFor(preflight.profile, settings.fallbackProfileId);
      const hdrOutput = profile.id === 'youtube_hdr' && Boolean(settings.hdrOutput);
      const warnings = [];
      if (preflight.encoder?.warning) warnings.push(preflight.encoder.warning);
      if (preflight.freeBytes > 0 && preflight.freeBytes < preflight.requiredBytes) {
        warnings.push('The default Videos drive may not have enough space. Choose another destination when prompted.');
      }
      return Object.freeze({
        video: `${preflight.width}×${preflight.height} · ${preflight.fps} FPS · ${preflight.iterations} math iterations${preflight.matchLive ? ' · live parity' : ' · alternate depth'} · ${samplingLabel(preflight)} · ${profile.label}`,
        encoder: preflight.encoder?.label || 'Encoder unavailable',
        format: `${profile.container} · ${profile.videoCodec}`,
        color: hdrOutput ? '10-bit · 4:2:0 · Rec.2020 HLG' : `${profile.colorDepth} · ${profile.chroma} · BT.709`,
        bitrate: `${planning.formatBitrate(preflight.estimatedBitrate?.minimum)}–${planning.formatBitrate(preflight.estimatedBitrate?.maximum)}`,
        output: planning.formatByteRange(preflight.estimatedSize),
        space: planning.formatByteSize(preflight.requiredBytes),
        free: preflight.freeBytes ? `${planning.formatByteSize(preflight.freeBytes)} · Videos drive` : 'Checked after destination selection',
        duration: formatTime(preflight.duration),
        summary: profile.directory
          ? `${profile.summary} Choose a parent location and Quartic Pulse will create a new named sequence folder inside it.`
          : `${profile.summary} Every frame is completed offline before it is submitted to the ${profile.container} encoder.`,
        warning: warnings.join(' '),
        testDisabled: Boolean(settings.testDisabled)
      });
    }

    function encoderCapabilitiesView(report = {}) {
      const gpuNames = (report.gpuDevices || []).map((device) => device.name).filter(Boolean);
      const selectedId = report.selected?.id;
      return Object.freeze({
        devicesText: gpuNames.length ? `Detected: ${gpuNames.join(' · ')}` : 'Detected: no named GPU devices',
        decisionText: report.selected ? `Automatic selected ${report.selected.label}. ${report.decision || ''}`.trim() : (report.decision || ''),
        encoders: (report.encoders || []).map((encoder) => Object.freeze({
          label: encoder.label,
          details: `${encoder.codec} · ${encoder.hardware ? 'GPU' : 'CPU'} · ${encoder.probeMilliseconds} ms check`,
          status: encoder.id === selectedId ? 'SELECTED' : encoder.available ? 'AVAILABLE' : 'UNAVAILABLE',
          available: Boolean(encoder.available),
          selected: encoder.id === selectedId
        }))
      });
    }

    function encoderScanRunningView() {
      return Object.freeze({
        message: 'Testing the encoders exposed by this PC and its FFmpeg build…'
      });
    }

    function encoderScanCompletedView(report = {}) {
      return Object.freeze({ capabilities: encoderCapabilitiesView(report) });
    }

    function encoderScanFailedView(error) {
      return Object.freeze({
        message: error?.message || String(error || 'Encoder compatibility scan failed.')
      });
    }

    function encoderScanRestoredView() {
      return Object.freeze({ buttonText: 'SCAN AGAIN' });
    }

    function advisorView(settings = {}) {
      return Object.freeze({
        recommendations: (settings.recommendations || []).map((recommendation) => Object.freeze({
          resolution: `${recommendation.width}x${recommendation.height}`,
          fps: recommendation.fps,
          iterations: recommendation.iterations,
          label: recommendation.goalLabel,
          settings: `${recommendation.width}×${recommendation.height} · ${recommendation.fps} FPS · ${recommendation.iterations} iterations`,
          time: `~${formatTime(recommendation.secondsPerSongMinute)} / song min\nAPPLY`,
          current: `${recommendation.width}x${recommendation.height}` === settings.currentResolution
            && recommendation.fps === settings.currentFps
            && recommendation.iterations === settings.currentIterations
        }))
      });
    }

    function historyView(entries = []) {
      return entries.map((entry) => {
        const profileLabel = profiles.profiles[entry.format]?.container || String(entry.format || '').toUpperCase();
        return Object.freeze({
          id: entry.id,
          name: fileName(entry.outputPath),
          meta: `${String(entry.mode || 'offline').toUpperCase()} · ${entry.width || '?'}×${entry.height || '?'} · ${entry.fps || '?'} FPS${profileLabel ? ` · ${profileLabel}` : ''} · ${planning.formatByteSize(entry.sizeBytes)} · ${entry.encoderLabel || 'encoder unknown'}`
        });
      });
    }

    function recoveryView(entries = []) {
      return entries.map((entry) => {
        const profileName = profiles.profiles[entry.format]?.container || String(entry.format || '').toUpperCase();
        return Object.freeze({
          id: entry.id,
          name: fileName(entry.outputPath),
          recoverable: Boolean(entry.recoverable),
          meta: entry.recoverable
            ? `${entry.width}×${entry.height} · ${entry.fps} FPS${profileName ? ` · ${profileName}` : ''} · ${entry.encodedFrames || 0} saved frames · ${planning.formatByteSize(entry.tempBytes)}`
            : `${profileName || 'Compressed master'} was interrupted before its container closed · discard and re-export`
        });
      });
    }

    function recoveryPreparingView() {
      return Object.freeze({
        panelText: 'Recovering interrupted export | overall 0%',
        stageText: 'Inspecting saved frames…',
        note: 'Quartic Pulse is validating the saved master and finishing the interrupted video.'
      });
    }

    function recoveryCompletedView() {
      return Object.freeze({ note: 'The recovered video has been saved successfully.' });
    }

    function recoveryFailedView(error) {
      const message = error?.message || String(error || 'Unknown recovery error');
      return Object.freeze({
        panelText: 'Recovery failed',
        stageText: 'Interrupted export was not completed',
        note: message
      });
    }

    function formatFps(value, approximate = false) {
      const fps = Math.max(0, Number(value) || 0);
      return `${approximate ? '~' : ''}${fps.toFixed(fps >= 10 ? 1 : 2)} FPS`;
    }

    function benchmarkRunningView(settings = {}) {
      return Object.freeze({
        summary: `Testing ${settings.width}×${settings.height} at ${settings.fps} FPS through the selected encoder…`
      });
    }

    function benchmarkSkippedView(settings = {}) {
      return Object.freeze({
        encoderFps: 'NOT TESTED',
        renderFps: formatFps(settings.renderFps, true),
        bottleneck: 'CPU AV1',
        minuteTime: 'UNKNOWN',
        summary: settings.result?.warning || 'This encoder benchmark was skipped.',
        note: 'Select Automatic GPU Master to benchmark a practical hardware or CPU HEVC path.'
      });
    }

    function benchmarkCompletedView(settings = {}) {
      const benchmark = settings.benchmark;
      const result = settings.result;
      if (!benchmark || !result) throw new TypeError('Completed benchmark presentation requires benchmark results.');
      return Object.freeze({
        encoderFps: formatFps(benchmark.encoderFps),
        renderFps: formatFps(settings.renderFps, true),
        bottleneck: benchmark.bottleneck,
        minuteTime: `~${formatTime(benchmark.secondsPerSongMinute)}`,
        summary: `${benchmark.rating} · about ${benchmark.completedFps.toFixed(benchmark.completedFps >= 10 ? 1 : 2)} completed FPS using ${result.encoder.label}.`,
        note: `Estimated from a real ${result.frameCount}-frame encoder test plus the current ${settings.visualKind || 'visual shader'} workload. A five-minute song is approximately ${formatTime(benchmark.secondsPerSongMinute * 5)} at unchanged settings.`
      });
    }

    function benchmarkFailedView(error) {
      return Object.freeze({
        encoderFps: 'FAILED',
        summary: error?.message || String(error || 'Export benchmark failed.')
      });
    }

    function selfTest() {
      const profile = profiles.profiles[profiles.normalizeProfileId('mp4_compatible')];
      const estimate = {
        profile,
        width: 1920,
        height: 1080,
        fps: 60,
        duration: 60,
        colorDescription: '8-bit 4:2:0 BT.709',
        bitrate: { minimum: 10000000, maximum: 20000000 },
        size: { minimum: 100000000, maximum: 200000000 },
        loadLevel: 'normal'
      };
      const performance = performanceView({ estimate, iterations: 600, samplingSamples: 2, supersampling: true });
      const preflight = preflightView({
        preflight: {
          profile,
          encoder: { label: 'Smoke Encoder', hardware: true },
          width: 1920,
          height: 1080,
          fps: 60,
          iterations: 600,
          duration: 5,
          estimatedBitrate: estimate.bitrate,
          estimatedSize: estimate.size,
          requiredBytes: 300000000,
          freeBytes: 200000000,
          samplingSamples: 2,
          supersampling: true
        },
        hdrOutput: false,
        testDisabled: false
      });
      const capabilities = encoderCapabilitiesView({
        gpuDevices: [{ name: 'Smoke GPU' }],
        selected: { id: 'gpu', label: 'GPU Encoder' },
        encoders: [{ id: 'gpu', label: 'GPU Encoder', codec: 'H.265', hardware: true, available: true, probeMilliseconds: 8 }]
      });
      const history = historyView([{ id: 'one', outputPath: 'C:/Exports/test.mp4', format: 'mp4_compatible', width: 1920, height: 1080, fps: 60, sizeBytes: 1048576 }]);
      const benchmark = {
        encoderFps: 80,
        completedFps: 50,
        bottleneck: 'FRACTAL GPU',
        secondsPerSongMinute: 72,
        rating: 'Fast offline'
      };
      return performance.message.includes('600 math iterations')
        && performance.message.includes('Balanced Clarity · 2× sampling')
        && preflight.warning.includes('not have enough space')
        && preflight.video.includes('1920×1080')
        && encoderStatusView({ encoder: { label: 'Smoke Encoder', hardware: true }, profile }).ready
        && encoderCheckingView().title === 'CHECKING QUALITY PIPELINE'
        && encoderFailureView(new Error('failure')).detail === 'failure'
        && capabilities.encoders[0].selected
        && encoderScanRunningView().message.includes('FFmpeg')
        && encoderScanCompletedView({ selected: { id: 'gpu' }, encoders: [{ id: 'gpu', available: true }] }).capabilities.encoders[0].selected
        && encoderScanFailedView(new Error('scan failure')).message === 'scan failure'
        && encoderScanRestoredView().buttonText === 'SCAN AGAIN'
        && benchmarkRunningView({ width: 1920, height: 1080, fps: 60 }).summary.includes('1920×1080')
        && benchmarkSkippedView({ renderFps: 42, result: { warning: 'skip' } }).encoderFps === 'NOT TESTED'
        && benchmarkCompletedView({ benchmark, result: { encoder: { label: 'Smoke' }, frameCount: 12 }, renderFps: 50, visualKind: 'fractal iteration' }).summary.includes('Smoke')
        && benchmarkFailedView(new Error('failure')).encoderFps === 'FAILED'
        && advisorView({ recommendations: [], currentResolution: '', currentFps: 60, currentIterations: 600 }).recommendations.length === 0
        && history[0].name === 'test.mp4'
        && recoveryView([{ id: 'r', outputPath: 'C:/r.mkv', format: 'ffv1', recoverable: false }])[0].meta.includes('discard')
        && recoveryPreparingView().stageText.includes('Inspecting')
        && recoveryCompletedView().note.includes('saved')
        && recoveryFailedView(new Error('recovery failure')).note === 'recovery failure';
    }

    return Object.freeze({
      performanceView,
      encoderStatusView,
      encoderCheckingView,
      encoderFailureView,
      preflightView,
      encoderCapabilitiesView,
      encoderScanRunningView,
      encoderScanCompletedView,
      encoderScanFailedView,
      encoderScanRestoredView,
      advisorView,
      historyView,
      recoveryView,
      recoveryPreparingView,
      recoveryCompletedView,
      recoveryFailedView,
      benchmarkRunningView,
      benchmarkSkippedView,
      benchmarkCompletedView,
      benchmarkFailedView,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportPresentationEngine = Object.freeze({ create });
})();
