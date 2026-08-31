'use strict';

const path = require('path');
const { fileURLToPath } = require('url');

const allowedExportExtensions = new Set(['.mkv', '.mov', '.mp4', '.webm']);

function normalizeFilePath(value) {
  return path.normalize(path.resolve(String(value || '')));
}

function isTrustedRendererUrl(value, rendererEntryPath) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'file:') return false;
    return normalizeFilePath(fileURLToPath(url)) === normalizeFilePath(rendererEntryPath);
  } catch (_) {
    return false;
  }
}

function isTrustedRendererEvent(event, options = {}) {
  const webContents = event?.sender;
  const windows = [options.mainWindow, options.obsOutputWindow].filter((window) => window && !window.isDestroyed?.());
  if (!webContents || !windows.some((window) => window.webContents === webContents)) return false;
  if (event.senderFrame && webContents.mainFrame && event.senderFrame !== webContents.mainFrame) return false;
  if (!isTrustedRendererUrl(webContents.getURL?.(), options.rendererEntryPath)) return false;
  return !event.senderFrame?.url || isTrustedRendererUrl(event.senderFrame.url, options.rendererEntryPath);
}

function resolveLocalAbsolutePath(value) {
  const input = String(value || '');
  if (!input || input.includes('\0') || !path.isAbsolute(input)) throw new Error('A local absolute path is required.');
  if (/^(?:\\\\|\/\/|\\\\[?.]\\)/.test(input)) throw new Error('Network and device paths are not allowed.');
  return normalizeFilePath(input);
}

function isAllowedExportTarget(filePath, stat) {
  if (stat?.isDirectory?.()) return true;
  return Boolean(stat?.isFile?.() && allowedExportExtensions.has(path.extname(filePath).toLowerCase()));
}

module.exports = Object.freeze({
  allowedExportExtensions,
  isAllowedExportTarget,
  isTrustedRendererEvent,
  isTrustedRendererUrl,
  resolveLocalAbsolutePath
});
