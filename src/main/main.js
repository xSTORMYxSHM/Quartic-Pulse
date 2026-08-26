const { app, BrowserWindow, desktopCapturer, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, spawn } = require('child_process');
const crypto = require('crypto');
const dgram = require('dgram');
const { pipeline } = require('stream/promises');
const exportProfileCatalog = require('../shared/export-profiles');
const { VisualizerPackageManager, styleIdFor } = require('./visualizer-package-manager');
const {
  videoFormats,
  normalizeRequestedFormat,
  saveDialogFilters,
  resolveOutputSelection
} = require('./export-format-policy');

const quarticPulseAppUserModelId = 'com.tempestmainframe.quarticpulse';
if (process.platform === 'win32') app.setAppUserModelId(quarticPulseAppUserModelId);

const exportSessions = new Map();
const outputCaptureProcesses = new Map();
let cachedWindowsOutputDevices = [];
let mainWindow = null;
let obsOutputWindow = null;
let oscSocket = null;
let oscOwnerId = null;
let cachedExportEncoder = null;
const cachedFixedExportEncoders = new Map();
let lastReportSubmitTime = 0;
let smokeCustomVisualizerStyleId = 0;
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
  const requestedSmokeStyle = smokeCustomVisualizerStyleId
    || Math.max(0, Math.min(6, Number.parseInt(smokeStyleArgument?.split('=')[1] || '0', 10) || 0));
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
              && Boolean(document.querySelector('#deckOutputSelect'))
              && Boolean(document.querySelector('#deckOutputOptions'))
              && Boolean(document.querySelector('#useAudioSourceButton'))
              && Boolean(document.querySelector('#refreshAudioSourcesButton'));
            const windowsOutputCount = document.querySelector('#audioOutputOptions')?.children.length || 0;
            const deckOutputRoutingReady = typeof AudioContext?.prototype?.setSinkId === 'function';
            const appearanceNavigationReady = document.querySelectorAll('.appearance-subtab').length === 5
              && Boolean(document.querySelector('[data-tab-panel="dimensional"]'))
              && Boolean(document.querySelector('[data-tab-panel="folding"]'))
              && Boolean(document.querySelector('[data-tab-panel="mapping"]'))
              && [...document.querySelectorAll('[data-tab-panel="dimensional"] details, [data-tab-panel="folding"] details, [data-tab-panel="reactivity"] details')]
                .every((details) => !details.open);
            const modulationMatrixReady = Boolean(document.querySelector('#modulationEnabled'))
              && Boolean(document.querySelector('#modulationRouteList'))
              && Boolean(document.querySelector('#addModulationRoute'))
              && Boolean(document.querySelector('#modulationVisualSupport'))
              && document.querySelectorAll('[data-modulation-preset]').length === 5
              && Boolean(window.QuarticAudioModulationEngine?.create)
              && Boolean(window.QuarticAudioModulationController?.create);
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
            const offlineExportReady = Boolean(document.querySelector('#exportMode option[value="offline"]'))
              && !document.querySelector('#exportMode option[value="live"]')
              && Boolean(document.querySelector('#videoFormat option[value="gpu_auto"]'))
              && Boolean(document.querySelector('#videoFormat option[value="youtube_hdr"]'))
              && Boolean(document.querySelector('#videoFormat option[value="mp4_compatible"]'))
              && Boolean(document.querySelector('#videoFormat option[value="webm_quality"]'))
              && Boolean(document.querySelector('#videoFormat option[value="av1_quality"]'))
              && Boolean(document.querySelector('#videoFormat option[value="prores_422_hq"]'))
              && Boolean(document.querySelector('#videoFormat option[value="png_sequence"]'))
              && Boolean(document.querySelector('#videoFormat option[value="utvideo"]'))
              && Boolean(document.querySelector('#videoFormat option[value="ffv1"]'))
              && Boolean(document.querySelector('#exportHdrOutput'))
              && Boolean(document.querySelector('#exportSupersampling'))
              && window.__quarticHdrExportReady === true
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
              && Boolean(document.querySelector('#preflightFormat'))
              && Boolean(document.querySelector('#preflightColor'))
              && Boolean(document.querySelector('#preflightBitrate'))
              && Boolean(document.querySelector('#preflightTestButton'))
              && Boolean(document.querySelector('#exportEncoderStatus'))
              && Boolean(document.querySelector('#exportEncoderCapabilities'))
              && Boolean(document.querySelector('#scanExportEncodersButton'))
              && typeof window.quarticDesktop?.getExportEncoderCapabilities === 'function'
              && Boolean(document.querySelector('#exportReadinessBenchmark'))
              && Boolean(document.querySelector('#benchmarkExportButton'))
              && Boolean(document.querySelector('#exportAdvisor'))
              && Boolean(document.querySelector('#exportAdvisorList'))
              && typeof window.quarticDesktop?.benchmarkExportEncoder === 'function';
            const exportSamplingReady = document.querySelector('#exportIterations')?.defaultValue === '600'
              && document.querySelector('#exportIterations')?.min === '240'
              && document.querySelector('#exportIterations')?.max === '1200'
              && document.querySelector('#exportSupersampling')?.defaultChecked === false
              && typeof window.__quarticRecommendedExportIterations === 'function'
              && window.__quarticRecommendedExportIterations(854, 480) === 320
              && window.__quarticRecommendedExportIterations(1280, 720) === 400
              && window.__quarticRecommendedExportIterations(1920, 1080) === 600
              && window.__quarticRecommendedExportIterations(2560, 1440) === 800
              && window.__quarticRecommendedExportIterations(3840, 2160) === 1000
              && typeof window.__quarticEffectiveExportIterations === 'function'
              && window.__quarticEffectiveExportIterations(3840, 2160, 740) === 740
              && window.__quarticTestExportSampling?.() === true;
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
            if (visualStyle && visualStyle.options.length >= 7) {
              for (const value of ['1', '2', '3', '4', '5', '6']) {
                visualStyle.value = value;
                visualStyle.dispatchEvent(new Event('change', { bubbles: true }));
              }
              visualStyles = visualStyle.value === '6';
              visualStyle.value = '${requestedSmokeStyle}';
              visualStyle.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (Number('${requestedSmokeStyle}') >= 1000) await new Promise((resolve) => setTimeout(resolve, 900));
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
            let av1PreflightReady = !${process.argv.includes('--smoke-av1')};
            let av1Encoder = null;
            if (${process.argv.includes('--smoke-av1')}) {
              const formatSelect = document.querySelector('#videoFormat');
              const av1Option = formatSelect?.querySelector('option[value="av1_quality"]');
              if (formatSelect && av1Option && !av1Option.hidden) {
                formatSelect.value = 'av1_quality';
                formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
                const av1Preflight = await window.quarticDesktop.getExportPreflight({
                  format: 'av1_quality', width: 320, height: 240, fps: 30, duration: 1, refreshEncoder: true
                });
                av1Encoder = av1Preflight?.encoder || null;
                av1PreflightReady = av1Preflight?.profile?.id === 'av1_quality'
                  && ['av1_nvenc', 'av1_qsv', 'av1_amf', 'libaom_av1'].includes(av1Encoder?.id)
                  && (av1Encoder?.hardware || Boolean(av1Encoder?.warning));
              }
            }
            let automaticGpuPreflightReady = !${process.argv.includes('--smoke-auto-gpu')};
            let automaticGpuEncoder = null;
            if (${process.argv.includes('--smoke-auto-gpu')}) {
              const formatSelect = document.querySelector('#videoFormat');
              const automaticOption = formatSelect?.querySelector('option[value="gpu_auto"]');
              if (formatSelect && automaticOption && !automaticOption.hidden) {
                formatSelect.value = 'gpu_auto';
                formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
                const automaticPreflight = await window.quarticDesktop.getExportPreflight({
                  format: 'gpu_auto', width: 320, height: 240, fps: 30, duration: 1, refreshEncoder: true
                });
                automaticGpuEncoder = automaticPreflight?.encoder || null;
                automaticGpuPreflightReady = automaticPreflight?.profile?.id === 'gpu_auto'
                  && ['av1_nvenc', 'av1_qsv', 'av1_amf', 'hevc_nvenc_auto', 'hevc_qsv_auto', 'hevc_amf_auto', 'libx265_auto'].includes(automaticGpuEncoder?.id)
                  && automaticGpuEncoder?.id !== 'libaom_av1'
                  && (automaticGpuEncoder?.hardware || Boolean(automaticGpuEncoder?.warning));
              }
            }
            let encoderCapabilityScanReady = !${process.argv.includes('--smoke-encoder-scan')};
            let encoderCapabilityRowCount = 0;
            if (${process.argv.includes('--smoke-encoder-scan')}) {
              const capabilityCard = document.querySelector('#exportEncoderCapabilities');
              capabilityCard?.setAttribute('open', '');
              document.querySelector('#scanExportEncodersButton')?.click();
              for (let attempt = 0; attempt < 200; attempt++) {
                encoderCapabilityRowCount = document.querySelectorAll('.export-encoder-capability-row').length;
                if (encoderCapabilityRowCount > 0 && !document.querySelector('#scanExportEncodersButton')?.disabled) break;
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
              encoderCapabilityScanReady = encoderCapabilityRowCount >= 3
                && Boolean(document.querySelector('.export-encoder-capability-row.selected'))
                && document.querySelector('#exportEncoderDecision')?.textContent.includes('Automatic selected');
            }
            let exportBenchmarkReady = !${process.argv.includes('--smoke-export-benchmark')};
            let exportBenchmarkSnapshot = null;
            if (${process.argv.includes('--smoke-export-benchmark')}) {
              const formatSelect = document.querySelector('#videoFormat');
              if (formatSelect?.querySelector('option[value="gpu_auto"]')) {
                formatSelect.value = 'gpu_auto';
                formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
              }
              document.querySelector('#exportReadinessBenchmark')?.setAttribute('open', '');
              document.querySelector('#benchmarkExportButton')?.click();
              for (let attempt = 0; attempt < 350; attempt++) {
                if (document.querySelector('#exportReadinessSummary')?.dataset.complete === 'true'
                  && !document.querySelector('#benchmarkExportButton')?.disabled) break;
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
              exportBenchmarkSnapshot = {
                summary: document.querySelector('#exportReadinessSummary')?.textContent || '',
                encoderFps: document.querySelector('#benchmarkEncoderFps')?.textContent || '',
                renderFps: document.querySelector('#benchmarkRenderFps')?.textContent || '',
                bottleneck: document.querySelector('#benchmarkBottleneck')?.textContent || '',
                minuteTime: document.querySelector('#benchmarkMinuteTime')?.textContent || ''
              };
              exportBenchmarkReady = document.querySelector('#exportReadinessSummary')?.dataset.complete === 'true'
                && /FPS/.test(exportBenchmarkSnapshot.encoderFps)
                && /FPS/.test(exportBenchmarkSnapshot.renderFps)
                && exportBenchmarkSnapshot.minuteTime !== '—';
            }
            let exportAdvisorReady = !${process.argv.includes('--smoke-export-advisor')};
            let exportAdvisorOptionCount = 0;
            if (${process.argv.includes('--smoke-export-advisor')}) {
              const advisorOptions = Array.from(document.querySelectorAll('.export-advisor-option'));
              exportAdvisorOptionCount = advisorOptions.length;
              const balanced = advisorOptions.find((button) => button.textContent.includes('BALANCED MASTER'));
              const expected = balanced ? {
                resolution: balanced.dataset.resolution,
                fps: balanced.dataset.fps,
                iterations: balanced.dataset.iterations
              } : null;
              balanced?.click();
              exportAdvisorReady = exportAdvisorOptionCount === 3
                && Boolean(expected)
                && document.querySelector('#resolution')?.value === expected.resolution
                && document.querySelector('#fps')?.value === expected.fps
                && document.querySelector('#exportIterations')?.value === expected.iterations
                && document.querySelector('#exportReadinessSummary')?.textContent.includes('Settings changed');
            }
            if (${process.argv.includes('--smoke-scroll-export-advisor')}) {
              document.querySelector('#exportAdvisor')?.scrollIntoView({ block: 'center' });
            }
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
              window.QuarticVisualCatalog?.styles?.length >= 7
              && window.QuarticVisualCatalog.validate()
              && window.QuarticVisualCatalog.get(5)?.key === 'mandelbulb'
            );
            const exportOfflinePresentationReady = Boolean(
              window.__quarticControllers?.export?.diagnostics?.offlineStateReady
              && typeof window.__quarticControllers.export.renderOfflineState === 'function'
            );
            const exportLivePresentationReady = Boolean(
              window.__quarticControllers?.export?.diagnostics?.liveStateReady
              && typeof window.__quarticControllers.export.renderLiveState === 'function'
            );
            const controllerModulesReady = Boolean(
              window.QuarticAudioController
              && window.QuarticAudioSourceController
              && window.QuarticPerformanceController
              && window.QuarticExportController
              && window.QuarticSongDirectorController
              && window.QuarticSongMapController
              && window.QuarticAudioModulationEngine
              && window.QuarticAudioModulationController
              && window.QuarticMusicPersonalityController
              && window.QuarticVisualPresetController
              && window.QuarticPerformanceShowController
              && window.QuarticPerformancePackageSessionController
              && window.QuarticProfileServiceController
              && window.QuarticOperatorToolsController
              && window.QuarticWorkspaceUiController
              && window.QuarticShowComposerOrchestrator
              && window.__quarticControllers?.modulation?.diagnostics?.ready
              && window.__quarticControllers.modulation.diagnostics.bound
              && window.__quarticControllers.modulation.diagnostics.initialized
              && window.__quarticControllers?.musicPersonality?.diagnostics?.ready
              && window.__quarticControllers.musicPersonality.diagnostics.bound
              && window.__quarticControllers.musicPersonality.diagnostics.initialized
              && window.__quarticControllers?.visualPresets?.diagnostics?.ready
              && window.__quarticControllers.visualPresets.diagnostics.bound
              && window.__quarticControllers.visualPresets.diagnostics.initialized
              && window.__quarticControllers?.performanceShow?.diagnostics?.ready
              && window.__quarticControllers.performanceShow.diagnostics.showBound
              && window.__quarticControllers.performanceShow.diagnostics.showInitialized
              && window.__quarticControllers.performanceShow.diagnostics.performanceBound
              && window.__quarticControllers.performanceShow.diagnostics.performanceInitialized
              && window.QuarticDataHorizonRuntime
              && window.QuarticVisualizerPackageController
              && window.__quarticControllers?.audio?.diagnostics?.ready
              && window.__quarticControllers.audio.diagnostics.bound
              && window.__quarticControllers?.audioSource?.diagnostics?.initialized
              && window.__quarticControllers?.songMap?.diagnostics?.initialized
              && window.__quarticControllers?.performancePackage?.diagnostics?.packagesInitialized
              && window.__quarticControllers?.profileService?.diagnostics?.initialized
              && window.__quarticControllers?.performance?.diagnostics?.ready
              && window.__quarticControllers.performance.diagnostics.bound
              && window.__quarticControllers?.export?.diagnostics?.ready
              && window.__quarticControllers.export.diagnostics.presentationReady
              && window.__quarticControllers.export.diagnostics.preflightChoiceReady
              && window.__quarticControllers.export.diagnostics.benchmarkStateReady
              && window.__quarticControllers.export.diagnostics.encoderScanStateReady
              && window.__quarticControllers.export.diagnostics.advisorApplicationReady
              && window.__quarticControllers.export.diagnostics.recoveryStateReady
              && exportOfflinePresentationReady
              && exportLivePresentationReady
              && window.__quarticControllers.export.diagnostics.bound
              && window.__quarticControllers?.songDirector?.diagnostics?.ready
              && window.__quarticControllers.songDirector.diagnostics.bound
              && window.__quarticControllers.songDirector.diagnostics.initialized
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
            const paletteLibraryReady = Boolean(
              window.QuarticPaletteLibraryController
              && window.__quarticControllers?.paletteLibrary?.diagnostics?.ready
              && window.__quarticControllers.paletteLibrary.diagnostics.bound
              && typeof window.__quarticControllers.paletteLibrary.render === 'function'
              && document.querySelector('#savedPaletteGrid')
              && document.querySelector('#saveCurrentPaletteButton')
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
            const exportProgressWorkflowEngineReady = Boolean(
              window.QuarticExportProgressWorkflowEngine
              && window.__quarticEngines?.exportProgressWorkflow?.diagnostics?.ready
              && typeof window.__quarticEngines.exportProgressWorkflow.begin === 'function'
              && typeof window.__quarticEngines.exportProgressWorkflow.update === 'function'
              && typeof window.__quarticEngines.exportProgressWorkflow.handleNative === 'function'
              && typeof window.__quarticEngines.exportProgressWorkflow.complete === 'function'
              && await window.__quarticEngines.exportProgressWorkflow.selfTest()
            );
            const exportProgressCoordinatorReady = Boolean(
              window.QuarticExportProgressCoordinator
              && window.__quarticEngines?.exportProgressCoordinator?.diagnostics?.ready
              && window.__quarticEngines.exportProgressCoordinator.diagnostics.nativeListenerBound
              && typeof window.__quarticEngines.exportProgressCoordinator.begin === 'function'
              && typeof window.__quarticEngines.exportProgressCoordinator.update === 'function'
              && typeof window.__quarticEngines.exportProgressCoordinator.handleNative === 'function'
              && typeof window.__quarticEngines.exportProgressCoordinator.complete === 'function'
              && typeof window.__quarticEngines.exportProgressCoordinator.unbindNative === 'function'
              && await window.__quarticEngines.exportProgressCoordinator.selfTest()
            );
            const exportCommandCoordinatorReady = Boolean(
              window.QuarticExportCommandCoordinator
              && window.__quarticEngines?.exportCommandCoordinator?.diagnostics?.ready
              && typeof window.__quarticEngines.exportCommandCoordinator.togglePause === 'function'
              && typeof window.__quarticEngines.exportCommandCoordinator.finish === 'function'
              && typeof window.__quarticEngines.exportCommandCoordinator.cancel === 'function'
              && await window.__quarticEngines.exportCommandCoordinator.selfTest()
            );
            const exportJobCoordinatorReady = Boolean(
              window.QuarticExportJobCoordinator
              && window.__quarticEngines?.exportJobCoordinator?.diagnostics?.ready
              && typeof window.__quarticEngines.exportJobCoordinator.startOffline === 'function'
              && typeof window.__quarticEngines.exportJobCoordinator.startLive === 'function'
              && await window.__quarticEngines.exportJobCoordinator.selfTest()
            );
            const exportResultWorkflowEngineReady = Boolean(
              window.QuarticExportResultWorkflowEngine
              && window.__quarticEngines?.exportResultWorkflow?.diagnostics?.ready
              && typeof window.__quarticEngines.exportResultWorkflow.complete === 'function'
              && typeof window.__quarticEngines.exportResultWorkflow.reset === 'function'
              && typeof window.__quarticEngines.exportResultWorkflow.reveal === 'function'
              && await window.__quarticEngines.exportResultWorkflow.selfTest()
            );
            const exportSamplingEngineReady = Boolean(
              window.QuarticExportSamplingEngine
              && window.__quarticEngines?.exportSampling?.diagnostics?.ready
              && window.__quarticEngines.exportSampling.diagnostics.sampleCount === 4
              && typeof window.__quarticEngines.exportSampling.recommendedIterations === 'function'
              && typeof window.__quarticEngines.exportSampling.createFrameBuffers === 'function'
              && typeof window.__quarticEngines.exportSampling.resolve === 'function'
              && window.__quarticEngines.exportSampling.selfTest()
            );
            const exportSettingsSnapshotEngineReady = Boolean(
              window.QuarticExportSettingsSnapshotEngine
              && window.__quarticEngines?.exportSettingsSnapshot?.diagnostics?.ready
              && typeof window.__quarticEngines.exportSettingsSnapshot.capture === 'function'
              && typeof window.__quarticEngines.exportSettingsSnapshot.preflight === 'function'
              && typeof window.__quarticControllers?.export?.readSettings === 'function'
              && window.__quarticEngines.exportSettingsSnapshot.selfTest()
            );
            const exportPreparationEngineReady = Boolean(
              window.QuarticExportPreparationEngine
              && window.__quarticEngines?.exportPreparation?.diagnostics?.ready
              && typeof window.__quarticEngines.exportPreparation.prepareOffline === 'function'
              && typeof window.__quarticEngines.exportPreparation.prepareLive === 'function'
              && await window.__quarticEngines.exportPreparation.selfTest()
            );
            const exportFrameCaptureEngineReady = Boolean(
              window.QuarticExportFrameCaptureEngine
              && window.__quarticEngines?.exportFrameCapture?.diagnostics?.ready
              && typeof window.__quarticEngines.exportFrameCapture.createCapture === 'function'
              && await window.__quarticEngines.exportFrameCapture.selfTest()
            );
            const exportPlanningEngineReady = Boolean(
              window.QuarticExportPlanningEngine
              && window.__quarticEngines?.exportPlanning?.diagnostics?.ready
              && typeof window.__quarticEngines.exportPlanning.profileEstimate === 'function'
              && typeof window.__quarticEngines.exportPlanning.modeledRenderFps === 'function'
              && typeof window.__quarticEngines.exportPlanning.interpretBenchmark === 'function'
              && typeof window.__quarticEngines.exportPlanning.advisorRecommendations === 'function'
              && window.__quarticEngines.exportPlanning.selfTest()
            );
            const exportPresentationEngineReady = Boolean(
              window.QuarticExportPresentationEngine
              && window.__quarticEngines?.exportPresentation?.diagnostics?.ready
              && typeof window.__quarticEngines.exportPresentation.performanceView === 'function'
              && typeof window.__quarticEngines.exportPresentation.preflightView === 'function'
              && typeof window.__quarticEngines.exportPresentation.historyView === 'function'
              && window.__quarticEngines.exportPresentation.selfTest()
            );
            const exportPreflightEngineReady = Boolean(
              window.QuarticExportPreflightEngine
              && window.__quarticEngines?.exportPreflight?.diagnostics?.ready
              && typeof window.__quarticEngines.exportPreflight.build === 'function'
              && typeof window.__quarticEngines.exportPreflight.load === 'function'
              && typeof window.__quarticEngines.exportPreflight.refresh === 'function'
              && await window.__quarticEngines.exportPreflight.selfTest()
            );
            const exportAdvisorEngineReady = Boolean(
              window.QuarticExportAdvisorEngine
              && window.__quarticEngines?.exportAdvisor?.diagnostics?.ready
              && typeof window.__quarticEngines.exportAdvisor.normalize === 'function'
              && typeof window.__quarticEngines.exportAdvisor.apply === 'function'
              && await window.__quarticEngines.exportAdvisor.selfTest()
            );
            const exportSettingsCoordinatorEngineReady = Boolean(
              window.QuarticExportSettingsCoordinatorEngine
              && window.__quarticEngines?.exportSettingsCoordinator?.diagnostics?.ready
              && typeof window.__quarticEngines.exportSettingsCoordinator.change === 'function'
              && typeof window.__quarticEngines.exportSettingsCoordinator.applyAdvisor === 'function'
              && typeof window.__quarticControllers?.export?.readSettingChoices === 'function'
              && await window.__quarticEngines.exportSettingsCoordinator.selfTest()
            );
            const exportRuntimeStateCoordinatorReady = Boolean(
              window.QuarticExportRuntimeStateCoordinator
              && window.__quarticEngines?.exportRuntimeState?.diagnostics?.ready
              && typeof window.__quarticEngines.exportRuntimeState.activate === 'function'
              && typeof window.__quarticEngines.exportRuntimeState.markFinalizing === 'function'
              && typeof window.__quarticEngines.exportRuntimeState.restore === 'function'
              && await window.__quarticEngines.exportRuntimeState.selfTest()
            );
            const exportEncoderScanEngineReady = Boolean(
              window.QuarticExportEncoderScanEngine
              && window.__quarticEngines?.exportEncoderScan?.diagnostics?.ready
              && typeof window.__quarticEngines.exportEncoderScan.run === 'function'
              && await window.__quarticEngines.exportEncoderScan.selfTest()
            );
            const exportBenchmarkEngineReady = Boolean(
              window.QuarticExportBenchmarkEngine
              && window.__quarticEngines?.exportBenchmark?.diagnostics?.ready
              && typeof window.__quarticEngines.exportBenchmark.run === 'function'
              && await window.__quarticEngines.exportBenchmark.selfTest()
            );
            const exportHistoryEngineReady = Boolean(
              window.QuarticExportHistoryEngine
              && window.__quarticEngines?.exportHistory?.diagnostics?.ready
              && typeof window.__quarticEngines.exportHistory.load === 'function'
              && typeof window.__quarticEngines.exportHistory.record === 'function'
              && typeof window.__quarticEngines.exportHistory.normalizeRecoveries === 'function'
              && window.__quarticEngines.exportHistory.selfTest()
            );
            const exportHistoryActionEngineReady = Boolean(
              window.QuarticExportHistoryActionEngine
              && window.__quarticEngines?.exportHistoryAction?.diagnostics?.ready
              && typeof window.__quarticEngines.exportHistoryAction.clear === 'function'
              && typeof window.__quarticEngines.exportHistoryAction.perform === 'function'
              && typeof window.__quarticEngines.exportHistoryAction.refreshRecoveries === 'function'
              && await window.__quarticEngines.exportHistoryAction.selfTest()
            );
            const exportRecoveryEngineReady = Boolean(
              window.QuarticExportRecoveryEngine
              && window.__quarticEngines?.exportRecovery?.diagnostics?.ready
              && typeof window.__quarticEngines.exportRecovery.recover === 'function'
              && typeof window.__quarticEngines.exportRecovery.discard === 'function'
              && await window.__quarticEngines.exportRecovery.selfTest()
            );
            const exportRenderCoordinatorReady = Boolean(
              window.QuarticExportRenderCoordinator
              && window.__quarticEngines?.exportRenderCoordinator?.diagnostics?.ready
              && typeof window.__quarticEngines.exportRenderCoordinator.renderFrames === 'function'
              && await window.__quarticEngines.exportRenderCoordinator.selfTest()
            );
            const exportWorkflowEngineReady = Boolean(
              window.QuarticExportWorkflowEngine
              && window.__quarticEngines?.exportWorkflow?.diagnostics?.ready
              && typeof window.__quarticEngines.exportWorkflow.run === 'function'
              && await window.__quarticEngines.exportWorkflow.selfTest()
            );
            const exportOfflineLifecycleReady = Boolean(
              window.QuarticExportOfflineLifecycle
              && window.__quarticEngines?.exportOfflineLifecycle?.diagnostics?.ready
              && typeof window.__quarticEngines.exportOfflineLifecycle.run === 'function'
              && await window.__quarticEngines.exportOfflineLifecycle.selfTest()
            );
            const exportLiveLifecycleReady = Boolean(
              window.QuarticExportLiveLifecycle
              && window.__quarticEngines?.exportLiveLifecycle?.diagnostics?.ready
              && typeof window.__quarticEngines.exportLiveLifecycle.start === 'function'
              && typeof window.__quarticEngines.exportLiveLifecycle.finish === 'function'
              && await window.__quarticEngines.exportLiveLifecycle.selfTest()
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
            const exportLiveCaptureEngineReady = Boolean(
              window.QuarticExportLiveCaptureEngine
              && window.__quarticEngines?.exportLiveCapture?.diagnostics?.ready
              && typeof window.__quarticEngines.exportLiveCapture.createCapture === 'function'
              && typeof window.__quarticEngines.exportLiveCapture.videoBitrate === 'function'
              && await window.__quarticEngines.exportLiveCapture.selfTest()
            );
            const exportQuickClipWorkflowEngineReady = Boolean(
              window.QuarticExportQuickClipWorkflowEngine
              && window.__quarticEngines?.exportQuickClipWorkflow?.diagnostics?.ready
              && typeof window.__quarticEngines.exportQuickClipWorkflow.run === 'function'
              && typeof window.__quarticEngines.exportQuickClipWorkflow.requestCancel === 'function'
              && await window.__quarticEngines.exportQuickClipWorkflow.selfTest()
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
              && window.QuarticAppMetadata?.version === ${JSON.stringify(app.getVersion())}
              && document.querySelector('#appVersionText')?.textContent.includes(${JSON.stringify(app.getVersion())})
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
              && document.querySelector('#songDirectorTransition')
              && document.querySelector('#songDirectorTransitionResolved')
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
              && performancePackagePreview?.performance?.director?.transition === 'auto'
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
            const customVisualizerDiagnostics = window.__quarticCustomVisualizerDiagnostics || null;
            const customVisualizerReady = Number('${requestedSmokeStyle}') < 1000 || Boolean(
              customVisualizerDiagnostics
              && customVisualizerDiagnostics.webgl2
              && (customVisualizerDiagnostics.loadedAssets > 0 || customVisualizerDiagnostics.drawCalls > 0)
              && !customVisualizerDiagnostics.lastError
            );
            const customNativeLayersReady = Number('${requestedSmokeStyle}') < 1000 || ['image', 'text', 'shape', 'spectrum', 'waveform', 'particles', 'path']
              .every((type) => customVisualizerDiagnostics?.layerTypes?.includes(type));
            const customPackagePalettes = window.__quarticControllers?.profileService?.profiles
              ?.filter((profile) => profile.packagePalette?.managed && profile.packagePalette.packageId === 'com.tempestmainframe.data-horizon.quartic-smoke-signal') || [];
            const customPackagePalettesReady = Number('${requestedSmokeStyle}') < 1000 || (
              customPackagePalettes.length === 2
              && customPackagePalettes.every((profile) => profile.kind === 'colors' && profile.data?.customColors?.length === 4)
            );
            return {
              ready: Boolean(window.__quarticReady),
              webgl2: Boolean(document.querySelector('#fractalCanvas')?.getContext('webgl2')),
              frequencyBands,
              visualStyles,
              playlistReady,
              obsOutputReady,
              profilesReady,
              windowsAudioReady,
              deckOutputRoutingReady,
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
              exportOfflinePresentationReady,
              exportLivePresentationReady,
              showComposerControllerReady,
              profileManagerControllerReady,
              paletteLibraryReady,
              audioAnalysisEngineReady,
              performanceSequencerEngineReady,
              performanceShowDataEngineReady,
              songMapDataEngineReady,
              songDirectorEngineReady,
              performancePackageEngineReady,
              exportSessionEngineReady,
              exportProgressWorkflowEngineReady,
              exportProgressCoordinatorReady,
              exportCommandCoordinatorReady,
              exportJobCoordinatorReady,
              exportResultWorkflowEngineReady,
              exportSamplingEngineReady,
              exportSettingsSnapshotEngineReady,
              exportPreparationEngineReady,
              exportFrameCaptureEngineReady,
              exportPlanningEngineReady,
              exportPresentationEngineReady,
              exportPreflightEngineReady,
              exportAdvisorEngineReady,
              exportSettingsCoordinatorEngineReady,
              exportRuntimeStateCoordinatorReady,
              exportEncoderScanEngineReady,
              exportBenchmarkEngineReady,
              exportHistoryEngineReady,
              exportHistoryActionEngineReady,
              exportRecoveryEngineReady,
              exportRenderCoordinatorReady,
              exportWorkflowEngineReady,
              exportOfflineLifecycleReady,
              exportLiveLifecycleReady,
              exportEncoderEngineReady,
              exportLiveCaptureEngineReady,
              exportQuickClipWorkflowEngineReady,
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
              exportSamplingReady,
              av1PreflightReady,
              av1Encoder,
              automaticGpuPreflightReady,
              automaticGpuEncoder,
              encoderCapabilityScanReady,
              encoderCapabilityRowCount,
              exportBenchmarkReady,
              exportBenchmarkSnapshot,
              exportAdvisorReady,
              exportAdvisorOptionCount,
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
              customVisualizerReady,
              customNativeLayersReady,
              customPackagePalettesReady,
              customVisualizerDiagnostics,
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
              document.querySelector('.music-subtab[data-music-tab="analysis"]')?.click();
              const enabled = document.querySelector('#songDirectorEnabled');
              enabled?.click();
              const behavior = document.querySelector('#songDirectorBehavior');
              behavior.value = 'electronic';
              behavior.dispatchEvent(new Event('change', { bubbles: true }));
              const explicitBehavior = document.querySelector('#songDirectorBehaviorResolved')?.textContent || '';
              behavior.value = 'auto';
              behavior.dispatchEvent(new Event('change', { bubbles: true }));
              const transition = document.querySelector('#songDirectorTransition');
              transition.value = 'gentle';
              transition.dispatchEvent(new Event('change', { bubbles: true }));
              const explicitTransition = document.querySelector('#songDirectorTransitionResolved')?.textContent || '';
              transition.value = 'auto';
              transition.dispatchEvent(new Event('change', { bubbles: true }));
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
              const dynamicsMeter = document.querySelector('.song-director-meters');
              const dynamicsRect = dynamicsMeter?.getBoundingClientRect();
              const dynamicsLayoutReady = Boolean(dynamicsRect?.width)
                && dynamicsMeter.scrollWidth <= dynamicsMeter.clientWidth + 1
                && [...document.querySelectorAll('.song-director-meters small')].every((node) => {
                  const rect = node.getBoundingClientRect();
                  return rect.left >= dynamicsRect.left - 1 && rect.right <= dynamicsRect.right + 1;
                });
              const dynamicsMetrics = {
                clientWidth: dynamicsMeter?.clientWidth || 0,
                scrollWidth: dynamicsMeter?.scrollWidth || 0,
                rect: dynamicsRect ? [dynamicsRect.left, dynamicsRect.right, dynamicsRect.width] : [0, 0, 0],
                labels: [...document.querySelectorAll('.song-director-meters small')].map((node) => {
                  const rect = node.getBoundingClientRect();
                  return [node.textContent, rect.left, rect.right, rect.width];
                })
              };
              return {
                planCues: document.querySelectorAll('.song-director-cue').length,
                enabled: Boolean(enabled?.checked),
                status: document.querySelector('#songDirectorStatus')?.textContent || '',
                currentCue: document.querySelector('#songDirectorNow strong')?.textContent || '',
                currentMotif: document.querySelector('#songDirectorNow small')?.textContent || '',
                timelineMotif: document.querySelector('.song-director-cue small')?.textContent || '',
                dynamicsLead: document.querySelector('#songDirectorDynamicsLead')?.textContent || '',
                dynamicsLabels: [...document.querySelectorAll('.song-director-meters small')].map((label) => label.textContent),
                dynamicsAccessible: document.querySelector('.song-director-meters')?.getAttribute('aria-label') || '',
                dynamicsLayoutReady,
                dynamicsMetrics,
                explicitBehavior,
                automaticBehavior: document.querySelector('#songDirectorBehaviorResolved')?.textContent || '',
                explicitTransition,
                automaticTransition: document.querySelector('#songDirectorTransitionResolved')?.textContent || '',
                cueOverrideReady,
                cueResetReady
              };
            })()`);
            result.songDirectorAnalysisReady = result.songDirectorAnalysis.enabled
              && result.songDirectorAnalysis.planCues === result.songMapAnalysis.sections
              && result.songDirectorAnalysis.status === 'ACTIVE'
              && result.songDirectorAnalysis.currentMotif.includes('MOTIF')
              && result.songDirectorAnalysis.timelineMotif.includes('MOTIF')
              && result.songDirectorAnalysis.dynamicsLead.includes('→')
              && result.songDirectorAnalysis.dynamicsLabels.join('|') === 'CAM|MATH|COLOR|DEPTH'
              && result.songDirectorAnalysis.dynamicsAccessible.includes('Camera')
              && result.songDirectorAnalysis.dynamicsLayoutReady
              && result.songDirectorAnalysis.explicitBehavior.includes('ELECTRONIC')
              && result.songDirectorAnalysis.automaticBehavior.startsWith('AUTO')
              && result.songDirectorAnalysis.explicitTransition === 'GENTLE'
              && result.songDirectorAnalysis.automaticTransition.startsWith('AUTO')
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
            result.fractalAudioPeak = 0;
            result.fractalAudioDiagnostics = null;
            result.beatSamples = [];
            for (let attempt = 0; attempt < 12; attempt++) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              result.pulseEventCount = await window.webContents.executeJavaScript(`Number(window.__quarticPulseEventCount || 0)`);
              result.pulsePeakCount = Math.max(result.pulsePeakCount, result.pulseEventCount);
              result.fractalAudioDiagnostics = await window.webContents.executeJavaScript(`window.__quarticFractalAudioDiagnostics || null`);
              if (result.fractalAudioDiagnostics) {
                result.fractalAudioPeak = Math.max(result.fractalAudioPeak,
                  Number(result.fractalAudioDiagnostics.directBass || 0),
                  Number(result.fractalAudioDiagnostics.directMids || 0),
                  Number(result.fractalAudioDiagnostics.directHighs || 0),
                  Number(result.fractalAudioDiagnostics.equationBass || 0),
                  Number(result.fractalAudioDiagnostics.equationMids || 0),
                  Number(result.fractalAudioDiagnostics.equationHighs || 0));
              }
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
            result.fractalAudioReady = ![0, 5].includes(requestedSmokeStyle)
              || (result.fractalAudioPeak > .01 && result.fractalAudioDiagnostics?.matrixOwnsFractalAudio === false);
          } else {
            result.syntheticPulseReady = true;
            result.fractalAudioReady = true;
          }
          result.adaptiveBeatReady = !smokeAdaptiveBeat || result.beatDetectedTotal >= 4;
          if (smokeObsOutput) {
            await window.webContents.executeJavaScript(`(() => {
              const resolution = document.querySelector('#obsResolution');
              resolution.value = '1280x720';
              resolution.dispatchEvent(new Event('change', { bubbles: true }));
              const chroma = document.querySelector('#obsChromaKey');
              chroma.checked = Number('${requestedSmokeStyle}') < 1000;
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
              let visiblePixels = 0;
              for (let offset = 0; offset < bitmap.length; offset += 4) {
                const blue = bitmap[offset];
                const green = bitmap[offset + 1];
                const red = bitmap[offset + 2];
                if (red + green + blue > 24) visiblePixels += 1;
                const pureKey = green >= 245 && red <= 10 && blue <= 10;
                if (pureKey) keyPixels += 1;
                else if (green >= 36 && green > red * 1.25 && green > blue * 1.25) unsafeGreenPixels += 1;
              }
              result.obsChromaMetrics = { keyPixels, unsafeGreenPixels, visiblePixels };
              result.obsChromaSafe = requestedSmokeStyle >= 1000
                ? visiblePixels > 100
                : keyPixels > 100 && unsafeGreenPixels === 0;
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
          process.exitCode = result.ready && result.webgl2 && result.frequencyBands && result.visualStyles && result.playlistReady && result.obsOutputReady && result.profilesReady && result.windowsAudioReady && result.deckOutputRoutingReady && result.outputCaptureReady && result.audioHudReady && result.hudTransportReady && result.stageGeometryReady && result.exportStatusReady && result.sidebarLayoutReady && result.quickControlsLayoutReady && result.mainTabsFit && result.workspaceShellReady && result.visualCatalogReady && result.controllerModulesReady && result.exportOfflinePresentationReady && result.exportLivePresentationReady && result.showComposerControllerReady && result.profileManagerControllerReady && result.paletteLibraryReady && result.audioAnalysisEngineReady && result.performanceSequencerEngineReady && result.performanceShowDataEngineReady && result.songMapDataEngineReady && result.performancePackageEngineReady && result.exportSessionEngineReady && result.exportSamplingEngineReady && result.exportFrameCaptureEngineReady && result.exportPlanningEngineReady && result.exportPresentationEngineReady && result.exportPreflightEngineReady && result.exportEncoderScanEngineReady && result.exportBenchmarkEngineReady && result.exportHistoryEngineReady && result.exportRenderCoordinatorReady && result.exportWorkflowEngineReady && result.exportOfflineLifecycleReady && result.exportLiveLifecycleReady && result.exportEncoderEngineReady && result.basicWorkflowReady && result.advancedWorkflowReady && result.unleashedLayoutReady && result.aboutContentReady && result.musicPersonalityReady && result.songMapReady && result.songMapAnalysisReady && result.songDirectorReady && result.songDirectorAnalysisReady && result.appearanceNavigationReady && result.modulationMatrixReady && result.showSequencerReady && result.showComposerReady && result.showComposerWorkspaceReady && result.showComposerGenerationReady && result.liveControlsReady && result.creativeToolsReady && result.performanceAssistantReady && result.reportCenterReady && result.reportGenerationReady && result.performanceAutomationStandbyReady && result.offlineExportReady && result.exportSamplingReady && result.exportQolReady && result.nativeExportEncoderReady && result.obsAutomationReady && result.coreEquationReady && result.coreEquationInputReady && result.percentageScalesReady && result.pulseControls && result.customColorRolesReady && result.beatDetectorControls && result.bulbControls && result.pulsePresetsReady && result.visualEffectControls && result.effectPresetsReady && result.visualOptionsReady && result.syntheticPulseReady && result.fractalAudioReady && result.adaptiveBeatReady && result.obsWindowMovable && result.obsDragStripReady && result.obsChromaSafe && result.rotationVelocityReady && result.activeTab === requestedSmokeTab && result.activeVisualStyle === String(requestedSmokeStyle) && result.canvasWidth > 0 ? 0 : 1;
          if (!result.songDirectorEngineReady) process.exitCode = 1;
          if (!result.exportAdvisorEngineReady) process.exitCode = 1;
          if (!result.exportSettingsCoordinatorEngineReady) process.exitCode = 1;
          if (!result.exportRuntimeStateCoordinatorReady) process.exitCode = 1;
          if (!result.exportPreparationEngineReady) process.exitCode = 1;
          if (!result.exportLiveCaptureEngineReady) process.exitCode = 1;
          if (!result.exportQuickClipWorkflowEngineReady) process.exitCode = 1;
          if (!result.exportHistoryActionEngineReady) process.exitCode = 1;
          if (!result.exportProgressWorkflowEngineReady) process.exitCode = 1;
          if (!result.exportProgressCoordinatorReady) process.exitCode = 1;
          if (!result.exportCommandCoordinatorReady) process.exitCode = 1;
          if (!result.exportJobCoordinatorReady) process.exitCode = 1;
          if (!result.exportResultWorkflowEngineReady) process.exitCode = 1;
          if (!result.exportSettingsSnapshotEngineReady) process.exitCode = 1;
          if (!result.exportRecoveryEngineReady) process.exitCode = 1;
          if (!result.av1PreflightReady) process.exitCode = 1;
          if (!result.automaticGpuPreflightReady) process.exitCode = 1;
          if (!result.encoderCapabilityScanReady) process.exitCode = 1;
          if (!result.exportBenchmarkReady) process.exitCode = 1;
          if (!result.exportAdvisorReady) process.exitCode = 1;
          if (!result.customVisualizerReady) process.exitCode = 1;
          if (!result.customNativeLayersReady) process.exitCode = 1;
          if (!result.customPackagePalettesReady) process.exitCode = 1;
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
  const development = path.join(__dirname, '..', '..', 'assets', 'bin', 'ffmpeg.exe');
  if (fs.existsSync(bundled)) return bundled;
  if (fs.existsSync(development)) return development;
  return 'ffmpeg';
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
  ffv1: {
    id: 'ffv1', label: 'FFV1 Lossless · RGB 4:4:4 + FLAC', hardware: false,
    probePixelFormat: 'bgr0',
    args: ['-c:v', 'ffv1', '-level', '3', '-coder', '1', '-context', '1', '-slicecrc', '1']
  },
  utvideo: {
    id: 'utvideo', label: 'Ut Video Lossless - RGB 4:4:4 + FLAC', hardware: false,
    probePixelFormat: 'gbrp',
    args: ['-c:v', 'utvideo', '-pix_fmt', 'gbrp']
  },
  libvpx_vp9: {
    id: 'libvpx_vp9', label: 'CPU Software · VP9 Profile 1 RGB-detail', hardware: false,
    probePixelFormat: 'yuv444p',
    args: ['-c:v', 'libvpx-vp9', '-profile:v', '1', '-deadline', 'good', '-cpu-used', '1', '-crf', '10', '-b:v', '0', '-row-mt', '1']
  },
  av1_nvenc: {
    id: 'av1_nvenc', label: 'NVIDIA NVENC · AV1 Main 10 Ultra Quality', hardware: true,
    probePixelFormat: 'p010le',
    args: ['-c:v', 'av1_nvenc', '-profile:v', 'main', '-preset', 'p7', '-tune', 'uhq', '-rc', 'vbr', '-cq', '10', '-b:v', '0', '-multipass', 'fullres', '-spatial-aq', '1', '-temporal-aq', '1', '-aq-strength', '10', '-rc-lookahead', '32', '-highbitdepth', '1']
  },
  av1_qsv: {
    id: 'av1_qsv', label: 'Intel Quick Sync · AV1 Main 10 Quality', hardware: true,
    probePixelFormat: 'p010le',
    args: ['-c:v', 'av1_qsv', '-profile:v', 'main', '-preset', 'veryslow', '-global_quality', '15']
  },
  av1_amf: {
    id: 'av1_amf', label: 'AMD AMF · AV1 Main 10 High Quality', hardware: true,
    probePixelFormat: 'p010le',
    args: ['-c:v', 'av1_amf', '-profile:v', 'main', '-usage', 'high_quality', '-quality', 'high_quality', '-rc', 'qvbr', '-qvbr_quality_level', '15', '-bitdepth', '10', '-preanalysis', '1', '-aq_mode', 'caq']
  },
  libaom_av1: {
    id: 'libaom_av1', label: 'CPU Software · AV1 Main 10 Quality (Very Slow)', hardware: false,
    probePixelFormat: 'yuv420p10le',
    args: ['-c:v', 'libaom-av1', '-cpu-used', '4', '-crf', '12', '-b:v', '0', '-row-mt', '1', '-tiles', '2x2', '-lag-in-frames', '25']
  },
  hevc_nvenc_auto: {
    id: 'hevc_nvenc_auto', label: 'NVIDIA NVENC · HEVC Main 10 Ultra Quality', hardware: true,
    probePixelFormat: 'p010le',
    args: [
      '-c:v', 'hevc_nvenc', '-profile:v', 'main10', '-preset', 'p7', '-tune', 'uhq',
      '-rc', 'vbr', '-cq', '4', '-b:v', '180M', '-maxrate', '300M', '-bufsize', '600M',
      '-multipass', 'fullres', '-spatial_aq', '1', '-temporal_aq', '1', '-aq-strength', '10',
      '-rc-lookahead', '32', '-bf', '4'
    ]
  },
  hevc_qsv_auto: {
    id: 'hevc_qsv_auto', label: 'Intel Quick Sync · HEVC Main 10 Quality', hardware: true,
    probePixelFormat: 'p010le',
    args: ['-c:v', 'hevc_qsv', '-profile:v', 'main10', '-preset', 'veryslow', '-global_quality', '10']
  },
  hevc_amf_auto: {
    id: 'hevc_amf_auto', label: 'AMD AMF · HEVC Main 10 High Quality', hardware: true,
    probePixelFormat: 'p010le',
    args: [
      '-c:v', 'hevc_amf', '-profile:v', 'main10', '-usage', 'high_quality', '-quality', 'quality',
      '-rc', 'qvbr', '-qvbr_quality_level', '10', '-bitdepth', '10', '-preanalysis', '1'
    ]
  },
  libx265_auto: {
    id: 'libx265_auto', label: 'CPU Software · HEVC Main 10 Quality (Slow)', hardware: false,
    probePixelFormat: 'p010le',
    args: [
      '-c:v', 'libx265', '-profile:v', 'main10', '-preset', 'slow',
      '-x265-params', 'crf=6:vbv-maxrate=300000:vbv-bufsize=600000:aq-mode=3'
    ]
  },
  prores_ks: {
    id: 'prores_ks', label: 'CPU Software · ProRes 422 HQ 10-bit', hardware: false,
    probePixelFormat: 'yuv422p10le',
    args: ['-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0', '-bits_per_mb', '8000']
  },
  png_sequence: {
    id: 'png_sequence', label: 'FFmpeg PNG Lossless · RGBA frames + PCM WAV', hardware: false,
    probePixelFormat: 'rgba',
    args: ['-c:v', 'png', '-compression_level', '4']
  },
  hevc_nvenc_hdr: {
    id: 'hevc_nvenc_hdr', label: 'NVIDIA NVENC - HEVC Main 10', hardware: true,
    args: ['-c:v', 'hevc_nvenc', '-profile:v', 'main10', '-preset', 'p7', '-tune', 'hq']
  },
  libx265_hdr: {
    id: 'libx265_hdr', label: 'CPU Software - HEVC Main 10', hardware: false,
    args: ['-c:v', 'libx265', '-preset', 'slow']
  },
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
      '-frames:v', '1', ...profile.args, '-pix_fmt', profile.probePixelFormat || 'yuv420p', '-f', 'null', '-'
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

async function encoderForExportFormat(format, { refresh = false } = {}) {
  if (format === 'gpu_auto') return recommendedAutomaticGpuEncoder({ refresh });
  if (format === 'youtube_hdr') {
    if (refresh) cachedHdrEncoder = null;
    return recommendedHdrExportEncoder();
  }
  if (format === 'mp4_compatible') return recommendedExportEncoder({ refresh });
  if (format === 'av1_quality') return recommendedAv1ExportEncoder({ refresh });
  const fixedEncoderId = format === 'webm_quality'
    ? 'libvpx_vp9'
    : format === 'prores_422_hq' ? 'prores_ks' : format;
  const profile = exportEncoderProfiles[fixedEncoderId];
  if (!profile) throw new Error(`The ${videoFormats[format]?.name || 'selected export profile'} is not configured.`);
  if (!refresh && cachedFixedExportEncoders.has(fixedEncoderId)) return cachedFixedExportEncoders.get(fixedEncoderId);
  if (!await probeExportEncoder(profile)) {
    throw new Error(`FFmpeg could not initialize ${profile.label}. Check the bundled FFmpeg installation and try again.`);
  }
  const validated = { ...profile, available: true };
  cachedFixedExportEncoders.set(fixedEncoderId, validated);
  return validated;
}

function validatedEncoderProfile(id) {
  return exportEncoderProfiles[id] || exportEncoderProfiles.libx264;
}

let cachedHdrEncoder = null;
let cachedAv1Encoder = null;
let cachedAutomaticGpuEncoder = null;

function automaticGpuCandidateIds(gpuText) {
  const text = String(gpuText || '').toLowerCase();
  const candidates = [];
  if (/nvidia|geforce|quadro/.test(text)) candidates.push('av1_nvenc');
  if (/intel|arc|iris|uhd/.test(text)) candidates.push('av1_qsv');
  if (/amd|radeon|advanced micro/.test(text)) candidates.push('av1_amf');
  if (/nvidia|geforce|quadro/.test(text)) candidates.push('hevc_nvenc_auto');
  if (/intel|arc|iris|uhd/.test(text)) candidates.push('hevc_qsv_auto');
  if (/amd|radeon|advanced micro/.test(text)) candidates.push('hevc_amf_auto');
  return candidates.length
    ? candidates
    : ['av1_nvenc', 'av1_qsv', 'av1_amf', 'hevc_nvenc_auto', 'hevc_qsv_auto', 'hevc_amf_auto'];
}

async function recommendedAutomaticGpuEncoder({ refresh = false } = {}) {
  if (cachedAutomaticGpuEncoder && !refresh) return cachedAutomaticGpuEncoder;
  await verifyFfmpeg();
  const hardware = await detectHardware();
  const gpuText = hardware.gpuDevices.map((device) => `${device.vendorString} ${device.deviceString} ${device.driverVendor}`).join(' ').toLowerCase();
  const candidates = automaticGpuCandidateIds(gpuText);
  for (const id of candidates) {
    const profile = exportEncoderProfiles[id];
    if (await probeExportEncoder(profile)) {
      cachedAutomaticGpuEncoder = { ...profile, available: true };
      return cachedAutomaticGpuEncoder;
    }
  }
  const software = exportEncoderProfiles.libx265_auto;
  cachedAutomaticGpuEncoder = { ...software, available: await probeExportEncoder(software) };
  if (!cachedAutomaticGpuEncoder.available) {
    throw new Error('FFmpeg could not initialize a compatible 10-bit AV1 or HEVC encoder.');
  }
  return cachedAutomaticGpuEncoder;
}

function encoderCodecName(id) {
  if (String(id).startsWith('av1_') || id === 'libaom_av1') return 'AV1 10-bit';
  if (String(id).startsWith('hevc_') || String(id).startsWith('libx265')) return 'HEVC Main 10';
  return 'H.264';
}

async function scanExportEncoderCapabilities() {
  await verifyFfmpeg();
  const hardware = await detectHardware();
  const gpuText = hardware.gpuDevices.map((device) => `${device.vendorString} ${device.deviceString} ${device.driverVendor}`).join(' ').toLowerCase();
  const automaticCandidates = automaticGpuCandidateIds(gpuText);
  const scanIds = [...new Set([
    ...automaticCandidates,
    ...(automaticCandidates.includes('av1_nvenc') ? ['h264_nvenc'] : []),
    ...(automaticCandidates.includes('av1_qsv') ? ['h264_qsv'] : []),
    ...(automaticCandidates.includes('av1_amf') ? ['h264_amf'] : []),
    'libx265_auto', 'libaom_av1', 'libx264'
  ])];
  const encoders = [];
  for (const id of scanIds) {
    const profile = exportEncoderProfiles[id];
    const started = performance.now();
    const available = await probeExportEncoder(profile);
    encoders.push({
      id,
      label: profile.label,
      codec: encoderCodecName(id),
      hardware: profile.hardware,
      available,
      probeMilliseconds: Math.round(performance.now() - started)
    });
  }
  const selected = automaticCandidates
    .map((id) => encoders.find((entry) => entry.id === id && entry.available))
    .find(Boolean)
    || encoders.find((entry) => entry.id === 'libx265_auto' && entry.available);
  if (!selected) throw new Error('No compatible Automatic GPU Master encoder passed the compatibility scan.');
  cachedAutomaticGpuEncoder = { ...exportEncoderProfiles[selected.id], available: true };
  return {
    scannedAt: new Date().toISOString(),
    selected,
    decision: selected.hardware
      ? `${selected.codec} hardware encoding is the first supported quality path in Automatic priority order.`
      : 'No compatible hardware AV1 or HEVC Main 10 encoder initialized, so Automatic selected CPU HEVC.',
    gpuDevices: hardware.gpuDevices.filter((device) => !/microsoft basic render/i.test(device.deviceString)).map((device) => ({
      name: device.deviceString || device.vendorString || 'Unknown GPU',
      vendor: device.vendorString || device.driverVendor || '',
      active: device.active,
      driverVersion: device.driverVersion || ''
    })),
    encoders
  };
}

async function benchmarkExportEncoder(options = {}) {
  await verifyFfmpeg();
  const format = normalizeRequestedFormat(options.format);
  const width = Math.max(320, Math.min(7680, Math.round(Number(options.width) || 1920)));
  const height = Math.max(240, Math.min(4320, Math.round(Number(options.height) || 1080)));
  const fps = Math.max(1, Math.min(120, Math.round(Number(options.fps) || 60)));
  const encoder = await encoderForExportFormat(format, { refresh: options.refreshEncoder === true });
  if (encoder.id === 'libaom_av1') {
    return {
      format, width, height, fps,
      encoder: { id: encoder.id, label: encoder.label, hardware: false },
      skipped: true,
      warning: 'CPU AV1 is intentionally not stress-tested because even a short 4K benchmark can take a long time. Use Automatic GPU Master for a practical fallback.'
    };
  }
  const frameCount = encoder.hardware ? Math.max(30, Math.min(120, Math.round(fps * 1.25))) : Math.max(12, Math.min(30, Math.round(fps * .3)));
  const pixelFormat = encoder.probePixelFormat || 'yuv420p';
  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `testsrc2=s=${width}x${height}:r=${fps}`,
    '-frames:v', String(frameCount), '-vf', `format=${pixelFormat}`,
    ...encoder.args, '-pix_fmt', pixelFormat, '-an', '-f', 'null', '-'
  ];
  const started = performance.now();
  await new Promise((resolve, reject) => {
    execFile(ffmpegExecutable(), args, { windowsHide: true, timeout: 30000, maxBuffer: 4 * 1024 * 1024 }, (error, _stdout, stderr) => {
      if (!error) return resolve();
      const detail = String(stderr || error.message || '').trim().split(/\r?\n/).slice(-3).join(' ');
      reject(new Error(`Encoder benchmark failed for ${encoder.label}.${detail ? ` ${detail}` : ''}`));
    });
  });
  const elapsedMilliseconds = Math.max(1, performance.now() - started);
  return {
    format, width, height, fps, frameCount, elapsedMilliseconds: Math.round(elapsedMilliseconds),
    encodedFps: Number((frameCount / (elapsedMilliseconds / 1000)).toFixed(2)),
    encoder: { id: encoder.id, label: encoder.label, hardware: encoder.hardware },
    skipped: false,
    warning: ''
  };
}

async function recommendedAv1ExportEncoder({ refresh = false } = {}) {
  if (cachedAv1Encoder && !refresh) return cachedAv1Encoder;
  await verifyFfmpeg();
  const hardware = await detectHardware();
  const gpuText = hardware.gpuDevices.map((device) => `${device.vendorString} ${device.deviceString} ${device.driverVendor}`).join(' ').toLowerCase();
  const preferred = [];
  if (/nvidia|geforce|quadro/.test(gpuText)) preferred.push('av1_nvenc');
  if (/intel|arc|iris|uhd/.test(gpuText)) preferred.push('av1_qsv');
  if (/amd|radeon|advanced micro/.test(gpuText)) preferred.push('av1_amf');
  const candidates = preferred.length ? preferred : ['av1_nvenc', 'av1_qsv', 'av1_amf'];
  for (const id of candidates) {
    const profile = exportEncoderProfiles[id];
    if (await probeExportEncoder(profile)) {
      cachedAv1Encoder = { ...profile, available: true };
      return cachedAv1Encoder;
    }
  }
  const software = exportEncoderProfiles.libaom_av1;
  cachedAv1Encoder = { ...software, available: await probeExportEncoder(software) };
  if (!cachedAv1Encoder.available) throw new Error('FFmpeg could not initialize a compatible AV1 encoder.');
  return cachedAv1Encoder;
}

function probeHdrExportEncoder(profile) {
  return new Promise((resolve) => {
    const args = [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'color=c=black:s=256x256:d=0.1:r=30',
      '-vf', 'format=p010le', '-frames:v', '1', ...profile.args, '-f', 'null', '-'
    ];
    execFile(ffmpegExecutable(), args, { windowsHide: true, timeout: 15000 }, (error) => resolve(!error));
  });
}

async function recommendedHdrExportEncoder() {
  if (cachedHdrEncoder) return cachedHdrEncoder;
  const hardware = await detectHardware();
  const gpuText = hardware.gpuDevices.map((device) => `${device.vendorString} ${device.deviceString} ${device.driverVendor}`).join(' ').toLowerCase();
  if (/nvidia|geforce|quadro/.test(gpuText) && await probeHdrExportEncoder(exportEncoderProfiles.hevc_nvenc_hdr)) {
    cachedHdrEncoder = exportEncoderProfiles.hevc_nvenc_hdr;
    return cachedHdrEncoder;
  }
  if (await probeHdrExportEncoder(exportEncoderProfiles.libx265_hdr)) {
    cachedHdrEncoder = exportEncoderProfiles.libx265_hdr;
    return cachedHdrEncoder;
  }
  throw new Error('FFmpeg could not initialize an HEVC Main 10 encoder for the YouTube HDR profile.');
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

async function pathSizeBytes(targetPath) {
  const stat = await fs.promises.stat(targetPath).catch(() => null);
  if (!stat) return 0;
  if (stat.isFile()) return stat.size;
  if (!stat.isDirectory()) return 0;
  let total = 0;
  const entries = await fs.promises.readdir(targetPath, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isFile()) total += (await fs.promises.stat(entryPath).catch(() => null))?.size || 0;
    else if (entry.isDirectory()) total += await pathSizeBytes(entryPath);
  }
  return total;
}

async function countPngSequenceFrames(directory) {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile() && /^frame-\d{8}\.png$/i.test(entry.name)).length;
}

async function uniqueSequenceDirectory(parentDirectory, suggestedName) {
  const parent = path.resolve(parentDirectory);
  const parentStat = await fs.promises.stat(parent).catch(() => null);
  if (!parentStat?.isDirectory()) throw new Error('The selected image-sequence destination is not an available folder.');
  const baseName = `${String(suggestedName || 'quartic-pulse').trim() || 'quartic-pulse'} - PNG Sequence`;
  for (let suffix = 1; suffix <= 1000; suffix++) {
    const folderName = suffix === 1 ? baseName : `${baseName} (${suffix})`;
    const candidate = path.resolve(parent, folderName);
    if (path.dirname(candidate).toLowerCase() !== parent.toLowerCase()) throw new Error('The image-sequence folder name was invalid.');
    try {
      await fs.promises.mkdir(candidate, { recursive: false });
      return candidate;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error('Could not create a unique image-sequence folder in the selected location.');
}

async function removeGeneratedSequenceFiles(session) {
  const directory = path.resolve(String(session?.outputPath || ''));
  if (!directory || path.resolve(String(session?.tempPath || '')) !== directory) return;
  const stat = await fs.promises.stat(directory).catch(() => null);
  if (!stat?.isDirectory()) return;
  const entries = await fs.promises.readdir(directory, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/^frame-\d{8}\.png$/i.test(entry.name) && !['audio.wav', 'sequence-manifest.json'].includes(entry.name)) continue;
    await fs.promises.unlink(path.join(directory, entry.name)).catch(() => {});
  }
  await fs.promises.rmdir(directory).catch(() => {});
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
    pipeline: session.pipeline,
    width: session.width,
    height: session.height,
    fps: session.fps,
    frameCount: session.frameCount,
    encodedFrames: session.frameIndex,
    codec: session.codec,
    finalEncoder: session.finalEncoder,
    framePattern: session.framePattern,
    sequenceAudioPath: session.sequenceAudioPath,
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
      if (!audioStat?.isFile()) continue;
      if (manifest.format === 'png_sequence') {
        if (!tempStat?.isDirectory()) continue;
        const sequenceFrames = await countPngSequenceFrames(manifest.tempPath);
        if (!sequenceFrames) continue;
        results.push({
          ...manifest,
          encodedFrames: Math.max(sequenceFrames, Number(manifest.encodedFrames) || 0),
          tempBytes: await pathSizeBytes(manifest.tempPath)
        });
      } else {
        if (!tempStat?.isFile() || tempStat.size <= 32) continue;
        results.push({ ...manifest, tempBytes: tempStat.size });
      }
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
  return {
    outputPath,
    sizeBytes: await pathSizeBytes(outputPath),
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

function losslessPartialPath(outputPath, id) {
  const extension = path.extname(outputPath) || '.mkv';
  const base = path.basename(outputPath, extension);
  return path.join(path.dirname(outputPath), `.${base}.quartic-${id}.partial${extension}`);
}

function rawProfileEncoderArguments(session) {
  if (session.format === 'png_sequence') {
    return [
      '-y', '-hide_banner',
      '-f', 'rawvideo', '-pixel_format', session.pixelFormat,
      '-video_size', `${session.width}x${session.height}`,
      '-framerate', String(session.fps), '-i', 'pipe:0',
      '-map', '0:v:0', '-vf', 'vflip',
      '-c:v', 'png', '-compression_level', '4', '-pix_fmt', 'rgba',
      '-start_number', '0', '-f', 'image2', session.framePattern
    ];
  }
  const commonInput = [
    '-y', '-hide_banner',
    '-f', 'rawvideo', '-pixel_format', session.pixelFormat,
    '-video_size', `${session.width}x${session.height}`,
    '-framerate', String(session.fps), '-i', 'pipe:0',
    '-i', session.audioPath,
    '-map', '0:v:0', '-map', '1:a:0?'
  ];
  if (session.format === 'utvideo') {
    return [
      ...commonInput,
      '-vf', 'vflip,format=gbrp',
      '-c:v', 'utvideo', '-pix_fmt', 'gbrp', '-threads', '0',
      '-c:a', 'flac', '-shortest',
      '-metadata', 'encoding_tool=Quartic Pulse Ut Video Lossless Playback Master',
      '-f', 'matroska', session.tempPath
    ];
  }
  if (session.format === 'gpu_auto') {
    const encoder = validatedEncoderProfile(session.finalEncoder);
    const av1Output = encoder.id.startsWith('av1_');
    return [
      ...commonInput,
      '-vf', 'vflip,zscale=primariesin=bt709:transferin=bt709:matrixin=gbr:rangein=full:primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=p010le',
      ...encoder.args,
      '-pix_fmt', 'p010le',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest',
      '-tag:v', av1Output ? 'av01' : 'hvc1', '-movflags', '+faststart',
      '-metadata', `encoding_tool=Quartic Pulse Automatic ${av1Output ? 'AV1' : 'HEVC'} GPU Master`,
      '-f', 'mp4', session.tempPath
    ];
  }
  if (session.format === 'youtube_hdr') {
    const colorFilter = session.hdrOutput
      ? 'vflip,zscale=primariesin=bt2020:transferin=arib-std-b67:matrixin=gbr:rangein=full:primaries=bt2020:transfer=arib-std-b67:matrix=bt2020nc:range=limited,format=p010le'
      : 'vflip,zscale=primariesin=bt709:transferin=bt709:matrixin=gbr:rangein=full:primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=p010le';
    const encoderArgs = session.finalEncoder === 'hevc_nvenc_hdr'
      ? [
          '-c:v', 'hevc_nvenc', '-profile:v', 'main10', '-preset', 'p7', '-tune', 'hq',
          '-rc', 'vbr', '-cq', '4', '-b:v', '180M', '-maxrate', '300M', '-bufsize', '600M',
          '-multipass', 'fullres', '-spatial_aq', '1', '-temporal_aq', '1', '-aq-strength', '10',
          '-rc-lookahead', '32', '-bf', '4'
        ]
      : [
          '-c:v', 'libx265', '-profile:v', 'main10', '-preset', 'slow',
          '-x265-params', 'crf=6:vbv-maxrate=300000:vbv-bufsize=600000:aq-mode=3'
        ];
    return [
      ...commonInput,
      '-vf', colorFilter,
      ...encoderArgs,
      '-color_primaries', session.hdrOutput ? 'bt2020' : 'bt709',
      '-color_trc', session.hdrOutput ? 'arib-std-b67' : 'bt709',
      '-colorspace', session.hdrOutput ? 'bt2020nc' : 'bt709', '-color_range', 'tv',
      '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest',
      '-tag:v', 'hvc1', '-movflags', '+faststart',
      '-metadata', `encoding_tool=Quartic Pulse YouTube ${session.hdrOutput ? 'HDR' : 'SDR'} Master`,
      '-f', 'mp4', session.tempPath
    ];
  }
  if (session.format === 'mp4_compatible') {
    const encoder = validatedEncoderProfile(session.finalEncoder);
    return [
      ...commonInput,
      '-vf', 'vflip,zscale=primariesin=bt709:transferin=bt709:matrixin=gbr:rangein=full:primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=yuv420p',
      ...encoder.args,
      '-profile:v', 'high', '-level:v', '5.2',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest',
      '-movflags', '+faststart',
      '-metadata', 'encoding_tool=Quartic Pulse Compatible MP4 Master',
      '-f', 'mp4', session.tempPath
    ];
  }
  if (session.format === 'webm_quality') {
    return [
      ...commonInput,
      '-vf', 'vflip,zscale=primariesin=bt709:transferin=bt709:matrixin=gbr:rangein=full:primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=yuv444p',
      ...exportEncoderProfiles.libvpx_vp9.args,
      '-pix_fmt', 'yuv444p', '-threads', '0',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'libopus', '-b:a', '256k', '-ar', '48000', '-shortest',
      '-metadata', 'encoding_tool=Quartic Pulse Open Quality VP9 Master',
      '-f', 'webm', session.tempPath
    ];
  }
  if (session.format === 'av1_quality') {
    const encoder = validatedEncoderProfile(session.finalEncoder);
    return [
      ...commonInput,
      '-vf', 'vflip,zscale=primariesin=bt709:transferin=bt709:matrixin=gbr:rangein=full:primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=yuv420p10le',
      ...encoder.args,
      '-pix_fmt', 'yuv420p10le',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'libopus', '-b:a', '256k', '-ar', '48000', '-shortest',
      '-metadata', `encoding_tool=Quartic Pulse AV1 ${encoder.hardware ? 'Hardware' : 'CPU'} Master`,
      '-f', 'webm', session.tempPath
    ];
  }
  if (session.format === 'prores_422_hq') {
    return [
      ...commonInput,
      '-vf', 'vflip,zscale=primariesin=bt709:transferin=bt709:matrixin=gbr:rangein=full:primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=yuv422p10le',
      ...exportEncoderProfiles.prores_ks.args,
      '-pix_fmt', 'yuv422p10le', '-threads', '0',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'pcm_s24le', '-ar', '48000', '-shortest',
      '-metadata', 'encoding_tool=Quartic Pulse ProRes 422 HQ Editing Master',
      '-f', 'mov', session.tempPath
    ];
  }
  return [
    ...commonInput,
    '-vf', 'vflip',
    '-c:v', 'ffv1', '-level', '3', '-coder', '1', '-context', '1',
    '-slicecrc', '1', '-slices', '16', '-threads', '0', '-pix_fmt', 'bgr0',
    '-c:a', 'flac', '-shortest',
    '-metadata', 'encoding_tool=Quartic Pulse FFV1 Lossless Archive Master',
    '-f', 'matroska', session.tempPath
  ];
}

function startRawProfileEncoder(session) {
  const args = rawProfileEncoderArguments(session);
  const child = spawn(ffmpegExecutable(), args, { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
  session.child = child;
  session.encoderErrorText = '';
  session.encoderResult = null;
  child.stderr.on('data', (chunk) => {
    session.encoderErrorText = (session.encoderErrorText + chunk.toString()).slice(-12000);
  });
  child.stdin.on('error', (error) => {
    session.encoderInputError = error;
  });
  session.encoderDone = new Promise((resolve) => {
    child.once('error', (error) => {
      session.encoderResult = { code: -1, error };
      resolve(session.encoderResult);
    });
    child.once('close', (code) => {
      session.child = null;
      session.encoderResult = { code: Number(code), error: null };
      resolve(session.encoderResult);
    });
  });
}

async function appendRawProfileFrame(session, frame) {
  const expectedBytes = session.width * session.height * 4;
  if (frame.length !== expectedBytes) {
    throw new Error(`Raw frame size mismatch (${frame.length} bytes received; ${expectedBytes} expected).`);
  }
  if (session.encoderResult || session.encoderInputError || !session.child?.stdin?.writable) {
    const detail = session.encoderInputError?.message || session.encoderResult?.error?.message || session.encoderErrorText;
    throw new Error(`${validatedEncoderProfile(session.finalEncoder).label} stopped before the export completed.${detail ? `\n${detail}` : ''}`);
  }
  if (!session.child.stdin.write(frame)) {
    await new Promise((resolve, reject) => {
      const input = session.child?.stdin;
      const child = session.child;
      if (!input || !child) return reject(new Error('The offline encoder stopped while receiving a frame.'));
      const cleanup = () => {
        input.removeListener('drain', drained);
        input.removeListener('error', failed);
        child.removeListener('close', closed);
      };
      const drained = () => { cleanup(); resolve(); };
      const failed = (error) => { cleanup(); reject(error); };
      const closed = () => { cleanup(); reject(new Error(`The offline encoder closed while receiving a frame.\n${session.encoderErrorText}`)); };
      input.once('drain', drained);
      input.once('error', failed);
      child.once('close', closed);
    });
  }
  session.frameIndex += 1;
  return session.frameIndex;
}

async function finishRawProfileEncoder(session) {
  if (session.child?.stdin && !session.child.stdin.destroyed) session.child.stdin.end();
  const result = await session.encoderDone;
  if (result?.code !== 0) {
    const detail = result?.error?.message || session.encoderErrorText || `FFmpeg exited with code ${result?.code}.`;
    throw new Error(`The ${videoFormats[session.format]?.name || 'offline master'} could not be finalized.\n${detail}`);
  }
}

function writePcmSequenceAudio(session, renderedFrameCount) {
  return new Promise((resolve, reject) => {
    const duration = Math.max(.001, Number(renderedFrameCount) / Math.max(1, Number(session.fps) || 60));
    const args = [
      '-y', '-hide_banner', '-i', session.audioPath,
      '-map', '0:a:0', '-vn', '-t', duration.toFixed(6),
      '-c:a', 'pcm_s24le', '-ar', '48000', '-ac', '2',
      session.sequenceAudioPath
    ];
    const child = spawn(ffmpegExecutable(), args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    session.child = child;
    let errorText = '';
    child.stderr.on('data', (chunk) => { errorText = (errorText + chunk.toString()).slice(-12000); });
    child.once('error', reject);
    child.once('close', (code) => {
      session.child = null;
      if (code === 0) resolve();
      else reject(new Error(`The matching 24-bit WAV could not be created.\n${errorText || `FFmpeg exited with code ${code}.`}`));
    });
  });
}

async function finalizePngSequence(session, renderedFrameCount) {
  const frameCount = Math.max(1, Math.round(Number(renderedFrameCount) || 1));
  session.sequenceAudioPath ||= path.join(session.outputPath, 'audio.wav');
  session.framePattern ||= path.join(session.outputPath, 'frame-%08d.png');
  await writePcmSequenceAudio(session, frameCount);
  const manifest = {
    schema: 'quartic-pulse-image-sequence/v1',
    createdAt: session.createdAt || new Date().toISOString(),
    width: session.width,
    height: session.height,
    framesPerSecond: session.fps,
    frameCount,
    durationSeconds: frameCount / Math.max(1, Number(session.fps) || 60),
    firstFrame: 'frame-00000000.png',
    framePattern: 'frame-%08d.png',
    audioFile: path.basename(session.sequenceAudioPath),
    audioFormat: 'PCM signed 24-bit little-endian, 48 kHz, stereo',
    color: '8-bit RGBA, full-resolution RGB 4:4:4',
    sourceAudio: path.basename(session.audioPath),
    application: 'Quartic Pulse'
  };
  const manifestPath = path.join(session.outputPath, 'sequence-manifest.json');
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporaryPath, JSON.stringify(manifest, null, 2), 'utf8');
  await fs.promises.rename(temporaryPath, manifestPath);
  return manifest;
}

function recoverLosslessFfv1Master(session, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y', '-hide_banner', '-err_detect', 'ignore_err', '-i', session.tempPath,
      '-map', '0', '-c', 'copy', '-f', 'matroska', session.outputPath
    ];
    const child = spawn(ffmpegExecutable(), args, { windowsHide: true });
    session.child = child;
    let errorText = '';
    const duration = Math.max(.001, Number(session.frameIndex || session.frameCount) / Math.max(1, Number(session.fps) || 60));
    onProgress(0);
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      errorText = (errorText + text).slice(-12000);
      const matches = [...text.matchAll(/time=(\d+:\d+:\d+(?:\.\d+)?)/g)];
      if (matches.length) onProgress(Math.max(0, Math.min(.995, ffmpegTimestampSeconds(matches.at(-1)[1]) / duration)));
    });
    child.once('error', (error) => reject(new Error(`Could not start FFmpeg recovery: ${error.message}`)));
    child.once('close', (code) => {
      session.child = null;
      if (code === 0) {
        onProgress(1);
        resolve();
      } else reject(new Error(`FFV1 recovery exited with code ${code}.\n${errorText}`));
    });
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

app.whenReady().then(async () => {
  const smokeCustomVisualizer = process.argv.includes('--smoke-custom-visualizer');
  const visualizerPackageRoot = smokeCustomVisualizer
    ? path.join(os.tmpdir(), `quartic-pulse-smoke-visualizers-${process.pid}`)
    : path.join(app.getPath('userData'), 'visualizer-packages');
  const visualizerPackageManager = new VisualizerPackageManager(visualizerPackageRoot);
  const pendingVisualizerImports = new Map();
  ipcMain.handle('visualizer-package:list', () => visualizerPackageManager.list());
  ipcMain.handle('visualizer-package:preview', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Preview Data Horizon package',
      buttonLabel: 'Preview package',
      properties: ['openDirectory']
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const packagePreview = await visualizerPackageManager.preview(result.filePaths[0]);
    const token = crypto.randomUUID();
    pendingVisualizerImports.clear();
    pendingVisualizerImports.set(token, result.filePaths[0]);
    return Object.freeze({ token, package: packagePreview });
  });
  ipcMain.handle('visualizer-package:install-preview', async (_event, token) => {
    const sourcePath = pendingVisualizerImports.get(String(token || ''));
    pendingVisualizerImports.delete(String(token || ''));
    if (!sourcePath) throw new Error('The package preview expired. Choose the Data Horizon export again.');
    return visualizerPackageManager.install(sourcePath);
  });
  ipcMain.handle('visualizer-package:import', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Data Horizon visualizer package',
      buttonLabel: 'Import visualizer',
      properties: ['openDirectory']
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return visualizerPackageManager.install(result.filePaths[0]);
  });
  ipcMain.handle('visualizer-package:load', (_event, styleId) => visualizerPackageManager.load(styleId));
  ipcMain.handle('visualizer-package:remove', (_event, styleId) => visualizerPackageManager.remove(styleId));
  if (smokeCustomVisualizer) {
    const fixturePath = app.isPackaged
      ? path.join(process.resourcesPath, 'smoke-fixtures', 'data-horizon-signal-test')
      : path.join(__dirname, '..', '..', 'tools', 'fixtures', 'data-horizon-signal-test');
    const installed = await visualizerPackageManager.install(fixturePath);
    smokeCustomVisualizerStyleId = installed.styleId || styleIdFor(installed.packageId);
  }
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
  ipcMain.handle('export:encoder-capabilities', async () => scanExportEncoderCapabilities());
  ipcMain.handle('export:benchmark-encoder', async (_event, options) => benchmarkExportEncoder(options));
  ipcMain.handle('export:preflight', async (_event, options) => {
    const format = normalizeRequestedFormat(options?.format);
    const encoder = await encoderForExportFormat(format, { refresh: options?.refreshEncoder === true });
    const duration = Math.max(0, Number(options?.duration) || 0);
    const width = Math.max(320, Math.min(7680, Math.round(Number(options?.width) || 1920)));
    const height = Math.max(240, Math.min(4320, Math.round(Number(options?.height) || 1080)));
    const fps = Math.max(1, Math.min(120, Math.round(Number(options?.fps) || 60)));
    const rawBytes = duration * width * height * fps * 4;
    const bitrate = exportProfileCatalog.bitrateRange(format, width, height, fps);
    const estimatedSize = exportProfileCatalog.estimatedSizeRange(format, width, height, fps, duration);
    const estimatedOutputBytes = estimatedSize.center;
    const requiredBytes = Math.ceil(estimatedSize.maximum * 1.15 + 536870912);
    const defaultDestination = app.getPath('videos');
    const freeBytes = await availableDiskBytes(defaultDestination).catch(() => 0);
    return {
      encoder: {
        id: encoder.id,
        label: encoder.label,
        hardware: encoder.hardware,
        warning: format === 'gpu_auto' && !encoder.hardware
          ? 'No compatible hardware AV1 or HEVC Main 10 encoder was found. CPU HEVC will preserve quality but export more slowly.'
          : format === 'av1_quality' && !encoder.hardware
            ? 'No compatible hardware AV1 encoder was found. CPU AV1 preserves quality but can take many times longer than the song duration, especially at 4K.'
            : ''
      },
      profile: videoFormats[format],
      estimatedBitrate: bitrate,
      estimatedSize,
      masterBytes: Math.ceil(rawBytes),
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
      format: item.format,
      pipeline: item.pipeline,
      recoverable: item.pipeline !== 'raw-profile' || ['ffv1', 'utvideo', 'png_sequence'].includes(item.format),
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
    if (manifest.format === 'png_sequence') {
      const frames = await countPngSequenceFrames(manifest.tempPath);
      if (!frames) throw new Error('No complete PNG frames were found in the interrupted sequence.');
      const session = {
        ...manifest,
        type: 'offline',
        outputPath: manifest.outputPath,
        tempPath: manifest.tempPath,
        framePattern: manifest.framePattern || path.join(manifest.outputPath, 'frame-%08d.png'),
        sequenceAudioPath: manifest.sequenceAudioPath || path.join(manifest.outputPath, 'audio.wav'),
        frameCount: frames,
        frameIndex: frames,
        finalEncoder: 'png_sequence',
        child: null,
        cancelled: false,
        finishing: true,
        completed: false
      };
      if (!event.sender.isDestroyed()) {
        event.sender.send('export:progress', {
          id: session.id,
          stage: 'finalize',
          progress: .7,
          message: `Completing ${frames} recovered PNG frames with matching audio...`
        });
      }
      await ensureExportDiskSpace(session.outputPath, Math.max(268435456, Number(manifest.tempBytes) || 0));
      try {
        await finalizePngSequence(session, frames);
        session.completed = true;
        if (!event.sender.isDestroyed()) {
          event.sender.send('export:progress', { id: session.id, stage: 'saving', progress: 1, message: 'Recovered sequence folder saved' });
        }
        const result = await completedExportDetails(session.outputPath, session.finalEncoder, {
          format: session.format,
          recovered: true,
          partial: frames < Math.max(frames, Number(manifest.frameCount) || 0)
        });
        await removeRecoveryFiles(session, { removeVideo: false });
        return result;
      } catch (error) {
        await writeRecoveryManifest(session, { status: 'interrupted', encodedFrames: frames }).catch(() => {});
        throw error;
      }
    }
    const rawProfile = manifest.pipeline === 'raw-profile';
    const recoverableRawMaster = rawProfile && ['ffv1', 'utvideo'].includes(manifest.format);
    if (rawProfile && !recoverableRawMaster) {
      throw new Error(`This interrupted ${videoFormats[manifest.format]?.name || 'compressed master'} stopped before FFmpeg could close its container. It cannot be safely recovered; discard it and run the export again.`);
    }
    const lossless = manifest.pipeline === 'ffv1-raw' || manifest.format === 'ffv1' || recoverableRawMaster;
    const frames = lossless
      ? Math.max(1, Math.round(Number(manifest.encodedFrames) || 1))
      : await inspectAndRepairIvf(manifest.tempPath);
    const encoder = recoverableRawMaster
      ? exportEncoderProfiles[manifest.format]
      : (lossless ? exportEncoderProfiles.ffv1 : await recommendedExportEncoder());
    const session = {
      ...manifest,
      type: 'offline',
      frameCount: frames,
      frameIndex: frames,
      format: videoFormats[manifest.format] ? manifest.format : 'youtube_hdr',
      pipeline: rawProfile ? 'raw-profile' : (lossless ? 'ffv1-raw' : 'webcodecs-ivf'),
      codec: lossless ? 'raw-rgba' : (manifest.codec === 'vp8' ? 'vp8' : 'vp9'),
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
      if (lossless) {
        await recoverLosslessFfv1Master(session, (progress) => notify('finalize', progress, `Recovering the ${videoFormats[session.format]?.name || 'lossless master'}...`));
      } else {
        try {
          await muxOfflineVideo(session, session.finalEncoder, (progress) => notify('finalize', progress, `Recovering with ${validatedEncoderProfile(session.finalEncoder).label}...`));
        } catch (hardwareError) {
          if (session.format === 'webm' || session.finalEncoder === 'libx264') throw hardwareError;
          session.finalEncoder = 'libx264';
          await muxOfflineVideo(session, 'libx264', (progress) => notify('finalize', progress, 'Recovering with CPU x264 fallback...'));
        }
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
    const requestedFormat = normalizeRequestedFormat(options?.format);
    const result = await dialog.showSaveDialog({
      title: 'Export music visualizer',
      defaultPath: `${suggested}.${requestedFormat}`,
      filters: saveDialogFilters(requestedFormat)
    });
    if (result.canceled || !result.filePath) return null;

    const { format, outputPath } = resolveOutputSelection(result.filePath, requestedFormat);

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
    return { id, outputPath, format };
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
    const audioPath = path.resolve(String(options?.audioPath || ''));
    const audioStat = await fs.promises.stat(audioPath).catch(() => null);
    if (!audioStat?.isFile()) throw new Error('The selected local audio file could not be opened for offline export.');
    const suggested = String(options?.suggestedName || 'quartic-pulse').replace(/[<>:"/\\|?*]/g, '-').slice(0, 100);
    const requestedFormat = normalizeRequestedFormat(options?.format);
    const format = requestedFormat;
    let outputPath;
    if (videoFormats[format].directory) {
      const result = await dialog.showOpenDialog({
        title: 'Choose where to create the recoverable PNG sequence folder',
        defaultPath: app.getPath('videos'),
        properties: ['openDirectory', 'createDirectory']
      });
      if (result.canceled || !result.filePaths?.[0]) return null;
      outputPath = await uniqueSequenceDirectory(result.filePaths[0], suggested);
    } else {
      const result = await dialog.showSaveDialog({
        title: 'Export offline music visualizer',
        defaultPath: `${suggested}.${videoFormats[format].extension}`,
        filters: saveDialogFilters(format)
      });
      if (result.canceled || !result.filePath) return null;
      outputPath = resolveOutputSelection(result.filePath, format).outputPath;
    }
    const id = crypto.randomUUID();
    const tempPath = format === 'png_sequence' ? outputPath : losslessPartialPath(outputPath, id);
    await ensureExportDiskSpace(outputPath, options?.requiredBytes);
    const finalEncoder = (await encoderForExportFormat(format)).id;
    const hdrOutput = format === 'youtube_hdr' && options?.hdrOutput === true;
    const tenBitOutput = hdrOutput || format === 'gpu_auto' || format === 'av1_quality';
    const pixelFormat = tenBitOutput && options?.pixelFormat === 'x2bgr10le'
      ? 'x2bgr10le'
      : 'rgba';
    if (tenBitOutput && pixelFormat !== 'x2bgr10le') {
      throw new Error('The selected 10-bit profile requires the RGB10 WebGL export framebuffer.');
    }
    const session = {
      id, type: 'offline', pipeline: 'raw-profile',
      outputPath, format, tempPath, audioPath, width, height, fps, frameCount, pixelFormat, hdrOutput,
      framePattern: format === 'png_sequence' ? path.join(outputPath, 'frame-%08d.png') : null,
      sequenceAudioPath: format === 'png_sequence' ? path.join(outputPath, 'audio.wav') : null,
      frameIndex: 0, stream: null, child: null, finishing: false, cancelled: false,
      completed: false, finalEncoder, createdAt: new Date().toISOString()
    };
    startRawProfileEncoder(session);
    exportSessions.set(id, session);
    await writeRecoveryManifest(session, { status: 'rendering' });
    return { id, outputPath, format, pipeline: session.pipeline };
  });

  ipcMain.handle('export:offline-frame', async (_event, id, bytes) => {
    const session = exportSessions.get(id);
    if (!session || session.type !== 'offline') throw new Error('Offline export session was not found.');
    const frame = Buffer.from(bytes || []);
    if (!frame.length || frame.length > 160 * 1024 * 1024) throw new Error('An offline frame was invalid.');
    const frameIndex = await appendRawProfileFrame(session, frame);
    if (frameIndex === 1 || frameIndex % Math.max(1, session.fps) === 0) {
      await writeRecoveryManifest(session, { status: 'rendering' });
    }
    return frameIndex;
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
      const expectedFrameCount = session.frameCount;
      const requestedFrameCount = Math.max(0, Math.round(Number(options?.renderedFrameCount) || 0));
      const allowPartial = options?.allowPartial === true;
      if (allowPartial && session.frameIndex > 0 && session.frameIndex < expectedFrameCount) {
        if (requestedFrameCount && requestedFrameCount !== session.frameIndex) {
          throw new Error(`Offline export frame count mismatch (${session.frameIndex} encoded, ${requestedFrameCount} rendered).`);
        }
        session.frameCount = session.frameIndex;
        notify('finalize', 0, `Finishing shortened export at ${(session.frameCount / session.fps).toFixed(1)} seconds...`);
      } else if (session.frameIndex !== expectedFrameCount) {
        throw new Error(`Offline export received ${session.frameIndex} of ${expectedFrameCount} frames.`);
      }
      notify('finalize', 0, `Closing ${videoFormats[session.format].name} and its audio...`);
      await finishRawProfileEncoder(session);
      if (session.cancelled) throw new Error('Offline export cancelled.');
      if (session.format === 'png_sequence') {
        notify('finalize', .7, 'Creating the matching 24-bit WAV and sequence manifest...');
        await finalizePngSequence(session, session.frameCount);
        notify('saving', 1, `Sequence folder saved to ${destinationName}`);
      } else {
        await fs.promises.unlink(session.outputPath).catch((error) => {
          if (error.code !== 'ENOENT') throw error;
        });
        await fs.promises.rename(session.tempPath, session.outputPath);
        notify('saving', 1, `Final file saved to ${destinationName}`);
      }
      session.completed = true;
      return completedExportDetails(session.outputPath, session.finalEncoder, {
        format: session.format,
        partial: session.frameCount < expectedFrameCount
      });
    } finally {
      if (session.cancelled) {
        if (session.format === 'png_sequence') await removeGeneratedSequenceFiles(session);
        else await fs.promises.unlink(session.outputPath).catch(() => {});
      }
      exportSessions.delete(id);
      if (session.completed || session.cancelled) await removeRecoveryFiles(session, { removeVideo: session.format !== 'png_sequence' });
      else await writeRecoveryManifest(session, { status: 'interrupted' }).catch(() => {});
    }
  });

  ipcMain.handle('export:offline-abort', async (_event, id) => {
    const session = exportSessions.get(id);
    if (!session || session.type !== 'offline') return false;
    session.cancelled = true;
    session.child?.stdin?.destroy();
    session.child?.kill();
    if (session.finishing) return true;
    if (session.pipeline === 'raw-profile') await session.encoderDone?.catch(() => {});
    session.stream?.destroy();
    exportSessions.delete(id);
    if (session.format === 'png_sequence') await removeGeneratedSequenceFiles(session);
    await removeRecoveryFiles(session, { removeVideo: session.format !== 'png_sequence' });
    return true;
  });

  ipcMain.handle('export:reveal', async (_event, filePath) => {
    shell.showItemInFolder(filePath);
  });
  ipcMain.handle('export:open', async (_event, filePath) => {
    const resolved = path.resolve(String(filePath || ''));
    const stat = await fs.promises.stat(resolved).catch(() => null);
    if (!stat || (!stat.isFile() && !stat.isDirectory())) throw new Error('The exported file or sequence folder could not be found.');
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
