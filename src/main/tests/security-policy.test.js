'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const {
  isAllowedExportTarget,
  isTrustedRendererEvent,
  isTrustedRendererUrl,
  resolveLocalAbsolutePath
} = require('../security-policy');

const rendererEntryPath = path.resolve('src/renderer/index.html');

test('trusts only the exact local renderer entrypoint', () => {
  const trustedUrl = `${pathToFileURL(rendererEntryPath).href}?obs=1`;
  assert.equal(isTrustedRendererUrl(trustedUrl, rendererEntryPath), true);
  assert.equal(isTrustedRendererUrl('https://example.invalid/', rendererEntryPath), false);
  assert.equal(isTrustedRendererUrl(pathToFileURL(path.resolve('README.md')).href, rendererEntryPath), false);
});

test('requires the registered main frame for privileged IPC', () => {
  const mainFrame = { url: pathToFileURL(rendererEntryPath).href };
  const webContents = { mainFrame, getURL: () => mainFrame.url };
  const window = { webContents, isDestroyed: () => false };
  assert.equal(isTrustedRendererEvent({ sender: webContents, senderFrame: mainFrame }, { mainWindow: window, rendererEntryPath }), true);
  assert.equal(isTrustedRendererEvent({ sender: webContents, senderFrame: { url: 'https://example.invalid/' } }, { mainWindow: window, rendererEntryPath }), false);
});

test('rejects network paths and executable export targets', () => {
  if (process.platform === 'win32') assert.throws(() => resolveLocalAbsolutePath('\\\\server\\share\\track.wav'));
  assert.equal(isAllowedExportTarget('render.mp4', { isFile: () => true, isDirectory: () => false }), true);
  assert.equal(isAllowedExportTarget('program.exe', { isFile: () => true, isDirectory: () => false }), false);
});
