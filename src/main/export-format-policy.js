'use strict';

const path = require('path');

const videoFormats = Object.freeze({
  mp4: Object.freeze({ name: 'MP4 video', extension: 'mp4' }),
  webm: Object.freeze({ name: 'WebM video', extension: 'webm' }),
  mov: Object.freeze({ name: 'QuickTime MOV video', extension: 'mov' }),
  mkv: Object.freeze({ name: 'Matroska MKV video', extension: 'mkv' })
});

function normalizeRequestedFormat(value) {
  return videoFormats[value] ? value : 'mp4';
}

function orderedFormatIds(requestedValue) {
  const requested = normalizeRequestedFormat(requestedValue);
  return [requested, ...Object.keys(videoFormats).filter((format) => format !== requested)];
}

function saveDialogFilters(requestedValue) {
  return orderedFormatIds(requestedValue).map((format) => ({
    name: videoFormats[format].name,
    extensions: [format]
  }));
}

function resolveOutputSelection(filePath, requestedValue) {
  const requestedFormat = normalizeRequestedFormat(requestedValue);
  const chosenExtension = path.extname(String(filePath || '')).slice(1).toLowerCase();
  const format = videoFormats[chosenExtension] ? chosenExtension : requestedFormat;
  const outputPath = videoFormats[chosenExtension] ? filePath : `${filePath}.${format}`;
  return { format, outputPath };
}

module.exports = Object.freeze({
  videoFormats,
  normalizeRequestedFormat,
  orderedFormatIds,
  saveDialogFilters,
  resolveOutputSelection
});
