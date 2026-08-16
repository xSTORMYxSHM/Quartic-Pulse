const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const outputPath = path.join(__dirname, '..', 'data-horizon-preview.png');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('use-angle', 'swiftshader');

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1600,
    height: 1000,
    backgroundColor: '#02040b',
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'main', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const rendererUrl = pathToFileURL(path.resolve(__dirname, '..', 'src', 'renderer', 'index.html')).href;
  await window.loadURL(rendererUrl);
  await window.webContents.insertCSS(`
    .workspace-rail, .control-panel, .stage-header, .audio-hud, .render-status,
    .drop-overlay, .toast, [role="status"] { display: none !important; }
    .app-shell { display: block !important; }
    .stage { width: 100vw !important; height: 100vh !important; }
    .stage::after { display: none !important; }
  `);
  await window.webContents.executeJavaScript(`(() => {
    document.querySelector('#visualSafetyContinueButton')?.click();
    const button = document.querySelector('[data-visual-style="6"]');
    if (!button) throw new Error('Data Horizon visual selector was not found.');
    button.click();
    document.querySelector('#nowPlayingOverlay')?.setAttribute('hidden', '');
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 2400));
  await window.webContents.executeJavaScript(`(() => {
    const toast = document.querySelector('#toast');
    if (toast) toast.style.setProperty('display', 'none', 'important');
  })()`);

  const bounds = await window.webContents.executeJavaScript(`(() => {
    const rect = document.querySelector('#fractalCanvas').getBoundingClientRect();
    return {
      x: Math.max(0, Math.round(rect.x)),
      y: Math.max(0, Math.round(rect.y)),
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height))
    };
  })()`);
  const image = await window.webContents.capturePage(bounds);
  fs.writeFileSync(outputPath, image.toPNG());
  console.log(`Captured Data Horizon preview: ${outputPath}`);
  window.destroy();
  app.exit(0);
});

setTimeout(() => {
  console.error('Data Horizon capture timed out.');
  app.exit(2);
}, 15000);
