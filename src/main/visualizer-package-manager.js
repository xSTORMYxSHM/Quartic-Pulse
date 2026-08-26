'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const FORMAT = 'data-horizon.quartic-visualizer';
const AUDIO_CONTRACT = 'tempest.audio-features.v1';
const REQUIRED_ENTRYPOINT = 'runtime/index.html';
const REQUIRED_PROJECT = 'project.horizon.json';
const MAX_MANIFEST_BYTES = 512 * 1024;
const MAX_PREVIEW_BYTES = 12 * 1024 * 1024;
const MAX_FILE_BYTES = 128 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 512 * 1024 * 1024;
const MAX_BUNDLE_FILES = 256;
const MAX_PALETTES = 32;
const MAX_LAYERS = 512;
const MAX_BINDINGS = 512;
const MAX_TIMELINE_TRACKS = 256;
const allowedExtensions = new Set([
  '.json', '.html', '.js', '.css', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'
]);
const blendModes = new Set(['normal', 'add', 'multiply', 'screen']);
const layerTypes = new Set(['group', 'image', 'text', 'shape', 'spectrum', 'waveform', 'particles', 'path']);
const effectTypes = new Set(['celShading', 'outline', 'colorGrade', 'luminanceMask', 'regionMask', 'paintMask', 'posterize', 'bloom', 'scanlines', 'displacement']);
const audioSources = new Set(['bass', 'mids', 'highs', 'beat', 'rms']);
const shapeTypes = new Set(['rectangle', 'ellipse', 'frame']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value, maximum = 120) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maximum);
}

function safeRelativePath(value, label) {
  const normalized = String(value || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.includes('\0')) {
    throw new Error(`${label} must be a relative bundle path.`);
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error(`${label} contains an unsafe path segment.`);
  }
  return normalized;
}

function resolveInside(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...safeRelativePath(relativePath, 'Bundle path').split('/'));
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('Bundle path escapes its package directory.');
  }
  return resolved;
}

function styleIdFor(packageId) {
  const digest = crypto.createHash('sha256').update(packageId).digest();
  return 1000 + (digest.readUInt32BE(0) % 1000000000);
}

function packageFolderFor(packageId) {
  return crypto.createHash('sha256').update(packageId).digest('hex').slice(0, 24);
}

function validatePalettes(input) {
  if (input === undefined) return Object.freeze([]);
  if (!Array.isArray(input)) throw new Error('manifest palettes must be an array.');
  if (input.length > MAX_PALETTES) throw new Error(`A package may contain at most ${MAX_PALETTES} palettes.`);
  const ids = new Set();
  return Object.freeze(input.map((palette, index) => {
    if (!isPlainObject(palette)) throw new Error(`Palette ${index + 1} must be an object.`);
    const id = cleanText(palette.id, 80).toLowerCase();
    const name = cleanText(palette.name, 80);
    if (!/^[a-z0-9][a-z0-9._-]{1,79}$/.test(id)) throw new Error(`Palette ${index + 1} has an invalid id.`);
    if (ids.has(id)) throw new Error(`Duplicate palette id: ${id}.`);
    ids.add(id);
    if (!name) throw new Error(`Palette ${id} is missing a name.`);
    if (!Array.isArray(palette.colors) || palette.colors.length !== 4) {
      throw new Error(`Palette ${id} must contain exactly four colors.`);
    }
    const colors = palette.colors.map((color) => {
      const normalized = String(color || '').trim().toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(normalized)) throw new Error(`Palette ${id} contains an invalid color.`);
      return normalized;
    });
    if (palette.favorite !== undefined && typeof palette.favorite !== 'boolean') {
      throw new Error(`Palette ${id} favorite must be a boolean.`);
    }
    return Object.freeze({ id, name, colors: Object.freeze(colors), favorite: Boolean(palette.favorite) });
  }));
}

function validateManifest(input) {
  if (!isPlainObject(input)) throw new Error('manifest.json must contain an object.');
  if (input.schemaVersion !== 1) throw new Error('Only Data Horizon manifest schemaVersion 1 is supported.');
  if (input.format !== FORMAT || input.target !== 'quartic-pulse') {
    throw new Error('This is not a Quartic Pulse Data Horizon visualizer package.');
  }
  const id = cleanText(input.id, 180);
  const name = cleanText(input.name, 80);
  const version = cleanText(input.version, 40);
  if (!/^[a-z0-9][a-z0-9._-]{2,179}$/i.test(id)) throw new Error('The package id is missing or invalid.');
  if (!name) throw new Error('The package name is missing.');
  if (!version) throw new Error('The package version is missing.');
  if (!isPlainObject(input.engine) || input.engine.id !== 'data-horizon-runtime') {
    throw new Error('The package does not target the Data Horizon runtime.');
  }
  if (safeRelativePath(input.entrypoint, 'entrypoint') !== REQUIRED_ENTRYPOINT) {
    throw new Error(`The package entrypoint must be ${REQUIRED_ENTRYPOINT}.`);
  }
  if (safeRelativePath(input.project, 'project') !== REQUIRED_PROJECT) {
    throw new Error(`The package project must be ${REQUIRED_PROJECT}.`);
  }
  if (!isPlainObject(input.audio) || input.audio.contract !== AUDIO_CONTRACT) {
    throw new Error(`The package must use ${AUDIO_CONTRACT}.`);
  }
  if (!isPlainObject(input.runtime) || input.runtime.browser !== 'chromium-webgl2' || input.runtime.deterministic !== true) {
    throw new Error('The package must declare a deterministic Chromium WebGL2 runtime.');
  }
  if (!isPlainObject(input.visualizer) || input.visualizer.mode !== 'full-canvas') {
    throw new Error('The package must declare a full-canvas visualizer.');
  }
  if (input.visualizer.acceptsTransportClock !== true || input.visualizer.acceptsOfflineFrames !== true) {
    throw new Error('The package must support transport-clock and offline frames.');
  }
  const preview = input.preview ? safeRelativePath(input.preview, 'preview') : '';
  const canvas = isPlainObject(input.canvas) ? input.canvas : {};
  const width = Math.max(16, Math.min(16384, Math.round(Number(canvas.width) || 1920)));
  const height = Math.max(16, Math.min(16384, Math.round(Number(canvas.height) || 1080)));
  const palettes = validatePalettes(input.palettes);
  return Object.freeze({
    schemaVersion: 1,
    format: FORMAT,
    target: 'quartic-pulse',
    id,
    name,
    version,
    createdBy: cleanText(input.createdBy || 'Data Horizon Studio', 80),
    engineVersion: cleanText(input.engine.version, 40),
    entrypoint: REQUIRED_ENTRYPOINT,
    project: REQUIRED_PROJECT,
    preview,
    canvas: Object.freeze({ width, height, transparent: Boolean(canvas.transparent) }),
    audio: Object.freeze({ contract: AUDIO_CONTRACT, sources: ['bass', 'mids', 'highs', 'beat', 'rms'] }),
    visualizer: Object.freeze({
      key: cleanText(input.visualizer.key || name, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-visualizer',
      category: cleanText(input.visualizer.category || 'CUSTOM', 30).toUpperCase(),
      mode: 'full-canvas',
      acceptsTransportClock: true,
      acceptsOfflineFrames: true
    }),
    palettes
  });
}

function validateProject(input) {
  const errors = [];
  if (!isPlainObject(input)) return ['Project must be an object.'];
  if (input.schemaVersion !== 1) errors.push('Project schemaVersion must be 1.');
  if (!cleanText(input.id, 180)) errors.push('Project id is missing.');
  if (!cleanText(input.name, 80)) errors.push('Project name is missing.');
  if (!isPlainObject(input.canvas)) errors.push('Project canvas is missing.');
  else {
    if (!Number.isFinite(Number(input.canvas.width)) || Number(input.canvas.width) < 16) errors.push('Project canvas width is invalid.');
    if (!Number.isFinite(Number(input.canvas.height)) || Number(input.canvas.height) < 16) errors.push('Project canvas height is invalid.');
    if (!Array.isArray(input.canvas.background) || input.canvas.background.length !== 4) errors.push('Project canvas background is invalid.');
  }
  const assetIds = new Set();
  if (!Array.isArray(input.assets)) errors.push('Project assets must be an array.');
  else {
    if (input.assets.length > 256) errors.push('Project assets exceed the 256-item limit.');
    for (const asset of input.assets) {
      if (!isPlainObject(asset) || !cleanText(asset.id, 180)) errors.push('Every project asset must have an id.');
      else if (assetIds.has(asset.id)) errors.push(`Duplicate asset id: ${cleanText(asset.id, 80)}.`);
      else assetIds.add(asset.id);
      if (asset?.kind !== 'image' || !String(asset?.mimeType || '').startsWith('image/')) errors.push(`Invalid image asset: ${cleanText(asset?.id, 80)}.`);
      if (!String(asset?.uri || '').startsWith('data:image/')) errors.push(`Asset ${cleanText(asset?.id, 80)} must be embedded as a data image.`);
    }
  }
  if (!Array.isArray(input.layers)) errors.push('Project layers must be an array.');
  if (!Array.isArray(input.bindings)) errors.push('Project bindings must be an array.');
  if (Array.isArray(input.bindings)) {
    if (input.bindings.length > MAX_BINDINGS) errors.push(`Project bindings exceed the ${MAX_BINDINGS}-route limit.`);
    for (const binding of input.bindings) {
      if (!isPlainObject(binding) || !cleanText(binding.id, 180)) errors.push('Every audio binding must have an id.');
      else if (!audioSources.has(binding.source)) errors.push(`Invalid audio source on ${cleanText(binding.id, 80)}.`);
      if (!cleanText(binding?.target, 240).startsWith('layer.')) errors.push(`Invalid audio target on ${cleanText(binding?.id, 80)}.`);
    }
  }
  if (input.timeline !== undefined) {
    if (!isPlainObject(input.timeline) || !Array.isArray(input.timeline.tracks)) errors.push('Project timeline is invalid.');
    else {
      if (!Number.isFinite(Number(input.timeline.duration)) || Number(input.timeline.duration) <= 0 || Number(input.timeline.duration) > 86400) errors.push('Project timeline duration is invalid.');
      if (input.timeline.tracks.length > MAX_TIMELINE_TRACKS) errors.push(`Project timeline exceeds ${MAX_TIMELINE_TRACKS} tracks.`);
      for (const track of input.timeline.tracks) {
        if (!isPlainObject(track) || !cleanText(track.target, 240).startsWith('layer.') || !Array.isArray(track.keyframes) || track.keyframes.length > 4096) {
          errors.push('Project timeline contains an invalid track.');
          continue;
        }
        if (track.keyframes.some((frame) => !isPlainObject(frame) || !Number.isFinite(Number(frame.time)) || !Number.isFinite(Number(frame.value)) || !['linear', 'easeInOut', 'hold'].includes(frame.easing))) {
          errors.push(`Project timeline track ${cleanText(track.target, 80)} contains an invalid keyframe.`);
        }
      }
    }
  }
  const ids = new Set();
  let visibleVisualLayers = 0;
  let layerCount = 0;
  const inspectLayers = (layers, depth = 0) => {
    if (depth > 32) return errors.push('Project layer nesting exceeds 32 levels.');
    for (const layer of layers || []) {
      if (!isPlainObject(layer) || !cleanText(layer.id, 180)) {
        errors.push('Every layer must have an id.');
        continue;
      }
      layerCount += 1;
      if (layerCount > MAX_LAYERS) return errors.push(`Project layers exceed the ${MAX_LAYERS}-layer limit.`);
      if (ids.has(layer.id)) errors.push(`Duplicate layer id: ${cleanText(layer.id, 80)}.`);
      ids.add(layer.id);
      if (!layerTypes.has(layer.type)) errors.push(`Invalid layer type on ${cleanText(layer.id, 80)}.`);
      if (layer.type !== 'group' && layer.visible && Number(layer.opacity) > 0) visibleVisualLayers += 1;
      if (!blendModes.has(layer.blendMode)) errors.push(`Invalid blend mode on ${cleanText(layer.id, 80)}.`);
      if (layer.transform !== undefined) {
        const transform = layer.transform;
        if (!isPlainObject(transform)
          || !['x', 'y', 'width', 'height', 'rotation'].every((key) => Number.isFinite(Number(transform[key])))
          || Number(transform.width) <= 0 || Number(transform.height) <= 0
          || Number(transform.width) > 100000 || Number(transform.height) > 100000) errors.push(`Invalid transform on ${cleanText(layer.id, 80)}.`);
      }
      if (!Array.isArray(layer.effects)) errors.push(`Effects must be an array on ${cleanText(layer.id, 80)}.`);
      else {
        if (layer.effects.length > 32) errors.push(`Too many effects on ${cleanText(layer.id, 80)}.`);
        for (const effect of layer.effects) {
          if (!isPlainObject(effect) || !effectTypes.has(effect.type) || !isPlainObject(effect.parameters)) {
            errors.push(`Invalid effect on ${cleanText(layer.id, 80)}.`);
            continue;
          }
          if (effect.type === 'paintMask') {
            const mask = effect.paintMask;
            if (!isPlainObject(mask) || ![0, 1].includes(mask.base) || !Array.isArray(mask.strokes) || mask.strokes.length > 512) {
              errors.push(`Invalid painted mask on ${cleanText(layer.id, 80)}.`);
            } else if (mask.strokes.some((stroke) => !isPlainObject(stroke) || !['hide', 'reveal'].includes(stroke.mode) || !Array.isArray(stroke.points) || stroke.points.length > 4096
              || stroke.points.some((point) => !isPlainObject(point) || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))))) {
              errors.push(`Invalid painted mask stroke on ${cleanText(layer.id, 80)}.`);
            }
          }
        }
      }
      if (layer.type === 'group') {
        if (!Array.isArray(layer.children)) errors.push(`Group children must be an array on ${cleanText(layer.id, 80)}.`);
        else inspectLayers(layer.children, depth + 1);
      } else if (layer.type === 'image') {
        if (!assetIds.has(layer.assetId) || !['cover', 'contain', 'stretch'].includes(layer.fit)) errors.push(`Invalid image source on ${cleanText(layer.id, 80)}.`);
      } else if (layer.type === 'text') {
        if (typeof layer.text !== 'string' || layer.text.length > 10000 || typeof layer.fontFamily !== 'string' || !Number.isFinite(Number(layer.fontSize)) || Number(layer.fontSize) <= 0) errors.push(`Invalid text source on ${cleanText(layer.id, 80)}.`);
      } else if (layer.type === 'shape') {
        if (!shapeTypes.has(layer.shape) || typeof layer.fill !== 'string' || typeof layer.stroke !== 'string') errors.push(`Invalid shape source on ${cleanText(layer.id, 80)}.`);
      } else if (layer.type === 'spectrum') {
        if (!Number.isFinite(Number(layer.bars)) || Number(layer.bars) < 1 || Number(layer.bars) > 512) errors.push(`Invalid spectrum source on ${cleanText(layer.id, 80)}.`);
      } else if (layer.type === 'waveform') {
        if (!Number.isFinite(Number(layer.frequency)) || !Number.isFinite(Number(layer.amplitude)) || !Number.isFinite(Number(layer.thickness))) errors.push(`Invalid waveform source on ${cleanText(layer.id, 80)}.`);
      } else if (layer.type === 'particles') {
        if (!Number.isFinite(Number(layer.count)) || Number(layer.count) < 1 || Number(layer.count) > 4096) errors.push(`Invalid particle source on ${cleanText(layer.id, 80)}.`);
      } else if (layer.type === 'path') {
        if (!Array.isArray(layer.points) || layer.points.length < 2 || layer.points.length > 32
          || layer.points.some((point) => !isPlainObject(point) || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y)))) errors.push(`Invalid path source on ${cleanText(layer.id, 80)}.`);
      }
    }
  };
  if (Array.isArray(input.layers)) inspectLayers(input.layers);
  if (!visibleVisualLayers) errors.push('Project has no visible visual layers.');
  return errors;
}

async function readJson(filePath, maximumBytes, label) {
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile()) throw new Error(`${label} is missing.`);
  if (stat.size > maximumBytes) throw new Error(`${label} is too large.`);
  try { return JSON.parse(await fs.promises.readFile(filePath, 'utf8')); }
  catch (error) { throw new Error(`${label} is not valid JSON: ${error.message}`); }
}

async function inspectFiles(root) {
  let files = 0;
  let bytes = 0;
  async function visit(directory) {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      const relative = path.relative(root, target).replace(/\\/g, '/');
      safeRelativePath(relative, 'Bundle file');
      if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${relative}.`);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) {
        files += 1;
        if (files > MAX_BUNDLE_FILES) throw new Error(`The package contains more than ${MAX_BUNDLE_FILES} files.`);
        if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) throw new Error(`Unsupported package file: ${relative}.`);
        const stat = await fs.promises.stat(target);
        if (stat.size > MAX_FILE_BYTES) throw new Error(`Package file is too large: ${relative}.`);
        bytes += stat.size;
        if (bytes > MAX_BUNDLE_BYTES) throw new Error('The package exceeds the 512 MB installed-size limit.');
      } else throw new Error(`Unsupported package entry: ${relative}.`);
    }
  }
  await visit(root);
  return Object.freeze({ files, bytes });
}

async function inspectBundle(bundlePath, options = {}) {
  const resolved = path.resolve(String(bundlePath || ''));
  const stat = await fs.promises.stat(resolved).catch(() => null);
  if (!stat?.isDirectory()) throw new Error('Choose an exported Data Horizon bundle directory.');
  const manifest = validateManifest(await readJson(path.join(resolved, 'manifest.json'), MAX_MANIFEST_BYTES, 'manifest.json'));
  const project = await readJson(resolveInside(resolved, manifest.project), MAX_BUNDLE_BYTES, manifest.project);
  const projectErrors = validateProject(project);
  if (projectErrors.length) throw new Error(`The Data Horizon project is invalid: ${projectErrors.slice(0, 4).join(' ')}`);
  for (const required of [manifest.entrypoint, 'runtime/app.js', 'runtime/styles.css', 'runtime/project.js']) {
    const requiredStat = await fs.promises.stat(resolveInside(resolved, required)).catch(() => null);
    if (!requiredStat?.isFile()) throw new Error(`Required runtime file is missing: ${required}.`);
  }
  const totals = await inspectFiles(resolved);
  let previewDataUri = '';
  if (options.includePreview && manifest.preview) {
    const previewPath = resolveInside(resolved, manifest.preview);
    const previewStat = await fs.promises.stat(previewPath).catch(() => null);
    if (previewStat?.isFile() && previewStat.size <= MAX_PREVIEW_BYTES) {
      const extension = path.extname(previewPath).toLowerCase();
      const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg'
        : extension === '.webp' ? 'image/webp' : extension === '.gif' ? 'image/gif' : 'image/png';
      previewDataUri = `data:${mime};base64,${(await fs.promises.readFile(previewPath)).toString('base64')}`;
    }
  }
  return Object.freeze({ resolved, manifest, project: options.includeProject ? project : null, totals, previewDataUri });
}

function publicRecord(bundle, installedPath) {
  const { manifest } = bundle;
  return Object.freeze({
    styleId: styleIdFor(manifest.id),
    packageId: manifest.id,
    name: manifest.name,
    version: manifest.version,
    createdBy: manifest.createdBy,
    engineVersion: manifest.engineVersion,
    key: `custom-${manifest.visualizer.key}`,
    category: manifest.visualizer.category || 'CUSTOM',
    description: `Data Horizon package · ${manifest.canvas.width}×${manifest.canvas.height}`,
    canvas: manifest.canvas,
    audioContract: manifest.audio.contract,
    acceptsOfflineFrames: true,
    palettes: manifest.palettes,
    paletteCount: manifest.palettes.length,
    previewDataUri: bundle.previewDataUri || '',
    installedPath
  });
}

class VisualizerPackageManager {
  constructor(rootDirectory) {
    this.rootDirectory = path.resolve(rootDirectory);
  }

  async ensureRoot() {
    await fs.promises.mkdir(this.rootDirectory, { recursive: true });
  }

  async list() {
    await this.ensureRoot();
    const records = [];
    for (const entry of await fs.promises.readdir(this.rootDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const installedPath = path.join(this.rootDirectory, entry.name);
      try {
        const bundle = await inspectBundle(installedPath, { includePreview: true });
        records.push(publicRecord(bundle, installedPath));
      } catch (_) { /* Invalid or interrupted installs remain isolated from the catalog. */ }
    }
    records.sort((left, right) => left.name.localeCompare(right.name) || left.packageId.localeCompare(right.packageId));
    const ids = new Set();
    return records.filter((record) => {
      if (ids.has(record.styleId)) return false;
      ids.add(record.styleId);
      return true;
    });
  }

  async preview(sourceDirectory) {
    const source = await inspectBundle(sourceDirectory, { includePreview: true });
    const existing = (await this.list()).find((item) => item.packageId === source.manifest.id) || null;
    const record = publicRecord(source, '');
    return Object.freeze({
      ...record,
      installedPath: '',
      files: source.totals.files,
      bytes: source.totals.bytes,
      updating: Boolean(existing),
      installedVersion: existing?.version || ''
    });
  }

  async install(sourceDirectory) {
    await this.ensureRoot();
    const source = await inspectBundle(sourceDirectory, { includePreview: true });
    const folderName = packageFolderFor(source.manifest.id);
    const target = path.join(this.rootDirectory, folderName);
    if (path.resolve(source.resolved) === path.resolve(target)) return publicRecord(source, target);
    const staging = path.join(this.rootDirectory, `.staging-${crypto.randomUUID()}`);
    const backup = path.join(this.rootDirectory, `.backup-${crypto.randomUUID()}`);
    let backedUp = false;
    try {
      await fs.promises.cp(source.resolved, staging, { recursive: true, errorOnExist: true, force: false });
      await inspectBundle(staging);
      if (await fs.promises.stat(target).catch(() => null)) {
        await fs.promises.rename(target, backup);
        backedUp = true;
      }
      await fs.promises.rename(staging, target);
      if (backedUp) await fs.promises.rm(backup, { recursive: true, force: true });
      return publicRecord(await inspectBundle(target, { includePreview: true }), target);
    } catch (error) {
      await fs.promises.rm(staging, { recursive: true, force: true }).catch(() => {});
      if (backedUp && !(await fs.promises.stat(target).catch(() => null))) {
        await fs.promises.rename(backup, target).catch(() => {});
      }
      throw error;
    }
  }

  async load(styleId) {
    const record = (await this.list()).find((item) => item.styleId === Number(styleId));
    if (!record) throw new Error('The selected custom visualizer package is not installed.');
    const bundle = await inspectBundle(record.installedPath, { includeProject: true });
    return Object.freeze({ package: record, project: bundle.project });
  }

  async remove(styleId) {
    const record = (await this.list()).find((item) => item.styleId === Number(styleId));
    if (!record) return false;
    const target = path.resolve(record.installedPath);
    if (!target.startsWith(`${this.rootDirectory}${path.sep}`)) throw new Error('Refusing to remove a package outside the visualizer registry.');
    await fs.promises.rm(target, { recursive: true, force: true });
    return true;
  }
}

module.exports = Object.freeze({
  AUDIO_CONTRACT,
  FORMAT,
  VisualizerPackageManager,
  inspectBundle,
  styleIdFor,
  validateManifest,
  validatePalettes,
  validateProject
});
