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
    this.children = [];
    this.dataset = {};
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.checked = false;
    this.pointerCapture = null;
    this.innerHTML = '';
    this.type = '';
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
  click() { this.dispatch('click'); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  querySelectorAll() { return []; }
}

const ids = [
  'timeline', 'timelineFill', 'timeReadout', 'playIcon', 'playButton', 'liveDot', 'liveLabel',
  'restartButton', 'skipBackButton', 'skipForwardButton', 'volume', 'muteButton', 'playbackRate', 'loopPlayback',
  'performanceDock', 'performanceDockState', 'performanceDockCurrent', 'performanceDockNext',
  'performancePlayButton', 'performancePreviousButton', 'performanceNextButton', 'performanceBlackoutButton',
  'composerBuildButton', 'composerPanelBuildButton', 'openShowComposerButton', 'closeShowComposerButton',
  'composerPlayButton', 'composerAddCueButton', 'composerRecordButton', 'composerCueTrack', 'composerApplyCueButton',
  'composerMoveLeftButton', 'composerMoveRightButton', 'composerSnapButton', 'composerDeleteCueButton',
  'composerInspector', 'composerSelectedStatus', 'composerCueProfile', 'composerCueLabel', 'composerCueDuration',
  'composerCueDirector', 'composerCueMotion', 'composerCueEquation', 'composerCueFlow', 'composerCueAdvance',
  'composerCueTransition', 'composerCueCamera', 'composerRuler', 'composerAutomationLanes', 'composerCueCount',
  'composerDuration', 'composerPanelCueCount', 'composerPanelDuration', 'composerPanelStatus', 'composerSnapStatus',
  'composerPlayhead', 'showComposerWorkspace',
  'profileSearch', 'savedProfileSelect', 'profileStatus', 'applyProfileButton', 'favoriteProfileButton',
  'deleteProfileButton', 'exportProfileButton', 'saveProfileButton', 'quickSaveProfileButton',
  'resetActiveVisualButton', 'importProfileButton', 'importProfileInput',
  'performanceDockProgress', 'exportProgress', 'exportProgressFill', 'exportProgressText', 'stageRenderFill',
  'stageRenderText', 'stageRenderMeta', 'stageRenderMode', 'stageRenderNote', 'pauseExportButton',
  'endExportButton', 'cancelExportButton'
];
const elements = new Map(ids.map((id) => [`#${id}`, new FakeElement(id)]));
global.window = {};
const documentListeners = new Map();
global.document = {
  body: new FakeElement('body'),
  querySelector: (selector) => elements.get(selector) || null,
  querySelectorAll: () => [],
  createElement: (tagName) => {
    const element = new FakeElement(tagName);
    element.tagName = String(tagName).toUpperCase();
    return element;
  },
  addEventListener: (type, callback) => {
    if (!documentListeners.has(type)) documentListeners.set(type, []);
    documentListeners.get(type).push(callback);
  }
};

for (const file of ['audio-controller.js', 'audio-analysis-engine.js', 'performance-controller.js', 'performance-sequencer-engine.js', 'performance-show-data-engine.js', 'performance-show-composer-controller.js', 'profile-manager-controller.js', 'song-map-data-engine.js', 'song-director-engine.js', 'performance-package-engine.js', 'export-controller.js', 'export-session-engine.js', 'export-encoder-engine.js']) {
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

const composerEntries = [
  { id: 'cue-a', profileId: 'profile-a', label: 'Opening', advance: 'beats', value: 8, transition: 'cut', automation: { motion: 1.25 } },
  { id: 'cue-b', profileId: 'profile-a', label: 'Drop', advance: 'time', value: 4, transition: 'black', automation: { camera: 'orbit' } }
];
const composerProfiles = [{ id: 'profile-a', name: 'Main', kind: 'settings' }];
let composerBuilds = 0;
let composerPlays = 0;
let committedComposerDraft = null;
const showComposerController = window.QuarticPerformanceShowComposerController.create({
  getModel: () => ({ entries: composerEntries, profiles: composerProfiles, currentIndex: 0, playing: true, hasSongMap: true }),
  formatTime: (seconds) => `${seconds}s`,
  entryDuration: (entry) => Number(entry.value),
  sequenceDuration: () => 12,
  entryStart: (index) => index ? 8 : 0,
  profileForEntry: () => composerProfiles[0],
  sanitizeAutomation: (automation) => automation || {},
  onBuild: () => { composerBuilds += 1; },
  onPlay: () => { composerPlays += 1; },
  onCommit: (_cueId, draft) => { committedComposerDraft = draft; }
});
showComposerController.initialize();
showComposerController.bind();
elements.get('#composerBuildButton').dispatch('click');
elements.get('#composerPlayButton').dispatch('click');
showComposerController.setSelectedCueId('cue-b');
showComposerController.render();
elements.get('#composerCueLabel').value = 'Edited Drop';
elements.get('#composerCueDuration').value = '6.5';
elements.get('#composerCueDirector').value = '75';
elements.get('#composerApplyCueButton').dispatch('click');
assert(composerBuilds === 1 && composerPlays === 1, 'Show Composer callbacks were not bound exactly once.');
assert(showComposerController.selectedIndex() === 1 && showComposerController.selectedCueId === 'cue-b', 'Show Composer selection state failed.');
assert(elements.get('#composerCueTrack').children.length === 2 && elements.get('#composerAutomationLanes').children.length === 5, 'Show Composer timeline did not render its cues and automation lanes.');
assert(committedComposerDraft?.label === 'Edited Drop' && committedComposerDraft?.value === 6.5 && committedComposerDraft?.automation?.director === .75, 'Show Composer editor draft was not emitted correctly.');
assert(showComposerController.diagnostics.ready && showComposerController.diagnostics.bound && showComposerController.diagnostics.initialized, 'Show Composer controller diagnostics failed.');

const managerProfiles = [
  { id: 'normal', name: 'Normal Profile', kind: 'settings', favorite: false, updatedAt: '2026-01-01T00:00:00.000Z', data: {} },
  { id: 'favorite', name: 'Favorite Colors', kind: 'colors', favorite: true, updatedAt: '2025-01-01T00:00:00.000Z', data: {} }
];
let appliedProfileId = '';
let profileRenderCount = 0;
const profileManagerController = window.QuarticProfileManagerController.create({
  getProfiles: () => managerProfiles,
  findProfile: (profiles, id) => profiles.find((profile) => profile.id === id) || null,
  onApply: (profile) => { appliedProfileId = profile.id; },
  onRendered: () => { profileRenderCount += 1; }
});
profileManagerController.initialize();
assert(elements.get('#savedProfileSelect').children[0].value === 'favorite', 'Profile favorites were not sorted first.');
assert(profileManagerController.selectedProfile()?.id === 'favorite', 'Profile manager did not select the first visible profile.');
elements.get('#applyProfileButton').dispatch('click');
assert(appliedProfileId === 'favorite', 'Profile apply callback did not receive the selected profile.');
elements.get('#profileSearch').value = 'normal';
elements.get('#profileSearch').dispatch('input');
assert(profileManagerController.selectedProfile()?.id === 'normal' && profileRenderCount === 2, 'Profile search did not filter and select the matching profile.');
elements.get('#profileSearch').value = 'missing';
elements.get('#profileSearch').dispatch('input');
assert(elements.get('#applyProfileButton').disabled && elements.get('#profileStatus').textContent.includes('No saved profile'), 'Empty profile search state did not disable actions.');
assert(profileManagerController.diagnostics.ready && profileManagerController.diagnostics.bound && profileManagerController.diagnostics.initialized, 'Profile manager diagnostics failed.');

const straightSequencer = window.QuarticPerformanceSequencerEngine.create();
assert(straightSequencer.entryDurationSeconds({ advance: 'beats', value: 16 }, 120) === 8, 'Beat cue duration was incorrect.');
assert(straightSequencer.sequenceDurationSeconds([
  { advance: 'time', value: 5 },
  { advance: 'beats', value: 8 }
], 120) === 9, 'Show duration was incorrect.');
assert(straightSequencer.entryStartSeconds([
  { advance: 'time', value: 3 },
  { advance: 'time', value: 4 }
], 1, 120) === 3, 'Cue start time was incorrect.');
assert(straightSequencer.previewNextIndex({ length: 3, index: 2, loop: true }) === 0, 'Loop preview did not wrap.');
assert(straightSequencer.previewNextIndex({ length: 3, index: 2, loop: false }) === -1, 'Non-loop preview did not report the end.');
assert(straightSequencer.decideAdvance({ length: 3, index: 1 }).index === 2, 'Straight cue advance was incorrect.');
assert(straightSequencer.decideAdvance({ length: 3, index: 2, loop: true }).index === 0, 'Loop cue advance did not wrap.');
assert(straightSequencer.decideAdvance({ length: 3, index: 2, loop: false }).stop, 'Non-loop cue advance did not stop.');
const shuffledSequencer = window.QuarticPerformanceSequencerEngine.create({ random: () => 0 });
assert(shuffledSequencer.decideAdvance({ length: 4, index: 0, shuffle: true }).index === 1, 'Shuffle repeated the current cue.');
const timeEntry = { advance: 'time', value: 4 };
const timeProgress = straightSequencer.calculateProgress({ entry: timeEntry, startTime: 10, currentTime: 12 });
assert(timeProgress === .5 && straightSequencer.shouldAdvance(timeEntry, 1, false), 'Time cue progression was incorrect.');
const beatEntry = { advance: 'beats', value: 8 };
const beatProgress = straightSequencer.calculateProgress({ entry: beatEntry, startBeat: 4, beatIndex: 8, beatPhase: 0 });
assert(beatProgress === .5, 'Beat cue progression was incorrect.');
assert(!straightSequencer.shouldAdvance(beatEntry, 1, false) && straightSequencer.shouldAdvance(beatEntry, 1, true), 'Beat cue boundary did not wait for a detected beat change.');
assert(straightSequencer.diagnostics.ready, 'Performance sequencer diagnostics failed.');

let generatedShowId = 0;
const showDataEngine = window.QuarticPerformanceShowDataEngine.create({ createId: () => `cue-${++generatedShowId}` });
const sanitizedAutomation = showDataEngine.sanitizeAutomation({ director: 4, motion: -2, equation: .75, flow: '0.5', camera: 'orbit', ignored: true });
assert(sanitizedAutomation.director === 1 && sanitizedAutomation.motion === 0 && sanitizedAutomation.equation === .75, 'Cue automation ranges were not normalized.');
assert(sanitizedAutomation.flow === .5 && sanitizedAutomation.camera === 'orbit' && !Object.hasOwn(sanitizedAutomation, 'ignored'), 'Cue automation fields were not filtered.');
const sanitizedEntry = showDataEngine.sanitizeEntry({ label: '  Cue\u0000 Name  ', advance: 'time', value: 1.237, transition: 'cut', automation: sanitizedAutomation });
assert(sanitizedEntry.label === 'Cue  Name' && sanitizedEntry.value === 1.24 && sanitizedEntry.transition === 'cut', 'Show entry normalization failed.');
const restoredShow = showDataEngine.parseShowDocument(JSON.stringify({
  entries: [{ profileId: 'profile-1', advance: 'beats', value: 16 }],
  loop: false,
  shuffle: true,
  autoBpm: false,
  manualBpm: 500,
  beatOffsetMs: -900
}));
assert(restoredShow.entries[0].id === 'cue-1' && restoredShow.entries[0].value === 16, 'Stored show entries were not restored with stable IDs.');
assert(!restoredShow.loop && restoredShow.shuffle && !restoredShow.autoBpm && restoredShow.manualBpm === 200 && restoredShow.beatOffsetMs === -500, 'Stored show preferences were not bounded.');
const malformedShow = showDataEngine.parseShowDocument('{bad-json');
assert(malformedShow.entries.length === 0 && malformedShow.loop && malformedShow.manualBpm === 120, 'Malformed show storage did not use safe defaults.');
const automationApplication = showDataEngine.automationApplication({ automation: { director: .4, motion: 1.2, camera: 'drift' } });
assert(automationApplication.controls.songDirectorIntensity === .4 && automationApplication.controls.motion === 1.2 && automationApplication.camera === 'drift', 'Cue automation application mapping failed.');
const validProfile = { id: 'profile-1', name: 'Smoke Profile', kind: 'settings', data: { controls: {} } };
const parsedProfiles = showDataEngine.parseProfiles(JSON.stringify([validProfile, { name: 'Broken' }]));
assert(parsedProfiles.length === 1 && showDataEngine.findProfile(parsedProfiles, 'profile-1')?.name === validProfile.name, 'Saved profile validation or lookup failed.');
assert(JSON.parse(showDataEngine.serializeProfiles(parsedProfiles)).length === 1, 'Saved profile serialization failed.');
assert(showDataEngine.diagnostics.ready, 'Performance show data diagnostics failed.');

const songMapEngine = window.QuarticSongMapDataEngine.create({
  cacheLimit: 2,
  now: () => new Date('2026-08-09T12:00:00.000Z')
});
assert(songMapEngine.hashText('') === '811c9dc5', 'Song Map hash compatibility changed.');
const mapSignature = songMapEngine.profileSignature({
  personality: 'rock',
  bands: { floor: 20, lowMid: 250, midHigh: 4000, ceiling: 16000 },
  bassGain: 1,
  midGain: .9,
  highGain: 1.1,
  smoothing: .55,
  beatSensitivity: .65,
  beatCooldownMs: 150
});
const mapItem = { file: { name: 'Song.wav', size: 1234, lastModified: 99 }, filePath: 'C:/Music/Song.wav' };
assert(songMapEngine.mapKey(mapItem, mapSignature).startsWith('map-'), 'Song Map cache identity was not created.');
const validSongMap = {
  version: 1,
  key: 'map-a',
  duration: 4,
  interval: 1,
  energy: [0, 64, 128, 255],
  bass: [0, 1, 2, 3],
  mids: [0, 1, 2, 3],
  highs: [0, 1, 2, 3],
  beats: [1, 2, 3],
  sections: [{ start: 2, end: 4 }],
  updatedAt: '2026-08-09T00:00:00.000Z'
};
assert(songMapEngine.isValidMap(validSongMap) && !songMapEngine.isValidMap({ ...validSongMap, highs: [1] }), 'Song Map validation failed.');
assert(songMapEngine.parseCache('{bad-json').length === 0, 'Malformed Song Map cache did not recover safely.');
const olderMap = { ...validSongMap, key: 'map-old', updatedAt: '2025-01-01T00:00:00.000Z' };
const newestMap = { ...validSongMap, key: 'map-new', updatedAt: '2026-08-10T00:00:00.000Z' };
const orderedMaps = songMapEngine.prepareCache([olderMap, validSongMap, newestMap]);
assert(orderedMaps.length === 2 && orderedMaps[0].key === 'map-new', 'Song Map cache ordering or limit failed.');
assert(Math.abs(songMapEngine.sectionEnergy(validSongMap, { start: 2, end: 4 }) - (383 / 2 / 255)) < .0001, 'Song Map section energy was incorrect.');
let directorOverrides = songMapEngine.updateOverride([], 'map-a', 2, { strength: .7, emphasis: 'camera' });
assert(songMapEngine.overrideFor(directorOverrides, 'map-a', 2)?.emphasis === 'camera', 'Song Director override was not stored.');
directorOverrides = songMapEngine.updateOverride(directorOverrides, 'map-a', 2, null);
assert(!songMapEngine.overrideFor(directorOverrides, 'map-a', 2), 'Song Director override was not removed.');
assert(songMapEngine.diagnostics.ready, 'Song Map data engine diagnostics failed.');

const songDirectorEngine = window.QuarticSongDirectorEngine.create({ hashText: songMapEngine.hashText });
const directorMap = {
  key: 'director-map',
  duration: 12,
  personality: 'electronic',
  beats: [1, 2, 3, 4.5, 6, 7.5, 9, 10.5],
  sections: [
    { start: 0, end: 5, label: 'Opening Build', kind: 'build', energy: .55, bass: .7, mids: .5, highs: .4 },
    { start: 5, end: 12, label: 'Main Peak', kind: 'peak', energy: .92, bass: .9, mids: .75, highs: .8 }
  ]
};
assert(songDirectorEngine.resolveBehavior('auto', directorMap) === 'electronic', 'Song Director did not resolve the mapped music personality.');
const directorPlan = songDirectorEngine.generatePlan(directorMap, 'rock');
assert(directorPlan.length === 2 && directorPlan.every((cue) => cue.behaviorId === 'rock'), 'Song Director plan did not apply the selected behavior.');
assert(JSON.stringify(directorPlan) === JSON.stringify(songDirectorEngine.generatePlan(directorMap, 'rock')), 'Song Director plan generation was not deterministic.');
const directorResult = songDirectorEngine.evaluate({
  plan: directorPlan,
  map: directorMap,
  time: 6,
  styleId: 'mathematical',
  intensity: .5,
  getOverride: (index) => index === 1 ? { strength: .8, emphasis: 'equation' } : null,
  dimensionalEnabled: false,
  foldingEnabled: false
});
assert(directorResult.cue.index === 1 && directorResult.values.cueLabel === 'Main Peak', 'Song Director did not select the active cue.');
assert(Number.isFinite(directorResult.values.motion) && Number.isFinite(directorResult.values.equation), 'Song Director modulation values were not finite.');
assert(directorResult.values.fractalTilt === 0 && directorResult.values.fractalSlice === 0, 'Song Director dimensional gating failed.');
assert(directorResult.values.equationFold === 0 && directorResult.values.equationWarp === 0, 'Song Director folding gating failed.');
assert(songDirectorEngine.diagnostics.ready, 'Song Director engine diagnostics failed.');

let packageId = 0;
const packageEngine = window.QuarticPerformancePackageEngine.create({
  appVersion: 'smoke',
  hashText: (value) => `H${value.length}`,
  sanitizeEntry: showDataEngine.sanitizeEntry,
  isValidProfile: showDataEngine.isValidProfile,
  isValidSongMap: (map) => Array.isArray(map?.sections),
  createId: () => `import-${++packageId}`,
  now: () => new Date('2026-08-09T12:00:00.000Z')
});
const packageTrack = { name: 'Smoke Song', file: { name: 'Smoke.wav', size: 4096, lastModified: 123 } };
const trackIdentity = packageEngine.trackIdentity(packageTrack, { duration: 12.3456 });
assert(trackIdentity.fileName === 'Smoke.wav' && trackIdentity.duration === 12.346, 'Performance track identity was not normalized.');
assert(packageEngine.trackMatches(trackIdentity, packageTrack, 13.5), 'Performance track identity did not match within duration tolerance.');
assert(!packageEngine.trackMatches(trackIdentity, { file: { name: 'Other.wav', size: 4096 } }, 13.5), 'Performance track identity accepted a different file.');
const portableMap = packageEngine.portableSongMap({ key: 'local-key', sections: [], duration: 12 });
assert(portableMap && !Object.hasOwn(portableMap, 'key'), 'Portable Song Map retained its local cache key.');
const packagedPerformance = {
  metadata: { title: 'Smoke Performance' },
  currentVisual: validProfile,
  show: {
    profiles: [validProfile],
    entries: [{ id: 'old-cue', profileId: 'profile-1', advance: 'beats', value: 8 }],
    loop: false,
    manualBpm: 220,
    beatOffsetMs: 900
  },
  director: { map: portableMap }
};
const performanceDocument = packageEngine.createDocument(packagedPerformance);
const validatedPackage = packageEngine.validateDocument(performanceDocument);
assert(validatedPackage.performance.metadata.title === 'Smoke Performance' && performanceDocument.appVersion === 'smoke', 'Performance package round trip failed.');
const remappedShow = packageEngine.remapImportedShow(validatedPackage.performance, []);
assert(remappedShow.importedProfiles[0].id === 'import-1' && remappedShow.entries[0].id === 'import-2', 'Imported package IDs were not remapped.');
assert(remappedShow.entries[0].profileId === 'import-1' && remappedShow.manualBpm === 200 && remappedShow.beatOffsetMs === 500, 'Imported show references or limits were incorrect.');
let tamperRejected = false;
try { packageEngine.validateDocument({ ...performanceDocument, performance: { ...performanceDocument.performance, metadata: { title: 'Tampered' } } }); }
catch (_) { tamperRejected = true; }
assert(tamperRejected, 'Performance package fingerprint did not reject modified contents.');
assert(packageEngine.suggestedFilename(' My Live Show! ') === 'my-live-show', 'Performance package filename was not normalized.');
assert(packageEngine.diagnostics.ready, 'Performance package engine diagnostics failed.');

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

class FakeMediaRecorder {
  static isTypeSupported(type) { return type.includes('vp9') || type === 'video/webm'; }
  constructor(stream, config) {
    this.stream = stream;
    this.config = config;
    this.state = 'inactive';
    this.listeners = new Map();
  }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  emit(type, event = {}) { for (const callback of this.listeners.get(type) || []) callback(event); }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.emit('stop'); }
}

class FakeVideoFrame {
  constructor(source, config) { this.source = source; this.config = config; this.closed = false; }
  close() { this.closed = true; }
}

class FakeVideoEncoder {
  static async isConfigSupported(config) { return { supported: config.codec.startsWith('vp09'), config }; }
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.state = 'unconfigured';
    this.encodeQueueSize = 0;
  }
  configure(config) { this.config = config; this.state = 'configured'; }
  encode(frame) {
    this.encodeQueueSize += 1;
    const value = Math.round(frame.config.timestamp / 1000);
    this.callbacks.output({ byteLength: 1, copyTo: (bytes) => { bytes[0] = value; } });
  }
  async flush() { this.encodeQueueSize = 0; }
  close() { this.state = 'closed'; }
}

(async () => {
  const encoderEngine = window.QuarticExportEncoderEngine.create({
    MediaRecorderClass: FakeMediaRecorder,
    VideoEncoderClass: FakeVideoEncoder,
    VideoFrameClass: FakeVideoFrame
  });
  assert(encoderEngine.chooseRecorderType().includes('vp9'), 'Live recorder type selection did not prefer VP9.');
  const encoderChoice = await encoderEngine.chooseOfflineConfig(1920, 1080, 60, 1.6);
  assert(encoderChoice.codecName === 'vp9' && encoderChoice.bitrate > 0, 'Offline encoder configuration selection failed.');

  const liveChunks = [];
  const liveEncoder = encoderEngine.createLive({
    stream: {},
    videoBitsPerSecond: 12000000,
    onChunk: async (bytes) => { liveChunks.push(new Uint8Array(bytes)[0]); }
  });
  liveEncoder.start();
  liveEncoder.recorder.emit('dataavailable', { data: { size: 1, arrayBuffer: async () => Uint8Array.of(1).buffer } });
  liveEncoder.recorder.emit('dataavailable', { data: { size: 1, arrayBuffer: async () => Uint8Array.of(2).buffer } });
  liveEncoder.stop();
  await liveEncoder.waitForStop();
  await liveEncoder.drain();
  assert(liveChunks.join(',') === '1,2', 'Live encoder chunks were not serialized in emission order.');

  const offlineChunks = [];
  const offlineEncoder = encoderEngine.createOffline({
    encoderConfig: encoderChoice.config,
    onChunk: async (bytes) => { offlineChunks.push(bytes[0]); }
  });
  for (let index = 1; index <= 6; index++) {
    offlineEncoder.encode({}, { timestamp: index * 1000, duration: 1000, keyFrame: index === 1 });
  }
  const flushed = await offlineEncoder.flushIfBackpressured(5);
  await offlineEncoder.finish();
  assert(flushed && offlineChunks.join(',') === '1,2,3,4,5,6', 'Offline encoder backpressure or chunk ordering failed.');
  assert(offlineEncoder.state === 'closed', 'Offline encoder did not close after finalization.');
  console.log('CONTROLLER_SMOKE_OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
