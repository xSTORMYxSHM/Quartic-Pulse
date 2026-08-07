const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { offscreen: true }
  });
  await window.loadFile(path.join(__dirname, '..', 'assets', 'icon.svg'));
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icon.png'), image.toPNG());
  app.quit();
});
