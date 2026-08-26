(() => {
  'use strict';

  function create(options = {}) {
    const {
      query: $,
      documentRef = document,
      navigatorRef = navigator,
      state,
      audio,
      audioController,
      audioAnalysisEngine,
      desktop,
      storage = localStorage,
      resetPulseEvents = () => {},
      currentPlaylistItem = () => null,
      updateTrackControls = () => {},
      setPlayState = () => {},
      showToast = () => {},
      AudioContextCtor = window.AudioContext,
      AudioWorkletNodeCtor = window.AudioWorkletNode
    } = options;
    if (!$ || !state || !audio || !audioController || !audioAnalysisEngine || !desktop) {
      throw new Error('Audio source controller requires UI, state, audio, analysis, and desktop dependencies.');
    }

    const deckOutputStorageKey = 'quarticPulseDeckOutputDevice';
    let deckOutputDeviceId = storage.getItem(deckOutputStorageKey) || '';
    let audioContext;
    let analyser;
    let beatAnalyser;
    let beatAnalysisSink;
    let audioSource;
    let liveAudioSource;
    let liveAudioStream;
    let nativeOutputNode;
    let nativeOutputNodePromise;
    let nativeOutputActive = false;
    let nativePcmRemainder = new Uint8Array(0);
    let windowsOutputScanGeneration = 0;
    let monitorGain;
    let recordingDestination;
    let initialized = false;

    function createGraph() {
      if (audioContext) return audioContext;
      audioContext = new AudioContextCtor({ latencyHint: 'interactive', sampleRate: 48000 });
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -20;
      analyser.smoothingTimeConstant = 0;
      beatAnalyser = audioContext.createAnalyser();
      beatAnalyser.fftSize = 2048;
      beatAnalyser.minDecibels = -90;
      beatAnalyser.maxDecibels = -20;
      beatAnalyser.smoothingTimeConstant = 0;
      beatAnalysisSink = audioContext.createGain();
      beatAnalysisSink.gain.value = 0;
      beatAnalyser.connect(beatAnalysisSink);
      beatAnalysisSink.connect(audioContext.destination);
      recordingDestination = audioContext.createMediaStreamDestination();
      monitorGain = audioContext.createGain();
      audioSource = audioContext.createMediaElementSource(audio);
      audioSource.connect(analyser);
      audioSource.connect(beatAnalyser);
      audioSource.connect(monitorGain);
      monitorGain.connect(audioContext.destination);
      analyser.connect(recordingDestination);
      updateMonitorGain();
      audioAnalysisEngine.attach(audioContext, analyser, beatAnalyser);
      if (deckOutputDeviceId && typeof audioContext.setSinkId === 'function') {
        audioContext.setSinkId(deckOutputDeviceId)
          .then(() => $('#exportCompleteStinger')?.setSinkId?.(deckOutputDeviceId))
          .catch(() => {});
      }
      return audioContext;
    }

    function isActive() {
      if (state.audioMode === 'live') return Boolean(liveAudioStream?.getAudioTracks().some((track) => track.readyState === 'live'));
      if (state.audioMode === 'native-output') return nativeOutputActive;
      return !audio.paused;
    }

    async function ensureNativeOutputNode() {
      createGraph();
      if (!nativeOutputNodePromise) {
        nativeOutputNodePromise = audioContext.audioWorklet.addModule('pcm-input-worklet.js').then(() => {
          nativeOutputNode = new AudioWorkletNodeCtor(audioContext, 'quartic-pcm-input', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1]
          });
          return nativeOutputNode;
        });
      }
      return nativeOutputNodePromise;
    }

    function updateMonitorGain() {
      if (!monitorGain || !audioContext) return;
      const target = state.monitorMuted ? 0 : state.monitorVolume;
      monitorGain.gain.setTargetAtTime(target, audioContext.currentTime, .015);
    }

    function setSourceStatus(label, live = false) {
      $('#audioSourceStatus').textContent = label;
      documentRef.body.classList.toggle('live-input', live);
      $('#useAudioSourceButton').textContent = live ? 'STOP LIVE SOURCE' : 'USE SOURCE';
    }

    function restoreDeckHud() {
      const item = currentPlaylistItem();
      if (item) {
        $('#trackName').textContent = item.name;
        $('#trackMeta').textContent = item.meta;
      } else {
        $('#trackName').textContent = 'No audio loaded';
        $('#trackMeta').textContent = 'Drop songs anywhere, choose files, or choose a local folder';
      }
      audioController.renderTimeline(audio.currentTime, audio.duration);
    }

    function stopLive({ restoreDeck = true } = {}) {
      liveAudioSource?.disconnect();
      liveAudioStream?.getTracks().forEach((track) => track.stop());
      if (nativeOutputActive) desktop.stopOutputDevice().catch(() => {});
      nativeOutputNode?.port.postMessage({ reset: true });
      nativeOutputNode?.disconnect();
      nativeOutputActive = false;
      nativePcmRemainder = new Uint8Array(0);
      liveAudioSource = null;
      liveAudioStream = null;
      state.audioMode = 'deck';
      state.liveAudioLabel = '';
      if (audioSource && analyser && monitorGain) {
        audioSource.disconnect();
        audioSource.connect(analyser);
        audioSource.connect(beatAnalyser);
        audioSource.connect(monitorGain);
      }
      if (restoreDeck) {
        $('#audioSourceSelect').value = 'deck';
        setSourceStatus('DECK', false);
        restoreDeckHud();
        resetPulseEvents();
        updateTrackControls();
        setPlayState();
      }
    }

    async function activateLive(stream, label) {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Windows did not provide an audio track for that source.');
      }
      createGraph();
      await audioContext.resume();
      stopLive({ restoreDeck: false });
      audio.pause();
      audioSource.disconnect();
      liveAudioStream = stream;
      liveAudioSource = audioContext.createMediaStreamSource(stream);
      liveAudioSource.connect(analyser);
      liveAudioSource.connect(beatAnalyser);
      state.audioMode = 'live';
      state.liveAudioLabel = audioTrack.label || label;
      resetPulseEvents();
      $('#trackName').textContent = state.liveAudioLabel;
      $('#trackMeta').textContent = 'LIVE WINDOWS AUDIO · visualization only';
      audioController.renderLiveTimeline();
      setSourceStatus('LISTENING', true);
      updateTrackControls();
      setPlayState();
      audioTrack.addEventListener('ended', () => {
        if (liveAudioStream !== stream) return;
        stopLive();
        showToast('Windows audio source stopped');
      }, { once: true });
    }

    async function activateWindowsOutput(deviceId, label) {
      createGraph();
      await audioContext.resume();
      stopLive({ restoreDeck: false });
      audio.pause();
      audioSource.disconnect();
      const node = await ensureNativeOutputNode();
      nativePcmRemainder = new Uint8Array(0);
      node.connect(analyser);
      node.connect(beatAnalyser);
      await desktop.startOutputDevice(deviceId);
      nativeOutputActive = true;
      state.audioMode = 'native-output';
      state.liveAudioLabel = label;
      resetPulseEvents();
      $('#trackName').textContent = label;
      $('#trackMeta').textContent = 'WASAPI OUTPUT LOOPBACK · visualization only';
      audioController.renderLiveTimeline();
      setSourceStatus('WASAPI LIVE', true);
      updateTrackControls();
      setPlayState();
    }

    async function useSelectedSource() {
      if (state.exporting) return showToast('Finish the current export before changing audio sources.', true);
      if (state.audioMode !== 'deck') {
        stopLive();
        showToast('Returned to Music Deck');
        return;
      }
      const select = $('#audioSourceSelect');
      if (select.value === 'deck') {
        stopLive();
        showToast('Music Deck selected');
        return;
      }
      try {
        let stream;
        if (select.value.startsWith('output:')) {
          const deviceId = select.value.slice(7);
          const label = select.selectedOptions[0]?.textContent || 'Windows output device';
          await activateWindowsOutput(deviceId, label);
          showToast(`${label} is driving the visualizer through WASAPI`);
          return;
        }
        if (select.value === 'system') {
          stream = await navigatorRef.mediaDevices.getDisplayMedia({ video: true, audio: true });
          stream.getVideoTracks().forEach((track) => track.stop());
        } else if (select.value.startsWith('input:')) {
          const deviceId = select.value.slice(6);
          stream = await navigatorRef.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
            video: false
          });
        } else return;
        await activateLive(stream, select.selectedOptions[0]?.textContent || 'Windows audio source');
        refreshInputs({ requestPermission: false, silent: true }).catch(() => {});
        showToast(`${state.liveAudioLabel} is driving the visualizer`);
      } catch (error) {
        stopLive();
        showToast(error.name === 'NotAllowedError'
          ? 'Audio capture was cancelled or blocked by Windows privacy settings.'
          : error.message, true);
      }
    }

    async function refreshInputs({ requestPermission = true, silent = false } = {}) {
      if (!navigatorRef.mediaDevices?.enumerateDevices) {
        showToast('Audio device discovery is unavailable.', true);
        return 0;
      }
      try {
        if (requestPermission) {
          const permissionStream = await navigatorRef.mediaDevices.getUserMedia({ audio: true, video: false });
          permissionStream.getTracks().forEach((track) => track.stop());
        }
        const devices = (await navigatorRef.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'audioinput');
        const select = $('#audioSourceSelect');
        const inputGroup = $('#audioInputOptions');
        const previousValue = select.value;
        inputGroup.replaceChildren();
        devices.forEach((device, index) => {
          const option = documentRef.createElement('option');
          option.value = `input:${device.deviceId}`;
          option.dataset.inputDevice = 'true';
          option.textContent = device.label || `Windows input / virtual device ${index + 1}`;
          inputGroup.appendChild(option);
        });
        if ([...select.options].some((option) => option.value === previousValue)) select.value = previousValue;
        if (!silent) showToast(`${devices.length} Windows input or virtual ${devices.length === 1 ? 'device' : 'devices'} found`);
        return devices.length;
      } catch (error) {
        if (!silent) showToast(error.name === 'NotAllowedError'
          ? 'Input access was blocked. Enable it in Windows Privacy & security > Microphone.'
          : error.message, true);
        return 0;
      }
    }

    async function refreshWindowsOutputs({ silent = false } = {}) {
      const scanGeneration = ++windowsOutputScanGeneration;
      const select = $('#audioSourceSelect');
      const outputGroup = $('#audioOutputOptions');
      let lastError = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (attempt) await new Promise((resolve) => setTimeout(resolve, [0, 350, 900, 1800][attempt]));
        try {
          const devices = await desktop.listOutputDevices();
          if (scanGeneration !== windowsOutputScanGeneration) return outputGroup.children.length;
          if (!devices.length) {
            lastError = new Error('Windows returned no playback endpoints.');
            continue;
          }
          const previousValue = select.value;
          const elements = devices.map((device) => {
            const option = documentRef.createElement('option');
            option.value = `output:${device.id}`;
            option.dataset.outputDevice = 'true';
            option.textContent = `${device.name}${device.isDefault ? ' · DEFAULT' : ''}`;
            return option;
          });
          outputGroup.replaceChildren(...elements);
          if ([...select.options].some((option) => option.value === previousValue)) select.value = previousValue;
          if (!silent) showToast(`${devices.length} Windows playback ${devices.length === 1 ? 'endpoint' : 'endpoints'} found`);
          return devices.length;
        } catch (error) {
          lastError = error;
        }
      }
      const preservedCount = outputGroup.children.length;
      if (!silent) showToast(preservedCount
        ? `Output scan was interrupted; keeping ${preservedCount} previously detected playback endpoints.`
        : `Windows output scan failed: ${lastError?.message || 'No playback endpoints were returned.'}`, true);
      return preservedCount;
    }

    async function applyDeckOutput(deviceId, { quiet = false } = {}) {
      createGraph();
      const requestedId = String(deviceId || '');
      if (typeof audioContext?.setSinkId !== 'function') {
        if (requestedId) throw new Error('Direct playback-output routing is not supported by this Windows audio runtime.');
        return false;
      }
      await audioContext.setSinkId(requestedId);
      const stinger = $('#exportCompleteStinger');
      if (typeof stinger?.setSinkId === 'function') await stinger.setSinkId(requestedId).catch(() => {});
      deckOutputDeviceId = requestedId;
      if (requestedId) storage.setItem(deckOutputStorageKey, requestedId);
      else storage.removeItem(deckOutputStorageKey);
      const select = $('#deckOutputSelect');
      if (select && [...select.options].some((option) => option.value === requestedId)) select.value = requestedId;
      const label = select?.selectedOptions?.[0]?.textContent || (requestedId ? 'Direct output' : 'Windows default');
      $('#deckOutputStatus').textContent = requestedId ? 'DIRECT' : 'WINDOWS DEFAULT';
      if (!quiet) showToast(`Music Deck playback routed to ${label}`);
      return true;
    }

    async function refreshDeckOutputs({ silent = false } = {}) {
      if (!navigatorRef.mediaDevices?.enumerateDevices) return 0;
      try {
        const devices = (await navigatorRef.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'audiooutput');
        const select = $('#deckOutputSelect');
        const group = $('#deckOutputOptions');
        const elements = devices.filter((device) => device.deviceId && device.deviceId !== 'default').map((device, index) => {
          const option = documentRef.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.label || `Windows playback device ${index + 1}`;
          return option;
        });
        group.replaceChildren(...elements);
        if ([...select.options].some((option) => option.value === deckOutputDeviceId)) {
          select.value = deckOutputDeviceId;
          $('#deckOutputStatus').textContent = deckOutputDeviceId ? 'DIRECT' : 'WINDOWS DEFAULT';
        } else if (deckOutputDeviceId) {
          select.value = '';
          $('#deckOutputStatus').textContent = 'SAVED OUTPUT';
        }
        if (!silent) showToast(`${devices.length} direct playback ${devices.length === 1 ? 'device' : 'devices'} found`);
        return devices.length;
      } catch (error) {
        if (!silent) showToast(`Playback output scan failed: ${error.message}`, true);
        return 0;
      }
    }

    async function refreshAllDevices() {
      const inputs = await refreshInputs({ requestPermission: true, silent: true });
      const [outputs, deckOutputs] = await Promise.all([
        refreshWindowsOutputs({ silent: true }),
        refreshDeckOutputs({ silent: true })
      ]);
      showToast(`${outputs} capture endpoints, ${inputs} inputs, and ${deckOutputs} direct playback devices found`);
    }

    function handleOutputAudio(bytes) {
      if (!nativeOutputActive || !nativeOutputNode) return;
      const incoming = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes?.data || bytes || 0);
      const combined = new Uint8Array(nativePcmRemainder.length + incoming.length);
      combined.set(nativePcmRemainder, 0);
      combined.set(incoming, nativePcmRemainder.length);
      const completeLength = combined.length - (combined.length % 4);
      nativePcmRemainder = combined.slice(completeLength);
      if (!completeLength) return;
      const sampleBuffer = combined.buffer.slice(combined.byteOffset, combined.byteOffset + completeLength);
      nativeOutputNode.port.postMessage(new Float32Array(sampleBuffer), [sampleBuffer]);
    }

    function initialize() {
      if (initialized) return;
      initialized = true;
      desktop.onOutputAudio(handleOutputAudio);
      desktop.onOutputError((message) => {
        if (!nativeOutputActive) return;
        stopLive();
        showToast(`Windows output capture stopped: ${message}`, true);
      });
      desktop.onOutputStopped(() => {
        if (!nativeOutputActive) return;
        stopLive();
        showToast('The selected Windows output device stopped or was disconnected.', true);
      });
      navigatorRef.mediaDevices?.addEventListener?.('devicechange', () => {
        refreshInputs({ requestPermission: false, silent: true }).catch(() => {});
        refreshWindowsOutputs({ silent: true }).catch(() => {});
        refreshDeckOutputs({ silent: true }).catch(() => {});
      });
    }

    function isSupportedFile(file) {
      return Boolean(file && (file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg|opus)$/i.test(file.name)));
    }

    return Object.freeze({
      initialize,
      createGraph,
      isActive,
      ensureNativeOutputNode,
      updateMonitorGain,
      setSourceStatus,
      restoreDeckHud,
      stopLive,
      activateLive,
      activateWindowsOutput,
      useSelectedSource,
      refreshInputs,
      refreshWindowsOutputs,
      applyDeckOutput,
      refreshDeckOutputs,
      refreshAllDevices,
      isSupportedFile,
      get context() { return audioContext; },
      get analyser() { return analyser; },
      get recordingDestination() { return recordingDestination; },
      get deckOutputDeviceId() { return deckOutputDeviceId; },
      get diagnostics() {
        return Object.freeze({ initialized, graphReady: Boolean(audioContext), mode: state.audioMode, nativeOutputActive });
      }
    });
  }

  window.QuarticAudioSourceController = Object.freeze({ create });
})();
