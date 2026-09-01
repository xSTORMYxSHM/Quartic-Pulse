'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const failures = [];
const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const metadata = require(path.join(root, 'src', 'shared', 'app-metadata'));

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walk(directory, visitor) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'release', '.pnpm-store'].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, visitor);
    else visitor(target);
  }
}

check(packageData.version === metadata.version, `package.json (${packageData.version}) and app metadata (${metadata.version}) versions differ.`);
check(packageData.releaseChannel === metadata.releaseChannel, `package.json (${packageData.releaseChannel}) and app metadata (${metadata.releaseChannel}) release channels differ.`);
check(packageData.packageManager?.startsWith('pnpm@'), 'package.json must pin the pnpm package manager.');
check(packageData.scripts?.postinstall?.includes('ensure-electron-runtime.ps1'), 'Electron runtime bootstrap must use the PATH-independent PowerShell wrapper.');
check(packageData.license === 'GPL-3.0-or-later', 'package license must remain GPL-3.0-or-later.');
check(packageData.build?.asarUnpack?.includes('assets/windows-audio/**/*'), 'Windows audio helper must be unpacked from ASAR.');

const indexHtml = read('src/renderer/index.html');
check(indexHtml.includes('id="appVersionText"'), 'About version element is missing.');
check(indexHtml.includes('../shared/app-metadata.js'), 'Renderer does not load centralized app metadata.');
check(indexHtml.includes('data-visual-style="6"') && indexHtml.includes('data-visual-options="6"'), 'Data Horizon selector or options panel is missing.');
check(indexHtml.includes('id="importVisualizerPackageButton"') && indexHtml.includes('id="installedVisualizerPackage"') && indexHtml.includes('id="removeVisualizerPackageButton"'), 'Custom visualizer package controls are missing.');
check(indexHtml.includes('PREVIEW PACKAGE') && indexHtml.includes('CUSTOM VISUALIZERS + PALETTES'), 'Data Horizon package preview or palette messaging is missing.');
check(indexHtml.includes('modules/data-horizon-runtime-vendor.js') && indexHtml.includes('modules/data-horizon-runtime.js') && indexHtml.includes('modules/visualizer-package-controller.js'), 'Imported visualizer renderer modules are not loaded.');
check(indexHtml.includes('modules/background-render-policy.js'), 'Background render policy is not loaded.');
check(indexHtml.includes('modules/audio-modulation-engine.js') && indexHtml.includes('modules/audio-modulation-controller.js') && indexHtml.includes('id="modulationVisualSupport"'), 'Visual-aware audio modulation modules or capability messaging is missing.');
check(indexHtml.includes('modules/music-personality-controller.js') && indexHtml.includes('id="musicPersonalityMount"'), 'Music Personality controller or mount is missing.');
check(indexHtml.includes('modules/visual-preset-controller.js') && indexHtml.includes('id="experiencePresetGrid"'), 'Visual preset controller or preset grid is missing.');
check(indexHtml.includes('id="savedPaletteGrid"') && indexHtml.includes('id="saveCurrentPaletteButton"') && indexHtml.includes('modules/palette-library-controller.js'), 'Saved color palette library is missing.');
check(!/style-src[^;]*(?:'unsafe-inline'|\*)/.test(indexHtml), 'CSP must not allow unrestricted inline styles.');
check(!read('src/renderer/modules/song-map-controller.js').includes('${section.label}'), 'Song Map labels must not be interpolated into HTML.');
check(!read('src/renderer/modules/song-director-controller.js').includes('${cue.label}</strong>'), 'Song Director labels must not be interpolated into HTML.');
const mainSource = read('src/main/main.js');
check(mainSource.includes("setWindowOpenHandler(() => ({ action: 'deny' }))") && mainSource.includes("webContents.on('will-navigate'"), 'App-window navigation guards are missing.');
check(mainSource.includes('requireTrustedRenderer(event)'), 'Privileged IPC sender validation is missing.');
check(mainSource.includes('backgroundThrottling: false'), 'Main renderer background throttling must remain disabled for uninterrupted OBS state delivery.');

const requiredFiles = [
  'LICENSE',
  'DATA_HORIZON_PACKAGE_SPEC.md',
  'THIRD_PARTY_NOTICES.md',
  'BRAND_ASSETS.md',
  'assets/icon.png',
  'assets/quartic-pulse-fractal-logo-master.png',
  'assets/storm-horizon-media-logo.png',
  'assets/tempest-mainframe-room.png',
  'assets/audio/export-complete-stinger.wav',
  'assets/windows-audio/QuarticPulse.AudioCapture.exe',
  'assets/windows-audio/NAudio.Core.dll',
  'assets/windows-audio/NAudio.Wasapi.dll',
  'assets/windows-audio/NAudio-LICENSE.txt',
  'assets/bin/ffmpeg.exe',
  'assets/bin/FFmpeg-LICENSE.txt',
  'assets/bin/FFmpeg-README.txt',
  'assets/bin/FFmpeg-SOURCE.txt',
  'src/main/visualizer-package-manager.js',
  'src/main/security-policy.js',
  'tools/ensure-electron-runtime.ps1',
  'tools/ensure-electron-runtime.js',
  'tools/electron-builder.signed.cjs',
  'tools/read-authenticode-signature.ps1',
  'src/renderer/modules/data-horizon-runtime-vendor.js',
  'src/renderer/modules/background-render-policy.js',
  'src/renderer/modules/data-horizon-runtime.js',
  'src/renderer/modules/visualizer-package-controller.js',
  'src/renderer/modules/audio-modulation-engine.js',
  'src/renderer/modules/audio-modulation-controller.js',
  'src/renderer/modules/music-personality-controller.js',
  'src/renderer/modules/visual-preset-controller.js',
  'src/renderer/modules/performance-show-controller.js',
  'src/renderer/modules/audio-source-controller.js',
  'src/renderer/modules/song-map-controller.js',
  'src/renderer/modules/performance-package-session-controller.js',
  'src/renderer/modules/profile-service-controller.js',
  'src/renderer/modules/operator-tools-controller.js',
  'src/renderer/modules/workspace-ui-controller.js',
  'src/renderer/modules/show-composer-orchestrator.js',
  'src/renderer/modules/palette-library-controller.js'
];
for (const relativePath of requiredFiles) {
  check(fs.existsSync(path.join(root, relativePath)), `Required release asset is missing: ${relativePath}`);
}

const dataHorizonSpec = read('DATA_HORIZON_PACKAGE_SPEC.md');
const dataHorizonFixtureManifest = JSON.parse(read('tools/fixtures/data-horizon-signal-test/manifest.json'));
const dataHorizonFixtureProject = JSON.parse(read('tools/fixtures/data-horizon-signal-test/project.horizon.json'));
check(dataHorizonSpec.includes('data-horizon.quartic-visualizer') && dataHorizonSpec.includes('Shadow, Field, Accent, and Detail'), 'Data Horizon package specification is incomplete.');
check(Array.isArray(dataHorizonFixtureManifest.palettes) && dataHorizonFixtureManifest.palettes.length >= 2, 'Data Horizon reference fixture must include package palettes.');
check(['image', 'text', 'shape', 'spectrum', 'waveform', 'particles', 'path'].every((type) => dataHorizonFixtureProject.layers.some((layer) => layer.type === type)), 'Data Horizon reference fixture must cover every native visual layer type.');
check(read('src/renderer/modules/data-horizon-runtime-vendor.js').includes('Generated from first-party Data Horizon 0.15.0') && read('src/renderer/modules/data-horizon-runtime.js').includes('evaluateTimeline'), 'Bundled Data Horizon 0.15 runtime or host timeline adapter is missing.');

const publicText = [];
walk(path.join(root, 'src'), (file) => {
  const extension = path.extname(file).toLowerCase();
  if (['.js', '.json', '.html', '.md'].includes(extension)) publicText.push(fs.readFileSync(file, 'utf8'));
  if (extension === '.js') {
    try { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); }
    catch (error) { failures.push(`JavaScript syntax error in ${path.relative(root, file)}: ${error.message}`); }
  }
});
walk(path.join(root, 'tools'), (file) => {
  if (path.extname(file).toLowerCase() !== '.js') return;
  try { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); }
  catch (error) { failures.push(`JavaScript syntax error in ${path.relative(root, file)}: ${error.message}`); }
});
check(!/discord(?:app)?\.com\/api\/webhooks\//i.test(publicText.join('\n')), 'A Discord webhook URL is present in public application source.');

const ffmpegPath = path.join(root, 'assets', 'bin', 'ffmpeg.exe');
if (fs.existsSync(ffmpegPath)) {
  try {
    const output = childProcess.execFileSync(ffmpegPath, ['-hide_banner', '-version'], { encoding: 'utf8' });
    const versionMatch = output.match(/ffmpeg version\s+(\d+)\.(\d+)\.(\d+)/i);
    check(Boolean(versionMatch), 'Bundled FFmpeg version could not be read.');
    if (versionMatch) {
      const version = versionMatch.slice(1).map(Number);
      check(version[0] > 8 || (version[0] === 8 && (version[1] > 1 || (version[1] === 1 && version[2] >= 2))), `Bundled FFmpeg ${version.join('.')} is older than 8.1.2.`);
    }
    const encoders = childProcess.execFileSync(ffmpegPath, ['-hide_banner', '-encoders'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    for (const encoder of ['libx264', 'libx265', 'libvpx-vp9', 'prores_ks', 'ffv1', 'aac', 'libopus', 'flac', 'pcm_s24le']) {
      check(encoders.includes(encoder), `Bundled FFmpeg is missing required encoder: ${encoder}`);
    }
  } catch (error) {
    failures.push(`Bundled FFmpeg validation failed: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`RELEASE_VALIDATION_FAILED (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`RELEASE_VALIDATION_OK ${metadata.productName} ${metadata.version} (${metadata.releaseChannel})`);
