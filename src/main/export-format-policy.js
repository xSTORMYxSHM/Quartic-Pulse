'use strict';

const path = require('path');
const exportProfileCatalog = require('../shared/export-profiles');

const videoFormats = exportProfileCatalog.profiles;

function normalizeRequestedFormat(value) {
  return exportProfileCatalog.normalizeProfileId(value);
}

function orderedFormatIds(requestedValue) {
  const requested = normalizeRequestedFormat(requestedValue);
  return [requested, ...Object.keys(videoFormats).filter((format) => format !== requested)];
}

function saveDialogFilters(requestedValue) {
  const format = normalizeRequestedFormat(requestedValue);
  return [{ name: videoFormats[format].name, extensions: [videoFormats[format].extension] }];
}

function resolveOutputSelection(filePath, requestedValue) {
  const requestedFormat = normalizeRequestedFormat(requestedValue);
  const requiredExtension = videoFormats[requestedFormat].extension;
  const suppliedExtension = path.extname(String(filePath || '')).slice(1).toLowerCase();
  const outputPath = suppliedExtension === requiredExtension
    ? filePath
    : `${filePath.replace(/\.[^.\\/]+$/u, '')}.${requiredExtension}`;
  return { format: requestedFormat, outputPath };
}

module.exports = Object.freeze({
  videoFormats,
  normalizeRequestedFormat,
  orderedFormatIds,
  saveDialogFilters,
  resolveOutputSelection
});
