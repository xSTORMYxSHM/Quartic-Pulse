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
check(packageData.license === 'GPL-3.0-or-later', 'package license must remain GPL-3.0-or-later.');
check(packageData.build?.asarUnpack?.includes('assets/windows-audio/**/*'), 'Windows audio helper must be unpacked from ASAR.');

const indexHtml = read('src/renderer/index.html');
check(indexHtml.includes('id="appVersionText"'), 'About version element is missing.');
check(indexHtml.includes('../shared/app-metadata.js'), 'Renderer does not load centralized app metadata.');
check(!/style-src[^;]*(?:'unsafe-inline'|\*)/.test(indexHtml), 'CSP must not allow unrestricted inline styles.');

const requiredFiles = [
  'LICENSE',
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
  'assets/bin/FFmpeg-SOURCE.txt'
];
for (const relativePath of requiredFiles) {
  check(fs.existsSync(path.join(root, relativePath)), `Required release asset is missing: ${relativePath}`);
}

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
