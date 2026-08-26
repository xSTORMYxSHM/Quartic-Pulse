(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const $ = options.query || ((selector) => document.querySelector(selector));
    const storage = options.storage || window.localStorage;
    const desktop = options.desktop || window.quarticDesktop;
    const showToast = options.showToast || (() => {});
    const liveControlActions = options.actions || {};

  const liveControlStorageKey = 'quarticPulseLiveControlsV1';
  let liveControlBindings = [];
  let midiAccess = null;
  let midiLearning = false;
  let keyboardCapturing = false;
  let oscRunning = false;

  function executeLiveControlAction(actionId, value = 1) {
    const action = liveControlActions[actionId];
    if (!action) return;
    if (action.mode === 'continuous') {
      const control = $(`#${action.controlId}`);
      if (!control) return;
      const normalized = clamp(Number(value) || 0, 0, 1);
      control.value = String(Number(control.min) + normalized * (Number(control.max) - Number(control.min)));
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control._syncNumericValue?.();
    } else if (value === undefined || Number(value) > 0) action.run();
  }

  function validLiveControlBinding(binding) {
    return Boolean(binding
      && ['midi', 'keyboard', 'osc'].includes(binding.type)
      && liveControlActions[binding.action]
      && typeof binding.trigger === 'string'
      && binding.trigger.length);
  }

  function loadLiveControlSettings() {
    try {
      const settings = JSON.parse(storage.getItem(liveControlStorageKey) || '{}');
      liveControlBindings = Array.isArray(settings.bindings) ? settings.bindings.filter(validLiveControlBinding).slice(0, 40) : [];
      const port = Number(settings.oscPort);
      if (Number.isInteger(port) && port > 0 && port <= 65535) $('#oscPort').value = String(port);
      $('#oscAllowLan').checked = Boolean(settings.oscAllowLan);
    } catch (_) {
      liveControlBindings = [];
    }
  }

  function persistLiveControlSettings() {
    storage.setItem(liveControlStorageKey, JSON.stringify({
      bindings: liveControlBindings,
      oscPort: Number($('#oscPort').value) || 9000,
      oscAllowLan: $('#oscAllowLan').checked
    }));
  }

  function describeLiveControlBinding(binding) {
    if (binding.type === 'midi') {
      const source = binding.deviceName || 'Any MIDI input';
      return `${source} · CH ${binding.channel + 1} · ${binding.messageKind.toUpperCase()} ${binding.number}`;
    }
    return binding.trigger;
  }

  function renderLiveControlBindings() {
    const list = $('#liveBindingList');
    list.replaceChildren();
    for (const binding of liveControlBindings) {
      const row = document.createElement('div');
      row.className = 'live-binding-row';
      row.dataset.bindingId = binding.id;
      row.innerHTML = `<span>${binding.type.toUpperCase()}</span><div><strong>${liveControlActions[binding.action].label}</strong><small></small></div><button type="button" aria-label="Remove mapping">×</button>`;
      row.querySelector('small').textContent = describeLiveControlBinding(binding);
      list.appendChild(row);
    }
    $('#liveBindingEmpty').hidden = liveControlBindings.length > 0;
    $('#liveBindingCount').textContent = `${liveControlBindings.length} ${liveControlBindings.length === 1 ? 'ROUTE' : 'ROUTES'}`;
    $('#clearLiveBindingsButton').disabled = liveControlBindings.length === 0;
  }

  function addLiveControlBinding(binding) {
    const duplicateIndex = liveControlBindings.findIndex((item) => item.type === binding.type && item.trigger === binding.trigger);
    const complete = { ...binding, id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}` };
    if (duplicateIndex >= 0) liveControlBindings.splice(duplicateIndex, 1, complete);
    else liveControlBindings.push(complete);
    liveControlBindings = liveControlBindings.slice(-40);
    persistLiveControlSettings();
    renderLiveControlBindings();
    showToast(`${liveControlActions[complete.action].label} mapped`);
  }

  function fillLiveControlActionSelect(select) {
    select.replaceChildren();
    for (const [id, action] of Object.entries(liveControlActions)) select.appendChild(new Option(action.label, id));
  }

  function renderMidiInputs() {
    const select = $('#midiInputSelect');
    const previous = select.value;
    select.replaceChildren(new Option('All MIDI inputs', ''));
    if (midiAccess) {
      for (const input of midiAccess.inputs.values()) select.appendChild(new Option(input.name || input.manufacturer || 'MIDI input', input.id));
    }
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    $('#midiStatus').textContent = midiAccess ? `${midiAccess.inputs.size} INPUT${midiAccess.inputs.size === 1 ? '' : 'S'}` : 'NOT CONNECTED';
  }

  function handleMidiMessage(input, event) {
    const status = event.data[0];
    const messageKind = (status & 0xf0) === 0x90 ? 'note' : ((status & 0xf0) === 0xb0 ? 'cc' : '');
    if (!messageKind) return;
    const channel = status & 0x0f;
    const number = Number(event.data[1]);
    const rawValue = Number(event.data[2]);
    if (messageKind === 'note' && rawValue === 0) return;
    const normalizedValue = clamp(rawValue / 127, 0, 1);
    const selectedDeviceId = $('#midiInputSelect').value;
    if (midiLearning && (!selectedDeviceId || selectedDeviceId === input.id)) {
      addLiveControlBinding({
        type: 'midi',
        trigger: `${selectedDeviceId || '*'}:${channel}:${messageKind}:${number}`,
        deviceId: selectedDeviceId,
        deviceName: selectedDeviceId ? (input.name || 'MIDI input') : '',
        channel,
        messageKind,
        number,
        action: $('#midiActionSelect').value
      });
      midiLearning = false;
      $('#midiLearnButton').classList.remove('learning');
      $('#midiLearnButton').textContent = 'LEARN NEXT CONTROL';
      return;
    }
    for (const binding of liveControlBindings) {
      if (binding.type !== 'midi'
        || (binding.deviceId && binding.deviceId !== input.id)
        || binding.channel !== channel
        || binding.messageKind !== messageKind
        || binding.number !== number) continue;
      executeLiveControlAction(binding.action, normalizedValue);
    }
  }

  function attachMidiInputs() {
    if (!midiAccess) return;
    for (const input of midiAccess.inputs.values()) input.onmidimessage = (event) => handleMidiMessage(input, event);
  }

  async function enableMidi() {
    if (!navigator.requestMIDIAccess) throw new Error('Web MIDI is not available on this system.');
    midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    midiAccess.onstatechange = () => {
      renderMidiInputs();
      attachMidiInputs();
    };
    renderMidiInputs();
    attachMidiInputs();
    $('#midiConnectButton').textContent = 'REFRESH MIDI';
    showToast(`MIDI ready · ${midiAccess.inputs.size} input${midiAccess.inputs.size === 1 ? '' : 's'}`);
  }

  function handleLiveControlKey(event) {
    if (keyboardCapturing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      addLiveControlBinding({ type: 'keyboard', trigger: event.code, action: $('#keyboardActionSelect').value });
      keyboardCapturing = false;
      $('#keyboardCaptureButton').classList.remove('learning');
      $('#keyboardCaptureButton').textContent = 'CAPTURE NEXT KEY';
      return;
    }
    if (event.repeat || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) return;
    const binding = liveControlBindings.find((item) => item.type === 'keyboard' && item.trigger === event.code);
    if (!binding) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    executeLiveControlAction(binding.action, 1);
  }

  async function toggleOscServer() {
    if (oscRunning) {
      await desktop.stopOsc();
      oscRunning = false;
      $('#oscStatus').textContent = 'STOPPED';
      $('#oscServerButton').textContent = 'START OSC';
      return;
    }
    persistLiveControlSettings();
    const result = await desktop.startOsc({
      port: Number($('#oscPort').value) || 9000,
      allowLan: $('#oscAllowLan').checked
    });
    oscRunning = true;
    $('#oscStatus').textContent = `${result.host}:${result.port}`;
    $('#oscServerButton').textContent = 'STOP OSC';
    showToast(`OSC listening on ${result.host}:${result.port}`);
  }

  function initializeLiveControls() {
    fillLiveControlActionSelect($('#midiActionSelect'));
    fillLiveControlActionSelect($('#keyboardActionSelect'));
    fillLiveControlActionSelect($('#oscActionSelect'));
    loadLiveControlSettings();
    renderLiveControlBindings();
    renderMidiInputs();
    $('#midiConnectButton').addEventListener('click', () => enableMidi().catch((error) => showToast(`MIDI: ${error.message}`, true)));
    $('#midiLearnButton').addEventListener('click', () => {
      if (!midiAccess) return showToast('Enable MIDI first.', true);
      midiLearning = !midiLearning;
      $('#midiLearnButton').classList.toggle('learning', midiLearning);
      $('#midiLearnButton').textContent = midiLearning ? 'MOVE A CONTROL…' : 'LEARN NEXT CONTROL';
    });
    $('#keyboardCaptureButton').addEventListener('click', () => {
      keyboardCapturing = !keyboardCapturing;
      $('#keyboardCaptureButton').classList.toggle('learning', keyboardCapturing);
      $('#keyboardCaptureButton').textContent = keyboardCapturing ? 'PRESS A KEY…' : 'CAPTURE NEXT KEY';
    });
    window.addEventListener('keydown', handleLiveControlKey, true);
    $('#oscServerButton').addEventListener('click', () => toggleOscServer().catch((error) => showToast(`OSC: ${error.message}`, true)));
    $('#oscAddBindingButton').addEventListener('click', () => {
      const address = $('#oscAddress').value.trim();
      if (!/^\/[\x21-\x7e]+$/.test(address) || /[\s#,?*\[\]{}]/.test(address)) return showToast('Enter a plain OSC address such as /quartic/next.', true);
      addLiveControlBinding({ type: 'osc', trigger: address, action: $('#oscActionSelect').value });
    });
    $('#liveBindingList').addEventListener('click', (event) => {
      const row = event.target.closest('.live-binding-row');
      if (!row || !event.target.closest('button')) return;
      liveControlBindings = liveControlBindings.filter((binding) => binding.id !== row.dataset.bindingId);
      persistLiveControlSettings();
      renderLiveControlBindings();
    });
    $('#clearLiveBindingsButton').addEventListener('click', () => {
      liveControlBindings = [];
      persistLiveControlSettings();
      renderLiveControlBindings();
      showToast('Live-control mappings cleared');
    });
    desktop.onOscMessage((message) => {
      $('#oscLastMessage').textContent = `${message.address} · ${message.args?.map(String).join(', ') || 'trigger'} · ${message.remote}`;
      const firstValue = typeof message.args?.[0] === 'number' ? message.args[0] : 1;
      for (const binding of liveControlBindings) {
        if (binding.type === 'osc' && binding.trigger === message.address) executeLiveControlAction(binding.action, firstValue);
      }
    });
    desktop.onOscError((message) => {
      oscRunning = false;
      $('#oscStatus').textContent = 'ERROR';
      $('#oscServerButton').textContent = 'START OSC';
      showToast(`OSC: ${message}`, true);
    });
  }

  function close() {
    window.removeEventListener('keydown', handleLiveControlKey, true);
    if (!oscRunning) return;
    oscRunning = false;
    Promise.resolve(desktop.stopOsc()).catch(() => {});
  }

    return Object.freeze({
      execute: executeLiveControlAction,
      initialize: initializeLiveControls,
      close,
      get diagnostics() {
        return Object.freeze({ bindings: liveControlBindings.length, midiReady: Boolean(midiAccess), oscRunning });
      }
    });
  }

  window.QuarticLiveControlController = Object.freeze({ create });
})();
