'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const {
  VisualizerPackageManager,
  inspectBundle,
  styleIdFor,
  validateManifest,
  validateProject
} = require('../visualizer-package-manager');

function projectWithNativeLayers(name = 'Signal World') {
  const common = (id, type, blendMode = 'normal') => ({ id, name: id, type, visible: true, opacity: 1, blendMode, depth: 0, parallax: 0, effects: [] });
  return {
    schemaVersion: 1,
    engineVersion: '0.15.0',
    id: 'project-signal-world',
    name,
    revision: 1,
    canvas: { width: 1920, height: 1080, background: [0, 0, 0, 1] },
    assets: [{ id: 'asset-signal', name: 'Signal', kind: 'image', mimeType: 'image/svg+xml', uri: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16"%3E%3Crect width="16" height="16" fill="cyan"/%3E%3C/svg%3E' }],
    layers: [
      { ...common('layer-image', 'image'), assetId: 'asset-signal', fit: 'cover' },
      { ...common('layer-text', 'text'), text: 'SIGNAL', fontFamily: 'Segoe UI', fontSize: 64 },
      { ...common('layer-shape', 'shape'), shape: 'frame', fill: '#00000000', stroke: '#49E4E1' },
      { ...common('layer-spectrum', 'spectrum'), bars: 48 },
      { ...common('layer-waveform', 'waveform'), frequency: 3.5, amplitude: .3, thickness: .018 },
      { ...common('layer-particles', 'particles', 'screen'), count: 72 },
      { ...common('layer-path', 'path', 'screen'), points: [{ x: .1, y: .8 }, { x: .9, y: .2 }] }
    ],
    bindings: [],
    timeline: { duration: 8, fps: 60, loop: true, tracks: [{ id: 'track-opacity', target: 'layer.layer-text.opacity', keyframes: [{ id: 'key-a', time: 0, value: .5, easing: 'linear' }, { id: 'key-b', time: 8, value: 1, easing: 'easeInOut' }] }] },
    presets: [],
    outputs: { fps: 60, colorSpace: 'srgb' }
  };
}

async function createBundle(parent, name = 'Signal World', version = '1.0.0') {
  const root = path.join(parent, `source-${version.replace(/\W/g, '-')}`);
  const runtime = path.join(root, 'runtime');
  await fs.promises.mkdir(runtime, { recursive: true });
  const project = projectWithNativeLayers(name);
  const manifest = {
    schemaVersion: 1,
    format: 'data-horizon.quartic-visualizer',
    target: 'quartic-pulse',
    id: 'com.tempestmainframe.data-horizon.signal-world',
    name,
    version,
    createdBy: 'Data Horizon Studio',
    engine: { id: 'data-horizon-runtime', version: '0.1.0' },
    project: 'project.horizon.json',
    preview: 'preview.png',
    entrypoint: 'runtime/index.html',
    canvas: { width: 1920, height: 1080, transparent: false },
    audio: { contract: 'tempest.audio-features.v1', sources: ['bass', 'mids', 'highs', 'beat', 'rms'] },
    runtime: { browser: 'chromium-webgl2', localFile: true, deterministic: true },
    visualizer: {
      key: 'signal-world', category: 'CUSTOM', mode: 'full-canvas',
      acceptsTransportClock: true, acceptsOfflineFrames: true
    },
    palettes: [
      { id: 'signal-neon', name: 'Signal Neon', colors: ['#091125', '#20466E', '#63558E', '#6BA8B5'], favorite: true },
      { id: 'warning-sunset', name: 'Warning Sunset', colors: ['#16090D', '#702531', '#D2693D', '#F3C46B'] }
    ]
  };
  await Promise.all([
    fs.promises.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest), 'utf8'),
    fs.promises.writeFile(path.join(root, 'project.horizon.json'), JSON.stringify(project), 'utf8'),
    fs.promises.writeFile(path.join(root, 'preview.png'), Buffer.from([137, 80, 78, 71])),
    fs.promises.writeFile(path.join(runtime, 'index.html'), '<canvas></canvas>', 'utf8'),
    fs.promises.writeFile(path.join(runtime, 'app.js'), 'window.__ready = true;', 'utf8'),
    fs.promises.writeFile(path.join(runtime, 'styles.css'), 'canvas{display:block}', 'utf8'),
    fs.promises.writeFile(path.join(runtime, 'project.js'), 'window.__project = {};', 'utf8')
  ]);
  return root;
}

test('validates and inspects a Data Horizon Quartic visualizer bundle', async (context) => {
  const temporary = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'quartic-visualizer-inspect-'));
  context.after(() => fs.promises.rm(temporary, { recursive: true, force: true }));
  const bundle = await inspectBundle(await createBundle(temporary), { includeProject: true, includePreview: true });
  assert.equal(bundle.manifest.format, 'data-horizon.quartic-visualizer');
  assert.equal(bundle.project.schemaVersion, 1);
  assert.deepEqual(bundle.project.layers.map((layer) => layer.type), ['image', 'text', 'shape', 'spectrum', 'waveform', 'particles', 'path']);
  assert.equal(bundle.manifest.palettes.length, 2);
  assert.deepEqual(bundle.manifest.palettes[0].colors, ['#091125', '#20466E', '#63558E', '#6BA8B5']);
  assert.match(bundle.previewDataUri, /^data:image\/png;base64,/);
});

test('bounds native layers, masks, and timeline data before renderer use', () => {
  const invalidPath = projectWithNativeLayers();
  invalidPath.layers.find((layer) => layer.type === 'path').points = [{ x: 0, y: 0 }];
  assert.match(validateProject(invalidPath).join(' '), /Invalid path source/i);

  const invalidMask = projectWithNativeLayers();
  invalidMask.layers[0].effects.push({ id: 'mask', type: 'paintMask', enabled: true, parameters: {}, paintMask: { base: 2, strokes: [] } });
  assert.match(validateProject(invalidMask).join(' '), /Invalid painted mask/i);

  const invalidTimeline = projectWithNativeLayers();
  invalidTimeline.timeline.tracks[0].keyframes[0].easing = 'teleport';
  assert.match(validateProject(invalidTimeline).join(' '), /invalid keyframe/i);
});

test('installs, updates, loads, lists, and removes packages with a stable style id', async (context) => {
  const temporary = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'quartic-visualizer-registry-'));
  context.after(() => fs.promises.rm(temporary, { recursive: true, force: true }));
  const manager = new VisualizerPackageManager(path.join(temporary, 'installed'));
  const first = await manager.install(await createBundle(temporary, 'Signal World', '1.0.0'));
  assert.equal(first.styleId, styleIdFor(first.packageId));
  assert.equal((await manager.list()).length, 1);
  assert.equal(first.paletteCount, 2);
  const preview = await manager.preview(await createBundle(temporary, 'Signal World Preview', '1.0.1'));
  assert.equal(preview.updating, true);
  assert.equal(preview.installedVersion, '1.0.0');
  assert.equal(preview.paletteCount, 2);
  assert.equal((await manager.load(first.styleId)).project.name, 'Signal World');
  const updated = await manager.install(await createBundle(temporary, 'Signal World Updated', '1.1.0'));
  assert.equal(updated.styleId, first.styleId);
  assert.equal(updated.version, '1.1.0');
  assert.equal((await manager.load(first.styleId)).project.name, 'Signal World Updated');
  assert.equal(await manager.remove(first.styleId), true);
  assert.equal((await manager.list()).length, 0);
});

test('rejects manifests that can escape the bundle or execute as another target', () => {
  const valid = {
    schemaVersion: 1,
    format: 'data-horizon.quartic-visualizer',
    target: 'quartic-pulse',
    id: 'com.tempestmainframe.data-horizon.test',
    name: 'Test',
    version: '1.0.0',
    engine: { id: 'data-horizon-runtime', version: '0.1.0' },
    project: 'project.horizon.json',
    entrypoint: 'runtime/index.html',
    audio: { contract: 'tempest.audio-features.v1' },
    runtime: { browser: 'chromium-webgl2', deterministic: true },
    visualizer: { mode: 'full-canvas', acceptsTransportClock: true, acceptsOfflineFrames: true }
  };
  assert.throws(() => validateManifest({ ...valid, project: '../project.json' }), /unsafe path/i);
  assert.throws(() => validateManifest({ ...valid, target: 'tempest-broadcast' }), /not a Quartic Pulse/i);
  assert.throws(() => validateManifest({ ...valid, palettes: [{ id: 'bad', name: 'Bad', colors: ['#000000'] }] }), /exactly four colors/i);
  assert.throws(() => validateManifest({ ...valid, palettes: [{ id: 'bad', name: 'Bad', colors: ['#000000', '#111111', '#222222', 'javascript:red'] }] }), /invalid color/i);
  assert.throws(() => validateManifest({ ...valid, palettes: [{ id: 'bad', name: 'Bad', colors: ['#000000', '#111111', '#222222', '#333333'], favorite: 'false' }] }), /favorite must be a boolean/i);
});
