'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requestedRoot = process.argv.find((argument) => argument.startsWith('--data-horizon-root='))?.slice('--data-horizon-root='.length);
const dataHorizonRoot = path.resolve(requestedRoot || path.join(root, '..', '..', 'Data Horizon'));
const renderPath = path.join(dataHorizonRoot, 'packages', 'render-runtime', 'dist', 'index.js');
const audioPath = path.join(dataHorizonRoot, 'packages', 'audio-modulation', 'dist', 'index.js');
const metadataPath = path.join(dataHorizonRoot, 'package.json');
const outputPath = path.join(root, 'src', 'renderer', 'modules', 'data-horizon-runtime-vendor.js');

for (const sourcePath of [renderPath, audioPath, metadataPath]) {
  if (!fs.existsSync(sourcePath)) throw new Error(`Build Data Horizon first; required source is missing: ${sourcePath}`);
}

const indent = (source) => source.replaceAll('\r\n', '\n').trimEnd().split('\n').map((line) => `    ${line}`).join('\n');
const renderSource = indent(fs.readFileSync(renderPath, 'utf8'));
const audioSource = indent(fs.readFileSync(audioPath, 'utf8'));
const version = JSON.parse(fs.readFileSync(metadataPath, 'utf8')).version;
const output = `(() => {
  'use strict';

  // Generated from first-party Data Horizon ${version} compiled runtimes.
  // Imported package JavaScript is never evaluated; bundles provide project data only.
  function loadCommonJs(factory) {
    const module = { exports: {} };
    factory(module, module.exports);
    return module.exports;
  }

  const renderRuntime = loadCommonJs((module, exports) => {
${renderSource}
  });

  const audioRuntime = loadCommonJs((module, exports) => {
${audioSource}
  });

  window.QuarticDataHorizonVendor = Object.freeze({
    audioRuntime,
    engineVersion: '${version}',
    renderRuntime
  });
})();
`;

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`DATA_HORIZON_RUNTIME_SYNC_OK ${version} ${path.relative(root, outputPath)}`);
