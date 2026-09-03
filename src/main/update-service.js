'use strict';

const DEFAULT_RELEASE_URL = 'https://github.com/xSTORMYxSHM/Quartic-Pulse/releases/latest';

function safeText(value, maximum = 300) {
  return String(value ?? '')
    .replace(/https?:\/\/\S+/gi, 'the update server')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, maximum);
}

function createUpdateService(options) {
  const {
    updater,
    app,
    dialog,
    shell,
    getWindow = () => null,
    onStatus = () => {},
    releaseUrl = DEFAULT_RELEASE_URL,
    platform = process.platform,
    environment = process.env,
    startupDelay = 15000,
    schedule = setTimeout
  } = options;

  const portable = Boolean(environment.PORTABLE_EXECUTABLE_FILE);
  const supported = platform === 'win32' && app.isPackaged && !portable;
  const mode = !app.isPackaged ? 'development' : portable ? 'portable' : platform === 'win32' ? 'installed' : 'unsupported';
  let initialized = false;
  let checking = false;
  let downloading = false;
  let status = {
    mode,
    supported,
    phase: supported ? 'idle' : 'manual-only',
    currentVersion: safeText(app.getVersion?.() || '', 40),
    availableVersion: '',
    releaseName: '',
    releaseDate: '',
    progress: 0,
    message: supported
      ? 'Ready to check for a signed update.'
      : portable
        ? 'Portable builds update manually with the latest signed installer.'
        : app.isPackaged
          ? 'Automatic updates are available on installed Windows builds.'
          : 'Update checks are disabled while running from source.'
  };

  function snapshot() {
    return { ...status };
  }

  function publish(patch) {
    status = { ...status, ...patch };
    onStatus(snapshot());
    return snapshot();
  }

  function fail(error) {
    checking = false;
    downloading = false;
    return publish({
      phase: 'error',
      message: safeText(error?.message || error || 'The update check failed.') || 'The update check failed.'
    });
  }

  function initialize() {
    if (initialized || !supported) return snapshot();
    initialized = true;
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.allowDowngrade = false;

    updater.on('checking-for-update', () => publish({
      phase: 'checking',
      progress: 0,
      message: 'Checking GitHub Releases for updates…'
    }));
    updater.on('update-available', (info = {}) => {
      checking = false;
      publish({
        phase: 'available',
        availableVersion: safeText(info.version, 40),
        releaseName: safeText(info.releaseName, 120),
        releaseDate: safeText(info.releaseDate, 60),
        progress: 0,
        message: `Version ${safeText(info.version, 40) || 'new'} is available.`
      });
    });
    updater.on('update-not-available', () => {
      checking = false;
      publish({
        phase: 'current',
        availableVersion: '',
        releaseName: '',
        releaseDate: '',
        progress: 0,
        message: `Version ${status.currentVersion} is up to date.`
      });
    });
    updater.on('download-progress', (progress = {}) => publish({
      phase: 'downloading',
      progress: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
      message: `Downloading signed update… ${Math.round(Number(progress.percent) || 0)}%`
    }));
    updater.on('update-downloaded', (info = {}) => {
      downloading = false;
      publish({
        phase: 'downloaded',
        availableVersion: safeText(info.version, 40) || status.availableVersion,
        progress: 100,
        message: 'The signed update is ready. Restart Quartic Pulse to install it.'
      });
    });
    updater.on('error', fail);
    return snapshot();
  }

  async function check() {
    if (!supported) return snapshot();
    initialize();
    if (checking || downloading || status.phase === 'downloaded') return snapshot();
    checking = true;
    publish({ phase: 'checking', progress: 0, message: 'Checking GitHub Releases for updates…' });
    try {
      await updater.checkForUpdates();
    } catch (error) {
      fail(error);
    } finally {
      checking = false;
    }
    return snapshot();
  }

  async function download() {
    if (!supported || status.phase !== 'available' || downloading) return snapshot();
    downloading = true;
    publish({ phase: 'downloading', progress: 0, message: 'Starting the signed update download…' });
    try {
      await updater.downloadUpdate();
    } catch (error) {
      fail(error);
    } finally {
      downloading = false;
    }
    return snapshot();
  }

  async function install() {
    if (!supported || status.phase !== 'downloaded') return false;
    const result = await dialog.showMessageBox(getWindow() || undefined, {
      type: 'question',
      title: 'Install Quartic Pulse update',
      message: `Restart and install Quartic Pulse ${status.availableVersion || 'update'} now?`,
      detail: 'Save any work first. Quartic Pulse will close, run the signed installer, and reopen.',
      buttons: ['Restart and install', 'Not now'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });
    if (result.response !== 0) return false;
    updater.quitAndInstall(false, true);
    return true;
  }

  async function openReleases() {
    await shell.openExternal(releaseUrl);
    return true;
  }

  function start() {
    initialize();
    if (!supported) return snapshot();
    const timer = schedule(() => check(), startupDelay);
    timer?.unref?.();
    return snapshot();
  }

  return { start, getStatus: snapshot, check, download, install, openReleases };
}

module.exports = { createUpdateService, safeText, DEFAULT_RELEASE_URL };
