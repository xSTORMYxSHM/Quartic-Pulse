(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const $ = options.query || ((selector) => document.querySelector(selector));
    const canvas = options.canvas;
    const state = options.state;
    const storage = options.storage || window.localStorage;
    const showToast = options.showToast || (() => {});
    const combineModulation = options.combineModulation || ((base) => ({ ...base }));
    const updateZoomControls = options.updateZoomControls || (() => {});
    if (!canvas || !state) throw new Error('Camera controls require a canvas and application state.');

    const cameraStorageKey = 'quarticPulseCameraBookmarksV1';
    let cameraBookmarks = [];
    let initialized = false;

  function persistCameraBookmarks() {
    storage.setItem(cameraStorageKey, JSON.stringify(cameraBookmarks));
  }

  function loadCameraBookmarks() {
    try {
      const stored = JSON.parse(storage.getItem(cameraStorageKey) || '[]');
      cameraBookmarks = Array.isArray(stored) ? stored.filter((bookmark) => bookmark
        && typeof bookmark.name === 'string'
        && Number.isFinite(Number(bookmark.x))
        && Number.isFinite(Number(bookmark.y))
        && Number.isFinite(Number(bookmark.zoom))).slice(0, 40) : [];
    } catch (_) { cameraBookmarks = []; }
  }

  function renderCameraBookmarks() {
    const list = $('#cameraBookmarkList');
    const previousFrom = $('#cameraPathFrom').value;
    const previousTo = $('#cameraPathTo').value;
    list.replaceChildren();
    for (const bookmark of cameraBookmarks) {
      const row = document.createElement('div');
      row.className = 'camera-bookmark-row';
      row.dataset.bookmarkId = bookmark.id;
      row.innerHTML = '<div><strong></strong><small></small></div><button type="button" data-camera-action="go">GO</button><button type="button" data-camera-action="delete" aria-label="Delete bookmark">×</button>';
      row.querySelector('strong').textContent = bookmark.name;
      row.querySelector('small').textContent = `${Number(bookmark.x).toFixed(4)}, ${Number(bookmark.y).toFixed(4)} · ${Number(bookmark.zoom).toFixed(2)}×`;
      list.appendChild(row);
    }
    for (const select of [$('#cameraPathFrom'), $('#cameraPathTo')]) {
      select.replaceChildren();
      if (!cameraBookmarks.length) select.appendChild(new Option('No bookmarks', ''));
      else for (const bookmark of cameraBookmarks) select.appendChild(new Option(bookmark.name, bookmark.id));
    }
    if (cameraBookmarks.some((bookmark) => bookmark.id === previousFrom)) $('#cameraPathFrom').value = previousFrom;
    if (cameraBookmarks.some((bookmark) => bookmark.id === previousTo)) $('#cameraPathTo').value = previousTo;
    else if (cameraBookmarks.length > 1) $('#cameraPathTo').value = cameraBookmarks[1].id;
    $('#cameraBookmarkEmpty').hidden = cameraBookmarks.length > 0;
    $('#playCameraPathButton').disabled = cameraBookmarks.length < 2;
  }

  function cameraEasing(value, easing) {
    const t = clamp(value, 0, 1);
    if (easing === 'linear') return t;
    if (easing === 'cinematic') return t * t * t * (t * (t * 6 - 15) + 10);
    return t * t * (3 - 2 * t);
  }

  function updateCameraPath(now) {
    const path = state.cameraPath;
    if (!path) return;
    const rawProgress = (now / 1000 - path.startedAt) / path.duration;
    const progress = cameraEasing(rawProgress, path.easing);
    const start = path.reverse ? path.to : path.from;
    const end = path.reverse ? path.from : path.to;
    state.center.x = start.x + (end.x - start.x) * progress;
    state.center.y = start.y + (end.y - start.y) * progress;
    state.zoom = Math.exp(Math.log(Math.max(.0001, start.zoom)) + (Math.log(Math.max(.0001, end.zoom)) - Math.log(Math.max(.0001, start.zoom))) * progress);
    updateZoomControls();
    if (rawProgress >= 1) {
      if (path.loop) {
        path.reverse = !path.reverse;
        path.startedAt = now / 1000;
      } else {
        state.cameraPath = null;
        $('#cameraStatus').textContent = 'IDLE';
      }
    }
  }

  function cameraPresetTransform() {
    const energy = .35 + state.rms * .65;
    if (state.cameraMotionPreset === 'orbit') {
      return { x: Math.cos(state.visualTime * .13) * .028 * energy / Math.sqrt(state.zoom), y: Math.sin(state.visualTime * .17) * .022 * energy / Math.sqrt(state.zoom), zoom: 1 };
    }
    if (state.cameraMotionPreset === 'drift') {
      return { x: Math.sin(state.visualTime * .047) * .06 / Math.sqrt(state.zoom), y: Math.sin(state.visualTime * .031 + 1.7) * .045 / Math.sqrt(state.zoom), zoom: 1 };
    }
    if (state.cameraMotionPreset === 'zoom') {
      return { x: 0, y: 0, zoom: 1 + (Math.sin(state.visualTime * .24) * .5 + .5) * .35 * energy };
    }
    return { x: 0, y: 0, zoom: 1 };
  }

  function updateCameraUi() {
    if (!$('#cameraXValue')) return;
    $('#cameraXValue').textContent = state.center.x.toFixed(4);
    $('#cameraYValue').textContent = state.center.y.toFixed(4);
    $('#cameraZoomValue').textContent = `${state.zoom < 10 ? state.zoom.toFixed(2) : state.zoom.toFixed(0)}×`;
  }

  function initializeCameraTools() {
    loadCameraBookmarks();
    renderCameraBookmarks();
    $('#saveCameraBookmarkButton').addEventListener('click', () => {
      const name = $('#cameraBookmarkName').value.trim().slice(0, 48) || `View ${cameraBookmarks.length + 1}`;
      cameraBookmarks.push({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name, x: state.center.x, y: state.center.y, zoom: state.zoom });
      cameraBookmarks = cameraBookmarks.slice(-40);
      $('#cameraBookmarkName').value = '';
      persistCameraBookmarks();
      renderCameraBookmarks();
      showToast(`${name} camera view saved`);
    });
    $('#cameraBookmarkList').addEventListener('click', (event) => {
      const row = event.target.closest('.camera-bookmark-row');
      const action = event.target.closest('[data-camera-action]')?.dataset.cameraAction;
      const bookmark = cameraBookmarks.find((item) => item.id === row?.dataset.bookmarkId);
      if (!bookmark || !action) return;
      if (action === 'delete') {
        cameraBookmarks = cameraBookmarks.filter((item) => item.id !== bookmark.id);
        persistCameraBookmarks();
        renderCameraBookmarks();
      } else {
        state.cameraPath = null;
        state.center.x = bookmark.x;
        state.center.y = bookmark.y;
        state.zoom = bookmark.zoom;
        updateZoomControls();
        showToast(`${bookmark.name} camera view restored`);
      }
    });
    $('#playCameraPathButton').addEventListener('click', () => {
      const from = cameraBookmarks.find((bookmark) => bookmark.id === $('#cameraPathFrom').value);
      const to = cameraBookmarks.find((bookmark) => bookmark.id === $('#cameraPathTo').value);
      if (!from || !to || from.id === to.id) return showToast('Choose two different camera bookmarks.', true);
      state.cameraMotionPreset = 'off';
      state.cameraPath = {
        from: { ...from }, to: { ...to },
        duration: clamp(Number($('#cameraPathDuration').value) || 12, 1, 300),
        easing: $('#cameraPathEasing').value,
        loop: $('#cameraPathLoop').checked,
        reverse: false,
        startedAt: performance.now() / 1000
      };
      $('#cameraStatus').textContent = 'PATH PLAYING';
    });
    $('#stopCameraPathButton').addEventListener('click', () => {
      state.cameraPath = null;
      state.cameraMotionPreset = 'off';
      $('#cameraStatus').textContent = 'IDLE';
    });
    document.querySelector('.camera-presets').addEventListener('click', (event) => {
      const preset = event.target.closest('[data-camera-preset]')?.dataset.cameraPreset;
      if (!preset) return;
      state.cameraPath = null;
      state.cameraMotionPreset = preset;
      $('#cameraStatus').textContent = preset === 'off' ? 'IDLE' : preset.toUpperCase();
    });
    updateCameraUi();
  }

    function bindCanvas() {
  function currentFractalDragTransform() {
    const modulation = combineModulation(state.modulationValues || {}, state.songDirectorValues || {});
    const motion = clamp(state.motion + (modulation.motion || 0), 0, 4);
    const zoom = Math.max(.15, 1 + (modulation.zoom || 0));
    const cameraMotion = cameraPresetTransform();
    const beat = state.beatPulse ? state.beat : 0;
    const breathing = Math.sin(state.visualTime * .72 + state.musicClockMids * .16) * .012 * motion;
    const pulse = 1 - .105 * beat * motion - .026 * state.bass * motion + breathing;
    const motionEnergy = motion * (.32 + state.rms * .34 + state.mids * .26);
    const orbitRadius = state.autoDrift
      ? (.012 + .022 * state.mids) * motionEnergy / Math.sqrt(state.zoom * zoom)
      : 0;
    const orbitAngle = (state.visualTime * .21 + state.musicClockMids * .12) * Math.sign(state.spin || 1);
    const depthAudio = 1 + state.fractalAudioDepth * (.22 * state.bass + .16 * state.mids + .12 * beat);
    const depthPhase = state.fractalDepthSpeed
      * (state.visualTime * .55 + state.musicClockMids * .28 * state.fractalAudioDepth);
    return {
      rotation: state.visualTime * state.spin * motion
        + Math.sin(state.visualTime * .63) * .035 * state.mids * motion
        + state.modulationRotationPhase
        + modulation.rotationOffset,
      worldScale: 3.15 * pulse / (state.zoom * zoom * cameraMotion.zoom),
      centerOffsetX: Math.cos(orbitAngle) * orbitRadius + cameraMotion.x + modulation.panX,
      centerOffsetY: Math.sin(orbitAngle * 1.17) * orbitRadius + cameraMotion.y + modulation.panY,
      dimensional: state.fractalDimensional,
      tilt: clamp(state.fractalTilt + (modulation.fractalTilt || 0), 0, 2) * depthAudio,
      perspective: state.fractalPerspective,
      slice: clamp(state.fractalSlice + (modulation.fractalSlice || 0), 0, 2),
      audioDepth: state.fractalAudioDepth,
      depthPhase,
      mids: state.mids
    };
  }

  function pointerToFractalPlane(clientX, clientY, transform) {
    const bounds = canvas.getBoundingClientRect();
    const height = Math.max(1, bounds.height);
    const screenX = (clientX - bounds.left - bounds.width * .5) / height;
    const screenY = (bounds.top + bounds.height * .5 - clientY) / height;
    const cosRotation = Math.cos(transform.rotation);
    const sinRotation = Math.sin(transform.rotation);
    // GLSL mat2 constructor values are column-major; mirror the shader exactly.
    let x = cosRotation * screenX + sinRotation * screenY;
    let y = -sinRotation * screenX + cosRotation * screenY;
    if (!transform.dimensional) return { x, y };

    const tiltX = Math.sin(transform.depthPhase) * transform.tilt * .82;
    const tiltY = Math.cos(transform.depthPhase * .83) * transform.tilt * .68;
    const cosY = Math.cos(tiltY);
    const sinY = Math.sin(tiltY);
    const pointX = cosY * x;
    const pointZAfterY = -sinY * x;
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const pointY = cosX * y - sinX * pointZAfterY;
    const pointZ = sinX * y + cosX * pointZAfterY;
    const perspectiveDepth = Math.max(.42, 1 + pointZ * transform.perspective * 1.65);
    const sliceAmount = pointZ * transform.slice * (.22 + .16 * transform.mids * transform.audioDepth);
    x = pointX / perspectiveDepth + Math.cos(transform.depthPhase * 1.31) * sliceAmount;
    y = pointY / perspectiveDepth + Math.sin(transform.depthPhase * 1.17) * sliceAmount;
    return { x, y };
  }

  function setBulbCameraDistance(value) {
    state.bulbCamera = clamp(value, 2.25, 5.25);
    $('#bulbCamera').value = String(state.bulbCamera);
    $('#bulbCamera').dispatchEvent(new Event('input', { bubbles: true }));
    $('#bulbCamera')._syncNumericValue?.();
  }

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * .001);
    if (state.visualStyle === 5) {
      setBulbCameraDistance(state.bulbCamera / factor);
      return;
    }
    state.zoom = Math.max(.4, Math.min(12000, state.zoom * factor));
    updateZoomControls();
  }, { passive: false });

  const canvasPointers = new Map();
  let canvasPinch = null;

  function beginSingleCanvasDrag(pointer) {
    canvasPinch = null;
    if (state.visualStyle === 5) {
      state.drag = {
        mode: 'bulb', pointerId: pointer.id,
        startX: pointer.x, startY: pointer.y,
        yaw: state.bulbYaw, pitch: state.bulbPitch
      };
      return;
    }
    const transform = currentFractalDragTransform();
    const plane = pointerToFractalPlane(pointer.x, pointer.y, transform);
    state.drag = {
      pointerId: pointer.id,
      anchorX: state.center.x + transform.centerOffsetX + plane.x * transform.worldScale,
      anchorY: state.center.y + transform.centerOffsetY + plane.y * transform.worldScale
    };
  }

  function beginCanvasPinch() {
    const pointers = [...canvasPointers.values()].slice(0, 2);
    if (pointers.length < 2) return;
    const [first, second] = pointers;
    const midpointX = (first.x + second.x) * .5;
    const midpointY = (first.y + second.y) * .5;
    const distance = Math.max(12, Math.hypot(second.x - first.x, second.y - first.y));
    canvasPinch = {
      pointerIds: [first.id, second.id],
      startDistance: distance,
      startMidpointX: midpointX,
      startMidpointY: midpointY,
      startZoom: state.zoom,
      startBulbCamera: state.bulbCamera,
      startYaw: state.bulbYaw,
      startPitch: state.bulbPitch
    };
    if (state.visualStyle !== 5) {
      const transform = currentFractalDragTransform();
      const plane = pointerToFractalPlane(midpointX, midpointY, transform);
      canvasPinch.anchorX = state.center.x + transform.centerOffsetX + plane.x * transform.worldScale;
      canvasPinch.anchorY = state.center.y + transform.centerOffsetY + plane.y * transform.worldScale;
    }
    state.drag = null;
  }

  function updateCanvasPinch() {
    if (!canvasPinch) return;
    const first = canvasPointers.get(canvasPinch.pointerIds[0]);
    const second = canvasPointers.get(canvasPinch.pointerIds[1]);
    if (!first || !second) return;
    const midpointX = (first.x + second.x) * .5;
    const midpointY = (first.y + second.y) * .5;
    const distance = Math.max(12, Math.hypot(second.x - first.x, second.y - first.y));
    const ratio = distance / canvasPinch.startDistance;
    if (state.visualStyle === 5) {
      setBulbCameraDistance(canvasPinch.startBulbCamera / ratio);
      state.bulbYaw = canvasPinch.startYaw - (midpointX - canvasPinch.startMidpointX) * .0032;
      state.bulbPitch = clamp(canvasPinch.startPitch + (midpointY - canvasPinch.startMidpointY) * .0028, -1.2, 1.2);
      return;
    }
    state.zoom = Math.max(.4, Math.min(12000, canvasPinch.startZoom * ratio));
    const transform = currentFractalDragTransform();
    const plane = pointerToFractalPlane(midpointX, midpointY, transform);
    state.center.x = canvasPinch.anchorX - transform.centerOffsetX - plane.x * transform.worldScale;
    state.center.y = canvasPinch.anchorY - transform.centerOffsetY - plane.y * transform.worldScale;
    updateZoomControls();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    state.cameraPath = null;
    canvasPointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });
    if (canvasPointers.size === 1) beginSingleCanvasDrag(canvasPointers.get(event.pointerId));
    else if (canvasPointers.size === 2) beginCanvasPinch();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (canvasPointers.has(event.pointerId)) {
      canvasPointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });
      if (canvasPinch) {
        updateCanvasPinch();
        return;
      }
    }
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    if (state.drag.mode === 'bulb') {
      state.bulbYaw = state.drag.yaw - (event.clientX - state.drag.startX) * .0065;
      state.bulbPitch = clamp(state.drag.pitch + (event.clientY - state.drag.startY) * .0055, -1.2, 1.2);
      return;
    }
    const transform = currentFractalDragTransform();
    const plane = pointerToFractalPlane(event.clientX, event.clientY, transform);
    state.center.x = state.drag.anchorX - transform.centerOffsetX - plane.x * transform.worldScale;
    state.center.y = state.drag.anchorY - transform.centerOffsetY - plane.y * transform.worldScale;
  });
  const endCanvasPointer = (event) => {
    if (!canvasPointers.has(event.pointerId)) return;
    canvasPointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (canvasPointers.size >= 2) beginCanvasPinch();
    else if (canvasPointers.size === 1) beginSingleCanvasDrag([...canvasPointers.values()][0]);
    else {
      canvasPinch = null;
      state.drag = null;
    }
  };
  canvas.addEventListener('pointerup', endCanvasPointer);
  canvas.addEventListener('pointercancel', endCanvasPointer);
    }

    function initialize() {
      if (initialized) return;
      initializeCameraTools();
      bindCanvas();
      initialized = true;
    }

    return Object.freeze({
      initialize,
      presetTransform: cameraPresetTransform,
      updatePath: updateCameraPath,
      updateUi: updateCameraUi,
      get diagnostics() {
        return Object.freeze({ initialized, bookmarks: cameraBookmarks.length, pathActive: Boolean(state.cameraPath) });
      }
    });
  }

  window.QuarticCameraController = Object.freeze({ create });
})();
