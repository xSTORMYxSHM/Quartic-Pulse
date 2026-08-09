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

for (const file of ['audio-controller.js', 'performance-controller.js', 'export-controller.js']) {
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

console.log('CONTROLLER_SMOKE_OK');
