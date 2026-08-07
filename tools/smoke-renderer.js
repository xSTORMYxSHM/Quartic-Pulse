const { app, BrowserWindow } = require('electron');
const path = require('path');

const failures = [];
let completed = false;

function finish(code, message) {
  if (completed) return;
  completed = true;
  console.log(message);
  app.exit(code);
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'main', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.webContents.on('console-message', (_event, _level, message) => {
    if (/shader|webgl|uncaught|error/i.test(message)) failures.push(message);
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    failures.push(`Renderer exited: ${details.reason}`);
  });

  await window.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'index.html'));
  await new Promise((resolve) => setTimeout(resolve, 1800));
  const result = await window.webContents.executeJavaScript(`(() => {
    const canvas = document.querySelector('#fractalCanvas');
    const selector = document.querySelector('#fractalType');
    const gl = canvas && canvas.getContext('webgl2');
    return {
      webgl2: Boolean(gl),
      shaderProgram: Boolean(gl && gl.getParameter(gl.CURRENT_PROGRAM)),
      equations: selector ? selector.options.length : 0,
      bodyText: document.body.innerText.slice(0, 180)
    };
  })()`);

  if (!result.webgl2) failures.push('WebGL2 context was not available.');
  if (!result.shaderProgram) failures.push('The fractal shader program did not compile and bind.');
  if (result.equations !== 20) failures.push(`Expected 20 equations; found ${result.equations}.`);
  if (failures.length) finish(1, `Renderer smoke test failed:\n${failures.join('\n')}`);
  else finish(0, `Renderer smoke test passed: WebGL2 active, ${result.equations} equations loaded.`);
});

setTimeout(() => finish(2, 'Renderer smoke test timed out.'), 12000);
