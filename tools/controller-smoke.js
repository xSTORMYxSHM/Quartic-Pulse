'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  toggle(value, force) {
    if (force === undefined) force = !this.values.has(value);
    if (force) this.values.add(value); else this.values.delete(value);
    return force;
  }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(id) {
    this.id = id;
    this.style = {};
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.checked = false;
    this.pointerCapture = null;
  }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  dispatch(type, properties = {}) {
    const event = { type, target: this, preventDefault() {}, ...properties };
    for (const callback of this.listeners.get(type) || []) callback(event);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  getBoundingClientRect() { return { left: 10, width: 200 }; }
  setPointerCapture(id) { this.pointerCapture = id; }
  hasPointerCapture(id) { return this.pointerCapture === id; }
  releasePointerCapture(id) { if (this.pointerCapture === id) this.pointerCapture = null; }
}

const ids = [
  'timeline', 'timelineFill', 'timeReadout', 'playIcon', 'playButton', 'liveDot', 'liveLabel',
  'restartButton', 'skipBackButton', 'skipForwardButton', 'volume', 'muteButton', 'playbackRate', 'loopPlayback',
  'performanceDock', 'performanceDockState', 'performanceDockCurrent', 'performanceDockNext',
  'performancePlayButton', 'performancePreviousButton', 'performanceNextButton', 'performanceBlackoutButton',
  'performanceDockProgress', 'exportProgress', 'exportProgressFill', 'exportProgressText', 'stageRenderFill',
  'stageRenderText', 'stageRenderMeta', 'stageRenderMode', 'stageRenderNote', 'pauseExportButton',
  'endExportButton', 'cancelExportButton'
];
const elements = new Map(ids.map((id) => [`#${id}`, new FakeElement(id)]));
global.window = {};
global.document = {
  body: new FakeElement('body'),
  querySelector: (selector) => elements.get(selector) || null
};

for (const file of ['audio-controller.js', 'audio-analysis-engine.js', 'performance-controller.js', 'export-controller.js', 'export-session-engine.js']) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'modules', file), 'utf8');
  vm.runInThisContext(source, { filename: file });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const audio = { duration: 120, currentTime: 0 };
let exporting = false;
let toggled = 0;
let restarted = 0;
let skipped = 0;
const audioController = window.QuarticAudioController.create({
  audio,
  formatTime: (seconds) => String(Math.round(seconds)),
  getState: () => ({ exporting }),
  onTogglePlayback: () => { toggled += 1; },
  onRestart: () => { restarted += 1; },
  onSkip: (amount) => { skipped += amount; }
});
audioController.bind();
elements.get('#playButton').dispatch('click');
elements.get('#restartButton').dispatch('click');
elements.get('#skipForwardButton').dispatch('click');
elements.get('#timeline').dispatch('pointerdown', { pointerType: 'mouse', button: 0, pointerId: 7, clientX: 110 });
elements.get('#timeline').dispatch('pointerup', { pointerType: 'mouse', button: 0, pointerId: 7, clientX: 110 });
audioController.renderTransport({ playing: true, deckPlaying: true });
assert(toggled === 1 && restarted === 1 && skipped === 10, 'Audio transport callbacks were not bound.');
assert(audio.currentTime === 60, 'Timeline pointer seeking did not update the media position.');
assert(elements.get('#timelineFill').style.width === '50%', 'Timeline presentation did not render.');
assert(audioController.diagnostics.ready && audioController.diagnostics.bound, 'Audio controller diagnostics failed.');

const spectrumAnalyser = {
  frequencyBinCount: 128,
  fftSize: 256,
  getByteFrequencyData: (data) => data.fill(180),
  getByteTimeDomainData: (data) => data.fill(164)
};
const beatAnalyser = {
  frequencyBinCount: 128,
  getByteFrequencyData: (data) => data.fill(255)
};
const analysisState = {
  bass: 0,
  mids: 0,
  highs: 0,
  rms: 0,
  beat: 0,
  beatPulse: true,
  beatSensitivity: .65,
  beatCooldownMs: 150,
  beatFastEnvelope: 0,
  beatSlowEnvelope: 0,
  beatOnsetAverage: .008,
  beatCooldownRemaining: 0,
  beatDetectorArmed: true,
  beatDetectedTotal: 0,
  reactivity: 1,
  autoReactivity: true,
  autoReactivityTarget: .55,
  autoReactivityGain: 1,
  analysisBassGain: 1,
  analysisMidGain: 1,
  analysisHighGain: 1,
  analysisSmoothing: .55,
  frequencyHue: 0,
  dominantBand: 'silence',
  pulsePreviousLevels: new Float32Array(3),
  spectrumData: new Float32Array(64),
  waveformData: new Float32Array(64)
};
let analysisBeatCount = 0;
let analysisPulseCount = 0;
const analysisEngine = window.QuarticAudioAnalysisEngine.create();
analysisEngine.attach({ sampleRate: 48000 }, spectrumAnalyser, beatAnalyser);
analysisEngine.resetBeatDetector(analysisState);
const activeAnalysis = analysisEngine.update(analysisState, {
  active: true,
  delta: 1 / 60,
  bands: { floor: 20, lowMid: 250, midHigh: 4000, ceiling: 16000 },
  onBeat: () => { analysisBeatCount += 1; },
  onPulse: () => { analysisPulseCount += 1; }
});
assert(analysisEngine.diagnostics.ready, 'Audio analysis engine did not attach its analyser buffers.');
assert(activeAnalysis.levels.every((level) => level > 0), 'Audio analysis engine did not calculate frequency levels.');
assert(analysisState.rms > 0 && analysisState.dominantBand !== 'silence', 'Audio analysis output state was not updated.');
assert(analysisBeatCount === 1 && analysisPulseCount === 1, 'Audio analysis callbacks were not emitted.');
const activeBass = analysisState.bass;
analysisEngine.update(analysisState, { active: false });
assert(analysisState.bass < activeBass, 'Inactive audio analysis did not decay its output.');

let performanceActions = 0;
const performanceController = window.QuarticPerformanceController.create({
  onPrevious: () => { performanceActions += 1; },
  onPlayPause: () => { performanceActions += 1; },
  onNext: () => { performanceActions += 1; },
  onToggleBlackout: () => { performanceActions += 1; }
});
performanceController.bind();
['#performancePreviousButton', '#performancePlayButton', '#performanceNextButton', '#performanceBlackoutButton']
  .forEach((selector) => elements.get(selector).dispatch('click'));
performanceController.renderDock({ stateLabel: 'SHOW PLAYING', currentLabel: 'Current', nextLabel: 'Next', playLabel: 'PAUSE', hasEntries: true });
performanceController.setProgress(.42);
assert(performanceActions === 4, 'Performance controller callbacks were not bound.');
assert(elements.get('#performanceDockProgress').style.width === '42%', 'Performance progress did not render.');
assert(performanceController.diagnostics.ready && performanceController.diagnostics.bound, 'Performance controller diagnostics failed.');

let exportActions = 0;
const exportController = window.QuarticExportController.create({
  onEnd: () => { exportActions += 1; },
  onCancel: () => { exportActions += 1; },
  onPause: () => { exportActions += 1; }
});
exportController.bind();
['#endExportButton', '#cancelExportButton', '#pauseExportButton'].forEach((selector) => elements.get(selector).dispatch('click'));
exportController.begin();
exportController.setMode('offline');
exportController.renderProgress({ overall: .5, panelText: 'Half', stageText: 'Rendering 50%', metaText: 'ETA' });
assert(exportActions === 3, 'Export controller callbacks were not bound.');
assert(elements.get('#exportProgressFill').style.width === '50%', 'Export progress did not render.');
assert(elements.get('#stageRenderMode').textContent === 'OFFLINE MASTER EXPORT', 'Export mode did not render.');
assert(exportController.diagnostics.ready && exportController.diagnostics.bound, 'Export controller diagnostics failed.');

let exportClock = 1000;
const exportSessionEngine = window.QuarticExportSessionEngine.create({ now: () => exportClock });
const exportSession = { id: 'smoke-export' };
exportSessionEngine.begin(exportSession, 'offline');
exportSessionEngine.startProgress();
exportClock = 4000;
let exportTiming = exportSessionEngine.updateProgress(.5);
assert(exportSession.mode === 'offline' && exportSessionEngine.matches('smoke-export'), 'Export session identity was not initialized.');
assert(exportTiming.elapsedSeconds === 3 && exportTiming.remainingSeconds === 3, 'Export elapsed time or ETA was incorrect.');
exportSessionEngine.pause();
exportClock = 9000;
assert(exportSessionEngine.timing().elapsedSeconds === 3, 'Paused export time continued advancing.');
exportSessionEngine.resume();
exportClock = 11000;
exportTiming = exportSessionEngine.updateProgress(.75);
assert(exportTiming.elapsedSeconds === 5, 'Resumed export did not exclude paused duration.');
exportSessionEngine.requestFinish();
exportSessionEngine.requestCancel();
assert(exportSessionEngine.finishRequested && exportSessionEngine.cancelRequested, 'Export lifecycle requests were not recorded.');
exportSessionEngine.markCompleted();
assert(exportSessionEngine.completed && exportSessionEngine.progress === 1, 'Export completion state was not recorded.');
exportSessionEngine.clear();
assert(!exportSessionEngine.session, 'Export session was not cleared.');

console.log('CONTROLLER_SMOKE_OK');
