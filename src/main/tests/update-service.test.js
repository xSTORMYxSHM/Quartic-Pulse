'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdateService, safeText } = require('../update-service');

function fixture(overrides = {}) {
  const updater = new EventEmitter();
  const calls = { checks: 0, downloads: 0, opened: [], installed: 0 };
  updater.checkForUpdates = async () => { calls.checks += 1; };
  updater.downloadUpdate = async () => { calls.downloads += 1; };
  updater.quitAndInstall = () => { calls.installed += 1; };
  const service = createUpdateService({
    updater,
    app: { isPackaged: true, getVersion: () => '1.0.0' },
    dialog: { showMessageBox: async () => ({ response: 0 }) },
    shell: { openExternal: async (url) => calls.opened.push(url) },
    platform: 'win32',
    environment: {},
    schedule: () => ({ unref() {} }),
    ...overrides
  });
  return { updater, service, calls };
}

test('installed builds check, download, and install only after confirmation', async () => {
  const { updater, service, calls } = fixture();
  service.start();
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.autoInstallOnAppQuit, false);

  await service.check();
  updater.emit('update-available', { version: '1.0.1', releaseName: 'Quartic Pulse 1.0.1' });
  assert.equal(service.getStatus().phase, 'available');
  await service.download();
  updater.emit('download-progress', { percent: 52.6 });
  assert.equal(service.getStatus().progress, 52.6);
  updater.emit('update-downloaded', { version: '1.0.1' });
  assert.equal(service.getStatus().phase, 'downloaded');
  assert.equal(await service.install(), true);
  assert.equal(calls.installed, 1);
});

test('portable builds stay manual-only and can open the fixed release page', async () => {
  const { service, calls } = fixture({
    environment: { PORTABLE_EXECUTABLE_FILE: 'Quartic Pulse.exe' }
  });
  service.start();
  await service.check();
  assert.equal(service.getStatus().mode, 'portable');
  assert.equal(service.getStatus().supported, false);
  assert.equal(service.getStatus().phase, 'manual-only');
  assert.equal(calls.checks, 0);
  await service.openReleases();
  assert.match(calls.opened[0], /Quartic-Pulse\/releases\/latest$/);
});

test('cancelled install leaves the updater running', async () => {
  const { updater, service, calls } = fixture({
    dialog: { showMessageBox: async () => ({ response: 1 }) }
  });
  service.start();
  updater.emit('update-available', { version: '1.0.1' });
  updater.emit('update-downloaded', { version: '1.0.1' });
  assert.equal(await service.install(), false);
  assert.equal(calls.installed, 0);
});

test('update errors redact URLs before reaching the renderer', () => {
  const { updater, service } = fixture();
  service.start();
  updater.emit('error', new Error('GET https://example.invalid/latest.yml?token=secret failed'));
  assert.equal(service.getStatus().phase, 'error');
  assert.doesNotMatch(service.getStatus().message, /token=secret|https:/);
  assert.equal(safeText('line\ntext'), 'line text');
});
