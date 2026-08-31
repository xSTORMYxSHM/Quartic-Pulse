'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const electronRoot = path.dirname(require.resolve('electron/package.json'));
const executable = path.join(electronRoot, 'dist', 'electron.exe');

if (!fs.existsSync(executable)) {
  const result = childProcess.spawnSync(process.execPath, [path.join(electronRoot, 'install.js')], {
    cwd: electronRoot,
    stdio: 'inherit',
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

if (!fs.existsSync(executable)) throw new Error(`Electron runtime was not installed at ${executable}`);
console.log(`ELECTRON_RUNTIME_OK ${require('electron/package.json').version}`);
