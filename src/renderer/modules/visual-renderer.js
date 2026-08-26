(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function create(options = {}) {
    const canvas = options.canvas;
    const shaderSource = options.shaderSource;
    if (!canvas) throw new Error('A canvas is required to create the visual renderer.');
    if (!shaderSource?.vertex || !shaderSource?.fragment) throw new Error('Complete shader source is required to create the visual renderer.');

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance'
    });
    if (!gl) return Object.freeze({ gl: null });

    const { vertex: vertexSource, fragment: fragmentSource } = shaderSource;
  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {};
  for (const name of ['uResolution','uSubpixelOffset','uCenter','uScale','uTime','uBass','uMids','uHighs','uRms','uBeat','uFlow','uMotion','uFractalDimensional','uFractalTilt','uFractalDepthSpeed','uFractalPerspective','uFractalSlice','uFractalLighting','uFractalAudioDepth','uEquationFolding','uEquationFold','uEquationWarp','uEquationFoldMotion','uEquationFoldOffset','uEquationWarpScale','uEquationFoldAudio','uCoreCStrength','uCoreBias','uBarWidth','uBarGlow','uBarReflection','uBarMotion','uBarEcho','uBarGrid','uBarStyle','uRadialSize','uRadialGlow','uRadialWaves','uRadialTwist','uRadialSpokes','uRadialAtmosphere','uPulseJagged','uPulseTrail','uPulseDetail','uPulseSize','uPulseEventCount','uBulbPower','uBulbWarp','uBulbDetail','uBulbAudio','uBulbOrbit','uBulbFold','uBulbGlow','uBulbCamera','uBulbYaw','uBulbPitch','uBulbSteps','uRotation','uEquation','uFrequencyHue','uMappedFrequencyHue','uFrequencyColor','uFractalType','uVisualStyle','uCustom0','uCustom1','uCustom2','uCustom3','uIterations','uPalette','uChromaKey','uChromaThreshold','uHdrExport','uExporting']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  for (const name of ['uEquationBass','uEquationMids','uEquationHighs','uEquationBeat','uMusicMotionBass','uMusicMotionMids','uMusicMotionHighs','uMusicMotionBeat','uMusicClockBass','uMusicClockMids','uMusicClockHighs','uMusicClockRms','uMusicClockBeat','uMappedEquation']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  uniforms.uSpectrum = gl.getUniformLocation(program, 'uSpectrum[0]');
  uniforms.uWaveform = gl.getUniformLocation(program, 'uWaveform[0]');
  uniforms.uPulseEventAge = gl.getUniformLocation(program, 'uPulseEventAge[0]');
  uniforms.uPulseEventStrength = gl.getUniformLocation(program, 'uPulseEventStrength[0]');
  uniforms.uPulseEventBand = gl.getUniformLocation(program, 'uPulseEventBand[0]');
  uniforms.uPulseEventSeed = gl.getUniformLocation(program, 'uPulseEventSeed[0]');
  uniforms.uBulbHotspots = gl.getUniformLocation(program, 'uBulbHotspots[0]');

    const maximumPulseEvents = Math.max(1, Number(options.maximumPulseEvents) || 16);
    const pulseEventAges = new Float32Array(maximumPulseEvents);
    const pulseEventStrengths = new Float32Array(maximumPulseEvents);
    const pulseEventBands = new Float32Array(maximumPulseEvents);
    const pulseEventSeeds = new Float32Array(maximumPulseEvents);
    const bulbHotspotData = new Float32Array(9);
    const bulbHotspotFrom = new Float32Array(3);
    const bulbHotspotTo = new Float32Array(3);
    let hdrExportFramebuffer = null;
    let hdrExportTexture = null;
    let hdrExportWidth = 0;
    let hdrExportHeight = 0;

    function resize(view = {}) {
      if (view.exporting) {
        const width = Math.max(1, Math.floor(Number(view.exportWidth) || 1));
        const height = Math.max(1, Math.floor(Number(view.exportHeight) || 1));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      } else {
        const liveScale = Math.round(clamp(Number(view.performanceScale) || 1, .05, 4) * 20) / 20;
        const dpr = Math.min(Number(view.devicePixelRatio) || 1, 1.5) * liveScale;
        const width = Math.max(1, Math.floor((Number(view.stageWidth) || 1) * dpr));
        const height = Math.max(1, Math.floor((Number(view.stageHeight) || 1) * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      return Object.freeze({ width: canvas.width, height: canvas.height });
    }

    function releaseHdrExportTarget() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (hdrExportTexture) gl.deleteTexture(hdrExportTexture);
      if (hdrExportFramebuffer) gl.deleteFramebuffer(hdrExportFramebuffer);
      hdrExportTexture = null;
      hdrExportFramebuffer = null;
      hdrExportWidth = 0;
      hdrExportHeight = 0;
    }

    function ensureHdrExportTarget(width, height) {
      const targetWidth = Math.max(1, Math.floor(Number(width) || 1));
      const targetHeight = Math.max(1, Math.floor(Number(height) || 1));
      if (hdrExportFramebuffer && hdrExportWidth === targetWidth && hdrExportHeight === targetHeight) return true;
      releaseHdrExportTarget();
      const framebuffer = gl.createFramebuffer();
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB10_A2, targetWidth, targetHeight, 0, gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (!complete) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
        return false;
      }
      hdrExportFramebuffer = framebuffer;
      hdrExportTexture = texture;
      hdrExportWidth = targetWidth;
      hdrExportHeight = targetHeight;
      return true;
    }

    function beginFrame(useTenBitTarget = false) {
      const renderingTenBitExport = Boolean(useTenBitTarget && hdrExportFramebuffer);
      gl.bindFramebuffer(gl.FRAMEBUFFER, renderingTenBitExport ? hdrExportFramebuffer : null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      return renderingTenBitExport;
    }

    function bulbHotspotHash(seed) {
      const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return value - Math.floor(value);
    }

    function fillSeededBulbDirection(target, seed) {
      const vertical = bulbHotspotHash(seed + 2.13) * 2 - 1;
      const angle = bulbHotspotHash(seed + 8.71) * Math.PI * 2;
      const horizontal = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      target[0] = horizontal * Math.cos(angle);
      target[1] = vertical;
      target[2] = horizontal * Math.sin(angle);
    }

    function updateBulbHotspots(time) {
      const offsets = [1.3, 7.1, 13.7];
      const rates = [.075, .105, .14];
      for (let index = 0; index < 3; index++) {
        const phase = time * rates[index] + offsets[index];
        const cell = Math.floor(phase);
        const progress = phase - cell;
        const eased = progress * progress * (3 - 2 * progress);
        const seedOffset = offsets[index] * 19.7;
        fillSeededBulbDirection(bulbHotspotFrom, cell + seedOffset);
        fillSeededBulbDirection(bulbHotspotTo, cell + 1 + seedOffset);
        const x = bulbHotspotFrom[0] + (bulbHotspotTo[0] - bulbHotspotFrom[0]) * eased;
        const y = bulbHotspotFrom[1] + (bulbHotspotTo[1] - bulbHotspotFrom[1]) * eased;
        const z = bulbHotspotFrom[2] + (bulbHotspotTo[2] - bulbHotspotFrom[2]) * eased;
        const length = Math.max(.0001, Math.hypot(x, y, z));
        const dataIndex = index * 3;
        bulbHotspotData[dataIndex] = x / length;
        bulbHotspotData[dataIndex + 1] = y / length;
        bulbHotspotData[dataIndex + 2] = z / length;
      }
      gl.uniform3fv(uniforms.uBulbHotspots, bulbHotspotData);
    }

    function drawFrame(frame = {}) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);
      const state = frame.state;
      const modulation = frame.modulation || {};
      const direct = frame.direct || {};
      const renderCenterX = Number(frame.renderCenterX) || 0;
      const renderCenterY = Number(frame.renderCenterY) || 0;
      const cameraZoom = Math.max(.0001, Number(frame.cameraZoom) || 1);
      const modulatedZoom = Math.max(.0001, Number(frame.modulatedZoom) || 1);
      const modulatedMotion = Number(frame.modulatedMotion) || 0;
      const routedDimensional = Boolean(frame.routedDimensional);
      const routedFolding = Boolean(frame.routedFolding);
      const matrixOwnsFractalAudio = Boolean(frame.matrixOwnsFractalAudio);
      const rotation = Number(frame.rotation) || 0;
      const renderingTenBitExport = Boolean(frame.renderingTenBitExport);
      const isObsOutput = Boolean(frame.isObsOutput);
      const {
        directBass = 0,
        directMids = 0,
        directHighs = 0,
        directRms = 0,
        directBeat = 0,
        musicClockBass = 0,
        musicClockMids = 0,
        musicClockHighs = 0,
        musicClockRms = 0,
        musicClockBeat = 0,
        equationBass = 0,
        equationMids = 0,
        equationHighs = 0,
        equationBeat = 0,
        musicMotionBass = 0,
        musicMotionMids = 0,
        musicMotionHighs = 0,
        musicMotionBeat = 0
      } = direct;
      if (!state) throw new Error('A renderer frame state is required.');

    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(
      uniforms.uSubpixelOffset,
      state.offlineExporting ? state.exportSampleOffsetX : 0,
      state.offlineExporting ? state.exportSampleOffsetY : 0
    );
    gl.uniform2f(uniforms.uCenter, renderCenterX, renderCenterY);
    gl.uniform1f(uniforms.uScale, 3.15 / (state.zoom * modulatedZoom * cameraZoom));
    gl.uniform1f(uniforms.uTime, state.visualTime);
    gl.uniform1f(uniforms.uBass, directBass);
    gl.uniform1f(uniforms.uMids, directMids);
    gl.uniform1f(uniforms.uHighs, directHighs);
    gl.uniform1f(uniforms.uRms, directRms);
    gl.uniform1f(uniforms.uBeat, state.beatPulse ? directBeat : 0);
    gl.uniform1f(uniforms.uMusicClockBass, musicClockBass);
    gl.uniform1f(uniforms.uMusicClockMids, musicClockMids);
    gl.uniform1f(uniforms.uMusicClockHighs, musicClockHighs);
    gl.uniform1f(uniforms.uMusicClockRms, musicClockRms);
    gl.uniform1f(uniforms.uMusicClockBeat, musicClockBeat);
    gl.uniform1f(uniforms.uEquationBass, equationBass);
    gl.uniform1f(uniforms.uEquationMids, equationMids);
    gl.uniform1f(uniforms.uEquationHighs, equationHighs);
    gl.uniform1f(uniforms.uEquationBeat, state.beatPulse ? equationBeat : 0);
    gl.uniform1f(uniforms.uMusicMotionBass, musicMotionBass);
    gl.uniform1f(uniforms.uMusicMotionMids, musicMotionMids);
    gl.uniform1f(uniforms.uMusicMotionHighs, musicMotionHighs);
    gl.uniform1f(uniforms.uMusicMotionBeat, state.beatPulse ? musicMotionBeat : 0);
    gl.uniform1f(uniforms.uMappedEquation, Number(modulation.equation) || 0);
    gl.uniform1f(uniforms.uFlow, clamp(state.flow + (modulation.flow || 0), 0, 2));
    gl.uniform1f(uniforms.uMotion, modulatedMotion);
    gl.uniform1f(uniforms.uFractalDimensional, state.fractalDimensional || routedDimensional ? 1 : 0);
    gl.uniform1f(uniforms.uFractalTilt, clamp(state.fractalTilt + (modulation.fractalTilt || 0), 0, 2));
    gl.uniform1f(uniforms.uFractalDepthSpeed, state.fractalDepthSpeed);
    gl.uniform1f(uniforms.uFractalPerspective, state.fractalPerspective);
    gl.uniform1f(uniforms.uFractalSlice, clamp(state.fractalSlice + (modulation.fractalSlice || 0), 0, 2));
    gl.uniform1f(uniforms.uFractalLighting, state.fractalLighting);
    gl.uniform1f(uniforms.uFractalAudioDepth, state.fractalAudioDepth);
    gl.uniform1f(uniforms.uEquationFolding, state.equationFolding || routedFolding ? 1 : 0);
    gl.uniform1f(uniforms.uEquationFold, clamp(state.equationFold + (modulation.equationFold || 0), 0, 2));
    gl.uniform1f(uniforms.uEquationWarp, clamp(state.equationWarp + (modulation.equationWarp || 0), 0, 2.5));
    gl.uniform1f(uniforms.uEquationFoldMotion, state.equationFoldMotion);
    gl.uniform1f(uniforms.uEquationFoldOffset, state.equationFoldOffset);
    gl.uniform1f(uniforms.uEquationWarpScale, state.equationWarpScale);
    gl.uniform1f(uniforms.uEquationFoldAudio, state.equationFoldAudio);
    gl.uniform1f(uniforms.uCoreCStrength, state.coreCStrength);
    gl.uniform2f(uniforms.uCoreBias, state.coreBiasReal, state.coreBiasImag);
    gl.uniform1f(uniforms.uBarWidth, state.barWidth);
    gl.uniform1f(uniforms.uBarGlow, state.barGlow);
    gl.uniform1f(uniforms.uBarReflection, state.barReflection);
    gl.uniform1f(uniforms.uBarMotion, state.barMotion);
    gl.uniform1f(uniforms.uBarEcho, state.barEcho);
    gl.uniform1f(uniforms.uBarGrid, state.barGrid);
    gl.uniform1f(uniforms.uBarStyle, state.barStyle);
    gl.uniform1f(uniforms.uRadialSize, state.radialSize);
    gl.uniform1f(uniforms.uRadialGlow, state.radialGlow);
    gl.uniform1f(uniforms.uRadialWaves, state.radialWaves);
    gl.uniform1f(uniforms.uRadialTwist, state.radialTwist);
    gl.uniform1f(uniforms.uRadialSpokes, state.radialSpokes);
    gl.uniform1f(uniforms.uRadialAtmosphere, state.radialAtmosphere);
    gl.uniform1f(uniforms.uPulseJagged, clamp(state.pulseJagged + (modulation.pulseJagged || 0), 0, 3));
    gl.uniform1f(uniforms.uPulseTrail, state.pulseTrail);
    gl.uniform1f(uniforms.uPulseDetail, state.pulseDetail);
    gl.uniform1f(uniforms.uPulseSize, state.pulseSize);
    gl.uniform1f(uniforms.uBulbPower, Math.round(clamp(state.bulbPower, 2, 10)));
    gl.uniform1f(uniforms.uBulbWarp, clamp(modulation.bulbPower || 0, -1.5, 1.5));
    gl.uniform1f(uniforms.uBulbDetail, state.bulbDetail);
    gl.uniform1f(uniforms.uBulbAudio, state.bulbAudio);
    gl.uniform1f(uniforms.uBulbOrbit, state.bulbOrbit);
    gl.uniform1f(uniforms.uBulbFold, clamp(state.bulbFold + (modulation.bulbFold || 0), 0, 1));
    gl.uniform1f(uniforms.uBulbGlow, clamp(state.bulbGlow + (modulation.bulbGlow || 0), 0, 2));
    gl.uniform1f(uniforms.uBulbCamera, state.bulbCamera);
    gl.uniform1f(uniforms.uBulbYaw, state.bulbYaw);
    gl.uniform1f(uniforms.uBulbPitch, state.bulbPitch);
    updateBulbHotspots(state.visualTime);
    let bulbSteps = 42 + state.bulbDetail * 54;
    if (state.exporting) bulbSteps *= 1.12 + Math.min(2.5, state.exportDetail) * .32;
    else bulbSteps *= (.74 + state.performanceScale * .26) * state.bulbLiveBudget * (state.unleashedMode ? 1.24 : 1);
    gl.uniform1i(uniforms.uBulbSteps, Math.min(state.unleashedMode || state.exporting ? 192 : 112, Math.max(36, Math.round(bulbSteps))));
    pulseEventAges.fill(-1);
    pulseEventStrengths.fill(0);
    pulseEventBands.fill(0);
    pulseEventSeeds.fill(0);
    const pulseEventCount = matrixOwnsFractalAudio
      ? 0
      : Math.min(maximumPulseEvents, state.pulseEvents.length);
    for (let index = 0; index < pulseEventCount; index++) {
      const event = state.pulseEvents[index];
      pulseEventAges[index] = event.age;
      pulseEventStrengths[index] = event.strength;
      pulseEventBands[index] = event.band;
      pulseEventSeeds[index] = Number.isFinite(event.seed)
        ? event.seed
        : index + event.band * .37 + 1;
    }
    gl.uniform1i(uniforms.uPulseEventCount, pulseEventCount);
    gl.uniform1fv(uniforms.uPulseEventAge, pulseEventAges);
    gl.uniform1fv(uniforms.uPulseEventStrength, pulseEventStrengths);
    gl.uniform1fv(uniforms.uPulseEventBand, pulseEventBands);
    gl.uniform1fv(uniforms.uPulseEventSeed, pulseEventSeeds);
    window.__quarticPulseEventCount = pulseEventCount;
    window.__quarticPulseEventLimit = Number(frame.activePulseEventLimit) || 0;
    window.__quarticPulseAcceptedTotal = state.pulseAcceptedTotal;
    gl.uniform1f(uniforms.uRotation, rotation);
    gl.uniform1f(uniforms.uEquation, clamp(state.equation, 0, 2.5));
    gl.uniform1f(uniforms.uFrequencyHue, matrixOwnsFractalAudio ? 0 : state.frequencyHue);
    gl.uniform1f(uniforms.uMappedFrequencyHue, modulation.frequencyHue || 0);
    gl.uniform1f(uniforms.uFrequencyColor, state.frequencyColorEnabled ? state.frequencyColorAmount : 0);
    gl.uniform1i(uniforms.uFractalType, state.fractalType);
    gl.uniform1i(uniforms.uVisualStyle, state.visualStyle);
    gl.uniform1fv(uniforms.uSpectrum, state.spectrumData);
    gl.uniform1fv(uniforms.uWaveform, state.waveformData);
    gl.uniform3fv(uniforms.uCustom0, state.customColors[0]);
    gl.uniform3fv(uniforms.uCustom1, state.customColors[1]);
    gl.uniform3fv(uniforms.uCustom2, state.customColors[2]);
    gl.uniform3fv(uniforms.uCustom3, state.customColors[3]);
    const detailMultiplier = state.exporting ? state.exportDetail : 1;
    const requestedIterations = state.exporting && state.exportIterationTarget > 0
      ? state.exportIterationTarget
      : Math.round(state.iterations * detailMultiplier);
    gl.uniform1i(uniforms.uIterations, Math.min(state.unleashedMode ? 2400 : 1200, requestedIterations));
    gl.uniform1i(uniforms.uPalette, state.palette);
    gl.uniform1f(uniforms.uChromaKey, isObsOutput && state.obsChromaKey ? 1 : 0);
    gl.uniform1f(uniforms.uChromaThreshold, state.obsChromaThreshold);
    gl.uniform1f(uniforms.uHdrExport, renderingTenBitExport && state.offlineHdrExport ? 1 : 0);
    gl.uniform1f(uniforms.uExporting, state.exporting ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (renderingTenBitExport && frame.showExportPreview) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.uniform1f(uniforms.uHdrExport, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, hdrExportFramebuffer);
      gl.uniform1f(uniforms.uHdrExport, state.offlineHdrExport ? 1 : 0);
    }
    }

    function finish() {
      gl.finish();
    }

    return Object.freeze({
      gl,
      beginFrame,
      drawFrame,
      ensureHdrExportTarget,
      finish,
      releaseHdrExportTarget,
      resize,
      get diagnostics() {
        return Object.freeze({
          ready: true,
          width: canvas.width,
          height: canvas.height,
          hdrTargetReady: Boolean(hdrExportFramebuffer)
        });
      }
    });
  }

  window.QuarticVisualRenderer = Object.freeze({ create });
})();
