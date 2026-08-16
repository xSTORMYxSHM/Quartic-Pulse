'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const exportFormatPolicy = require('../src/main/export-format-policy');
const exportProfileCatalog = require('../src/shared/export-profiles');

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
  dispatchEvent(event) { this.dispatch(event.type); return true; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  getBoundingClientRect() { return { left: 10, width: 200 }; }
  setPointerCapture(id) { this.pointerCapture = id; }
  hasPointerCapture(id) { return this.pointerCapture === id; }
  releasePointerCapture(id) { if (this.pointerCapture === id) this.pointerCapture = null; }
  click() { this.dispatch('click'); }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelector(selector) {
    const tagName = String(selector).toUpperCase();
    return this.children.find((child) => child.tagName === tagName) || null;
  }
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
  'endExportButton', 'cancelExportButton', 'resolution', 'exportIterations', 'fps', 'exportMode',
  'exportDetail', 'exportSupersampling', 'videoFormat', 'exportHdrOutput', 'scanExportEncodersButton',
  'exportButton', 'exportLabel', 'exportIcon', 'revealButton', 'showExportPreview', 'unleashedMode', 'performanceMode',
  'benchmarkExportButton', 'clearExportHistoryButton', 'exportAdvisor', 'exportAdvisorList',
  'exportPerformanceNote', 'exportProfileSummary', 'exportEncoderStatus', 'exportEncoderDecision',
  'exportEncoderDevices', 'exportEncoderCapabilityList', 'exportPreflightDialog', 'exportPreflightSummary',
  'preflightVideo', 'preflightEncoder', 'preflightFormat', 'preflightColor', 'preflightBitrate',
  'preflightOutput', 'preflightSpace', 'preflightFree', 'preflightDuration', 'preflightWarning',
  'preflightCancelButton', 'preflightStartButton', 'preflightTestButton', 'exportReadinessSummary',
  'exportReadinessNote', 'benchmarkEncoderFps', 'benchmarkRenderFps', 'benchmarkBottleneck', 'benchmarkMinuteTime',
  'exportHistoryList', 'exportRecoveryCard', 'exportRecoveryList'
];
const elements = new Map(ids.map((id) => [`#${id}`, new FakeElement(id)]));
for (const [selector, tags] of [
  ['#exportProfileSummary', ['strong', 'span', 'small']],
  ['#exportEncoderStatus', ['strong', 'small']]
]) {
  for (const tag of tags) {
    const child = new FakeElement(tag);
    child.tagName = tag.toUpperCase();
    elements.get(selector).appendChild(child);
  }
}
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

for (const file of ['audio-controller.js', 'audio-analysis-engine.js', 'performance-controller.js', 'performance-sequencer-engine.js', 'performance-show-data-engine.js', 'performance-show-composer-controller.js', 'profile-manager-controller.js', 'song-map-data-engine.js', 'song-director-engine.js', 'song-director-controller.js', 'performance-package-engine.js', 'export-controller.js', 'export-session-engine.js', 'export-progress-workflow-engine.js', 'export-progress-coordinator.js', 'export-command-coordinator.js', 'export-job-coordinator.js', 'export-result-workflow-engine.js', 'export-encoder-engine.js', 'export-live-capture-engine.js', 'export-quick-clip-workflow-engine.js', 'export-sampling-engine.js', 'export-settings-snapshot-engine.js', 'export-preparation-engine.js', 'export-frame-capture-engine.js', 'export-planning-engine.js', 'export-presentation-engine.js', 'export-preflight-engine.js', 'export-advisor-engine.js', 'export-settings-coordinator-engine.js', 'export-runtime-state-coordinator.js', 'export-encoder-scan-engine.js', 'export-benchmark-engine.js', 'export-history-engine.js', 'export-history-action-engine.js', 'export-recovery-engine.js', 'export-render-coordinator.js', 'export-workflow-engine.js', 'export-offline-lifecycle.js', 'export-live-lifecycle.js']) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'modules', file), 'utf8');
  vm.runInThisContext(source, { filename: file });
}

assert(window.QuarticSongDirectorController?.create, 'Song Director controller module did not load.');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(exportFormatPolicy.orderedFormatIds('youtube_hdr')[0] === 'youtube_hdr', 'YouTube HDR was not the requested save-dialog profile.');
assert(exportFormatPolicy.saveDialogFilters('gpu_auto')[0].extensions[0] === 'mp4', 'Automatic GPU master did not use MP4.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/automatic.webm', 'gpu_auto').outputPath.endsWith('.mp4'), 'Automatic GPU master did not enforce MP4.');
assert(exportFormatPolicy.videoFormats.gpu_auto.colorDepth === '10-bit', 'Automatic GPU master lost its 10-bit policy.');
assert(exportFormatPolicy.saveDialogFilters('youtube_hdr')[0].extensions[0] === 'mp4', 'YouTube HDR did not use the MP4 save filter.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/visual', 'youtube_hdr').outputPath.endsWith('.mp4'), 'YouTube HDR extension was not applied.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/visual.mkv', 'youtube_hdr').format === 'youtube_hdr', 'The selected quality profile changed with the typed extension.');
assert(exportFormatPolicy.saveDialogFilters('ffv1')[0].extensions[0] === 'mkv', 'FFV1 master did not use the Matroska save filter.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/lossless-master', 'ffv1').outputPath.endsWith('.mkv'), 'FFV1 master did not receive an MKV extension.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/lossless-master.mkv', 'ffv1').format === 'ffv1', 'FFV1 identity was lost when resolving its MKV destination.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/youtube-master.webm', 'youtube_hdr').outputPath.endsWith('.mp4'), 'YouTube HDR master did not enforce its MP4 container.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/playback-master.mkv', 'utvideo').format === 'utvideo', 'Ut Video profile identity was lost when resolving its MKV destination.');
assert(exportFormatPolicy.saveDialogFilters('mp4_compatible')[0].extensions[0] === 'mp4', 'Compatible H.264 profile did not use MP4.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/open-master.mp4', 'webm_quality').outputPath.endsWith('.webm'), 'Open quality profile did not enforce WebM.');
assert(exportFormatPolicy.saveDialogFilters('av1_quality')[0].extensions[0] === 'webm', 'AV1 master did not use the WebM save filter.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/av1-master.mp4', 'av1_quality').outputPath.endsWith('.webm'), 'AV1 master did not enforce WebM.');
assert(exportFormatPolicy.videoFormats.av1_quality.colorDepth === '10-bit', 'AV1 master lost its 10-bit policy.');
assert(exportFormatPolicy.videoFormats.av1_quality.advanced === true, 'AV1 master lost its Advanced-only policy.');
assert(exportFormatPolicy.resolveOutputSelection('C:/Exports/editing-master', 'prores_422_hq').outputPath.endsWith('.mov'), 'ProRes editing master did not receive a MOV extension.');
assert(exportFormatPolicy.videoFormats.webm_quality.chroma === '4:4:4', 'WebM profile lost its full-chroma policy.');
assert(exportFormatPolicy.videoFormats.prores_422_hq.colorDepth === '10-bit', 'ProRes profile lost its 10-bit policy.');
assert(exportFormatPolicy.videoFormats.png_sequence.directory === true, 'PNG sequence profile lost its folder-destination policy.');
assert(exportFormatPolicy.videoFormats.png_sequence.audioCodec.includes('PCM 24-bit'), 'PNG sequence profile lost its matching WAV policy.');
assert(exportFormatPolicy.videoFormats.png_sequence.chroma === 'RGBA 4:4:4:4', 'PNG sequence profile lost its lossless full-chroma policy.');

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
const motifMap = {
  ...directorMap,
  key: 'motif-map',
  duration: 24,
  sections: [
    { start: 0, end: 6, label: 'First Chorus', kind: 'peak', energy: .82, bass: .68, mids: .73, highs: .79 },
    { start: 6, end: 12, label: 'Breakdown', kind: 'breakdown', energy: .3, bass: .4, mids: .35, highs: .22 },
    { start: 12, end: 18, label: 'Returning Chorus', kind: 'peak', energy: .87, bass: .71, mids: .76, highs: .82 },
    { start: 18, end: 24, label: 'Final Build', kind: 'build', energy: .7, bass: .55, mids: .66, highs: .74 }
  ]
};
const motifPlan = songDirectorEngine.generatePlan(motifMap, 'rock');
assert(motifPlan[0].motifId === motifPlan[2].motifId, 'Song Director did not recognize a returning musical motif.');
assert(motifPlan[0].phrasePhase === motifPlan[2].phrasePhase && motifPlan[0].phraseCycles === motifPlan[2].phraseCycles, 'Returning motif did not retain its visual motion signature.');
assert(motifPlan[0].motifId !== motifPlan[1].motifId && motifPlan[0].motifId !== motifPlan[3].motifId, 'Song Director grouped unrelated section types into one motif.');
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
assert(['energy', 'bass', 'mids', 'highs'].includes(directorResult.dynamics.driver), 'Song Director dynamics monitor did not identify a musical driver.');
assert(['camera', 'equation', 'color', 'depth'].includes(directorResult.dynamics.target), 'Song Director dynamics monitor did not identify a visual target.');
assert(Object.values(directorResult.dynamics.domains).every((value) => Number.isFinite(value) && value >= 0 && value <= 1), 'Song Director dynamics levels were outside their normalized range.');
const gentleTransition = songDirectorEngine.evaluate({ plan: directorPlan, map: directorMap, time: 5.5, transitionId: 'gentle' });
const theatricalTransition = songDirectorEngine.evaluate({ plan: directorPlan, map: directorMap, time: 5.5, transitionId: 'theatrical' });
const transitionBefore = songDirectorEngine.evaluate({ plan: directorPlan, map: directorMap, time: 4.999, transitionId: 'balanced' });
const transitionAfter = songDirectorEngine.evaluate({ plan: directorPlan, map: directorMap, time: 5.001, transitionId: 'balanced' });
assert(gentleTransition.transition.seconds > theatricalTransition.transition.seconds, 'Song Director transition profiles did not change blend duration.');
assert(gentleTransition.transition.progress < theatricalTransition.transition.progress, 'Gentle transition did not advance more slowly than Theatrical.');
assert(Math.abs(transitionAfter.values.equation - transitionBefore.values.equation) < .02, 'Song Director transition introduced a discontinuous equation jump.');
const phraseMap = {
  ...directorMap,
  interval: 1,
  energy: [60, 68, 76, 84, 92, 72, 88, 112, 158, 210, 226, 218],
  bass: [74, 78, 82, 86, 90, 92, 98, 112, 138, 166, 180, 174],
  mids: [56, 62, 70, 78, 86, 90, 104, 126, 152, 174, 188, 182],
  highs: [42, 48, 56, 64, 72, 80, 96, 120, 150, 190, 214, 208]
};
const phrasePlan = songDirectorEngine.generatePlan(phraseMap, 'electronic');
const phraseEarly = songDirectorEngine.evaluate({ plan: phrasePlan, map: phraseMap, time: 5.4, styleId: 'mathematical', intensity: .7 });
const phraseLate = songDirectorEngine.evaluate({ plan: phrasePlan, map: phraseMap, time: 9.4, styleId: 'mathematical', intensity: .7 });
const phraseNextFrame = songDirectorEngine.evaluate({ plan: phrasePlan, map: phraseMap, time: 9.4 + 1 / 60, styleId: 'mathematical', intensity: .7 });
const phraseRepeat = songDirectorEngine.evaluate({ plan: phrasePlan, map: phraseMap, time: 9.4, styleId: 'mathematical', intensity: .7 });
assert(phraseLate.values.phraseEnergy > phraseEarly.values.phraseEnergy, 'Song Director phrase energy did not follow the Song Map contour.');
assert(Math.abs(phraseLate.values.equation - phraseEarly.values.equation) > .005, 'Song Director phrase contour did not reach equation modulation.');
assert(Math.abs(phraseNextFrame.values.equation - phraseLate.values.equation) < .01, 'Song Director phrase equation motion changed too sharply between frames.');
assert(JSON.stringify(phraseLate.values) === JSON.stringify(phraseRepeat.values), 'Song Director phrase motion was not deterministic at the same song time.');
assert(songDirectorEngine.diagnostics.ready && songDirectorEngine.diagnostics.phraseMotion && songDirectorEngine.diagnostics.motifMemory, 'Song Director engine diagnostics failed.');

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
  director: { transition: 'gentle', map: portableMap }
};
const performanceDocument = packageEngine.createDocument(packagedPerformance);
const validatedPackage = packageEngine.validateDocument(performanceDocument);
assert(validatedPackage.performance.metadata.title === 'Smoke Performance' && performanceDocument.appVersion === 'smoke', 'Performance package round trip failed.');
assert(validatedPackage.performance.director.transition === 'gentle', 'Performance package did not preserve the Director transition profile.');
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
let exportSettingsActions = 0;
let advisorSelection = null;
const exportController = window.QuarticExportController.create({
  onEnd: () => { exportActions += 1; },
  onCancel: () => { exportActions += 1; },
  onPause: () => { exportActions += 1; },
  onResolutionChange: () => { exportSettingsActions += 1; },
  onIterationsInput: () => { exportSettingsActions += 1; },
  onSupersamplingChange: () => { exportSettingsActions += 1; },
  onAdvisorApply: (selection) => { advisorSelection = selection; }
});
exportController.bind();
['#endExportButton', '#cancelExportButton', '#pauseExportButton'].forEach((selector) => elements.get(selector).dispatch('click'));
elements.get('#resolution').dispatch('change');
elements.get('#exportIterations').dispatch('input');
elements.get('#exportSupersampling').dispatch('change');
exportController.begin();
exportController.setMode('offline');
exportController.renderProgress({ overall: .5, panelText: 'Half', stageText: 'Rendering 50%', metaText: 'ETA' });
exportController.renderPerformance({ message: 'Quality first', warning: true, profileTitle: 'MKV · FFV1' });
exportController.renderPreflight({ video: '1920×1080 · 60 FPS', encoder: 'NVENC', warning: 'Storage warning' });
exportController.renderHistory([{ id: 'history-1', name: 'smoke.mp4', meta: 'OFFLINE · 1080p' }]);
exportController.renderRecoveries([{ id: 'recovery-1', name: 'interrupted.mkv', meta: '120 saved frames', recoverable: true }]);
assert(exportActions === 3, 'Export controller callbacks were not bound.');
assert(exportSettingsActions === 3, 'Export settings callbacks were not bound.');
const advisorButton = new FakeElement('advisor-button');
advisorButton.dataset = { resolution: '1280x720', fps: '30', iterations: '400' };
const advisorTitle = new FakeElement('strong');
advisorTitle.tagName = 'STRONG';
advisorTitle.textContent = 'Faster Turnaround';
advisorButton.appendChild(advisorTitle);
elements.get('#exportAdvisorList').dispatch('click', { target: { closest: () => advisorButton } });
assert(advisorSelection?.resolution === '1280x720' && advisorSelection.fps === 30 && advisorSelection.iterations === 400 && advisorSelection.label === 'Faster Turnaround', 'Export advisor click leaked its DOM button or lost selection values.');
exportController.applyAdvisorSelection(advisorSelection);
assert(elements.get('#resolution').value === '1280x720' && elements.get('#fps').value === '30' && elements.get('#exportIterations').value === '400', 'Export advisor controls were not applied by the controller.');
elements.get('#videoFormat').value = 'youtube_sdr';
elements.get('#exportDetail').value = '1.6';
elements.get('#exportSupersampling').checked = true;
elements.get('#exportHdrOutput').checked = false;
elements.get('#showExportPreview').checked = true;
const controllerSettings = exportController.readSettings();
assert(controllerSettings.resolution === '1280x720' && controllerSettings.fps === '30'
  && controllerSettings.format === 'youtube_sdr' && controllerSettings.requestedIterations === '400'
  && controllerSettings.detail === '1.6' && controllerSettings.supersampling && controllerSettings.showPreview,
'Export controller settings snapshot lost or transformed control values.');
assert(elements.get('#exportProgressFill').style.width === '50%', 'Export progress did not render.');
assert(elements.get('#stageRenderMode').textContent === 'OFFLINE MASTER EXPORT', 'Export mode did not render.');
assert(elements.get('#exportPerformanceNote').textContent === 'Quality first', 'Export performance presentation did not render.');
assert(elements.get('#preflightVideo').textContent === '1920×1080 · 60 FPS', 'Export preflight presentation did not render.');
assert(elements.get('#exportHistoryList').children.length === 1, 'Export history presentation did not render.');
assert(elements.get('#exportRecoveryList').children.length === 1 && !elements.get('#exportRecoveryCard').hidden, 'Export recovery presentation did not render.');
exportController.renderRecoveryState('preparing', { panelText: 'Recovering smoke export', stageText: 'Inspecting smoke frames', note: 'Smoke recovery' });
assert(document.body.classList.contains('exporting') && document.body.classList.contains('hide-export-preview'), 'Recovery preparing body state failed.');
assert(elements.get('#exportButton').disabled && elements.get('#resolution').disabled && !elements.get('#exportProgress').hidden, 'Recovery preparing controls failed.');
exportController.renderRecoveryState('failed', { panelText: 'Recovery failed', stageText: 'Not completed', note: 'Expected failure' });
assert(elements.get('#stageRenderNote').textContent === 'Expected failure', 'Recovery failure presentation failed.');
exportController.renderRecoveryState('restored', { completed: false });
assert(!document.body.classList.contains('exporting') && !document.body.classList.contains('hide-export-preview') && !elements.get('#resolution').disabled, 'Recovery restoration failed.');
exportController.renderOfflineState('preparing');
assert(elements.get('#exportButton').disabled && elements.get('#exportLabel').textContent === 'PREPARING OFFLINE AUDIO…', 'Offline preparing presentation failed.');
exportController.renderOfflineState('rendering', { hidePreview: true });
assert(document.body.classList.contains('exporting') && document.body.classList.contains('hide-export-preview'), 'Offline rendering body state failed.');
assert(elements.get('#exportButton').classList.contains('recording') && elements.get('#resolution').disabled, 'Offline rendering controls were not locked.');
exportController.renderOfflineState('ending');
assert(elements.get('#exportLabel').textContent === 'ENDING & FINISHING…' && elements.get('#exportButton').disabled && !elements.get('#cancelExportButton').disabled, 'Offline end-and-finish presentation failed.');
exportController.renderOfflineState('cancelling');
assert(elements.get('#exportLabel').textContent === 'CANCELLING…' && elements.get('#cancelExportButton').disabled, 'Offline cancellation presentation failed.');
exportController.renderOfflineState('finalizing', { shortened: true });
assert(elements.get('#exportLabel').textContent === 'FINISHING SHORT EXPORT…' && elements.get('#exportButton').disabled, 'Offline shortened-finalization presentation failed.');
exportController.renderOfflineState('completed');
assert(!elements.get('#revealButton').hidden, 'Offline completion did not reveal the output action.');
exportController.renderOfflineState('restored', { completed: true });
assert(!document.body.classList.contains('exporting') && !document.body.classList.contains('hide-export-preview'), 'Offline body classes were not restored.');
assert(!elements.get('#exportButton').disabled && !elements.get('#resolution').disabled && elements.get('#exportLabel').textContent === 'EXPORT VIDEO', 'Offline controls were not restored.');
exportController.renderLiveState('preparing');
assert(elements.get('#exportButton').disabled && elements.get('#exportLabel').textContent === 'PREPARING LIVE EXPORT…', 'Live preparing presentation failed.');
exportController.renderLiveState('recording', { hidePreview: true });
assert(document.body.classList.contains('exporting') && document.body.classList.contains('hide-export-preview'), 'Live recording body state failed.');
assert(elements.get('#exportButton').classList.contains('recording') && elements.get('#loopPlayback').disabled, 'Live recording controls were not locked.');
exportController.renderLiveState('stopping');
assert(elements.get('#exportLabel').textContent === 'ENDING & FINISHING…' && elements.get('#exportButton').disabled, 'Live stopping presentation failed.');
exportController.renderLiveState('finalizing');
assert(elements.get('#exportLabel').textContent === 'FINALIZING…', 'Live finalization presentation failed.');
exportController.renderLiveState('completed');
assert(!elements.get('#revealButton').hidden, 'Live completion did not reveal the output action.');
exportController.renderLiveState('restored', { completed: true });
assert(!document.body.classList.contains('exporting') && !elements.get('#loopPlayback').disabled, 'Live controls were not restored.');
exportController.renderBenchmarkState('running', { summary: 'Testing smoke settings…' });
assert(elements.get('#benchmarkExportButton').disabled && elements.get('#exportReadinessSummary').textContent === 'Testing smoke settings…', 'Benchmark running presentation failed.');
exportController.renderBenchmarkState('completed', { encoderFps: '80.0 FPS', renderFps: '~40.0 FPS', bottleneck: 'FRACTAL GPU', minuteTime: '~90s', summary: 'Complete', note: 'Measured' });
assert(elements.get('#exportReadinessSummary').dataset.complete === 'true' && elements.get('#benchmarkBottleneck').textContent === 'FRACTAL GPU', 'Benchmark completion presentation failed.');
exportController.renderBenchmarkState('restored');
assert(!elements.get('#benchmarkExportButton').disabled && elements.get('#benchmarkExportButton').textContent === 'BENCHMARK AGAIN', 'Benchmark controls were not restored.');
exportController.renderEncoderScanState('running', { message: 'Scanning smoke encoders…' });
assert(elements.get('#scanExportEncodersButton').disabled && elements.get('#exportEncoderDecision').textContent === 'Scanning smoke encoders…', 'Encoder scan running presentation failed.');
exportController.renderEncoderScanState('completed', { capabilities: { devicesText: 'Detected: Smoke GPU', decisionText: 'Smoke selected', encoders: [{ label: 'Smoke Encoder', details: 'GPU', status: 'SELECTED', available: true, selected: true }] } });
assert(elements.get('#exportEncoderDevices').textContent === 'Detected: Smoke GPU' && elements.get('#exportEncoderCapabilityList').children.length === 1, 'Encoder scan completion presentation failed.');
exportController.renderEncoderScanState('failed', { message: 'Expected scan failure' });
assert(elements.get('#exportEncoderDecision').textContent === 'Expected scan failure', 'Encoder scan failure presentation failed.');
exportController.renderEncoderScanState('restored');
assert(!elements.get('#scanExportEncodersButton').disabled && elements.get('#scanExportEncodersButton').textContent === 'SCAN AGAIN', 'Encoder scan controls were not restored.');
assert(exportController.diagnostics.ready && exportController.diagnostics.presentationReady && exportController.diagnostics.preflightChoiceReady && exportController.diagnostics.benchmarkStateReady && exportController.diagnostics.encoderScanStateReady && exportController.diagnostics.advisorApplicationReady && exportController.diagnostics.recoveryStateReady && exportController.diagnostics.offlineStateReady && exportController.diagnostics.liveStateReady && exportController.diagnostics.bound, 'Export controller diagnostics failed.');

const exportSamplingEngine = window.QuarticExportSamplingEngine.create();
assert(exportSamplingEngine.recommendedIterations(854, 480) === 320, '480p iteration recommendation is incorrect.');
assert(exportSamplingEngine.recommendedIterations(1920, 1080) === 600, '1080p iteration recommendation is incorrect.');
assert(exportSamplingEngine.recommendedIterations(3840, 2160) === 1000, '4K iteration recommendation is incorrect.');
assert(exportSamplingEngine.effectiveIterations(740) === 740, 'Manual export iterations were not preserved.');
assert(exportSamplingEngine.effectiveIterations(1800) === 1200, 'Standard export ceiling was not enforced.');
assert(exportSamplingEngine.effectiveIterations(1800, { unleashed: true }) === 1800, 'Unleashed export ceiling was not applied.');
const exportSamplingBuffers = exportSamplingEngine.createFrameBuffers(2, 2, { tenBit: true, supersampling: true });
assert(exportSamplingBuffers.output.length === 4 && exportSamplingBuffers.outputBytes.length === 16, 'RGB10 output buffers are invalid.');
assert(exportSamplingBuffers.sample !== exportSamplingBuffers.output && exportSamplingBuffers.accumulator.length === 16, 'Supersampling buffers are invalid.');
assert(exportSamplingEngine.selfTest(), 'Export sampling RGBA/RGB10 averaging failed.');
assert(exportSamplingEngine.diagnostics.ready && exportSamplingEngine.diagnostics.sampleCount === 4, 'Export sampling diagnostics failed.');

const exportPlanningEngine = window.QuarticExportPlanningEngine.create({ profiles: exportProfileCatalog });
const planningEstimate = exportPlanningEngine.profileEstimate({
  profileId: 'youtube_hdr', width: 3840, height: 2160, fps: 60, duration: 300, hdrOutput: true
});
assert(planningEstimate.profile.id === 'youtube_hdr' && planningEstimate.hdrOutput, 'Export planning profile estimate lost HDR state.');
assert(planningEstimate.loadLevel === 'high', 'Export planning load classification is incorrect.');
const planningBenchmark = exportPlanningEngine.interpretBenchmark({ renderFps: 12, encoderFps: 48, targetFps: 60 });
assert(planningBenchmark.bottleneck === 'FRACTAL GPU' && planningBenchmark.rating === 'Quality offline', 'Export benchmark interpretation is incorrect.');
const planningRecommendations = exportPlanningEngine.advisorRecommendations({
  reference: { width: 1920, height: 1080, encodedFps: 90 },
  resolutions: [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }],
  frameRates: [30, 60],
  currentIterations: 600,
  unleashed: false,
  recommendedIterations: exportSamplingEngine.recommendedIterations,
  liveContext: {
    liveFps: 60,
    livePixels: 1920 * 1080,
    visualStyle: 0,
    liveIterations: 300,
    supersampling: false
  }
});
assert(planningRecommendations.length === 3 && planningRecommendations.every((item) => item.iterations >= 240), 'Export planning advisor recommendations are invalid.');
assert(exportPlanningEngine.selfTest() && exportPlanningEngine.diagnostics.ready, 'Export planning engine self-test failed.');

const exportPresentationEngine = window.QuarticExportPresentationEngine.create({
  profiles: exportProfileCatalog,
  planningEngine: exportPlanningEngine,
  formatTime: (seconds) => `${Math.round(seconds)}s`,
  fileName: (filePath) => String(filePath).split(/[\\/]/).pop()
});
assert(exportPresentationEngine.selfTest(), 'Export presentation engine self-test failed.');
assert(exportPresentationEngine.diagnostics.ready, 'Export presentation engine diagnostics failed.');

const historyMemory = new Map();
const exportHistoryEngine = window.QuarticExportHistoryEngine.create({
  storage: {
    getItem: (key) => historyMemory.get(key) || null,
    setItem: (key, value) => historyMemory.set(key, value),
    removeItem: (key) => historyMemory.delete(key)
  },
  createId: (() => { let id = 0; return () => `history-${++id}`; })(),
  now: () => '2026-08-15T00:00:00.000Z'
});
exportHistoryEngine.load();
exportHistoryEngine.record({ outputPath: 'C:/Exports/smoke.mp4', sizeBytes: 4096 }, { mode: 'test' }, { width: 1920, height: 1080, fps: 60 });
assert(exportHistoryEngine.size === 1 && exportHistoryEngine.find('history-1')?.mode === 'test', 'Export history engine did not record or find an export.');
assert(exportHistoryEngine.normalizeRecoveries([{ id: 'recover-1', outputPath: 'C:/Exports/recover.mkv', recoverable: true }]).length === 1, 'Export recovery normalization failed.');
assert(exportHistoryEngine.selfTest() && exportHistoryEngine.diagnostics.ready, 'Export history engine self-test failed.');

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
  let loadedPreflight = false;
  const preflightChoicePromise = exportController.requestPreflightChoice({
    load: async () => ({ duration: 30 }),
    loaded: async () => { loadedPreflight = true; },
    loadTest: async () => ({ duration: 5 })
  });
  await new Promise((resolve) => setImmediate(resolve));
  elements.get('#preflightStartButton').onclick();
  const preflightChoice = await preflightChoicePromise;
  assert(loadedPreflight && preflightChoice?.test === false && preflightChoice.preflight.duration === 30, 'Export preflight full-render choice failed.');

  const exportWorkflowEngine = window.QuarticExportWorkflowEngine.create();
  assert(await exportWorkflowEngine.selfTest(), 'Export workflow engine self-test failed.');
  assert(exportWorkflowEngine.diagnostics.ready, 'Export workflow engine diagnostics failed.');

  const exportBenchmarkEngine = window.QuarticExportBenchmarkEngine.create({ planningEngine: exportPlanningEngine });
  assert(await exportBenchmarkEngine.selfTest(), 'Export benchmark workflow self-test failed.');
  assert(exportBenchmarkEngine.diagnostics.ready, 'Export benchmark workflow diagnostics failed.');

  const exportEncoderScanEngine = window.QuarticExportEncoderScanEngine.create();
  assert(await exportEncoderScanEngine.selfTest(), 'Export encoder scan workflow self-test failed.');
  assert(exportEncoderScanEngine.diagnostics.ready, 'Export encoder scan workflow diagnostics failed.');

  const exportPreflightEngine = window.QuarticExportPreflightEngine.create({
    encoderEngine: window.QuarticExportEncoderEngine.create(),
    samplingEngine: exportSamplingEngine
  });
  assert(await exportPreflightEngine.selfTest(), 'Export preflight engine self-test failed.');
  assert(exportPreflightEngine.diagnostics.ready, 'Export preflight engine diagnostics failed.');

  const exportAdvisorEngine = window.QuarticExportAdvisorEngine.create();
  assert(await exportAdvisorEngine.selfTest(), 'Export advisor application workflow self-test failed.');
  assert(exportAdvisorEngine.diagnostics.ready, 'Export advisor application workflow diagnostics failed.');

  const exportRecoveryEngine = window.QuarticExportRecoveryEngine.create({
    sessionEngine: { begin() {}, clear() {} }
  });
  assert(await exportRecoveryEngine.selfTest(), 'Export recovery workflow self-test failed.');
  assert(exportRecoveryEngine.diagnostics.ready, 'Export recovery workflow diagnostics failed.');

  const exportHistoryActionEngine = window.QuarticExportHistoryActionEngine.create({
    historyEngine: exportHistoryEngine
  });
  assert(await exportHistoryActionEngine.selfTest(), 'Export history action workflow self-test failed.');
  assert(exportHistoryActionEngine.diagnostics.ready, 'Export history action workflow diagnostics failed.');

  const exportProgressWorkflowEngine = window.QuarticExportProgressWorkflowEngine.create({
    sessionEngine: exportSessionEngine
  });
  assert(await exportProgressWorkflowEngine.selfTest(), 'Export progress workflow self-test failed.');
  assert(exportProgressWorkflowEngine.diagnostics.ready, 'Export progress workflow diagnostics failed.');

  const exportProgressCoordinator = window.QuarticExportProgressCoordinator.create({
    workflow: exportProgressWorkflowEngine,
    controller: exportController
  });
  assert(await exportProgressCoordinator.selfTest(), 'Export progress coordinator self-test failed.');
  assert(exportProgressCoordinator.diagnostics.ready, 'Export progress coordinator diagnostics failed.');

  const exportCommandCoordinator = window.QuarticExportCommandCoordinator.create({
    sessionEngine: exportSessionEngine,
    progressWorkflow: exportProgressWorkflowEngine,
    liveLifecycle: {
      requestFinish: () => true,
      requestCancel: () => true
    }
  });
  assert(await exportCommandCoordinator.selfTest(), 'Export command coordinator self-test failed.');
  assert(exportCommandCoordinator.diagnostics.ready, 'Export command coordinator diagnostics failed.');

  const exportJobCoordinator = window.QuarticExportJobCoordinator.create({
    offlineLifecycle: { run: async () => ({ status: 'completed' }) },
    liveLifecycle: { start: async () => ({ status: 'recording' }) },
    buildOfflineJob: () => ({ prepare() {}, render() {} }),
    buildLiveJob: () => ({ prepare() {}, record() {} })
  });
  assert(await exportJobCoordinator.selfTest(), 'Export job coordinator self-test failed.');
  assert(exportJobCoordinator.diagnostics.ready, 'Export job coordinator diagnostics failed.');

  const exportResultWorkflowEngine = window.QuarticExportResultWorkflowEngine.create({
    historyEngine: exportHistoryEngine,
    sessionEngine: exportSessionEngine
  });
  assert(await exportResultWorkflowEngine.selfTest(), 'Export result workflow self-test failed.');
  assert(exportResultWorkflowEngine.diagnostics.ready, 'Export result workflow diagnostics failed.');

  const exportSettingsSnapshotEngine = window.QuarticExportSettingsSnapshotEngine.create({
    profiles: exportProfileCatalog,
    samplingEngine: exportSamplingEngine
  });
  assert(exportSettingsSnapshotEngine.selfTest(), 'Export settings snapshot self-test failed.');
  assert(exportSettingsSnapshotEngine.diagnostics.ready, 'Export settings snapshot diagnostics failed.');

  const exportPreparationEngine = window.QuarticExportPreparationEngine.create();
  assert(await exportPreparationEngine.selfTest(), 'Export preparation engine self-test failed.');
  assert(exportPreparationEngine.diagnostics.ready, 'Export preparation engine diagnostics failed.');

  const exportSettingsCoordinatorEngine = window.QuarticExportSettingsCoordinatorEngine.create({
    advisorEngine: exportAdvisorEngine
  });
  assert(await exportSettingsCoordinatorEngine.selfTest(), 'Export settings coordinator self-test failed.');
  assert(exportSettingsCoordinatorEngine.diagnostics.ready, 'Export settings coordinator diagnostics failed.');

  const exportRuntimeStateCoordinator = window.QuarticExportRuntimeStateCoordinator.create({ state: {} });
  assert(exportRuntimeStateCoordinator.selfTest(), 'Export runtime state coordinator self-test failed.');
  assert(exportRuntimeStateCoordinator.diagnostics.ready, 'Export runtime state coordinator diagnostics failed.');

  let capturedFrames = 0;
  const captureSampleStates = [];
  const frameCaptureEngine = window.QuarticExportFrameCaptureEngine.create({
    gl: {
      RGBA: 6408,
      UNSIGNED_BYTE: 5121,
      UNSIGNED_INT_2_10_10_10_REV: 33640,
      readPixels: (_x, _y, _width, _height, _format, _type, target) => target.fill(91)
    },
    samplingEngine: exportSamplingEngine,
    requestFrame: async () => { capturedFrames += 1; },
    onSampleState: ({ active }) => captureSampleStates.push(active)
  });
  const frameCapture = frameCaptureEngine.createCapture({ width: 1, height: 1 });
  frameCapture.beginFrame();
  await frameCapture.captureSample({ sampleIndex: 0, offset: [0, 0] });
  const capturedBytes = frameCapture.resolveFrame();
  frameCapture.cleanup();
  assert(capturedFrames === 1 && capturedBytes[0] === 91, 'Standard WebGL export frame capture failed.');
  assert(captureSampleStates.join(',') === 'true,false,false', 'Export sample state was not reset after capture.');
  assert(await frameCaptureEngine.selfTest() && frameCaptureEngine.diagnostics.ready, 'Export frame capture self-test failed.');

  const lifecycleEvents = [];
  const lifecycleSession = {
    cancelRequested: false,
    finishRequested: false,
    begin: (_session, mode) => lifecycleEvents.push(`begin:${mode}`),
    markCompleted: () => lifecycleEvents.push('marked'),
    clear: () => lifecycleEvents.push('clear'),
    resetRequests: () => lifecycleEvents.push('reset')
  };
  const offlineLifecycle = window.QuarticExportOfflineLifecycle.create({
    sessionEngine: lifecycleSession,
    finishOfflineExport: async (id, details) => {
      lifecycleEvents.push(`finish:${id}:${details.renderedFrameCount}`);
      return { outputPath: 'smoke.mp4' };
    },
    abortOfflineExport: async () => lifecycleEvents.push('abort')
  });
  const lifecycleResult = await offlineLifecycle.run({
    prepare: async () => { lifecycleEvents.push('prepare'); return {}; },
    beginSession: async () => ({ id: 'lifecycle' }),
    activate: async () => lifecycleEvents.push('activate'),
    render: async () => { lifecycleEvents.push('render'); return { renderedFrameCount: 2 }; },
    beforeFinalize: async () => lifecycleEvents.push('before-finalize'),
    complete: async () => lifecycleEvents.push('complete'),
    restore: async ({ completed }) => lifecycleEvents.push(`restore:${completed}`)
  });
  assert(lifecycleResult.status === 'completed' && lifecycleResult.renderedFrameCount === 2, 'Offline export lifecycle did not complete.');
  assert(lifecycleEvents.join('|') === 'prepare|begin:offline|activate|render|before-finalize|finish:lifecycle:2|marked|complete|clear|reset|restore:true', 'Offline export lifecycle sequencing failed.');
  assert(await offlineLifecycle.selfTest(), 'Offline export lifecycle self-test failed.');

  const liveLifecycle = window.QuarticExportLiveLifecycle.create({
    sessionEngine: window.QuarticExportSessionEngine.create(),
    abortExport: async () => {}
  });
  assert(await liveLifecycle.selfTest(), 'Live export lifecycle self-test failed.');
  assert(liveLifecycle.diagnostics.ready && !liveLifecycle.diagnostics.active, 'Live export lifecycle diagnostics failed.');

  const pausedControl = { paused: true, cancelRequested: false, finishRequested: false };
  let pausePolls = 0;
  const renderCoordinator = window.QuarticExportRenderCoordinator.create({
    delay: async () => {
      pausePolls += 1;
      pausedControl.paused = false;
    },
    pausePollMilliseconds: 10
  });
  const lifecycle = [];
  const pausedResult = await renderCoordinator.renderFrames({
    sessionEngine: pausedControl,
    frameCount: 2,
    fps: 30,
    supersampling: true,
    sampleOffsets: [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]],
    onFrameStart: ({ frameIndex }) => lifecycle.push(`start:${frameIndex}`),
    onSample: ({ frameIndex, sampleIndex }) => lifecycle.push(`sample:${frameIndex}:${sampleIndex}`),
    onAppendFrame: ({ frameIndex }) => lifecycle.push(`append:${frameIndex}`),
    onFrameEnd: ({ frameIndex }) => lifecycle.push(`end:${frameIndex}`)
  });
  assert(pausePolls === 1 && pausedResult.renderedFrameCount === 2, 'Offline render pause/resume coordination failed.');
  assert(lifecycle[0] === 'start:0' && lifecycle.at(-1) === 'end:1', 'Offline render lifecycle sequencing failed.');
  let cleanupRan = false;
  try {
    await renderCoordinator.renderFrames({
      sessionEngine: { paused: false, cancelRequested: false, finishRequested: false },
      frameCount: 1,
      fps: 30,
      onSample: () => { throw new Error('Expected render failure'); },
      onFrameEnd: () => { cleanupRan = true; }
    });
  } catch (error) {
    assert(error.message === 'Expected render failure', 'Offline render coordinator changed the render error.');
  }
  assert(cleanupRan, 'Offline render frame cleanup did not run after a render failure.');
  assert(await renderCoordinator.selfTest(), 'Offline render coordinator self-test failed.');

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

  const liveCaptureEngine = window.QuarticExportLiveCaptureEngine.create({
    encoderEngine,
    MediaStreamClass: class { constructor(tracks) { this.tracks = tracks; } }
  });
  assert(await liveCaptureEngine.selfTest(), 'Live Capture Engine self-test failed.');
  assert(liveCaptureEngine.diagnostics.ready, 'Live Capture Engine diagnostics failed.');

  const quickClipWorkflowEngine = window.QuarticExportQuickClipWorkflowEngine.create();
  assert(await quickClipWorkflowEngine.selfTest(), 'Quick Clip Workflow Engine self-test failed.');
  assert(quickClipWorkflowEngine.diagnostics.ready, 'Quick Clip Workflow Engine diagnostics failed.');

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
