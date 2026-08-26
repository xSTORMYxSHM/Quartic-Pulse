(() => {
  'use strict';

  // Quartic Pulse host adapter for its bundled, first-party Data Horizon runtime.
  // Imported package scripts remain data only and are never executed here.
  const vendor = window.QuarticDataHorizonVendor;
  if (!vendor?.renderRuntime?.HorizonRenderer || !vendor?.audioRuntime?.AudioModulationEngine) {
    throw new Error('The bundled Data Horizon renderer is unavailable.');
  }

  const renderRuntime = vendor.renderRuntime;
  const audioRuntime = vendor.audioRuntime;
  const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

  function projectLayerTypes(layers, types = new Set()) {
    for (const layer of Array.isArray(layers) ? layers : []) {
      if (typeof layer?.type === 'string') types.add(layer.type);
      if (layer?.type === 'group') projectLayerTypes(layer.children, types);
    }
    return [...types].sort();
  }

  function evaluateTimeline(timeline, requestedTime) {
    const values = new Map();
    if (!timeline || !Array.isArray(timeline.tracks) || !timeline.tracks.length) return values;
    const duration = Math.max(.001, Number(timeline.duration) || 0);
    const time = timeline.loop === false
      ? Math.max(0, Math.min(duration, requestedTime))
      : ((requestedTime % duration) + duration) % duration;
    for (const track of timeline.tracks) {
      if (!track || typeof track.target !== 'string' || !Array.isArray(track.keyframes)) continue;
      const frames = [...track.keyframes]
        .filter((frame) => Number.isFinite(Number(frame?.time)) && Number.isFinite(Number(frame?.value)))
        .sort((left, right) => Number(left.time) - Number(right.time));
      if (!frames.length) continue;
      if (time <= Number(frames[0].time)) {
        values.set(track.target, Number(frames[0].value));
        continue;
      }
      const last = frames[frames.length - 1];
      if (time >= Number(last.time)) {
        values.set(track.target, Number(last.value));
        continue;
      }
      for (let index = 0; index < frames.length - 1; index += 1) {
        const from = frames[index];
        const to = frames[index + 1];
        if (time < Number(from.time) || time > Number(to.time)) continue;
        const span = Math.max(.001, Number(to.time) - Number(from.time));
        let progress = (time - Number(from.time)) / span;
        if (from.easing === 'hold') progress = 0;
        else if (from.easing === 'easeInOut') progress = progress * progress * (3 - 2 * progress);
        values.set(track.target, Number(from.value) + (Number(to.value) - Number(from.value)) * progress);
        break;
      }
    }
    return values;
  }

  function create(options = {}) {
    const canvas = options.canvas;
    if (!canvas) throw new Error('A canvas is required for the Data Horizon package runtime.');
    const renderer = new renderRuntime.HorizonRenderer(canvas);
    renderer.resizeToDisplaySize = () => {};
    const modulationEngine = new audioRuntime.AudioModulationEngine();
    let project = null;
    let packageRecord = null;
    let generation = 0;
    let lastTimestamp = Number.NaN;
    let lastSequence = 0;
    let lastModulation = new Map();
    let lastAudio = { bass: 0, mids: 0, highs: 0, beat: 0, rms: 0 };

    async function setPackage(payload) {
      const currentGeneration = ++generation;
      const nextProject = payload?.project;
      if (!nextProject || typeof nextProject !== 'object') {
        project = null;
        packageRecord = null;
        modulationEngine.reset();
        return false;
      }
      await renderer.setProject(nextProject);
      if (currentGeneration !== generation) return false;
      project = nextProject;
      packageRecord = payload.package || null;
      modulationEngine.reset();
      lastTimestamp = Number.NaN;
      lastSequence = 0;
      lastModulation = new Map();
      lastAudio = { bass: 0, mids: 0, highs: 0, beat: 0, rms: 0 };
      return true;
    }

    function render(frame = {}) {
      if (!project) return renderer.diagnostics();
      const timestampSeconds = Math.max(0, Number(frame.timestampSeconds) || 0);
      const requestedDelta = Math.max(0, Number(frame.deltaSeconds) || 0);
      const repeatedFrame = Number.isFinite(lastTimestamp) && Math.abs(timestampSeconds - lastTimestamp) < .0000001;
      const reset = Boolean(frame.reset)
        || !Number.isFinite(lastTimestamp)
        || timestampSeconds < lastTimestamp
        || timestampSeconds - lastTimestamp > .5;
      if (!repeatedFrame) {
        lastSequence += 1;
        lastAudio = {
          bass: clamp01(frame.bass),
          mids: clamp01(frame.mids),
          highs: clamp01(frame.highs),
          beat: clamp01(frame.beat),
          rms: clamp01(frame.rms)
        };
        lastModulation = modulationEngine.evaluate(project.bindings || [], {
          sequence: lastSequence,
          timestampSeconds,
          ...lastAudio,
          spectrum: Array.isArray(frame.spectrum) || ArrayBuffer.isView(frame.spectrum) ? Array.from(frame.spectrum) : undefined,
          reset
        }, reset ? 1 / 1000 : Math.max(1 / 1000, requestedDelta));
        lastTimestamp = timestampSeconds;
      }
      const diagnostics = renderer.render({
        timeSeconds: timestampSeconds,
        deltaSeconds: repeatedFrame ? 0 : requestedDelta,
        modulation: lastModulation,
        animation: evaluateTimeline(project.timeline, timestampSeconds),
        audio: lastAudio
      });
      return Object.freeze({ ...diagnostics, layerTypes: projectLayerTypes(project.layers) });
    }

    function finish() {
      renderer.gl?.finish?.();
    }

    return Object.freeze({
      get gl() { return renderer.gl; },
      get packageRecord() { return packageRecord; },
      get ready() { return Boolean(project); },
      finish,
      render,
      setPackage
    });
  }

  window.QuarticDataHorizonRuntime = Object.freeze({
    audioContract: 'tempest.audio-features.v1',
    create,
    effectRegistry: renderRuntime.effectRegistry,
    engineVersion: vendor.engineVersion,
    evaluateTimeline,
    projectLayerTypes
  });
})();
