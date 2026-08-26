(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const $ = options.query || ((selector) => document.querySelector(selector));
    const storage = options.storage || window.localStorage;
    const getProfiles = options.getProfiles || (() => []);
    const applyProfile = options.applyProfile || (() => {});
    const showToast = options.showToast || (() => {});

  const obsAutomationStorageKey = 'quarticPulseObsAutomationV1';
  let obsSocket = null;
  let obsConnected = false;
  let obsRequestCounter = 0;
  let obsCurrentSceneSources = [];
  const obsPendingRequests = new Map();
  let obsSceneProfileLinks = {};

  function loadObsAutomationSettings() {
    try {
      const settings = JSON.parse(storage.getItem(obsAutomationStorageKey) || '{}');
      const port = Number(settings.port);
      if (Number.isInteger(port) && port > 0 && port <= 65535) $('#obsWebSocketPort').value = String(port);
      $('#obsFollowScenes').checked = settings.followScenes !== false;
      obsSceneProfileLinks = settings.sceneProfileLinks && typeof settings.sceneProfileLinks === 'object'
        ? { ...settings.sceneProfileLinks }
        : {};
    } catch (_) {
      obsSceneProfileLinks = {};
    }
  }

  function persistObsAutomationSettings() {
    storage.setItem(obsAutomationStorageKey, JSON.stringify({
      port: Number($('#obsWebSocketPort').value) || 4455,
      followScenes: $('#obsFollowScenes').checked,
      sceneProfileLinks: obsSceneProfileLinks
    }));
  }

  function updateObsAutomationUi(status = '') {
    const statusElement = $('#obsWebSocketStatus');
    statusElement.textContent = status || (obsConnected ? 'CONNECTED' : 'DISCONNECTED');
    statusElement.classList.toggle('connected', obsConnected);
    $('#obsAutomationControls').inert = !obsConnected;
    $('#obsConnectButton').classList.toggle('connected', obsConnected);
    $('#obsConnectButton').textContent = obsConnected ? 'DISCONNECT FROM OBS' : 'CONNECT TO OBS';
  }

  async function sha256Base64(value) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return btoa(String.fromCharCode(...new Uint8Array(digest)));
  }

  async function createObsAuthentication(password, salt, challenge) {
    const secret = await sha256Base64(`${password}${salt}`);
    return sha256Base64(`${secret}${challenge}`);
  }

  function rejectObsPendingRequests(message) {
    for (const pending of obsPendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(message));
    }
    obsPendingRequests.clear();
  }

  function closeObsAutomation({ quiet = false } = {}) {
    const socket = obsSocket;
    obsSocket = null;
    obsConnected = false;
    rejectObsPendingRequests('OBS WebSocket disconnected.');
    if (socket && socket.readyState < WebSocket.CLOSING) {
      try { socket.close(1000, 'Quartic Pulse disconnect'); } catch (_) { /* A connecting socket may already be closing. */ }
    }
    updateObsAutomationUi();
    if (!quiet) showToast('Disconnected from OBS');
  }

  function obsCall(requestType, requestData = {}) {
    if (!obsConnected || !obsSocket || obsSocket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Connect to OBS first.'));
    }
    const requestId = `quartic-${Date.now()}-${++obsRequestCounter}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        obsPendingRequests.delete(requestId);
        reject(new Error(`${requestType} timed out.`));
      }, 6000);
      obsPendingRequests.set(requestId, { resolve, reject, timeout });
      obsSocket.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } }));
    });
  }

  function renderObsProfileOptions() {
    const select = $('#obsProfileSelect');
    if (!select) return;
    const sceneName = $('#obsSceneSelect')?.value || '';
    const linkedId = obsSceneProfileLinks[sceneName] || '';
    select.replaceChildren(new Option('No profile link', ''));
    for (const profile of getProfiles()) {
      select.appendChild(new Option(`${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`, profile.id));
    }
    select.value = getProfiles().some((profile) => profile.id === linkedId) ? linkedId : '';
  }

  function renderObsSceneSources(sceneName, sceneItems = []) {
    obsCurrentSceneSources = sceneItems.map((item) => ({
      sceneName,
      sceneItemId: Number(item.sceneItemId),
      sourceName: String(item.sourceName || 'Unnamed source'),
      enabled: item.sceneItemEnabled !== false
    }));
    const select = $('#obsSourceSelect');
    select.replaceChildren();
    if (!obsCurrentSceneSources.length) select.appendChild(new Option('No sources in this scene', ''));
    else {
      for (const item of obsCurrentSceneSources) {
        select.appendChild(new Option(`${item.enabled ? 'ON' : 'OFF'} · ${item.sourceName}`, String(item.sceneItemId)));
      }
    }
  }

  async function refreshObsSceneSources() {
    const sceneName = $('#obsSceneSelect').value;
    renderObsProfileOptions();
    if (!sceneName) return renderObsSceneSources('', []);
    const data = await obsCall('GetSceneItemList', { sceneName });
    renderObsSceneSources(sceneName, Array.isArray(data.sceneItems) ? data.sceneItems : []);
  }

  async function refreshObsAutomation() {
    const data = await obsCall('GetSceneList');
    const select = $('#obsSceneSelect');
    const previous = select.value;
    const scenes = Array.isArray(data.scenes) ? data.scenes : [];
    select.replaceChildren();
    for (const scene of scenes) select.appendChild(new Option(scene.sceneName, scene.sceneName));
    const preferred = data.currentProgramSceneName || previous;
    if (scenes.some((scene) => scene.sceneName === preferred)) select.value = preferred;
    await refreshObsSceneSources();
    updateObsAutomationUi(`CONNECTED · ${scenes.length} SCENES`);
  }

  function applyObsLinkedProfile(sceneName) {
    if (!$('#obsFollowScenes').checked) return;
    const profile = getProfiles().find((item) => item.id === obsSceneProfileLinks[sceneName]);
    if (!profile) return;
    try {
      applyProfile(profile);
      showToast(`OBS scene ${sceneName} · applied ${profile.name}`);
    } catch (error) {
      showToast(`OBS profile link: ${error.message}`, true);
    }
  }

  async function handleObsEvent(eventType, eventData = {}) {
    if (eventType === 'CurrentProgramSceneChanged') {
      const sceneName = String(eventData.sceneName || '');
      if ([...$('#obsSceneSelect').options].some((option) => option.value === sceneName)) {
        $('#obsSceneSelect').value = sceneName;
        await refreshObsSceneSources().catch(() => {});
      }
      applyObsLinkedProfile(sceneName);
    } else if (['SceneItemEnableStateChanged', 'SceneItemCreated', 'SceneItemRemoved'].includes(eventType)) {
      if (eventData.sceneName === $('#obsSceneSelect').value) refreshObsSceneSources().catch(() => {});
    }
  }

  async function handleObsMessage(message) {
    const payload = JSON.parse(message.data);
    if (payload.op === 0) {
      const identify = { rpcVersion: 1, eventSubscriptions: 141 };
      if (payload.d?.authentication) {
        identify.authentication = await createObsAuthentication(
          $('#obsWebSocketPassword').value,
          payload.d.authentication.salt,
          payload.d.authentication.challenge
        );
      }
      obsSocket?.send(JSON.stringify({ op: 1, d: identify }));
      updateObsAutomationUi('AUTHENTICATING');
      return;
    }
    if (payload.op === 2) {
      obsConnected = true;
      persistObsAutomationSettings();
      updateObsAutomationUi();
      await refreshObsAutomation();
      showToast('Connected to OBS WebSocket');
      return;
    }
    if (payload.op === 5) {
      await handleObsEvent(payload.d?.eventType, payload.d?.eventData);
      return;
    }
    if (payload.op === 7) {
      const requestId = payload.d?.requestId;
      const pending = obsPendingRequests.get(requestId);
      if (!pending) return;
      clearTimeout(pending.timeout);
      obsPendingRequests.delete(requestId);
      if (payload.d?.requestStatus?.result) pending.resolve(payload.d.responseData || {});
      else pending.reject(new Error(payload.d?.requestStatus?.comment || `${payload.d?.requestType || 'OBS request'} failed.`));
    }
  }

  function connectObsAutomation() {
    if (obsSocket || obsConnected) return closeObsAutomation();
    const port = clamp(Math.round(Number($('#obsWebSocketPort').value) || 4455), 1, 65535);
    $('#obsWebSocketPort').value = String(port);
    persistObsAutomationSettings();
    updateObsAutomationUi('CONNECTING');
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    obsSocket = socket;
    socket.addEventListener('message', (event) => {
      handleObsMessage(event).catch((error) => {
        showToast(`OBS WebSocket: ${error.message}`, true);
        closeObsAutomation({ quiet: true });
      });
    });
    socket.addEventListener('error', () => {
      if (obsSocket === socket) updateObsAutomationUi('CONNECTION FAILED');
    });
    socket.addEventListener('close', (event) => {
      if (obsSocket !== socket) return;
      obsSocket = null;
      obsConnected = false;
      rejectObsPendingRequests('OBS WebSocket disconnected.');
      updateObsAutomationUi(event.code === 4009 ? 'AUTHENTICATION FAILED' : 'DISCONNECTED');
      if (event.code !== 1000) showToast('Could not connect to OBS. Check its WebSocket server, port, and password.', true);
    });
  }

  function initializeObsAutomation() {
    loadObsAutomationSettings();
    updateObsAutomationUi();
    renderObsProfileOptions();
    $('#obsConnectButton').addEventListener('click', connectObsAutomation);
    $('#obsWebSocketPort').addEventListener('change', persistObsAutomationSettings);
    $('#obsFollowScenes').addEventListener('change', persistObsAutomationSettings);
    $('#obsSceneSelect').addEventListener('change', () => refreshObsSceneSources().catch((error) => showToast(error.message, true)));
    $('#obsRefreshButton').addEventListener('click', () => refreshObsAutomation().catch((error) => showToast(error.message, true)));
    $('#obsSwitchSceneButton').addEventListener('click', () => {
      const sceneName = $('#obsSceneSelect').value;
      if (sceneName) obsCall('SetCurrentProgramScene', { sceneName }).catch((error) => showToast(error.message, true));
    });
    $('#obsToggleSourceButton').addEventListener('click', async () => {
      const sceneName = $('#obsSceneSelect').value;
      const sceneItemId = Number($('#obsSourceSelect').value);
      const item = obsCurrentSceneSources.find((source) => source.sceneItemId === sceneItemId);
      if (!sceneName || !item) return;
      try {
        await obsCall('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: !item.enabled });
        await refreshObsSceneSources();
      } catch (error) { showToast(error.message, true); }
    });
    $('#obsAddSourceButton').addEventListener('click', async () => {
      const sceneName = $('#obsSceneSelect').value;
      if (!sceneName) return;
      try {
        await obsCall('CreateInput', {
          sceneName,
          inputName: 'Quartic Pulse Output',
          inputKind: 'window_capture',
          inputSettings: {},
          sceneItemEnabled: true
        });
        await refreshObsSceneSources();
        showToast('OBS source added · select Quartic Pulse — OBS Output in its Window setting');
      } catch (error) { showToast(`Add OBS source: ${error.message}`, true); }
    });
    $('#obsLinkProfileButton').addEventListener('click', () => {
      const sceneName = $('#obsSceneSelect').value;
      const profileId = $('#obsProfileSelect').value;
      if (!sceneName) return;
      if (profileId) obsSceneProfileLinks[sceneName] = profileId;
      else delete obsSceneProfileLinks[sceneName];
      persistObsAutomationSettings();
      const profile = getProfiles().find((item) => item.id === profileId);
      showToast(profile ? `${profile.name} linked to ${sceneName}` : `Profile link removed from ${sceneName}`);
    });
  }

    return Object.freeze({
      close: closeObsAutomation,
      initialize: initializeObsAutomation,
      refresh: refreshObsAutomation,
      renderProfileOptions: renderObsProfileOptions,
      get diagnostics() {
        return Object.freeze({ connected: obsConnected, pendingRequests: obsPendingRequests.size });
      }
    });
  }

  window.QuarticObsAutomationController = Object.freeze({ create });
})();
