'use strict';

const path = require('path');

const videoFormats = Object.freeze({
  youtube_hdr: Object.freeze({ name: 'YouTube quality master (HEVC Main 10)', extension: 'mp4' }),
  utvideo: Object.freeze({ name: 'Lossless playback master (Ut Video RGB)', extension: 'mkv' }),
  ffv1: Object.freeze({ name: 'Lossless archive master (FFV1 RGB)', extension: 'mkv' })
});

function normalizeRequestedFormat(value) {
  return videoFormats[value] ? value : 'youtube_hdr';
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
