const { app, BrowserWindow, desktopCapturer, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, spawn } = require('child_process');
const crypto = require('crypto');
const dgram = require('dgram');
const { pipeline } = require('stream/promises');

const exportSessions = new Map();
const outputCaptureProcesses = new Map();
let cachedWindowsOutputDevices = [];
let mainWindow = null;
let obsOutputWindow = null;
let oscSocket = null;
let oscOwnerId = null;
let cachedExportEncoder = null;
let lastReportSubmitTime = 0;
const reportProjectUrl = 'https://github.com/xSTORMYxSHM/Quartic-Pulse';
const reportIncidentLimit = 20;

function reportDirectory() {
  try { return path.join(app.getPath('userData'), 'reports'); }
  catch (_) { return path.join(os.tmpdir(), 'quartic-pulse-reports'); }
}

function sanitizeReportText(value, maximum = 12000) {
  let text = String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  const replacements = [
    [os.homedir(), '[USER_HOME]'],
    [os.tmpdir(), '[TEMP]']
  ];
  try { replacements.push([app.getPath('userData'), '[APP_DATA]']); } catch (_) { /* App may not be ready. */ }
  for (const [source, replacement] of replacements) {
    if (source) text = text.split(source).join(replacement).split(source.replace(/\\/g, '/')).join(replacement);
  }
  text = text
    .replace(/https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+/gi, '[REDACTED_DISCORD_WEBHOOK]')
    .replace(/([?&](?:token|key|secret|password)=)[^&\s]+/gi, '$1[REDACTED]');
  return text.slice(0, maximum);
}

function serializeIncident(source, error, details = {}) {
  const message = error instanceof Error ? error.message : (error?.message || error || 'Unknown error');
  const stack = error instanceof Error ? error.stack : error?.stack;
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    source: sanitizeReportText(source, 80),
    message: sanitizeReportText(message, 1200),
    stack: sanitizeReportText(stack || '', 8000),
    details: sanitizeReportText(JSON.stringify(details || {}), 4000)
  };
}

function readReportIncidents() {
  try {
    const stored = JSON.parse(fs.readFileSync(path.join(reportDirectory(), 'recent-incidents.json'), 'utf8'));
    return Array.isArray(stored) ? stored.slice(0, reportIncidentLimit) : [];
  } catch (_) { return []; }
}

function recordReportIncident(source, error, details = {}) {
  const incident = serializeIncident(source, error, details);
  try {
    const directory = reportDirectory();
    fs.mkdirSync(directory, { recursive: true });
    const incidents = [incident, ...readReportIncidents()].slice(0, reportIncidentLimit);
    const temporaryPath = path.join(directory, `recent-incidents-${process.pid}.tmp`);
    fs.writeFileSync(temporaryPath, JSON.stringify(incidents, null, 2), 'utf8');
    fs.renameSync(temporaryPath, path.join(directory, 'recent-incidents.json'));
  } catch (writeError) { console.error('Could not persist diagnostic incident:', writeError); }
  return incident;
}

function clearReportIncidents() {
  try { fs.unlinkSync(path.join(reportDirectory(), 'recent-incidents.json')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return true;
}

function safeRendererDiagnostics(snapshot = {}) {
  const allowed = ['visualStyle', 'fractalType', 'audioMode', 'exporting', 'exportMode', 'resolution', 'fps', 'performanceMode', 'unleashed', 'adaptiveQuality', 'interfaceMode', 'webglRenderer'];
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(snapshot, key)).map((key) => [key, sanitizeReportText(snapshot[key], 240)]));
}

function reportingConfiguration() {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'assets', 'reporting-config.json'), 'utf8'));
    const relayUrl = new URL(String(config.relayUrl || ''));
    const host = relayUrl.hostname.toLowerCase();
    if (relayUrl.protocol !== 'https:' || host === 'discord.com' || host.endsWith('.discord.com') || host === 'discordapp.com' || host.endsWith('.discordapp.com')) return { enabled: false };
    return { enabled: true, relayUrl: relayUrl.href, project: sanitizeReportText(config.project || 'quartic-pulse', 80) };
  } catch (_) { return { enabled: false }; }
}

function reportPrintHtml(reportText) {
  const escaped = sanitizeReportText(reportText, 60000).replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Quartic Pulse Report</title><style>body{margin:32px;color:#111;font:12px/1.5 Consolas,monospace}h1{font:700 20px/1.2 Segoe UI,sans-serif}pre{white-space:pre-wrap;word-break:break-word}</style></head><body><h1>Quartic Pulse Diagnostic Report</h1><pre>${escaped}</pre></body></html>`;
}

process.on('unhandledRejection', (reason) => recordReportIncident('main-unhandled-rejection', reason));
process.on('uncaughtExceptionMonitor', (error, origin) => recordReportIncident('main-uncaught-exception', error, { origin }));

function readOscString(buffer, start = 0) {
  const end = buffer.indexOf(0, start);
  if (end < 0) throw new Error('Invalid OSC string.');
  return { value: buffer.toString('utf8', start, end), next: Math.ceil((end + 1) / 4) * 4 };
}

function parseOscPacket(buffer) {
  const addressPart = readOscString(buffer, 0);
  if (!addressPart.value.startsWith('/') || addressPart.value === '#bundle') return null;
  const typePart = readOscString(buffer, addressPart.next);
  if (!typePart.value.startsWith(',')) return { address: addressPart.value, args: [] };
  let offset = typePart.next;
  const args = [];
  for (const type of typePart.value.slice(1)) {
    if (type === 'i' && offset + 4 <= buffer.length) {
      args.push(buffer.readInt32BE(offset));
      offset += 4;
    } else if (type === 'f' && offset + 4 <= buffer.length) {
      args.push(buffer.readFloatBE(offset));
      offset += 4;
    } else if (type === 's') {
      const stringPart = readOscString(buffer, offset);
      args.push(stringPart.value);
      offset = stringPart.next;
    } else if (type === 'T') args.push(true);
    else if (type === 'F') args.push(false);
    else if (type === 'N') args.push(null);
    else return null;
  }
  return { address: addressPart.value, args };
}

function stopOscServer() {
  if (!oscSocket) return false;
  const socket = oscSocket;
  oscSocket = null;
  oscOwnerId = null;
  try { socket.close(); } catch (_) { /* Already closed. */ }
  return true;
}

function startOscServer(sender, options = {}) {
  stopOscServer();
  const port = Math.max(1, Math.min(65535, Math.round(Number(options.port) || 9000)));
  const host = options.allowLan ? '0.0.0.0' : '127.0.0.1';
  const socket = dgram.createSocket('udp4');
  oscSocket = socket;
  oscOwnerId = sender.id;
  socket.on('message', (packet, remote) => {
    if (oscSocket !== socket || sender.isDestroyed()) return;
    try {
      const message = parseOscPacket(packet);
      if (message) sender.send('controls:osc-message', { ...message, remote: remote.address });
    } catch (_) { /* Ignore malformed or unsupported OSC packets. */ }
  });
  socket.on('error', (error) => {
    if (!sender.isDestroyed()) sender.send('controls:osc-error', error.message);
    if (oscSocket === socket) stopOscServer();
  });
  sender.once('destroyed', () => {
    if (oscOwnerId === sender.id) stopOscServer();
  });
  return new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.bind(port, host, () => {
      socket.removeListener('error', reject);
      resolve({ port, host });
    });
  });
}

function sendObsOutputStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('obs:output-status', Boolean(obsOutputWindow && !obsOutputWindow.isDestroyed()));
  }
}

function sanitizeObsOutputOptions(options = {}) {
  const allowedSizes = new Map([
    ['1280x720', [1280, 720]],
    ['1920x1080', [1920, 1080]],
    ['2560x1440', [2560, 1440]],
    ['3840x2160', [3840, 2160]]
  ]);
  const requestedSize = String(options.resolution || '1920x1080');
  const [width, height] = allowedSizes.get(requestedSize) || allowedSizes.get('1920x1080');
  return {
    width,
    height,
    fps: Number(options.fps) === 30 ? 30 : 60,
    alwaysOnTop: Boolean(options.alwaysOnTop)
  };
}

function openObsOutput(options = {}) {
  const settings = sanitizeObsOutputOptions(options);
  if (obsOutputWindow && !obsOutputWindow.isDestroyed()) {
    obsOutputWindow.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
    obsOutputWindow.setContentSize(settings.width, settings.height, true);
    obsOutputWindow.showInactive();
    obsOutputWindow.webContents.send('obs:output-settings', settings);
    sendObsOutputStatus();
    return settings;
  }

  obsOutputWindow = new BrowserWindow({
    width: settings.width,
    height: settings.height,
    useContentSize: true,
    minWidth: 640,
    minHeight: 360,
    frame: false,
    movable: true,
    resizable: true,
    backgroundColor: '#05060a',
    title: 'Quartic Pulse — OBS Output',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  obsOutputWindow.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
  obsOutputWindow.setAspectRatio(settings.width / settings.height);
  obsOutputWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), {
    query: { obs: '1', fps: String(settings.fps) }
  });
  obsOutputWindow.once('ready-to-show', () => {
    if (!obsOutputWindow || obsOutputWindow.isDestroyed()) return;
    obsOutputWindow.center();
    obsOutputWindow.showInactive();
    sendObsOutputStatus();
  });
  obsOutputWindow.on('closed', () => {
    obsOutputWindow = null;
    sendObsOutputStatus();
  });
  return settings;
}

function audioCaptureExecutable() {
  const relativePath = path.join('assets', 'windows-audio', 'QuarticPulse.AudioCapture.exe');
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', relativePath)
    : path.join(__dirname, '..', '..', relativePath);
}

function advancedOutputCapabilities() {
  const relativePath = path.join('assets', 'spout', 'QuarticPulse.SpoutSender.exe');
  const senderPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', relativePath)
    : path.join(__dirname, '..', '..', relativePath);
  return {
    windowCapture: true,
    obsWebSocket: true,
    chromaKey: true,
    spout2Sender: fs.existsSync(senderPath),
    spout2RequiresNativeAddon: true
  };
}

function stopOutputCapture(webContentsId) {
  const child = outputCaptureProcesses.get(webContentsId);
  if (!child) return false;
  child.quarticStopped = true;
  child.kill();
  outputCaptureProcesses.delete(webContentsId);
  return true;
}

function listWindowsOutputDevices() {
  return new Promise((resolve, reject) => {
    execFile(audioCaptureExecutable(), ['list'], { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error((stderr || error.message).trim()));
      const devices = String(stdout).split(/\r?\n/).filter(Boolean).map((line) => {
        const [encodedId, encodedName, isDefault] = line.split('|');
        return {
          id: Buffer.from(encodedId, 'base64').toString('utf8'),
          name: Buffer.from(encodedName, 'base64').toString('utf8'),
          isDefault: isDefault === '1'
        };
      });
      if (devices.length) cachedWindowsOutputDevices = devices;
      resolve(devices.length ? devices : cachedWindowsOutputDevices);
    });
  });
}

function createWindow() {
  const smokeTest = process.argv.includes('--smoke-test');
  const smokeStyleArgument = process.argv.find((argument) => argument.startsWith('--smoke-style='));
  const requestedSmokeStyle = Math.max(0, Math.min(6, Number.parseInt(smokeStyleArgument?.split('=')[1] || '0', 10) || 0));
  const smokeTabArgument = process.argv.find((argument) => argument.startsWith('--smoke-tab='));
  const requestedTabValue = smokeTabArgument?.split('=')[1] || 'music';
  const requestedSmokeTab = ['music', 'playlist', 'analysis', 'frequency-color', 'appearance', 'reactivity', 'dimensional', 'folding', 'mapping', 'show', 'composer', 'controls', 'camera', 'tools', 'stream', 'export', 'system', 'reports', 'about'].includes(requestedTabValue) ? requestedTabValue : 'music';
  const smokeSpectrumPresetArgument = process.argv.find((argument) => argument.startsWith('--smoke-spectrum-preset='));
  const requestedSpectrumPresetValue = smokeSpectrumPresetArgument?.split('=')[1] || 'balanced';
  const requestedSpectrumPreset = ['balanced', 'neon', 'mirror', 'dance'].includes(requestedSpectrumPresetValue) ? requestedSpectrumPresetValue : 'balanced';
  const smokeSyntheticAudio = process.argv.includes('--smoke-synthetic-audio');
  const smokeAdaptiveBeat = process.argv.includes('--smoke-adaptive-beat');
  const smokeSongMap = process.argv.includes('--smoke-song-map');
  const smokeObsOutput = process.argv.includes('--smoke-obs-output');
  const smokeDimensional = process.argv.includes('--smoke-dimensional');
  const smokeFolding = process.argv.includes('--smoke-folding');
  const smokeAdvanced = process.argv.includes('--smoke-open-advanced');
  const smokeOutputAudio = process.argv.includes('--smoke-output-audio');
  const smokePanelMax = process.argv.includes('--smoke-panel-max');
  const smokeScrollQuickControls = process.argv.includes('--smoke-scroll-quick-controls');
  const window = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1060,
    minHeight: 680,
    backgroundColor: '#05060a',
    title: 'Quartic Pulse',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: !smokeTest
    }
  });
  mainWindow = window;
  window.on('closed', () => {
    mainWindow = null;
    if (obsOutputWindow && !obsOutputWindow.isDestroyed()) obsOutputWindow.close();
  });
  window.on('unresponsive', () => recordReportIncident('renderer-unresponsive', 'The main Quartic Pulse window stopped responding.'));
  window.webContents.on('render-process-gone', (_event, details) => {
    recordReportIncident('renderer-process-gone', details.reason || 'Renderer process ended.', {
      reason: details.reason,
      exitCode: details.exitCode
    });
  });

  // Chromium cannot request Windows loopback directly. Electron supplies the
  // default Windows output mix when the renderer asks for display media; the
  // renderer immediately discards the required video track.
  window.webContents.session.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      callback(sources[0] ? { video: sources[0], audio: 'loopback' } : {});
    } catch {
      callback({});
    }
  });
  window.webContents.session.setPermissionCheckHandler((_webContents, permission) => ['media', 'midi', 'midiSysex'].includes(permission));
  window.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(['media', 'midi', 'midiSysex'].includes(permission));
  });

  window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), smokeTest ? { query: { smoke: '1' } } : undefined);
  window.once('ready-to-show', () => {
    if (!smokeTest) window.show();
  });

  if (smokeTest) {
    window.webContents.on('did-finish-load', () => {
      if (smokeAdaptiveBeat || smokeObsOutput) {
        window.setPosition(-32000, -32000);
        window.showInactive();
      }
      setTimeout(async () => {
        try {
          const result = await window.webContents.executeJavaScript(`(async () => {
            const mode = document.querySelector('#frequencyBandMode');
            const advancedPanel = document.querySelector('#advancedFrequencyBands');
            const visualStyle = document.querySelector('#visualStyle');
            let frequencyBands = false;
            let visualStyles = false;
            let pulsePresetsReady = false;
            let effectPresetsReady = !['0', '1', '2', '5'].includes('${requestedSmokeStyle}');
            let reportGenerationReady = '${requestedSmokeTab}' !== 'reports';
            const playlistReady = document.querySelectorAll('.settings-tab').length === 5
              && document.querySelectorAll('.music-subtab').length === 4
              && Boolean(document.querySelector('#playlistFilesInput'))
              && Boolean(document.querySelector('#playlistFolderInput'));
            const obsOutputReady = Boolean(document.querySelector('[data-tab-panel="stream"]'))
              && Boolean(document.querySelector('#obsOutputButton'))
              && Boolean(document.querySelector('#obsResolution'))
              && Boolean(document.querySelector('#obsFps'))
              && Boolean(document.querySelector('#obsChromaKey'))
              && Boolean(document.querySelector('#obsChromaThreshold'))
              && typeof window.quarticDesktop?.openObsOutput === 'function';
            const profilesReady = Boolean(document.querySelector('#profileManager'))
              && Boolean(document.querySelector('#savedProfileSelect'))
              && Boolean(document.querySelector('#profileSearch'))
              && Boolean(document.querySelector('#favoriteProfileButton'))
              && Boolean(document.querySelector('#profileName'))
              && Boolean(document.querySelector('#profileKind'))
              && Boolean(document.querySelector('#saveProfileButton'))
              && Boolean(document.querySelector('#applyProfileButton'))
              && Boolean(document.querySelector('#exportProfileButton'))
              && Boolean(document.querySelector('#importProfileInput'))
              && typeof window.quarticDesktop?.exportProfile === 'function';
            const windowsAudioReady = document.querySelector('#audioSourceSelect')?.options.length >= 2
              && document.querySelector('#audioSourceSelect')?.value === 'deck'
              && document.querySelector('#audioOutputOptions')?.children.length > 0
              && Boolean(document.querySelector('#useAudioSourceButton'))
              && Boolean(document.querySelector('#refreshAudioSourcesButton'));
            const windowsOutputCount = document.querySelector('#audioOutputOptions')?.children.length || 0;
            const appearanceNavigationReady = document.querySelectorAll('.appearance-subtab').length === 5
              && Boolean(document.querySelector('[data-tab-panel="dimensional"]'))
              && Boolean(document.querySelector('[data-tab-panel="folding"]'))
              && Boolean(document.querySelector('[data-tab-panel="mapping"]'))
              && [...document.querySelectorAll('[data-tab-panel="dimensional"] details, [data-tab-panel="folding"] details, [data-tab-panel="reactivity"] details')]
                .every((details) => !details.open);
            const modulationMatrixReady = Boolean(document.querySelector('#modulationEnabled'))
              && Boolean(document.querySelector('#modulationRouteList'))
              && Boolean(document.querySelector('#addModulationRoute'))
              && document.querySelectorAll('[data-modulation-preset]').length === 4;
            const showSequencerReady = document.querySelectorAll('.live-subtab').length === 6
              && Boolean(document.querySelector('[data-tab-panel="show"]'))
              && Boolean(document.querySelector('#beatBpm'))
              && Boolean(document.querySelector('#tapTempoButton'))
              && Boolean(document.querySelector('#showSequenceList'))
              && Boolean(document.querySelector('#addShowEntryButton'));
            const showComposerReady = Boolean(document.querySelector('[data-tab-panel="composer"]'))
              && Boolean(document.querySelector('#openShowComposerButton'))
              && Boolean(document.querySelector('#composerPanelBuildButton'))
              && Boolean(document.querySelector('#showComposerWorkspace'))
              && Boolean(document.querySelector('#composerCueTrack'))
              && Boolean(document.querySelector('#composerAutomationLanes'))
              && Boolean(document.querySelector('#composerPlayhead'))
              && Boolean(document.querySelector('#composerApplyCueButton'))
              && Boolean(document.querySelector('#composerSnapButton'));
            const liveControlsReady = Boolean(document.querySelector('[data-tab-panel="controls"]'))
              && Boolean(document.querySelector('#midiLearnButton'))
              && Boolean(document.querySelector('#keyboardCaptureButton'))
              && Boolean(document.querySelector('#oscServerButton'))
              && typeof window.quarticDesktop?.startOsc === 'function';
            const creativeToolsReady = Boolean(document.querySelector('[data-tab-panel="camera"]'))
              && Boolean(document.querySelector('#cameraBookmarkList'))
              && Boolean(document.querySelector('#playCameraPathButton'))
              && Boolean(document.querySelector('[data-tab-panel="tools"]'))
              && Boolean(document.querySelector('#randomizerUndoButton'))
              && Boolean(document.querySelector('#captureScreenshotButton'))
              && Boolean(document.querySelector('#nowPlayingEnabled'))
              && typeof window.quarticDesktop?.saveScreenshot === 'function';
            const performanceAssistantReady = Boolean(document.querySelector('#performanceAssistantStatus'))
              && Boolean(document.querySelector('#analyzePerformanceButton'))
              && Boolean(document.querySelector('#applyPerformanceButton'))
              && Boolean(document.querySelector('#hardwareSummary'))
              && Boolean(document.querySelector('#performanceMode'))
              && Boolean(document.querySelector('#unleashedMode'))
              && typeof window.quarticDesktop?.getHardwareInfo === 'function';
            const reportCenterReady = Boolean(document.querySelector('[data-tab-panel="reports"]'))
              && Boolean(document.querySelector('#reportCategory'))
              && Boolean(document.querySelector('#reportSummary'))
              && Boolean(document.querySelector('#reportOutput'))
              && Boolean(document.querySelector('#copyReportButton'))
              && Boolean(document.querySelector('#saveReportButton'))
              && Boolean(document.querySelector('#printReportButton'))
              && Boolean(document.querySelector('#githubReportButton'))
              && Boolean(document.querySelector('#submitReportButton'))
              && typeof window.quarticDesktop?.getReportDiagnostics === 'function'
              && typeof window.quarticDesktop?.saveReport === 'function'
              && typeof window.quarticDesktop?.printReport === 'function';
            const performanceAutomationStandbyReady = document.querySelector('#showStatus')?.textContent === 'STOPPED'
              && !document.querySelector('#songDirectorEnabled')?.checked;
            let offlineEncoderQualityReady = false;
            try {
              const qualitySupport = await VideoEncoder.isConfigSupported({
                codec: 'vp09.00.10.08', width: 1920, height: 1080, framerate: 60,
                bitrate: 89579520, bitrateMode: 'variable', latencyMode: 'quality',
                hardwareAcceleration: 'prefer-software'
              });
              offlineEncoderQualityReady = Boolean(qualitySupport.supported)
                && Number(qualitySupport.config?.bitrate || 0) >= 80000000;
            } catch (_) { /* Report the quality path as unavailable. */ }
            const offlineExportReady = Boolean(document.querySelector('#exportMode option[value="offline"]'))
              && Boolean(document.querySelector('#exportMode option[value="live"]'))
              && Boolean(document.querySelector('#unleashedExportDetail'))
              && typeof window.quarticDesktop?.getPathForFile === 'function'
              && typeof window.quarticDesktop?.beginOfflineExport === 'function'
              && typeof window.quarticDesktop?.appendOfflineFrame === 'function'
              && typeof window.quarticDesktop?.finishOfflineExport === 'function'
              && typeof window.quarticDesktop?.getExportPreflight === 'function'
              && typeof window.quarticDesktop?.onExportProgress === 'function'
              && Boolean(document.querySelector('#exportProgressFill'))
              && Boolean(document.querySelector('#exportProgressText'))
              && Boolean(document.querySelector('#exportCompleteSound'))
              && document.querySelector('#exportCompleteStinger')?.getAttribute('src')?.endsWith('export-complete-stinger.wav')
              && Boolean(document.querySelector('#endExportButton'))
              && Boolean(document.querySelector('#cancelExportButton'))
              && Boolean(document.querySelector('#pauseExportButton'))
              && Boolean(document.querySelector('#exportPreflightDialog'))
              && Boolean(document.querySelector('#preflightTestButton'))
              && Boolean(document.querySelector('#exportEncoderStatus'))
              && offlineEncoderQualityReady;
            const exportQolReady = Boolean(document.querySelector('#exportHistoryList'))
              && Boolean(document.querySelector('#exportRecoveryList'))
              && Boolean(document.querySelector('#stageRenderMeta'))
              && Boolean(document.querySelector('#fractalSearch'))
              && Boolean(document.querySelector('#favoriteFractalButton'))
              && Boolean(document.querySelector('#visualIntensityCard'))
              && typeof window.quarticDesktop?.getRecoverableExports === 'function'
              && typeof window.quarticDesktop?.recoverExport === 'function'
              && typeof window.quarticDesktop?.readSessionAudioFile === 'function'
              && typeof window.quarticDesktop?.openExport === 'function';
            const obsAutomationReady = Boolean(document.querySelector('#obsConnectButton'))
              && Boolean(document.querySelector('#obsSceneSelect'))
              && Boolean(document.querySelector('#obsProfileSelect'))
              && Boolean(document.querySelector('#checkAdvancedOutputButton'))
              && typeof window.quarticDesktop?.getOutputCapabilities === 'function';
            const coreEquationReady = ['coreCStrength', 'coreBiasReal', 'coreBiasImag']
              .every((id) => Boolean(document.querySelector('#' + id)))
              && document.querySelector('#coreCStrength')?.value === '0.5'
              && document.querySelector('#coreBiasReal')?.value === '0'
              && document.querySelector('#coreBiasImag')?.value === '0';
            const normalizedPositiveIds = [
              'frequencyColorAmount', 'analysisSmoothing', 'flow', 'reactivity', 'motion', 'coreCStrength',
              'fractalTilt', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth',
              'equationFold', 'equationWarp', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio',
              'barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid',
              'radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere',
              'pulseDensity', 'pulseSize', 'pulseCooldown', 'pulseJagged', 'pulseTrail', 'pulseDetail',
              'bulbDetail', 'bulbAudio', 'bulbFold', 'bulbGlow', 'bulbCamera', 'equationMod', 'beatSensitivity'
            ];
            const normalizedDirectionIds = ['coreBiasReal', 'coreBiasImag', 'fractalDepthSpeed', 'equationFoldMotion', 'bulbOrbit', 'spin'];
            const numericFieldFor = (id) => document.querySelector('#' + id)?.closest('.slider-group')?.querySelector('.numeric-value-input');
            const percentageScaleFailures = normalizedPositiveIds.filter((id) => {
              const input = numericFieldFor(id);
              return input?.min !== '0' || input?.max !== '100';
            }).concat(normalizedDirectionIds.filter((id) => {
              const input = numericFieldFor(id);
              return input?.min !== '-50' || input?.max !== '50';
            }));
            const percentageScalesReady = normalizedPositiveIds.every((id) => {
              const input = numericFieldFor(id);
              return input?.min === '0' && input?.max === '100';
            }) && normalizedDirectionIds.every((id) => {
              const input = numericFieldFor(id);
              return input?.min === '-50' && input?.max === '50';
            });
            const coreStrengthInput = numericFieldFor('coreCStrength');
            const coreRealInput = numericFieldFor('coreBiasReal');
            coreStrengthInput.value = '75';
            coreStrengthInput.dispatchEvent(new Event('change', { bubbles: true }));
            coreRealInput.value = '-25';
            coreRealInput.dispatchEvent(new Event('change', { bubbles: true }));
            const coreEquationInputReady = document.querySelector('#coreCStrength')?.value === '0.75'
              && document.querySelector('#coreBiasReal')?.value === '-0.25'
              && document.querySelector('#coreCStrengthValue')?.value === '75%'
              && document.querySelector('#coreBiasRealValue')?.value === '-25%';
            coreStrengthInput.value = '50';
            coreStrengthInput.dispatchEvent(new Event('change', { bubbles: true }));
            coreRealInput.value = '0';
            coreRealInput.dispatchEvent(new Event('change', { bubbles: true }));
            const pulseControls = Boolean(document.querySelector('#pulseDensity'))
              && Boolean(document.querySelector('#pulseSize'))
              && Boolean(document.querySelector('#pulseCooldown'))
              && Boolean(document.querySelector('#pulseJagged'))
              && Boolean(document.querySelector('#pulseTrail'))
              && Boolean(document.querySelector('#pulseDetail'))
              && document.querySelectorAll('.pulse-preset').length === 4;
            const customColorRolesReady = [...document.querySelectorAll('.color-stop-name')]
              .map((label) => label.textContent.trim())
              .join('|') === 'SHADOW COLOR|FIELD COLOR|ACCENT COLOR|DETAIL COLOR';
            const beatDetectorControls = Boolean(document.querySelector('#beatSensitivity'))
              && Boolean(document.querySelector('#beatCooldown'))
              && numericFieldFor('beatSensitivity')?.min === '0'
              && numericFieldFor('beatSensitivity')?.max === '100'
              && numericFieldFor('beatCooldown')?.min === '80'
              && numericFieldFor('beatCooldown')?.max === '300';
            const fractalEffectIds = ['fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth'];
            const foldEffectIds = ['equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio'];
            const spectrumEffectIds = ['barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid'];
            const radialEffectIds = ['radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere'];
            const bulbEffectIds = ['bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera'];
            const bulbControls = bulbEffectIds.every((id) => Boolean(document.querySelector('#' + id)))
              && document.querySelectorAll('#bulbPresetGrid .visual-preset').length === 4;
            const visualEffectControls = [...fractalEffectIds, ...foldEffectIds, ...spectrumEffectIds, ...radialEffectIds, ...bulbEffectIds]
              .every((id) => Boolean(document.querySelector('#' + id)))
              && Boolean(document.querySelector('#fractalDimensional'))
              && Boolean(document.querySelector('#equationFolding'))
              && document.querySelectorAll('.visual-preset').length === 20;
            if (mode && advancedPanel) {
              mode.value = 'advanced';
              mode.dispatchEvent(new Event('change', { bubbles: true }));
              const advancedOpened = !advancedPanel.hidden;
              mode.value = 'basic';
              mode.dispatchEvent(new Event('change', { bubbles: true }));
              frequencyBands = advancedOpened && advancedPanel.hidden;
            }
            if (visualStyle && visualStyle.options.length === 7) {
              for (const value of ['1', '2', '3', '4', '5', '6']) {
                visualStyle.value = value;
                visualStyle.dispatchEvent(new Event('change', { bubbles: true }));
              }
              visualStyles = visualStyle.value === '6';
              visualStyle.value = '${requestedSmokeStyle}';
              visualStyle.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if ('${requestedSmokeStyle}' === '3' && pulseControls) {
              document.querySelector('[data-pulse-preset="rapid"]')?.click();
              document.querySelector('[data-pulse-preset="balanced"]')?.click();
              pulsePresetsReady = document.querySelector('[data-pulse-preset="balanced"]')?.classList.contains('active')
                && document.querySelector('#pulseDensity')?.value === '0.75'
                && document.querySelector('#pulseSize')?.value === '1'
                && document.querySelector('#pulseCooldown')?.value === '1';
              const pulseSmokeValues = { pulseDensity: '.75', pulseSize: '1', pulseCooldown: '1', pulseJagged: '1', pulseTrail: '.90', pulseDetail: '1.25' };
              for (const [id, value] of Object.entries(pulseSmokeValues)) {
                const control = document.querySelector('#' + id);
                control.value = value;
                control.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
            if ('${requestedSmokeStyle}' === '1' && visualEffectControls) {
              document.querySelector('#spectrumPresetGrid [data-effect-preset="dance"]')?.click();
              document.querySelector('#spectrumPresetGrid [data-effect-preset="balanced"]')?.click();
              effectPresetsReady = document.querySelector('#spectrumPresetGrid [data-effect-preset="balanced"]')?.classList.contains('active')
                && document.querySelector('#barWidth')?.value === '1'
                && document.querySelector('#barGlow')?.value === '1.15'
                && document.querySelector('#barStyle')?.value === '0';
              document.querySelector('#spectrumPresetGrid [data-effect-preset="${requestedSpectrumPreset}"]')?.click();
            }
            if ('${requestedSmokeStyle}' === '0' && visualEffectControls) {
              const dimensionalToggle = document.querySelector('#fractalDimensional');
              const dimensionalDefaultOff = !dimensionalToggle.checked && document.querySelector('#fractalDepthControls')?.inert;
              dimensionalToggle.checked = true;
              dimensionalToggle.dispatchEvent(new Event('change', { bubbles: true }));
              document.querySelector('#fractalPresetGrid [data-effect-preset="deep"]')?.click();
              document.querySelector('#fractalPresetGrid [data-effect-preset="dimensional"]')?.click();
              const dimensionalPresetWorks = document.querySelector('#fractalPresetGrid [data-effect-preset="dimensional"]')?.classList.contains('active')
                && document.querySelector('#fractalTilt')?.value === '0.45'
                && document.querySelector('#fractalPerspective')?.value === '0.45';
              dimensionalToggle.checked = false;
              dimensionalToggle.dispatchEvent(new Event('change', { bubbles: true }));
              const dimensionalReady = dimensionalDefaultOff && dimensionalPresetWorks
                && !dimensionalToggle.checked && document.querySelector('#fractalDepthControls')?.inert;

              const equationFoldingToggle = document.querySelector('#equationFolding');
              const foldingDefaultOff = !equationFoldingToggle.checked && document.querySelector('#equationFoldControls')?.inert;
              equationFoldingToggle.checked = true;
              equationFoldingToggle.dispatchEvent(new Event('change', { bubbles: true }));
              document.querySelector('#equationFoldPresetGrid [data-effect-preset="kaleidoscope"]')?.click();
              document.querySelector('#equationFoldPresetGrid [data-effect-preset="soft"]')?.click();
              const foldingPresetWorks = document.querySelector('#equationFoldPresetGrid [data-effect-preset="soft"]')?.classList.contains('active')
                && document.querySelector('#equationFold')?.value === '0.18'
                && document.querySelector('#equationWarp')?.value === '0.12';
              equationFoldingToggle.checked = false;
              equationFoldingToggle.dispatchEvent(new Event('change', { bubbles: true }));
              const foldingReady = foldingDefaultOff && foldingPresetWorks
                && !equationFoldingToggle.checked && document.querySelector('#equationFoldControls')?.inert;
              effectPresetsReady = dimensionalReady && foldingReady;
              if (${smokeDimensional}) {
                dimensionalToggle.checked = true;
                dimensionalToggle.dispatchEvent(new Event('change', { bubbles: true }));
                document.querySelector('#fractalPresetGrid [data-effect-preset="dimensional"]')?.click();
              }
              if (${smokeFolding}) {
                equationFoldingToggle.checked = true;
                equationFoldingToggle.dispatchEvent(new Event('change', { bubbles: true }));
                document.querySelector('#equationFoldPresetGrid [data-effect-preset="soft"]')?.click();
                if (${process.argv.includes('--smoke-fold-low')}) {
                  const lowFoldValues = { equationFold: '.01', equationWarp: '0', equationFoldMotion: '0', equationFoldOffset: '0', equationWarpScale: '0', equationFoldAudio: '.25' };
                  for (const [id, value] of Object.entries(lowFoldValues)) {
                    const control = document.querySelector('#' + id);
                    control.value = value;
                    control.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }
              }
            }
            if ('${requestedSmokeStyle}' === '2' && visualEffectControls) {
              document.querySelector('#radialPresetGrid [data-effect-preset="orbit"]')?.click();
              document.querySelector('#radialPresetGrid [data-effect-preset="balanced"]')?.click();
              effectPresetsReady = document.querySelector('#radialPresetGrid [data-effect-preset="balanced"]')?.classList.contains('active')
                && document.querySelector('#radialSize')?.value === '1'
                && document.querySelector('#radialGlow')?.value === '1';
            }
            if ('${requestedSmokeStyle}' === '5' && bulbControls) {
              document.querySelector('#bulbPresetGrid [data-effect-preset="storm"]')?.click();
              document.querySelector('#bulbPresetGrid [data-effect-preset="quartic"]')?.click();
              effectPresetsReady = document.querySelector('#bulbPresetGrid [data-effect-preset="quartic"]')?.classList.contains('active')
                && document.querySelector('#bulbPower')?.value === '4'
                && document.querySelector('#bulbDetail')?.value === '0.55'
                && document.querySelector('#bulbCamera')?.value === '3.75';
            }
            const requestedMusicSubtab = document.querySelector('.music-subtab[data-music-tab="${requestedSmokeTab}"]');
            const requestedAppearanceSubtab = document.querySelector('.appearance-subtab[data-appearance-tab="${requestedSmokeTab}"]');
            const requestedLiveSubtab = document.querySelector('.live-subtab[data-live-tab="${requestedSmokeTab}"]');
            const requestedSystemSubtab = document.querySelector('.system-subtab[data-system-tab="${requestedSmokeTab}"]');
            if (requestedMusicSubtab) requestedMusicSubtab.click();
            else if (requestedAppearanceSubtab) requestedAppearanceSubtab.click();
            else if (requestedLiveSubtab) requestedLiveSubtab.click();
            else if (requestedSystemSubtab) requestedSystemSubtab.click();
            else document.querySelector('.settings-tab[data-tab="${requestedSmokeTab}"]')?.click();
            if ('${requestedSmokeTab}' === 'reports') {
              document.querySelector('#reportSummary').value = 'Smoke-test report';
              document.querySelector('#reportActual').value = 'Test secret https://discord.com' + '/api/webhooks/123456/example-token';
              document.querySelector('#generateReportButton')?.click();
              for (let attempt = 0; attempt < 30; attempt++) {
                if (document.querySelector('#reportOutput')?.value) break;
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
              const generatedReport = document.querySelector('#reportOutput')?.value || '';
              reportGenerationReady = generatedReport.includes('# Quartic Pulse Report')
                && generatedReport.includes('Smoke-test report')
                && generatedReport.includes('[REDACTED_DISCORD_WEBHOOK]')
                && !generatedReport.includes('/api/webhooks/');
            }
            if (${process.argv.includes('--smoke-composer-workspace')}) document.querySelector('#openShowComposerButton')?.click();
            if (${smokeAdvanced}) document.querySelector('.tab-panel.active details')?.setAttribute('open', '');
            if (${process.argv.includes('--smoke-basic')}) document.querySelector('.interface-mode-switch [data-interface-mode="basic"]')?.click();
            if (${process.argv.includes('--smoke-interface-advanced')}) document.querySelector('.interface-mode-switch [data-interface-mode="advanced"]')?.click();
            if (${process.argv.includes('--smoke-hide-safety')}) document.querySelector('#visualSafetyDialog')?.setAttribute('hidden', '');
            if (${smokePanelMax}) document.querySelector('#panelResizer')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
            if (${smokeScrollQuickControls}) document.querySelector('.quick-controls-card')?.scrollIntoView({ block: 'center' });
            if (${process.argv.includes('--smoke-scroll-unleashed')}) document.querySelector('.unleashed-settings')?.scrollIntoView({ block: 'center' });
            if (${process.argv.includes('--smoke-scroll-bulb')}) document.querySelector('[data-visual-options="5"]')?.scrollIntoView({ block: 'start' });
            if (${process.argv.includes('--smoke-scroll-song-map')}) document.querySelector('#songMapCard')?.scrollIntoView({ block: 'start' });
            if (${process.argv.includes('--smoke-scroll-performance-package')}) document.querySelector('.performance-package-card')?.scrollIntoView({ block: 'start' });
            const performanceHardwareModeBefore = document.querySelector('#performanceMode')?.value;
            let performanceBlackoutReady = !${process.argv.includes('--smoke-performance-mode')};
            if (${process.argv.includes('--smoke-performance-mode')}) {
              const fullscreen = document.querySelector('#performanceFullscreen');
              fullscreen.checked = false;
              document.querySelector('#enterPerformanceModeButton')?.click();
              document.querySelector('#performanceBlackoutButton')?.click();
              performanceBlackoutReady = document.body.classList.contains('performance-blackout')
                && document.querySelector('#performanceBlackoutButton')?.textContent === 'RESTORE';
              document.querySelector('#performanceBlackoutButton')?.click();
            }
            const activeTopTab = document.querySelector('.settings-tab.active')?.dataset.tab || '';
            const activeMusicTab = document.querySelector('.music-subtab.active')?.dataset.musicTab || '';
            const activeAppearanceTab = document.querySelector('.appearance-subtab.active')?.dataset.appearanceTab || '';
            const activeLiveTab = document.querySelector('.live-subtab.active')?.dataset.liveTab || '';
            const activeSystemTab = document.querySelector('.system-subtab.active')?.dataset.systemTab || '';
            let outputCaptureReady = !${smokeOutputAudio};
            if (${smokeOutputAudio}) {
              const outputOption = document.querySelector('#audioOutputOptions option');
              if (outputOption) {
                const sourceSelect = document.querySelector('#audioSourceSelect');
                sourceSelect.value = outputOption.value;
                sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
                document.querySelector('#useAudioSourceButton')?.click();
                await new Promise((resolve) => setTimeout(resolve, 800));
                outputCaptureReady = document.body.classList.contains('live-input')
                  && document.querySelector('#audioSourceStatus')?.textContent === 'WASAPI LIVE';
                document.querySelector('#useAudioSourceButton')?.click();
              }
            }
            const audioHud = document.querySelector('.audio-hud');
            const hudTransport = document.querySelector('.hud-transport');
            const stage = document.querySelector('#stage');
            const audioHudRect = audioHud?.getBoundingClientRect();
            const hudTransportRect = hudTransport?.getBoundingClientRect();
            const stageRect = stage?.getBoundingClientRect();
            const audioHudReady = Boolean(audioHudRect && stageRect && audioHudRect.width > 0 && audioHudRect.height >= 70
              && audioHudRect.top >= stageRect.top && audioHudRect.bottom <= stageRect.bottom
              && getComputedStyle(audioHud).display !== 'none' && getComputedStyle(audioHud).visibility === 'visible');
            const stageGeometryReady = Boolean(stageRect
              && Math.abs(stageRect.height - window.innerHeight) <= 1
              && Math.abs(document.querySelector('#fractalCanvas')?.getBoundingClientRect().height - window.innerHeight) <= 1);
            const renderStatus = document.querySelector('#renderStatus');
            document.body.classList.add('exporting');
            const exportStatusReady = Boolean(renderStatus
              && getComputedStyle(renderStatus).display === 'grid'
              && document.querySelector('#stageRenderMode')
              && document.querySelector('#stageRenderNote')
              && document.querySelector('#stageRenderMeta'));
            document.body.classList.remove('exporting');
            const hudTransportReady = Boolean(hudTransportRect && stageRect
              && Math.abs((hudTransportRect.left + hudTransportRect.width / 2) - (stageRect.left + stageRect.width / 2)) < 2
              && !hudTransport.closest('.control-panel'));
            const activePanel = document.querySelector('.tab-panel.active');
            const quickControlsCard = document.querySelector('.quick-controls-card');
            const quickControlsRect = quickControlsCard?.getBoundingClientRect();
            const quickControlTools = [...(quickControlsCard?.querySelectorAll('.numeric-value-tools') || [])];
            const sidebarLayoutReady = Boolean(activePanel && activePanel.scrollWidth <= activePanel.clientWidth + 1);
            const quickControlsLayoutReady = !${smokeScrollQuickControls} || Boolean(quickControlsRect && quickControlTools.every((tools) => {
              const rect = tools.getBoundingClientRect();
              return rect.left >= quickControlsRect.left - 1 && rect.right <= quickControlsRect.right + 1;
            }));
            const workspaceRail = document.querySelector('.workspace-rail');
            const workspaceButtons = [...document.querySelectorAll('.workspace-button')];
            const inspectorHeader = document.querySelector('.inspector-header');
            const mainTabsFit = workspaceButtons.every((tab) => tab.scrollWidth <= tab.clientWidth + 1);
            const workspaceShellReady = Boolean(
              window.QuarticWorkspaceShell
              && workspaceRail?.getBoundingClientRect().height === window.innerHeight
              && workspaceButtons.length === 5
              && workspaceButtons.filter((button) => button.classList.contains('active')).length === 1
              && inspectorHeader?.getBoundingClientRect().height >= 58
              && document.querySelector('#inspectorWorkspaceTitle')?.textContent
              && document.querySelectorAll('.interface-mode-switch [data-interface-mode]').length === 2
            );
            const visualCatalogReady = Boolean(
              window.QuarticVisualCatalog?.styles?.length === 7
              && window.QuarticVisualCatalog.validate()
              && window.QuarticVisualCatalog.get(5)?.key === 'mandelbulb'
            );
            const controllerModulesReady = Boolean(
              window.QuarticAudioController
              && window.QuarticPerformanceController
              && window.QuarticExportController
              && window.__quarticControllers?.audio?.diagnostics?.ready
              && window.__quarticControllers.audio.diagnostics.bound
              && window.__quarticControllers?.performance?.diagnostics?.ready
              && window.__quarticControllers.performance.diagnostics.bound
              && window.__quarticControllers?.export?.diagnostics?.ready
              && window.__quarticControllers.export.diagnostics.bound
            );
            const showComposerControllerReady = Boolean(
              window.QuarticPerformanceShowComposerController
              && window.__quarticControllers?.showComposer?.diagnostics?.ready
              && window.__quarticControllers.showComposer.diagnostics.bound
              && window.__quarticControllers.showComposer.diagnostics.initialized
              && typeof window.__quarticControllers.showComposer.render === 'function'
              && typeof window.__quarticControllers.showComposer.updatePlayhead === 'function'
            );
            const profileManagerControllerReady = Boolean(
              window.QuarticProfileManagerController
              && window.__quarticControllers?.profileManager?.diagnostics?.ready
              && window.__quarticControllers.profileManager.diagnostics.bound
              && window.__quarticControllers.profileManager.diagnostics.initialized
              && typeof window.__quarticControllers.profileManager.render === 'function'
              && typeof window.__quarticControllers.profileManager.selectedProfile === 'function'
            );
            const audioAnalysisEngineReady = Boolean(
              window.QuarticAudioAnalysisEngine
              && window.__quarticEngines?.audioAnalysis?.diagnostics
              && typeof window.__quarticEngines.audioAnalysis.update === 'function'
              && typeof window.__quarticEngines.audioAnalysis.updateBeatDetector === 'function'
            );
            const exportSessionEngineReady = Boolean(
              window.QuarticExportSessionEngine
              && window.__quarticEngines?.exportSession?.diagnostics?.ready
              && typeof window.__quarticEngines.exportSession.begin === 'function'
              && typeof window.__quarticEngines.exportSession.updateProgress === 'function'
              && typeof window.__quarticEngines.exportSession.requestCancel === 'function'
            );
            const performanceSequencerEngineReady = Boolean(
              window.QuarticPerformanceSequencerEngine
              && window.__quarticEngines?.performanceSequencer?.diagnostics?.ready
              && typeof window.__quarticEngines.performanceSequencer.decideAdvance === 'function'
              && typeof window.__quarticEngines.performanceSequencer.calculateProgress === 'function'
              && typeof window.__quarticEngines.performanceSequencer.shouldAdvance === 'function'
            );
            const performanceShowDataEngineReady = Boolean(
              window.QuarticPerformanceShowDataEngine
              && window.__quarticEngines?.performanceShowData?.diagnostics?.ready
              && typeof window.__quarticEngines.performanceShowData.parseShowDocument === 'function'
              && typeof window.__quarticEngines.performanceShowData.sanitizeEntry === 'function'
              && typeof window.__quarticEngines.performanceShowData.parseProfiles === 'function'
            );
            const performancePackageEngineReady = Boolean(
              window.QuarticPerformancePackageEngine
              && window.__quarticEngines?.performancePackage?.diagnostics?.ready
              && typeof window.__quarticEngines.performancePackage.createDocument === 'function'
              && typeof window.__quarticEngines.performancePackage.validateDocument === 'function'
              && typeof window.__quarticEngines.performancePackage.remapImportedShow === 'function'
              && typeof window.__quarticEngines.performancePackage.trackMatches === 'function'
            );
            const songMapDataEngineReady = Boolean(
              window.QuarticSongMapDataEngine
              && window.__quarticEngines?.songMapData?.diagnostics?.ready
              && typeof window.__quarticEngines.songMapData.mapKey === 'function'
              && typeof window.__quarticEngines.songMapData.isValidMap === 'function'
              && typeof window.__quarticEngines.songMapData.updateOverride === 'function'
              && typeof window.__quarticEngines.songMapData.sectionEnergy === 'function'
            );
            const songDirectorEngineReady = Boolean(
              window.QuarticSongDirectorEngine
              && window.__quarticEngines?.songDirector?.diagnostics?.ready
              && typeof window.__quarticEngines.songDirector.generatePlan === 'function'
              && typeof window.__quarticEngines.songDirector.evaluate === 'function'
              && typeof window.__quarticEngines.songDirector.resolveBehavior === 'function'
            );
            const exportEncoderEngineReady = Boolean(
              window.QuarticExportEncoderEngine
              && window.__quarticEngines?.exportEncoder?.diagnostics?.ready
              && typeof window.__quarticEngines.exportEncoder.createLive === 'function'
              && typeof window.__quarticEngines.exportEncoder.createOffline === 'function'
              && typeof window.__quarticEngines.exportEncoder.chooseOfflineConfig === 'function'
            );
            const workflowButtons = [...document.querySelectorAll('[data-workflow-tab]')];
            const workflowWorkspace = document.body.dataset.workspace;
            const workflowDisplay = getComputedStyle(document.querySelector('.basic-workflow-nav')).display;
            const basicWorkflowReady = !${process.argv.includes('--smoke-basic')} || Boolean(
              workflowButtons.length === 4
              && workflowDisplay === 'grid'
              && workflowButtons.filter((button) => button.classList.contains('active')).length === 1
              && workflowButtons.find((button) => button.classList.contains('active'))?.dataset.workflowTab === workflowWorkspace
              && getComputedStyle(document.querySelector('[data-music-tab="frequency-color"]')).display === 'none'
              && getComputedStyle(document.querySelector('[data-live-tab="composer"]')).display === 'none'
            );
            const advancedWorkflowReady = !${process.argv.includes('--smoke-interface-advanced')} || Boolean(
              workflowDisplay === 'none'
              && getComputedStyle(document.querySelector('[data-music-tab="frequency-color"]')).display !== 'none'
              && getComputedStyle(document.querySelector('[data-live-tab="composer"]')).display !== 'none'
            );
            const unleashedToggle = document.querySelector('.unleashed-toggle');
            const unleashedRect = unleashedToggle?.getBoundingClientRect();
            const unleashedTextRect = unleashedToggle?.querySelector(':scope > span')?.getBoundingClientRect();
            const unleashedSwitchRect = unleashedToggle?.querySelector(':scope > i')?.getBoundingClientRect();
            const unleashedResetRect = unleashedToggle?.querySelector('.toggle-reset-button')?.getBoundingClientRect();
            const unleashedLayoutReady = activeSystemTab !== 'system' || !${smokeAdvanced} || Boolean(
              unleashedRect && unleashedTextRect && unleashedSwitchRect && unleashedResetRect
              && unleashedTextRect.width >= 80
              && unleashedSwitchRect.left >= unleashedTextRect.right - 1
              && unleashedResetRect.width <= 30
              && unleashedResetRect.right <= unleashedRect.right + 1
            );
            const aboutContentReady = activeSystemTab !== 'about' || Boolean(
              document.querySelector('.about-feature-grid')
              && document.querySelector('.about-release-card')
              && document.querySelector('.about-title > span')?.textContent.includes('0.30.0')
            );
            const musicPersonalityButtons = [...document.querySelectorAll('[data-music-personality]')];
            const musicPersonalityReady = musicPersonalityButtons.length === 7
              && musicPersonalityButtons.filter((button) => button.classList.contains('active')).length === 1
              && Boolean(document.querySelector('.personality-summary'));
            const songMapReady = Boolean(
              document.querySelector('#songMapCanvas')
              && document.querySelector('#analyzeSongButton')
              && document.querySelector('#songMapProgress')
              && document.querySelector('#songMapSections')
            );
            const songDirectorReady = Boolean(
              document.querySelector('#songDirectorEnabled')
              && document.querySelector('#songDirectorIntensity')
              && document.querySelector('#songDirectorBehavior')
              && document.querySelector('#songDirectorBehaviorResolved')
              && document.querySelector('#songDirectorCueEditor')
              && document.querySelector('#songDirectorCueStrength')
              && document.querySelector('#songDirectorCueEmphasis')
              && document.querySelectorAll('[data-director-style]').length === 4
              && document.querySelector('#songDirectorPlan')
            );
            const performancePackageReady = Boolean(
              document.querySelector('#performancePackageTitle')
              && document.querySelector('#performancePackageCreator')
              && document.querySelector('#performancePackageNotes')
              && document.querySelector('#exportPerformancePackageButton')
              && document.querySelector('#importPerformancePackageButton')
              && document.querySelector('#performancePackageStatus')
            );
            const performancePackagePreview = typeof window.__quarticPulseCreatePerformancePackage === 'function'
              ? window.__quarticPulseCreatePerformancePackage() : null;
            const performancePackageDataReady = Boolean(
              performancePackagePreview?.application === 'quartic-pulse-performance'
              && performancePackagePreview?.schemaVersion === 1
              && /^QP-[A-F0-9]{8}$/.test(performancePackagePreview?.fingerprint || '')
              && performancePackagePreview?.performance?.currentVisual?.kind === 'settings'
              && Array.isArray(performancePackagePreview?.performance?.show?.entries)
              && !JSON.stringify(performancePackagePreview).includes('filePath')
            );
            const performanceModeReady = !${process.argv.includes('--smoke-performance-mode')} || Boolean(
              document.body.classList.contains('performance-mode')
              && getComputedStyle(document.querySelector('.control-panel')).display === 'none'
              && getComputedStyle(document.querySelector('#performanceDock')).display !== 'none'
              && document.querySelector('#performanceDockCurrent')
              && document.querySelector('#exitPerformanceModeButton')
            );
            const showComposerWorkspaceReady = !${process.argv.includes('--smoke-composer-workspace')} || Boolean(
              document.body.classList.contains('composer-mode')
              && getComputedStyle(document.querySelector('.control-panel')).display === 'none'
              && getComputedStyle(document.querySelector('#showComposerWorkspace')).display === 'grid'
              && document.querySelector('#showComposerWorkspace').getBoundingClientRect().width === window.innerWidth
              && document.querySelector('#composerTimelineScroll').clientWidth > 0
              && document.querySelector('#composerInspector').getBoundingClientRect().height > 0
            );
            const composerGenerated = typeof window.__quarticPulseComposeShowEntries === 'function'
              ? window.__quarticPulseComposeShowEntries({
                duration: 30,
                energy: [36, 72, 130, 220, 95, 48],
                sections: [
                  { label: 'Intro', start: 0, end: 7.25 },
                  { label: 'Peak', start: 7.25, end: 20.5 },
                  { label: 'Outro', start: 20.5, end: 30 }
                ]
              }, [{ id: 'smoke-profile-a' }, { id: 'smoke-profile-b' }])
              : [];
            const showComposerGenerationReady = composerGenerated.length === 3
              && composerGenerated[0].value === 7.25
              && composerGenerated[1].profileId === 'smoke-profile-b'
              && composerGenerated[0].transition === 'cut'
              && composerGenerated[1].transition === 'black'
              && composerGenerated.every((entry) => entry.advance === 'time'
                && entry.automation.director >= 0 && entry.automation.director <= 1
                && entry.automation.motion >= 0 && entry.automation.motion <= 2.5
                && entry.automation.equation >= 0 && entry.automation.equation <= 1.5
                && entry.automation.flow >= 0 && entry.automation.flow <= 1);
            const performanceHardwareModePreserved = document.querySelector('#performanceMode')?.value === performanceHardwareModeBefore;
            return {
              ready: Boolean(window.__quarticReady),
              webgl2: Boolean(document.querySelector('#fractalCanvas')?.getContext('webgl2')),
              frequencyBands,
              visualStyles,
              playlistReady,
              obsOutputReady,
              profilesReady,
              windowsAudioReady,
              windowsOutputCount,
              outputCaptureReady,
              audioHudReady,
              hudTransportReady,
              stageGeometryReady,
              exportStatusReady,
              geometryMetrics: {
                viewport: [window.innerWidth, window.innerHeight],
                stage: stageRect ? [Math.round(stageRect.left), Math.round(stageRect.top), Math.round(stageRect.width), Math.round(stageRect.height)] : null,
                canvas: (() => { const rect = document.querySelector('#fractalCanvas')?.getBoundingClientRect(); return rect ? [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)] : null; })(),
                audioHud: audioHudRect ? [Math.round(audioHudRect.left), Math.round(audioHudRect.top), Math.round(audioHudRect.width), Math.round(audioHudRect.height)] : null
              },
              sidebarLayoutReady,
              quickControlsLayoutReady,
              mainTabsFit,
              workspaceShellReady,
              visualCatalogReady,
              controllerModulesReady,
              showComposerControllerReady,
              profileManagerControllerReady,
              audioAnalysisEngineReady,
              performanceSequencerEngineReady,
              performanceShowDataEngineReady,
              songMapDataEngineReady,
              songDirectorEngineReady,
              performancePackageEngineReady,
              exportSessionEngineReady,
              exportEncoderEngineReady,
              basicWorkflowReady,
              advancedWorkflowReady,
              unleashedLayoutReady,
              unleashedMetrics: unleashedRect ? {
                rowWidth: Math.round(unleashedRect.width),
                textWidth: Math.round(unleashedTextRect?.width || 0),
                switchWidth: Math.round(unleashedSwitchRect?.width || 0),
                resetWidth: Math.round(unleashedResetRect?.width || 0),
                textRight: Math.round(unleashedTextRect?.right || 0),
                switchLeft: Math.round(unleashedSwitchRect?.left || 0),
                resetRight: Math.round(unleashedResetRect?.right || 0),
                rowRight: Math.round(unleashedRect.right)
              } : null,
              aboutContentReady,
              musicPersonalityReady,
              songMapReady,
              songDirectorReady,
              performancePackageReady,
              performancePackageDataReady,
              performanceModeReady,
              performanceBlackoutReady,
              performanceHardwareModePreserved,
              appearanceNavigationReady,
              modulationMatrixReady,
              showSequencerReady,
              showComposerReady,
              showComposerWorkspaceReady,
              showComposerGenerationReady,
              liveControlsReady,
              creativeToolsReady,
              performanceAssistantReady,
              reportCenterReady,
              reportGenerationReady,
              performanceAutomationStandbyReady,
              performanceSnapshot: {
                fps: Number(document.querySelector('#performanceFpsValue')?.textContent || 0),
                frameMs: Number(document.querySelector('#performanceFrameValue')?.textContent || 0),
                scalePercent: Number(document.querySelector('#performanceScaleValue')?.textContent || 0)
              },
              offlineExportReady,
              exportQolReady,
              obsAutomationReady,
              coreEquationReady,
              coreEquationInputReady,
              percentageScalesReady,
              percentageScaleFailures,
              pulseControls,
              customColorRolesReady,
              beatDetectorControls,
              bulbControls,
              pulsePresetsReady: '${requestedSmokeStyle}' !== '3' || pulsePresetsReady,
              visualEffectControls,
              effectPresetsReady,
              visualOptionsReady: [...document.querySelectorAll('[data-visual-options]')].every((panel) => panel.hidden === (Number(panel.dataset.visualOptions) !== Number('${requestedSmokeStyle}'))),
              activeTab: activeTopTab === 'music' ? activeMusicTab : (activeTopTab === 'appearance' ? activeAppearanceTab : (activeTopTab === 'live' ? activeLiveTab : (activeTopTab === 'system' ? activeSystemTab : activeTopTab))),
              activeVisualStyle: document.body.dataset.visualStyle || '',
              dimensionalEnabled: Boolean(document.querySelector('#fractalDimensional')?.checked),
              equationFoldingEnabled: Boolean(document.querySelector('#equationFolding')?.checked),
              title: document.title,
              pulseEventCount: Number(window.__quarticPulseEventCount || 0),
              pulseEventLimit: Number(window.__quarticPulseEventLimit || 0),
              canvasWidth: document.querySelector('#fractalCanvas')?.width || 0,
              canvasHeight: document.querySelector('#fractalCanvas')?.height || 0
            };
          })()`);
          const nativeExportEncoder = await recommendedExportEncoder();
          result.nativeExportEncoder = {
            id: nativeExportEncoder.id,
            label: nativeExportEncoder.label,
            hardware: nativeExportEncoder.hardware
          };
          result.nativeExportEncoderReady = ['h264_nvenc', 'h264_qsv', 'h264_amf', 'libx264'].includes(nativeExportEncoder.id);
          if (smokeSongMap) {
            await window.webContents.executeJavaScript(`(() => {
              const sampleRate = 22050;
              const duration = 18;
              const sampleCount = sampleRate * duration;
              const buffer = new ArrayBuffer(44 + sampleCount * 2);
              const view = new DataView(buffer);
              const writeText = (offset, value) => {
                for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
              };
              writeText(0, 'RIFF');
              view.setUint32(4, 36 + sampleCount * 2, true);
              writeText(8, 'WAVE');
              writeText(12, 'fmt ');
              view.setUint32(16, 16, true);
              view.setUint16(20, 1, true);
              view.setUint16(22, 1, true);
              view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * 2, true);
              view.setUint16(32, 2, true);
              view.setUint16(34, 16, true);
              writeText(36, 'data');
              view.setUint32(40, sampleCount * 2, true);
              for (let index = 0; index < sampleCount; index++) {
                const time = index / sampleRate;
                const section = Math.floor(time / 6);
                const beatPhase = time % .5;
                const beat = beatPhase < .12 ? Math.sin(time * Math.PI * 2 * (section === 1 ? 92 : 68)) * Math.exp(-beatPhase * 24) * (.42 + section * .14) : 0;
                const tone = Math.sin(time * Math.PI * 2 * (section === 0 ? 330 : (section === 1 ? 880 : 1760))) * (.08 + section * .035);
                const sample = Math.max(-1, Math.min(1, beat + tone));
                view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
              }
              const file = new File([buffer], 'Quartic-Song-Map-Smoke.wav', { type: 'audio/wav', lastModified: 1 });
              const transfer = new DataTransfer();
              transfer.items.add(file);
              const input = document.querySelector('#audioInput');
              input.files = transfer.files;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            })()`);
            for (let attempt = 0; attempt < 20; attempt++) {
              const ready = await window.webContents.executeJavaScript(`Boolean(document.querySelector('#analyzeSongButton') && !document.querySelector('#analyzeSongButton').disabled)`);
              if (ready) break;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            await window.webContents.executeJavaScript(`document.querySelector('#analyzeSongButton')?.click()`);
            for (let attempt = 0; attempt < 120; attempt++) {
              const complete = await window.webContents.executeJavaScript(`Boolean(!document.querySelector('#songMapResults')?.hidden && document.querySelectorAll('.song-map-section').length > 0)`);
              if (complete) break;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            result.songMapAnalysis = await window.webContents.executeJavaScript(`(() => ({
              visible: !document.querySelector('#songMapResults')?.hidden,
              sections: document.querySelectorAll('.song-map-section').length,
              stats: document.querySelectorAll('.song-map-stat').length,
              status: document.querySelector('#songMapStatus')?.textContent || '',
              canvasWidth: document.querySelector('#songMapCanvas')?.width || 0
            }))()`);
            result.songMapAnalysisReady = result.songMapAnalysis.visible
              && result.songMapAnalysis.sections > 0
              && result.songMapAnalysis.stats === 4
              && result.songMapAnalysis.canvasWidth > 0;
            result.songDirectorAnalysis = await window.webContents.executeJavaScript(`(() => {
              const enabled = document.querySelector('#songDirectorEnabled');
              enabled?.click();
              const behavior = document.querySelector('#songDirectorBehavior');
              behavior.value = 'electronic';
              behavior.dispatchEvent(new Event('change', { bubbles: true }));
              const explicitBehavior = document.querySelector('#songDirectorBehaviorResolved')?.textContent || '';
              behavior.value = 'auto';
              behavior.dispatchEvent(new Event('change', { bubbles: true }));
              const firstCue = document.querySelector('.song-director-cue');
              firstCue?.click();
              const cueStrength = document.querySelector('#songDirectorCueStrength');
              cueStrength.value = '.42';
              cueStrength.dispatchEvent(new Event('input', { bubbles: true }));
              const cueEmphasis = document.querySelector('#songDirectorCueEmphasis');
              cueEmphasis.value = 'equation';
              cueEmphasis.dispatchEvent(new Event('change', { bubbles: true }));
              const cueOverrideReady = !document.querySelector('#songDirectorCueEditor')?.hidden
                && firstCue?.classList.contains('edited')
                && document.querySelector('#songDirectorCueState')?.textContent === 'EDITED';
              document.querySelector('#resetSongDirectorCue')?.click();
              const cueResetReady = !firstCue?.classList.contains('edited')
                && document.querySelector('#songDirectorCueState')?.textContent === 'AUTO';
              return {
                planCues: document.querySelectorAll('.song-director-cue').length,
                enabled: Boolean(enabled?.checked),
                status: document.querySelector('#songDirectorStatus')?.textContent || '',
                currentCue: document.querySelector('#songDirectorNow strong')?.textContent || '',
                explicitBehavior,
                automaticBehavior: document.querySelector('#songDirectorBehaviorResolved')?.textContent || '',
                cueOverrideReady,
                cueResetReady
              };
            })()`);
            result.songDirectorAnalysisReady = result.songDirectorAnalysis.enabled
              && result.songDirectorAnalysis.planCues === result.songMapAnalysis.sections
              && result.songDirectorAnalysis.status === 'ACTIVE'
              && result.songDirectorAnalysis.explicitBehavior.includes('ELECTRONIC')
              && result.songDirectorAnalysis.automaticBehavior.startsWith('AUTO')
              && result.songDirectorAnalysis.cueOverrideReady
              && result.songDirectorAnalysis.cueResetReady;
          } else {
            result.songMapAnalysisReady = true;
            result.songDirectorAnalysisReady = true;
          }
          if (process.argv.includes('--smoke-beat-rotation')) {
            await window.webContents.executeJavaScript(`(() => {
              document.querySelector('[data-modulation-preset="dimension"]')?.click();
              window.__quarticPulseMaxRotationStep = 0;
            })()`);
          }
          if (smokeSyntheticAudio) {
            await window.webContents.executeJavaScript(`(() => {
              const sampleRate = 44100;
              const duration = 12;
              const sampleCount = sampleRate * duration;
              const buffer = new ArrayBuffer(44 + sampleCount * 2);
              const view = new DataView(buffer);
              const writeText = (offset, value) => {
                for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
              };
              writeText(0, 'RIFF');
              view.setUint32(4, 36 + sampleCount * 2, true);
              writeText(8, 'WAVE');
              writeText(12, 'fmt ');
              view.setUint32(16, 16, true);
              view.setUint16(20, 1, true);
              view.setUint16(22, 1, true);
              view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * 2, true);
              view.setUint16(32, 2, true);
              view.setUint16(34, 16, true);
              writeText(36, 'data');
              view.setUint32(40, sampleCount * 2, true);
              for (let index = 0; index < sampleCount; index++) {
                const time = index / sampleRate;
                const bassPhase = time % .50;
                const midPhase = (time + .29) % .375;
                const highPhase = (time + .13) % .25;
                const bass = bassPhase < .13 ? Math.sin(time * Math.PI * 2 * 72) * Math.exp(-bassPhase * 22) * ${smokeAdaptiveBeat ? '.14' : '.72'} : 0;
                const mids = midPhase < .075 ? Math.sin(time * Math.PI * 2 * 760) * Math.exp(-midPhase * 38) * .38 : 0;
                const highs = highPhase < .035 ? Math.sin(time * Math.PI * 2 * 5200) * Math.exp(-highPhase * 72) * .22 : 0;
                const sample = Math.max(-1, Math.min(1, bass + mids + highs));
                view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
              }
              const player = document.querySelector('#audio');
              player.src = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
              player.load();
              const playButton = document.querySelector('#playButton');
              playButton.disabled = false;
              playButton.click();
            })()`);
            result.pulseEventCount = 0;
            result.pulsePeakCount = 0;
            result.beatSamples = [];
            for (let attempt = 0; attempt < 12; attempt++) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              result.pulseEventCount = await window.webContents.executeJavaScript(`Number(window.__quarticPulseEventCount || 0)`);
              result.pulsePeakCount = Math.max(result.pulsePeakCount, result.pulseEventCount);
              result.beatSamples.push(await window.webContents.executeJavaScript(`({ total: Number(window.__quarticPulseBeatDetectedTotal || 0), energy: Number(window.__quarticPulseBeatEnergy || 0), onset: Number(window.__quarticPulseBeatOnset || 0), threshold: Number(window.__quarticPulseBeatThreshold || 0) })`));
            }
            result.pulseEventLimit = await window.webContents.executeJavaScript(`Number(window.__quarticPulseEventLimit || 0)`);
            result.pulseAcceptedTotal = await window.webContents.executeJavaScript(`Number(window.__quarticPulseAcceptedTotal || 0)`);
            result.beatDetectedTotal = await window.webContents.executeJavaScript(`Number(window.__quarticPulseBeatDetectedTotal || 0)`);
            result.syntheticAudioState = await window.webContents.executeJavaScript(`(() => {
              const player = document.querySelector('#audio');
              return { paused: player.paused, currentTime: player.currentTime, readyState: player.readyState };
            })()`);
            result.syntheticPulseReady = requestedSmokeStyle !== 3
              || (result.pulseAcceptedTotal > 0 && result.pulsePeakCount <= result.pulseEventLimit);
          } else result.syntheticPulseReady = true;
          result.adaptiveBeatReady = !smokeAdaptiveBeat || result.beatDetectedTotal >= 4;
          if (smokeObsOutput) {
            await window.webContents.executeJavaScript(`(() => {
              const resolution = document.querySelector('#obsResolution');
              resolution.value = '1280x720';
              resolution.dispatchEvent(new Event('change', { bubbles: true }));
              const chroma = document.querySelector('#obsChromaKey');
              chroma.checked = true;
              chroma.dispatchEvent(new Event('change', { bubbles: true }));
              document.querySelector('#obsOutputButton')?.click();
            })()`);
            await new Promise((resolve) => setTimeout(resolve, 1600));
            result.obsWindowMovable = Boolean(obsOutputWindow && !obsOutputWindow.isDestroyed() && obsOutputWindow.isMovable());
            result.obsDragStripReady = Boolean(obsOutputWindow && !obsOutputWindow.isDestroyed() && await obsOutputWindow.webContents.executeJavaScript(`(() => {
              const strip = document.querySelector('.obs-window-drag-strip');
              return Boolean(strip && getComputedStyle(strip).webkitAppRegion === 'drag' && strip.getBoundingClientRect().height >= 16);
            })()`));
            if (obsOutputWindow && !obsOutputWindow.isDestroyed()) {
              const outputImage = await obsOutputWindow.capturePage();
              const bitmap = outputImage.toBitmap();
              let keyPixels = 0;
              let unsafeGreenPixels = 0;
              for (let offset = 0; offset < bitmap.length; offset += 4) {
                const blue = bitmap[offset];
                const green = bitmap[offset + 1];
                const red = bitmap[offset + 2];
                const pureKey = green >= 245 && red <= 10 && blue <= 10;
                if (pureKey) keyPixels += 1;
                else if (green >= 36 && green > red * 1.25 && green > blue * 1.25) unsafeGreenPixels += 1;
              }
              result.obsChromaMetrics = { keyPixels, unsafeGreenPixels };
              result.obsChromaSafe = keyPixels > 100 && unsafeGreenPixels === 0;
              obsOutputWindow.close();
            } else result.obsChromaSafe = false;
          } else {
            result.obsWindowMovable = true;
            result.obsDragStripReady = true;
            result.obsChromaSafe = true;
          }
          result.rotationMaxStep = process.argv.includes('--smoke-beat-rotation')
            ? await window.webContents.executeJavaScript(`Number(window.__quarticPulseMaxRotationStep || 0)`)
            : 0;
          result.rotationVelocityReady = !process.argv.includes('--smoke-beat-rotation') || result.rotationMaxStep < .08;
          if (process.argv.includes('--capture-preview')) {
            if (process.argv.includes('--capture-temp')) {
              window.setPosition(-32000, -32000);
              window.showInactive();
            }
            await new Promise((resolve) => setTimeout(resolve, 1250));
            const image = await window.capturePage();
            const capturePath = process.argv.includes('--capture-temp')
              ? path.join(os.tmpdir(), `quartic-pulse-${requestedSmokeTab}-style-${requestedSmokeStyle}-preview.png`)
              : path.join(process.cwd(), 'quartic-pulse-preview.png');
            fs.writeFileSync(capturePath, image.toPNG());
          }
          console.log(`SMOKE_TEST ${JSON.stringify(result)}`);
          fs.writeFileSync(path.join(os.tmpdir(), 'quartic-pulse-smoke-result.json'), JSON.stringify(result, null, 2));
          process.exitCode = result.ready && result.webgl2 && result.frequencyBands && result.visualStyles && result.playlistReady && result.obsOutputReady && result.profilesReady && result.windowsAudioReady && result.outputCaptureReady && result.audioHudReady && result.hudTransportReady && result.stageGeometryReady && result.exportStatusReady && result.sidebarLayoutReady && result.quickControlsLayoutReady && result.mainTabsFit && result.workspaceShellReady && result.visualCatalogReady && result.controllerModulesReady && result.showComposerControllerReady && result.profileManagerControllerReady && result.audioAnalysisEngineReady && result.performanceSequencerEngineReady && result.performanceShowDataEngineReady && result.songMapDataEngineReady && result.songDirectorEngineReady && result.performancePackageEngineReady && result.exportSessionEngineReady && result.exportEncoderEngineReady && result.basicWorkflowReady && result.advancedWorkflowReady && result.unleashedLayoutReady && result.aboutContentReady && result.musicPersonalityReady && result.songMapReady && result.songMapAnalysisReady && result.songDirectorReady && result.songDirectorAnalysisReady && result.appearanceNavigationReady && result.modulationMatrixReady && result.showSequencerReady && result.showComposerReady && result.showComposerWorkspaceReady && result.showComposerGenerationReady && result.liveControlsReady && result.creativeToolsReady && result.performanceAssistantReady && result.reportCenterReady && result.reportGenerationReady && result.performanceAutomationStandbyReady && result.offlineExportReady && result.exportQolReady && result.nativeExportEncoderReady && result.obsAutomationReady && result.coreEquationReady && result.coreEquationInputReady && result.percentageScalesReady && result.pulseControls && result.customColorRolesReady && result.beatDetectorControls && result.bulbControls && result.pulsePresetsReady && result.visualEffectControls && result.effectPresetsReady && result.visualOptionsReady && result.syntheticPulseReady && result.adaptiveBeatReady && result.obsWindowMovable && result.obsDragStripReady && result.obsChromaSafe && result.rotationVelocityReady && result.activeTab === requestedSmokeTab && result.activeVisualStyle === String(requestedSmokeStyle) && result.canvasWidth > 0 ? 0 : 1;
        } catch (error) {
          console.error('SMOKE_TEST_FAILED', error);
          try {
            fs.writeFileSync(path.join(os.tmpdir(), 'quartic-pulse-smoke-result.json'), JSON.stringify({
              ready: false,
              smokeError: error?.stack || error?.message || String(error)
            }, null, 2));
          } catch (_) { /* Preserve the original smoke-test failure. */ }
          process.exitCode = 1;
        } finally {
          app.quit();
        }
      }, 1500);
    });
  }

  if (process.argv.includes('--dev')) {
    window.webContents.openDevTools({ mode: 'detach' });
  }
}

function ffmpegExecutable() {
  const bundled = path.join(process.resourcesPath, 'bin', 'ffmpeg.exe');
  return fs.existsSync(bundled) ? bundled : 'ffmpeg';
}

function verifyFfmpeg() {
  return new Promise((resolve, reject) => {
    execFile(ffmpegExecutable(), ['-version'], { windowsHide: true, timeout: 10000 }, (error) => {
      if (error) reject(new Error('Offline export requires FFmpeg. Install FFmpeg, restart Quartic Pulse, and try again.'));
      else resolve(true);
    });
  });
}

const exportEncoderProfiles = {
  h264_nvenc: {
    id: 'h264_nvenc', label: 'NVIDIA NVENC · H.264 High Quality', hardware: true,
    args: ['-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '14', '-b:v', '0']
  },
  h264_qsv: {
    id: 'h264_qsv', label: 'Intel Quick Sync · H.264 Quality', hardware: true,
    args: ['-c:v', 'h264_qsv', '-preset', 'veryslow', '-global_quality', '14']
  },
  h264_amf: {
    id: 'h264_amf', label: 'AMD AMF · H.264 Quality', hardware: true,
    args: ['-c:v', 'h264_amf', '-quality', 'quality', '-rc', 'cqp', '-qp_i', '14', '-qp_p', '14']
  },
  libx264: {
    id: 'libx264', label: 'CPU Software · x264 CRF 14', hardware: false,
    args: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '14']
  }
};

function probeExportEncoder(profile) {
  return new Promise((resolve) => {
    const args = [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'color=c=black:s=256x256:d=0.1:r=30',
      '-frames:v', '1', ...profile.args, '-pix_fmt', 'yuv420p', '-f', 'null', '-'
    ];
    execFile(ffmpegExecutable(), args, { windowsHide: true, timeout: 8000 }, (error) => resolve(!error));
  });
}

async function recommendedExportEncoder({ refresh = false } = {}) {
  if (cachedExportEncoder && !refresh) return cachedExportEncoder;
  await verifyFfmpeg();
  const hardware = await detectHardware();
  const gpuText = hardware.gpuDevices.map((device) => `${device.vendorString} ${device.deviceString} ${device.driverVendor}`).join(' ').toLowerCase();
  const preferred = [];
  if (/nvidia|geforce|quadro/.test(gpuText)) preferred.push('h264_nvenc');
  if (/intel|arc|iris|uhd/.test(gpuText)) preferred.push('h264_qsv');
  if (/amd|radeon|advanced micro/.test(gpuText)) preferred.push('h264_amf');
  const candidates = preferred.length ? preferred : ['h264_nvenc', 'h264_qsv', 'h264_amf'];
  for (const id of candidates) {
    const profile = exportEncoderProfiles[id];
    if (await probeExportEncoder(profile)) {
      cachedExportEncoder = { ...profile, available: true };
      return cachedExportEncoder;
    }
  }
  cachedExportEncoder = { ...exportEncoderProfiles.libx264, available: await probeExportEncoder(exportEncoderProfiles.libx264) };
  if (!cachedExportEncoder.available) throw new Error('FFmpeg could not initialize a compatible H.264 encoder.');
  return cachedExportEncoder;
}

function validatedEncoderProfile(id) {
  return exportEncoderProfiles[id] || exportEncoderProfiles.libx264;
}

async function availableDiskBytes(targetPath) {
  const directory = path.extname(targetPath) ? path.dirname(targetPath) : targetPath;
  const stats = await fs.promises.statfs(directory);
  return Number(stats.bavail) * Number(stats.bsize);
}

async function ensureExportDiskSpace(outputPath, requiredBytes) {
  const availableBytes = await availableDiskBytes(outputPath);
  const required = Math.max(0, Number(requiredBytes) || 0);
  if (required && availableBytes < required) {
    const requiredGb = (required / 1073741824).toFixed(1);
    const availableGb = (availableBytes / 1073741824).toFixed(1);
    throw new Error(`Not enough free space for this export. About ${requiredGb} GB is required; ${availableGb} GB is available.`);
  }
  return availableBytes;
}

function recoveryDirectory() {
  return path.join(app.getPath('userData'), 'export-recovery');
}

function recoveryManifestPath(id) {
  return path.join(recoveryDirectory(), `${id}.json`);
}

async function writeRecoveryManifest(session, extra = {}) {
  await fs.promises.mkdir(recoveryDirectory(), { recursive: true });
  const manifest = {
    id: session.id,
    createdAt: session.createdAt || new Date().toISOString(),
    outputPath: session.outputPath,
    tempPath: session.tempPath,
    audioPath: session.audioPath,
    format: session.format,
    width: session.width,
    height: session.height,
    fps: session.fps,
    frameCount: session.frameCount,
    encodedFrames: session.frameIndex,
    codec: session.codec,
    finalEncoder: session.finalEncoder,
    ...extra
  };
  await fs.promises.writeFile(recoveryManifestPath(session.id), JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

async function removeRecoveryFiles(session, { removeVideo = true } = {}) {
  await fs.promises.unlink(recoveryManifestPath(session.id)).catch(() => {});
  if (removeVideo) await fs.promises.unlink(session.tempPath).catch(() => {});
}

async function readRecoveryManifests() {
  await fs.promises.mkdir(recoveryDirectory(), { recursive: true });
  const files = await fs.promises.readdir(recoveryDirectory()).catch(() => []);
  const results = [];
  for (const fileName of files.filter((name) => name.endsWith('.json'))) {
    const manifestPath = path.join(recoveryDirectory(), fileName);
    try {
      const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
      const tempStat = await fs.promises.stat(manifest.tempPath).catch(() => null);
      const audioStat = await fs.promises.stat(manifest.audioPath).catch(() => null);
      if (!tempStat?.isFile() || tempStat.size <= 32 || !audioStat?.isFile()) continue;
      results.push({ ...manifest, tempBytes: tempStat.size });
    } catch (_) { /* Ignore malformed recovery metadata. */ }
  }
  return results.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function inspectAndRepairIvf(filePath) {
  const file = await fs.promises.open(filePath, 'r+');
  try {
    const stat = await file.stat();
    let position = 32;
    let frames = 0;
    const header = Buffer.alloc(12);
    while (position + 12 <= stat.size) {
      const read = await file.read(header, 0, 12, position);
      if (read.bytesRead !== 12) break;
      const frameBytes = header.readUInt32LE(0);
      if (!frameBytes || frameBytes > 64 * 1024 * 1024 || position + 12 + frameBytes > stat.size) break;
      position += 12 + frameBytes;
      frames++;
    }
    if (!frames) throw new Error('No complete encoded frames were found in the interrupted export.');
    if (position < stat.size) await file.truncate(position);
    const count = Buffer.alloc(4);
    count.writeUInt32LE(frames, 0);
    await file.write(count, 0, 4, 24);
    return frames;
  } finally {
    await file.close();
  }
}

async function completedExportDetails(outputPath, encoderId, extra = {}) {
  const stat = await fs.promises.stat(outputPath).catch(() => null);
  return {
    outputPath,
    sizeBytes: stat?.size || 0,
    encoderId,
    encoderLabel: validatedEncoderProfile(encoderId).label,
    ...extra
  };
}

function closeSession(session) {
  return new Promise((resolve, reject) => {
    if (!session.stream) return resolve();
    session.stream.once('error', reject);
    session.stream.end(resolve);
  });
}

async function copyFileWithProgress(sourcePath, destinationPath, onProgress = () => {}) {
  const sourceStat = await fs.promises.stat(sourcePath);
  const totalBytes = Math.max(1, sourceStat.size);
  let copiedBytes = 0;
  const reader = fs.createReadStream(sourcePath);
  reader.on('data', (chunk) => {
    copiedBytes += chunk.length;
    onProgress(Math.min(1, copiedBytes / totalBytes));
  });
  onProgress(0);
  await pipeline(reader, fs.createWriteStream(destinationPath));
  onProgress(1);
}

const videoFormats = {
  mp4: { name: 'MP4 video', extension: 'mp4' },
  webm: { name: 'WebM video', extension: 'webm' },
  mov: { name: 'QuickTime MOV video', extension: 'mov' },
  mkv: { name: 'Matroska MKV video', extension: 'mkv' }
};

function ffmpegTimestampSeconds(value) {
  const match = String(value || '').match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : 0;
}

function transcodeVideo(input, output, format, encoderId = 'libx264', onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const encoder = validatedEncoderProfile(encoderId);
    const args = [
      '-y', '-i', input,
      ...encoder.args,
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k'
    ];
    if (format === 'mp4' || format === 'mov') args.push('-movflags', '+faststart');
    args.push(output);
    const child = spawn(ffmpegExecutable(), args, { windowsHide: true });
    let errorText = '';
    let duration = 0;
    onProgress(0);
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      errorText = (errorText + text).slice(-6000);
      const durationMatch = text.match(/Duration:\s*(\d+:\d+:\d+(?:\.\d+)?)/);
      if (durationMatch) duration = ffmpegTimestampSeconds(durationMatch[1]);
      const timeMatches = [...text.matchAll(/time=(\d+:\d+:\d+(?:\.\d+)?)/g)];
      if (duration > 0 && timeMatches.length) {
        onProgress(Math.max(0, Math.min(.995, ffmpegTimestampSeconds(timeMatches.at(-1)[1]) / duration)));
      }
    });
    child.on('error', (error) => reject(new Error(`Could not start FFmpeg: ${error.message}`)));
    child.on('close', (code) => {
      if (code === 0) {
        onProgress(1);
        resolve();
      }
      else reject(new Error(`FFmpeg exited with code ${code}.\n${errorText}`));
    });
  });
}

function createIvfHeader({ width, height, fps, frameCount, codec }) {
  const header = Buffer.alloc(32);
  header.write('DKIF', 0, 'ascii');
  header.writeUInt16LE(0, 4);
  header.writeUInt16LE(32, 6);
  header.write(codec === 'vp8' ? 'VP80' : 'VP90', 8, 'ascii');
  header.writeUInt16LE(width, 12);
  header.writeUInt16LE(height, 14);
  header.writeUInt32LE(fps, 16);
  header.writeUInt32LE(1, 20);
  header.writeUInt32LE(frameCount, 24);
  header.writeUInt32LE(0, 28);
  return header;
}

async function updateIvfFrameCount(filePath, frameCount) {
  const count = Math.max(1, Math.min(0xffffffff, Math.round(Number(frameCount) || 1)));
  const value = Buffer.alloc(4);
  value.writeUInt32LE(count, 0);
  const file = await fs.promises.open(filePath, 'r+');
  try {
    await file.write(value, 0, value.length, 24);
  } finally {
    await file.close();
  }
}

function muxOfflineVideo(session, encoderId = 'libx264', onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', session.tempPath, '-i', session.audioPath, '-map', '0:v:0', '-map', '1:a:0?', '-shortest'];
    if (session.format === 'webm') args.push('-c:v', 'copy', '-c:a', 'libopus', '-b:a', '256k');
    else args.push(...validatedEncoderProfile(encoderId).args, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k');
    if (session.format === 'mp4' || session.format === 'mov') args.push('-movflags', '+faststart');
    args.push(session.outputPath);
    const child = spawn(ffmpegExecutable(), args, { windowsHide: true });
    session.child = child;
    let errorText = '';
    const duration = session.frameCount / session.fps;
    onProgress(0);
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      errorText = (errorText + text).slice(-8000);
      const timeMatches = [...text.matchAll(/time=(\d+:\d+:\d+(?:\.\d+)?)/g)];
      if (duration > 0 && timeMatches.length) {
        onProgress(Math.max(0, Math.min(.995, ffmpegTimestampSeconds(timeMatches.at(-1)[1]) / duration)));
      }
    });
    child.on('error', (error) => reject(new Error(`Could not start FFmpeg: ${error.message}`)));
    child.on('close', (code) => {
      session.child = null;
      if (code === 0) {
        onProgress(1);
        resolve();
      }
      else reject(new Error(`FFmpeg offline mux exited with code ${code}.\n${errorText}`));
    });
  });
}

async function detectHardware() {
  let gpuInfo = {};
  try { gpuInfo = await app.getGPUInfo('complete'); } catch (_) { /* GPU details vary by driver. */ }
  const devices = Array.isArray(gpuInfo.gpuDevice) ? gpuInfo.gpuDevice.map((device) => ({
    vendorId: Number(device.vendorId) || 0,
    deviceId: Number(device.deviceId) || 0,
    active: Boolean(device.active),
    vendorString: String(device.vendorString || ''),
    deviceString: String(device.deviceString || ''),
    driverVendor: String(device.driverVendor || ''),
    driverVersion: String(device.driverVersion || '')
  })) : [];
  return {
    cpuModel: String(os.cpus()[0]?.model || 'Unknown CPU'),
    logicalProcessors: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    gpuDevices: devices,
    gpuFeatures: app.getGPUFeatureStatus(),
    videoMemoryMb: Number(gpuInfo.videoMemory) || 0,
    machine: os.machine(),
    platform: process.platform
  };
}

app.whenReady().then(() => {
  ipcMain.on('report:renderer-error', (event, error) => {
    if (mainWindow && event.sender === mainWindow.webContents) {
      recordReportIncident('renderer-javascript', error?.message || 'Renderer JavaScript error.', {
        stack: sanitizeReportText(error?.stack || '', 8000),
        kind: sanitizeReportText(error?.kind || 'error', 40)
      });
    }
  });
  ipcMain.handle('report:get-diagnostics', async (_event, rendererSnapshot) => {
    let hardware = null;
    try { hardware = await detectHardware(); } catch (_) { /* Hardware details are optional. */ }
    const configuration = reportingConfiguration();
    return {
      application: {
        name: app.getName(),
        version: app.getVersion(),
        packaged: app.isPackaged,
        electron: process.versions.electron,
        chromium: process.versions.chrome,
        node: process.versions.node
      },
      system: {
        platform: process.platform,
        architecture: process.arch,
        windowsRelease: os.release(),
        windowsVersion: os.version?.() || '',
        uptimeSeconds: Math.round(os.uptime()),
        totalMemoryBytes: os.totalmem(),
        freeMemoryBytes: os.freemem(),
        cpuModel: String(os.cpus()[0]?.model || 'Unknown CPU'),
        logicalProcessors: os.cpus().length,
        gpuDevices: hardware?.gpuDevices || [],
        gpuFeatures: hardware?.gpuFeatures || {}
      },
      renderer: safeRendererDiagnostics(rendererSnapshot),
      incidents: readReportIncidents(),
      submission: { enabled: configuration.enabled },
      projectUrl: reportProjectUrl
    };
  });
  ipcMain.handle('report:clear-incidents', async () => clearReportIncidents());
  ipcMain.handle('report:save', async (_event, reportText) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const result = await dialog.showSaveDialog({
      title: 'Save Quartic Pulse diagnostic report',
      defaultPath: `Quartic-Pulse-Report-${stamp}.txt`,
      filters: [{ name: 'Text report', extensions: ['txt'] }, { name: 'Markdown', extensions: ['md'] }]
    });
    if (result.canceled || !result.filePath) return null;
    const outputPath = /\.(txt|md)$/i.test(result.filePath) ? result.filePath : `${result.filePath}.txt`;
    await fs.promises.writeFile(outputPath, sanitizeReportText(reportText, 60000), 'utf8');
    return outputPath;
  });
  ipcMain.handle('report:print', async (event, reportText) => new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({
      width: 820,
      height: 920,
      parent: BrowserWindow.fromWebContents(event.sender) || undefined,
      modal: false,
      show: false,
      title: 'Print Quartic Pulse Report',
      autoHideMenuBar: true,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
    });
    const html = reportPrintHtml(reportText);
    printWindow.loadURL(`data:text/html;base64,${Buffer.from(html, 'utf8').toString('base64')}`);
    printWindow.webContents.once('did-finish-load', () => {
      printWindow.show();
      printWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
        if (!printWindow.isDestroyed()) printWindow.close();
        if (success) resolve(true);
        else if (/cancel/i.test(failureReason || '')) resolve(false);
        else reject(new Error(failureReason || 'The print dialog could not be opened.'));
      });
    });
  }));
  ipcMain.handle('report:open-issues', async () => {
    await shell.openExternal(`${reportProjectUrl}/issues/new`);
    return true;
  });
  ipcMain.handle('report:submit', async (_event, reportText) => {
    const configuration = reportingConfiguration();
    if (!configuration.enabled) throw new Error('Secure online submission is not configured in this build. Use Copy, Save, Print, or GitHub instead.');
    const now = Date.now();
    if (now - lastReportSubmitTime < 30000) throw new Error('Please wait 30 seconds before submitting another report.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const report = sanitizeReportText(reportText, 50000);
      const reportField = (label, maximum) => sanitizeReportText(report.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'))?.[1] || '', maximum);
      const response = await fetch(configuration.relayUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': `Quartic-Pulse/${app.getVersion()}` },
        body: JSON.stringify({
          schemaVersion: 1,
          project: configuration.project,
          report,
          metadata: {
            reportId: reportField('Report ID', 80),
            category: reportField('Type', 40),
            summary: reportField('Summary', 180),
            version: app.getVersion(),
            platform: process.platform,
            architecture: process.arch
          }
        }),
        signal: controller.signal
      });
      let result = {};
      try { result = await response.json(); } catch (_) { /* A successful relay may return no body. */ }
      if (!response.ok) throw new Error(sanitizeReportText(result?.error || `Report relay returned HTTP ${response.status}.`, 240));
      lastReportSubmitTime = now;
      return { accepted: true, reportId: sanitizeReportText(result?.reportId || reportField('Report ID', 80), 80) };
    } finally { clearTimeout(timeout); }
  });
  ipcMain.handle('profile:export', async (_event, options) => {
    const suggestedName = String(options?.suggestedName || 'quartic-pulse-profile')
      .replace(/[<>:"/\\|?*]/g, '-')
      .slice(0, 80);
    const result = await dialog.showSaveDialog({
      title: 'Export Quartic Pulse profile',
      defaultPath: `${suggestedName}.quartic-pulse.json`,
      filters: [
        { name: 'Quartic Pulse profile', extensions: ['json'] },
        { name: 'JSON file', extensions: ['json'] }
      ]
    });
    if (result.canceled || !result.filePath) return null;
    const outputPath = result.filePath.toLowerCase().endsWith('.json') ? result.filePath : `${result.filePath}.json`;
    await fs.promises.writeFile(outputPath, String(options?.json || ''), 'utf8');
    return outputPath;
  });

  ipcMain.handle('performance-package:export', async (_event, options) => {
    const suggestedName = String(options?.suggestedName || 'quartic-pulse-performance')
      .replace(/[<>:"/\\|?*]/g, '-')
      .slice(0, 80);
    const result = await dialog.showSaveDialog({
      title: 'Export Quartic Pulse performance package',
      defaultPath: `${suggestedName}.quartic-performance.json`,
      filters: [
        { name: 'Quartic Pulse performance package', extensions: ['json'] },
        { name: 'JSON file', extensions: ['json'] }
      ]
    });
    if (result.canceled || !result.filePath) return null;
    const outputPath = result.filePath.toLowerCase().endsWith('.json') ? result.filePath : `${result.filePath}.quartic-performance.json`;
    await fs.promises.writeFile(outputPath, String(options?.json || ''), 'utf8');
    return outputPath;
  });

  ipcMain.handle('capture:save-png', async (_event, bytes) => {
    const buffer = Buffer.from(bytes || []);
    if (!buffer.length || buffer.length > 100 * 1024 * 1024) throw new Error('The screenshot data is invalid.');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const result = await dialog.showSaveDialog({
      title: 'Save Quartic Pulse screenshot',
      defaultPath: `Quartic-Pulse-${stamp}.png`,
      filters: [{ name: 'PNG image', extensions: ['png'] }]
    });
    if (result.canceled || !result.filePath) return null;
    const outputPath = result.filePath.toLowerCase().endsWith('.png') ? result.filePath : `${result.filePath}.png`;
    await fs.promises.writeFile(outputPath, buffer);
    return outputPath;
  });

  ipcMain.on('obs:visual-state', (event, snapshot) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) return;
    if (obsOutputWindow && !obsOutputWindow.isDestroyed()) {
      obsOutputWindow.webContents.send('obs:visual-state', snapshot);
    }
  });
  ipcMain.handle('obs:open-output', async (_event, options) => openObsOutput(options));
  ipcMain.handle('obs:close-output', async () => {
    if (!obsOutputWindow || obsOutputWindow.isDestroyed()) return false;
    obsOutputWindow.close();
    return true;
  });
  ipcMain.handle('obs:get-output-status', async () => Boolean(obsOutputWindow && !obsOutputWindow.isDestroyed()));
  ipcMain.handle('output:get-capabilities', async () => advancedOutputCapabilities());
  ipcMain.handle('performance:get-hardware', async () => detectHardware());
  ipcMain.handle('export:preflight', async (_event, options) => {
    const encoder = await recommendedExportEncoder({ refresh: options?.refreshEncoder === true });
    const duration = Math.max(0, Number(options?.duration) || 0);
    const masterBitrate = Math.max(1000000, Number(options?.masterBitrate) || 12000000);
    const offline = options?.mode !== 'live';
    const masterBytes = offline ? duration * masterBitrate / 8 : 0;
    const estimatedOutputBytes = duration * masterBitrate * (options?.format === 'webm' ? 0.72 : 0.48) / 8;
    const requiredBytes = Math.ceil((masterBytes + estimatedOutputBytes) * 1.18 + 268435456);
    const defaultDestination = app.getPath('videos');
    const freeBytes = await availableDiskBytes(defaultDestination).catch(() => 0);
    return {
      encoder: { id: encoder.id, label: encoder.label, hardware: encoder.hardware },
      masterBytes: Math.ceil(masterBytes),
      estimatedOutputBytes: Math.ceil(estimatedOutputBytes),
      requiredBytes,
      freeBytes,
      defaultDestination
    };
  });
  ipcMain.handle('export:recovery-list', async () => {
    const manifests = await readRecoveryManifests();
    return manifests.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      outputPath: item.outputPath,
      width: item.width,
      height: item.height,
      fps: item.fps,
      encodedFrames: item.encodedFrames,
      tempBytes: item.tempBytes
    }));
  });
  ipcMain.handle('export:recovery-discard', async (_event, id) => {
    const manifests = await readRecoveryManifests();
    const manifest = manifests.find((item) => item.id === String(id));
    if (!manifest) return false;
    await removeRecoveryFiles(manifest);
    return true;
  });
  ipcMain.handle('export:recovery-finish', async (event, id) => {
    const manifests = await readRecoveryManifests();
    const manifest = manifests.find((item) => item.id === String(id));
    if (!manifest) throw new Error('The interrupted export is no longer available.');
    const frames = await inspectAndRepairIvf(manifest.tempPath);
    const encoder = await recommendedExportEncoder();
    const session = {
      ...manifest,
      type: 'offline',
      frameCount: frames,
      frameIndex: frames,
      format: videoFormats[manifest.format] ? manifest.format : 'mp4',
      codec: manifest.codec === 'vp8' ? 'vp8' : 'vp9',
      finalEncoder: encoder.id,
      child: null,
      cancelled: false,
      finishing: true,
      completed: false
    };
    const notify = (stage, progress, message) => {
      if (!event.sender.isDestroyed()) event.sender.send('export:progress', { id: session.id, stage, progress, message });
    };
    await ensureExportDiskSpace(session.outputPath, Math.max(268435456, Number(manifest.tempBytes) || 0));
    try {
      try {
        await muxOfflineVideo(session, session.finalEncoder, (progress) => notify('finalize', progress, `Recovering with ${validatedEncoderProfile(session.finalEncoder).label}...`));
      } catch (hardwareError) {
        if (session.format === 'webm' || session.finalEncoder === 'libx264') throw hardwareError;
        session.finalEncoder = 'libx264';
        await muxOfflineVideo(session, 'libx264', (progress) => notify('finalize', progress, 'Recovering with CPU x264 fallback...'));
      }
      session.completed = true;
      notify('saving', 1, 'Recovered export saved');
      const result = await completedExportDetails(session.outputPath, session.finalEncoder, { recovered: true, partial: true });
      await removeRecoveryFiles(session);
      return result;
    } catch (error) {
      await writeRecoveryManifest(session, { status: 'interrupted', encodedFrames: frames }).catch(() => {});
      throw error;
    }
  });

  ipcMain.handle('audio:list-outputs', async () => listWindowsOutputDevices());
  ipcMain.handle('session:read-audio-file', async (_event, filePath) => {
    const resolved = path.resolve(String(filePath || ''));
    if (!/\.(mp3|wav|flac|m4a|aac|ogg|opus)$/i.test(resolved)) throw new Error('The saved session audio format is not supported.');
    const stat = await fs.promises.stat(resolved).catch(() => null);
    if (!stat?.isFile() || stat.size > 256 * 1024 * 1024) throw new Error('The saved session audio file is unavailable or too large to restore automatically.');
    return { path: resolved, name: path.basename(resolved), lastModified: stat.mtimeMs, bytes: await fs.promises.readFile(resolved) };
  });

  ipcMain.handle('audio:start-output', async (event, deviceId) => {
    if (typeof deviceId !== 'string' || !deviceId) throw new Error('A Windows output device was not selected.');
    const sender = event.sender;
    stopOutputCapture(sender.id);
    const encodedId = Buffer.from(deviceId, 'utf8').toString('base64');
    const child = spawn(audioCaptureExecutable(), ['capture', encodedId], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    outputCaptureProcesses.set(sender.id, child);
    child.stdout.on('data', (chunk) => {
      if (!sender.isDestroyed()) sender.send('audio:output-data', chunk);
    });
    let errorText = '';
    child.stderr.on('data', (chunk) => {
      errorText += chunk.toString();
      const errorLine = errorText.split(/\r?\n/).find((line) => line.startsWith('ERROR '));
      if (errorLine && !sender.isDestroyed()) sender.send('audio:output-error', errorLine.slice(6));
    });
    child.once('close', (code) => {
      if (outputCaptureProcesses.get(sender.id) === child) outputCaptureProcesses.delete(sender.id);
      if (!child.quarticStopped && !sender.isDestroyed()) {
        sender.send('audio:output-stopped', code || 0);
      }
    });
    sender.once('destroyed', () => stopOutputCapture(sender.id));
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    return true;
  });

  ipcMain.handle('audio:stop-output', async (event) => stopOutputCapture(event.sender.id));

  ipcMain.handle('controls:start-osc', async (event, options) => startOscServer(event.sender, options));
  ipcMain.handle('controls:stop-osc', async (event) => {
    if (oscOwnerId !== null && oscOwnerId !== event.sender.id) return false;
    return stopOscServer();
  });

  ipcMain.handle('export:begin', async (_event, options) => {
    const suggested = (options?.suggestedName || 'quartic-pulse').replace(/[<>:"/\\|?*]/g, '-');
    const requestedFormat = videoFormats[options?.format] ? options.format : 'mp4';
    const orderedFormats = [requestedFormat, ...Object.keys(videoFormats).filter((format) => format !== requestedFormat)];
    const result = await dialog.showSaveDialog({
      title: 'Export music visualizer',
      defaultPath: `${suggested}.${requestedFormat}`,
      filters: orderedFormats.map((format) => ({ name: videoFormats[format].name, extensions: [format] }))
    });
    if (result.canceled || !result.filePath) return null;

    const chosenExtension = path.extname(result.filePath).slice(1).toLowerCase();
    const format = videoFormats[chosenExtension] ? chosenExtension : requestedFormat;
    const outputPath = videoFormats[chosenExtension] ? result.filePath : `${result.filePath}.${format}`;

    const id = crypto.randomUUID();
    const tempPath = path.join(os.tmpdir(), `quartic-pulse-${id}.webm`);
    await ensureExportDiskSpace(outputPath, options?.requiredBytes);
    const encoder = await recommendedExportEncoder();
    const requestedEncoder = options?.finalEncoder ? validatedEncoderProfile(options.finalEncoder) : null;
    const finalEncoder = requestedEncoder && (requestedEncoder.id === encoder.id || requestedEncoder.id === 'libx264') ? requestedEncoder.id : encoder.id;
    const session = {
      id,
      outputPath,
      format,
      tempPath,
      stream: fs.createWriteStream(tempPath),
      finalEncoder
    };
    exportSessions.set(id, session);
    return { id, outputPath };
  });

  ipcMain.handle('export:append', async (_event, id, bytes) => {
    const session = exportSessions.get(id);
    if (!session) throw new Error('Export session was not found.');
    const buffer = Buffer.from(bytes);
    if (!session.stream.write(buffer)) {
      await new Promise((resolve) => session.stream.once('drain', resolve));
    }
    return true;
  });

  ipcMain.handle('export:finish', async (event, id) => {
    const session = exportSessions.get(id);
    if (!session) throw new Error('Export session was not found.');
    const notify = (stage, progress, message) => {
      if (!event.sender.isDestroyed()) event.sender.send('export:progress', { id, stage, progress, message });
    };
    const destinationName = /onedrive/i.test(session.outputPath) ? 'OneDrive' : 'the selected folder';
    try {
      notify('finalize', 0, 'Closing the recording stream...');
      await closeSession(session);
      if (session.format !== 'webm') {
        try {
          try {
            await transcodeVideo(session.tempPath, session.outputPath, session.format, session.finalEncoder, (progress) => {
              notify('finalize', progress, `Encoding with ${validatedEncoderProfile(session.finalEncoder).label} and writing to ${destinationName}...`);
            });
          } catch (hardwareError) {
            if (session.finalEncoder === 'libx264') throw hardwareError;
            notify('finalize', 0, 'Hardware encoding failed; retrying safely with CPU x264...');
            session.finalEncoder = 'libx264';
            await transcodeVideo(session.tempPath, session.outputPath, session.format, 'libx264', (progress) => {
              notify('finalize', progress, `CPU fallback encoding and writing the final video to ${destinationName}...`);
            });
          }
        } catch (error) {
          const fallbackPath = session.outputPath.replace(/\.[^.]+$/i, '.webm');
          await copyFileWithProgress(session.tempPath, fallbackPath, (progress) => {
            notify('saving', progress, 'Saving the WebM fallback...');
          });
          return completedExportDetails(fallbackPath, session.finalEncoder, {
            warning: `${error.message} The recording was preserved as WebM instead.`
          });
        } finally {
          await fs.promises.unlink(session.tempPath).catch(() => {});
        }
      } else {
        await copyFileWithProgress(session.tempPath, session.outputPath, (progress) => {
          notify('saving', progress, 'Saving the final WebM file...');
        });
        await fs.promises.unlink(session.tempPath).catch(() => {});
      }
      notify('saving', 1, 'Final file saved');
      return completedExportDetails(session.outputPath, session.finalEncoder);
    } finally {
      exportSessions.delete(id);
    }
  });

  ipcMain.handle('export:abort', async (_event, id) => {
    const session = exportSessions.get(id);
    if (!session) return false;
    session.stream?.destroy();
    await fs.promises.unlink(session.tempPath).catch(() => {});
    exportSessions.delete(id);
    return true;
  });

  ipcMain.handle('export:offline-begin', async (_event, options) => {
    await verifyFfmpeg();
    const width = Math.max(320, Math.min(7680, Math.round(Number(options?.width) || 1920)));
    const height = Math.max(240, Math.min(4320, Math.round(Number(options?.height) || 1080)));
    const fps = [30, 60, 90, 120].includes(Number(options?.fps)) ? Number(options.fps) : 60;
    const frameCount = Math.max(1, Math.min(10000000, Math.round(Number(options?.frameCount) || fps)));
    const codec = options?.codec === 'vp8' ? 'vp8' : 'vp9';
    const audioPath = path.resolve(String(options?.audioPath || ''));
    const audioStat = await fs.promises.stat(audioPath).catch(() => null);
    if (!audioStat?.isFile()) throw new Error('The selected local audio file could not be opened for offline export.');
    const suggested = String(options?.suggestedName || 'quartic-pulse').replace(/[<>:"/\\|?*]/g, '-').slice(0, 100);
    const requestedFormat = videoFormats[options?.format] ? options.format : 'mp4';
    const result = await dialog.showSaveDialog({
      title: 'Export offline music visualizer',
      defaultPath: `${suggested}.${requestedFormat}`,
      filters: Object.entries(videoFormats).map(([format, details]) => ({ name: details.name, extensions: [format] }))
    });
    if (result.canceled || !result.filePath) return null;
    const chosenExtension = path.extname(result.filePath).slice(1).toLowerCase();
    const format = videoFormats[chosenExtension] ? chosenExtension : requestedFormat;
    const outputPath = videoFormats[chosenExtension] ? result.filePath : `${result.filePath}.${format}`;
    const id = crypto.randomUUID();
    const tempPath = path.join(os.tmpdir(), `quartic-pulse-offline-${id}.ivf`);
    await ensureExportDiskSpace(outputPath, options?.requiredBytes);
    const encoder = await recommendedExportEncoder();
    const requestedEncoder = options?.finalEncoder ? validatedEncoderProfile(options.finalEncoder) : null;
    const finalEncoder = requestedEncoder && (requestedEncoder.id === encoder.id || requestedEncoder.id === 'libx264') ? requestedEncoder.id : encoder.id;
    const stream = fs.createWriteStream(tempPath);
    const session = { id, type: 'offline', outputPath, format, tempPath, audioPath, width, height, fps, frameCount, codec, frameIndex: 0, stream, child: null, finishing: false, cancelled: false, completed: false, finalEncoder, createdAt: new Date().toISOString() };
    stream.write(createIvfHeader(session));
    exportSessions.set(id, session);
    await writeRecoveryManifest(session, { status: 'rendering' });
    return { id, outputPath };
  });

  ipcMain.handle('export:offline-frame', async (_event, id, bytes) => {
    const session = exportSessions.get(id);
    if (!session || session.type !== 'offline') throw new Error('Offline export session was not found.');
    const frame = Buffer.from(bytes || []);
    if (!frame.length || frame.length > 64 * 1024 * 1024) throw new Error('An encoded offline frame was invalid.');
    const frameHeader = Buffer.alloc(12);
    frameHeader.writeUInt32LE(frame.length, 0);
    frameHeader.writeBigUInt64LE(BigInt(session.frameIndex++), 4);
    if (!session.stream.write(frameHeader) || !session.stream.write(frame)) {
      await new Promise((resolve) => session.stream.once('drain', resolve));
    }
    if (session.frameIndex === 1 || session.frameIndex % Math.max(1, session.fps) === 0) {
      await writeRecoveryManifest(session, { status: 'rendering' });
    }
    return session.frameIndex;
  });

  ipcMain.handle('export:offline-finish', async (event, id, options) => {
    const session = exportSessions.get(id);
    if (!session || session.type !== 'offline') throw new Error('Offline export session was not found.');
    session.finishing = true;
    const notify = (stage, progress, message) => {
      if (!event.sender.isDestroyed()) event.sender.send('export:progress', { id, stage, progress, message });
    };
    const destinationName = /onedrive/i.test(session.outputPath) ? 'OneDrive' : 'the selected folder';
    try {
      notify('finalize', 0, 'Closing the encoded frame stream...');
      await closeSession(session);
      if (session.cancelled) throw new Error('Offline export cancelled.');
      const expectedFrameCount = session.frameCount;
      const requestedFrameCount = Math.max(0, Math.round(Number(options?.renderedFrameCount) || 0));
      const allowPartial = options?.allowPartial === true;
      if (allowPartial && session.frameIndex > 0 && session.frameIndex < expectedFrameCount) {
        if (requestedFrameCount && requestedFrameCount !== session.frameIndex) {
          throw new Error(`Offline export frame count mismatch (${session.frameIndex} encoded, ${requestedFrameCount} rendered).`);
        }
        session.frameCount = session.frameIndex;
        await updateIvfFrameCount(session.tempPath, session.frameCount);
        notify('finalize', 0, `Finishing shortened export at ${(session.frameCount / session.fps).toFixed(1)} seconds...`);
      } else if (session.frameIndex !== expectedFrameCount) {
        throw new Error(`Offline export received ${session.frameIndex} of ${expectedFrameCount} frames.`);
      }
      try {
        try {
          await muxOfflineVideo(session, session.finalEncoder, (progress) => {
            notify('finalize', progress, `Encoding with ${validatedEncoderProfile(session.finalEncoder).label} and writing to ${destinationName}...`);
          });
        } catch (hardwareError) {
          if (session.format === 'webm' || session.finalEncoder === 'libx264' || session.cancelled) throw hardwareError;
          notify('finalize', 0, 'Hardware encoding failed; retrying safely with CPU x264...');
          session.finalEncoder = 'libx264';
          await muxOfflineVideo(session, 'libx264', (progress) => {
            notify('finalize', progress, `CPU fallback encoding and writing the final video to ${destinationName}...`);
          });
        }
        if (session.cancelled) throw new Error('Offline export cancelled.');
        notify('saving', 1, 'Final file saved');
        session.completed = true;
        return completedExportDetails(session.outputPath, session.finalEncoder, { partial: session.frameCount < expectedFrameCount });
      } catch (error) {
        if (session.cancelled) throw error;
        const fallbackPath = session.outputPath.replace(/\.[^.]+$/i, '.video-only.ivf');
        await copyFileWithProgress(session.tempPath, fallbackPath, (progress) => {
          notify('saving', progress, 'Saving the video-only fallback...');
        });
        session.completed = true;
        return completedExportDetails(fallbackPath, session.finalEncoder, {
          warning: `${error.message} The complete encoded video stream was preserved without audio.`
        });
      }
    } finally {
      if (session.cancelled) await fs.promises.unlink(session.outputPath).catch(() => {});
      exportSessions.delete(id);
      if (session.completed || session.cancelled) await removeRecoveryFiles(session);
      else await writeRecoveryManifest(session, { status: 'interrupted' }).catch(() => {});
    }
  });

  ipcMain.handle('export:offline-abort', async (_event, id) => {
    const session = exportSessions.get(id);
    if (!session || session.type !== 'offline') return false;
    session.cancelled = true;
    session.child?.kill();
    if (session.finishing) return true;
    session.stream?.destroy();
    exportSessions.delete(id);
    await removeRecoveryFiles(session);
    return true;
  });

  ipcMain.handle('export:reveal', async (_event, filePath) => {
    shell.showItemInFolder(filePath);
  });
  ipcMain.handle('export:open', async (_event, filePath) => {
    const resolved = path.resolve(String(filePath || ''));
    const stat = await fs.promises.stat(resolved).catch(() => null);
    if (!stat?.isFile()) throw new Error('The exported file could not be found.');
    const error = await shell.openPath(resolved);
    if (error) throw new Error(error);
    return true;
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('child-process-gone', (_event, details) => {
  recordReportIncident('electron-child-process-gone', details.reason || 'Electron child process ended.', {
    type: details.type,
    reason: details.reason,
    exitCode: details.exitCode,
    serviceName: details.serviceName || ''
  });
});

app.on('before-quit', () => {
  stopOscServer();
  for (const webContentsId of outputCaptureProcesses.keys()) stopOutputCapture(webContentsId);
  for (const session of exportSessions.values()) {
    session.child?.kill();
    session.stream?.destroy();
    if (session.type === 'offline' && !session.completed && !session.cancelled) {
      writeRecoveryManifest(session, { status: 'interrupted' }).catch(() => {});
    } else {
      fs.promises.unlink(session.tempPath).catch(() => {});
    }
  }
});
