const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('quarticDesktop', {
  listVisualizerPackages: () => ipcRenderer.invoke('visualizer-package:list'),
  previewVisualizerPackage: () => ipcRenderer.invoke('visualizer-package:preview'),
  installVisualizerPackage: (token) => ipcRenderer.invoke('visualizer-package:install-preview', token),
  importVisualizerPackage: () => ipcRenderer.invoke('visualizer-package:import'),
  loadVisualizerPackage: (styleId) => ipcRenderer.invoke('visualizer-package:load', styleId),
  removeVisualizerPackage: (styleId) => ipcRenderer.invoke('visualizer-package:remove', styleId),
  exportProfile: (suggestedName, json) => ipcRenderer.invoke('profile:export', { suggestedName, json }),
  exportPerformancePackage: (suggestedName, json) => ipcRenderer.invoke('performance-package:export', { suggestedName, json }),
  saveScreenshot: (bytes) => ipcRenderer.invoke('capture:save-png', bytes),
  openObsOutput: (options) => ipcRenderer.invoke('obs:open-output', options),
  closeObsOutput: () => ipcRenderer.invoke('obs:close-output'),
  getObsOutputStatus: () => ipcRenderer.invoke('obs:get-output-status'),
  getOutputCapabilities: () => ipcRenderer.invoke('output:get-capabilities'),
  getHardwareInfo: () => ipcRenderer.invoke('performance:get-hardware'),
  getReportDiagnostics: (snapshot) => ipcRenderer.invoke('report:get-diagnostics', snapshot),
  clearReportIncidents: () => ipcRenderer.invoke('report:clear-incidents'),
  saveReport: (text) => ipcRenderer.invoke('report:save', text),
  printReport: (text) => ipcRenderer.invoke('report:print', text),
  submitReport: (text) => ipcRenderer.invoke('report:submit', text),
  openReportIssues: () => ipcRenderer.invoke('report:open-issues'),
  getUpdateStatus: () => ipcRenderer.invoke('update:get-status'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  openUpdateReleases: () => ipcRenderer.invoke('update:open-releases'),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
  reportRendererError: (error) => ipcRenderer.send('report:renderer-error', error),
  getExportPreflight: (options) => ipcRenderer.invoke('export:preflight', options),
  getExportEncoderCapabilities: () => ipcRenderer.invoke('export:encoder-capabilities'),
  benchmarkExportEncoder: (options) => ipcRenderer.invoke('export:benchmark-encoder', options),
  getRecoverableExports: () => ipcRenderer.invoke('export:recovery-list'),
  recoverExport: (id) => ipcRenderer.invoke('export:recovery-finish', id),
  discardRecoverableExport: (id) => ipcRenderer.invoke('export:recovery-discard', id),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  readSessionAudioFile: (filePath) => ipcRenderer.invoke('session:read-audio-file', filePath),
  onObsOutputStatus: (callback) => {
    const listener = (_event, open) => callback(Boolean(open));
    ipcRenderer.on('obs:output-status', listener);
    return () => ipcRenderer.removeListener('obs:output-status', listener);
  },
  onObsOutputSettings: (callback) => {
    const listener = (_event, settings) => callback(settings);
    ipcRenderer.on('obs:output-settings', listener);
    return () => ipcRenderer.removeListener('obs:output-settings', listener);
  },
  publishObsVisualState: (snapshot) => ipcRenderer.send('obs:visual-state', snapshot),
  onObsVisualState: (callback) => {
    const listener = (_event, snapshot) => callback(snapshot);
    ipcRenderer.on('obs:visual-state', listener);
    return () => ipcRenderer.removeListener('obs:visual-state', listener);
  },
  listOutputDevices: () => ipcRenderer.invoke('audio:list-outputs'),
  startOutputDevice: (deviceId) => ipcRenderer.invoke('audio:start-output', deviceId),
  stopOutputDevice: () => ipcRenderer.invoke('audio:stop-output'),
  startOsc: (options) => ipcRenderer.invoke('controls:start-osc', options),
  stopOsc: () => ipcRenderer.invoke('controls:stop-osc'),
  onOscMessage: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('controls:osc-message', listener);
    return () => ipcRenderer.removeListener('controls:osc-message', listener);
  },
  onOscError: (callback) => {
    const listener = (_event, message) => callback(String(message));
    ipcRenderer.on('controls:osc-error', listener);
    return () => ipcRenderer.removeListener('controls:osc-error', listener);
  },
  onOutputAudio: (callback) => {
    const listener = (_event, bytes) => callback(bytes);
    ipcRenderer.on('audio:output-data', listener);
    return () => ipcRenderer.removeListener('audio:output-data', listener);
  },
  onOutputError: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('audio:output-error', listener);
    return () => ipcRenderer.removeListener('audio:output-error', listener);
  },
  onOutputStopped: (callback) => {
    const listener = (_event, code) => callback(code);
    ipcRenderer.on('audio:output-stopped', listener);
    return () => ipcRenderer.removeListener('audio:output-stopped', listener);
  },
  beginExport: (options) => ipcRenderer.invoke('export:begin', options),
  appendExport: (id, bytes) => ipcRenderer.invoke('export:append', id, bytes),
  finishExport: (id) => ipcRenderer.invoke('export:finish', id),
  abortExport: (id) => ipcRenderer.invoke('export:abort', id),
  beginOfflineExport: (options) => ipcRenderer.invoke('export:offline-begin', options),
  appendOfflineFrame: (id, bytes) => ipcRenderer.invoke('export:offline-frame', id, bytes),
  finishOfflineExport: (id, options) => ipcRenderer.invoke('export:offline-finish', id, options),
  abortOfflineExport: (id) => ipcRenderer.invoke('export:offline-abort', id),
  onExportProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('export:progress', listener);
    return () => ipcRenderer.removeListener('export:progress', listener);
  },
  revealExport: (filePath) => ipcRenderer.invoke('export:reveal', filePath),
  openExport: (filePath) => ipcRenderer.invoke('export:open', filePath),
  platform: process.platform
});
