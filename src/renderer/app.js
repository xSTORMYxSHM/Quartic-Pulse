(() => {
  'use strict';

  const pageParameters = new URLSearchParams(window.location.search);
  const isObsOutput = pageParameters.get('obs') === '1';
  const isSmokeTest = pageParameters.get('smoke') === '1';
  if (!isObsOutput) {
    window.addEventListener('error', (event) => window.quarticDesktop?.reportRendererError?.({
      kind: 'error',
      message: event.message || event.error?.message || 'Renderer error',
      stack: event.error?.stack || ''
    }));
    window.addEventListener('unhandledrejection', (event) => window.quarticDesktop?.reportRendererError?.({
      kind: 'unhandled-rejection',
      message: event.reason?.message || String(event.reason || 'Unhandled renderer rejection'),
      stack: event.reason?.stack || ''
    }));
  }
  if (isObsOutput) {
    document.body.classList.add('obs-output');
    const obsDragStrip = document.createElement('div');
    obsDragStrip.className = 'obs-window-drag-strip';
    obsDragStrip.title = 'Drag to move the OBS output window';
    document.body.appendChild(obsDragStrip);
    document.title = 'Quartic Pulse — OBS Output';
  }

  const $ = (selector) => document.querySelector(selector);
  const appMetadata = window.QuarticAppMetadata;
  if (!appMetadata) throw new Error('Quartic application metadata failed to load.');
  const appVersionText = $('#appVersionText');
  if (appVersionText) {
    const channelLabel = appMetadata.releaseChannel === 'stable'
      ? 'Stable Release'
      : appMetadata.releaseChannel === 'release-candidate' ? 'Release Candidate' : 'Testing Build';
    appVersionText.textContent = `Version ${appMetadata.version} ${channelLabel}`;
  }
  const exportProfileCatalog = window.QuarticExportProfiles;
  if (!exportProfileCatalog) throw new Error('Quartic export profile catalog failed to load.');
  const workspaceShell = window.QuarticWorkspaceShell;
  if (!workspaceShell) throw new Error('Quartic workspace shell failed to load.');
  const visualCatalog = window.QuarticVisualCatalog;
  if (!visualCatalog) throw new Error('Quartic visual catalog failed to load.');
  const audioControllerFactory = window.QuarticAudioController;
  if (!audioControllerFactory) throw new Error('Quartic audio controller failed to load.');
  const audioAnalysisEngineFactory = window.QuarticAudioAnalysisEngine;
  if (!audioAnalysisEngineFactory) throw new Error('Quartic audio analysis engine failed to load.');
  const performanceControllerFactory = window.QuarticPerformanceController;
  if (!performanceControllerFactory) throw new Error('Quartic performance controller failed to load.');
  const performanceSequencerEngineFactory = window.QuarticPerformanceSequencerEngine;
  if (!performanceSequencerEngineFactory) throw new Error('Quartic performance sequencer engine failed to load.');
  const performanceShowDataEngineFactory = window.QuarticPerformanceShowDataEngine;
  if (!performanceShowDataEngineFactory) throw new Error('Quartic performance show data engine failed to load.');
  const performanceShowComposerControllerFactory = window.QuarticPerformanceShowComposerController;
  if (!performanceShowComposerControllerFactory) throw new Error('Quartic performance show composer controller failed to load.');
  const profileManagerControllerFactory = window.QuarticProfileManagerController;
  if (!profileManagerControllerFactory) throw new Error('Quartic profile manager controller failed to load.');
  const songMapDataEngineFactory = window.QuarticSongMapDataEngine;
  if (!songMapDataEngineFactory) throw new Error('Quartic Song Map data engine failed to load.');
  const songDirectorEngineFactory = window.QuarticSongDirectorEngine;
  if (!songDirectorEngineFactory) throw new Error('Quartic Song Director engine failed to load.');
  const songDirectorControllerFactory = window.QuarticSongDirectorController;
  if (!songDirectorControllerFactory) throw new Error('Quartic Song Director controller failed to load.');
  const performancePackageEngineFactory = window.QuarticPerformancePackageEngine;
  if (!performancePackageEngineFactory) throw new Error('Quartic performance package engine failed to load.');
  const exportControllerFactory = window.QuarticExportController;
  if (!exportControllerFactory) throw new Error('Quartic export controller failed to load.');
  const exportSessionEngineFactory = window.QuarticExportSessionEngine;
  if (!exportSessionEngineFactory) throw new Error('Quartic export session engine failed to load.');
  const exportProgressWorkflowEngineFactory = window.QuarticExportProgressWorkflowEngine;
  if (!exportProgressWorkflowEngineFactory) throw new Error('Quartic export progress workflow engine failed to load.');
  const exportProgressCoordinatorFactory = window.QuarticExportProgressCoordinator;
  if (!exportProgressCoordinatorFactory) throw new Error('Quartic export progress coordinator failed to load.');
  const exportCommandCoordinatorFactory = window.QuarticExportCommandCoordinator;
  if (!exportCommandCoordinatorFactory) throw new Error('Quartic export command coordinator failed to load.');
  const exportJobCoordinatorFactory = window.QuarticExportJobCoordinator;
  if (!exportJobCoordinatorFactory) throw new Error('Quartic export job coordinator failed to load.');
  const exportResultWorkflowEngineFactory = window.QuarticExportResultWorkflowEngine;
  if (!exportResultWorkflowEngineFactory) throw new Error('Quartic export result workflow engine failed to load.');
  const exportEncoderEngineFactory = window.QuarticExportEncoderEngine;
  if (!exportEncoderEngineFactory) throw new Error('Quartic export encoder engine failed to load.');
  const exportLiveCaptureEngineFactory = window.QuarticExportLiveCaptureEngine;
  if (!exportLiveCaptureEngineFactory) throw new Error('Quartic Live Capture Engine failed to load.');
  const exportQuickClipWorkflowEngineFactory = window.QuarticExportQuickClipWorkflowEngine;
  if (!exportQuickClipWorkflowEngineFactory) throw new Error('Quartic Quick Clip Workflow Engine failed to load.');
  const exportSamplingEngineFactory = window.QuarticExportSamplingEngine;
  if (!exportSamplingEngineFactory) throw new Error('Quartic export sampling engine failed to load.');
  const exportSettingsSnapshotEngineFactory = window.QuarticExportSettingsSnapshotEngine;
  if (!exportSettingsSnapshotEngineFactory) throw new Error('Quartic export settings snapshot engine failed to load.');
  const exportPreparationEngineFactory = window.QuarticExportPreparationEngine;
  if (!exportPreparationEngineFactory) throw new Error('Quartic export preparation engine failed to load.');
  const exportFrameCaptureEngineFactory = window.QuarticExportFrameCaptureEngine;
  if (!exportFrameCaptureEngineFactory) throw new Error('Quartic export frame capture engine failed to load.');
  const exportPlanningEngineFactory = window.QuarticExportPlanningEngine;
  if (!exportPlanningEngineFactory) throw new Error('Quartic export planning engine failed to load.');
  const exportPresentationEngineFactory = window.QuarticExportPresentationEngine;
  if (!exportPresentationEngineFactory) throw new Error('Quartic export presentation engine failed to load.');
  const exportPreflightEngineFactory = window.QuarticExportPreflightEngine;
  if (!exportPreflightEngineFactory) throw new Error('Quartic export preflight engine failed to load.');
  const exportAdvisorEngineFactory = window.QuarticExportAdvisorEngine;
  if (!exportAdvisorEngineFactory) throw new Error('Quartic export advisor engine failed to load.');
  const exportSettingsCoordinatorEngineFactory = window.QuarticExportSettingsCoordinatorEngine;
  if (!exportSettingsCoordinatorEngineFactory) throw new Error('Quartic export settings coordinator failed to load.');
  const exportRuntimeStateCoordinatorFactory = window.QuarticExportRuntimeStateCoordinator;
  if (!exportRuntimeStateCoordinatorFactory) throw new Error('Quartic export runtime state coordinator failed to load.');
  const exportEncoderScanEngineFactory = window.QuarticExportEncoderScanEngine;
  if (!exportEncoderScanEngineFactory) throw new Error('Quartic export encoder scan engine failed to load.');
  const exportBenchmarkEngineFactory = window.QuarticExportBenchmarkEngine;
  if (!exportBenchmarkEngineFactory) throw new Error('Quartic export benchmark engine failed to load.');
  const exportHistoryEngineFactory = window.QuarticExportHistoryEngine;
  if (!exportHistoryEngineFactory) throw new Error('Quartic export history engine failed to load.');
  const exportHistoryActionEngineFactory = window.QuarticExportHistoryActionEngine;
  if (!exportHistoryActionEngineFactory) throw new Error('Quartic export history action engine failed to load.');
  const exportRecoveryEngineFactory = window.QuarticExportRecoveryEngine;
  if (!exportRecoveryEngineFactory) throw new Error('Quartic export recovery engine failed to load.');
  const exportRenderCoordinatorFactory = window.QuarticExportRenderCoordinator;
  if (!exportRenderCoordinatorFactory) throw new Error('Quartic export render coordinator failed to load.');
  const exportWorkflowEngineFactory = window.QuarticExportWorkflowEngine;
  if (!exportWorkflowEngineFactory) throw new Error('Quartic export workflow engine failed to load.');
  const exportOfflineLifecycleFactory = window.QuarticExportOfflineLifecycle;
  if (!exportOfflineLifecycleFactory) throw new Error('Quartic offline export lifecycle failed to load.');
  const exportLiveLifecycleFactory = window.QuarticExportLiveLifecycle;
  if (!exportLiveLifecycleFactory) throw new Error('Quartic live export lifecycle failed to load.');
  const canvas = $('#fractalCanvas');
  const stage = $('#stage');
  const audio = $('#audio');
  const deckOutputStorageKey = 'quarticPulseDeckOutputDevice';
  let deckOutputDeviceId = localStorage.getItem(deckOutputStorageKey) || '';
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    document.body.innerHTML = '<div class="webgl-error">Quartic Pulse requires a WebGL2-capable graphics driver.</div>';
    return;
  }

  const vertexSource = `#version 300 es
    in vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    out vec4 fragColor;
    uniform vec2 uResolution;
    uniform vec2 uSubpixelOffset;
    uniform vec2 uCenter;
    uniform float uScale;
    uniform float uTime;
    uniform float uBass;
    uniform float uMids;
    uniform float uHighs;
    uniform float uRms;
    uniform float uBeat;
    uniform float uEquationBass;
    uniform float uEquationMids;
    uniform float uEquationHighs;
    uniform float uEquationBeat;
    uniform float uMusicMotionBass;
    uniform float uMusicMotionMids;
    uniform float uMusicMotionHighs;
    uniform float uMusicMotionBeat;
    uniform float uMappedEquation;
    uniform float uFlow;
    uniform float uMotion;
    uniform float uFractalDimensional;
    uniform float uFractalTilt;
    uniform float uFractalDepthSpeed;
    uniform float uFractalPerspective;
    uniform float uFractalSlice;
    uniform float uFractalLighting;
    uniform float uFractalAudioDepth;
    uniform float uEquationFolding;
    uniform float uEquationFold;
    uniform float uEquationWarp;
    uniform float uEquationFoldMotion;
    uniform float uEquationFoldOffset;
    uniform float uEquationWarpScale;
    uniform float uEquationFoldAudio;
    uniform float uCoreCStrength;
    uniform vec2 uCoreBias;
    uniform float uBarWidth;
    uniform float uBarGlow;
    uniform float uBarReflection;
    uniform float uBarMotion;
    uniform float uBarEcho;
    uniform float uBarGrid;
    uniform float uBarStyle;
    uniform float uRadialSize;
    uniform float uRadialGlow;
    uniform float uRadialWaves;
    uniform float uRadialTwist;
    uniform float uRadialSpokes;
    uniform float uRadialAtmosphere;
    uniform float uPulseJagged;
    uniform float uPulseTrail;
    uniform float uPulseDetail;
    uniform float uPulseSize;
    uniform float uBulbPower;
    uniform float uBulbWarp;
    uniform float uBulbDetail;
    uniform float uBulbAudio;
    uniform float uBulbOrbit;
    uniform float uBulbFold;
    uniform float uBulbGlow;
    uniform float uBulbCamera;
    uniform float uBulbYaw;
    uniform float uBulbPitch;
    uniform int uBulbSteps;
    uniform vec3 uBulbHotspots[3];
    uniform int uPulseEventCount;
    uniform float uPulseEventAge[16];
    uniform float uPulseEventStrength[16];
    uniform float uPulseEventBand[16];
    uniform float uPulseEventSeed[16];
    uniform float uRotation;
    uniform float uEquation;
    uniform float uFrequencyHue;
    uniform float uFrequencyColor;
    uniform int uFractalType;
    uniform int uVisualStyle;
    uniform float uSpectrum[64];
    uniform float uWaveform[64];
    uniform vec3 uCustom0;
    uniform vec3 uCustom1;
    uniform vec3 uCustom2;
    uniform vec3 uCustom3;
    uniform int uIterations;
    uniform int uPalette;
    uniform float uChromaKey;
    uniform float uChromaThreshold;
    uniform float uHdrExport;

    vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(6.2831853 * (c * t + d));
    }

    vec3 fourStopPalette(float t, vec3 shadow, vec3 field, vec3 accent, vec3 detail) {
      float position = fract(t) * 4.0;
      float blend = smoothstep(0.0, 1.0, fract(position));
      if (position < 1.0) return mix(shadow, field, blend);
      if (position < 2.0) return mix(field, accent, blend);
      if (position < 3.0) return mix(accent, detail, blend);
      return mix(detail, shadow, blend);
    }

    float hlgEncode(float linearLight) {
      const float a = 0.17883277;
      const float b = 0.28466892;
      const float c = 0.55991073;
      float value = clamp(linearLight, 0.0, 1.0);
      return value <= (1.0 / 12.0)
        ? sqrt(3.0 * value)
        : a * log(12.0 * value - b) + c;
    }

    vec3 encodeRec2020Hlg(vec3 displayColor) {
      vec3 linear709 = pow(max(displayColor, 0.0), vec3(2.2));
      linear709 = clamp((linear709 / (1.0 + .35 * linear709)) / .74074074, 0.0, 1.0);
      vec3 linear2020 = vec3(
        dot(linear709, vec3(.627404, .329283, .0433136)),
        dot(linear709, vec3(.069097, .919540, .0113612)),
        dot(linear709, vec3(.0163916, .0880132, .895595))
      );
      return vec3(hlgEncode(linear2020.r), hlgEncode(linear2020.g), hlgEncode(linear2020.b));
    }

    vec2 complexMultiply(vec2 a, vec2 b) {
      return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }

    vec2 complexDivide(vec2 numerator, vec2 denominator) {
      float denominatorLength = max(dot(denominator, denominator), 0.00000001);
      return vec2(
        numerator.x * denominator.x + numerator.y * denominator.y,
        numerator.y * denominator.x - numerator.x * denominator.y
      ) / denominatorLength;
    }

    vec3 palette(float t) {
      if (uPalette == 0) {
        return fourStopPalette(t,
          vec3(.035,.067,.145), vec3(.125,.275,.430),
          vec3(.390,.335,.555), vec3(.420,.660,.710));
      }
      if (uPalette == 1) {
        return fourStopPalette(t,
          vec3(.075,.043,.055), vec3(.300,.130,.145),
          vec3(.610,.315,.220), vec3(.790,.585,.345));
      }
      if (uPalette == 2) {
        return fourStopPalette(t,
          vec3(.025,.090,.100), vec3(.070,.280,.285),
          vec3(.250,.465,.380), vec3(.555,.680,.500));
      }
      if (uPalette == 3) {
        return fourStopPalette(t,
          vec3(.030,.040,.060), vec3(.145,.175,.215),
          vec3(.350,.390,.435), vec3(.680,.705,.730));
      }
      float customPosition = fract(t) * 4.0;
      if (customPosition < 1.0) return mix(uCustom0, uCustom1, customPosition);
      if (customPosition < 2.0) return mix(uCustom1, uCustom2, customPosition - 1.0);
      if (customPosition < 3.0) return mix(uCustom2, uCustom3, customPosition - 2.0);
      return mix(uCustom3, uCustom0, customPosition - 3.0);
    }

    float spectrumAt(float position) {
      float samplePosition = clamp(position, 0.0, .9999) * 63.0;
      int first = int(floor(samplePosition));
      int second = min(63, first + 1);
      return mix(uSpectrum[first], uSpectrum[second], fract(samplePosition));
    }

    float waveformAt(float position) {
      float samplePosition = clamp(position, 0.0, .9999) * 63.0;
      int first = int(floor(samplePosition));
      int second = min(63, first + 1);
      return mix(uWaveform[first], uWaveform[second], fract(samplePosition));
    }

    float sourceRingRadius(float phase, float lane) {
      return .075 + .050 * lane + .032 * phase;
    }

    float expandingWave(float radius, float phase, float sharpness, float lane) {
      float waveRadius = sourceRingRadius(phase, lane);
      float life = pow(1.0 - phase, 1.25);
      float core = exp(-abs(radius - waveRadius) * sharpness * 1.32);
      float innerRidge = exp(-abs(radius - (waveRadius - .010)) * sharpness * 1.58);
      float outerRidge = exp(-abs(radius - (waveRadius + .009)) * sharpness * 1.68);
      return (core + (innerRidge * .23 + outerRidge * .18) * uPulseDetail) * life;
    }

    float jaggedProfile(float angle, float time, float broad, float medium, float fine) {
      return .56 * sin(angle * broad + time * .83)
        + .29 * sin(angle * medium - time * 1.17)
        + .15 * sin(angle * fine + time * 1.61);
    }

    float sourceRingTrail(float radius, float phase, float width, float lane) {
      float sourceRadius = sourceRingRadius(phase, lane);
      float behind = sourceRadius - radius;
      float separated = smoothstep(0.0, width * .18, behind);
      float trailBody = step(0.0, behind) * separated * exp(-behind / max(.001, width)) * pow(1.0 - phase, .72);
      float contour = pow(.5 + .5 * cos(behind * (510.0 + lane * 95.0) - uTime * (.72 + lane * .16)), 9.0);
      float fineContour = pow(.5 + .5 * cos(behind * (910.0 + lane * 120.0) + uTime * .38), 14.0);
      float detailMask = mix(1.0, .16 + .70 * contour + .24 * fineContour, clamp(uPulseDetail, 0.0, 1.0));
      return trailBody * detailMask;
    }

    vec3 musicEmittedWaves(float radius, float angle) {
      vec3 waves = vec3(0.0);
      float frequencyShift = uFrequencyHue * uFrequencyColor;
      for (int eventIndex = 0; eventIndex < 16; eventIndex++) {
        if (eventIndex >= uPulseEventCount) break;
        float age = uPulseEventAge[eventIndex];
        float strength = uPulseEventStrength[eventIndex];
        float band = uPulseEventBand[eventIndex];
        float eventActive = step(0.0, age);
        float travelSpeed = .27;
        float palettePosition = .12;
        float eventJagged = jaggedProfile(angle, uTime, 11.0, 19.0, 31.0);
        if (band > .5 && band < 1.5) {
          travelSpeed = .23;
          palettePosition = .47;
          eventJagged = jaggedProfile(angle, uTime * 1.08, 23.0, 41.0, 67.0);
        } else if (band >= 1.5) {
          travelSpeed = .20;
          palettePosition = .82;
          eventJagged = jaggedProfile(angle, uTime * 1.22, 37.0, 73.0, 109.0);
        }
        float displacedRadius = radius - eventJagged * uPulseJagged * (.002 + .017 * strength);
        float waveRadius = .090 + band * .050 + max(0.0, age) * travelSpeed;
        float sharpness = 58.0 + 24.0 * strength;
        float waveCore = exp(-abs(displacedRadius - waveRadius) * sharpness);
        float echo1 = exp(-abs(displacedRadius - (waveRadius - .014)) * sharpness * 1.14);
        float echo2 = exp(-abs(displacedRadius - (waveRadius - .027)) * sharpness * 1.22);
        float echo3 = exp(-abs(displacedRadius - (waveRadius - .041)) * sharpness * 1.30);
        float detailedCore = waveCore + (echo1 * .31 + echo2 * .23 + echo3 * .16) * uPulseDetail;
        float behind = waveRadius - displacedRadius;
        float trailContour = pow(.5 + .5 * cos(behind * (430.0 + band * 90.0) - age * 4.2), 10.0);
        float waveTrail = step(0.0, behind)
          * smoothstep(0.0, .008, behind)
          * exp(-behind * 25.0)
          * mix(1.0, .14 + .86 * trailContour, clamp(uPulseDetail, 0.0, 1.0))
          * .13 * uPulseTrail;
        float distanceFade = 1.0 - smoothstep(.56, .92, waveRadius);
        float timeFade = exp(-max(0.0, age) * .78);
        waves += palette(palettePosition + frequencyShift)
          * (detailedCore + waveTrail)
          * eventActive * distanceFade * timeFade
          * (.13 + .64 * strength);
      }
      return waves;
    }

    mat2 bulbRotation(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    float bulbDirectionalHotspot(vec3 direction, vec3 origin, float sharpness) {
      return pow(clamp(.5 + .5 * dot(direction, origin), 0.0, 1.0), sharpness);
    }

    float localizedBulbDeformation(vec3 point) {
      vec3 direction = point / max(length(point), .0001);
      float bassRegion = bulbDirectionalHotspot(direction, uBulbHotspots[0], 13.0) * uEquationBass;
      float midRegion = bulbDirectionalHotspot(direction, uBulbHotspots[1], 16.0) * uEquationMids;
      float highRegion = bulbDirectionalHotspot(direction, uBulbHotspots[2], 20.0) * uEquationHighs;
      vec3 beatOrigin = normalize(uBulbHotspots[0] - uBulbHotspots[1] + uBulbHotspots[2] + vec3(.001));
      float beatRegion = bulbDirectionalHotspot(direction, beatOrigin, 24.0) * uEquationBeat;
      float breathing = .72 + .28 * sin(uTime * (1.35 + .55 * uMotion)
        + dot(direction, vec3(2.7, 4.1, 3.3)));
      return uBulbAudio * breathing
        * (.0090 * bassRegion + .0070 * midRegion + .0045 * highRegion + .0120 * beatRegion);
    }

    float bulbHash(float seed) {
      return fract(sin(seed * 127.1 + 311.7) * 43758.5453123);
    }

    vec3 bulbEventDirection(float seed) {
      float vertical = bulbHash(seed + 2.13) * 2.0 - 1.0;
      float angle = bulbHash(seed + 8.71) * 6.2831853;
      float horizontal = sqrt(max(0.0, 1.0 - vertical * vertical));
      return vec3(horizontal * cos(angle), vertical, horizontal * sin(angle));
    }

    vec3 localizedBulbPulseLight(vec3 point, float frequencyShift) {
      vec3 direction = point / max(length(point), .0001);
      vec3 pulseLight = vec3(0.0);
      for (int eventIndex = 0; eventIndex < 16; eventIndex++) {
        if (eventIndex >= uPulseEventCount) break;
        float age = uPulseEventAge[eventIndex];
        float strength = uPulseEventStrength[eventIndex];
        float band = uPulseEventBand[eventIndex];
        float seed = uPulseEventSeed[eventIndex] + band * 17.31;
        vec3 origin = bulbEventDirection(seed);
        float surfaceDistance = length(direction - origin);
        float waveRadius = .035 + max(0.0, age) * (.30 + band * .035);
        float sharpness = 25.0 + band * 5.0;
        float wave = exp(-abs(surfaceDistance - waveRadius) * sharpness);
        float behind = waveRadius - surfaceDistance;
        float trail = step(0.0, behind) * exp(-behind * 7.5)
          * (.28 + .72 * pow(.5 + .5 * cos(behind * (58.0 + band * 11.0) - age * 2.2), 6.0));
        float sourceFlash = exp(-surfaceDistance * 23.0) * exp(-max(0.0, age) * 2.8);
        float life = exp(-max(0.0, age) * .62)
          * (1.0 - smoothstep(1.72, 2.02, waveRadius));
        float colorPosition = .10 + band * .34 + frequencyShift + seed * .013;
        pulseLight += palette(colorPosition)
          * (wave + trail * .24 + sourceFlash * 1.35)
          * life * strength;
      }
      return pulseLight * uBulbAudio;
    }

    float mandelbulbDistance(vec3 point) {
      // Mandelbulb azimuth wraps at -PI/+PI. Fractional powers turn that
      // harmless coordinate wrap into a visible split, so recurrence power
      // stays integral and music deforms the domain in Cartesian space.
      float power = floor(clamp(uBulbPower, 2.0, 10.0) + .5);
      float foldAmount = clamp(uBulbFold + (.10 * uEquationMids + .07 * uEquationBeat) * uBulbAudio, 0.0, 1.0);
      float musicWarp = uBulbAudio * (
        .0100 * uEquationBass
        + .0080 * uEquationMids
        + .0060 * uEquationHighs
        + .0120 * uEquationBeat
      );
      vec3 recurrenceWarp = vec3(
        sin(point.y * 3.1 + point.z * 1.7 + uTime * .37),
        sin(point.z * 3.7 + point.x * 1.3 - uTime * .31),
        sin(point.x * 3.3 + point.y * 1.9 + uTime * .29)
      );
      recurrenceWarp += .35 * vec3(
        sin(point.z * 5.1 - point.y * 2.3 - uTime * .23),
        sin(point.x * 4.7 - point.z * 2.1 + uTime * .27),
        sin(point.y * 4.9 - point.x * 2.5 - uTime * .19)
      );
      vec3 recurrencePoint = point + recurrenceWarp * (musicWarp + uBulbWarp * .018);
      vec3 z = recurrencePoint;
      float derivative = 1.0;
      float radius = 0.0;
      int detailIterations = 5 + int(floor(clamp(uBulbDetail, 0.0, 1.0) * 6.0));
      for (int iteration = 0; iteration < 12; iteration++) {
        if (iteration >= detailIterations) break;
        radius = length(z);
        if (radius > 3.2) break;
        float safeRadius = max(radius, 0.00001);
        float theta = acos(clamp(z.z / safeRadius, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        float radiusPower = pow(safeRadius, power);
        derivative = pow(safeRadius, power - 1.0) * power * derivative + 1.0;
        theta *= power;
        phi *= power;
        z = radiusPower * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + recurrencePoint;
        vec3 folded = abs(z) - vec3(.16 + .10 * sin(uTime * .21), .12, .18);
        z = mix(z, folded, foldAmount * .32);
      }
      float distanceEstimate = .5 * log(max(radius, 0.00001)) * radius / max(derivative, 0.00001);
      return distanceEstimate - localizedBulbDeformation(point);
    }

    vec3 mandelbulbNormal(vec3 point) {
      float epsilon = .0018;
      vec2 offset = vec2(epsilon, 0.0);
      return normalize(vec3(
        mandelbulbDistance(point + offset.xyy) - mandelbulbDistance(point - offset.xyy),
        mandelbulbDistance(point + offset.yxy) - mandelbulbDistance(point - offset.yxy),
        mandelbulbDistance(point + offset.yyx) - mandelbulbDistance(point - offset.yyx)
      ));
    }

    float mandelbulbOcclusion(vec3 point, vec3 normal) {
      float occlusion = 0.0;
      float weight = 1.0;
      for (int sampleIndex = 1; sampleIndex <= 4; sampleIndex++) {
        float distanceAlongNormal = .018 * float(sampleIndex);
        occlusion += max(0.0, distanceAlongNormal - mandelbulbDistance(point + normal * distanceAlongNormal)) * weight;
        weight *= .62;
      }
      return clamp(1.0 - occlusion * 6.2, .12, 1.0);
    }

    vec3 renderMandelbulb(vec2 uv, float frequencyShift) {
      float idleMotion = .08 + .22 * uMotion;
      float orbitAngle = uBulbYaw + uTime * uBulbOrbit * idleMotion
        + sin(uTime * .27) * .06 * uEquationMids * uBulbAudio;
      float pitch = clamp(uBulbPitch + sin(uTime * .19) * .040 * uEquationMids * uBulbAudio, -1.25, 1.25);
      float cameraDistance = uBulbCamera * (1.0 - .035 * uEquationBass * uBulbAudio - .018 * uEquationBeat * uBulbAudio);
      vec3 rayOrigin = cameraDistance * vec3(cos(pitch) * sin(orbitAngle), sin(pitch), cos(pitch) * cos(orbitAngle));
      vec3 target = vec3(0.0, -.035 + .035 * uEquationBass * uBulbAudio, 0.0);
      vec3 forward = normalize(target - rayOrigin);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 rayDirection = normalize(forward * 1.72 + right * uv.x + up * uv.y);

      float travel = 0.0;
      float closestDistance = 10.0;
      float hit = 0.0;
      for (int stepIndex = 0; stepIndex < 192; stepIndex++) {
        if (stepIndex >= uBulbSteps) break;
        vec3 point = rayOrigin + rayDirection * travel;
        float distanceToSurface = mandelbulbDistance(point);
        closestDistance = min(closestDistance, abs(distanceToSurface));
        float threshold = .00075 * (1.0 + travel * .12);
        if (distanceToSurface < threshold) {
          hit = 1.0;
          break;
        }
        travel += max(distanceToSurface * .78, .00055);
        if (travel > 8.0) break;
      }

      float skyGradient = .5 + .5 * rayDirection.y;
      float nebula = pow(max(0.0, dot(rayDirection, normalize(vec3(-.45, .28, -.84)))), 5.0);
      float starNoise = fract(sin(dot(floor((rayDirection.xy + rayDirection.z) * 420.0), vec2(12.9898, 78.233))) * 43758.5453);
      float stars = pow(starNoise, 46.0) * (.16 + .84 * uHighs);
      vec3 background = palette(.58 + skyGradient * .18 + frequencyShift + uTime * .002)
        * (.006 + .022 * nebula + .012 * uRms);
      background += palette(.12 + frequencyShift) * stars * .32;
      if (hit < .5) {
        float aura = exp(-closestDistance * (18.0 - 6.0 * uBulbGlow));
        return background + palette(.72 + frequencyShift + uTime * .008) * aura * (.025 + .075 * uBulbGlow + .07 * uEquationBeat);
      }

      vec3 point = rayOrigin + rayDirection * travel;
      vec3 normal = mandelbulbNormal(point);
      vec3 keyLight = normalize(vec3(-.7, .9, .45));
      vec3 fillLight = normalize(vec3(.65, -.18, -.72));
      float diffuse = max(0.0, dot(normal, keyLight));
      float fill = max(0.0, dot(normal, fillLight));
      float rim = pow(1.0 - max(0.0, dot(normal, -rayDirection)), 2.4);
      vec3 halfVector = normalize(keyLight - rayDirection);
      float specular = pow(max(0.0, dot(normal, halfVector)), 38.0 - 12.0 * uEquationHighs);
      float occlusion = mandelbulbOcclusion(point, normal);
      vec3 objectDirection = point / max(length(point), .0001);
      float seamlessField = dot(
        sin(point * vec3(3.7, 4.3, 5.1) + vec3(.4, 2.1, 4.2)),
        vec3(.085, .070, .055)
      ) + dot(
        cos(point.yzx * vec3(5.3, 3.1, 4.7) + vec3(1.7, .2, 3.4)),
        vec3(.050, .042, .036)
      );
      float directionalField = dot(objectDirection, normalize(vec3(.61, -.37, .70))) * .11;
      float surfaceBands = length(point) * (.52 + .12 * uEquationHighs)
        + seamlessField + directionalField + uTime * uFlow * .018 + frequencyShift;
      vec3 surface = palette(surfaceBands);
      vec3 secondary = palette(surfaceBands + .31 + .08 * uEquationMids);
      vec3 color = surface * (.12 + diffuse * 1.05 + fill * .28) * occlusion;
      color += secondary * rim * (.18 + .42 * uBulbGlow + .12 * uEquationHighs);
      color += vec3(.88, .96, 1.0) * specular * (.22 + .75 * uBulbGlow);
      color += palette(surfaceBands + .58) * (.035 * uEquationBass + .055 * uEquationBeat) * uBulbAudio;
      color += localizedBulbPulseLight(point, frequencyShift) * (.18 + .52 * uBulbGlow);
      float fog = 1.0 - exp(-travel * .045);
      return mix(color, background, fog);
    }

    float mainframeHash21(vec2 point) {
      point = fract(point * vec2(123.34, 456.21));
      point += dot(point, point + 45.32);
      return fract(point.x * point.y);
    }

    float mainframeNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      return mix(
        mix(mainframeHash21(cell), mainframeHash21(cell + vec2(1.0, 0.0)), local.x),
        mix(mainframeHash21(cell + vec2(0.0, 1.0)), mainframeHash21(cell + vec2(1.0)), local.x),
        local.y
      );
    }

    vec3 mainframeNeonColor(float position) {
      vec3 source = palette(position);
      float luminance = dot(source, vec3(.2126, .7152, .0722));
      return max(vec3(0.0), vec3(luminance) + (source - vec3(luminance)) * 1.72) * 1.82;
    }

    float mainframeTerrainHeight(vec2 position, float bassDrive, float midDrive) {
      float x = position.x;
      float z = position.y;
      float rolling = sin(x * .54 + sin(z * .19) * 1.6) * .24;
      rolling += sin(x * 1.17 - z * .21) * .13;
      rolling += sin(x * 2.31 + z * .08) * .055;
      float ridge = pow(.5 + .5 * sin(x * .39 + z * .27 + sin(z * .085) * 2.1), 5.0) * .48;
      float centerPeak = exp(-length(vec2(x * .19, (z - 14.0) * .15))) * 3.15;
      float leftPeak = exp(-length(vec2((x + 8.6) * .34, (z - 11.0) * .21))) * 1.55;
      float rightPeak = exp(-length(vec2((x - 8.2) * .38, (z - 10.5) * .22))) * 1.40;
      float audioRelief = sin(x * 1.8 + z * .42 - uTime * .45) * (.035 * midDrive);
      return .08 + rolling + ridge + centerPeak + leftPeak + rightPeak + audioRelief + bassDrive * .035;
    }

    float mainframeSdBox(vec2 point, vec2 bounds) {
      vec2 distance = abs(point) - bounds;
      return length(max(distance, 0.0)) + min(max(distance.x, distance.y), 0.0);
    }

    vec3 renderMainframeLandscape(vec2 screenUv, float frequencyShift) {
      float outputAspect = uResolution.x / max(1.0, uResolution.y);
      vec2 view = (screenUv - .5) * vec2(outputAspect, 1.0);
      float bassDrive = pow(clamp(uEquationBass * 1.45 + uBass * .68 + uRms * .16, 0.0, 1.0), .62);
      float midDrive = pow(clamp(uEquationMids * 1.42 + uMids * .65 + uRms * .12, 0.0, 1.0), .65);
      float highDrive = pow(clamp(uEquationHighs * 1.40 + uHighs * .64, 0.0, 1.0), .68);
      float beatDrive = pow(clamp(max(uEquationBeat, uBeat) * 1.22, 0.0, 1.0), .72);
      vec3 lowColor = mainframeNeonColor(.82 + frequencyShift);
      vec3 midColor = mainframeNeonColor(.46 + frequencyShift);
      vec3 highColor = mainframeNeonColor(.66 + frequencyShift);

      float cameraSway = sin(uTime * .085) * (.10 + .16 * uMotion) + sin(uTime * .031) * .12;
      vec3 rayOrigin = vec3(cameraSway, 2.05 + beatDrive * .045, -4.2);
      vec3 rayDirection = normalize(vec3(view.x * 1.18, view.y - .075, 1.32));

      float skyFade = smoothstep(-.20, .55, rayDirection.y);
      vec3 color = vec3(.0015, .004, .011);
      color += mix(lowColor, highColor, skyFade) * (.012 + .024 * skyFade + .026 * uRms);
      float horizonGlow = exp(-abs(rayDirection.y) * 23.0);
      color += midColor * horizonGlow * (.05 + .12 * midDrive);

      vec2 starCell = floor(screenUv * vec2(420.0, 240.0));
      float starRandom = mainframeHash21(starCell);
      float star = pow(starRandom, 92.0) * smoothstep(.52, .68, screenUv.y);
      float starPulse = .55 + .45 * sin(uTime * (1.0 + starRandom * 2.6) + starRandom * 30.0);
      color += mix(vec3(.56, .75, 1.0), highColor, starRandom) * star * starPulse * (.38 + .52 * highDrive);
      vec2 nebulaPoint = vec2(view.x * .62 + view.y * .34, view.y * 1.9);
      float nebulaBand = exp(-abs(nebulaPoint.x - .17) * 5.2) * smoothstep(.57, .96, screenUv.y);
      float nebulaDust = mainframeNoise(nebulaPoint * 6.0 + vec2(uTime * .004, 0.0));
      color += mix(lowColor, vec3(.32, .40, .72), .55) * nebulaBand * nebulaDust * .028;

      float skylineX = (screenUv.x - .5) * 96.0;
      float towerCell = floor(skylineX);
      float towerRandom = mainframeHash21(vec2(towerCell, 17.0));
      float towerLocal = abs(fract(skylineX) - .5);
      float towerHeight = .018 + pow(towerRandom, 2.4) * .15;
      towerHeight *= .60 + .65 * spectrumAt(fract(towerCell * .071));
      float towerBody = (1.0 - smoothstep(.30, .47, towerLocal))
        * step(.535, screenUv.y) * step(screenUv.y, .535 + towerHeight);
      float towerEdge = smoothstep(.35, .47, towerLocal) * towerBody;
      float towerScan = pow(.5 + .5 * cos((screenUv.y - .535) * 430.0 - uTime * (2.0 + 4.0 * uFlow)), 14.0);
      color += lowColor * towerBody * (.07 + .15 * towerScan + .10 * highDrive);
      color += highColor * towerEdge * (.17 + .30 * highDrive);

      float summitY = clamp((screenUv.y - .535) / .255, 0.0, 1.0);
      float summitHalfWidth = .155 * pow(1.0 - summitY, .78) + .006;
      float summitX = abs(screenUv.x - .5);
      float summitMask = step(.535, screenUv.y) * step(screenUv.y, .79)
        * (1.0 - smoothstep(summitHalfWidth - .006, summitHalfWidth, summitX));
      float summitEdge = exp(-abs(summitX - summitHalfWidth) * 720.0) * step(.535, screenUv.y) * step(screenUv.y, .79);
      float summitContours = pow(.5 + .5 * cos((screenUv.y - .535) * 198.0 + summitX * 48.0), 24.0);
      float summitRibs = pow(.5 + .5 * cos(summitX / max(.008, summitHalfWidth) * 25.0), 28.0);
      color += mix(lowColor, highColor, summitY) * summitMask
        * (.018 + .16 * summitContours + .11 * summitRibs) * (1.0 + midDrive * .55);
      color += highColor * summitEdge * (.20 + .42 * beatDrive);
      float summitBeacon = exp(-abs(screenUv.x - .5) * 760.0)
        * step(.785, screenUv.y) * step(screenUv.y, .86);
      color += lowColor * summitBeacon * (.17 + .52 * beatDrive);

      float travel = .35;
      float hit = 0.0;
      vec3 terrainPoint = rayOrigin;
      for (int march = 0; march < 72; march++) {
        terrainPoint = rayOrigin + rayDirection * travel;
        float height = mainframeTerrainHeight(terrainPoint.xz, bassDrive, midDrive);
        float clearance = terrainPoint.y - height;
        if (clearance < .006) {
          hit = 1.0;
          break;
        }
        travel += clamp(clearance * .34, .03, .30);
        if (travel > 38.0) break;
      }

      if (hit > .5) {
        for (int refine = 0; refine < 4; refine++) {
          float height = mainframeTerrainHeight(terrainPoint.xz, bassDrive, midDrive);
          travel -= (terrainPoint.y - height) * .36;
          terrainPoint = rayOrigin + rayDirection * travel;
        }
        float epsilon = .035;
        float height = mainframeTerrainHeight(terrainPoint.xz, bassDrive, midDrive);
        float heightX = mainframeTerrainHeight(terrainPoint.xz + vec2(epsilon, 0.0), bassDrive, midDrive);
        float heightZ = mainframeTerrainHeight(terrainPoint.xz + vec2(0.0, epsilon), bassDrive, midDrive);
        vec3 normal = normalize(vec3(height - heightX, epsilon, height - heightZ));
        float diffuse = .22 + .78 * max(0.0, dot(normal, normalize(vec3(-.45, .86, -.28))));
        float rim = pow(1.0 - max(0.0, dot(normal, -rayDirection)), 2.2);

        float distanceFade = exp(-travel * .038);
        vec3 terrainColor = vec3(.014, .034, .088) * (.72 + diffuse * 1.02);
        terrainColor += mix(lowColor, highColor, clamp(.22 + height * .16, 0.0, 1.0))
          * (.035 + diffuse * .042);
        terrainColor += mix(lowColor, midColor, clamp(height * .22, 0.0, 1.0)) * rim * .28;

        float gridX = pow(.5 + .5 * cos(terrainPoint.x * 6.2831853), 26.0);
        float gridZ = pow(.5 + .5 * cos(terrainPoint.z * 6.2831853), 24.0);
        float majorX = pow(.5 + .5 * cos(terrainPoint.x * 1.5707963), 42.0);
        float majorZ = pow(.5 + .5 * cos(terrainPoint.z * 1.5707963), 40.0);
        float contours = pow(.5 + .5 * cos(height * 15.5), 34.0);
        float wireGrid = max(max(gridX, gridZ) * .34, max(majorX, majorZ) * .78);
        terrainColor += lowColor * wireGrid * (.68 + .56 * highDrive) * distanceFade;
        terrainColor += midColor * contours * (.30 + .36 * midDrive) * distanceFade;

        float centerPath = exp(-abs(terrainPoint.x - sin(terrainPoint.z * .18) * 1.15) * 2.8);
        float leftPath = exp(-abs(terrainPoint.x + 4.4 + sin(terrainPoint.z * .24 + 1.7) * 1.5) * 3.2);
        float rightPath = exp(-abs(terrainPoint.x - 4.8 - sin(terrainPoint.z * .20 + .8) * 1.25) * 3.0);
        float packetClock = uTime * (4.0 + 7.0 * uFlow + 3.5 * bassDrive);
        float centerPackets = pow(.5 + .5 * cos(terrainPoint.z * 4.7 - packetClock), 17.0);
        float sidePackets = pow(.5 + .5 * cos(terrainPoint.z * 5.6 - packetClock * 1.18), 20.0);
        terrainColor += lowColor * centerPath * (.44 + 1.28 * centerPackets) * (1.0 + bassDrive * .82);
        terrainColor += midColor * leftPath * (.36 + 1.24 * sidePackets) * (1.0 + midDrive * .78);
        terrainColor += highColor * rightPath * (.36 + 1.24 * sidePackets) * (1.0 + highDrive * .80);

        vec2 dataCell = floor(vec2(terrainPoint.x * 2.2, (terrainPoint.z - uTime * (2.2 + 3.0 * uFlow)) * 2.6));
        vec2 dataLocal = fract(vec2(terrainPoint.x * 2.2, (terrainPoint.z - uTime * (2.2 + 3.0 * uFlow)) * 2.6));
        float bitRandom = mainframeHash21(dataCell);
        float bit = step(.58, bitRandom)
          * smoothstep(.42, .30, abs(dataLocal.x - .5))
          * smoothstep(.38, .25, abs(dataLocal.y - .5));
        float dataField = max(centerPath, max(leftPath, rightPath));
        terrainColor += mix(lowColor, highColor, bitRandom) * bit * dataField * (.34 + .72 * highDrive);

        for (int eventIndex = 0; eventIndex < 16; eventIndex++) {
          if (eventIndex >= uPulseEventCount) break;
          float age = max(0.0, uPulseEventAge[eventIndex]);
          float strength = uPulseEventStrength[eventIndex];
          float band = uPulseEventBand[eventIndex];
          float radius = 1.2 + age * (3.7 + band * .55);
          float ring = exp(-abs(length(terrainPoint.xz - vec2(0.0, 3.0)) - radius) * 3.4);
          terrainColor += palette(.08 + band * .34 + frequencyShift) * ring * strength * exp(-age * .65) * .55;
        }

        float peakBeacon = exp(-abs(terrainPoint.x) * 2.2) * exp(-abs(terrainPoint.z - 14.0) * .8);
        terrainColor += highColor * peakBeacon * (.34 + .86 * beatDrive);
        float fog = 1.0 - exp(-travel * .055);
        vec3 fogColor = mix(vec3(.004, .010, .026), midColor * .09, horizonGlow);
        color = mix(terrainColor, fogColor, fog) + terrainColor * distanceFade * .28;
      }

      float rainSide = smoothstep(.10, .015, screenUv.x) + smoothstep(.90, .985, screenUv.x);
      vec2 rainCell = floor(vec2(screenUv.x * 150.0, (screenUv.y + uTime * (.10 + .22 * uFlow)) * 94.0));
      vec2 rainLocal = fract(vec2(screenUv.x * 150.0, (screenUv.y + uTime * (.10 + .22 * uFlow)) * 94.0));
      float rainRandom = mainframeHash21(vec2(rainCell.x, floor(rainCell.y * .13)));
      float rainGlyph = step(.42, rainRandom) * smoothstep(.40, .25, abs(rainLocal.x - .5))
        * smoothstep(.43, .26, abs(rainLocal.y - .5));
      color += mix(lowColor, highColor, rainRandom) * rainGlyph * rainSide * (.20 + .52 * highDrive);

      float leftPanel = exp(-abs(mainframeSdBox((screenUv - vec2(.205, .795)) * vec2(outputAspect, 1.0), vec2(.145, .078))) * 520.0);
      float rightPanel = exp(-abs(mainframeSdBox((screenUv - vec2(.805, .805)) * vec2(outputAspect, 1.0), vec2(.13, .088))) * 520.0);
      float panelMask = leftPanel + rightPanel;
      color += lowColor * panelMask * (.20 + .24 * highDrive);
      float panelWaveX = clamp((screenUv.x - .105) / .20, 0.0, 1.0);
      float panelWave = waveformAt(panelWaveX) * (.020 + .022 * uRms);
      float panelTrace = exp(-abs(screenUv.y - (.795 + panelWave)) * 390.0)
        * step(.105, screenUv.x) * step(screenUv.x, .305)
        * step(.735, screenUv.y) * step(screenUv.y, .855);
      color += midColor * panelTrace * (.24 + .62 * midDrive);
      float panelRows = pow(.5 + .5 * cos(screenUv.y * 520.0), 20.0)
        * step(.725, screenUv.x) * step(screenUv.x, .885)
        * step(.75, screenUv.y) * step(screenUv.y, .86);
      color += highColor * panelRows * (.035 + .11 * highDrive);

      vec2 reticlePoint = (screenUv - vec2(.69, .72)) * vec2(outputAspect, 1.0);
      float reticleRadius = length(reticlePoint);
      float reticle = exp(-abs(reticleRadius - .045 - beatDrive * .004) * 440.0)
        + exp(-abs(reticleRadius - .027) * 390.0) * .55;
      float reticleCross = exp(-abs(reticlePoint.x) * 700.0) * step(abs(reticlePoint.y), .062)
        + exp(-abs(reticlePoint.y) * 700.0) * step(abs(reticlePoint.x), .062);
      color += lowColor * (reticle + reticleCross * .24) * (.14 + .34 * beatDrive);

      float scanline = pow(.5 + .5 * cos(screenUv.y * uResolution.y * 3.1415926), 26.0);
      color *= .985 + scanline * .015;
      return color / (1.0 + color * .22);
    }

    void main() {
      vec2 sampleCoord = gl_FragCoord.xy + uSubpixelOffset;
      vec2 p = (sampleCoord - .5 * uResolution.xy) / uResolution.y;
      float cs = cos(uRotation);
      float sn = sin(uRotation);
      p = mat2(cs, -sn, sn, cs) * p;
      float breathing = sin(uTime * (.72 + .12 * uEquationMids)) * .009 * uMotion;
      float pulse = 1.0 - .035 * uEquationBeat * uMotion - .012 * uEquationBass * uMotion + breathing;
      vec3 dimensionalPoint = vec3(p, 0.0);
      vec2 dimensionalPlane = p;
      float dimensionalLight = 1.0;
      float depthSheen = 0.0;
      if (uFractalDimensional > .5) {
        float depthAudio = 1.0 + uFractalAudioDepth * (.12 * uEquationBass + .09 * uEquationMids + .05 * uEquationBeat);
        float depthPhase = uTime * uFractalDepthSpeed
          * (.55 + .14 * uEquationMids * uFractalAudioDepth);
        float tiltAmount = uFractalTilt * depthAudio;
        float tiltX = sin(depthPhase) * tiltAmount * .82;
        float tiltY = cos(depthPhase * .83) * tiltAmount * .68;
        float cosY = cos(tiltY);
        float sinY = sin(tiltY);
        dimensionalPoint = vec3(
          cosY * dimensionalPoint.x + sinY * dimensionalPoint.z,
          dimensionalPoint.y,
          -sinY * dimensionalPoint.x + cosY * dimensionalPoint.z
        );
        float cosX = cos(tiltX);
        float sinX = sin(tiltX);
        dimensionalPoint = vec3(
          dimensionalPoint.x,
          cosX * dimensionalPoint.y - sinX * dimensionalPoint.z,
          sinX * dimensionalPoint.y + cosX * dimensionalPoint.z
        );
        float perspectiveDepth = max(.42,
          1.0 + dimensionalPoint.z * uFractalPerspective * 1.65);
        dimensionalPlane = dimensionalPoint.xy / perspectiveDepth;
        vec2 sliceDirection = vec2(cos(depthPhase * 1.31), sin(depthPhase * 1.17));
        dimensionalPlane += dimensionalPoint.z * sliceDirection
          * uFractalSlice * (.22 + .08 * uEquationMids * uFractalAudioDepth);
        dimensionalLight = clamp(
          1.0 + dimensionalPoint.z * uFractalLighting,
          .65, 1.40
        );
        depthSheen = pow(clamp(.5 + dimensionalPoint.z, 0.0, 1.0), 3.0)
          * .10 * uFractalLighting;
      }
      vec2 c = uCenter + dimensionalPlane * uScale * pulse;
      float coreCScale = mix(.35, 1.65, uCoreCStrength);
      vec2 recurrenceC = c * coreCScale + uCoreBias;
      // Musical motion is kept separate from the slower equation/color
      // envelopes. It follows rhythmic contrast without turning each onset
      // into a full-frame brightness flash.
      vec2 musicalRecurrenceDrift = uEquation * vec2(
        (.010 * uMusicMotionBass + .006 * uMusicMotionBeat) * sin(uTime * .71),
        (.008 * uMusicMotionMids - .003 * uMusicMotionHighs) * cos(uTime * .89)
      );
      musicalRecurrenceDrift += uMappedEquation * vec2(
        .014 * sin(uTime * .79),
        .011 * cos(uTime * 1.03)
      );
      recurrenceC += musicalRecurrenceDrift;
      float frequencyShift = uFrequencyHue * uFrequencyColor;
      vec3 color = vec3(0.0);
      if (uVisualStyle == 0) {
      vec2 z = vec2(0.0);
      if (uFractalType == 5 || uFractalType == 18) z = c;
      else if (uFractalType == 14) z = vec2(.5, 0.0);
      else if (uFractalType == 17) z = vec2(1.0, 0.0);
      vec2 previousZ = vec2(0.0);
      vec2 dynamicC = recurrenceC;
      float minTrap = 100.0;
      float minAxis = 100.0;
      float convergenceHit = 0.0;
      int escapedAt = uIterations;

      float trapAngle = uTime * (.12 + .12 * uEquationHighs) * uMotion
        + .09 * uMusicMotionHighs;
      vec2 trapDir = vec2(cos(trapAngle), sin(trapAngle));
      vec2 equationMu = uEquation * vec2(
        (.070 * uEquationBass + .025 * uEquationBeat) * cos(uTime * .43)
          + .040 * uMusicMotionBass * sin(uTime * 1.13)
          + .018 * uMusicMotionBeat * cos(uTime * .83),
        .060 * uEquationMids * sin(uTime * .59)
          + .034 * uMusicMotionMids * cos(uTime * .97)
          + .014 * uMusicMotionHighs * sin(uTime * 1.71)
      );
      equationMu += uMappedEquation * vec2(
        .065 * cos(uTime * .73),
        .052 * sin(uTime * .91)
      );

      mat2 equationFoldRotation = mat2(1.0, 0.0, 0.0, 1.0);
      mat2 equationFoldInverse = mat2(1.0, 0.0, 0.0, 1.0);
      vec2 equationFoldOrigin = vec2(0.0);
      float effectiveEquationFold = 0.0;
      float effectiveEquationWarp = 0.0;
      if (uEquationFolding > .5) {
        float equationFoldPhase = uTime * uEquationFoldMotion
          * (.62 + .12 * uEquationMids * uEquationFoldAudio);
        float foldCs = cos(equationFoldPhase);
        float foldSn = sin(equationFoldPhase);
        equationFoldRotation = mat2(foldCs, -foldSn, foldSn, foldCs);
        equationFoldInverse = mat2(foldCs, foldSn, -foldSn, foldCs);
        equationFoldOrigin = uEquationFoldOffset * vec2(
          .30 + .045 * sin(equationFoldPhase * 1.17),
          .21 + .035 * cos(equationFoldPhase * .91)
        );
        // A fold is applied on every recurrence, so a linear UI mapping compounds
        // far too quickly. Perceptual curves keep the lower half useful while the
        // top end still reaches strongly mirrored and warped structures.
        float foldAudioSignal = uEquationFoldAudio
          * (.20 * uEquationBass + .14 * uEquationMids + .06 * uEquationBeat);
        float requestedFold = clamp(uEquationFold + foldAudioSignal * .55, 0.0, 1.0);
        float requestedWarp = clamp(uEquationWarp + foldAudioSignal * .65, 0.0, 1.5);
        effectiveEquationFold = pow(requestedFold, 1.7) * .16;
        effectiveEquationWarp = pow(requestedWarp / 1.5, 1.6) * .48;
      }

      for (int i = 0; i < 2400; i++) {
        if (i >= uIterations) break;
        vec2 baseZ = z;
        if (uEquationFolding > .5) {
          vec2 foldSpace = equationFoldRotation * baseZ;
          vec2 mirroredFold = abs(foldSpace) - equationFoldOrigin;
          foldSpace = mix(foldSpace, mirroredFold, effectiveEquationFold);
          float foldRadius2 = dot(foldSpace, foldSpace);
          vec2 nonlinearWarp = vec2(
            foldSpace.x * foldSpace.x - foldSpace.y * foldSpace.y,
            2.0 * foldSpace.x * foldSpace.y
          ) / (1.0 + foldRadius2);
          foldSpace += nonlinearWarp * effectiveEquationWarp * uEquationWarpScale * .32;
          baseZ = equationFoldInverse * foldSpace;
        }
        if (uFractalType == 3) baseZ = abs(baseZ);
        if (uFractalType == 4) baseZ.y = -baseZ.y;
        if (uFractalType == 10) baseZ = vec2(baseZ.x, -abs(baseZ.y));
        if (uFractalType == 11) baseZ = vec2(abs(baseZ.x), -baseZ.y);
        vec2 z2 = complexMultiply(baseZ, baseZ);
        if (uFractalType == 0) {
          vec2 z4 = complexMultiply(z2, z2);
          z = z4 + complexMultiply(equationMu, z2) + recurrenceC;
        }
        else if (uFractalType == 1) z = z2 + complexMultiply(equationMu, baseZ) * .28 + recurrenceC;
        else if (uFractalType == 2) {
          vec2 z3 = complexMultiply(z2, baseZ);
          z = z3 + complexMultiply(equationMu, z2) * .52 + recurrenceC;
        }
        else if (uFractalType == 3) z = z2 + complexMultiply(equationMu, baseZ) * .18 + recurrenceC;
        else if (uFractalType == 4) z = z2 + complexMultiply(equationMu, baseZ) * .22 + recurrenceC;
        else if (uFractalType == 5) {
          vec2 juliaK = vec2(-.745, .113) * coreCScale + uCoreBias + equationMu * .72;
          z = z2 + juliaK;
        }
        else if (uFractalType == 6) {
          vec2 z4 = complexMultiply(z2, z2);
          vec2 z5 = complexMultiply(z4, baseZ);
          z = z5 + complexMultiply(equationMu, z2) * .36 + recurrenceC;
        }
        else if (uFractalType == 7) {
          vec2 phoenixDistortion = vec2(-.5 + .05 * uEquationBass * uEquation, .035 * uEquationMids * uEquation);
          vec2 nextZ = z2 + recurrenceC
            + complexMultiply(phoenixDistortion, previousZ)
            + equationMu * .12;
          previousZ = baseZ;
          z = nextZ;
        }
        else if (uFractalType == 8) {
          z = vec2(abs(z2.x), z2.y) + recurrenceC + equationMu * .12;
        }
        else if (uFractalType == 9) {
          z = abs(z2) + recurrenceC + equationMu * .12;
        }
        else if (uFractalType == 10 || uFractalType == 11) {
          z = z2 + recurrenceC + equationMu * .12;
        }
        else if (uFractalType == 12) {
          vec2 magnetC = recurrenceC + equationMu * .12;
          vec2 numerator = z2 + magnetC - vec2(1.0, 0.0);
          vec2 denominator = 2.0 * baseZ + magnetC - vec2(2.0, 0.0);
          vec2 ratio = complexDivide(numerator, denominator);
          z = complexMultiply(ratio, ratio);
        }
        else if (uFractalType == 13) {
          vec2 magnetC = recurrenceC + equationMu * .10;
          vec2 cMinusOne = magnetC - vec2(1.0, 0.0);
          vec2 cMinusTwo = magnetC - vec2(2.0, 0.0);
          vec2 cProduct = complexMultiply(cMinusOne, cMinusTwo);
          vec2 z3 = complexMultiply(z2, baseZ);
          vec2 numerator = z3 + 3.0 * complexMultiply(cMinusOne, baseZ) + cProduct;
          vec2 denominator = 3.0 * z2 + 3.0 * complexMultiply(cMinusTwo, baseZ)
            + cProduct + vec2(1.0, 0.0);
          vec2 ratio = complexDivide(numerator, denominator);
          z = complexMultiply(ratio, ratio);
        }
        else if (uFractalType == 14) {
          vec2 lambda = recurrenceC + equationMu * .18;
          z = complexMultiply(lambda, complexMultiply(baseZ, vec2(1.0, 0.0) - baseZ));
        }
        else if (uFractalType == 15) {
          vec2 nextZ = z2 + previousZ + recurrenceC + equationMu * .10;
          previousZ = baseZ;
          z = nextZ;
        }
        else if (uFractalType == 16) {
          z = z2 + dynamicC + equationMu * .10;
          dynamicC = dynamicC * .5 + z;
        }
        else if (uFractalType == 17 || uFractalType == 18) {
          vec2 z3 = complexMultiply(z2, baseZ);
          vec2 correction = complexDivide(
            z3 - vec2(1.0, 0.0),
            3.0 * z2
          );
          vec2 relaxation = vec2(1.0 + .04 * uEquationBass * uEquation, .025 * uEquationMids * uEquation);
          z = baseZ - complexMultiply(relaxation, correction);
          if (uFractalType == 17) z += recurrenceC + equationMu * .08;
          else z += equationMu * .035;
          if (length(z - baseZ) < .00018) {
            convergenceHit = 1.0;
            escapedAt = i;
          }
        }
        else {
          vec2 z3 = complexMultiply(z2, baseZ);
          z = z3 + recurrenceC + complexMultiply(equationMu, z2) * .18;
        }
        minTrap = min(minTrap, abs(length(z) - (.72 + .06 * uEquationMids + .018 * sin(uTime * 1.7) * uMotion)));
        vec2 trapZ = vec2(dot(z, trapDir), dot(z, vec2(-trapDir.y, trapDir.x)));
        minAxis = min(minAxis, min(abs(trapZ.x), abs(trapZ.y)));
        if (convergenceHit > .5) break;
        if (dot(z, z) > 256.0) {
          escapedAt = i;
          break;
        }
      }

      if (convergenceHit > .5) {
        float rootAngle = atan(z.y, z.x) / 6.2831853 + .5;
        float convergenceBands = rootAngle + float(escapedAt) * (.028 + .008 * uEquationHighs)
          + uTime * uFlow * .018 + frequencyShift;
        float convergenceShade = .32 + .68 * exp(-float(escapedAt) * .026);
        color = palette(convergenceBands) * convergenceShade;
        color += palette(convergenceBands + .28) * (.10 + .16 * uEquationBeat + .10 * uEquationMids) * uMotion;
        color *= .74 + .44 * uRms + .12 * uEquationHighs;
      } else if (escapedAt < uIterations) {
        float smoothingPower = uFractalType == 0 ? 2.0
          : ((uFractalType == 2 || uFractalType == 19) ? 1.5849625
          : (uFractalType == 6 ? 2.3219281 : 1.0));
        float smoothIter = float(escapedAt) + 1.0 - log2(max(1.0, log2(length(z)))) / smoothingPower;
        float flow = uTime * uFlow * (.055 + .018 * uMotion) + uEquationBass * .035 * uMotion;
        float bands = smoothIter * (.035 + .010 * uEquationHighs) + flow + frequencyShift;
        color = palette(bands);
        float shade = .48 + .52 * tanh(smoothIter * .035);
        float boundary = pow(clamp(smoothIter / max(1.0, float(uIterations)), 0.0, 1.0), .32);
        float boundaryPulse = boundary * (.06 + .18 * uEquationBass + .10 * uEquationBeat) * uMotion;
        float trapGlow = exp(-26.0 * minTrap) * (.06 + (.14 + .06 * uMotion) * uEquationBass);
        float axisGlow = exp(-90.0 * minAxis) * (.020 + (.09 + .04 * uMotion) * uEquationHighs);
        color = color * shade + palette(bands + .22) * trapGlow + vec3(.5,.9,1.0) * axisGlow;
        color += palette(bands + .44) * boundaryPulse;
        if (uFractalType == 19) {
          float biomorphEdge = max(
            1.0 - step(10.0, abs(z.x)),
            1.0 - step(10.0, abs(z.y))
          );
          float biomorphOrbit = exp(-.55 * minAxis);
          float biomorph = clamp(.62 * biomorphEdge + .22 * biomorphOrbit, 0.0, .78);
          color = mix(color, palette(bands + .58) * (1.0 + .22 * uEquationHighs), biomorph);
        }
        color *= .76 + .46 * uRms + .14 * uEquationBass + .07 * uEquationBeat;
      } else {
        float radius = length(p);
        float angle = atan(p.y, p.x);
        float wavePhase = radius * (22.0 + 4.0 * uEquationHighs) + angle * 4.0 - uTime * (1.05 + 1.0 * uEquationMids);
        float bodyWave = pow(.5 + .5 * cos(wavePhase), 5.0);
        float counterWave = pow(.5 + .5 * sin(radius * 13.0 - angle * 4.0 + uTime * (.55 + .55 * uEquationBass)), 7.0);
        float bodyLevel = .012 + .10 * uRms + .045 * uEquationBass + .035 * uEquationBeat;
        float movingSheen = (bodyWave * (.035 + .13 * uEquationMids) + counterWave * .055 * uEquationHighs) * uMotion;
        float interiorTrap = .34 * exp(-15.0 * minTrap) + .14 * exp(-65.0 * minAxis);
        color = palette(.60 + radius * .20 + uTime * .018 + frequencyShift) * (bodyLevel + movingSheen);
        color += palette(.88 + angle * .08 + frequencyShift) * interiorTrap * (.035 + .07 * uEquationBass);
      }
      color *= dimensionalLight;
      color += palette(.18 + dimensionalPoint.z * .22 + frequencyShift) * depthSheen;
      }

      vec2 screenUv = sampleCoord / uResolution.xy;
      vec2 visualPoint = (sampleCoord - .5 * uResolution.xy) / uResolution.y;
      if (uVisualStyle == 1) {
        float style = floor(uBarStyle + .5);
        float warpedX = screenUv.x + sin(screenUv.y * 7.0 - uTime * (1.1 + uMids))
          * .004 * uBarMotion * (.25 + .75 * uMids);
        if (style > 2.5) {
          warpedX += sin(screenUv.x * 18.0 + uTime * (1.1 + uHighs)) * .009 * uBarMotion;
        }
        warpedX = clamp(warpedX, 0.0, .9999);
        float spectrum = spectrumAt(warpedX);
        float binPhase = fract(warpedX * 64.0);
        float cell = abs(fract(warpedX * 64.0) - .5);
        float columnEdge = clamp(.34 * uBarWidth, .14, .46);
        float column = 1.0 - smoothstep(columnEdge, min(.495, columnEdge + .10), cell);
        float softColumn = 1.0 - smoothstep(columnEdge, min(.5, columnEdge + .24), cell);
        float dance = 1.0 + sin(screenUv.x * 31.0 - uTime * (1.4 + uHighs)) * .10 * uBarMotion;
        vec3 rackColor = palette(screenUv.x * .82 + uFrequencyHue * .45 + uTime * .012) * (1.0 + .7 * spectrum);
        vec3 dataColor = palette(screenUv.x * .82 + .23 + frequencyShift);
        float scanGrid = pow(.5 + .5 * cos(screenUv.y * 104.0 + uTime * .09 * uBarMotion), 28.0)
          * (.008 + .04 * uHighs) * uBarGrid;
        color = palette(screenUv.y * .14 + frequencyShift) * (.006 + .042 * uRms + scanGrid);

        if (style < .5) {
          // MAINFRAME CITY: chassis, status LEDs, rooftop beacons, and a reflective machine-room floor.
          float baseline = .115;
          float rackIndex = floor(warpedX * 64.0);
          float idleRack = .14 + .11 * (.5 + .5 * sin(rackIndex * 2.37));
          float barHeight = idleRack + .47 * spectrum * dance;
          float barTop = baseline + barHeight;
          float body = column * smoothstep(baseline, baseline + .008, screenUv.y)
            * (1.0 - smoothstep(barTop - .012, barTop, screenUv.y));
          float bodySoft = softColumn * smoothstep(baseline - .02, baseline + .006, screenUv.y)
            * (1.0 - smoothstep(barTop, barTop + .055, screenUv.y));
          float rackRow = fract((screenUv.y - baseline) * 48.0);
          float chassis = (1.0 - smoothstep(.35, .48, abs(rackRow - .5))) * body;
          float rackEdge = max(softColumn - column, 0.0) * body;
          float ledNoise = .5 + .5 * sin(floor(warpedX * 64.0) * 17.13
            + floor((screenUv.y - baseline) * 48.0) * 5.71 + uTime * (3.0 + 8.0 * uHighs));
          float statusLed = step(.88 - .22 * uHighs, ledNoise) * chassis;
          float capGlow = softColumn * exp(-abs(screenUv.y - barTop) * (44.0 + 30.0 * spectrum));
          float localPeakX = (binPhase - .5) / 64.0;
          float beaconPulse = .55 + .45 * sin(uTime * (4.0 + 7.0 * uHighs) + floor(warpedX * 64.0));
          float beacon = exp(-length(vec2(localPeakX, screenUv.y - barTop - .012)) * 210.0)
            * beaconPulse * (.25 + .75 * spectrum);
          float belowFloor = baseline - screenUv.y;
          float reflectedHeight = .035 + barHeight * .24;
          float reflection = column * step(0.0, belowFloor)
            * (1.0 - smoothstep(reflectedHeight * .86, reflectedHeight, belowFloor));
          float floorMask = 1.0 - smoothstep(.0, baseline, screenUv.y);
          float floorRay = pow(.5 + .5 * cos((screenUv.x - .5) / (belowFloor + .045) * 2.5), 34.0) * floorMask;
          float floorDepth = pow(.5 + .5 * cos(.85 / (belowFloor + .045) - uTime * .18), 40.0) * floorMask;
          color += rackColor * body * (.28 + .34 * uRms);
          color += dataColor * body * .09;
          color += rackColor * chassis * (.28 + .45 * spectrum);
          color += dataColor * statusLed * (1.2 + 1.2 * uHighs);
          color += rackColor * rackEdge * .7;
          color += rackColor * (bodySoft * .07 + capGlow * .17) * uBarGlow;
          color += dataColor * beacon * (1.3 + uBarEcho);
          color += rackColor * reflection * (.08 + .3 * spectrum) * uBarReflection;
          color += dataColor * (floorRay * .035 + floorDepth * .026) * uBarGrid;
          color += dataColor * exp(-abs(screenUv.y - baseline) * 70.0) * (.045 + .10 * uRms);
        } else if (style < 1.5) {
          // DATA CORE: modular neon compute cells with energy rising off every active stack.
          float baseline = .06;
          float barHeight = .07 + .67 * spectrum * dance;
          float barTop = baseline + barHeight;
          float body = column * smoothstep(baseline, baseline + .008, screenUv.y)
            * (1.0 - smoothstep(barTop - .008, barTop, screenUv.y));
          float segmentPhase = fract((screenUv.y - baseline) * 32.0);
          float segments = smoothstep(.08, .20, segmentPhase) * (1.0 - smoothstep(.78, .92, segmentPhase));
          float segmentedBody = body * segments;
          float core = (1.0 - smoothstep(.06, .19, abs(binPhase - .5))) * body;
          float cap = softColumn * exp(-abs(screenUv.y - barTop) * 64.0);
          float packetPhase = fract(uTime * (.18 + .34 * spectrum) + floor(warpedX * 64.0) * .137);
          float packetY = barTop + .018 + packetPhase * .22;
          float localPacketX = (binPhase - .5) / 64.0;
          float risingPacket = exp(-length(vec2(localPacketX, screenUv.y - packetY)) * 230.0)
            * pow(1.0 - packetPhase, 1.4);
          float energyVeil = softColumn * exp(-abs(screenUv.y - barTop) * 25.0) * (.2 + .8 * spectrum);
          color += rackColor * segmentedBody * (.62 + .7 * uRms);
          color += dataColor * core * (.34 + .75 * spectrum);
          color += rackColor * cap * .23 * uBarGlow;
          color += dataColor * energyVeil * .10 * uBarGlow;
          color += dataColor * risingPacket * (1.2 + 1.4 * uBarEcho);
          color += rackColor * exp(-abs(screenUv.y - baseline) * 92.0) * (.08 + .12 * uBass);
        } else if (style < 2.5) {
          // MIRROR VAULT: a central aisle flanked by synchronized racks and deep perspective guides.
          float horizon = .5;
          float aisleDistance = abs(screenUv.y - horizon);
          float barHeight = .045 + .39 * spectrum * dance;
          float body = column * (1.0 - smoothstep(barHeight - .012, barHeight, aisleDistance));
          float rowPhase = fract(aisleDistance * 47.0);
          float chassis = body * smoothstep(.08, .19, rowPhase) * (1.0 - smoothstep(.74, .9, rowPhase));
          float upperGain = screenUv.y > horizon ? 1.0 : (.28 + .72 * uBarReflection);
          float rackEdge = max(softColumn - column, 0.0) * body;
          float perspectiveRay = pow(.5 + .5 * cos((screenUv.x - .5) / (aisleDistance + .055) * 3.2), 36.0);
          float depthMarker = pow(.5 + .5 * cos(.95 / (aisleDistance + .05) - uTime * .23), 42.0);
          float guideMask = smoothstep(.035, .16, aisleDistance) * (1.0 - smoothstep(.46, .5, aisleDistance));
          float centerBeam = exp(-aisleDistance * 70.0);
          float cap = softColumn * exp(-abs(aisleDistance - barHeight) * 58.0);
          color += rackColor * body * (.28 + .5 * spectrum) * upperGain;
          color += dataColor * chassis * (.34 + .55 * uHighs) * upperGain;
          color += rackColor * rackEdge * .65 * upperGain;
          color += dataColor * (perspectiveRay * .045 + depthMarker * .035) * guideMask * uBarGrid;
          color += dataColor * centerBeam * (.12 + .32 * uRms);
          color += rackColor * cap * .14 * uBarGlow * upperGain;
        } else {
          // PACKET STORM: a moving spectrum skyline carrying chromatic traffic and trailing echoes.
          float baseline = .11 + sin(screenUv.x * 14.0 - uTime * (1.1 + uMids)) * .04 * uBarMotion;
          float barHeight = .065 + .45 * spectrum * dance;
          float barTop = baseline + barHeight;
          float body = column * smoothstep(baseline, baseline + .008, screenUv.y)
            * (1.0 - smoothstep(barTop - .01, barTop, screenUv.y));
          float ribbon = exp(-abs(screenUv.y - barTop) * 82.0);
          float ghostSpectrumA = spectrumAt(clamp(warpedX - .018, 0.0, .9999));
          float ghostSpectrumB = spectrumAt(clamp(warpedX + .018, 0.0, .9999));
          float ghostTopA = baseline + .055 + .43 * ghostSpectrumA;
          float ghostTopB = baseline + .055 + .43 * ghostSpectrumB;
          float ghostA = exp(-abs(screenUv.y - ghostTopA) * 58.0);
          float ghostB = exp(-abs(screenUv.y - ghostTopB) * 58.0);
          float packetGate = pow(.5 + .5 * cos(warpedX * 201.06 - uTime * (6.0 + 12.0 * uHighs)), 42.0);
          float packet = ribbon * packetGate;
          float belowFloor = baseline - screenUv.y;
          float reflection = column * step(0.0, belowFloor)
            * (1.0 - smoothstep(.04 + .16 * barHeight, .05 + .18 * barHeight, belowFloor));
          color += rackColor * body * (.4 + .65 * uRms);
          color += dataColor * ribbon * (.18 + .22 * uBarGlow);
          color += palette(screenUv.x + .45 + frequencyShift) * ghostA * .12 * uBarEcho;
          color += palette(screenUv.x - .2 + frequencyShift) * ghostB * .10 * uBarEcho;
          color += dataColor * packet * (1.1 + 1.7 * uHighs);
          color += rackColor * reflection * (.08 + .3 * spectrum) * uBarReflection;
          color += dataColor * exp(-abs(screenUv.y - baseline) * 62.0) * (.04 + .12 * uBass);
        }
      } else if (uVisualStyle == 2) {
        float radius = length(visualPoint);
        float baseAnglePosition = atan(visualPoint.y, visualPoint.x) / 6.2831853 + .5;
        float angleTwist = sin(radius * (11.0 + 5.0 * uHighs) - uTime * (1.0 + uMids))
          * .018 * uRadialTwist;
        float anglePosition = fract(baseAnglePosition + angleTwist);
        float mirroredPosition = 1.0 - abs(anglePosition * 2.0 - 1.0);
        float spectrum = spectrumAt(mirroredPosition);
        float ringRadius = (.19 + .20 * spectrum) * uRadialSize;
        float spectrumRing = exp(-abs(radius - ringRadius) * (78.0 + 44.0 * uHighs));
        float spectrumHalo = exp(-abs(radius - ringRadius) * (18.0 + 8.0 * spectrum));
        float spokes = pow(.5 + .5 * cos(anglePosition * 6.2831853 * 64.0 + uTime * .35), 10.0) * spectrum;
        vec3 ringColor = palette(mirroredPosition * .92 + uFrequencyHue * .5 + uTime * .018);
        float wavePhase1 = fract(uTime * (.075 + .035 * uRms));
        float wavePhase2 = fract(wavePhase1 + .3333);
        float wavePhase3 = fract(wavePhase1 + .6667);
        float outgoing1 = exp(-abs(radius - ringRadius - wavePhase1 * .52) * 46.0) * pow(1.0 - wavePhase1, 1.35);
        float outgoing2 = exp(-abs(radius - ringRadius - wavePhase2 * .52) * 46.0) * pow(1.0 - wavePhase2, 1.35);
        float outgoing3 = exp(-abs(radius - ringRadius - wavePhase3 * .52) * 46.0) * pow(1.0 - wavePhase3, 1.35);
        float outwardFill = step(ringRadius, radius) * exp(-(radius - ringRadius) * 5.5) * (.12 + .45 * spectrum);
        float orbitShimmer = exp(-abs(radius - ringRadius - .035 * sin(anglePosition * 25.1327 + uTime)) * 34.0)
          * (.12 + .38 * uMids) * uRadialTwist;
        color = palette(radius * .32 - uTime * .009 + frequencyShift)
          * (.008 + (.06 * uRms + outwardFill * .18) * uRadialAtmosphere);
        color += ringColor * spectrumRing * (1.0 + .78 * spectrum);
        color += ringColor * spectrumHalo * (.045 + .18 * spectrum) * uRadialGlow;
        color += ringColor * (outgoing1 + outgoing2 + outgoing3)
          * (.18 + .82 * spectrum + .35 * uBeat) * uRadialWaves;
        color += ringColor * spokes * exp(-abs(radius - ringRadius) * 18.0) * .20 * uRadialSpokes;
        color += palette(mirroredPosition + .28 + frequencyShift) * orbitShimmer * .12;
      } else if (uVisualStyle == 3) {
        float radius = length(visualPoint) / max(.5, uPulseSize);
        float angle = atan(visualPoint.y, visualPoint.x);
        float phase1 = fract(uTime * .082);
        float phase2 = fract(uTime * .069 + .34);
        float phase3 = fract(uTime * .057 + .68);
        float lowJagged = jaggedProfile(angle, uTime, 11.0, 19.0, 31.0)
          * uPulseJagged * (.0015 + .034 * uBass + .018 * uBeat);
        float midJagged = jaggedProfile(angle, uTime * 1.08, 23.0, 41.0, 67.0)
          * uPulseJagged * (.0012 + .027 * uMids);
        float highJagged = jaggedProfile(angle, uTime * 1.22, 37.0, 73.0, 109.0)
          * uPulseJagged * (.0010 + .022 * uHighs);
        float lowRadius = radius - lowJagged;
        float midRadius = radius - midJagged;
        float highRadius = radius - highJagged;
        float ring1 = expandingWave(lowRadius, phase1, 74.0 + 42.0 * uBass, 0.0);
        float ring2 = expandingWave(midRadius, phase2, 68.0 + 38.0 * uMids, 1.0);
        float ring3 = expandingWave(highRadius, phase3, 62.0 + 42.0 * uHighs, 2.0);
        float lowTrail = sourceRingTrail(lowRadius, phase1, .032, 0.0) * uPulseTrail;
        float midTrail = sourceRingTrail(midRadius, phase2, .029, 1.0) * uPulseTrail;
        float highTrail = sourceRingTrail(highRadius, phase3, .026, 2.0) * uPulseTrail;
        vec3 emittedMusicWaves = musicEmittedWaves(radius, angle);
        float rays = pow(.5 + .5 * cos(angle * (8.0 + floor(uMids * 8.0)) - uTime * (.7 + uHighs)), 14.0);
        float radialTexture = pow(.5 + .5 * cos(radius * (145.0 + 28.0 * uHighs) - uTime * (1.1 + uMids)), 11.0);
        float centerGlow = exp(-radius * (7.2 - 1.2 * uBass));
        float wakeEnvelope = exp(-radius * 3.8);
        float wake = wakeEnvelope * (.018 + .075 * uRms)
          + radialTexture * wakeEnvelope * (.025 + .16 * uRms + .08 * uBeat)
          + rays * exp(-radius * 2.8) * (.018 + .075 * uHighs);
        vec3 backgroundLayer = palette(radius * .55 - uTime * .018 + frequencyShift) * (.008 + wake);

        // Middle layer: music waves remain behind the emitter and emerge beyond its outer lane.
        float emitterOcclusion = 1.0 - smoothstep(.19, .285, radius);
        vec3 waveLayer = backgroundLayer + emittedMusicWaves * (1.0 - emitterOcclusion);
        waveLayer = waveLayer / (1.0 + waveLayer * .45);

        // Foreground layer: source lanes, local trails, and center glow always composite last.
        vec3 emitterLayer = vec3(0.0);
        emitterLayer += palette(.08 + frequencyShift) * ring1 * (.30 + .70 * uBass + .40 * uBeat);
        emitterLayer += palette(.43 + frequencyShift) * ring2 * (.28 + .68 * uMids);
        emitterLayer += palette(.78 + frequencyShift) * ring3 * (.25 + .62 * uHighs);
        emitterLayer += palette(.08 + frequencyShift) * lowTrail * (.06 + .31 * uBass + .18 * uBeat);
        emitterLayer += palette(.43 + frequencyShift) * midTrail * (.055 + .27 * uMids);
        emitterLayer += palette(.78 + frequencyShift) * highTrail * (.05 + .24 * uHighs);
        emitterLayer += palette(.62 + frequencyShift) * centerGlow
          * (.025 + .11 * uRms + .07 * uBeat)
          * (.28 + .72 * radialTexture);
        emitterLayer = emitterLayer / (1.0 + emitterLayer * .30);
        float emitterCoverage = clamp(
          max(max(ring1, ring2), ring3) * .82
          + (lowTrail + midTrail + highTrail) * .22
          + centerGlow * .32,
          0.0, 1.0
        );
        color = waveLayer * (1.0 - emitterCoverage * .78) + emitterLayer;
        color = color / (1.0 + color * .18);
      } else if (uVisualStyle == 4) {
        float wave = waveformAt(screenUv.x);
        float centeredY = screenUv.y - .5;
        float amplitude = (.10 + .18 * uMotion) * (1.0 + .35 * uRms);
        float mainLine = exp(-abs(centeredY - wave * amplitude) * 190.0);
        float upperEcho = exp(-abs(centeredY - .19 - wave * amplitude * .62) * 105.0);
        float lowerEcho = exp(-abs(centeredY + .19 - wave * amplitude * .62) * 105.0);
        float fineGrid = pow(.5 + .5 * cos(screenUv.y * 95.0 + uTime * .16), 18.0) * (.025 + .10 * uHighs);
        vec3 waveColor = palette(screenUv.x * .92 + uFrequencyHue * .55 + uTime * .014);
        color = palette(screenUv.y * .25 + uTime * .008 + frequencyShift) * (.012 + .065 * uRms + fineGrid);
        color += waveColor * mainLine * (.72 + .7 * uRms + .5 * uBeat);
        color += palette(screenUv.x + .32 + frequencyShift) * upperEcho * (.18 + .55 * uMids);
        color += palette(screenUv.x + .68 + frequencyShift) * lowerEcho * (.18 + .55 * uBass);
      } else if (uVisualStyle == 5) {
        color = renderMandelbulb(visualPoint * 2.0, frequencyShift);
      } else if (uVisualStyle == 6) {
        color = renderMainframeLandscape(screenUv, frequencyShift);
      }

      float vignette = 1.0 - .48 * dot(p, p);
      color *= clamp(vignette, .35, 1.0);
      color = pow(max(color, 0.0), vec3(.84));
      float grain = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898,78.233))) * 43758.5453);
      color += (grain - .5) / 255.0;
      float chromaLuminance = dot(max(color, 0.0), vec3(.2126, .7152, .0722));
      if (uChromaKey > .5) {
        if (chromaLuminance < uChromaThreshold) {
          color = vec3(0.0, 1.0, 0.0);
        } else {
          // Reserve green exclusively for the key background. Bright subject pixels
          // are pushed toward magenta/blue and then hard-limited outside OBS's green hue.
          float greenLead = color.g - max(color.r, color.b);
          float greenMask = smoothstep(-.035, .10, greenLead) * smoothstep(.045, .22, color.g);
          vec3 chromaSafe = vec3(color.r + color.g * .52, color.g * .04, color.b + color.g * .66);
          color = mix(color, chromaSafe, greenMask);
          color.g = min(color.g, max(color.r, color.b) * .62);
        }
      }
      if (uHdrExport > .5) color = encodeRec2020Hlg(color);
      fragColor = vec4(color, 1.0);
    }
  `;

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
  for (const name of ['uResolution','uSubpixelOffset','uCenter','uScale','uTime','uBass','uMids','uHighs','uRms','uBeat','uFlow','uMotion','uFractalDimensional','uFractalTilt','uFractalDepthSpeed','uFractalPerspective','uFractalSlice','uFractalLighting','uFractalAudioDepth','uEquationFolding','uEquationFold','uEquationWarp','uEquationFoldMotion','uEquationFoldOffset','uEquationWarpScale','uEquationFoldAudio','uCoreCStrength','uCoreBias','uBarWidth','uBarGlow','uBarReflection','uBarMotion','uBarEcho','uBarGrid','uBarStyle','uRadialSize','uRadialGlow','uRadialWaves','uRadialTwist','uRadialSpokes','uRadialAtmosphere','uPulseJagged','uPulseTrail','uPulseDetail','uPulseSize','uPulseEventCount','uBulbPower','uBulbWarp','uBulbDetail','uBulbAudio','uBulbOrbit','uBulbFold','uBulbGlow','uBulbCamera','uBulbYaw','uBulbPitch','uBulbSteps','uRotation','uEquation','uFrequencyHue','uFrequencyColor','uFractalType','uVisualStyle','uCustom0','uCustom1','uCustom2','uCustom3','uIterations','uPalette','uChromaKey','uChromaThreshold','uHdrExport']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  for (const name of ['uEquationBass','uEquationMids','uEquationHighs','uEquationBeat','uMusicMotionBass','uMusicMotionMids','uMusicMotionHighs','uMusicMotionBeat','uMappedEquation']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  uniforms.uSpectrum = gl.getUniformLocation(program, 'uSpectrum[0]');
  uniforms.uWaveform = gl.getUniformLocation(program, 'uWaveform[0]');
  uniforms.uPulseEventAge = gl.getUniformLocation(program, 'uPulseEventAge[0]');
  uniforms.uPulseEventStrength = gl.getUniformLocation(program, 'uPulseEventStrength[0]');
  uniforms.uPulseEventBand = gl.getUniformLocation(program, 'uPulseEventBand[0]');
  uniforms.uPulseEventSeed = gl.getUniformLocation(program, 'uPulseEventSeed[0]');
  uniforms.uBulbHotspots = gl.getUniformLocation(program, 'uBulbHotspots[0]');
  const defaultFrequencyBands = Object.freeze({
    floor: 25,
    lowMid: 180,
    midHigh: 2400,
    ceiling: 12000
  });
  const musicPersonalityProfiles = Object.freeze({
    balanced: Object.freeze({
      label: 'Balanced', description: 'Natural response across most music', icon: [52, 66, 58],
      bands: defaultFrequencyBands, gains: [1, 1, 1], smoothing: .8, beatSensitivity: .65, beatCooldownMs: 150, autoTarget: .74
    }),
    electronic: Object.freeze({
      label: 'Electronic / EDM', description: 'Fast kicks, sub-bass, and bright transients', icon: [82, 48, 72],
      bands: Object.freeze({ floor: 28, lowMid: 160, midHigh: 2200, ceiling: 14000 }), gains: [1.12, .94, 1.05], smoothing: .72, beatSensitivity: .78, beatCooldownMs: 115, autoTarget: .76
    }),
    hiphop: Object.freeze({
      label: 'Hip-Hop', description: 'Weighty lows with steadier vocal space', icon: [88, 54, 38],
      bands: Object.freeze({ floor: 22, lowMid: 210, midHigh: 2600, ceiling: 12000 }), gains: [1.18, .92, .88], smoothing: .78, beatSensitivity: .72, beatCooldownMs: 145, autoTarget: .74
    }),
    rock: Object.freeze({
      label: 'Rock / Metal', description: 'Punch, guitars, cymbals, and quick attacks', icon: [52, 78, 84],
      bands: Object.freeze({ floor: 35, lowMid: 240, midHigh: 3200, ceiling: 15000 }), gains: [.95, 1.08, 1.1], smoothing: .66, beatSensitivity: .7, beatCooldownMs: 120, autoTarget: .72
    }),
    pop: Object.freeze({
      label: 'Pop', description: 'Clear vocals with polished full-range motion', icon: [58, 84, 66],
      bands: Object.freeze({ floor: 30, lowMid: 190, midHigh: 2800, ceiling: 15000 }), gains: [1, 1.08, 1.02], smoothing: .75, beatSensitivity: .68, beatCooldownMs: 135, autoTarget: .74
    }),
    ambient: Object.freeze({
      label: 'Ambient / Classical', description: 'Slow, detailed movement for wide dynamics', icon: [38, 62, 88],
      bands: Object.freeze({ floor: 25, lowMid: 150, midHigh: 1800, ceiling: 16000 }), gains: [.92, 1.06, 1.12], smoothing: .9, beatSensitivity: .52, beatCooldownMs: 190, autoTarget: .68
    })
  });
  const maximumPulseEvents = 16;
  const bulbHotspotData = new Float32Array(9);
  const bulbHotspotFrom = new Float32Array(3);
  const bulbHotspotTo = new Float32Array(3);

  const state = {
    center: { x: -0.16, y: 0.0 },
    interfaceMode: 'basic',
    fractalType: 0,
    visualStyle: 0,
    zoom: 1,
    iterations: 220,
    flow: 0.28,
    motion: 0.85,
    fractalDimensional: false,
    fractalTilt: .45,
    fractalDepthSpeed: .32,
    fractalPerspective: .45,
    fractalSlice: .25,
    fractalLighting: .55,
    fractalAudioDepth: .4,
    equationFolding: false,
    equationFold: .18,
    equationWarp: .12,
    equationFoldMotion: .16,
    equationFoldOffset: .1,
    equationWarpScale: .45,
    equationFoldAudio: .25,
    coreCStrength: .5,
    coreBiasReal: 0,
    coreBiasImag: 0,
    barWidth: 1,
    barGlow: 1,
    barReflection: .35,
    barMotion: .35,
    barEcho: .6,
    barGrid: 1,
    barStyle: 0,
    radialSize: 1,
    radialGlow: 1,
    radialWaves: 1,
    radialTwist: .3,
    radialSpokes: 1,
    radialAtmosphere: 1,
    pulseDensity: .75,
    pulseSize: 1,
    pulseCooldown: 1,
    pulseJagged: 1,
    pulseTrail: 1,
    pulseDetail: 1.25,
    bulbPower: 4,
    bulbDetail: .55,
    bulbAudio: .65,
    bulbOrbit: .28,
    bulbFold: 0,
    bulbGlow: 1.2,
    bulbCamera: 3.75,
    bulbYaw: .38,
    bulbPitch: .12,
    pulseEvents: [],
    pulsePreviousLevels: [0, 0, 0],
    pulseLastLevels: [0, 0, 0],
    pulseArmed: [true, true, true],
    pulseCooldowns: [0, 0, 0],
    pulseGlobalCooldown: 0,
    pulseAcceptedTotal: 0,
    pulseEventAges: new Float32Array(maximumPulseEvents),
    pulseEventStrengths: new Float32Array(maximumPulseEvents),
    pulseEventBands: new Float32Array(maximumPulseEvents),
    pulseEventSeeds: new Float32Array(maximumPulseEvents),
    spin: 0.18,
    modulationRotationPhase: 0,
    equation: 0.09,
    visualTime: 0,
    adaptiveQuality: true,
    performanceScale: 1,
    frameTime: 16.7,
    palette: 0,
    reactivity: 0.9,
    autoReactivity: true,
    autoReactivityGain: 1,
    autoReactivityTarget: 0.74,
    musicPersonality: 'balanced',
    songDirectorEnabled: false,
    songDirectorStyle: 'cinematic',
    songDirectorBehavior: 'auto',
    songDirectorTransition: 'auto',
    songDirectorIntensity: .55,
    songDirectorValues: {},
    analysisBassGain: 1,
    analysisMidGain: 1,
    analysisHighGain: 1,
    frequencyBandMode: 'basic',
    frequencyFloor: defaultFrequencyBands.floor,
    lowMidSplit: defaultFrequencyBands.lowMid,
    midHighSplit: defaultFrequencyBands.midHigh,
    frequencyCeiling: defaultFrequencyBands.ceiling,
    spectrumData: new Float32Array(64),
    waveformData: new Float32Array(64),
    bass: 0,
    mids: 0,
    highs: 0,
    rms: 0,
    beat: 0,
    equationBass: 0,
    equationMids: 0,
    equationHighs: 0,
    equationBeat: 0,
    musicMotionBass: 0,
    musicMotionMids: 0,
    musicMotionHighs: 0,
    musicMotionBeat: 0,
    musicBaselineBass: 0,
    musicBaselineMids: 0,
    musicBaselineHighs: 0,
    equationSmoothing: .9,
    beatAverage: 0.05,
    beatFastEnvelope: 0,
    beatSlowEnvelope: 0,
    beatOnsetAverage: .008,
    beatCooldownRemaining: 0,
    beatSensitivity: .65,
    beatCooldownMs: 150,
    beatDetectedTotal: 0,
    beatDetectorArmed: true,
    autoBpm: true,
    manualBpm: 120,
    detectedBpm: 120,
    bpmConfidence: 0,
    beatOffsetMs: 0,
    beatGridAnchor: performance.now() / 1000,
    detectedBeatTimes: [],
    beatGridIndex: -1,
    beatGridPhase: 0,
    showSequence: [],
    showPlaying: false,
    showIndex: -1,
    showLoop: true,
    showShuffle: false,
    showEntryStartTime: 0,
    showEntryStartBeat: 0,
    showTransitioning: false,
    showTransitionBlack: false,
    operatorMode: false,
    performanceBlackout: false,
    monitorVolume: 0.82,
    monitorMuted: false,
    analysisSmoothing: 0.8,
    frequencyColorEnabled: true,
    frequencyColorAmount: 0.55,
    frequencyHue: 0,
    dominantBand: 'silence',
    loopBeforeExport: false,
    exporting: false,
    exportWidth: 1920,
    exportHeight: 1080,
    exportDetail: 1.6,
    exportIterations: 600,
    exportIterationTarget: 0,
    exportSupersampling: false,
    offlineSamplePass: 0,
    exportSampleOffsetX: 0,
    exportSampleOffsetY: 0,
    offlineBaseModulation: null,
    autoDrift: true,
    beatPulse: true,
    drag: null,
    lastFrame: performance.now(),
    audioName: '',
    playlist: [],
    playlistIndex: -1,
    playlistLoadedId: null,
    playlistId: 0,
    audioMode: 'deck',
    liveAudioLabel: '',
    obsChromaKey: false,
    obsChromaThreshold: .08,
    modulationEnabled: true,
    modulationMappings: [],
    modulationValues: {},
    cameraMotionPreset: 'off',
    cameraPath: null,
    performanceMode: 'auto',
    bulbLiveBudget: .88,
    unleashedMode: false,
    hardwareInfo: null,
    hardwareRecommendation: 'balanced',
    offlineExporting: false,
    offlineHdrExport: false,
    offlineTenBitExport: false,
    offlineFps: 60,
    nowPlayingEnabled: false,
    nowPlayingTitle: '',
    nowPlayingArtist: 'Tempest Mainframe',
    nowPlayingPosition: 'bottom-left',
    customColors: [
      [9 / 255, 17 / 255, 37 / 255],
      [32 / 255, 70 / 255, 110 / 255],
      [99 / 255, 85 / 255, 142 / 255],
      [107 / 255, 168 / 255, 181 / 255]
    ],
    lastUiUpdate: 0
  };

  const obsSynchronizedStateKeys = [
    'fractalType', 'visualStyle', 'zoom', 'iterations', 'flow', 'motion',
    'fractalDimensional', 'fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth',
    'equationFolding', 'equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio',
    'coreCStrength', 'coreBiasReal', 'coreBiasImag',
    'barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid', 'barStyle',
    'radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere',
    'pulseDensity', 'pulseSize', 'pulseCooldown', 'pulseJagged', 'pulseTrail', 'pulseDetail',
    'bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera', 'bulbYaw', 'bulbPitch',
    'spin', 'modulationRotationPhase', 'equation', 'equationSmoothing', 'visualTime', 'palette', 'reactivity', 'frequencyColorEnabled', 'frequencyColorAmount', 'frequencyHue',
    'bass', 'mids', 'highs', 'rms', 'beat',
    'equationBass', 'equationMids', 'equationHighs', 'equationBeat',
    'musicMotionBass', 'musicMotionMids', 'musicMotionHighs', 'musicMotionBeat',
    'musicBaselineBass', 'musicBaselineMids', 'musicBaselineHighs',
    'autoDrift', 'beatPulse', 'obsChromaKey', 'obsChromaThreshold',
    'modulationEnabled', 'showTransitionBlack', 'performanceBlackout',
    'nowPlayingEnabled', 'nowPlayingTitle', 'nowPlayingArtist', 'nowPlayingPosition', 'cameraMotionPreset'
    ,'songDirectorEnabled', 'songDirectorStyle', 'songDirectorBehavior', 'songDirectorTransition', 'songDirectorIntensity'
  ];
  let obsSyncFps = Number(pageParameters.get('fps')) === 30 ? 30 : 60;
  let obsLastStateSent = 0;
  let obsRemoteAudioActive = false;

  function createObsVisualSnapshot() {
    const snapshot = {};
    for (const key of obsSynchronizedStateKeys) snapshot[key] = state[key];
    snapshot.center = { x: state.center.x, y: state.center.y };
    snapshot.customColors = state.customColors.map((color) => [...color]);
    snapshot.spectrumData = Array.from(state.spectrumData);
    snapshot.waveformData = Array.from(state.waveformData);
    snapshot.pulseEvents = state.pulseEvents.map((event) => ({ ...event }));
    snapshot.modulationValues = { ...state.modulationValues };
    snapshot.modulationMappings = state.modulationMappings.map((mapping) => ({ ...mapping }));
    snapshot.songDirectorValues = { ...state.songDirectorValues };
    snapshot.audioActive = audioIsActive();
    snapshot.nowPlayingTitle = currentNowPlayingTitle();
    return snapshot;
  }

  function applyObsVisualSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    for (const key of obsSynchronizedStateKeys) {
      if (Object.hasOwn(snapshot, key)) state[key] = snapshot[key];
    }
    if (snapshot.center) state.center = { x: Number(snapshot.center.x), y: Number(snapshot.center.y) };
    if (Array.isArray(snapshot.customColors)) state.customColors = snapshot.customColors.map((color) => [...color]);
    if (Array.isArray(snapshot.spectrumData)) state.spectrumData.set(snapshot.spectrumData.slice(0, 64));
    if (Array.isArray(snapshot.waveformData)) state.waveformData.set(snapshot.waveformData.slice(0, 64));
    if (Array.isArray(snapshot.pulseEvents)) state.pulseEvents = snapshot.pulseEvents.map((event) => ({ ...event }));
    if (snapshot.modulationValues && typeof snapshot.modulationValues === 'object') state.modulationValues = { ...snapshot.modulationValues };
    if (Array.isArray(snapshot.modulationMappings)) state.modulationMappings = snapshot.modulationMappings.slice(0, 8).map(createModulationMapping);
    if (snapshot.songDirectorValues && typeof snapshot.songDirectorValues === 'object') state.songDirectorValues = { ...snapshot.songDirectorValues };
    obsRemoteAudioActive = Boolean(snapshot.audioActive);
    if (isObsOutput) {
      $('#showTransitionOverlay')?.classList.toggle('visible', Boolean(state.showTransitionBlack));
      document.body.classList.toggle('performance-blackout', Boolean(state.performanceBlackout));
      updateNowPlayingOverlay();
    }
  }

  if (isObsOutput) window.quarticDesktop.onObsVisualState(applyObsVisualSnapshot);

  const modulationSources = Object.freeze({
    bass: { label: 'Bass', stateKey: 'bass' },
    mids: { label: 'Mids', stateKey: 'mids' },
    highs: { label: 'Highs', stateKey: 'highs' },
    beat: { label: 'Beat', stateKey: 'beat' },
    rms: { label: 'Overall Level', stateKey: 'rms' }
  });
  const modulationTargets = Object.freeze({
    equation: { label: 'Equation Modulation', scale: .35, bipolar: true },
    equationFold: { label: 'Equation Fold', scale: .75 },
    equationWarp: { label: 'Equation Warp', scale: 1.0 },
    fractalTilt: { label: 'Dimensional Tilt', scale: .7 },
    fractalSlice: { label: 'Dimensional Slice', scale: .7 },
    zoom: { label: 'Camera Zoom', scale: .45, bipolar: true },
    rotation: { label: 'Rotation', scale: .8, bipolar: true },
    frequencyHue: { label: 'Color Position', scale: .55, bipolar: true },
    flow: { label: 'Color Flow', scale: .55, bipolar: true },
    motion: { label: 'Visual Motion', scale: 1.0 },
    pulseJagged: { label: 'Pulse Jaggedness', scale: .9 },
    bulbPower: { label: '3D Recurrence Warp', scale: 1.5, bipolar: true },
    bulbFold: { label: '3D Volumetric Fold', scale: .7 },
    bulbGlow: { label: '3D Surface Glow', scale: 1.0 }
  });

  function modulationAmountMinimum(target) {
    return modulationTargets[target]?.bipolar ? -100 : 0;
  }
  const modulationPresets = Object.freeze({
    math: [
      { source: 'bass', target: 'equation', amount: 22, attack: 36, release: 22 },
      { source: 'mids', target: 'equationWarp', amount: 30, attack: 60, release: 28 },
      { source: 'highs', target: 'frequencyHue', amount: 35, attack: 86, release: 48 },
      { source: 'beat', target: 'zoom', amount: 48, attack: 100, release: 62 }
    ],
    dimension: [
      { source: 'bass', target: 'zoom', amount: 34, attack: 75, release: 25 },
      { source: 'mids', target: 'fractalTilt', amount: 38, attack: 55, release: 30 },
      { source: 'highs', target: 'fractalSlice', amount: 28, attack: 82, release: 45 },
      { source: 'beat', target: 'rotation', amount: 36, attack: 100, release: 58 }
    ],
    conventional: [
      { source: 'bass', target: 'motion', amount: 38, attack: 72, release: 30 },
      { source: 'mids', target: 'frequencyHue', amount: 32, attack: 58, release: 36 },
      { source: 'highs', target: 'flow', amount: 30, attack: 88, release: 48 },
      { source: 'beat', target: 'pulseJagged', amount: 46, attack: 100, release: 62 }
    ]
  });

  function createModulationMapping(values = {}) {
    const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const source = Object.hasOwn(modulationSources, values.source) ? values.source : 'bass';
    const target = Object.hasOwn(modulationTargets, values.target) ? values.target : 'equation';
    const floor = clamp(finiteOr(values.floor, 0), 0, 99);
    const ceiling = clamp(finiteOr(values.ceiling, 100), floor + 1, 100);
    return {
      id: String(values.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      source,
      target,
      amount: clamp(finiteOr(values.amount, 35), modulationAmountMinimum(target), 100),
      attack: clamp(finiteOr(values.attack, 70), 0, 100),
      release: clamp(finiteOr(values.release, 35), 0, 100),
      floor,
      ceiling,
      enabled: values.enabled !== false,
      current: clamp(finiteOr(values.current, 0), 0, 1)
    };
  }

  function updateAudioModulation(delta) {
    if (isObsOutput) return state.modulationValues;
    const values = {};
    if (!state.modulationEnabled) {
      for (const mapping of state.modulationMappings) mapping.current = 0;
      state.modulationValues = values;
      return values;
    }
    for (const mapping of state.modulationMappings) {
      if (!mapping.enabled) {
        mapping.current = 0;
        continue;
      }
      const sourceSpec = modulationSources[mapping.source];
      const targetSpec = modulationTargets[mapping.target];
      if (!sourceSpec || !targetSpec) continue;
      const rawValue = clamp(Number(state[sourceSpec.stateKey]) || 0, 0, 1);
      const floor = mapping.floor / 100;
      const ceiling = Math.max(floor + .01, mapping.ceiling / 100);
      const normalized = clamp((rawValue - floor) / (ceiling - floor), 0, 1);
      const speed = (normalized > mapping.current ? mapping.attack : mapping.release) / 100;
      const timeConstant = .015 + Math.pow(1 - speed, 2) * .8;
      const response = 1 - Math.exp(-delta / timeConstant);
      mapping.current += (normalized - mapping.current) * response;
      const contribution = mapping.current * (mapping.amount / 100) * targetSpec.scale;
      values[mapping.target] = clamp((values[mapping.target] || 0) + contribution, -2, 2);
    }
    state.modulationValues = values;
    return values;
  }

  function modulationTargetIsRouted(...targets) {
    if (!state.modulationEnabled) return false;
    return state.modulationMappings.some((mapping) => mapping.enabled
      && mapping.amount !== 0
      && targets.includes(mapping.target));
  }

  const fractalEquationProfiles = Object.freeze({
    signature: { flow: .28, motion: .85, reactivity: .9, equationMod: .09, equationSmoothing: .9, iterations: 220 },
    smooth: { flow: .22, motion: .68, reactivity: .82, equationMod: .07, equationSmoothing: .92, iterations: 250 },
    detail: { flow: .18, motion: .58, reactivity: .76, equationMod: .055, equationSmoothing: .94, iterations: 280 },
    rational: { flow: .15, motion: .5, reactivity: .7, equationMod: .04, equationSmoothing: .95, iterations: 310 },
    roots: { flow: .16, motion: .46, reactivity: .68, equationMod: .035, equationSmoothing: .96, iterations: 290 }
  });

  const fractalPresets = [
    { name: 'Quartic Mandelbrot', formula: 'z⁴ + μz² + c', center: [-0.16, 0], zoom: 1, profile: 'signature', palette: 0 },
    { name: 'Classic Mandelbrot', formula: 'z² + μz + c', center: [-0.5, 0], zoom: 1, profile: 'smooth', palette: 2 },
    { name: 'Cubic Mandelbrot', formula: 'z³ + μz² + c', center: [0, 0], zoom: 1, profile: 'smooth', palette: 1 },
    { name: 'Burning Ship', formula: '(|Re z| + i|Im z|)² + c', center: [-0.5, -0.5], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Tricorn', formula: 'conj(z)² + c', center: [0, 0], zoom: 1, profile: 'smooth', palette: 2 },
    { name: 'Julia Set', formula: 'z² + k(t)', center: [0, 0], zoom: 1, profile: 'signature', palette: 0 },
    { name: 'Quintic Multibrot', formula: 'z⁵ + μz² + c', center: [0, 0], zoom: 1, profile: 'detail', palette: 0 },
    { name: 'Phoenix', formula: 'z² + c + pz₋₁', center: [0, 0], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Celtic', formula: '|Re(z²)| + iIm(z²) + c', center: [-0.25, 0], zoom: 1, profile: 'detail', palette: 2 },
    { name: 'Buffalo', formula: '|Re(z²)| + i|Im(z²)| + c', center: [-0.35, -0.1], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Perpendicular Burning Ship', formula: '(Re z − i|Im z|)² + c', center: [-0.45, -0.25], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Perpendicular Mandelbrot', formula: '(|Re z| − iIm z)² + c', center: [-0.45, 0], zoom: 1, profile: 'detail', palette: 2 },
    { name: 'Magnet I', formula: '((z²+c−1)/(2z+c−2))²', center: [0, 0], zoom: 1, profile: 'rational', palette: 3 },
    { name: 'Magnet II', formula: 'Magnet type-II rational map', center: [0, 0], zoom: 1, profile: 'rational', palette: 0 },
    { name: 'Lambda', formula: 'cz(1−z)', center: [0, 0], zoom: .8, profile: 'smooth', palette: 2 },
    { name: 'Man-o-War', formula: 'z² + z₋₁ + c', center: [-0.1, 0], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Spider', formula: 'z² + cₙ; cₙ₊₁=cₙ/2+z', center: [-0.1, 0], zoom: 1, profile: 'rational', palette: 0 },
    { name: 'Nova', formula: 'z − (z³−1)/(3z²) + c', center: [0, 0], zoom: 1, profile: 'roots', palette: 0 },
    { name: 'Newton', formula: 'z − (z³−1)/(3z²)', center: [0, 0], zoom: .75, profile: 'roots', palette: 2 },
    { name: 'Pickover Biomorph', formula: 'z³ + c · biomorph coloring', center: [0, 0], zoom: 1, profile: 'detail', palette: 1 }
  ];

  const effectPresets = Object.freeze({
    fractal: {
      dimensional: { label: 'Dimensional', values: { fractalTilt: .45, fractalDepthSpeed: .32, fractalPerspective: .45, fractalSlice: .25, fractalLighting: .55, fractalAudioDepth: .4 } },
      classic: { label: 'Classic', values: { fractalTilt: 0, fractalDepthSpeed: 0, fractalPerspective: 0, fractalSlice: 0, fractalLighting: 0, fractalAudioDepth: 0 } },
      deep: { label: 'Deep Orbit', values: { fractalTilt: .78, fractalDepthSpeed: .56, fractalPerspective: .82, fractalSlice: .48, fractalLighting: .9, fractalAudioDepth: .65 } },
      dream: { label: 'Dream Fold', values: { fractalTilt: .62, fractalDepthSpeed: -.3, fractalPerspective: 1.08, fractalSlice: .78, fractalLighting: .72, fractalAudioDepth: .82 } }
    },
    fold: {
      soft: { label: 'Soft Fold', values: { equationFold: .18, equationWarp: .12, equationFoldMotion: .16, equationFoldOffset: .1, equationWarpScale: .45, equationFoldAudio: .25 } },
      kaleidoscope: { label: 'Kaleidoscope', values: { equationFold: .52, equationWarp: .28, equationFoldMotion: .28, equationFoldOffset: .18, equationWarpScale: .65, equationFoldAudio: .4 } },
      liquid: { label: 'Liquid Equation', values: { equationFold: .12, equationWarp: .65, equationFoldMotion: .38, equationFoldOffset: .08, equationWarpScale: .9, equationFoldAudio: .65 } },
      mirror: { label: 'Static Mirror', values: { equationFold: .9, equationWarp: 0, equationFoldMotion: 0, equationFoldOffset: .18, equationWarpScale: 0, equationFoldAudio: 0 } }
    },
    spectrum: {
      balanced: { label: 'Mainframe City', values: { barStyle: 0, barWidth: 1, barGlow: 1.15, barReflection: .42, barMotion: .32, barEcho: .7, barGrid: .9 } },
      neon: { label: 'Data Core', values: { barStyle: 1, barWidth: .78, barGlow: 1.85, barReflection: .12, barMotion: .55, barEcho: 1.15, barGrid: .5 } },
      mirror: { label: 'Mirror Vault', values: { barStyle: 2, barWidth: .9, barGlow: 1.35, barReflection: 1, barMotion: .45, barEcho: .9, barGrid: 1.25 } },
      dance: { label: 'Packet Storm', values: { barStyle: 3, barWidth: .72, barGlow: 1.5, barReflection: .48, barMotion: 1.55, barEcho: 1.4, barGrid: .7 } }
    },
    radial: {
      balanced: { label: 'Balanced', values: { radialSize: 1, radialGlow: 1, radialWaves: 1, radialTwist: .3, radialSpokes: 1, radialAtmosphere: 1 } },
      halo: { label: 'Halo', values: { radialSize: 1.05, radialGlow: 1.75, radialWaves: .45, radialTwist: .15, radialSpokes: .55, radialAtmosphere: 1.35 } },
      starburst: { label: 'Starburst', values: { radialSize: .9, radialGlow: 1.15, radialWaves: .75, radialTwist: .55, radialSpokes: 1.85, radialAtmosphere: .6 } },
      orbit: { label: 'Orbit Echo', values: { radialSize: 1.1, radialGlow: .9, radialWaves: 1.65, radialTwist: 1.3, radialSpokes: .8, radialAtmosphere: .85 } }
    },
    bulb: {
      quartic: { label: 'Quartic Core', values: { bulbPower: 4, bulbDetail: .55, bulbAudio: .65, bulbOrbit: .28, bulbFold: 0, bulbGlow: 1.2, bulbCamera: 3.75 } },
      deep: { label: 'Deep Orbit', values: { bulbPower: 4, bulbDetail: .84, bulbAudio: .48, bulbOrbit: .16, bulbFold: .08, bulbGlow: 1.45, bulbCamera: 3.25 } },
      storm: { label: 'Storm Fold', values: { bulbPower: 4, bulbDetail: .7, bulbAudio: 1, bulbOrbit: .42, bulbFold: .72, bulbGlow: 1.5, bulbCamera: 3.85 } },
      neon: { label: 'Neon Shell', values: { bulbPower: 6, bulbDetail: .45, bulbAudio: .78, bulbOrbit: -.35, bulbFold: .28, bulbGlow: 2, bulbCamera: 4.1 } }
    }
  });

  const effectControlGroups = Object.freeze({
    fractal: ['fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth'],
    fold: ['equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio'],
    spectrum: ['barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid'],
    radial: ['radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere'],
    bulb: ['bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera']
  });

  const pulsePresets = Object.freeze({
    balanced: { label: 'Balanced', values: { pulseDensity: .75, pulseSize: 1, pulseCooldown: 1, pulseJagged: 1, pulseTrail: 1, pulseDetail: 1.25 } },
    condensed: { label: 'Condensed', values: { pulseDensity: .45, pulseSize: .82, pulseCooldown: 1.25, pulseJagged: .8, pulseTrail: .75, pulseDetail: 1.65 } },
    wide: { label: 'Wide Echoes', values: { pulseDensity: .90, pulseSize: 1.45, pulseCooldown: 1.15, pulseJagged: .9, pulseTrail: 1.1, pulseDetail: 1.4 } },
    rapid: { label: 'Rapid', values: { pulseDensity: .96, pulseSize: .95, pulseCooldown: .55, pulseJagged: 1.15, pulseTrail: .75, pulseDetail: 1.1 } }
  });

  const experiencePresets = Object.freeze({
    lowFlash: { label: 'Low Flash', values: { flow: .12, reactivity: .55, motion: .42, equationSmoothing: .97, equationMod: .025, frequencyColorAmount: .2, analysisSmoothing: .92, beatSensitivity: .5, bulbAudio: .16, pulseDensity: .4, pulseCooldown: 1.8 }, checks: { autoReactivity: false, beatPulse: false, fractalDimensional: false, equationFolding: false } },
    balanced: { label: 'Balanced', values: { flow: .28, reactivity: .9, motion: .85, equationSmoothing: .9, equationMod: .09, frequencyColorAmount: .55, analysisSmoothing: .8, beatSensitivity: .65, bulbAudio: .4, pulseDensity: .65, pulseCooldown: 1.25 }, checks: { autoReactivity: true, beatPulse: true, fractalDimensional: false, equationFolding: false } },
    expressive: { label: 'Expressive', values: { flow: .45, reactivity: 1.35, motion: 1.4, equationSmoothing: .78, equationMod: .18, frequencyColorAmount: .95, analysisSmoothing: .68, beatSensitivity: .78, bulbAudio: .72, pulseDensity: .82, pulseCooldown: .85 }, checks: { autoReactivity: true, beatPulse: true, fractalDimensional: false, equationFolding: false } }
  });

  const numericSliderConfigs = {
    volume: { defaultRange: .82, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls speaker volume only. Exported audio remains at full level.' },
    frequencyColorAmount: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls frequency-driven palette movement from 0 to 100 percent.' },
    analysisSmoothing: { defaultRange: .8, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Higher percentages create steadier color and meter movement; lower percentages react faster.' },
    songDirectorIntensity: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Scales the Director cue layer without changing the underlying visual preset. Lower values keep section changes restrained.' },
    songDirectorCueStrength: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Reduces this section from its automatically generated cue strength. One hundred percent preserves the full generated cue; zero makes the section visually still.' },
    frequencyFloor: { defaultRange: 25, min: 20, max: 500, step: 5, decimals: 0, tip: 'Lowest frequency included in the low band. Frequencies below this value are ignored by the visualizer.' },
    lowMidSplit: { defaultRange: 180, min: 80, max: 1200, step: 10, decimals: 0, tip: 'Boundary between the low and mid bands. Moving it higher lets more upper-bass energy drive low-frequency effects.' },
    midHighSplit: { defaultRange: 2400, min: 400, max: 8000, step: 50, decimals: 0, tip: 'Boundary between the mid and high bands. Moving it higher keeps more presence frequencies in the mid band.' },
    frequencyCeiling: { defaultRange: 12000, min: 4000, max: 20000, step: 100, decimals: 0, tip: 'Highest frequency included in the high band. Frequencies above this value are ignored by the visualizer.' },
    zoom: { defaultRange: 10, min: .4, max: 12000, step: .01, decimals: 2, fromRange: (value) => Math.pow(10, value / 25 - .4), toRange: (value) => (Math.log10(value) + .4) * 25, tip: 'Magnification of the current fractal view. The slider uses a logarithmic scale.' },
    flow: { defaultRange: .28, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Sets palette movement from 0 to 100 percent.' },
    reactivity: { defaultRange: .9, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 3 * 100, toRange: (value) => value / 100 * 3, tip: 'Master music response from 0 to 100 percent.' },
    motion: { defaultRange: .85, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2.5 * 100, toRange: (value) => value / 100 * 2.5, tip: 'Scales camera drift, breathing, interior waves, and rotational motion from 0 to 100 percent.' },
    coreCStrength: { defaultRange: .5, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Changes the influence of c in the selected recurrence. Fifty percent preserves the original equation; lower and higher values reshape its core.' },
    coreBiasReal: { defaultRange: 0, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Offsets the real component of the recurrence constant. Zero preserves the selected equation.' },
    coreBiasImag: { defaultRange: 0, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Offsets the imaginary component of the recurrence constant. Zero preserves the selected equation.' },
    fractalTilt: { defaultRange: .45, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Tilts the fractal sampling plane through virtual depth. Higher values create a stronger dimensional turn.' },
    fractalDepthSpeed: { defaultRange: .32, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Sets dimensional rotation speed and direction from -50 to +50 percent.' },
    fractalPerspective: { defaultRange: .45, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Controls near/far perspective from 0 to 100 percent.' },
    fractalSlice: { defaultRange: .25, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Moves the complex sampling coordinates along the virtual depth direction, producing a folded slice effect.' },
    fractalLighting: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Adds depth-based shading and highlights from 0 to 100 percent.' },
    fractalAudioDepth: { defaultRange: .4, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Lets bass, mids, and beats increase tilt and slice movement without changing the selected equation.' },
    equationFold: { defaultRange: .18, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Folds the complex value across a moving axis during every equation iteration. The response is curved so low and middle values remain usable instead of immediately overwhelming the fractal.' },
    equationWarp: { defaultRange: .12, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Applies a bounded nonlinear complex warp using a gradual response curve. Higher values increasingly bend the folded structure.' },
    equationFoldMotion: { defaultRange: .16, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Rotates the equation fold axis from -50 to +50 percent. Negative values reverse direction.' },
    equationFoldOffset: { defaultRange: .1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Moves the mirrored fold away from the equation origin, creating asymmetry and separated lobes.' },
    equationWarpScale: { defaultRange: .45, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Scales nonlinear bending from 0 to 100 percent.' },
    equationFoldAudio: { defaultRange: .25, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Adds the smoothed bass, mid, and beat envelope to fold and warp depth. It now creates motion even at low base fold values without multiplying the recurrence into a solid field.' },
    barWidth: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .5) * 100, toRange: (value) => .5 + value / 100, tip: 'Changes spectrum column width from 0 to 100 percent.' },
    barGlow: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Adds spectrum glow from 0 to 100 percent.' },
    barReflection: { defaultRange: .35, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Reflects a shortened version of the spectrum downward from the top edge.' },
    barMotion: { defaultRange: .35, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Bends spectrum columns from 0 to 100 percent.' },
    barEcho: { defaultRange: .6, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Adds animated peak echoes from 0 to 100 percent.' },
    barGrid: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls the scan-line grid from 0 to 100 percent.' },
    radialSize: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .5) / 1.1 * 100, toRange: (value) => .5 + value / 100 * 1.1, tip: 'Scales the radial spectrum from 0 to 100 percent.' },
    radialGlow: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Adds a radial halo from 0 to 100 percent.' },
    radialWaves: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls radial echo waves from 0 to 100 percent.' },
    radialTwist: { defaultRange: .3, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Warps the circular mapping from 0 to 100 percent.' },
    radialSpokes: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls radial teeth from 0 to 100 percent.' },
    radialAtmosphere: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls the radial atmosphere from 0 to 100 percent.' },
    pulseDensity: { defaultRange: .75, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls the pulse emission budget. Higher percentages accept weaker transients, shorten the shared delay, and allow a few more active rings. Even at 100%, simultaneous frequency hits are combined into one ring.' },
    pulseSize: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .5) / 1.5 * 100, toRange: (value) => .5 + value / 100 * 1.5, tip: 'Scales the Pulse Rings composition from 0 to 100 percent.' },
    pulseCooldown: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .25) / 2.75 * 100, toRange: (value) => .25 + value / 100 * 2.75, tip: 'Sets pulse creation delay from 0 to 100 percent.' },
    pulseJagged: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls Pulse Ring jaggedness from 0 to 100 percent.' },
    pulseTrail: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls Pulse Ring trails from 0 to 100 percent.' },
    pulseDetail: { defaultRange: 1.25, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls Pulse Ring contour detail from 0 to 100 percent.' },
    bulbPower: { defaultRange: 4, min: 2, max: 10, step: 1, decimals: 0, tip: 'The whole-number exponent used by the 3D Mandelbulb recurrence. Integer powers keep the spherical angle wrap seamless; Power 4 is the Quartic Pulse signature shape.' },
    bulbDetail: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls recurrence depth and ray-marching precision. Adaptive quality can still reduce live render resolution.' },
    bulbAudio: { defaultRange: .65, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Lets bass, mids, highs, and beats reshape the 3D recurrence, camera, and surface light.' },
    bulbOrbit: { defaultRange: .28, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Automatically orbits the camera. Negative values reverse direction; zero leaves manual camera orientation still.' },
    bulbFold: { defaultRange: 0, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Folds the 3D recurrence during each iteration to create mirrored hybrid structures. Zero preserves the pure Mandelbulb equation.' },
    bulbGlow: { defaultRange: 1.2, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls edge light, specular highlights, and the near-surface atmospheric aura.' },
    bulbCamera: { defaultRange: 3.75, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - 2.25) / 3 * 100, toRange: (value) => 2.25 + value / 100 * 3, tip: 'Moves the 3D camera toward or away from the Mandelbulb. The mouse wheel adjusts the same value.' },
    spin: { defaultRange: .18, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Rotates from -50 to +50 percent. Negative values reverse direction.' },
    equationSmoothing: { defaultRange: .9, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Dampens rapid music changes before they reach topology-changing fractal math. Higher values produce calmer, flowing deformation.' },
    equationMod: { defaultRange: .09, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Controls the strength of the smoothed music signal applied directly to the active fractal equation.' },
    beatSensitivity: { defaultRange: .65, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls the independent adaptive onset detector. Higher values recognize quieter and less bass-heavy beats without changing visual or equation smoothing.' },
    beatCooldown: { defaultRange: 150, min: 80, max: 300, step: 5, decimals: 0, tip: 'Minimum time between detected beats. Raise it if a single drum hit triggers twice; lower it for very fast music.' },
    iterations: { defaultRange: 220, min: 80, max: 500, step: 10, decimals: 0, tip: 'Higher iteration counts reveal finer boundaries but require more GPU work.' },
    exportIterations: { defaultRange: 600, min: 240, max: 1200, step: 20, decimals: 0, tip: 'Directly controls mathematical depth for offline export. Selecting a resolution suggests 320 at 480p, 400 at 720p, 600 at 1080p, 800 at 1440p, or 1000 at 4K; you can then choose any value.' },
    obsChromaThreshold: { defaultRange: .08, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / .5 * 100, toRange: (value) => value / 100 * .5, tip: 'Higher values replace more dark pixels with pure key green. Chroma-safe mode automatically shifts green subject colors away from the OBS key.' }
    ,beatBpm: { defaultRange: 120, min: 60, max: 200, step: .1, decimals: 1, tip: 'Manual tempo used when Automatic BPM is off or has not found a reliable beat.' }
    ,beatOffset: { defaultRange: 0, min: -500, max: 500, step: 5, decimals: 0, tip: 'Moves the beat grid earlier or later in milliseconds so visual changes land on the music.' }
  };

  const selectSettingConfigs = {
    playbackRate: { defaultValue: '1', tip: 'Changes live playback and export speed while preserving pitch when supported.' },
    frequencyBandMode: { defaultValue: 'basic', tip: 'Basic uses the recommended frequency bands. Advanced enables custom continuous boundaries for low, mid, and high analysis.' },
    visualStyle: { defaultValue: '0', tip: 'Chooses the GPU-rendered visual composition. Every style uses the active palette and music analysis and is included in video exports.' },
    fractalType: { defaultValue: '0', tip: 'Selects the equation used for the live view and exported video.' },
    resolution: { defaultValue: '1920x1080', tip: 'Sets exported frame size and loads a visible recommended iteration starting point. You can adjust the iteration value afterward.' },
    fps: { defaultValue: '60', tip: 'Sets captured frames per second. 90 and 120 FPS require a fast GPU and storage.' },
    videoFormat: { defaultValue: 'gpu_auto', tip: 'Automatic GPU Master chooses hardware AV1 when supported or hardware HEVC Main 10 on GPUs such as the RTX 3080. Manual HEVC, H.264, VP9, AV1, editing, and lossless profiles remain available.' },
    exportMode: { defaultValue: 'offline', tip: 'Offline rendering completes and submits every exact frame before advancing the music timeline.' },
    exportDetail: { defaultValue: '1.6', tip: 'Multiplies the selected base detail. Offline export also applies a resolution-aware minimum so 1440p and 4K receive enough mathematical definition.' },
    obsResolution: { defaultValue: '1920x1080', tip: 'Sets the exact client size of the clean window selected by OBS Window Capture.' },
    obsFps: { defaultValue: '60', tip: 'Sets how often the control window sends visual and music-analysis state to the OBS output.' }
    ,songDirectorBehavior: { defaultValue: 'auto', tip: 'Auto follows the Music Personality stored with the Song Map. An override changes directing behavior without changing analyzer bands or the visual preset.' }
    ,songDirectorTransition: { defaultValue: 'auto', tip: 'Controls how sections blend. Every option remains continuous: Gentle uses longer blends, while Theatrical concentrates the change without creating a hard cut.' }
    ,songDirectorCueEmphasis: { defaultValue: 'auto', tip: 'Focuses this section on one family of visual controls while retaining a smaller amount of the other automatically generated cues.' }
    ,showAdvanceMode: { defaultValue: 'beats', tip: 'Advance each show entry after musical beats or elapsed seconds.' }
    ,showTransition: { defaultValue: 'black', tip: 'Cut immediately or briefly fade through black without layering conventional and fractal visuals.' }
    ,cameraPathEasing: { defaultValue: 'smooth', tip: 'Smooth is balanced, Linear keeps constant speed, and Cinematic eases very gently at both ends.' }
    ,quickClipDuration: { defaultValue: '10', tip: 'Sets the length of a fast live-canvas clip. Use Export for full-song and maximum-detail rendering.' }
    ,nowPlayingPosition: { defaultValue: 'bottom-left', tip: 'Places the live now-playing card without changing the fractal canvas.' }
    ,performanceMode: { defaultValue: 'auto', tip: 'Automatic uses detected hardware plus the optional eight-second benchmark. Manual modes remain available.' }
  };

  const checkboxSettingDefaults = {
    loopPlayback: false,
    frequencyColor: true,
    songDirectorEnabled: false,
    autoReactivity: true,
    adaptiveQuality: true,
    beatPulse: true,
    autoDrift: true,
    fractalDimensional: false,
    equationFolding: false,
    exportSupersampling: false,
    exportHdrOutput: false,
    showExportPreview: false,
    exportCompleteSound: true,
    obsAlwaysOnTop: false,
    obsChromaKey: false,
    modulationEnabled: true,
    autoBpm: true,
    showLoop: true,
    showShuffle: false,
    obsFollowScenes: true,
    oscAllowLan: false,
    cameraPathLoop: false,
    nowPlayingEnabled: false,
    performanceProtection: true,
    unleashedMode: false
  };

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
  let liveExportCapture;
  let pendingOfflineRender = null;
  let hdrExportFramebuffer = null;
  let hdrExportTexture = null;
  let hdrExportWidth = 0;
  let hdrExportHeight = 0;
  let lastExportPreflight = null;
  let toastTimer;
  const applyingEffectPreset = { fractal: false, fold: false, spectrum: false, radial: false, bulb: false };
  let applyingPulsePreset = false;

  const performanceController = performanceControllerFactory.create({
    query: $,
    onPrevious: () => advanceShow(-1),
    onPlayPause: () => $('#showPlayButton').click(),
    onNext: () => advanceShow(1),
    onToggleBlackout: () => setPerformanceBlackout(!state.performanceBlackout)
  });
  const exportController = exportControllerFactory.create({
    query: $,
    root: document.body,
    onEnd: endAndFinishExport,
    onCancel: cancelExport,
    onPause: togglePauseExport,
    onResolutionChange: (event) => coordinateExportSettingsChange('resolution', { announce: event.isTrusted }),
    onIterationsInput: (event) => coordinateExportSettingsChange('iterations', { value: event.target.value }),
    onFpsChange: () => coordinateExportSettingsChange('fps'),
    onModeChange: () => coordinateExportSettingsChange('mode'),
    onDetailChange: () => coordinateExportSettingsChange('detail'),
    onSupersamplingChange: (event) => coordinateExportSettingsChange('supersampling', { checked: event.target.checked }),
    onFormatChange: () => coordinateExportSettingsChange('format'),
    onHdrChange: () => coordinateExportSettingsChange('hdr'),
    onScanEncoders: scanExportEncoderCapabilities,
    onBenchmark: benchmarkSelectedExportSettings,
    onAdvisorApply: applyExportAdvisorRecommendation,
    onClearHistory: clearExportHistory,
    onHistoryAction: handleExportHistoryAction,
    onRecoveryAction: handleExportRecoveryAction
  });
  const audioController = audioControllerFactory.create({
    query: $,
    audio,
    formatTime,
    getState: () => state,
    reportError: (error) => showToast(error?.message || String(error), true),
    onTogglePlayback: togglePlayback,
    onRestart: () => {
      audio.currentTime = 0;
      resetPulseEvents();
    },
    onSkip: (seconds) => {
      if (Number.isFinite(audio.duration) && !state.exporting) {
        audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
      }
    },
    onSeek: (time) => updateSongMapPlayhead(time),
    onVolume: (value) => {
      state.monitorVolume = value;
      $('#volumeValue').value = `${Math.round(state.monitorVolume * 100)}%`;
      updateMonitorGain();
    },
    onMute: () => {
      state.monitorMuted = !state.monitorMuted;
      $('#muteButton').setAttribute('aria-pressed', String(state.monitorMuted));
      $('#muteButton').textContent = state.monitorMuted ? 'UNMUTE MONITOR' : 'MUTE MONITOR';
      updateMonitorGain();
    },
    onPlaybackRate: (value) => {
      audio.playbackRate = value;
      audio.defaultPlaybackRate = value;
    },
    onLoop: (enabled) => { audio.loop = enabled; }
  });
  const audioAnalysisEngine = audioAnalysisEngineFactory.create();
  const performanceSequencerEngine = performanceSequencerEngineFactory.create();
  const performanceShowDataEngine = performanceShowDataEngineFactory.create({
    createId: () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
  });
  const showComposerController = performanceShowComposerControllerFactory.create({
    query: $,
    documentRef: document,
    getModel: () => ({
      entries: state.showSequence,
      profiles: savedProfiles,
      currentIndex: state.showIndex,
      playing: state.showPlaying,
      hasSongMap: Boolean(activeSongMap?.sections?.length)
    }),
    formatTime,
    entryDuration: showEntrySeconds,
    sequenceDuration: showSequenceDuration,
    entryStart: showEntryStartSeconds,
    profileForEntry: showProfileForEntry,
    sanitizeAutomation: serializeShowAutomation,
    escapeMarkup: escapeShowMarkup,
    onBuild: buildShowFromSongMap,
    onPlay: () => $('#showPlayButton').click(),
    onAdd: addComposerCue,
    onSelect: handleComposerCueSelection,
    onCommit: commitComposerCue,
    onMove: moveComposerCue,
    onSnap: snapComposerCueToSection,
    onDelete: deleteComposerCue,
    onReorder: reorderComposerCue,
    onRecordingChange: (recording) => showToast(recording ? 'Automation recording armed. Live control changes will update the selected cue.' : 'Automation recording stopped.'),
    onRecordAutomation: recordComposerAutomation,
    onRecordCamera: recordComposerCamera,
    onOpenChange: () => requestAnimationFrame(setCanvasSize)
  });
  const profileManagerController = profileManagerControllerFactory.create({
    query: $,
    documentRef: document,
    getProfiles: () => savedProfiles,
    findProfile: (profiles, id) => performanceShowDataEngine.findProfile(profiles, id),
    onSave: saveCurrentProfile,
    onQuickSave: quickSaveCurrentVisualProfile,
    onReset: resetActiveVisual,
    onApply: applySavedProfile,
    onFavorite: favoriteSavedProfile,
    onDelete: deleteSavedProfile,
    onExport: exportSelectedProfile,
    onImport: importProfileFile,
    onRendered: () => {
      renderShowProfileOptions();
      renderObsProfileOptions();
    },
    onError: (message) => showToast(message, true)
  });
  const songMapDataEngine = songMapDataEngineFactory.create();
  const songDirectorEngine = songDirectorEngineFactory.create({ hashText: songMapDataEngine.hashText });
  const songDirectorController = songDirectorControllerFactory.create({
    query: $,
    documentRef: document,
    state,
    audio,
    styles: songDirectorEngine.styles,
    behaviors: songDirectorEngine.behaviors,
    transitions: songDirectorEngine.transitions,
    clamp,
    formatTime,
    getActiveMap: () => activeSongMap,
    getPlan: () => activeSongDirectorPlan,
    setPlan: (plan) => { activeSongDirectorPlan = plan; },
    generatePlan: generateSongDirectorPlan,
    resolveBehavior: resolveSongDirectorBehavior,
    getOverride: songDirectorOverrideFor,
    writeOverride: writeSongDirectorOverride,
    updateSongMapPlayhead,
    updateDirector: updateSongDirector,
    getDirectorTime: () => state.offlineExporting ? (state.offlineCurrentTime || 0) : audio.currentTime,
    showToast
  });
  const performancePackageEngine = performancePackageEngineFactory.create({
    appVersion: appMetadata.version,
    hashText: songMapDataEngine.hashText,
    sanitizeEntry: serializeShowEntry,
    isValidProfile: validProfile,
    isValidSongMap: validSongMap,
    createId: () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
  });
  const exportSessionEngine = exportSessionEngineFactory.create();
  const exportProgressWorkflowEngine = exportProgressWorkflowEngineFactory.create({
    sessionEngine: exportSessionEngine,
    formatTime,
    fileName: exportedFileName
  });
  const exportProgressCoordinator = exportProgressCoordinatorFactory.create({
    workflow: exportProgressWorkflowEngine,
    controller: exportController,
    shouldPlayStinger: () => Boolean($('#exportCompleteSound')?.checked),
    playStinger: playExportCompleteStinger,
    isExporting: () => state.exporting
  });
  exportProgressCoordinator.bindNative((callback) => window.quarticDesktop.onExportProgress?.(callback));
  const exportEncoderEngine = exportEncoderEngineFactory.create();
  const exportLiveCaptureEngine = exportLiveCaptureEngineFactory.create({ encoderEngine: exportEncoderEngine });
  const exportQuickClipWorkflowEngine = exportQuickClipWorkflowEngineFactory.create();
  const exportSamplingEngine = exportSamplingEngineFactory.create();
  const exportSettingsSnapshotEngine = exportSettingsSnapshotEngineFactory.create({
    profiles: exportProfileCatalog,
    samplingEngine: exportSamplingEngine
  });
  const exportPreparationEngine = exportPreparationEngineFactory.create();
  const exportFrameCaptureEngine = exportFrameCaptureEngineFactory.create({
    gl,
    samplingEngine: exportSamplingEngine,
    requestFrame: requestOfflineVisualFrame,
    onSampleState: ({ sampleIndex, offset }) => {
      state.offlineSamplePass = sampleIndex;
      state.exportSampleOffsetX = offset[0];
      state.exportSampleOffsetY = offset[1];
    }
  });
  const exportPlanningEngine = exportPlanningEngineFactory.create({ profiles: exportProfileCatalog });
  const exportPresentationEngine = exportPresentationEngineFactory.create({
    profiles: exportProfileCatalog,
    planningEngine: exportPlanningEngine,
    formatTime,
    fileName: exportedFileName
  });
  const exportPreflightEngine = exportPreflightEngineFactory.create({
    encoderEngine: exportEncoderEngine,
    samplingEngine: exportSamplingEngine
  });
  const exportAdvisorEngine = exportAdvisorEngineFactory.create();
  const exportSettingsCoordinatorEngine = exportSettingsCoordinatorEngineFactory.create({
    advisorEngine: exportAdvisorEngine
  });
  const exportRuntimeStateCoordinator = exportRuntimeStateCoordinatorFactory.create({ state });
  const exportEncoderScanEngine = exportEncoderScanEngineFactory.create();
  const exportBenchmarkEngine = exportBenchmarkEngineFactory.create({ planningEngine: exportPlanningEngine });
  const exportHistoryEngine = exportHistoryEngineFactory.create({
    storage: localStorage,
    createId: () => crypto.randomUUID(),
    now: () => new Date().toISOString()
  });
  const exportResultWorkflowEngine = exportResultWorkflowEngineFactory.create({
    historyEngine: exportHistoryEngine,
    sessionEngine: exportSessionEngine
  });
  const exportHistoryActionEngine = exportHistoryActionEngineFactory.create({ historyEngine: exportHistoryEngine });
  const exportRecoveryEngine = exportRecoveryEngineFactory.create({ sessionEngine: exportSessionEngine });
  const exportRenderCoordinator = exportRenderCoordinatorFactory.create();
  const exportWorkflowEngine = exportWorkflowEngineFactory.create();
  const exportOfflineLifecycle = exportOfflineLifecycleFactory.create({
    sessionEngine: exportSessionEngine,
    finishOfflineExport: (...args) => window.quarticDesktop.finishOfflineExport(...args),
    abortOfflineExport: (...args) => window.quarticDesktop.abortOfflineExport(...args)
  });
  const exportLiveLifecycle = exportLiveLifecycleFactory.create({
    sessionEngine: exportSessionEngine,
    abortExport: (...args) => window.quarticDesktop.abortExport(...args)
  });
  const exportCommandCoordinator = exportCommandCoordinatorFactory.create({
    sessionEngine: exportSessionEngine,
    progressWorkflow: exportProgressWorkflowEngine,
    liveLifecycle: exportLiveLifecycle
  });
  const exportJobCoordinator = exportJobCoordinatorFactory.create({
    offlineLifecycle: exportOfflineLifecycle,
    liveLifecycle: exportLiveLifecycle,
    buildOfflineJob: createOfflineExportJob,
    buildLiveJob: createLiveExportJob,
    validateLive: () => {
      if (!state.unleashedMode) throw new Error('Live export requires Unleashed mode. Use Offline export for exact frames.');
      return Boolean(audio.src);
    }
  });
  window.__quarticControllers = Object.freeze({ audio: audioController, performance: performanceController, showComposer: showComposerController, profileManager: profileManagerController, songDirector: songDirectorController, export: exportController });
  window.__quarticEngines = Object.freeze({
    audioAnalysis: audioAnalysisEngine,
    performanceSequencer: performanceSequencerEngine,
    performanceShowData: performanceShowDataEngine,
    songMapData: songMapDataEngine,
    songDirector: songDirectorEngine,
    performancePackage: performancePackageEngine,
    exportSession: exportSessionEngine,
    exportProgressWorkflow: exportProgressWorkflowEngine,
    exportProgressCoordinator,
    exportCommandCoordinator,
    exportJobCoordinator,
    exportResultWorkflow: exportResultWorkflowEngine,
    exportEncoder: exportEncoderEngine,
    exportLiveCapture: exportLiveCaptureEngine,
    exportQuickClipWorkflow: exportQuickClipWorkflowEngine,
    exportSampling: exportSamplingEngine,
    exportSettingsSnapshot: exportSettingsSnapshotEngine,
    exportPreparation: exportPreparationEngine,
    exportFrameCapture: exportFrameCaptureEngine,
    exportPlanning: exportPlanningEngine,
    exportPresentation: exportPresentationEngine,
    exportPreflight: exportPreflightEngine,
    exportAdvisor: exportAdvisorEngine,
    exportSettingsCoordinator: exportSettingsCoordinatorEngine,
    exportRuntimeState: exportRuntimeStateCoordinator,
    exportEncoderScan: exportEncoderScanEngine,
    exportBenchmark: exportBenchmarkEngine,
    exportHistory: exportHistoryEngine,
    exportHistoryAction: exportHistoryActionEngine,
    exportRecovery: exportRecoveryEngine,
    exportRenderCoordinator,
    exportWorkflow: exportWorkflowEngine,
    exportOfflineLifecycle,
    exportLiveLifecycle
  });

  function createAudioGraph() {
    if (audioContext) return;
    audioContext = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -20;
    analyser.smoothingTimeConstant = state.analysisSmoothing;
    beatAnalyser = audioContext.createAnalyser();
    beatAnalyser.fftSize = 2048;
    beatAnalyser.minDecibels = -90;
    beatAnalyser.maxDecibels = -20;
    beatAnalyser.smoothingTimeConstant = .12;
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
  }

  function audioIsActive() {
    if (state.audioMode === 'live') return Boolean(liveAudioStream?.getAudioTracks().some((track) => track.readyState === 'live'));
    if (state.audioMode === 'native-output') return nativeOutputActive;
    return !audio.paused;
  }

  async function ensureNativeOutputNode() {
    createAudioGraph();
    if (!nativeOutputNodePromise) {
      nativeOutputNodePromise = audioContext.audioWorklet.addModule('pcm-input-worklet.js').then(() => {
        nativeOutputNode = new AudioWorkletNode(audioContext, 'quartic-pcm-input', {
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

  function getActiveFrequencyBands() {
    const personality = musicPersonalityProfiles[state.musicPersonality];
    if (personality) return personality.bands;
    if (state.frequencyBandMode === 'basic') return defaultFrequencyBands;
    return {
      floor: state.frequencyFloor,
      lowMid: state.lowMidSplit,
      midHigh: state.midHighSplit,
      ceiling: state.frequencyCeiling
    };
  }

  function formatFrequency(value) {
    return Math.round(value).toLocaleString('en-US');
  }

  function updateFrequencyBandUi() {
    const advanced = state.frequencyBandMode === 'advanced';
    const bands = getActiveFrequencyBands();
    $('#advancedFrequencyBands').hidden = !advanced;
    $('#frequencyBandSummary').textContent = `LOW ${formatFrequency(bands.floor)}–${formatFrequency(bands.lowMid)} Hz · MIDS ${formatFrequency(bands.lowMid)}–${formatFrequency(bands.midHigh)} Hz · HIGHS ${formatFrequency(bands.midHigh)}–${formatFrequency(bands.ceiling)} Hz`;
  }

  function renderMusicPersonality() {
    const mount = $('#musicPersonalityMount');
    if (!mount) return;
    const activeProfile = musicPersonalityProfiles[state.musicPersonality];
    const bands = getActiveFrequencyBands();
    mount.innerHTML = `
      <div class="section-heading personality-heading"><span>MUSIC PERSONALITY</span><small>${activeProfile ? 'PROFILE ACTIVE' : 'MANUAL'}</small></div>
      <div class="music-personality-grid" role="radiogroup" aria-label="Music Personality profiles">
        ${Object.entries(musicPersonalityProfiles).map(([id, profile]) => `
          <button class="music-personality-card${state.musicPersonality === id ? ' active' : ''}" type="button" data-music-personality="${id}" role="radio" aria-checked="${state.musicPersonality === id}">
            <span class="personality-icon" aria-hidden="true">${profile.icon.map((height) => `<i data-height="${height}"></i>`).join('')}</span>
            <span><strong>${profile.label}</strong><small>${profile.description}</small></span>
          </button>`).join('')}
        <button class="music-personality-card${state.musicPersonality === 'custom' ? ' active' : ''}" type="button" data-music-personality="custom" role="radio" aria-checked="${state.musicPersonality === 'custom'}">
          <span class="personality-icon custom" aria-hidden="true"><i></i><i></i><i></i></span>
          <span><strong>Custom</strong><small>Use your advanced analyzer controls</small></span>
        </button>
      </div>
      <div class="personality-summary">
        <div><strong>${activeProfile?.label || 'Custom analyzer'}</strong><small>${formatFrequency(bands.floor)}-${formatFrequency(bands.lowMid)} Hz low · ${formatFrequency(bands.lowMid)}-${formatFrequency(bands.midHigh)} Hz mid · ${formatFrequency(bands.midHigh)}-${formatFrequency(bands.ceiling)} Hz high</small></div>
        <div class="personality-response"><span>BASS ${Math.round(state.analysisBassGain * 100)}%</span><span>MIDS ${Math.round(state.analysisMidGain * 100)}%</span><span>HIGHS ${Math.round(state.analysisHighGain * 100)}%</span></div>
      </div>`;
  }

  let applyingMusicPersonality = false;

  function setMusicPersonalityCustom({ preserveProfileBands = true } = {}) {
    if (applyingMusicPersonality || state.musicPersonality === 'custom') return;
    const activeBands = getActiveFrequencyBands();
    state.musicPersonality = 'custom';
    const control = $('#musicPersonality');
    if (control) control.value = 'custom';
    if (preserveProfileBands) {
      state.frequencyFloor = activeBands.floor;
      state.lowMidSplit = activeBands.lowMid;
      state.midHighSplit = activeBands.midHigh;
      state.frequencyCeiling = activeBands.ceiling;
      state.frequencyBandMode = 'advanced';
      $('#frequencyBandMode').value = 'advanced';
      for (const id of ['frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling']) {
        $(`#${id}`).value = String(state[id]);
        $(`#${id}`)._syncNumericValue?.();
      }
    }
    renderMusicPersonality();
    updateFrequencyBandUi();
    scheduleSongMapRefresh();
  }

  function applyMusicPersonality(requestedId, { quiet = false } = {}) {
    const id = musicPersonalityProfiles[requestedId] ? requestedId : 'custom';
    const profile = musicPersonalityProfiles[id];
    applyingMusicPersonality = true;
    state.musicPersonality = id;
    $('#musicPersonality').value = id;
    if (profile) {
      [state.analysisBassGain, state.analysisMidGain, state.analysisHighGain] = profile.gains;
      state.frequencyFloor = profile.bands.floor;
      state.lowMidSplit = profile.bands.lowMid;
      state.midHighSplit = profile.bands.midHigh;
      state.frequencyCeiling = profile.bands.ceiling;
      for (const controlId of ['frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling']) {
        $(`#${controlId}`).value = String(state[controlId]);
        $(`#${controlId}`)._syncNumericValue?.();
      }
      state.analysisSmoothing = profile.smoothing;
      state.beatSensitivity = profile.beatSensitivity;
      state.beatCooldownMs = profile.beatCooldownMs;
      state.autoReactivityTarget = profile.autoTarget;
      $('#analysisSmoothing').value = String(profile.smoothing);
      $('#analysisSmoothing')._syncNumericValue?.();
      $('#analysisSmoothingValue').value = `${Math.round(profile.smoothing * 100)}%`;
      $('#beatSensitivity').value = String(profile.beatSensitivity);
      $('#beatSensitivity')._syncNumericValue?.();
      $('#beatSensitivityValue').value = `${Math.round(profile.beatSensitivity * 100)}%`;
      $('#beatCooldown').value = String(profile.beatCooldownMs);
      $('#beatCooldown')._syncNumericValue?.();
      $('#beatCooldownValue').value = `${Math.round(profile.beatCooldownMs)} ms`;
      if (analyser) analyser.smoothingTimeConstant = profile.smoothing;
      resetBeatDetector({ keepTotal: true });
    } else {
      state.analysisBassGain = 1;
      state.analysisMidGain = 1;
      state.analysisHighGain = 1;
    }
    applyingMusicPersonality = false;
    updateFrequencyBandUi();
    renderMusicPersonality();
    scheduleSongMapRefresh();
    if (!quiet) showToast(`${profile?.label || 'Custom'} music response selected`);
  }

  function initializeMusicPersonality() {
    const mount = $('#musicPersonalityMount');
    if (!mount) return;
    mount.addEventListener('click', (event) => {
      const button = event.target.closest('[data-music-personality]');
      if (!button) return;
      $('#musicPersonality').value = button.dataset.musicPersonality;
      $('#musicPersonality').dispatchEvent(new Event('change', { bubbles: true }));
    });
    applyMusicPersonality(state.musicPersonality, { quiet: true });
  }

  function setFrequencyBoundary(key, requestedValue) {
    if (key === 'frequencyFloor') state.frequencyFloor = clamp(requestedValue, 20, state.lowMidSplit - 10);
    if (key === 'lowMidSplit') state.lowMidSplit = clamp(requestedValue, state.frequencyFloor + 10, state.midHighSplit - 50);
    if (key === 'midHighSplit') state.midHighSplit = clamp(requestedValue, state.lowMidSplit + 50, state.frequencyCeiling - 100);
    if (key === 'frequencyCeiling') state.frequencyCeiling = clamp(requestedValue, state.midHighSplit + 100, 20000);
    const range = $(`#${key}`);
    range.value = state[key];
    range._syncNumericValue?.();
    updateFrequencyBandUi();
  }

  function resetPulseEvents() {
    state.pulseEvents.length = 0;
    state.pulsePreviousLevels.fill(0);
    state.pulseLastLevels.fill(0);
    state.pulseArmed.fill(true);
    state.pulseCooldowns.fill(0);
    state.pulseGlobalCooldown = 0;
    state.pulseAcceptedTotal = 0;
    resetEquationAudioEnvelope();
    resetBeatDetector();
  }

  function resetEquationAudioEnvelope() {
    state.equationBass = 0;
    state.equationMids = 0;
    state.equationHighs = 0;
    state.equationBeat = 0;
    state.musicMotionBass = 0;
    state.musicMotionMids = 0;
    state.musicMotionHighs = 0;
    state.musicMotionBeat = 0;
    state.musicBaselineBass = 0;
    state.musicBaselineMids = 0;
    state.musicBaselineHighs = 0;
  }

  function resetBeatDetector({ keepTotal = false } = {}) {
    audioAnalysisEngine.resetBeatDetector(state, { keepTotal });
  }

  function updateAdaptiveBeatDetector(lowEnergy, lowMidEnergy, delta, { register = true } = {}) {
    const detectedBeat = audioAnalysisEngine.updateBeatDetector(state, lowEnergy, lowMidEnergy, delta, {
      register,
      onBeat: registerDetectedBeat
    });
    const diagnostics = audioAnalysisEngine.diagnostics.beat;
    window.__quarticPulseBeatDetectedTotal = state.beatDetectedTotal;
    window.__quarticPulseBeatEnergy = diagnostics.energy;
    window.__quarticPulseBeatOnset = diagnostics.onset;
    window.__quarticPulseBeatThreshold = diagnostics.threshold;
    return detectedBeat;
  }

  function activePulseEventLimit() {
    return Math.min(maximumPulseEvents, Math.max(1, Math.ceil(clamp(state.pulseDensity, 0, 1) * 4)));
  }

  function advancePulseEvents(delta) {
    const playbackRate = audioIsActive() ? 1 : .18;
    for (const event of state.pulseEvents) event.age += delta * playbackRate;
    state.pulseEvents = state.pulseEvents.filter((event) => event.age < 4.6);
    for (let band = 0; band < 3; band++) {
      state.pulseCooldowns[band] = Math.max(0, state.pulseCooldowns[band] - delta);
    }
    state.pulseGlobalCooldown = Math.max(0, state.pulseGlobalCooldown - delta);
  }

  function createMusicPulseEvents(levels) {
    const density = clamp(state.pulseDensity, 0, 1);
    const sensitivityMultiplier = 1.55 - density * .65;
    const thresholds = [.030, .024, .018];
    const minimumLevels = [.075, .055, .040];
    const cooldowns = [.36, .30, .24];
    const candidates = [];
    for (let band = 0; band < 3; band++) {
      const level = levels[band];
      const baseline = state.pulsePreviousLevels[band];
      const lastLevel = state.pulseLastLevels[band];
      const onset = Math.max(0, level - baseline);
      const localRise = Math.max(0, level - lastLevel);
      const threshold = thresholds[band] * sensitivityMultiplier;
      const bassHit = band === 0 && (state.beat > .25 || localRise >= .0025);
      if (!state.pulseArmed[band]
        && (level < lastLevel - .0015 || level <= baseline + threshold * 1.50)) state.pulseArmed[band] = true;
      const transientReady = state.pulseArmed[band] && onset >= threshold;
      const triggered = density > 0 && state.pulseArmed[band] && state.pulseCooldowns[band] <= 0
        && level >= minimumLevels[band]
        && (transientReady || bassHit);
      if (triggered) {
        candidates.push({
          band,
          bassHit,
          intensity: clamp(level + onset * 2.2 + (bassHit ? state.beat * .20 : 0), .16, 1),
          score: onset / threshold + level * .75 + (bassHit ? 1.8 : 0)
        });
      }
      const baselineResponse = level > baseline ? .025 : .14;
      state.pulsePreviousLevels[band] += (level - baseline) * baselineResponse;
      state.pulseLastLevels[band] = level;
    }

    if (state.pulseGlobalCooldown > 0 || candidates.length === 0) return;
    candidates.sort((first, second) => second.score - first.score);
    const chosen = candidates[0];
    state.pulseEvents.push({
      age: 0,
      band: chosen.band,
      strength: chosen.intensity,
      seed: state.pulseAcceptedTotal + 1 + chosen.band * .37
    });
    state.pulseAcceptedTotal += 1;
    const eventLimit = activePulseEventLimit();
    if (state.pulseEvents.length > eventLimit) {
      state.pulseEvents.splice(0, state.pulseEvents.length - eventLimit);
    }
    // Collapse simultaneous low/mid/high attacks into the single strongest event.
    for (const candidate of candidates) state.pulseArmed[candidate.band] = false;
    state.pulseCooldowns[chosen.band] = cooldowns[chosen.band] * state.pulseCooldown;
    state.pulseGlobalCooldown = (1.10 - density * .80) * state.pulseCooldown;
  }

  function updateAudioAnalysis(delta) {
    const result = audioAnalysisEngine.update(state, {
      active: Boolean(analyser && audioIsActive()),
      delta,
      bands: getActiveFrequencyBands(),
      onBeat: registerDetectedBeat,
      onPulse: createMusicPulseEvents
    });
    window.__quarticPulseBeatDetectedTotal = state.beatDetectedTotal;
    window.__quarticPulseBeatEnergy = result.beat.energy;
    window.__quarticPulseBeatOnset = result.beat.onset;
    window.__quarticPulseBeatThreshold = result.beat.threshold;
  }

  function updateEquationAudioEnvelope(delta) {
    const smoothing = clamp(Number(state.equationSmoothing) || 0, 0, 1);
    const smoothingCurve = smoothing * smoothing;
    const frameDelta = clamp(Number(delta) || 0, 1 / 240, .1);
    const shaped = (value) => Math.pow(clamp(Number(value) || 0, 0, 1), 1.45);
    const compressed = (value) => Math.pow(clamp(Number(value) || 0, 0, 1), .78);
    const follow = (current, target, attackBase, releaseBase) => {
      const timeConstant = target > current
        ? attackBase + .32 * smoothingCurve
        : releaseBase + .58 * smoothingCurve;
      return current + (target - current) * (1 - Math.exp(-frameDelta / timeConstant));
    };
    const followMotion = (current, target, attackBase, releaseBase) => {
      // Even at maximum equation smoothing, rhythmic motion remains legible.
      // The release is deliberately longer than the attack so hits become
      // flowing gestures instead of single-frame jumps.
      const timeConstant = target > current
        ? attackBase + .075 * smoothingCurve
        : releaseBase + .20 * smoothingCurve;
      return current + (target - current) * (1 - Math.exp(-frameDelta / timeConstant));
    };
    const followBaseline = (current, target, seconds) => current
      + (target - current) * (1 - Math.exp(-frameDelta / seconds));

    const bassBody = compressed(state.bass);
    const midsBody = compressed(state.mids);
    const highsBody = compressed(state.highs);
    state.musicBaselineBass = followBaseline(state.musicBaselineBass, bassBody, 1.35);
    state.musicBaselineMids = followBaseline(state.musicBaselineMids, midsBody, 1.55);
    state.musicBaselineHighs = followBaseline(state.musicBaselineHighs, highsBody, 1.15);

    const bassAccent = clamp((bassBody - state.musicBaselineBass) * 2.65, 0, 1);
    const midsAccent = clamp((midsBody - state.musicBaselineMids) * 2.35, 0, 1);
    const highsAccent = clamp((highsBody - state.musicBaselineHighs) * 2.15, 0, 1);
    const bassMotionTarget = clamp(bassBody * .30 + bassAccent * .70, 0, 1);
    const midsMotionTarget = clamp(midsBody * .34 + midsAccent * .66, 0, 1);
    const highsMotionTarget = clamp(highsBody * .24 + highsAccent * .58, 0, .82);
    const beatMotionTarget = clamp(Math.pow(clamp(state.beat, 0, 1), .82) * .72, 0, .72);

    state.equationBass = follow(state.equationBass, shaped(state.bass), .045, .12);
    state.equationMids = follow(state.equationMids, shaped(state.mids), .050, .14);
    state.equationHighs = follow(state.equationHighs, shaped(state.highs), .055, .16);
    state.equationBeat = follow(state.equationBeat, shaped(state.beat) * .55, .035, .18);
    state.musicMotionBass = followMotion(state.musicMotionBass, bassMotionTarget, .040, .18);
    state.musicMotionMids = followMotion(state.musicMotionMids, midsMotionTarget, .055, .24);
    state.musicMotionHighs = followMotion(state.musicMotionHighs, highsMotionTarget, .045, .16);
    state.musicMotionBeat = followMotion(state.musicMotionBeat, beatMotionTarget, .030, .20);
  }

  function beatClock() {
    return performance.now() / 1000;
  }

  function registerDetectedBeat() {
    const now = beatClock();
    const times = state.detectedBeatTimes;
    if (times.length && now - times[times.length - 1] < .18) return;
    times.push(now);
    if (times.length > 18) times.shift();
    if (times.length < 3) return;
    const intervals = [];
    for (let index = 1; index < times.length; index++) {
      let interval = times[index] - times[index - 1];
      while (interval < .3) interval *= 2;
      while (interval > 1) interval /= 2;
      if (interval >= .3 && interval <= 1) intervals.push(interval);
    }
    if (intervals.length < 2) return;
    const sorted = [...intervals].sort((first, second) => first - second);
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviations = intervals.map((interval) => Math.abs(interval - median));
    const averageDeviation = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
    state.detectedBpm += (clamp(60 / median, 60, 200) - state.detectedBpm) * .32;
    state.bpmConfidence = clamp((intervals.length / 10) * (1 - averageDeviation / Math.max(.01, median) * 4), 0, 1);
    if (state.bpmConfidence >= .18) {
      const position = (now - state.beatGridAnchor - state.beatOffsetMs / 1000) * state.detectedBpm / 60;
      const phaseError = position - Math.round(position);
      state.beatGridAnchor += phaseError * 60 / state.detectedBpm * .35;
    }
  }

  function effectiveBpm() {
    return state.autoBpm && state.bpmConfidence >= .18 ? state.detectedBpm : state.manualBpm;
  }

  function updateBeatGrid() {
    const bpm = effectiveBpm();
    const position = (beatClock() - state.beatGridAnchor - state.beatOffsetMs / 1000) * bpm / 60;
    const nextIndex = Math.floor(position);
    const changed = nextIndex !== state.beatGridIndex;
    state.beatGridIndex = nextIndex;
    state.beatGridPhase = position - nextIndex;
    return changed;
  }

  function serializeShowAutomation(automation) {
    return performanceShowDataEngine.sanitizeAutomation(automation);
  }

  function escapeShowMarkup(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function serializeShowEntry(entry) {
    return performanceShowDataEngine.sanitizeEntry(entry);
  }

  function showEntrySeconds(entry) {
    return performanceSequencerEngine.entryDurationSeconds(entry, effectiveBpm());
  }

  function showSequenceDuration() {
    return performanceSequencerEngine.sequenceDurationSeconds(state.showSequence, effectiveBpm());
  }

  function showEntryStartSeconds(index) {
    return performanceSequencerEngine.entryStartSeconds(state.showSequence, index, effectiveBpm());
  }

  function composerFullProfiles() {
    return savedProfiles.filter((profile) => profile.kind === 'settings');
  }

  function ensureComposerBaseProfile() {
    let profiles = composerFullProfiles();
    if (profiles.length) return profiles;
    const profile = {
      id: crypto.randomUUID?.() || `composer-${Date.now()}`,
      name: 'Composer Base',
      kind: 'settings',
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: captureProfileData('settings')
    };
    savedProfiles.unshift(profile);
    persistSavedProfiles();
    renderSavedProfiles(profile.id);
    renderShowProfileOptions();
    profiles = [profile];
    return profiles;
  }

  function songMapSectionEnergy(map, section) {
    return songMapDataEngine.sectionEnergy(map, section);
  }

  function composerCameraForSection(section, energy) {
    const label = String(section?.label || '').toLowerCase();
    if (/intro|outro|opening|ending/.test(label)) return 'drift';
    if (/peak|drop|build|climax|chorus/.test(label) || energy > .72) return 'orbit';
    if (/break|bridge|quiet|verse/.test(label) || energy < .34) return 'zoom';
    return 'off';
  }

  function composeShowEntriesFromSongMap(map, profiles) {
    if (!map?.sections?.length || !profiles?.length) return [];
    return map.sections.slice(0, 100).map((section, index) => {
      const energy = songMapSectionEnergy(map, section);
      return serializeShowEntry({
        id: crypto.randomUUID?.() || `cue-${Date.now()}-${index}`,
        profileId: profiles[index % profiles.length].id,
        label: section.label || `Section ${index + 1}`,
        advance: 'time',
        value: Math.max(.1, Math.round((section.end - section.start) * 100) / 100),
        transition: index === 0 ? 'cut' : 'black',
        automation: {
          director: clamp(.3 + energy * .48, 0, 1),
          motion: clamp(.35 + energy * 1.2, 0, 2.5),
          equation: clamp(.025 + energy * .16, 0, 1.5),
          flow: clamp(.12 + energy * .56, 0, 1),
          camera: composerCameraForSection(section, energy)
        }
      });
    });
  }

  function buildShowFromSongMap() {
    if (!activeSongMap?.sections?.length) {
      showToast('Create a Song Map for the loaded track first.', true);
      activateTab('analysis');
      return;
    }
    if (state.showSequence.length && !window.confirm('Replace the current show sequence with Song Map cues?')) return;
    const profiles = ensureComposerBaseProfile();
    state.showPlaying = false;
    state.showIndex = -1;
    state.showSequence = composeShowEntriesFromSongMap(activeSongMap, profiles);
    showComposerController.setSelectedCueId(state.showSequence[0]?.id || '');
    persistShowSequence();
    renderShowSequence();
    renderShowComposer();
    showToast(`Built ${state.showSequence.length} cues from the Song Map.`);
  }

  function updateComposerPlayhead(entryProgress = 0) {
    showComposerController.updatePlayhead(entryProgress);
  }

  function renderShowComposer() {
    showComposerController.render();
  }

  function commitComposerCue(cueId, draft) {
    const index = state.showSequence.findIndex((entry) => entry.id === cueId);
    if (index < 0) return;
    const entry = state.showSequence[index];
    entry.label = draft.label;
    entry.profileId = draft.profileId;
    entry.advance = draft.advance;
    const durationValue = Number(draft.value) || 1;
    entry.value = entry.advance === 'time' ? clamp(Math.round(durationValue * 100) / 100, .1, 3600) : clamp(Math.round(durationValue), 1, 3600);
    entry.transition = draft.transition;
    entry.automation = serializeShowAutomation(draft.automation);
    state.showSequence[index] = serializeShowEntry(entry);
    persistShowSequence();
    renderShowSequence();
  }

  function moveComposerCue(cueId, direction) {
    const index = state.showSequence.findIndex((entry) => entry.id === cueId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.showSequence.length) return;
    [state.showSequence[index], state.showSequence[target]] = [state.showSequence[target], state.showSequence[index]];
    state.showPlaying = false;
    state.showIndex = -1;
    persistShowSequence();
    renderShowSequence();
  }

  function snapComposerCueToSection(cueId) {
    const index = state.showSequence.findIndex((entry) => entry.id === cueId);
    const section = activeSongMap?.sections?.[index];
    if (index < 0 || !section) return showToast('This cue has no matching Song Map section.', true);
    const entry = state.showSequence[index];
    entry.label = section.label || entry.label;
    entry.advance = 'time';
    entry.value = Math.max(.1, Math.round((section.end - section.start) * 100) / 100);
    persistShowSequence();
    renderShowSequence();
    showToast(`Cue snapped to ${section.label || `section ${index + 1}`}.`);
  }

  function handleComposerCueSelection(cueId, { apply = true, seek = true } = {}) {
    const index = state.showSequence.findIndex((entry) => entry.id === cueId);
    if (index < 0) return;
    if (apply) applyShowEntry(index, true);
    if (seek && state.audioMode === 'deck' && Number.isFinite(audio.duration)) {
      audio.currentTime = clamp(showEntryStartSeconds(index), 0, audio.duration);
      updateSongMapPlayhead(audio.currentTime);
    }
  }

  function addComposerCue() {
    const profile = ensureComposerBaseProfile()[0];
    const entry = serializeShowEntry({
      id: crypto.randomUUID?.() || `cue-${Date.now()}`,
      profileId: profile.id,
      label: `Cue ${state.showSequence.length + 1}`,
      advance: 'beats', value: 16, transition: state.showSequence.length ? 'black' : 'cut', automation: {}
    });
    state.showSequence.push(entry);
    persistShowSequence();
    renderShowSequence();
    return entry.id;
  }

  function reorderComposerCue(sourceId, targetId) {
    const sourceIndex = state.showSequence.findIndex((entry) => entry.id === sourceId);
    const targetIndex = state.showSequence.findIndex((entry) => entry.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    const [entry] = state.showSequence.splice(sourceIndex, 1);
    state.showSequence.splice(targetIndex, 0, entry);
    state.showPlaying = false;
    state.showIndex = -1;
    persistShowSequence();
    renderShowSequence();
  }

  function deleteComposerCue(cueId) {
    const index = state.showSequence.findIndex((entry) => entry.id === cueId);
    if (index < 0) return '';
    state.showSequence.splice(index, 1);
    state.showPlaying = false;
    state.showIndex = -1;
    persistShowSequence();
    renderShowSequence();
    return state.showSequence[Math.min(index, state.showSequence.length - 1)]?.id || '';
  }

  function recordComposerAutomation(cueId, key, value) {
    const entry = state.showSequence.find((candidate) => candidate.id === cueId);
    if (!entry) return;
    entry.automation = { ...serializeShowAutomation(entry.automation), [key]: value };
    persistShowSequence();
  }

  function recordComposerCamera(cueId, camera) {
    const entry = state.showSequence.find((candidate) => candidate.id === cueId);
    if (!entry) return;
    entry.automation = { ...serializeShowAutomation(entry.automation), camera };
    persistShowSequence();
  }

  function initializeShowComposer() {
    showComposerController.initialize();
    if (isSmokeTest) window.__quarticPulseComposeShowEntries = composeShowEntriesFromSongMap;
  }

  function applyShowCueAutomation(entry) {
    const application = performanceShowDataEngine.automationApplication(entry);
    applyControlValues(application.controls, fullProfileControlIds);
    if (application.camera) {
      state.cameraMotionPreset = application.camera;
      document.querySelectorAll('[data-camera-preset]').forEach((button) => button.classList.toggle('active', button.dataset.cameraPreset === application.camera));
    }
  }

  function persistShowSequence() {
    try {
      localStorage.setItem('quarticPulseShowSequenceV1', JSON.stringify(performanceShowDataEngine.createShowDocument({
        entries: state.showSequence.map(serializeShowEntry),
        loop: state.showLoop,
        shuffle: state.showShuffle,
        autoBpm: state.autoBpm,
        manualBpm: state.manualBpm,
        beatOffsetMs: state.beatOffsetMs
      })));
    } catch (_) { /* Show persistence is optional. */ }
  }

  function showProfileForEntry(entry) {
    return performanceShowDataEngine.findProfile(savedProfiles, entry?.profileId);
  }

  function resetShowEntryClock() {
    const snapshot = performanceSequencerEngine.clockSnapshot({ time: beatClock(), beat: state.beatGridIndex });
    state.showEntryStartTime = snapshot.time;
    state.showEntryStartBeat = snapshot.beat;
  }

  function updateShowUi() {
    const hasEntries = state.showSequence.length > 0;
    $('#showPlayButton').disabled = !hasEntries;
    $('#showPreviousButton').disabled = !hasEntries;
    $('#showNextButton').disabled = !hasEntries;
    $('#showStopButton').disabled = !state.showPlaying;
    $('#showPlayButton').textContent = state.showPlaying ? 'PAUSE SHOW' : (state.showIndex >= 0 ? 'RESUME SHOW' : 'START SHOW');
    $('#showStatus').textContent = state.showPlaying ? 'PLAYING' : (state.showIndex >= 0 ? 'PAUSED' : 'STOPPED');
    const entry = state.showSequence[state.showIndex];
    const profile = showProfileForEntry(entry);
    $('#showCurrentLabel').textContent = profile ? `${state.showIndex + 1}/${state.showSequence.length} · ${entry.label || profile.name}` : 'Nothing queued';
    document.querySelectorAll('.show-entry').forEach((element) => {
      element.classList.toggle('active', Number(element.dataset.index) === state.showIndex);
    });
    if (showComposerController.initialized) {
      showComposerController.renderPlaybackState();
    }
    updatePerformanceDock();
  }

  const performanceModeStorageKey = 'quarticPulsePerformanceModeV1';

  function nextShowProfileLabel() {
    if (!state.showSequence.length) return 'No show sequence queued';
    if (state.showShuffle && state.showPlaying) return 'Next: shuffled entry';
    const nextIndex = performanceSequencerEngine.previewNextIndex({
      length: state.showSequence.length,
      index: state.showIndex,
      loop: state.showLoop
    });
    if (nextIndex < 0) return 'Next: end of show';
    const entry = state.showSequence[nextIndex];
    return `Next: ${showProfileForEntry(entry)?.name || 'Missing profile'}`;
  }

  function updatePerformanceDock() {
    const entry = state.showSequence[state.showIndex];
    const profile = showProfileForEntry(entry);
    const stateLabel = state.performanceBlackout
      ? 'BLACKOUT ACTIVE'
      : (state.showPlaying ? 'SHOW PLAYING' : (state.showIndex >= 0 ? 'SHOW PAUSED' : 'PERFORMANCE MODE'));
    const currentLabel = profile
      ? `${state.showIndex + 1}/${state.showSequence.length} · ${profile.name}`
      : (state.audioName || 'Manual visual');
    performanceController.renderDock({
      stateLabel,
      currentLabel,
      nextLabel: nextShowProfileLabel(),
      playLabel: state.showPlaying ? 'PAUSE' : (state.showIndex >= 0 ? 'RESUME' : 'START'),
      hasEntries: state.showSequence.length > 0,
      blackout: state.performanceBlackout
    });
  }

  function setPerformanceBlackout(enabled) {
    state.performanceBlackout = Boolean(enabled);
    document.body.classList.toggle('performance-blackout', state.performanceBlackout);
    $('#performanceBlackoutOverlay')?.setAttribute('aria-hidden', String(!state.performanceBlackout));
    updatePerformanceDock();
  }

  async function setPerformanceMode(enabled) {
    if (isObsOutput) return;
    state.operatorMode = Boolean(enabled);
    const keepHud = $('#performanceShowHud').checked;
    document.body.classList.toggle('performance-mode', state.operatorMode);
    document.body.classList.toggle('performance-hide-hud', state.operatorMode && !keepHud);
    performanceController.setVisible(state.operatorMode);
    try {
      localStorage.setItem(performanceModeStorageKey, JSON.stringify({
        fullscreen: $('#performanceFullscreen').checked,
        showHud: keepHud
      }));
    } catch (_) { /* Performance preferences are optional. */ }
    if (state.operatorMode && $('#performanceFullscreen').checked && !document.fullscreenElement) {
      try { await document.documentElement.requestFullscreen(); }
      catch (error) { showToast(`Fullscreen was not available: ${error.message}`, true); }
    } else if (!state.operatorMode && document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (_) { /* The window may already be leaving fullscreen. */ }
    }
    if (!state.operatorMode) setPerformanceBlackout(false);
    updatePerformanceDock();
    requestAnimationFrame(setCanvasSize);
  }

  function initializePerformanceMode() {
    try {
      const saved = JSON.parse(localStorage.getItem(performanceModeStorageKey) || 'null');
      if (saved && typeof saved === 'object') {
        $('#performanceFullscreen').checked = saved.fullscreen !== false;
        $('#performanceShowHud').checked = saved.showHud !== false;
      }
    } catch (_) { /* Keep the safe defaults. */ }
    $('#enterPerformanceModeButton').addEventListener('click', () => setPerformanceMode(true));
    $('#exitPerformanceModeButton').addEventListener('click', () => setPerformanceMode(false));
    $('#performanceShowHud').addEventListener('change', (event) => {
      if (state.operatorMode) document.body.classList.toggle('performance-hide-hud', !event.target.checked);
    });
    performanceController.bind();
    document.addEventListener('fullscreenchange', () => {
      if (state.operatorMode && $('#performanceFullscreen').checked && !document.fullscreenElement) {
        setPerformanceMode(false);
        return;
      }
      if (state.operatorMode) requestAnimationFrame(setCanvasSize);
    });
    updatePerformanceDock();
  }

  function applyShowEntry(index, forceCut = false) {
    if (!state.showSequence.length || state.showTransitioning) return;
    const safeIndex = performanceSequencerEngine.wrapIndex(index, state.showSequence.length);
    const entry = state.showSequence[safeIndex];
    const profile = showProfileForEntry(entry);
    if (!profile) return;
    const finish = () => {
      state.showIndex = safeIndex;
      applySavedProfile(profile);
      applyShowCueAutomation(entry);
      resetShowEntryClock();
      updateShowUi();
    };
    if (entry.transition === 'black' && !forceCut) {
      state.showTransitioning = true;
      state.showTransitionBlack = true;
      $('#showTransitionOverlay').classList.add('visible');
      setTimeout(() => {
        finish();
        setTimeout(() => {
          $('#showTransitionOverlay').classList.remove('visible');
          state.showTransitionBlack = false;
          state.showTransitioning = false;
        }, 300);
      }, 290);
    } else finish();
  }

  function advanceShow(direction = 1) {
    if (!state.showSequence.length) return;
    const decision = performanceSequencerEngine.decideAdvance({
      length: state.showSequence.length,
      index: state.showIndex,
      direction,
      loop: state.showLoop,
      shuffle: state.showShuffle
    });
    if (decision.stop) {
      state.showPlaying = false;
      updateShowUi();
      return;
    }
    applyShowEntry(decision.index);
  }

  function updateShowSequencer(beatChanged) {
    if (!state.showPlaying || state.showIndex < 0 || state.showTransitioning) {
      if (showComposerController.initialized && state.showIndex < 0) updateComposerPlayhead(0);
      return;
    }
    const entry = state.showSequence[state.showIndex];
    if (!entry) return;
    const progress = performanceSequencerEngine.calculateProgress({
      entry,
      startTime: state.showEntryStartTime,
      startBeat: state.showEntryStartBeat,
      currentTime: beatClock(),
      beatIndex: state.beatGridIndex,
      beatPhase: state.beatGridPhase
    });
    $('#showProgressFill').style.width = `${clamp(progress * 100, 0, 100)}%`;
    performanceController.setProgress(progress);
    updateComposerPlayhead(progress);
    if (performanceSequencerEngine.shouldAdvance(entry, progress, beatChanged)) advanceShow(1);
  }

  function setCanvasSize() {
    if (state.exporting) {
      if (canvas.width !== state.exportWidth || canvas.height !== state.exportHeight) {
        canvas.width = state.exportWidth;
        canvas.height = state.exportHeight;
      }
    } else {
      const liveScale = Math.round(state.performanceScale * 20) / 20;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * liveScale;
      const width = Math.max(1, Math.floor(stage.clientWidth * dpr));
      const height = Math.max(1, Math.floor(stage.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
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
    if (hdrExportFramebuffer && hdrExportWidth === width && hdrExportHeight === height) return true;
    releaseHdrExportTarget();
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB10_A2, width, height, 0, gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, null);
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
    hdrExportWidth = width;
    hdrExportHeight = height;
    return true;
  }

  if (new URLSearchParams(window.location.search).get('smoke') === '1') {
    window.__quarticHdrExportReady = ensureHdrExportTarget(64, 64);
    releaseHdrExportTarget();
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

  function combinedRenderModulation(base = {}, director = {}) {
    const combined = { ...base };
    for (const [key, value] of Object.entries(director)) {
      if (!Number.isFinite(value) || ['cueIndex', 'sectionProgress', 'phraseEnergy', 'phraseContour', 'phraseProgress', 'rotationOffset', 'panX', 'panY'].includes(key)) continue;
      combined[key] = clamp((combined[key] || 0) + value, -2, 2);
    }
    combined.rotationOffset = Number(director.rotationOffset) || 0;
    combined.panX = Number(director.panX) || 0;
    combined.panY = Number(director.panY) || 0;
    return combined;
  }

  function render(now) {
    const rawDelta = Math.max(0, (now - state.lastFrame) / 1000);
    if (state.offlineExporting && !pendingOfflineRender) {
      state.lastFrame = now;
      requestAnimationFrame(render);
      return;
    }
    const secondaryOfflineSample = state.offlineExporting && state.offlineSamplePass > 0;
    const delta = state.offlineExporting
      ? (secondaryOfflineSample ? 0 : 1 / state.offlineFps)
      : Math.min(.05, rawDelta);
    state.lastFrame = now;
    if (!state.offlineExporting) collectPerformanceSample(rawDelta * 1000, now);
    if (!isObsOutput && !state.offlineExporting) updateCameraPath(now);
    if (rawDelta < .25) {
      state.frameTime += (Math.min(50, rawDelta * 1000) - state.frameTime) * .045;
    }
    if (!state.exporting && state.adaptiveQuality) {
      if (state.frameTime > 23) state.performanceScale = Math.max(.62, state.performanceScale - delta * .16);
      else if (state.frameTime < 18) state.performanceScale = Math.min(1, state.performanceScale + delta * .07);
    } else if (!state.exporting) {
      state.performanceScale = Math.min(1, state.performanceScale + delta * .8);
    }
    setCanvasSize();
    const renderingTenBitExport = state.offlineExporting && state.offlineTenBitExport && hdrExportFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderingTenBitExport ? hdrExportFramebuffer : null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!secondaryOfflineSample) advancePulseEvents(delta);
    if (!isObsOutput && !state.offlineExporting) updateAudioAnalysis(delta);
    if (!secondaryOfflineSample) updateEquationAudioEnvelope(delta);

    if (!state.offlineExporting) state.visualTime = state.exporting
      ? audio.currentTime
      : state.visualTime + delta * ((isObsOutput ? obsRemoteAudioActive : audioIsActive()) ? 1 : .18);
    const baseModulation = secondaryOfflineSample && state.offlineBaseModulation
      ? state.offlineBaseModulation
      : updateAudioModulation(delta);
    if (state.offlineExporting && !secondaryOfflineSample) state.offlineBaseModulation = baseModulation;
    const directorTime = state.offlineExporting
      ? (state.offlineCurrentTime || 0)
      : (state.audioMode === 'deck' && Number.isFinite(audio.currentTime) ? audio.currentTime : state.visualTime);
    const director = isObsOutput ? (state.songDirectorValues || {}) : updateSongDirector(directorTime);
    const modulation = combinedRenderModulation(baseModulation, director);
    const cameraMotion = cameraPresetTransform();
    const matrixOwnsFractalAudio = state.modulationEnabled
      && (state.visualStyle === 0 || state.visualStyle === 5);
    const directBass = matrixOwnsFractalAudio ? 0 : state.bass;
    const directMids = matrixOwnsFractalAudio ? 0 : state.mids;
    const directHighs = matrixOwnsFractalAudio ? 0 : state.highs;
    const directRms = matrixOwnsFractalAudio ? 0 : state.rms;
    const directBeat = matrixOwnsFractalAudio ? 0 : state.beat;
    const equationBass = matrixOwnsFractalAudio ? 0 : state.equationBass;
    const equationMids = matrixOwnsFractalAudio ? 0 : state.equationMids;
    const equationHighs = matrixOwnsFractalAudio ? 0 : state.equationHighs;
    const equationBeat = matrixOwnsFractalAudio ? 0 : state.equationBeat;
    const musicMotionBass = matrixOwnsFractalAudio ? 0 : state.musicMotionBass;
    const musicMotionMids = matrixOwnsFractalAudio ? 0 : state.musicMotionMids;
    const musicMotionHighs = matrixOwnsFractalAudio ? 0 : state.musicMotionHighs;
    const musicMotionBeat = matrixOwnsFractalAudio ? 0 : state.musicMotionBeat;
    const routedDimensional = modulationTargetIsRouted('fractalTilt', 'fractalSlice');
    const routedFolding = modulationTargetIsRouted('equationFold', 'equationWarp');
    const beatChanged = (isObsOutput || state.offlineExporting) ? false : updateBeatGrid();
    if (!isObsOutput && !state.offlineExporting) updateShowSequencer(beatChanged);
    if (!isObsOutput && !state.offlineExporting && obsOutputOpen && now - obsLastStateSent >= 1000 / obsSyncFps) {
      window.quarticDesktop.publishObsVisualState(createObsVisualSnapshot());
      obsLastStateSent = now;
    }
    const modulatedMotion = clamp(state.motion + (modulation.motion || 0), 0, 4);
    const modulatedZoom = Math.max(.15, 1 + (modulation.zoom || 0));
    const motionEnergy = modulatedMotion * (.32 + directRms * .34 + directMids * .26);
    const orbitRadius = state.autoDrift ? (.012 + .022 * directMids) * motionEnergy / Math.sqrt(state.zoom * modulatedZoom) : 0;
    const orbitAngle = state.visualTime * (.21 + .12 * directMids) * Math.sign(state.spin || 1);
    const renderCenterX = state.center.x + Math.cos(orbitAngle) * orbitRadius + cameraMotion.x + modulation.panX;
    const renderCenterY = state.center.y + Math.sin(orbitAngle * 1.17) * orbitRadius + cameraMotion.y + modulation.panY;
    if (!isObsOutput && !secondaryOfflineSample) {
      const nextModulationRotationPhase = state.modulationRotationPhase + (modulation.rotation || 0) * delta;
      state.modulationRotationPhase = Math.atan2(Math.sin(nextModulationRotationPhase), Math.cos(nextModulationRotationPhase));
    }
    const rotation = state.visualTime * state.spin * modulatedMotion
      + Math.sin(state.visualTime * .63) * .035 * directMids * modulatedMotion
      + state.modulationRotationPhase
      + modulation.rotationOffset;
    if (Number.isFinite(window.__quarticPulseRotation)) {
      const rotationDelta = Math.atan2(Math.sin(rotation - window.__quarticPulseRotation), Math.cos(rotation - window.__quarticPulseRotation));
      window.__quarticPulseMaxRotationStep = Math.max(Number(window.__quarticPulseMaxRotationStep || 0), Math.abs(rotationDelta));
    }
    window.__quarticPulseRotation = rotation;

    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(
      uniforms.uSubpixelOffset,
      state.offlineExporting ? state.exportSampleOffsetX : 0,
      state.offlineExporting ? state.exportSampleOffsetY : 0
    );
    gl.uniform2f(uniforms.uCenter, renderCenterX, renderCenterY);
    gl.uniform1f(uniforms.uScale, 3.15 / (state.zoom * modulatedZoom * cameraMotion.zoom));
    gl.uniform1f(uniforms.uTime, state.visualTime);
    gl.uniform1f(uniforms.uBass, directBass);
    gl.uniform1f(uniforms.uMids, directMids);
    gl.uniform1f(uniforms.uHighs, directHighs);
    gl.uniform1f(uniforms.uRms, directRms);
    gl.uniform1f(uniforms.uBeat, state.beatPulse ? directBeat : 0);
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
    state.pulseEventAges.fill(-1);
    state.pulseEventStrengths.fill(0);
    state.pulseEventBands.fill(0);
    state.pulseEventSeeds.fill(0);
    const pulseEventCount = matrixOwnsFractalAudio
      ? 0
      : Math.min(maximumPulseEvents, state.pulseEvents.length);
    for (let index = 0; index < pulseEventCount; index++) {
      const event = state.pulseEvents[index];
      state.pulseEventAges[index] = event.age;
      state.pulseEventStrengths[index] = event.strength;
      state.pulseEventBands[index] = event.band;
      state.pulseEventSeeds[index] = Number.isFinite(event.seed)
        ? event.seed
        : index + event.band * .37 + 1;
    }
    gl.uniform1i(uniforms.uPulseEventCount, pulseEventCount);
    gl.uniform1fv(uniforms.uPulseEventAge, state.pulseEventAges);
    gl.uniform1fv(uniforms.uPulseEventStrength, state.pulseEventStrengths);
    gl.uniform1fv(uniforms.uPulseEventBand, state.pulseEventBands);
    gl.uniform1fv(uniforms.uPulseEventSeed, state.pulseEventSeeds);
    window.__quarticPulseEventCount = pulseEventCount;
    window.__quarticPulseEventLimit = activePulseEventLimit();
    window.__quarticPulseAcceptedTotal = state.pulseAcceptedTotal;
    gl.uniform1f(uniforms.uRotation, rotation);
    gl.uniform1f(uniforms.uEquation, clamp(state.equation, 0, 2.5));
    gl.uniform1f(uniforms.uFrequencyHue, (matrixOwnsFractalAudio ? 0 : state.frequencyHue) + (modulation.frequencyHue || 0));
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
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (renderingTenBitExport && $('#showExportPreview')?.checked) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.uniform1f(uniforms.uHdrExport, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, hdrExportFramebuffer);
      gl.uniform1f(uniforms.uHdrExport, state.offlineHdrExport ? 1 : 0);
    }
    if (pendingOfflineRender && state.offlineExporting) {
      gl.finish();
      const resolveOfflineRender = pendingOfflineRender;
      pendingOfflineRender = null;
      resolveOfflineRender();
    }
    if (pendingScreenshotRequest && !isObsOutput) {
      const request = pendingScreenshotRequest;
      pendingScreenshotRequest = null;
      canvas.toBlob((blob) => {
        if (blob) request.resolve(blob);
        else request.reject(new Error('Could not read the rendered visual.'));
      }, 'image/png');
    }
    window.__quarticReady = true;

    if (!isObsOutput && (!state.exporting || now - state.lastUiUpdate >= 100)) {
      updateUiMeters();
      state.lastUiUpdate = now;
    }
    requestAnimationFrame(render);
  }

  function updateUiMeters() {
    const values = [state.bass, state.mids, state.highs];
    ['bass','mid','high'].forEach((name, index) => {
      const percent = Math.round(values[index] * 100);
      $(`#${name}Meter`).style.width = `${percent}%`;
      $(`#${name}Value`).value = `${percent}%`;
    });
    const displayedScale = Math.round(state.performanceScale * 20) * 5;
    $('#adaptiveQualityText').textContent = `${displayedScale}% render scale`;
    $('#autoReactivityText').textContent = state.autoReactivity
      ? `Target ${Math.round(state.autoReactivityTarget * 100)}% · ${state.autoReactivityGain.toFixed(2)}× gain`
      : 'Manual sensitivity only';
    $('#frequencyColorMarker').style.left = `${Math.max(0, Math.min(100, state.frequencyHue * 100))}%`;
    $('#dominantFrequencyValue').textContent = state.dominantBand.toUpperCase();
    updateModulationUiMeters();
    updateBeatGridUi();
    updateCameraUi();
    updatePerformanceAssistantUi();
    updateVisualIntensityMeter();
    if (state.audioMode === 'deck' && Number.isFinite(audio.duration)) {
      const offlineSessionActive = state.exporting && exportSessionEngine.mode === 'offline';
      const displayTime = offlineSessionActive ? (state.offlineCurrentTime || 0) : audio.currentTime;
      const progress = audioController.renderTimeline(displayTime, audio.duration);
      updateSongMapPlayhead(displayTime);
      const liveRecordingActive = state.exporting
        && exportSessionEngine.mode === 'live'
        && liveExportCapture?.state === 'recording';
      if (liveRecordingActive) {
        const overall = progress * .80;
        exportProgressCoordinator.update(
          overall,
          `Live recording ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}% | ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`,
          `Live recording ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}%`
        );
      }
    }
  }

  let visualIntensityDisplayScore = null;
  let visualIntensityDisplayedPercent = null;
  let visualIntensityDisplayedLevel = 'calm';
  let visualIntensityLastSampleAt = 0;
  let visualIntensityLastPaintAt = 0;

  function stableVisualIntensityLevel(score) {
    if (visualIntensityDisplayedLevel === 'intense') {
      if (score >= .64) return 'intense';
      return score >= .35 ? 'active' : 'calm';
    }
    if (visualIntensityDisplayedLevel === 'active') {
      if (score >= .70) return 'intense';
      return score >= .35 ? 'active' : 'calm';
    }
    if (score >= .70) return 'intense';
    return score >= .40 ? 'active' : 'calm';
  }

  function updateVisualIntensityMeter() {
    const card = $('#visualIntensityCard');
    if (!card) return;
    const reactivity = clamp(state.reactivity / 3, 0, 1);
    const motion = clamp(Math.abs(state.motion) / 2.5, 0, 1);
    const equation = clamp(Number($('#equationMod')?.value || 0) / 1.5, 0, 1);
    const folding = state.equationFolding
      ? clamp((Number($('#equationFold')?.value || 0) + Number($('#equationWarp')?.value || 0) / 1.5 + Number($('#equationFoldAudio')?.value || 0)) / 3, 0, 1)
      : 0;
    const color = state.frequencyColorEnabled ? clamp(state.frequencyColorAmount || 0, 0, 1) : 0;
    const liveEnergy = clamp((state.rms * .55) + (state.beat * .45), 0, 1);
    const beatWeight = $('#beatPulse')?.checked ? .11 : 0;
    const rawScore = clamp(
      reactivity * .26 + motion * .18 + equation * .21 + folding * .16 + color * .08 + liveEnergy * .11 + beatWeight,
      0,
      1
    );

    const now = performance.now();
    if (visualIntensityDisplayScore === null) {
      visualIntensityDisplayScore = rawScore;
    } else {
      const elapsed = clamp((now - visualIntensityLastSampleAt) / 1000, 1 / 240, .25);
      const timeConstant = rawScore > visualIntensityDisplayScore ? .45 : 2.2;
      const envelopeAmount = 1 - Math.exp(-elapsed / timeConstant);
      visualIntensityDisplayScore += (rawScore - visualIntensityDisplayScore) * envelopeAmount;
    }
    visualIntensityLastSampleAt = now;

    const candidatePercent = Math.round(visualIntensityDisplayScore * 100);
    const candidateLevel = stableVisualIntensityLevel(visualIntensityDisplayScore);
    const levelChanged = candidateLevel !== visualIntensityDisplayedLevel;
    const percentChangedEnough = visualIntensityDisplayedPercent === null
      || Math.abs(candidatePercent - visualIntensityDisplayedPercent) >= 2;
    if (!levelChanged && (!percentChangedEnough || now - visualIntensityLastPaintAt < 300)) return;

    visualIntensityDisplayedLevel = candidateLevel;
    visualIntensityDisplayedPercent = candidatePercent;
    visualIntensityLastPaintAt = now;
    const presentation = {
      calm: {
        label: 'CALM',
        description: 'Current motion and audio response are unlikely to create rapid flashes.'
      },
      active: {
        label: 'ACTIVE',
        description: 'Moderate movement and music response are active; review before streaming to a broad audience.'
      },
      intense: {
        label: 'INTENSE',
        description: 'Strong motion or rapid color/math changes are active. Consider Low Flash for sensitive viewers.'
      }
    }[visualIntensityDisplayedLevel];
    card.dataset.level = visualIntensityDisplayedLevel;
    $('#visualIntensityLabel').textContent = `${presentation.label} · ${visualIntensityDisplayedPercent}%`;
    $('#visualIntensityFill').style.width = `${Math.max(3, visualIntensityDisplayedPercent)}%`;
    $('#visualIntensityText').textContent = presentation.description;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const whole = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function exportedFileName(filePath) {
    return String(filePath || '').split(/[\\/]/).pop() || 'video';
  }

  function playExportCompleteStinger() {
    const stinger = $('#exportCompleteStinger');
    if (!stinger) return;
    stinger.pause();
    stinger.currentTime = 0;
    stinger.volume = 0.7;
    const playback = stinger.play();
    playback?.catch?.((error) => console.warn('Export completion stinger could not play:', error));
  }

  function showToast(message, error = false) {
    const toast = $('#toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function initializeNumericSliders() {
    Object.entries(numericSliderConfigs).forEach(([id, config]) => {
      const range = $(`#${id}`);
      const group = range?.closest('.slider-group');
      const label = group?.querySelector('label');
      if (!range || !group || !label) return;

      const fromRange = config.fromRange || ((value) => value);
      const toRange = config.toRange || ((value) => value);
      const settingName = label.querySelector('span')?.textContent?.trim() || id;
      const tools = document.createElement('span');
      const input = document.createElement('input');
      const tipButton = document.createElement('button');
      const resetButton = document.createElement('button');
      tools.className = 'numeric-value-tools';
      input.className = 'numeric-value-input';
      input.type = 'number';
      input.min = String(config.min);
      input.max = String(config.max);
      input.step = String(config.step);
      input.setAttribute('aria-label', `${settingName} numerical value`);
      tipButton.className = 'setting-tool-button tip-button';
      tipButton.type = 'button';
      tipButton.textContent = '?';
      tipButton.title = config.tip;
      tipButton.setAttribute('aria-label', `${settingName} help`);
      resetButton.className = 'setting-tool-button reset-button';
      resetButton.type = 'button';
      resetButton.textContent = '↺';
      resetButton.title = `Reset ${settingName.toLowerCase()} to default`;
      resetButton.setAttribute('aria-label', `Reset ${settingName} to default`);
      tools.append(input, tipButton, resetButton);
      label.appendChild(tools);
      group.classList.add('numeric-enhanced');

      const syncInput = () => {
        const numericValue = fromRange(Number(range.value));
        const decimals = numericValue >= 100 && config.decimals > 0 ? 0 : config.decimals;
        input.value = Number(numericValue.toFixed(decimals));
      };
      const commitInput = () => {
        if (input.value === '' || !Number.isFinite(Number(input.value))) return syncInput();
        const numericValue = clamp(Number(input.value), config.min, config.max);
        range.value = clamp(toRange(numericValue), Number(range.min), Number(range.max));
        range.dispatchEvent(new Event('input', { bubbles: true }));
        syncInput();
      };
      range.addEventListener('input', syncInput);
      input.addEventListener('change', commitInput);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commitInput();
          input.blur();
        }
      });
      tipButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showToast(config.tip);
      });
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        range.value = config.defaultRange;
        range.dispatchEvent(new Event('input', { bubbles: true }));
        syncInput();
      });
      range._syncNumericValue = syncInput;
      syncInput();
    });
  }

  function initializeSettingTools() {
    Object.entries(selectSettingConfigs).forEach(([id, config]) => {
      const control = $(`#${id}`);
      const label = control?.closest('label');
      if (!control || !label) return;
      const row = document.createElement('span');
      const tipButton = document.createElement('button');
      const resetButton = document.createElement('button');
      row.className = 'select-setting-row';
      tipButton.className = 'setting-tool-button tip-button';
      tipButton.type = 'button';
      tipButton.textContent = '?';
      tipButton.title = config.tip;
      resetButton.className = 'setting-tool-button reset-button';
      resetButton.type = 'button';
      resetButton.textContent = '↺';
      resetButton.title = 'Reset to default';
      control.replaceWith(row);
      row.append(control, tipButton, resetButton);
      tipButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showToast(config.tip);
      });
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        control.value = config.defaultValue;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    Object.entries(checkboxSettingDefaults).forEach(([id, defaultValue]) => {
      const control = $(`#${id}`);
      const label = control?.closest('.toggle-row');
      if (!control || !label) return;
      const resetButton = document.createElement('button');
      resetButton.className = 'setting-tool-button reset-button toggle-reset-button';
      resetButton.type = 'button';
      resetButton.textContent = '↺';
      resetButton.title = 'Reset to default';
      resetButton.setAttribute('aria-label', 'Reset setting to default');
      label.appendChild(resetButton);
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        control.checked = defaultValue;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function initializePaletteTools() {
    const label = document.querySelector('.control-label[for="palette"]');
    if (!label) return;
    const resetButton = document.createElement('button');
    resetButton.className = 'setting-tool-button reset-button inline-reset-button';
    resetButton.type = 'button';
    resetButton.textContent = '↺';
    resetButton.title = 'Reset color system to Ion';
    label.appendChild(resetButton);
    resetButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.querySelector('.palette[data-palette="0"]')?.click();
    });
  }

  function recommendedExportIterations(width, height) {
    return exportSamplingEngine.recommendedIterations(width, height);
  }
  window.__quarticRecommendedExportIterations = recommendedExportIterations;

  function effectiveExportIterations(width, height, requestedIterations = state.exportIterations) {
    return exportSamplingEngine.effectiveIterations(requestedIterations, { unleashed: state.unleashedMode });
  }
  window.__quarticEffectiveExportIterations = effectiveExportIterations;

  function applyResolutionIterationRecommendation({ announce = false } = {}) {
    const { width, height } = exportSettingsSnapshotEngine.parseResolution(exportController.readSettings().resolution);
    const recommendation = recommendedExportIterations(width, height);
    state.exportIterations = recommendation;
    $('#exportIterations').value = String(recommendation);
    $('#exportIterationsValue').value = recommendation;
    if (announce) showToast(`${width}×${height} selected · ${recommendation} export iterations recommended`);
    return recommendation;
  }

  function currentExportSettings(audioDuration = Number(audio.duration) || 0) {
    return exportSettingsSnapshotEngine.capture(exportController.readSettings(), {
      unleashed: state.unleashedMode,
      audioDuration
    });
  }

  function selectedExportProfile() {
    return currentExportSettings().profile;
  }

  function updateExportPerformanceNote() {
    const settings = currentExportSettings();
    const estimate = exportPlanningEngine.profileEstimate({
      profileId: settings.format,
      width: settings.width,
      height: settings.height,
      fps: settings.fps,
      duration: settings.audioDuration,
      hdrOutput: settings.hdrOutput
    });
    exportController.renderPerformance(exportPresentationEngine.performanceView({
      estimate,
      iterations: settings.effectiveIterations,
      supersampling: settings.supersampling
    }));
  }

  function formatByteSize(bytes) {
    return exportPlanningEngine.formatByteSize(bytes);
  }

  function currentExportPreflightSettings(durationOverride = null, refreshEncoder = false) {
    return exportSettingsSnapshotEngine.preflight(currentExportSettings(), { durationOverride, refreshEncoder });
  }

  function requestExportPreflight(durationOverride = null, refreshEncoder = false) {
    return exportPreflightEngine.load(
      currentExportPreflightSettings(durationOverride, refreshEncoder),
      (request) => window.quarticDesktop.getExportPreflight(request)
    );
  }

  function updateEncoderStatus(preflight) {
    const view = exportPresentationEngine.encoderStatusView(preflight, currentExportSettings().format);
    if (view) exportController.renderEncoderStatus(view);
  }

  function populateExportPreflight(preflight) {
    const settings = currentExportSettings();
    exportController.renderPreflight(exportPresentationEngine.preflightView({
      preflight,
      fallbackProfileId: settings.format,
      hdrOutput: settings.hdrOutput,
      testDisabled: state.audioMode !== 'deck' || !currentPlaylistItem()?.filePath
    }));
    updateEncoderStatus(preflight);
  }

  function refreshExportEncoderStatus() {
    return exportPreflightEngine.refresh({
      settings: currentExportPreflightSettings(1),
      requestPreflight: (request) => window.quarticDesktop.getExportPreflight(request),
      started: () => exportController.renderEncoderStatus(exportPresentationEngine.encoderCheckingView()),
      completed: ({ preflight }) => updateEncoderStatus(preflight),
      failed: ({ error }) => exportController.renderEncoderStatus(exportPresentationEngine.encoderFailureView(error))
    });
  }

  function scanExportEncoderCapabilities() {
    return exportEncoderScanEngine.run({
      started: () => exportController.renderEncoderScanState(
        'running',
        exportPresentationEngine.encoderScanRunningView()
      ),
      scan: () => window.quarticDesktop.getExportEncoderCapabilities(),
      completed: ({ report }) => {
        exportController.renderEncoderScanState(
          'completed',
          exportPresentationEngine.encoderScanCompletedView(report)
        );
        if (currentExportSettings().format === 'gpu_auto') {
          updateEncoderStatus({ encoder: report.selected, profile: selectedExportProfile() });
        }
        showToast('Encoder compatibility scan complete');
      },
      failed: ({ error }) => {
        exportController.renderEncoderScanState(
          'failed',
          exportPresentationEngine.encoderScanFailedView(error)
        );
        showToast(error?.message || String(error), true);
      },
      restored: () => exportController.renderEncoderScanState(
        'restored',
        exportPresentationEngine.encoderScanRestoredView()
      )
    }).catch(() => {});
  }

  function modeledExportRenderFps(width, height, exportIterations) {
    const settings = currentExportSettings();
    return exportPlanningEngine.modeledRenderFps({
      liveFps: 1000 / Math.max(1, state.frameTime),
      livePixels: Math.max(1, canvas.width * canvas.height),
      width,
      height,
      visualStyle: state.visualStyle,
      liveIterations: state.iterations,
      exportIterations,
      supersampling: settings.supersampling
    });
  }

  let lastExportBenchmark = null;

  function exportAdvisorRecommendations(reference) {
    const settings = currentExportSettings();
    const resolutions = Array.from($('#resolution').options).map((option) => {
      const [width, height] = option.value.split('x').map(Number);
      return { value: option.value, width, height };
    });
    const frameRates = Array.from($('#fps').options).map((option) => Number(option.value));
    return exportPlanningEngine.advisorRecommendations({
      reference,
      resolutions,
      frameRates,
      currentIterations: settings.requestedIterations,
      unleashed: state.unleashedMode,
      recommendedIterations: recommendedExportIterations,
      liveContext: {
        liveFps: 1000 / Math.max(1, state.frameTime),
        livePixels: Math.max(1, canvas.width * canvas.height),
        visualStyle: state.visualStyle,
        liveIterations: state.iterations,
        supersampling: settings.supersampling
      }
    });
  }

  function renderExportAdvisor(reference) {
    const settings = currentExportSettings();
    exportController.renderAdvisor(exportPresentationEngine.advisorView({
      recommendations: exportAdvisorRecommendations(reference),
      currentResolution: settings.resolution,
      currentFps: settings.fps,
      currentIterations: settings.requestedIterations
    }));
  }

  function applyExportAdvisorRecommendation(selection) {
    return exportSettingsCoordinatorEngine.applyAdvisor(selection, {
      readChoices: () => exportController.readSettingChoices(),
      applySettings: (recommendation) => exportController.applyAdvisorSelection(recommendation, { dispatch: false }),
      syncIterations: syncExportIterations,
      refreshPerformance: updateExportPerformanceNote,
      invalidateBenchmark: invalidateExportBenchmark,
      completed: ({ recommendation }) => showToast(`${recommendation.label} applied · benchmark again to verify`),
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  function invalidateExportBenchmark() {
    exportController.invalidateBenchmark();
    lastExportBenchmark = null;
  }

  function syncExportIterations(value) {
    state.exportIterations = Number(value);
    $('#exportIterationsValue').value = state.exportIterations;
  }

  function syncExportSupersampling(checked) {
    state.exportSupersampling = Boolean(checked);
  }

  function coordinateExportSettingsChange(kind, payload = {}) {
    return exportSettingsCoordinatorEngine.change(kind, payload, {
      recommendIterations: applyResolutionIterationRecommendation,
      syncIterations: syncExportIterations,
      syncSupersampling: syncExportSupersampling,
      updateHdrAvailability: updateExportHdrAvailability,
      refreshPerformance: updateExportPerformanceNote,
      invalidateBenchmark: invalidateExportBenchmark,
      refreshEncoder: isObsOutput ? null : refreshExportEncoderStatus,
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  async function benchmarkSelectedExportSettings() {
    return exportBenchmarkEngine.run({
      prepare: async () => {
        const settings = currentExportSettings();
        return {
          width: settings.width,
          height: settings.height,
          fps: settings.fps,
          iterations: settings.effectiveIterations,
          format: settings.format,
          visualKind: state.visualStyle === 0 ? 'fractal iteration' : 'visual shader'
        };
      },
      started: async ({ context }) => {
        exportController.renderBenchmarkState('running', exportPresentationEngine.benchmarkRunningView(context));
      },
      benchmarkEncoder: (context) => window.quarticDesktop.benchmarkExportEncoder({
        format: context.format,
        width: context.width,
        height: context.height,
        fps: context.fps
      }),
      estimateRenderFps: (context) => modeledExportRenderFps(context.width, context.height, context.iterations),
      skipped: async ({ result, renderFps }) => {
        exportController.renderBenchmarkState('skipped', exportPresentationEngine.benchmarkSkippedView({ result, renderFps }));
      },
      completed: async ({ context, result, renderFps, benchmark }) => {
        exportController.renderBenchmarkState('completed', exportPresentationEngine.benchmarkCompletedView({
          result,
          renderFps,
          benchmark,
          visualKind: context.visualKind
        }));
        lastExportBenchmark = { ...result, encodedFps: benchmark.encoderFps };
        renderExportAdvisor(lastExportBenchmark);
        showToast('Export readiness benchmark complete');
      },
      failed: async ({ error }) => {
        exportController.renderBenchmarkState('failed', exportPresentationEngine.benchmarkFailedView(error));
        showToast(error.message, true);
      },
      restored: async () => exportController.renderBenchmarkState('restored')
    }).catch(() => {});
  }

  function loadExportHistory() {
    exportHistoryEngine.load();
    renderExportHistory();
  }

  function renderExportHistory() {
    exportController.renderHistory(exportPresentationEngine.historyView(exportHistoryEngine.list(12)));
  }

  function clearExportHistory() {
    return exportHistoryActionEngine.clear({
      confirm: () => window.confirm('Clear the recent export history? Exported video files will not be deleted.'),
      completed: renderExportHistory,
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  function handleExportHistoryAction(action, id) {
    return exportHistoryActionEngine.perform(action, id, {
      open: (outputPath) => window.quarticDesktop.openExport(outputPath),
      reveal: (outputPath) => window.quarticDesktop.revealExport(outputPath),
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  }

  function completeExportResult(result, details = {}, presentCompleted) {
    const settings = currentExportSettings();
    return exportResultWorkflowEngine.complete(result, {
      details,
      defaults: {
        mode: exportSessionEngine.mode || 'offline',
        width: settings.width,
        height: settings.height,
        fps: settings.fps
      },
      historyChanged: renderExportHistory,
      progressCompleted: ({ outputPath }) => exportProgressCoordinator.complete(outputPath),
      presentCompleted,
      notify: ({ message, error }) => showToast(message, error)
    });
  }

  function refreshRecoverableExports() {
    return exportHistoryActionEngine.refreshRecoveries({
      load: () => window.quarticDesktop.getRecoverableExports(),
      completed: ({ recoveries }) => exportController.renderRecoveries(exportPresentationEngine.recoveryView(recoveries)),
      failed: ({ recoveries }) => exportController.renderRecoveries(exportPresentationEngine.recoveryView(recoveries))
    });
  }

  function handleExportRecoveryAction(action, id) {
    if (state.exporting) return;
    if (action === 'recover') {
      recoverInterruptedExport(id);
    } else if (window.confirm('Discard this interrupted export and its temporary master?')) {
      exportRecoveryEngine.discard(id, {
        discard: (recoveryId) => window.quarticDesktop.discardRecoverableExport(recoveryId),
        completed: async () => {
          await refreshRecoverableExports();
          showToast('Interrupted export discarded');
        },
        failed: ({ error }) => showToast(error?.message || String(error), true)
      }).catch(() => {});
    }
  }

  function recoverInterruptedExport(id) {
    return exportRecoveryEngine.recover(id, {
      started: () => {
        state.exporting = true;
        exportResultWorkflowEngine.reset();
        exportController.renderRecoveryState('preparing', exportPresentationEngine.recoveryPreparingView());
        exportSessionEngine.startProgress();
      },
      recover: (recoveryId) => window.quarticDesktop.recoverExport(recoveryId),
      completed: ({ result }) => completeExportResult(
        result,
        { mode: 'recovered' },
        () => exportController.renderRecoveryState('completed', exportPresentationEngine.recoveryCompletedView())
      ),
      failed: ({ error }) => {
        exportController.renderRecoveryState('failed', exportPresentationEngine.recoveryFailedView(error));
        showToast(`Recovery failed: ${error?.message || String(error)}`, true);
      },
      restored: async ({ completed }) => {
        state.exporting = false;
        exportController.renderRecoveryState('restored', { completed });
        await refreshRecoverableExports();
      }
    }).catch(() => {});
  }

  let obsOutputOpen = false;

  function getObsOutputOptions() {
    return {
      resolution: $('#obsResolution').value,
      fps: Number($('#obsFps').value),
      alwaysOnTop: $('#obsAlwaysOnTop').checked
    };
  }

  function updateObsChromaUi() {
    const enabled = $('#obsChromaKey').checked;
    $('#obsChromaControls').classList.toggle('control-disabled', !enabled);
    $('#obsChromaControls').inert = !enabled;
  }

  function updateObsOutputUi(open) {
    obsOutputOpen = Boolean(open);
    $('#obsOutputStatus').textContent = obsOutputOpen ? 'OUTPUT LIVE' : 'OUTPUT CLOSED';
    $('#obsLiveCard').classList.toggle('live', obsOutputOpen);
    $('#obsLiveTitle').textContent = obsOutputOpen ? 'OBS OUTPUT IS LIVE' : 'READY FOR OBS';
    $('#obsLiveDetail').textContent = obsOutputOpen
      ? `${$('#obsResolution').selectedOptions[0].textContent} · ${$('#obsFps').value} FPS sync`
      : 'Choose a size, then open the output window.';
    $('#obsOutputButton').classList.toggle('live', obsOutputOpen);
    $('#obsOutputButton').textContent = obsOutputOpen ? 'CLOSE OBS OUTPUT' : 'OPEN OBS OUTPUT';
  }

  async function toggleObsOutput() {
    if (obsOutputOpen) {
      await window.quarticDesktop.closeObsOutput();
      updateObsOutputUi(false);
      return;
    }
    const settings = await window.quarticDesktop.openObsOutput(getObsOutputOptions());
    obsSyncFps = settings.fps;
    updateObsOutputUi(true);
    showToast(`OBS output opened at ${settings.width}×${settings.height} · ${settings.fps} FPS`);
  }

  async function applyObsWindowOptions() {
    obsSyncFps = Number($('#obsFps').value) === 30 ? 30 : 60;
    if (!obsOutputOpen) return updateObsOutputUi(false);
    await window.quarticDesktop.openObsOutput(getObsOutputOptions());
    updateObsOutputUi(true);
  }

  const obsAutomationStorageKey = 'quarticPulseObsAutomationV1';
  let obsSocket = null;
  let obsConnected = false;
  let obsRequestCounter = 0;
  let obsCurrentSceneSources = [];
  const obsPendingRequests = new Map();
  let obsSceneProfileLinks = {};

  function loadObsAutomationSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(obsAutomationStorageKey) || '{}');
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
    localStorage.setItem(obsAutomationStorageKey, JSON.stringify({
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
    for (const profile of savedProfiles) {
      select.appendChild(new Option(`${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`, profile.id));
    }
    select.value = savedProfiles.some((profile) => profile.id === linkedId) ? linkedId : '';
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
    const profile = savedProfiles.find((item) => item.id === obsSceneProfileLinks[sceneName]);
    if (!profile) return;
    try {
      applySavedProfile(profile);
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
      const profile = savedProfiles.find((item) => item.id === profileId);
      showToast(profile ? `${profile.name} linked to ${sceneName}` : `Profile link removed from ${sceneName}`);
    });
  }

  async function refreshAdvancedOutputCapabilities() {
    const capabilities = await window.quarticDesktop.getOutputCapabilities();
    const available = Boolean(capabilities?.spout2Sender);
    $('#spoutCapabilityLight').classList.toggle('ready', available);
    $('#spoutCapabilityText').textContent = available
      ? 'Optional native sender detected · OBS Spout2 plugin also required'
      : 'Native sender not installed · use the built-in OBS output window';
    $('#advancedOutputStatus').textContent = available ? 'SPOUT SENDER DETECTED' : 'WINDOW OUTPUT READY';
    return capabilities;
  }

  function initializeAdvancedOutput() {
    $('#checkAdvancedOutputButton').addEventListener('click', () => {
      refreshAdvancedOutputCapabilities()
        .then((capabilities) => showToast(capabilities.spout2Sender ? 'Optional Spout2 sender detected' : 'Window Capture is ready · native Spout2 sender is not installed'))
        .catch((error) => showToast(`Output check: ${error.message}`, true));
    });
    refreshAdvancedOutputCapabilities().catch(() => { $('#advancedOutputStatus').textContent = 'WINDOW OUTPUT READY'; });
  }

  const liveControlStorageKey = 'quarticPulseLiveControlsV1';
  let liveControlBindings = [];
  let midiAccess = null;
  let midiLearning = false;
  let keyboardCapturing = false;
  let oscRunning = false;

  const liveControlActions = {
    musicToggle: { label: 'Music · Play / Pause', mode: 'trigger', run: () => togglePlayback().catch((error) => showToast(error.message, true)) },
    showToggle: { label: 'Show · Start / Pause', mode: 'trigger', run: () => $('#showPlayButton').click() },
    showPrevious: { label: 'Show · Previous Entry', mode: 'trigger', run: () => advanceShow(-1) },
    showNext: { label: 'Show · Next Entry', mode: 'trigger', run: () => advanceShow(1) },
    showStop: { label: 'Show · Stop', mode: 'trigger', run: () => $('#showStopButton').click() },
    performanceMode: { label: 'Performance · Toggle Operator Mode', mode: 'trigger', run: () => setPerformanceMode(!state.operatorMode) },
    performanceBlackout: { label: 'Performance · Toggle Blackout', mode: 'trigger', run: () => setPerformanceBlackout(!state.performanceBlackout) },
    tapTempo: { label: 'Beat Grid · Tap Tempo', mode: 'trigger', run: () => $('#tapTempoButton').click() },
    visualNext: { label: 'Visual · Next Type', mode: 'trigger', run: () => {
      const control = $('#visualStyle');
      control.value = String((Number(control.value) + 1) % control.options.length);
      control.dispatchEvent(new Event('change', { bubbles: true }));
    } },
    paletteNext: { label: 'Color · Next Palette', mode: 'trigger', run: () => {
      const buttons = [...document.querySelectorAll('.palette')];
      const current = buttons.findIndex((button) => button.classList.contains('active'));
      buttons[(current + 1 + buttons.length) % buttons.length]?.click();
    } },
    obsOutput: { label: 'OBS · Toggle Output Window', mode: 'trigger', run: () => toggleObsOutput().catch((error) => showToast(error.message, true)) },
    resetView: { label: 'Fractal · Reset View', mode: 'trigger', run: resetFractalView },
    reactivity: { label: 'Continuous · Reactivity', mode: 'continuous', controlId: 'reactivity' },
    motion: { label: 'Continuous · Motion', mode: 'continuous', controlId: 'motion' },
    equation: { label: 'Continuous · Equation Modulation', mode: 'continuous', controlId: 'equationMod' },
    frequencyColor: { label: 'Continuous · Frequency Color', mode: 'continuous', controlId: 'frequencyColorAmount' },
    zoom: { label: 'Continuous · Zoom', mode: 'continuous', controlId: 'zoom' }
  };

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
      const settings = JSON.parse(localStorage.getItem(liveControlStorageKey) || '{}');
      liveControlBindings = Array.isArray(settings.bindings) ? settings.bindings.filter(validLiveControlBinding).slice(0, 40) : [];
      const port = Number(settings.oscPort);
      if (Number.isInteger(port) && port > 0 && port <= 65535) $('#oscPort').value = String(port);
      $('#oscAllowLan').checked = Boolean(settings.oscAllowLan);
    } catch (_) {
      liveControlBindings = [];
    }
  }

  function persistLiveControlSettings() {
    localStorage.setItem(liveControlStorageKey, JSON.stringify({
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
      await window.quarticDesktop.stopOsc();
      oscRunning = false;
      $('#oscStatus').textContent = 'STOPPED';
      $('#oscServerButton').textContent = 'START OSC';
      return;
    }
    persistLiveControlSettings();
    const result = await window.quarticDesktop.startOsc({
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
    window.quarticDesktop.onOscMessage((message) => {
      $('#oscLastMessage').textContent = `${message.address} · ${message.args?.map(String).join(', ') || 'trigger'} · ${message.remote}`;
      const firstValue = typeof message.args?.[0] === 'number' ? message.args[0] : 1;
      for (const binding of liveControlBindings) {
        if (binding.type === 'osc' && binding.trigger === message.address) executeLiveControlAction(binding.action, firstValue);
      }
    });
    window.quarticDesktop.onOscError((message) => {
      oscRunning = false;
      $('#oscStatus').textContent = 'ERROR';
      $('#oscServerButton').textContent = 'START OSC';
      showToast(`OSC: ${message}`, true);
    });
  }

  const cameraStorageKey = 'quarticPulseCameraBookmarksV1';
  const creativeToolsStorageKey = 'quarticPulseCreativeToolsV1';
  let cameraBookmarks = [];
  let randomizerUndoSnapshot = null;
  let performanceAnalysis = null;
  let performanceReport = null;
  let pendingScreenshotRequest = null;

  function currentNowPlayingTitle() {
    if (state.nowPlayingTitle.trim()) return state.nowPlayingTitle.trim();
    const source = state.audioName || state.liveAudioLabel || 'Quartic Pulse';
    return source.replace(/\.[a-z0-9]{2,5}$/i, '');
  }

  function updateNowPlayingOverlay() {
    const overlay = $('#nowPlayingOverlay');
    if (!overlay) return;
    overlay.classList.remove('bottom-left', 'bottom-right', 'top-left', 'top-right');
    overlay.classList.add(['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(state.nowPlayingPosition) ? state.nowPlayingPosition : 'bottom-left');
    overlay.classList.toggle('visible', Boolean(state.nowPlayingEnabled));
    overlay.setAttribute('aria-hidden', String(!state.nowPlayingEnabled));
    $('#nowPlayingTitle').textContent = currentNowPlayingTitle();
    $('#nowPlayingArtist').textContent = state.nowPlayingArtist.trim() || 'Tempest Mainframe';
  }

  function persistCameraBookmarks() {
    localStorage.setItem(cameraStorageKey, JSON.stringify(cameraBookmarks));
  }

  function loadCameraBookmarks() {
    try {
      const stored = JSON.parse(localStorage.getItem(cameraStorageKey) || '[]');
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

  function setRangeRandom(id, minimum, maximum) {
    const control = $(`#${id}`);
    if (!control) return;
    control.value = String(minimum + Math.random() * (maximum - minimum));
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control._syncNumericValue?.();
  }

  function randomizeVisuals(level) {
    randomizerUndoSnapshot = captureProfileData('settings');
    const amount = level === 'gentle' ? .3 : (level === 'bold' ? .65 : 1);
    if (!$('#lockVisual').checked) {
      const control = $('#visualStyle');
      control.value = String(Math.floor(Math.random() * control.options.length));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (!$('#lockEquation').checked && state.visualStyle === 0) {
      const control = $('#fractalType');
      control.value = String(Math.floor(Math.random() * control.options.length));
      control.dispatchEvent(new Event('change', { bubbles: true }));
      if (level !== 'gentle') {
        $('#equationFolding').checked = Math.random() > .35;
        $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
        setRangeRandom('equationFold', .15, .25 + amount * .7);
        setRangeRandom('equationWarp', .08, .2 + amount * 1.1);
      }
    }
    if (!$('#lockColors').checked) document.querySelector(`.palette[data-palette="${Math.floor(Math.random() * 5)}"]`)?.click();
    if (!$('#lockMotion').checked) {
      setRangeRandom('flow', .12, .25 + amount * 1.6);
      setRangeRandom('motion', .45, .8 + amount * 2.5);
      setRangeRandom('spin', -.15 - amount * .55, .15 + amount * .55);
    }
    if (!$('#lockReactivity').checked) {
      setRangeRandom('reactivity', .65, .8 + amount * 2.2);
      setRangeRandom('frequencyColorAmount', .35, .5 + amount * 1.1);
    }
    if (!$('#lockCamera').checked) {
      state.center.x += (Math.random() - .5) * amount * .35 / Math.sqrt(state.zoom);
      state.center.y += (Math.random() - .5) * amount * .28 / Math.sqrt(state.zoom);
      state.zoom = clamp(state.zoom * Math.exp((Math.random() - .35) * amount * 2), .4, 12000);
      updateZoomControls();
    }
    $('#randomizerUndoButton').disabled = false;
    $('#randomizerStatus').textContent = level.toUpperCase();
    showToast(`${level[0].toUpperCase()}${level.slice(1)} variation created`);
  }

  function undoRandomizer() {
    if (!randomizerUndoSnapshot) return;
    applyColorProfileData(randomizerUndoSnapshot);
    applyControlValues(randomizerUndoSnapshot.controls, fullProfileControlIds);
    if (randomizerUndoSnapshot.center) state.center = { ...randomizerUndoSnapshot.center };
    updateZoomControls();
    randomizerUndoSnapshot = null;
    $('#randomizerUndoButton').disabled = true;
    $('#randomizerStatus').textContent = 'RESTORED';
    showToast('Previous settings restored');
  }

  async function captureScreenshot() {
    if (pendingScreenshotRequest) throw new Error('A screenshot is already being captured.');
    const blob = await new Promise((resolve, reject) => { pendingScreenshotRequest = { resolve, reject }; });
    const outputPath = await window.quarticDesktop.saveScreenshot(await blob.arrayBuffer());
    if (outputPath) showToast(`Screenshot saved: ${outputPath}`);
  }

  async function captureQuickClip() {
    if (exportQuickClipWorkflowEngine.diagnostics.active || state.exporting) {
      return showToast('A recording is already active.', true);
    }
    return exportQuickClipWorkflowEngine.run({
      duration: $('#quickClipDuration').value,
      beginSession: () => window.quarticDesktop.beginExport({
        suggestedName: `${state.audioName || 'Quartic-Pulse'}-clip`,
        format: 'mp4'
      }),
      prepare: async () => {
        createAudioGraph();
        await audioContext.resume();
      },
      createCapture: ({ session }) => exportLiveCaptureEngine.createCapture({
        canvas,
        audioStream: recordingDestination.stream,
        width: canvas.width,
        height: canvas.height,
        fps: 60,
        onChunk: (bytes) => window.quarticDesktop.appendExport(session.id, bytes)
      }),
      started: ({ duration }) => {
        $('#quickCaptureStatus').textContent = `RECORDING ${duration}s`;
        $('#captureClipButton').disabled = true;
      },
      progress: ({ progress }) => {
        $('#quickCaptureProgress').style.width = `${Math.round(progress * 1000) / 10}%`;
      },
      finalize: (sessionId) => window.quarticDesktop.finishExport(sessionId),
      abort: (sessionId) => window.quarticDesktop.abortExport(sessionId),
      completed: ({ result }) => {
        $('#quickCaptureProgress').style.width = '100%';
        $('#quickCaptureStatus').textContent = 'SAVED';
        showToast(result.warning || `Quick clip saved: ${result.outputPath}`, Boolean(result.warning));
      },
      failed: () => { $('#quickCaptureStatus').textContent = 'FAILED'; },
      restored: () => {
        $('#captureClipButton').disabled = false;
        setTimeout(() => {
          if (!exportQuickClipWorkflowEngine.diagnostics.active) $('#quickCaptureProgress').style.width = '0%';
        }, 1200);
      }
    });
  }

  function initializeCreativeTools() {
    try {
      const settings = JSON.parse(localStorage.getItem(creativeToolsStorageKey) || '{}');
      state.nowPlayingEnabled = Boolean(settings.nowPlayingEnabled);
      state.nowPlayingTitle = typeof settings.nowPlayingTitle === 'string' ? settings.nowPlayingTitle.slice(0, 80) : '';
      state.nowPlayingArtist = typeof settings.nowPlayingArtist === 'string' ? settings.nowPlayingArtist.slice(0, 80) : 'Tempest Mainframe';
      state.nowPlayingPosition = ['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(settings.nowPlayingPosition) ? settings.nowPlayingPosition : 'bottom-left';
    } catch (_) { /* Creative-tool persistence is optional. */ }
    $('#nowPlayingEnabled').checked = state.nowPlayingEnabled;
    $('#nowPlayingTitleInput').value = state.nowPlayingTitle;
    $('#nowPlayingArtistInput').value = state.nowPlayingArtist;
    $('#nowPlayingPosition').value = state.nowPlayingPosition;
    const persistPresentation = () => localStorage.setItem(creativeToolsStorageKey, JSON.stringify({
      nowPlayingEnabled: state.nowPlayingEnabled,
      nowPlayingTitle: state.nowPlayingTitle,
      nowPlayingArtist: state.nowPlayingArtist,
      nowPlayingPosition: state.nowPlayingPosition
    }));
    document.querySelector('.randomizer-actions').addEventListener('click', (event) => {
      const level = event.target.closest('[data-randomize]')?.dataset.randomize;
      if (level) randomizeVisuals(level);
    });
    $('#randomizerUndoButton').addEventListener('click', undoRandomizer);
    $('#captureScreenshotButton').addEventListener('click', () => captureScreenshot().catch((error) => showToast(`Screenshot: ${error.message}`, true)));
    $('#captureClipButton').addEventListener('click', () => captureQuickClip().catch((error) => showToast(`Quick clip: ${error.message}`, true)));
    $('#nowPlayingEnabled').addEventListener('change', (event) => { state.nowPlayingEnabled = event.target.checked; updateNowPlayingOverlay(); persistPresentation(); });
    $('#nowPlayingTitleInput').addEventListener('input', (event) => { state.nowPlayingTitle = event.target.value; updateNowPlayingOverlay(); persistPresentation(); });
    $('#nowPlayingArtistInput').addEventListener('input', (event) => { state.nowPlayingArtist = event.target.value; updateNowPlayingOverlay(); persistPresentation(); });
    $('#nowPlayingPosition').addEventListener('change', (event) => { state.nowPlayingPosition = event.target.value; updateNowPlayingOverlay(); persistPresentation(); });
    updateNowPlayingOverlay();
  }

  function percentile(values, ratio) {
    if (!values.length) return 0;
    const ordered = [...values].sort((first, second) => first - second);
    return ordered[Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * ratio))];
  }

  function finishPerformanceAnalysis() {
    if (!performanceAnalysis) return;
    const samples = performanceAnalysis.samples.filter((value) => value > 0 && value < 100);
    const median = percentile(samples, .5) || state.frameTime;
    const p95 = percentile(samples, .95) || state.frameTime;
    const averageFps = 1000 / Math.max(1, median);
    let tier = 'strong';
    let iterations = Math.max(180, state.iterations);
    let disableHeavy = false;
    let detail = 'Live performance is healthy. Current visual settings have useful headroom.';
    if (p95 > 32 || averageFps < 38) {
      tier = 'limited';
      iterations = 150;
      disableHeavy = true;
      detail = 'Frame pacing is under heavy load. Use lighter live math and reserve dimensional effects for export.';
    } else if (p95 > 23 || averageFps < 50) {
      tier = 'average';
      iterations = 190;
      disableHeavy = state.fractalDimensional && state.equationFolding;
      detail = 'The system is usable but close to its live limit. Adaptive scale and moderate iterations are recommended.';
    } else if (p95 > 18.5 || averageFps < 57) {
      tier = 'balanced';
      iterations = 220;
      detail = 'Performance is balanced. Keep adaptive scale on for complex songs and OBS sessions.';
    } else iterations = Math.max(260, Math.min(360, state.iterations));
    performanceReport = { tier, median, p95, averageFps, iterations, disableHeavy, detail };
    performanceAnalysis = null;
    $('#performanceAssistantStatus').textContent = tier.toUpperCase();
    $('#performanceAnalysisProgress').style.width = '100%';
    $('#performanceRecommendations').innerHTML = `<strong>${Math.round(averageFps)} FPS typical · ${p95.toFixed(1)} ms 95th percentile</strong><br>${detail}<br>Suggested live iterations: ${iterations}${disableHeavy ? ' · turn off Dimensional Rotation and Equation Folding' : ''}.`;
    $('#applyPerformanceButton').disabled = false;
    $('#analyzePerformanceButton').disabled = false;
    $('#analyzePerformanceButton').textContent = 'ANALYZE AGAIN';
  }

  function collectPerformanceSample(frameMilliseconds, now) {
    if (!performanceAnalysis || isObsOutput) return;
    performanceAnalysis.samples.push(frameMilliseconds);
    const progress = (now - performanceAnalysis.startedAt) / performanceAnalysis.durationMs;
    $('#performanceAnalysisProgress').style.width = `${clamp(progress * 100, 0, 100)}%`;
    $('#performanceAssistantStatus').textContent = `ANALYZING ${Math.round(clamp(progress, 0, 1) * 100)}%`;
    if (progress >= 1) finishPerformanceAnalysis();
  }

  function updatePerformanceAssistantUi() {
    if (!$('#performanceFpsValue')) return;
    $('#performanceFpsValue').textContent = String(Math.round(1000 / Math.max(1, state.frameTime)));
    $('#performanceFrameValue').textContent = state.frameTime.toFixed(1);
    $('#performanceScaleValue').textContent = String(Math.round(state.performanceScale * 100));
    $('#performanceProtection').checked = state.adaptiveQuality;
  }

  function applyPerformancePreset(name) {
    const presets = {
      average: { iterations: 160, dimensional: false, folding: false, detail: 1.6 },
      balanced: { iterations: 220, dimensional: false, folding: false, detail: 1.6 },
      showcase: { iterations: 340, dimensional: state.fractalDimensional, folding: state.equationFolding, detail: 2.3 }
    };
    const preset = presets[name];
    if (!preset) return;
    $('#adaptiveQuality').checked = true;
    $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
    $('#iterations').value = String(preset.iterations);
    $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
    $('#iterations')._syncNumericValue?.();
    if (name !== 'showcase') {
      $('#fractalDimensional').checked = preset.dimensional;
      $('#fractalDimensional').dispatchEvent(new Event('change', { bubbles: true }));
      $('#equationFolding').checked = preset.folding;
      $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
    }
    $('#exportDetail').value = String(preset.detail);
    $('#performanceAssistantStatus').textContent = `${name.toUpperCase()} PRESET`;
    showToast(`${name[0].toUpperCase()}${name.slice(1)} performance preset applied`);
  }

  const performanceSettingsKey = 'quarticPulsePerformanceModeV1';

  function persistPerformanceMode() {
    localStorage.setItem(performanceSettingsKey, JSON.stringify({
      mode: state.performanceMode,
      unleashed: state.unleashedMode
    }));
  }

  function recommendHardwareMode(info, rendererLabel) {
    const memoryGb = Number(info.totalMemoryBytes || 0) / 1073741824;
    const gpuText = `${rendererLabel} ${(info.gpuDevices || []).map((device) => `${device.vendorString} ${device.deviceString}`).join(' ')}`.toLowerCase();
    const discrete = /nvidia|geforce|radeon|amd/.test(gpuText);
    let score = 0;
    if (info.logicalProcessors >= 8) score += 1;
    if (info.logicalProcessors >= 16) score += 1;
    if (memoryGb >= 16) score += 1;
    if (memoryGb >= 32) score += 1;
    if (discrete) score += 2;
    if (Number(info.videoMemoryMb) >= 6144) score += 1;
    if (score <= 2) return 'efficient';
    if (score <= 4) return 'balanced';
    return 'performance';
  }

  function updateUnleashedMode(enabled, { announce = false } = {}) {
    state.unleashedMode = Boolean(enabled);
    $('#unleashedMode').checked = state.unleashedMode;
    $('#iterations').max = state.unleashedMode ? '800' : '500';
    const numericInput = $('#iterations').closest('.slider-group')?.querySelector('.numeric-value-input');
    if (numericInput) numericInput.max = state.unleashedMode ? '800' : '500';
    $('#unleashedExportDetail').disabled = !state.unleashedMode;
    if (!state.unleashedMode) {
      if (Number($('#iterations').value) > 500) {
        $('#iterations').value = '500';
        $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
        $('#iterations')._syncNumericValue?.();
      }
      if (Number($('#exportDetail').value) > 2.3) $('#exportDetail').value = '2.3';
    }
    coordinateExportSettingsChange('unleashed');
    persistPerformanceMode();
    if (announce) showToast(state.unleashedMode
      ? 'Unleashed mode enabled · raised shader limits and live export unlocked'
      : 'Unleashed mode disabled · standard safety limits restored');
  }

  function applyHardwarePerformanceMode(requestedMode, announce = true) {
    const mode = requestedMode === 'auto' ? state.hardwareRecommendation : requestedMode;
    const settings = {
      efficient: { iterations: 150, dimensional: false, folding: false, bulbBudget: .72 },
      balanced: { iterations: 220, dimensional: false, folding: false, bulbBudget: .88 },
      performance: { iterations: 320, dimensional: state.fractalDimensional, folding: state.equationFolding, bulbBudget: 1 }
    }[mode] || { iterations: 220, dimensional: false, folding: false, bulbBudget: .88 };
    state.bulbLiveBudget = settings.bulbBudget;
    $('#adaptiveQuality').checked = true;
    $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
    $('#iterations').value = String(settings.iterations);
    $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
    $('#iterations')._syncNumericValue?.();
    if (mode !== 'performance') {
      $('#fractalDimensional').checked = settings.dimensional;
      $('#fractalDimensional').dispatchEvent(new Event('change', { bubbles: true }));
      $('#equationFolding').checked = settings.folding;
      $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (announce) showToast(`${mode[0].toUpperCase()}${mode.slice(1)} hardware profile applied`);
  }

  async function scanHardware({ applyAutomatic = false } = {}) {
    $('#hardwareSummary').innerHTML = '<strong>SCANNING HARDWARE</strong><small>Reading local CPU, memory, and graphics capabilities…</small>';
    const info = await window.quarticDesktop.getHardwareInfo();
    state.hardwareInfo = info;
    let rendererLabel = 'WebGL renderer';
    try { rendererLabel = gl.getParameter(gl.RENDERER) || rendererLabel; } catch (_) { /* Renderer name is optional. */ }
    state.hardwareRecommendation = recommendHardwareMode(info, rendererLabel);
    const memoryGb = Number(info.totalMemoryBytes || 0) / 1073741824;
    const gpuName = (info.gpuDevices || []).find((device) => device.active)?.deviceString
      || (info.gpuDevices || [])[0]?.deviceString
      || rendererLabel;
    $('#hardwareSummary').replaceChildren();
    const title = document.createElement('strong');
    const details = document.createElement('small');
    title.textContent = `RECOMMENDED · ${state.hardwareRecommendation.toUpperCase()}`;
    const videoMemory = Number(info.videoMemoryMb) > 0 ? ` · ${Math.round(Number(info.videoMemoryMb))} MB reported VRAM` : '';
    details.textContent = `${info.cpuModel} · ${info.logicalProcessors} logical threads · ${memoryGb.toFixed(0)} GB RAM · ${gpuName}${videoMemory}`;
    $('#hardwareSummary').append(title, details);
    if (state.performanceMode === 'auto' && applyAutomatic) applyHardwarePerformanceMode('auto', false);
    return info;
  }

  function initializePerformanceAssistant() {
    let rendererLabel = 'WebGL renderer';
    try { rendererLabel = gl.getParameter(gl.RENDERER) || rendererLabel; } catch (_) { /* Renderer name is optional. */ }
    $('#performanceGpuLabel').textContent = `GPU path: ${rendererLabel}`;
    let storedSettings = null;
    try { storedSettings = JSON.parse(localStorage.getItem(performanceSettingsKey) || 'null'); } catch (_) { /* Use automatic defaults. */ }
    state.performanceMode = ['auto', 'efficient', 'balanced', 'performance'].includes(storedSettings?.mode) ? storedSettings.mode : 'auto';
    $('#performanceMode').value = state.performanceMode;
    updateUnleashedMode(Boolean(storedSettings?.unleashed));
    if (state.performanceMode !== 'auto') applyHardwarePerformanceMode(state.performanceMode, false);
    $('#performanceMode').addEventListener('change', (event) => {
      state.performanceMode = event.target.value;
      persistPerformanceMode();
      applyHardwarePerformanceMode(state.performanceMode);
    });
    $('#unleashedMode').addEventListener('change', (event) => updateUnleashedMode(event.target.checked, { announce: true }));
    $('#rescanHardwareButton').addEventListener('click', () => scanHardware({ applyAutomatic: true }).then(() => showToast('Hardware profile refreshed')).catch((error) => showToast(`Hardware scan: ${error.message}`, true)));
    $('#performanceProtection').checked = state.adaptiveQuality;
    $('#performanceProtection').addEventListener('change', (event) => {
      $('#adaptiveQuality').checked = event.target.checked;
      $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
    });
    $('#analyzePerformanceButton').addEventListener('click', () => {
      performanceReport = null;
      performanceAnalysis = { startedAt: performance.now(), durationMs: 8000, samples: [] };
      $('#performanceAnalysisProgress').style.width = '0%';
      $('#performanceRecommendations').textContent = 'Keep music playing and leave the visual you want to test on screen.';
      $('#applyPerformanceButton').disabled = true;
      $('#analyzePerformanceButton').disabled = true;
      $('#analyzePerformanceButton').textContent = 'ANALYZING…';
    });
    $('#applyPerformanceButton').addEventListener('click', () => {
      if (!performanceReport) return;
      $('#adaptiveQuality').checked = true;
      $('#adaptiveQuality').dispatchEvent(new Event('change', { bubbles: true }));
      $('#iterations').value = String(performanceReport.iterations);
      $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
      $('#iterations')._syncNumericValue?.();
      if (performanceReport.disableHeavy) {
        $('#fractalDimensional').checked = false;
        $('#fractalDimensional').dispatchEvent(new Event('change', { bubbles: true }));
        $('#equationFolding').checked = false;
        $('#equationFolding').dispatchEvent(new Event('change', { bubbles: true }));
      }
      showToast('Performance recommendations applied');
    });
    document.querySelector('.performance-presets').addEventListener('click', (event) => {
      const name = event.target.closest('[data-performance-preset]')?.dataset.performancePreset;
      if (name) applyPerformancePreset(name);
    });
    updatePerformanceAssistantUi();
    scanHardware({ applyAutomatic: true }).catch((error) => {
      $('#hardwareSummary').replaceChildren();
      const title = document.createElement('strong');
      const details = document.createElement('small');
      title.textContent = 'HARDWARE SCAN UNAVAILABLE';
      details.textContent = error.message;
      $('#hardwareSummary').append(title, details);
    });
  }

  let reportDiagnostics = null;
  let reportSelectedIncidentId = '';
  let reportGeneratedId = '';

  function rendererReportSnapshot() {
    let webglRenderer = 'Unknown WebGL renderer';
    try { webglRenderer = gl.getParameter(gl.RENDERER) || webglRenderer; } catch (_) { /* Renderer label is optional. */ }
    return {
      visualStyle: state.visualStyle,
      fractalType: state.fractalType,
      audioMode: state.audioMode,
      exporting: state.exporting,
      exportMode: $('#exportMode')?.value || 'offline',
      resolution: $('#resolution')?.value || '',
      fps: $('#fps')?.value || '',
      performanceMode: state.performanceMode,
      unleashed: state.unleashedMode,
      adaptiveQuality: state.adaptiveQuality,
      interfaceMode: state.interfaceMode,
      webglRenderer
    };
  }

  function reportIncidentLabel(incident) {
    const time = new Date(incident.timestamp);
    const date = Number.isNaN(time.getTime()) ? 'Unknown time' : time.toLocaleString();
    return `${date} · ${incident.source} · ${incident.message}`.slice(0, 180);
  }

  function renderReportIncidents() {
    const incidents = reportDiagnostics?.incidents || [];
    const select = $('#reportIncidentSelect');
    select.replaceChildren();
    if (!incidents.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No captured crashes';
      select.appendChild(option);
      reportSelectedIncidentId = '';
    } else {
      incidents.forEach((incident) => {
        const option = document.createElement('option');
        option.value = incident.id;
        option.textContent = reportIncidentLabel(incident);
        select.appendChild(option);
      });
      if (!incidents.some((incident) => incident.id === select.value)) select.value = incidents[0].id;
    }
    $('#reportIncidentCount').textContent = `${incidents.length} SAVED`;
    $('#reportUseIncidentButton').disabled = !incidents.length;
    $('#reportClearIncidentsButton').disabled = !incidents.length;
    const selected = Boolean(reportSelectedIncidentId && incidents.some((incident) => incident.id === reportSelectedIncidentId));
    $('#reportUseIncidentButton').classList.toggle('active', selected);
    $('#reportUseIncidentButton').textContent = selected ? 'REMOVE SELECTED' : 'INCLUDE SELECTED';
  }

  function reportValue(id, fallback = 'Not provided') {
    const value = $(`#${id}`).value.trim();
    return value || fallback;
  }

  function sanitizeGeneratedReport(value) {
    return String(value || '')
      .replace(/https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+/gi, '[REDACTED_DISCORD_WEBHOOK]')
      .replace(/([?&](?:token|key|secret|password)=)[^&\s]+/gi, '$1[REDACTED]');
  }

  function buildReportText(diagnostics) {
    const incident = diagnostics?.incidents?.find((candidate) => candidate.id === reportSelectedIncidentId);
    const appInfo = diagnostics?.application || {};
    const system = diagnostics?.system || {};
    const renderer = diagnostics?.renderer || {};
    reportGeneratedId = `QP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    const lines = [
      '# Quartic Pulse Report',
      '',
      `Report ID: ${reportGeneratedId}`,
      `Created: ${new Date().toISOString()}`,
      `Type: ${$('#reportCategory').selectedOptions[0]?.textContent || 'Bug'}`,
      `Summary: ${reportValue('reportSummary')}`,
      `Contact: ${reportValue('reportContact')}`,
      '',
      '## What happened',
      reportValue('reportActual'),
      '',
      '## Steps to reproduce',
      reportValue('reportSteps'),
      '',
      '## Expected result',
      reportValue('reportExpected')
    ];
    if (incident) {
      lines.push('', '## Captured incident',
        `Time: ${incident.timestamp}`,
        `Source: ${incident.source}`,
        `Message: ${incident.message}`,
        incident.stack ? `Stack:\n${incident.stack}` : 'Stack: Not available',
        incident.details ? `Details: ${incident.details}` : '');
    }
    if ($('#reportIncludeDiagnostics').checked) {
      const gpuNames = (system.gpuDevices || []).map((device) => device.deviceString).filter(Boolean);
      lines.push('', '## Sanitized diagnostics',
        `Quartic Pulse: ${appInfo.version || 'Unknown'}${appInfo.packaged ? ' packaged' : ' development'}`,
        `Electron / Chromium: ${appInfo.electron || '?'} / ${appInfo.chromium || '?'}`,
        `Windows: ${system.windowsVersion || system.windowsRelease || 'Unknown'} · ${system.architecture || '?'}`,
        `CPU: ${system.cpuModel || 'Unknown'} · ${system.logicalProcessors || '?'} logical processors`,
        `Memory: ${formatByteSize(system.totalMemoryBytes || 0)} total · ${formatByteSize(system.freeMemoryBytes || 0)} free`,
        `GPU: ${gpuNames.join(' | ') || renderer.webglRenderer || 'Unknown'}`,
        `Visual: style ${renderer.visualStyle ?? '?'} · equation ${renderer.fractalType ?? '?'} · ${renderer.interfaceMode || '?'} UI`,
        `Audio: ${renderer.audioMode || '?'} · Export active: ${renderer.exporting || 'false'}`,
        `Performance: ${renderer.performanceMode || '?'} · Unleashed: ${renderer.unleashed || 'false'} · Adaptive: ${renderer.adaptiveQuality || 'false'}`);
    }
    lines.push('', 'Privacy: Quartic Pulse removes known local user paths, temporary paths, query-string secrets, and Discord webhook URLs. Audio files and audio content are not included.');
    return sanitizeGeneratedReport(lines.filter((line) => line !== '').join('\n\n').replace(/\n{3,}/g, '\n\n')).slice(0, 50000);
  }

  async function refreshReportDiagnostics() {
    reportDiagnostics = await window.quarticDesktop.getReportDiagnostics(rendererReportSnapshot());
    renderReportIncidents();
    const canSubmit = Boolean(reportDiagnostics.submission?.enabled);
    $('#submitReportButton').disabled = !canSubmit || !$('#reportOutput').value;
    $('#reportSubmitNote').classList.toggle('available', canSubmit);
    $('#reportSubmitNote').textContent = canSubmit
      ? 'Secure submission is available. The public relay forwards the sanitized report without revealing Discord credentials.'
      : 'Online submission is not configured in this build. Copy, Save, Print/PDF, and GitHub remain available; Discord credentials are never stored in the public app.';
    return reportDiagnostics;
  }

  function setReportActionsEnabled(enabled) {
    ['copyReportButton', 'saveReportButton', 'printReportButton', 'githubReportButton'].forEach((id) => { $(`#${id}`).disabled = !enabled; });
    $('#submitReportButton').disabled = !enabled || !reportDiagnostics?.submission?.enabled;
  }

  function initializeReportCenter() {
    $('#reportUseIncidentButton').addEventListener('click', () => {
      const selected = $('#reportIncidentSelect').value;
      reportSelectedIncidentId = reportSelectedIncidentId === selected ? '' : selected;
      renderReportIncidents();
    });
    $('#reportClearIncidentsButton').addEventListener('click', async () => {
      if (!window.confirm('Clear the locally saved crash and error history?')) return;
      await window.quarticDesktop.clearReportIncidents();
      reportSelectedIncidentId = '';
      await refreshReportDiagnostics();
      showToast('Local incident history cleared');
    });
    $('#generateReportButton').addEventListener('click', async () => {
      $('#reportCenterStatus').textContent = 'COLLECTING';
      try {
        const diagnostics = await refreshReportDiagnostics();
        const report = buildReportText(diagnostics);
        $('#reportOutput').value = report;
        $('#reportLengthStatus').textContent = `${report.length.toLocaleString()} CHARACTERS`;
        $('#reportCenterStatus').textContent = 'REPORT READY';
        setReportActionsEnabled(true);
      } catch (error) {
        $('#reportCenterStatus').textContent = 'FAILED';
        showToast(`Report generation failed: ${error.message}`, true);
      }
    });
    $('#copyReportButton').addEventListener('click', async () => {
      await navigator.clipboard.writeText($('#reportOutput').value);
      showToast(`${reportGeneratedId || 'Report'} copied to the clipboard`);
    });
    $('#saveReportButton').addEventListener('click', async () => {
      const outputPath = await window.quarticDesktop.saveReport($('#reportOutput').value);
      if (outputPath) showToast('Diagnostic report saved');
    });
    $('#printReportButton').addEventListener('click', async () => {
      const printed = await window.quarticDesktop.printReport($('#reportOutput').value);
      showToast(printed ? 'Report sent to the selected printer' : 'Printing cancelled');
    });
    $('#githubReportButton').addEventListener('click', async () => {
      await navigator.clipboard.writeText($('#reportOutput').value);
      await window.quarticDesktop.openReportIssues();
      showToast('Report copied; paste it into the new GitHub issue');
    });
    $('#submitReportButton').addEventListener('click', async () => {
      $('#submitReportButton').disabled = true;
      $('#reportCenterStatus').textContent = 'SENDING';
      try {
        const result = await window.quarticDesktop.submitReport($('#reportOutput').value);
        $('#reportCenterStatus').textContent = 'SENT';
        showToast(result?.reportId ? `Report ${result.reportId} sent successfully` : 'Report sent successfully');
      } catch (error) {
        $('#reportCenterStatus').textContent = 'SEND FAILED';
        showToast(error.message, true);
      } finally { $('#submitReportButton').disabled = !reportDiagnostics?.submission?.enabled; }
    });
    refreshReportDiagnostics().catch((error) => {
      $('#reportCenterStatus').textContent = 'DIAGNOSTICS UNAVAILABLE';
      showToast(error.message, true);
    });
  }

  function activateTab(tabName) {
    workspaceShell.activate(tabName, state.interfaceMode);
  }

  function updateVisualStyleOptions() {
    const activeStyle = visualCatalog.get(state.visualStyle);
    document.querySelectorAll('#visualStylePicker [data-visual-style]').forEach((button) => {
      const active = Number(button.dataset.visualStyle) === state.visualStyle;
      button.classList.toggle('active', active);
      button.setAttribute('aria-checked', String(active));
    });
    document.querySelectorAll('[data-visual-options]').forEach((panel) => {
      panel.hidden = Number(panel.dataset.visualOptions) !== state.visualStyle;
    });
    const conventional = state.visualStyle !== 0;
    $('#fractalType').disabled = conventional;
    $('#fractalEquationControl').classList.toggle('control-disabled', conventional);
    const preset = fractalPresets[state.fractalType] || fractalPresets[0];
    $('#formulaLabel').textContent = activeStyle.formulaLabel || (conventional ? activeStyle.name.toUpperCase() : preset.formula);
  }

  const interfaceModeStorageKey = 'quarticPulseInterfaceModeV1';

  function setInterfaceMode(requestedMode, persist = true) {
    const mode = requestedMode === 'advanced' ? 'advanced' : 'basic';
    state.interfaceMode = mode;
    document.body.dataset.interfaceMode = mode;
    workspaceShell.syncInterfaceMode(mode);
    const basic = mode === 'basic';
    document.querySelectorAll('.advanced-ui-only, .advanced-ui-control').forEach((element) => {
      element.hidden = basic;
      if (basic && element.matches('details')) element.open = false;
    });
    if (basic && $('#videoFormat')?.value === 'av1_quality') {
      $('#videoFormat').value = 'gpu_auto';
      coordinateExportSettingsChange('format');
    }
    const activeTab = document.querySelector('.tab-panel.active')?.dataset.tabPanel || 'music';
    activateTab(workspaceShell.normalizeTab(activeTab, mode));
    if (persist) {
      try { localStorage.setItem(interfaceModeStorageKey, mode); } catch (_) { /* Storage is optional. */ }
    }
  }

  function initializeInterfaceMode() {
    let mode = 'basic';
    try { mode = localStorage.getItem(interfaceModeStorageKey) || mode; } catch (_) { /* Use Basic mode. */ }
    setInterfaceMode(mode, false);
    workspaceShell.bindInterfaceMode((nextMode) => {
      if (nextMode === state.interfaceMode) return;
      setInterfaceMode(nextMode);
      showToast(`${state.interfaceMode === 'advanced' ? 'Advanced' : 'Basic'} controls enabled`);
    });
  }

  function updateFractalDimensionalUi() {
    const controls = $('#fractalDepthControls');
    const disabled = !state.fractalDimensional;
    controls.classList.toggle('control-disabled', disabled);
    controls.inert = disabled;
    controls.setAttribute('aria-disabled', String(disabled));
    if (disabled) controls.querySelectorAll('details').forEach((details) => { details.open = false; });
  }

  function updateEquationFoldingUi() {
    const controls = $('#equationFoldControls');
    const disabled = !state.equationFolding;
    controls.classList.toggle('control-disabled', disabled);
    controls.inert = disabled;
    controls.setAttribute('aria-disabled', String(disabled));
    if (disabled) controls.querySelectorAll('details').forEach((details) => { details.open = false; });
  }

  function normalizedPercent(id, rangeValue) {
    const config = numericSliderConfigs[id];
    const displayed = config?.fromRange ? config.fromRange(Number(rangeValue)) : Number(rangeValue) * 100;
    return `${Math.round(displayed)}%`;
  }

  function visualEffectOutput(id, rangeValue) {
    return id === 'bulbPower' ? String(Math.round(Number(rangeValue))) : normalizedPercent(id, rangeValue);
  }

  function markEffectPresetCustom(groupName) {
    if (applyingEffectPreset[groupName]) return;
    document.querySelectorAll(`[data-effect-group="${groupName}"] .visual-preset`)
      .forEach((button) => button.classList.remove('active'));
  }

  function applyEffectPreset(groupName, presetName) {
    const preset = effectPresets[groupName]?.[presetName];
    if (!preset) return;
    applyingEffectPreset[groupName] = true;
    for (const [id, value] of Object.entries(preset.values)) {
      const control = $(`#${id}`);
      if (!control) {
        if (Object.prototype.hasOwnProperty.call(state, id)) state[id] = value;
        continue;
      }
      control.value = value;
      control.dispatchEvent(new Event(control.type === 'range' ? 'input' : 'change', { bubbles: true }));
      control._syncNumericValue?.();
    }
    applyingEffectPreset[groupName] = false;
    document.querySelectorAll(`[data-effect-group="${groupName}"] .visual-preset`).forEach((button) => {
      button.classList.toggle('active', button.dataset.effectPreset === presetName);
    });
    const groupLabels = { fractal: 'Dimensional Rotation', fold: 'Equation Fold & Warp', spectrum: 'Spectrum Bars', radial: 'Radial Spectrum', bulb: '3D Mandelbulb' };
    showToast(`${preset.label} ${groupLabels[groupName]} preset selected`);
  }

  function initializeVisualEffectControls() {
    const barStyleControl = $('#barStyle');
    barStyleControl?.addEventListener('change', (event) => {
      state.barStyle = Number(event.target.value);
    });
    for (const [groupName, controlIds] of Object.entries(effectControlGroups)) {
      for (const id of controlIds) {
        $(`#${id}`).addEventListener('input', (event) => {
          state[id] = Number(event.target.value);
          $(`#${id}Value`).value = visualEffectOutput(id, state[id]);
          markEffectPresetCustom(groupName);
        });
        $(`#${id}Value`).value = visualEffectOutput(id, state[id]);
      }
      $(`[data-effect-group="${groupName}"]`).addEventListener('click', (event) => {
        const button = event.target.closest('.visual-preset');
        if (button) applyEffectPreset(groupName, button.dataset.effectPreset);
      });
    }
  }

  function markPulsePresetCustom() {
    if (applyingPulsePreset) return;
    document.querySelectorAll('.pulse-preset').forEach((button) => button.classList.remove('active'));
  }

  function applyPulsePreset(presetName) {
    const preset = pulsePresets[presetName];
    if (!preset) return;
    applyingPulsePreset = true;
    for (const [id, value] of Object.entries(preset.values)) {
      const control = $(`#${id}`);
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
    }
    applyingPulsePreset = false;
    document.querySelectorAll('.pulse-preset').forEach((button) => {
      button.classList.toggle('active', button.dataset.pulsePreset === presetName);
    });
    showToast(`${preset.label} Pulse preset selected`);
  }

  function applyControlDefaults(values) {
    for (const [id, value] of Object.entries(values)) {
      const control = $(`#${id}`);
      if (!control) continue;
      control.value = String(value);
      control.dispatchEvent(new Event(control.type === 'range' ? 'input' : 'change', { bubbles: true }));
      control._syncNumericValue?.();
    }
  }

  function applyExperiencePreset(presetName, { quiet = false } = {}) {
    const preset = experiencePresets[presetName];
    if (!preset) return;
    applyControlDefaults(preset.values);
    for (const [id, checked] of Object.entries(preset.checks)) {
      const control = $(`#${id}`);
      if (!control) continue;
      control.checked = checked;
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.querySelectorAll('[data-experience-preset]').forEach((button) => {
      button.classList.toggle('active', button.dataset.experiencePreset === presetName);
    });
    if (!quiet) showToast(`${preset.label} visual response selected`);
  }

  function applyFractalRecommendedPreset(preset) {
    const values = fractalEquationProfiles[preset.profile] || fractalEquationProfiles.signature;
    applyControlDefaults(values);
    document.querySelector(`.palette[data-palette="${preset.palette}"]`)?.click();
  }

  const visualSafetyStorageKey = 'quarticPulseVisualSafetyV1';

  function initializeVisualSafety() {
    const dialog = $('#visualSafetyDialog');
    let acknowledged = false;
    try { acknowledged = localStorage.getItem(visualSafetyStorageKey) === 'acknowledged'; } catch (_) { /* Show the warning. */ }
    if (acknowledged) return;
    dialog.hidden = false;
    const dismiss = (presetName) => {
      applyExperiencePreset(presetName);
      dialog.hidden = true;
      try { localStorage.setItem(visualSafetyStorageKey, 'acknowledged'); } catch (_) { /* Storage is optional. */ }
    };
    $('#visualSafetyLowFlashButton').addEventListener('click', () => dismiss('lowFlash'), { once: true });
    $('#visualSafetyContinueButton').addEventListener('click', () => dismiss('balanced'), { once: true });
    requestAnimationFrame(() => $('#visualSafetyLowFlashButton').focus());
  }

  const fractalFavoritesStorageKey = 'quarticPulseFractalFavoritesV1';
  let favoriteFractals = [];

  function fractalOptionName(value) {
    return [...$('#fractalType').options].find((option) => option.value === String(value))?.textContent || `Equation ${value}`;
  }

  function loadFractalFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem(fractalFavoritesStorageKey) || '[]');
      favoriteFractals = Array.isArray(stored) ? stored.map(String).filter((value) => [...$('#fractalType').options].some((option) => option.value === value)) : [];
    } catch (_) { favoriteFractals = []; }
  }

  function renderFractalLibrary() {
    const selected = $('#fractalType').value;
    const query = $('#fractalSearch').value.trim().toLowerCase();
    const matches = [...$('#fractalType').options].filter((option) => !query || option.textContent.toLowerCase().includes(query));
    for (const option of $('#fractalType').options) option.hidden = Boolean(query) && !matches.includes(option);
    const favoriteButton = $('#favoriteFractalButton');
    const isFavorite = favoriteFractals.includes(selected);
    favoriteButton.classList.toggle('active', isFavorite);
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
    favoriteButton.textContent = `${isFavorite ? '\u2605' : '\u2606'} FAVORITE`;
    const container = $('#fractalFavoriteButtons');
    container.replaceChildren();
    const choices = query ? matches.map((option) => option.value) : favoriteFractals;
    for (const value of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.fractalValue = value;
      button.textContent = fractalOptionName(value);
      container.appendChild(button);
    }
    const section = $('#fractalFavorites');
    section.hidden = choices.length === 0;
    section.querySelector(':scope > span').textContent = query ? `SEARCH RESULTS · ${choices.length}` : 'FAVORITES';
  }

  function initializeFractalLibrary() {
    loadFractalFavorites();
    renderFractalLibrary();
    $('#fractalSearch').addEventListener('input', renderFractalLibrary);
    $('#favoriteFractalButton').addEventListener('click', () => {
      const value = $('#fractalType').value;
      favoriteFractals = favoriteFractals.includes(value)
        ? favoriteFractals.filter((item) => item !== value)
        : [...favoriteFractals, value];
      localStorage.setItem(fractalFavoritesStorageKey, JSON.stringify(favoriteFractals));
      renderFractalLibrary();
    });
    $('#fractalFavoriteButtons').addEventListener('click', (event) => {
      const value = event.target.closest('[data-fractal-value]')?.dataset.fractalValue;
      if (!value) return;
      $('#fractalType').value = value;
      $('#fractalType').dispatchEvent(new Event('change', { bubbles: true }));
      renderFractalLibrary();
    });
  }

  function resetActiveVisual() {
    if (state.visualStyle === 0) {
      resetFractalView();
      applyControlDefaults({
        ...effectPresets.fractal.dimensional.values,
        ...effectPresets.fold.soft.values,
        coreCStrength: .5,
        coreBiasReal: 0,
        coreBiasImag: 0
      });
      for (const id of ['fractalDimensional', 'equationFolding']) {
        const control = $(`#${id}`);
        control.checked = false;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      document.querySelectorAll('[data-effect-group="fractal"] .visual-preset').forEach((button) => {
        button.classList.toggle('active', button.dataset.effectPreset === 'dimensional');
      });
      document.querySelectorAll('[data-effect-group="fold"] .visual-preset').forEach((button) => {
        button.classList.toggle('active', button.dataset.effectPreset === 'soft');
      });
      showToast('Fractal view and equation effects reset');
      return;
    }
    if (state.visualStyle === 1) return applyEffectPreset('spectrum', 'balanced');
    if (state.visualStyle === 2) return applyEffectPreset('radial', 'balanced');
    if (state.visualStyle === 3) return applyPulsePreset('balanced');
    if (state.visualStyle === 5) {
      state.bulbYaw = .38;
      state.bulbPitch = .12;
      applyEffectPreset('bulb', 'quartic');
      showToast('3D Mandelbulb view reset');
      return;
    }
    applyControlDefaults({ flow: .28, motion: .85, reactivity: .9 });
    showToast(state.visualStyle === 6
      ? 'Data Horizon quick controls reset'
      : 'Waveform Field quick controls reset');
  }

  function updateZoomControls() {
    const zoomSlider = $('#zoom');
    const sliderValue = Math.max(Number(zoomSlider.min), Math.min(Number(zoomSlider.max), (Math.log10(state.zoom) + .4) * 25));
    zoomSlider.value = sliderValue;
    $('#zoomValue').value = `${state.zoom < 10 ? state.zoom.toFixed(2) : state.zoom.toFixed(0)}×`;
    zoomSlider._syncNumericValue?.();
  }

  function resetFractalView() {
    const preset = fractalPresets[state.fractalType] || fractalPresets[0];
    state.center.x = preset.center[0];
    state.center.y = preset.center[1];
    state.zoom = preset.zoom;
    state.modulationRotationPhase = 0;
    updateZoomControls();
  }

  function panelWidthLimits() {
    const minimum = 300;
    const ultrawide = window.innerWidth >= 2560;
    const preferredMaximum = ultrawide
      ? Math.min(900, Math.round(window.innerWidth * .24))
      : 520;
    return {
      minimum,
      maximum: Math.max(minimum, Math.min(preferredMaximum, window.innerWidth - 440)),
      maximumScale: ultrawide ? 1.65 : 1.25
    };
  }

  function setPanelWidth(requestedWidth, persist = true) {
    const { minimum, maximum, maximumScale } = panelWidthLimits();
    const width = Math.round(Math.max(minimum, Math.min(maximum, requestedWidth)));
    const scale = Math.max(.86, Math.min(maximumScale, width / 360));
    document.documentElement.style.setProperty('--panel-width', `${width}px`);
    document.documentElement.style.setProperty('--panel-scale', scale.toFixed(3));
    document.documentElement.style.setProperty('--panel-layout-width', `${(width / scale).toFixed(2)}px`);
    document.documentElement.style.setProperty('--panel-layout-height', `${(window.innerHeight / scale).toFixed(2)}px`);
    $('#panelResizer').setAttribute('aria-valuemin', String(minimum));
    $('#panelResizer').setAttribute('aria-valuemax', String(maximum));
    $('#panelResizer').setAttribute('aria-valuenow', String(width));
    if (persist) {
      try { localStorage.setItem('quarticPanelWidth', String(width)); } catch (_) { /* Storage is optional. */ }
    }
    return width;
  }

  function initializePanelResizer() {
    const resizer = $('#panelResizer');
    let width = 360;
    try { width = Number(localStorage.getItem('quarticPanelWidth')) || width; } catch (_) { /* Use the default. */ }
    setPanelWidth(width, false);

    const endResize = (event) => {
      if (!document.body.classList.contains('resizing-panel')) return;
      document.body.classList.remove('resizing-panel');
      if (event?.pointerId !== undefined && resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    };

    resizer.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      resizer.setPointerCapture(event.pointerId);
      document.body.classList.add('resizing-panel');
      setPanelWidth(window.innerWidth - event.clientX);
    });
    resizer.addEventListener('pointermove', (event) => {
      if (document.body.classList.contains('resizing-panel')) setPanelWidth(window.innerWidth - event.clientX);
    });
    resizer.addEventListener('pointerup', endResize);
    resizer.addEventListener('pointercancel', endResize);
    resizer.addEventListener('dblclick', () => setPanelWidth(360));
    resizer.addEventListener('keydown', (event) => {
      const current = Number(resizer.getAttribute('aria-valuenow')) || 360;
      let next = current;
      if (event.key === 'ArrowLeft') next += 20;
      else if (event.key === 'ArrowRight') next -= 20;
      else if (event.key === 'Home') next = 300;
      else if (event.key === 'End') next = panelWidthLimits().maximum;
      else return;
      event.preventDefault();
      setPanelWidth(next);
    });
    window.addEventListener('resize', () => setPanelWidth(Number(resizer.getAttribute('aria-valuenow')) || 360, false));
  }

  function clampByte(value) {
    return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
  }

  function rgbToHex(rgb) {
    return `#${rgb.map((value) => clampByte(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }

  function hexToRgb(value) {
    const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
    if (!match) return null;
    return [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16));
  }

  function setCustomColor(index, rgb) {
    const safe = rgb.map(clampByte);
    const hex = rgbToHex(safe);
    state.customColors[index] = safe.map((value) => value / 255);
    $(`#customColor${index}`).value = hex.toLowerCase();
    $(`#customHex${index}`).value = hex;
    ['R', 'G', 'B'].forEach((channel, channelIndex) => {
      $(`#custom${channel}${index}`).value = safe[channelIndex];
    });
    const swatch = $('.custom-palette');
    swatch.style.setProperty(`--custom-${index}`, hex);
  }

  function bindCustomPalette() {
    for (let index = 0; index < 4; index++) {
      $(`#customColor${index}`).addEventListener('input', (event) => {
        const rgb = hexToRgb(event.target.value);
        if (rgb) setCustomColor(index, rgb);
      });
      $(`#customHex${index}`).addEventListener('change', (event) => {
        const rgb = hexToRgb(event.target.value);
        if (rgb) setCustomColor(index, rgb);
        else event.target.value = rgbToHex(state.customColors[index].map((value) => value * 255));
      });
      ['R', 'G', 'B'].forEach((channel) => {
        $(`#custom${channel}${index}`).addEventListener('input', () => {
          setCustomColor(index, ['R', 'G', 'B'].map((name) => $(`#custom${name}${index}`).value));
        });
      });
      setCustomColor(index, state.customColors[index].map((value) => value * 255));
    }
    $('#resetCustomPaletteButton').addEventListener('click', () => {
      const defaults = [[9, 17, 37], [32, 70, 110], [99, 85, 142], [107, 168, 181]];
      defaults.forEach((rgb, index) => setCustomColor(index, rgb));
      showToast('Custom palette reset to default colors');
    });
  }

  const profileStorageKey = 'quarticPulseSavedProfilesV1';
  const profileApplication = 'quartic-pulse-profile';
  const profileSchemaVersion = 1;
  const colorProfileControlIds = ['frequencyColor', 'frequencyColorAmount', 'analysisSmoothing'];
  const fullProfileControlIds = [
    ...colorProfileControlIds,
    'frequencyBandMode', 'frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling', 'beatSensitivity', 'beatCooldown',
    'visualStyle', 'fractalType', 'fractalDimensional', 'equationFolding',
    'coreCStrength', 'coreBiasReal', 'coreBiasImag',
    'fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth',
    'equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio',
    'barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid', 'barStyle',
    'radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere',
    'pulseDensity', 'pulseSize', 'pulseCooldown', 'pulseJagged', 'pulseTrail', 'pulseDetail',
    'bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera',
    'zoom', 'flow', 'autoReactivity', 'reactivity', 'motion', 'spin', 'equationSmoothing', 'equationMod',
    'adaptiveQuality', 'beatPulse', 'autoDrift',
    'iterations', 'resolution', 'exportIterations', 'fps', 'videoFormat', 'exportDetail', 'exportSupersampling', 'exportHdrOutput', 'showExportPreview', 'exportCompleteSound',
    'obsResolution', 'obsFps', 'obsAlwaysOnTop', 'obsChromaKey', 'obsChromaThreshold',
    'musicPersonality', 'songDirectorStyle', 'songDirectorBehavior', 'songDirectorTransition', 'songDirectorIntensity'
  ];
  let savedProfiles = [];

  function captureControlValues(ids) {
    const controls = {};
    for (const id of ids) {
      const control = $(`#${id}`);
      if (!control) continue;
      controls[id] = control.type === 'checkbox' ? Boolean(control.checked) : String(control.value);
    }
    return controls;
  }

  function captureColorProfileData() {
    return {
      palette: state.palette,
      customColors: state.customColors.map((color) => color.map((value) => Number(value.toFixed(6)))),
      controls: captureControlValues(colorProfileControlIds)
    };
  }

  function captureProfileData(kind) {
    const colors = captureColorProfileData();
    if (kind === 'colors') return colors;
    return {
      ...colors,
      controls: captureControlValues(fullProfileControlIds),
      center: { x: state.center.x, y: state.center.y },
      bulbView: { yaw: state.bulbYaw, pitch: state.bulbPitch },
      modulation: {
        enabled: state.modulationEnabled,
        mappings: state.modulationMappings.map(serializeModulationMapping)
      }
    };
  }

  function validProfile(profile) {
    return performanceShowDataEngine.isValidProfile(profile);
  }

  function loadSavedProfiles() {
    savedProfiles = performanceShowDataEngine.parseProfiles(localStorage.getItem(profileStorageKey) || '[]');
  }

  function persistSavedProfiles() {
    localStorage.setItem(profileStorageKey, performanceShowDataEngine.serializeProfiles(savedProfiles));
  }

  function setProfileStatus(message) {
    profileManagerController.setStatus(message);
  }

  function selectedSavedProfile() {
    return profileManagerController.selectedProfile();
  }

  function renderSavedProfiles(preferredId = '') {
    return profileManagerController.render(preferredId);
  }

  function applyControlValues(values, allowedIds) {
    if (!values || typeof values !== 'object') return;
    for (const id of allowedIds) {
      if (!Object.hasOwn(values, id)) continue;
      const control = $(`#${id}`);
      if (!control) continue;
      if (control.type === 'checkbox') {
        if (typeof values[id] !== 'boolean') continue;
        control.checked = values[id];
      }
      else if (control.type === 'range' || control.type === 'number') {
        const numericValue = Number(values[id]);
        if (!Number.isFinite(numericValue)) continue;
        control.value = String(clamp(numericValue, Number(control.min), Number(control.max)));
      } else if (control.tagName === 'SELECT') {
        const requestedValue = String(values[id]);
        if (![...control.options].some((option) => option.value === requestedValue)) continue;
        control.value = requestedValue;
      } else control.value = String(values[id]);
      const eventName = control.type === 'range' ? 'input' : 'change';
      control.dispatchEvent(new Event(eventName, { bubbles: true }));
      control._syncNumericValue?.();
    }
  }

  function applyColorProfileData(data) {
    if (Array.isArray(data.customColors) && data.customColors.length === 4) {
      data.customColors.forEach((color, index) => {
        if (Array.isArray(color) && color.length === 3 && color.every((value) => Number.isFinite(Number(value)))) {
          setCustomColor(index, color.map((value) => clamp(Number(value), 0, 1) * 255));
        }
      });
    }
    const palette = Math.max(0, Math.min(4, Math.round(Number(data.palette) || 0)));
    document.querySelector(`.palette[data-palette="${palette}"]`)?.click();
    applyControlValues(data.controls, colorProfileControlIds);
  }

  function applySavedProfile(profile, { quiet = false } = {}) {
    if (!validProfile(profile)) throw new Error('This profile is not valid.');
    applyColorProfileData(profile.data);
    if (profile.kind === 'settings') {
      applyControlValues(profile.data.controls, fullProfileControlIds);
      if (profile.data.modulation && typeof profile.data.modulation === 'object') {
        state.modulationEnabled = profile.data.modulation.enabled !== false;
        $('#modulationEnabled').checked = state.modulationEnabled;
        state.modulationMappings = Array.isArray(profile.data.modulation.mappings)
          ? profile.data.modulation.mappings.slice(0, 8).map(createModulationMapping)
          : [];
        renderModulationRoutes();
        persistModulationMatrix();
      }
      if (profile.data.center
        && Number.isFinite(Number(profile.data.center.x))
        && Number.isFinite(Number(profile.data.center.y))) {
        state.center.x = clamp(Number(profile.data.center.x), -1000000, 1000000);
        state.center.y = clamp(Number(profile.data.center.y), -1000000, 1000000);
      }
      if (profile.data.bulbView
        && Number.isFinite(Number(profile.data.bulbView.yaw))
        && Number.isFinite(Number(profile.data.bulbView.pitch))) {
        state.bulbYaw = Number(profile.data.bulbView.yaw);
        state.bulbPitch = clamp(Number(profile.data.bulbView.pitch), -1.2, 1.2);
      }
    }
    if (!quiet) {
      showToast(`${profile.name} profile applied`);
      setProfileStatus(`${profile.kind === 'colors' ? 'Color Palette' : 'Full Visual Settings'} applied successfully.`);
    }
  }

  function saveCurrentProfile() {
    const name = $('#profileName').value.trim().slice(0, 60);
    if (!name) return showToast('Enter a profile name first.', true);
    const kind = $('#profileKind').value === 'colors' ? 'colors' : 'settings';
    const now = new Date().toISOString();
    const existing = savedProfiles.find((profile) => profile.kind === kind && profile.name.toLowerCase() === name.toLowerCase());
    const profile = {
      id: existing?.id || (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      name,
      kind,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      data: captureProfileData(kind)
    };
    if (existing) savedProfiles.splice(savedProfiles.indexOf(existing), 1, profile);
    else savedProfiles.unshift(profile);
    savedProfiles = savedProfiles.slice(0, 100);
    persistSavedProfiles();
    renderSavedProfiles(profile.id);
    $('#profileName').value = '';
    showToast(`${name} ${existing ? 'updated' : 'saved'} locally`);
  }

  function quickSaveCurrentVisualProfile() {
    const visualNames = ['Fractal', 'Spectrum Bars', 'Radial Spectrum', 'Pulse Rings', 'Waveform Field', '3D Mandelbulb', 'Data Horizon'];
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19).replaceAll(':', '-');
    $('#profileName').value = `${visualNames[state.visualStyle] || visualNames[0]} · ${stamp}`.slice(0, 60);
    $('#profileKind').value = 'settings';
    saveCurrentProfile();
  }

  async function exportSelectedProfile(profile = selectedSavedProfile()) {
    if (!profile) return;
    const documentData = {
      application: profileApplication,
      schemaVersion: profileSchemaVersion,
      exportedAt: new Date().toISOString(),
      profile: { ...profile }
    };
    const outputPath = await window.quarticDesktop.exportProfile(profile.name, JSON.stringify(documentData, null, 2));
    if (outputPath) {
      showToast(`Profile exported: ${outputPath}`);
      setProfileStatus(`Exported ${profile.name} as a shareable JSON profile.`);
    }
  }

  async function importProfileFile(file) {
    if (!file) return;
    if (file.size > 1024 * 1024) throw new Error('Profile files must be smaller than 1 MB.');
    const parsed = JSON.parse(await file.text());
    if (parsed?.application !== profileApplication || Number(parsed?.schemaVersion) !== profileSchemaVersion) {
      throw new Error('This is not a compatible Quartic Pulse profile file.');
    }
    const imported = parsed.profile;
    if (!validProfile(imported)) throw new Error('The imported profile is incomplete or damaged.');
    let name = imported.name.trim().slice(0, 60) || 'Imported Profile';
    if (savedProfiles.some((profile) => profile.kind === imported.kind && profile.name.toLowerCase() === name.toLowerCase())) {
      name = `${name.slice(0, 49)} (Imported)`;
    }
    const now = new Date().toISOString();
    const profile = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name,
      kind: imported.kind,
      createdAt: now,
      updatedAt: now,
      data: imported.data
    };
    savedProfiles.unshift(profile);
    savedProfiles = savedProfiles.slice(0, 100);
    persistSavedProfiles();
    renderSavedProfiles(profile.id);
    showToast(`${name} imported`);
  }

  function favoriteSavedProfile(profile) {
    if (!profile) return;
    profile.favorite = !profile.favorite;
    profile.updatedAt = new Date().toISOString();
    persistSavedProfiles();
    renderSavedProfiles(profile.id);
  }

  function deleteSavedProfile(profile) {
    if (!profile || !window.confirm(`Delete the saved profile "${profile.name}"?`)) return;
    savedProfiles = savedProfiles.filter((item) => item.id !== profile.id);
    persistSavedProfiles();
    renderSavedProfiles();
    showToast(`${profile.name} deleted`);
  }

  function initializeProfileManager() {
    loadSavedProfiles();
    profileManagerController.initialize();
  }

  const pendingPerformanceMapStorageKey = 'quarticPulsePendingPerformanceMapV1';

  function jsonSafeClone(value) {
    return performancePackageEngine.clone(value);
  }

  function cleanPackageText(value, maximum, fallback = '') {
    return performancePackageEngine.cleanText(value, maximum, fallback);
  }

  function performanceTrackIdentity(item = currentPlaylistItem(), map = activeSongMap) {
    return performancePackageEngine.trackIdentity(item, map);
  }

  function performanceTrackMatches(identity, item = currentPlaylistItem()) {
    return performancePackageEngine.trackMatches(identity, item, audio.duration);
  }

  function currentDirectorCuePackage() {
    if (!activeSongMap?.key) return {};
    const entry = readSongDirectorOverrides().find((candidate) => candidate.mapKey === activeSongMap.key);
    return entry?.cues && typeof entry.cues === 'object' ? jsonSafeClone(entry.cues) : {};
  }

  function portableSongMap() {
    return performancePackageEngine.portableSongMap(activeSongMap);
  }

  function createPerformancePackage() {
    const title = cleanPackageText($('#performancePackageTitle').value, 80,
      state.audioName ? `${state.audioName} Performance` : 'Quartic Pulse Performance');
    const creator = cleanPackageText($('#performancePackageCreator').value, 80, 'Quartic Pulse Creator');
    const notes = cleanPackageText($('#performancePackageNotes').value, 500);
    const showProfiles = performancePackageEngine.referencedProfiles(state.showSequence, savedProfiles);
    const currentVisual = {
      id: 'performance-current-visual',
      name: title,
      kind: 'settings',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: captureProfileData('settings')
    };
    const packageData = {
      metadata: { title, creator, notes },
      track: performanceTrackIdentity(),
      currentVisual,
      show: {
        entries: state.showSequence.map(serializeShowEntry),
        profiles: showProfiles,
        loop: state.showLoop,
        shuffle: state.showShuffle,
        autoBpm: state.autoBpm,
        manualBpm: Number(state.manualBpm.toFixed(3)),
        beatOffsetMs: state.beatOffsetMs
      },
      director: {
        enabled: state.songDirectorEnabled,
        style: state.songDirectorStyle,
        behavior: state.songDirectorBehavior,
        transition: state.songDirectorTransition,
        intensity: Number(state.songDirectorIntensity.toFixed(4)),
        map: portableSongMap(),
        cueOverrides: currentDirectorCuePackage()
      }
    };
    return performancePackageEngine.createDocument(packageData);
  }

  function setPerformancePackageStatus(message) {
    const status = $('#performancePackageStatus');
    if (status) status.textContent = message;
  }

  async function exportPerformancePackage() {
    const documentData = createPerformancePackage();
    const suggestedName = performancePackageEngine.suggestedFilename(documentData.performance.metadata.title);
    const outputPath = await window.quarticDesktop.exportPerformancePackage(suggestedName, JSON.stringify(documentData, null, 2));
    if (!outputPath) return;
    setPerformancePackageStatus(`${documentData.fingerprint} · Package exported without audio.`);
    showToast(`Performance package exported: ${outputPath}`);
  }

  function installPerformanceSongMap(performance) {
    const portableMap = performance?.director?.map;
    const identity = performance?.track;
    if (!portableMap || !identity) return 'No Song Map was included.';
    if (!performanceTrackMatches(identity)) {
      try {
        localStorage.setItem(pendingPerformanceMapStorageKey, JSON.stringify({
          track: identity,
          map: portableMap,
          cues: performance.director.cueOverrides || {},
          savedAt: new Date().toISOString()
        }));
      } catch (_) { /* A package remains usable without pending map storage. */ }
      return `Load ${identity.fileName} to attach its packaged Song Map.`;
    }
    const key = songMapKey();
    const map = { ...jsonSafeClone(portableMap), key, trackName: currentPlaylistItem()?.name || identity.displayName, updatedAt: new Date().toISOString() };
    if (!key || !validSongMap(map)) return 'The packaged Song Map was not compatible.';
    cacheSongMap(map);
    activeSongMap = map;
    const cues = performance.director.cueOverrides && typeof performance.director.cueOverrides === 'object'
      ? jsonSafeClone(performance.director.cueOverrides) : {};
    const overrides = songMapDataEngine.replaceOverrideSet(readSongDirectorOverrides(), key, cues);
    try { localStorage.setItem(songDirectorOverridesStorageKey, JSON.stringify(overrides)); }
    catch (_) { /* Cue restoration is optional if local storage is unavailable. */ }
    try { localStorage.removeItem(pendingPerformanceMapStorageKey); } catch (_) { /* Optional cleanup. */ }
    renderSongMap();
    return `Song Map matched ${identity.fingerprint}.`;
  }

  function tryRestorePendingPerformanceMap() {
    if (!currentPlaylistItem()?.file) return false;
    try {
      const pending = JSON.parse(localStorage.getItem(pendingPerformanceMapStorageKey) || 'null');
      if (!pending?.map || !performanceTrackMatches(pending.track)) return false;
      const message = installPerformanceSongMap({ track: pending.track, director: { map: pending.map, cueOverrides: pending.cues || {} } });
      setPerformancePackageStatus(message);
      showToast('Packaged Song Map attached to the loaded track');
      return true;
    } catch (_) {
      return false;
    }
  }

  function importPerformanceProfiles(performance) {
    const imported = performancePackageEngine.remapImportedShow(performance, savedProfiles);
    savedProfiles = imported.profiles;
    persistSavedProfiles();
    state.showSequence = imported.entries;
    state.showLoop = imported.loop;
    state.showShuffle = imported.shuffle;
    state.autoBpm = imported.autoBpm;
    state.manualBpm = imported.manualBpm;
    state.beatOffsetMs = imported.beatOffsetMs;
    state.showPlaying = false;
    state.showIndex = -1;
    persistShowSequence();
    renderSavedProfiles(imported.importedProfiles[0]?.id || '');
    renderShowSequence();
    $('#showLoop').checked = state.showLoop;
    $('#showShuffle').checked = state.showShuffle;
    $('#autoBpm').checked = state.autoBpm;
    $('#beatBpm').value = state.manualBpm;
    $('#beatOffset').value = state.beatOffsetMs;
    $('#beatBpm')._syncNumericValue?.();
    $('#beatOffset')._syncNumericValue?.();
    updateBeatGridUi();
  }

  async function importPerformancePackageFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) throw new Error('Performance packages must be smaller than 10 MB.');
    const parsed = JSON.parse(await file.text());
    const { performance, fingerprint: expectedFingerprint } = performancePackageEngine.validateDocument(parsed);
    try { localStorage.removeItem(pendingPerformanceMapStorageKey); } catch (_) { /* Optional cleanup. */ }
    applySavedProfile(performance.currentVisual, { quiet: true });
    importPerformanceProfiles(performance);
    const mapMessage = installPerformanceSongMap(performance);
    const director = performance.director && typeof performance.director === 'object' ? performance.director : {};
    state.songDirectorEnabled = false;
    state.songDirectorValues = {};
    state.songDirectorStyle = songDirectorStyles[director.style] ? director.style : state.songDirectorStyle;
    state.songDirectorBehavior = director.behavior === 'auto' || songDirectorBehaviors[director.behavior]
      ? director.behavior
      : state.songDirectorBehavior;
    state.songDirectorTransition = songDirectorTransitions[director.transition]
      ? director.transition
      : state.songDirectorTransition;
    const importedDirectorIntensity = Number(director.intensity);
    state.songDirectorIntensity = Number.isFinite(importedDirectorIntensity)
      ? clamp(importedDirectorIntensity, 0, 1)
      : state.songDirectorIntensity;
    $('#songDirectorEnabled').checked = false;
    $('#songDirectorStyle').value = state.songDirectorStyle;
    $('#songDirectorBehavior').value = state.songDirectorBehavior;
    $('#songDirectorTransition').value = state.songDirectorTransition;
    $('#songDirectorIntensity').value = String(state.songDirectorIntensity);
    $('#songDirectorIntensity')._syncNumericValue?.();
    $('#songDirectorIntensityValue').value = `${Math.round(state.songDirectorIntensity * 100)}%`;
    renderSongDirector();
    $('#performancePackageTitle').value = cleanPackageText(performance.metadata?.title, 80, 'Imported Performance');
    $('#performancePackageCreator').value = cleanPackageText(performance.metadata?.creator, 80, 'Unknown creator');
    $('#performancePackageNotes').value = cleanPackageText(performance.metadata?.notes, 500);
    setPerformancePackageStatus(`${expectedFingerprint} · ${mapMessage}`);
    showToast(`${performance.metadata?.title || 'Performance package'} imported in standby without audio`);
  }

  function initializePerformancePackages() {
    $('#exportPerformancePackageButton').addEventListener('click', () => exportPerformancePackage().catch((error) => showToast(`Package export failed: ${error.message}`, true)));
    $('#importPerformancePackageButton').addEventListener('click', () => $('#importPerformancePackageInput').click());
    $('#importPerformancePackageInput').addEventListener('change', async (event) => {
      try { await importPerformancePackageFile(event.target.files[0]); }
      catch (error) { showToast(`Package import failed: ${error.message}`, true); }
      finally { event.target.value = ''; }
    });
    if (new URLSearchParams(window.location.search).get('smoke') === '1') {
      window.__quarticPulseCreatePerformancePackage = createPerformancePackage;
    }
  }

  const sessionAutosaveStorageKey = 'quarticPulseSessionAutosaveV1';
  let sessionAutosaveTimer = 0;
  let sessionRestoreActive = false;

  function saveSessionSnapshot() {
    if (isObsOutput || sessionRestoreActive) return;
    const item = currentPlaylistItem();
    const snapshot = {
      version: 1,
      source: 'interactive',
      savedAt: new Date().toISOString(),
      profile: {
        name: 'Automatic Session',
        kind: 'settings',
        data: captureProfileData('settings')
      },
      audioPath: item?.filePath || '',
      audioTime: state.audioMode === 'deck' && Number.isFinite(audio.currentTime) ? audio.currentTime : 0
    };
    try { localStorage.setItem(sessionAutosaveStorageKey, JSON.stringify(snapshot)); }
    catch (_) { /* Session restore remains optional if local storage is unavailable. */ }
  }

  function scheduleSessionAutosave() {
    if (sessionRestoreActive) return;
    clearTimeout(sessionAutosaveTimer);
    sessionAutosaveTimer = window.setTimeout(saveSessionSnapshot, 900);
  }

  function restoredAudioMime(name) {
    const extension = String(name || '').split('.').pop().toLowerCase();
    return ({ mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', opus: 'audio/ogg' })[extension] || 'audio/*';
  }

  async function restoreSessionSnapshot() {
    let snapshot = null;
    try { snapshot = JSON.parse(localStorage.getItem(sessionAutosaveStorageKey) || 'null'); }
    catch (_) { return; }
    if (!snapshot || snapshot.version !== 1 || snapshot.source !== 'interactive' || !validProfile(snapshot.profile)) return;
    const savedAt = Date.parse(snapshot.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > 30 * 24 * 60 * 60 * 1000) return;
    sessionRestoreActive = true;
    try {
      applySavedProfile(snapshot.profile, { quiet: true });
      if (snapshot.audioPath) {
        try {
          const restored = await window.quarticDesktop.readSessionAudioFile(snapshot.audioPath);
          const bytes = restored?.bytes instanceof Uint8Array
            ? restored.bytes
            : new Uint8Array(restored?.bytes?.data || restored?.bytes || []);
          const file = new File([bytes], restored.name, { type: restoredAudioMime(restored.name), lastModified: restored.lastModified });
          state.playlist.push({
            id: ++state.playlistId,
            name: restored.name.replace(/\.[^.]+$/, ''),
            meta: `RESTORED SESSION · ${(file.size / 1048576).toFixed(1)} MB`,
            source: URL.createObjectURL(file),
            file,
            filePath: restored.path
          });
          await selectPlaylistIndex(state.playlist.length - 1, false);
          const restoreTime = Math.max(0, Number(snapshot.audioTime) || 0);
          if (restoreTime) audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.min(restoreTime, Math.max(0, audio.duration - .05)); }, { once: true });
        } catch (error) {
          showToast(`Settings restored; the last song could not be reopened: ${error.message}`, true);
        }
      }
      state.showPlaying = false;
      state.showIndex = -1;
      state.songDirectorEnabled = false;
      state.songDirectorValues = {};
      $('#songDirectorEnabled').checked = false;
      renderSongDirector();
      updateShowUi();
      showToast('Previous session restored · show and Song Director remain in standby');
    } finally {
      sessionRestoreActive = false;
      saveSessionSnapshot();
    }
  }

  function initializeSessionAutosave() {
    if (isSmokeTest) return;
    document.addEventListener('input', scheduleSessionAutosave, { passive: true });
    document.addEventListener('change', scheduleSessionAutosave, { passive: true });
    window.addEventListener('beforeunload', saveSessionSnapshot);
    window.setInterval(saveSessionSnapshot, 10000);
    restoreSessionSnapshot().catch((error) => showToast(`Session restore failed: ${error.message}`, true));
  }

  const modulationStorageKey = 'quarticPulseModulationMatrixV1';

  function serializeModulationMapping(mapping) {
    return {
      id: mapping.id,
      source: mapping.source,
      target: mapping.target,
      amount: mapping.amount,
      attack: mapping.attack,
      release: mapping.release,
      floor: mapping.floor,
      ceiling: mapping.ceiling,
      enabled: mapping.enabled
    };
  }

  function persistModulationMatrix() {
    try {
      localStorage.setItem(modulationStorageKey, JSON.stringify({
        enabled: state.modulationEnabled,
        mappings: state.modulationMappings.map(serializeModulationMapping)
      }));
    } catch (_) { /* Matrix persistence is optional. */ }
  }

  function modulationSelectOptions(collection, selected) {
    return Object.entries(collection).map(([value, details]) =>
      `<option value="${value}"${value === selected ? ' selected' : ''}>${details.label}</option>`).join('');
  }

  function modulationControlMarkup(label, field, value, minimum, maximum, defaultValue, tip) {
    return `<div class="modulation-control" title="${tip}">
      <label><span>${label}</span><span>${value}%</span></label>
      <div class="modulation-control-tools">
        <input type="range" min="${minimum}" max="${maximum}" step="1" value="${value}" data-modulation-field="${field}" aria-label="${label}" />
        <input type="number" min="${minimum}" max="${maximum}" step="1" value="${value}" data-modulation-field="${field}" aria-label="${label} numerical value" />
        <button type="button" data-reset-modulation="${field}" data-default-value="${defaultValue}" title="Reset ${label.toLowerCase()}">↺</button>
      </div>
    </div>`;
  }

  function renderModulationRoutes() {
    const list = $('#modulationRouteList');
    list.replaceChildren();
    for (const mapping of state.modulationMappings) {
      const amountMinimum = modulationAmountMinimum(mapping.target);
      const amountIsBipolar = amountMinimum < 0;
      const route = document.createElement('article');
      route.className = `modulation-route${mapping.enabled ? '' : ' disabled'}`;
      route.dataset.mappingId = mapping.id;
      route.innerHTML = `
        <div class="modulation-route-head">
          <div class="modulation-route-title">${modulationSources[mapping.source].label} → ${modulationTargets[mapping.target].label}</div>
          <input class="modulation-route-enable" type="checkbox" ${mapping.enabled ? 'checked' : ''} aria-label="Enable modulation route" />
          <button class="modulation-route-delete" type="button" title="Delete route" aria-label="Delete route">×</button>
        </div>
        <div class="modulation-route-selects">
          <label>SOURCE<select data-modulation-select="source">${modulationSelectOptions(modulationSources, mapping.source)}</select></label>
          <label>TARGET<select data-modulation-select="target">${modulationSelectOptions(modulationTargets, mapping.target)}</select></label>
        </div>
        ${modulationControlMarkup(
          amountIsBipolar ? 'AMOUNT (− / +)' : 'AMOUNT',
          'amount',
          mapping.amount,
          amountMinimum,
          100,
          35,
          amountIsBipolar
            ? 'Negative values reverse the source response. Positive values add to the target.'
            : 'Controls how strongly the source increases this target.'
        )}
        <div class="modulation-route-meter"><i></i></div>
        <details>
          <summary>ADVANCED RESPONSE</summary>
          ${modulationControlMarkup('ATTACK SPEED', 'attack', mapping.attack, 0, 100, 70, 'Higher values react faster when the source rises.')}
          ${modulationControlMarkup('RELEASE SPEED', 'release', mapping.release, 0, 100, 35, 'Higher values return to the base setting faster.')}
          ${modulationControlMarkup('INPUT FLOOR', 'floor', mapping.floor, 0, 99, 0, 'Audio below this percentage produces no modulation.')}
          ${modulationControlMarkup('INPUT CEILING', 'ceiling', mapping.ceiling, 1, 100, 100, 'Audio at this percentage produces the full configured amount.')}
        </details>`;
      list.appendChild(route);
    }
    $('#modulationEmpty').hidden = state.modulationMappings.length > 0;
    $('#modulationCount').textContent = `${state.modulationMappings.length} ${state.modulationMappings.length === 1 ? 'ROUTE' : 'ROUTES'}`;
    $('#addModulationRoute').disabled = state.modulationMappings.length >= 8;
  }

  function findModulationMapping(element) {
    const id = element.closest('.modulation-route')?.dataset.mappingId;
    return state.modulationMappings.find((mapping) => mapping.id === id) || null;
  }

  function setModulationField(mapping, field, requestedValue, route) {
    const limits = {
      amount: [modulationAmountMinimum(mapping.target), 100],
      attack: [0, 100], release: [0, 100], floor: [0, 99], ceiling: [1, 100]
    };
    if (!limits[field]) return;
    let value = Math.round(clamp(Number(requestedValue) || 0, limits[field][0], limits[field][1]));
    if (field === 'floor') value = Math.min(value, mapping.ceiling - 1);
    if (field === 'ceiling') value = Math.max(value, mapping.floor + 1);
    mapping[field] = value;
    route.querySelectorAll(`[data-modulation-field="${field}"]`).forEach((control) => { control.value = value; });
    const labelValue = route.querySelector(`[data-modulation-field="${field}"]`)?.closest('.modulation-control')?.querySelector('label span:last-child');
    if (labelValue) labelValue.textContent = `${value}%`;
    persistModulationMatrix();
  }

  function applyModulationPreset(name) {
    if (name === 'clear') state.modulationMappings = [];
    else state.modulationMappings = (modulationPresets[name] || []).map(createModulationMapping);
    state.modulationEnabled = true;
    $('#modulationEnabled').checked = true;
    renderModulationRoutes();
    persistModulationMatrix();
    showToast(name === 'clear' ? 'Modulation routes cleared' : `${name === 'math' ? 'Math Drive' : name === 'dimension' ? 'Deep Motion' : 'Conventional'} modulation preset loaded`);
  }

  function updateModulationUiMeters() {
    const sources = { Bass: state.bass, Mids: state.mids, Highs: state.highs, Beat: state.beat, Rms: state.rms };
    for (const [name, value] of Object.entries(sources)) {
      const meter = $(`#modSource${name}`);
      if (meter) meter.style.width = `${clamp(value * 100, 0, 100)}%`;
    }
    document.querySelectorAll('.modulation-route').forEach((route) => {
      const mapping = findModulationMapping(route);
      const meter = route.querySelector('.modulation-route-meter i');
      if (mapping && meter) meter.style.width = `${clamp(mapping.current * 100, 0, 100)}%`;
    });
  }

  function initializeModulationMatrix() {
    try {
      const stored = JSON.parse(localStorage.getItem(modulationStorageKey) || 'null');
      if (stored && typeof stored === 'object') {
        state.modulationEnabled = stored.enabled !== false;
        state.modulationMappings = Array.isArray(stored.mappings)
          ? stored.mappings.slice(0, 8).map(createModulationMapping)
          : [];
      }
    } catch (_) {
      state.modulationMappings = [];
    }
    $('#modulationEnabled').checked = state.modulationEnabled;
    $('#modulationEnabled').addEventListener('change', (event) => {
      state.modulationEnabled = event.target.checked;
      persistModulationMatrix();
    });
    $('#addModulationRoute').addEventListener('click', () => {
      if (state.modulationMappings.length >= 8) return;
      state.modulationMappings.push(createModulationMapping());
      renderModulationRoutes();
      persistModulationMatrix();
    });
    $('#modulationPresets').addEventListener('click', (event) => {
      const button = event.target.closest('[data-modulation-preset]');
      if (button) applyModulationPreset(button.dataset.modulationPreset);
    });
    $('#modulationRouteList').addEventListener('click', (event) => {
      const mapping = findModulationMapping(event.target);
      if (!mapping) return;
      if (event.target.closest('.modulation-route-delete')) {
        state.modulationMappings = state.modulationMappings.filter((item) => item !== mapping);
        renderModulationRoutes();
        persistModulationMatrix();
        return;
      }
      const reset = event.target.closest('[data-reset-modulation]');
      if (reset) setModulationField(mapping, reset.dataset.resetModulation, reset.dataset.defaultValue, reset.closest('.modulation-route'));
    });
    $('#modulationRouteList').addEventListener('input', (event) => {
      const field = event.target.dataset.modulationField;
      const mapping = findModulationMapping(event.target);
      if (field && mapping) setModulationField(mapping, field, event.target.value, event.target.closest('.modulation-route'));
    });
    $('#modulationRouteList').addEventListener('change', (event) => {
      const mapping = findModulationMapping(event.target);
      if (!mapping) return;
      if (event.target.classList.contains('modulation-route-enable')) {
        mapping.enabled = event.target.checked;
        event.target.closest('.modulation-route').classList.toggle('disabled', !mapping.enabled);
      }
      const selectField = event.target.dataset.modulationSelect;
      if (selectField === 'source' && Object.hasOwn(modulationSources, event.target.value)) mapping.source = event.target.value;
      let targetRangeChanged = false;
      if (selectField === 'target' && Object.hasOwn(modulationTargets, event.target.value)) {
        mapping.target = event.target.value;
        mapping.amount = clamp(mapping.amount, modulationAmountMinimum(mapping.target), 100);
        targetRangeChanged = true;
      }
      const title = event.target.closest('.modulation-route').querySelector('.modulation-route-title');
      title.textContent = `${modulationSources[mapping.source].label} → ${modulationTargets[mapping.target].label}`;
      persistModulationMatrix();
      if (targetRangeChanged) renderModulationRoutes();
    });
    renderModulationRoutes();
  }

  function renderShowProfileOptions() {
    const select = $('#showProfileSelect');
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    if (!savedProfiles.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No saved profiles';
      select.appendChild(option);
    } else {
      for (const profile of savedProfiles) {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = `${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`;
        select.appendChild(option);
      }
      if (savedProfiles.some((profile) => profile.id === previous)) select.value = previous;
    }
    $('#addShowEntryButton').disabled = !savedProfiles.length;
    renderShowSequence();
    if (showComposerController.initialized) renderShowComposer();
  }

  function renderShowSequence() {
    const list = $('#showSequenceList');
    if (!list) return;
    list.replaceChildren();
    state.showSequence.forEach((entry, index) => {
      const profile = showProfileForEntry(entry);
      const element = document.createElement('article');
      element.className = `show-entry${index === state.showIndex ? ' active' : ''}`;
      element.dataset.index = String(index);
      element.innerHTML = `
        <span class="show-entry-index">${index + 1}</span>
        <div class="show-entry-body" data-show-action="select" tabindex="0"><strong>${escapeShowMarkup(entry.label || profile?.name || 'Missing profile')}</strong><small>${escapeShowMarkup(profile?.name || 'Missing profile')} · ${entry.advance === 'time' ? `${entry.value} seconds` : `${entry.value} beats`} · ${entry.transition === 'cut' ? 'Cut' : 'Fade through black'}</small></div>
        <button type="button" data-show-action="up" title="Move up">↑</button>
        <button type="button" data-show-action="down" title="Move down">↓</button>
        <button type="button" data-show-action="delete" title="Remove">×</button>`;
      list.appendChild(element);
    });
    $('#showSequenceEmpty').hidden = state.showSequence.length > 0;
    updateShowUi();
    if (showComposerController.initialized) renderShowComposer();
  }

  function updateBeatGridUi() {
    const display = $('#beatBpmDisplay');
    if (!display) return;
    const bpm = effectiveBpm();
    display.textContent = bpm.toFixed(1);
    $('#beatBpmValue').value = `${state.manualBpm.toFixed(1)} BPM`;
    $('#beatOffsetValue').value = `${state.beatOffsetMs} ms`;
    $('#beatGridStatus').textContent = state.autoBpm ? (state.bpmConfidence >= .18 ? 'AUTO LOCKED' : 'AUTO LISTENING') : 'MANUAL';
    $('#beatConfidence').textContent = state.autoBpm
      ? (state.bpmConfidence >= .18 ? `${Math.round(state.bpmConfidence * 100)}% confidence` : 'Waiting for clear beats')
      : 'Using the manual tempo';
    const activeLight = ((state.beatGridIndex % 4) + 4) % 4;
    document.querySelectorAll('#beatGridLights i').forEach((light, index) => light.classList.toggle('active', index === activeLight && state.beatGridPhase < .32));
  }

  function initializeShowSequencer() {
    const stored = performanceShowDataEngine.parseShowDocument(localStorage.getItem('quarticPulseShowSequenceV1') || 'null');
    state.showSequence = stored.entries;
    state.showLoop = stored.loop;
    state.showShuffle = stored.shuffle;
    state.autoBpm = stored.autoBpm;
    state.manualBpm = stored.manualBpm;
    state.beatOffsetMs = stored.beatOffsetMs;
    $('#showLoop').checked = state.showLoop;
    $('#showShuffle').checked = state.showShuffle;
    $('#autoBpm').checked = state.autoBpm;
    $('#beatBpm').value = state.manualBpm;
    $('#beatOffset').value = state.beatOffsetMs;
    $('#beatBpm')._syncNumericValue?.();
    $('#beatOffset')._syncNumericValue?.();

    $('#beatBpm').addEventListener('input', (event) => {
      state.manualBpm = Number(event.target.value);
      persistShowSequence();
      updateBeatGridUi();
    });
    $('#beatOffset').addEventListener('input', (event) => {
      state.beatOffsetMs = Number(event.target.value);
      persistShowSequence();
      updateBeatGridUi();
    });
    $('#autoBpm').addEventListener('change', (event) => {
      state.autoBpm = event.target.checked;
      persistShowSequence();
      updateBeatGridUi();
    });
    let tapTimes = [];
    $('#tapTempoButton').addEventListener('click', () => {
      const now = performance.now() / 1000;
      if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2) tapTimes = [];
      tapTimes.push(now);
      tapTimes = tapTimes.slice(-8);
      if (tapTimes.length >= 2) {
        const intervals = tapTimes.slice(1).map((time, index) => time - tapTimes[index]);
        state.manualBpm = clamp(60 / (intervals.reduce((sum, value) => sum + value, 0) / intervals.length), 60, 200);
        $('#beatBpm').value = state.manualBpm;
        $('#beatBpm')._syncNumericValue?.();
        state.autoBpm = false;
        $('#autoBpm').checked = false;
        state.beatGridAnchor = tapTimes[0];
        persistShowSequence();
        updateBeatGridUi();
      }
    });
    $('#resetBeatGridButton').addEventListener('click', () => {
      state.detectedBeatTimes = [];
      state.detectedBpm = 120;
      state.bpmConfidence = 0;
      state.beatOffsetMs = 0;
      state.beatGridAnchor = beatClock();
      $('#beatOffset').value = 0;
      $('#beatOffset')._syncNumericValue?.();
      persistShowSequence();
      showToast('Beat grid reset');
    });
    $('#addShowEntryButton').addEventListener('click', () => {
      const profileId = $('#showProfileSelect').value;
      if (!savedProfiles.some((profile) => profile.id === profileId)) return;
      state.showSequence.push({
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        profileId,
        advance: $('#showAdvanceMode').value === 'time' ? 'time' : 'beats',
        value: clamp(Math.round(Number($('#showAdvanceValue').value) || 1), 1, 3600),
        transition: $('#showTransition').value === 'cut' ? 'cut' : 'black'
      });
      persistShowSequence();
      renderShowSequence();
    });
    $('#showSequenceList').addEventListener('click', (event) => {
      const element = event.target.closest('.show-entry');
      const action = event.target.closest('[data-show-action]')?.dataset.showAction;
      if (!element || !action) return;
      const index = Number(element.dataset.index);
      if (action === 'delete') {
        state.showSequence.splice(index, 1);
        if (state.showIndex === index) state.showIndex = -1;
        else if (state.showIndex > index) state.showIndex -= 1;
      } else if (action === 'up' && index > 0) {
        [state.showSequence[index - 1], state.showSequence[index]] = [state.showSequence[index], state.showSequence[index - 1]];
      } else if (action === 'down' && index < state.showSequence.length - 1) {
        [state.showSequence[index + 1], state.showSequence[index]] = [state.showSequence[index], state.showSequence[index + 1]];
      } else if (action === 'select') applyShowEntry(index, true);
      persistShowSequence();
      renderShowSequence();
    });
    $('#showPlayButton').addEventListener('click', () => {
      if (!state.showSequence.length) return;
      state.showPlaying = !state.showPlaying;
      if (state.showPlaying) {
        if (state.showIndex < 0) applyShowEntry(0, true);
        else resetShowEntryClock();
      }
      updateShowUi();
    });
    $('#showPreviousButton').addEventListener('click', () => advanceShow(-1));
    $('#showNextButton').addEventListener('click', () => advanceShow(1));
    $('#showStopButton').addEventListener('click', () => {
      state.showPlaying = false;
      state.showIndex = -1;
      $('#showProgressFill').style.width = '0%';
      performanceController.setProgress(0);
      updateShowUi();
    });
    $('#showLoop').addEventListener('change', (event) => { state.showLoop = event.target.checked; persistShowSequence(); });
    $('#showShuffle').addEventListener('change', (event) => { state.showShuffle = event.target.checked; persistShowSequence(); });
    renderShowProfileOptions();
    renderShowSequence();
    updateBeatGridUi();
  }

  function isSupportedAudioFile(file) {
    return Boolean(file && (file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg|opus)$/i.test(file.name)));
  }

  function setAudioSourceStatus(label, live = false) {
    $('#audioSourceStatus').textContent = label;
    document.body.classList.toggle('live-input', live);
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

  function stopLiveAudio({ restoreDeck = true } = {}) {
    liveAudioSource?.disconnect();
    liveAudioStream?.getTracks().forEach((track) => track.stop());
    if (nativeOutputActive) window.quarticDesktop.stopOutputDevice().catch(() => {});
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
      setAudioSourceStatus('DECK', false);
      restoreDeckHud();
      resetPulseEvents();
      updateTrackControls();
      setPlayState();
    }
  }

  async function activateLiveAudio(stream, label) {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('Windows did not provide an audio track for that source.');
    }
    createAudioGraph();
    await audioContext.resume();
    stopLiveAudio({ restoreDeck: false });
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
    setAudioSourceStatus('LISTENING', true);
    updateTrackControls();
    setPlayState();
    audioTrack.addEventListener('ended', () => {
      if (liveAudioStream === stream) {
        stopLiveAudio();
        showToast('Windows audio source stopped');
      }
    }, { once: true });
  }

  async function activateWindowsOutput(deviceId, label) {
    createAudioGraph();
    await audioContext.resume();
    stopLiveAudio({ restoreDeck: false });
    audio.pause();
    audioSource.disconnect();
    const node = await ensureNativeOutputNode();
    nativePcmRemainder = new Uint8Array(0);
    node.connect(analyser);
    node.connect(beatAnalyser);
    await window.quarticDesktop.startOutputDevice(deviceId);
    nativeOutputActive = true;
    state.audioMode = 'native-output';
    state.liveAudioLabel = label;
    resetPulseEvents();
    $('#trackName').textContent = label;
    $('#trackMeta').textContent = 'WASAPI OUTPUT LOOPBACK · visualization only';
    audioController.renderLiveTimeline();
    setAudioSourceStatus('WASAPI LIVE', true);
    updateTrackControls();
    setPlayState();
  }

  async function useSelectedAudioSource() {
    if (state.exporting) return showToast('Finish the current export before changing audio sources.', true);
    if (state.audioMode !== 'deck') {
      stopLiveAudio();
      showToast('Returned to Music Deck');
      return;
    }
    const select = $('#audioSourceSelect');
    if (select.value === 'deck') {
      stopLiveAudio();
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
      } else if (select.value === 'system') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        stream.getVideoTracks().forEach((track) => track.stop());
      } else if (select.value.startsWith('input:')) {
        const deviceId = select.value.slice(6);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
          video: false
        });
      } else return;
      await activateLiveAudio(stream, select.selectedOptions[0]?.textContent || 'Windows audio source');
      refreshAudioInputs({ requestPermission: false, silent: true }).catch(() => {});
      showToast(`${state.liveAudioLabel} is driving the visualizer`);
    } catch (error) {
      stopLiveAudio();
      showToast(error.name === 'NotAllowedError'
        ? 'Audio capture was cancelled or blocked by Windows privacy settings.'
        : error.message, true);
    }
  }

  async function refreshAudioInputs({ requestPermission = true, silent = false } = {}) {
    if (!navigator.mediaDevices?.enumerateDevices) return showToast('Audio device discovery is unavailable.', true);
    try {
      // Chromium can enumerate device IDs without prompting. A user-initiated
      // refresh requests access once so Windows reveals friendly device names.
      if (requestPermission) {
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        permissionStream.getTracks().forEach((track) => track.stop());
      }
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'audioinput');
      const select = $('#audioSourceSelect');
      const inputGroup = $('#audioInputOptions');
      const previousValue = select.value;
      inputGroup.replaceChildren();
      devices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = `input:${device.deviceId}`;
        option.dataset.inputDevice = 'true';
        option.textContent = device.label || `Windows input / virtual device ${index + 1}`;
        inputGroup.appendChild(option);
      });
      if ([...select.options].some((option) => option.value === previousValue)) select.value = previousValue;
      if (!silent) showToast(`${devices.length} Windows input or virtual ${devices.length === 1 ? 'device' : 'devices'} found`);
      return devices.length;
    } catch (error) {
      if (!silent) {
        showToast(error.name === 'NotAllowedError'
          ? 'Input access was blocked. Enable it in Windows Privacy & security > Microphone.'
          : error.message, true);
      }
    }
    return 0;
  }

  async function refreshWindowsOutputs({ silent = false } = {}) {
    const scanGeneration = ++windowsOutputScanGeneration;
    const select = $('#audioSourceSelect');
    const outputGroup = $('#audioOutputOptions');
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, [0, 350, 900, 1800][attempt]));
      try {
        const devices = await window.quarticDesktop.listOutputDevices();
        if (scanGeneration !== windowsOutputScanGeneration) return outputGroup.children.length;
        if (!devices.length) {
          lastError = new Error('Windows returned no playback endpoints.');
          continue;
        }
        const previousValue = select.value;
        const options = devices.map((device) => {
          const option = document.createElement('option');
          option.value = `output:${device.id}`;
          option.dataset.outputDevice = 'true';
          option.textContent = `${device.name}${device.isDefault ? ' · DEFAULT' : ''}`;
          return option;
        });
        outputGroup.replaceChildren(...options);
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
    createAudioGraph();
    const requestedId = String(deviceId || '');
    if (typeof audioContext?.setSinkId !== 'function') {
      if (requestedId) throw new Error('Direct playback-output routing is not supported by this Windows audio runtime.');
      return false;
    }
    await audioContext.setSinkId(requestedId);
    const stinger = $('#exportCompleteStinger');
    if (typeof stinger?.setSinkId === 'function') await stinger.setSinkId(requestedId).catch(() => {});
    deckOutputDeviceId = requestedId;
    if (requestedId) localStorage.setItem(deckOutputStorageKey, requestedId);
    else localStorage.removeItem(deckOutputStorageKey);
    const select = $('#deckOutputSelect');
    if (select && [...select.options].some((option) => option.value === requestedId)) select.value = requestedId;
    const label = select?.selectedOptions?.[0]?.textContent || (requestedId ? 'Direct output' : 'Windows default');
    $('#deckOutputStatus').textContent = requestedId ? 'DIRECT' : 'WINDOWS DEFAULT';
    if (!quiet) showToast(`Music Deck playback routed to ${label}`);
    return true;
  }

  async function refreshDeckOutputs({ silent = false } = {}) {
    if (!navigator.mediaDevices?.enumerateDevices) return 0;
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'audiooutput');
      const select = $('#deckOutputSelect');
      const group = $('#deckOutputOptions');
      const options = devices
        .filter((device) => device.deviceId && device.deviceId !== 'default')
        .map((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.label || `Windows playback device ${index + 1}`;
          return option;
        });
      group.replaceChildren(...options);
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

  async function refreshAllAudioDevices() {
    const inputs = await refreshAudioInputs({ requestPermission: true, silent: true });
    const [outputs, deckOutputs] = await Promise.all([
      refreshWindowsOutputs({ silent: true }),
      refreshDeckOutputs({ silent: true })
    ]);
    showToast(`${outputs} capture endpoints, ${inputs} inputs, and ${deckOutputs} direct playback devices found`);
  }

  function currentPlaylistIndex() {
    if (state.playlistLoadedId == null) return -1;
    return state.playlist.findIndex((item) => item.id === state.playlistLoadedId);
  }

  function currentPlaylistItem() {
    const index = currentPlaylistIndex();
    return index >= 0 ? state.playlist[index] : null;
  }

  function selectPlaylistRow(index) {
    if (state.exporting) return showToast('Finish the current export before changing the playlist.', true);
    if (!state.playlist[index]) return;
    state.playlistIndex = index;
    Array.from($('#playlistList').children).forEach((row, rowIndex) => {
      const selected = rowIndex === index;
      row.classList.toggle('active', selected);
      row.setAttribute('aria-selected', String(selected));
    });
    updatePlaylistControls();
  }

  function updateTrackControls() {
    const hasTrack = Boolean(currentPlaylistItem());
    const deckAvailable = hasTrack && state.audioMode === 'deck';
    audioController.setAvailability(deckAvailable);
    $('#exportButton').disabled = !hasTrack;
    updateNowPlayingOverlay();
    updatePerformanceDock();
  }

  function updatePlaylistControls() {
    const count = state.playlist.length;
    const selected = state.playlistIndex >= 0 && state.playlistIndex < count;
    const loadedIndex = currentPlaylistIndex();
    const navigationIndex = loadedIndex >= 0 ? loadedIndex : state.playlistIndex;
    $('#playlistCount').textContent = `${count} ${count === 1 ? 'TRACK' : 'TRACKS'}`;
    $('#playlistEmpty').hidden = count > 0;
    $('#playlistCurrentLabel').textContent = selected ? `SELECTED ${state.playlistIndex + 1} / ${count}` : 'NOTHING SELECTED';
    $('#playlistPreviousButton').disabled = navigationIndex <= 0 || state.exporting;
    $('#playlistNextButton').disabled = navigationIndex < 0 || navigationIndex >= count - 1 || state.exporting;
    $('#playlistMoveUpButton').disabled = !selected || state.playlistIndex <= 0 || state.exporting;
    $('#playlistMoveDownButton').disabled = !selected || state.playlistIndex >= count - 1 || state.exporting;
    $('#playlistRemoveButton').disabled = !selected || state.exporting;
    $('#playlistClearButton').disabled = count === 0 || state.exporting;
  }

  function renderPlaylist() {
    const list = $('#playlistList');
    list.replaceChildren();
    state.playlist.forEach((item, index) => {
      const button = document.createElement('button');
      const number = document.createElement('span');
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      const meta = document.createElement('small');
      const kind = document.createElement('span');
      button.type = 'button';
      const selected = index === state.playlistIndex;
      const loaded = item.id === state.playlistLoadedId;
      button.className = `playlist-item${selected ? ' active' : ''}${loaded ? ' loaded' : ''}`;
      button.title = loaded ? 'Loaded in the Music Deck' : 'Click to select · double-click to load and play';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(selected));
      number.className = 'playlist-item-index';
      number.textContent = String(index + 1).padStart(2, '0');
      copy.className = 'playlist-item-copy';
      title.textContent = item.name;
      meta.textContent = item.meta;
      copy.append(title, meta);
      kind.className = 'playlist-item-kind';
      kind.textContent = loaded ? 'LOADED' : 'FILE';
      button.append(number, copy, kind);
      button.addEventListener('click', () => selectPlaylistRow(index));
      button.addEventListener('dblclick', () => selectPlaylistIndex(index, true).catch((error) => showToast(error.message, true)));
      list.appendChild(button);
    });
    updatePlaylistControls();
  }

  async function selectPlaylistIndex(index, autoplay = false) {
    if (state.exporting) return showToast('Finish the current export before changing tracks.', true);
    const item = state.playlist[index];
    if (!item) return;
    if (state.audioMode !== 'deck') stopLiveAudio();
    $('#audioSourceSelect').value = 'deck';
    setAudioSourceStatus('DECK', false);
    audio.pause();
    if (songMapAnalyzing) songMapAnalysisJob += 1;
    songMapAnalyzing = false;
    activeSongMap = null;
    resetPulseEvents();
    state.playlistIndex = index;
    state.playlistLoadedId = item.id;
    state.audioName = item.name;
    audio.src = item.source;
    audio.load();
    // A source swap can occur before the media element's asynchronous pause
    // event updates the HUD. Reset the transport immediately for a newly
    // loaded track unless this activation explicitly requested autoplay.
    setPlayState();
    $('#trackName').textContent = item.name;
    $('#trackMeta').textContent = item.meta;
    audioController.renderTimeline(0, 0);
    $('#revealButton').hidden = true;
    updateTrackControls();
    renderPlaylist();
    loadSongMapForCurrentTrack();
    showToast(`${item.name} loaded${autoplay ? ' and playing' : ''}`);
    if (autoplay) {
      createAudioGraph();
      await audioContext.resume();
      await audio.play();
    }
  }

  async function addLocalFiles(files, { activate = false, autoplay = false } = {}) {
    const validFiles = Array.from(files || []).filter(isSupportedAudioFile);
    if (!validFiles.length) {
      if (files?.length) showToast('No supported audio files were found.', true);
      return false;
    }
    const firstIndex = state.playlist.length;
    for (const file of validFiles) {
      const relativePath = file.webkitRelativePath || '';
      let filePath = '';
      try { filePath = window.quarticDesktop.getPathForFile(file); } catch (_) { /* Offline export will report if no path is available. */ }
      state.playlist.push({
        id: ++state.playlistId,
        name: file.name.replace(/\.[^.]+$/, ''),
        meta: relativePath ? `FOLDER · ${relativePath}` : `${file.type || 'Audio file'} · ${(file.size / 1048576).toFixed(1)} MB`,
        source: URL.createObjectURL(file),
        file,
        filePath
      });
    }
    renderPlaylist();
    if (activate || state.playlistIndex < 0) await selectPlaylistIndex(firstIndex, autoplay);
    showToast(`${validFiles.length} ${validFiles.length === 1 ? 'track' : 'tracks'} added to Playlist`);
    return true;
  }

  async function loadAudio(file) {
    if (!file) return;
    if (state.exporting) return showToast('Finish the current export before loading another track.', true);
    await addLocalFiles([file], { activate: true });
  }

  function movePlaylistItem(direction) {
    const from = state.playlistIndex;
    const to = from + direction;
    if (from < 0 || to < 0 || to >= state.playlist.length || state.exporting) return;
    const [item] = state.playlist.splice(from, 1);
    state.playlist.splice(to, 0, item);
    state.playlistIndex = to;
    renderPlaylist();
    showToast(`${item.name} moved`);
  }

  function removeCurrentPlaylistItem() {
    const index = state.playlistIndex;
    if (index < 0 || state.exporting) return;
    const [removed] = state.playlist.splice(index, 1);
    const removedLoadedTrack = removed.id === state.playlistLoadedId;
    URL.revokeObjectURL(removed.source);
    state.playlistIndex = state.playlist.length ? Math.min(index, state.playlist.length - 1) : -1;
    if (removedLoadedTrack) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      state.playlistLoadedId = null;
      resetAudioDeck();
    }
    renderPlaylist();
    showToast(`${removed.name} removed${removedLoadedTrack ? ' · playback stopped' : ''}`);
  }

  function resetAudioDeck() {
    resetPulseEvents();
    state.audioName = '';
    if (songMapAnalyzing) songMapAnalysisJob += 1;
    songMapAnalyzing = false;
    activeSongMap = null;
    $('#trackName').textContent = 'No audio loaded';
    $('#trackMeta').textContent = 'Drop songs anywhere, choose files, or choose a local folder';
    audioController.renderTimeline(0, 0);
    updateTrackControls();
    setPlayState();
    if (songMapInitialized) renderSongMap();
  }

  function clearPlaylist() {
    if (state.exporting) return;
    if (state.audioMode !== 'deck') stopLiveAudio();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.playlist.forEach((item) => URL.revokeObjectURL(item.source));
    state.playlist = [];
    state.playlistIndex = -1;
    state.playlistLoadedId = null;
    resetAudioDeck();
    renderPlaylist();
    showToast('Playlist cleared');
  }

  async function changePlaylistTrack(direction, forcePlay = false) {
    const loadedIndex = currentPlaylistIndex();
    const referenceIndex = loadedIndex >= 0 ? loadedIndex : state.playlistIndex;
    const nextIndex = referenceIndex + direction;
    if (nextIndex < 0 || nextIndex >= state.playlist.length) return;
    const autoplay = forcePlay || !audio.paused;
    await selectPlaylistIndex(nextIndex, autoplay);
  }

  async function togglePlayback() {
    if (!audio.src || state.exporting || state.audioMode !== 'deck') return;
    createAudioGraph();
    await audioContext.resume();
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } else audio.pause();
  }

  function setPlayState() {
    const liveInput = state.audioMode !== 'deck' && audioIsActive();
    const deckPlaying = state.audioMode === 'deck' && !audio.paused;
    const playing = liveInput || deckPlaying;
    audioController.renderTransport({ liveInput, deckPlaying, playing, exporting: state.exporting });
  }

  function fftInPlace(real, imaginary) {
    const length = real.length;
    for (let index = 1, reversed = 0; index < length; index++) {
      let bit = length >> 1;
      for (; reversed & bit; bit >>= 1) reversed ^= bit;
      reversed ^= bit;
      if (index < reversed) {
        [real[index], real[reversed]] = [real[reversed], real[index]];
        [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]];
      }
    }
    for (let size = 2; size <= length; size <<= 1) {
      const angle = -2 * Math.PI / size;
      const stepReal = Math.cos(angle);
      const stepImaginary = Math.sin(angle);
      for (let start = 0; start < length; start += size) {
        let twiddleReal = 1;
        let twiddleImaginary = 0;
        for (let offset = 0; offset < size / 2; offset++) {
          const even = start + offset;
          const odd = even + size / 2;
          const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary;
          const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal;
          real[odd] = real[even] - oddReal;
          imaginary[odd] = imaginary[even] - oddImaginary;
          real[even] += oddReal;
          imaginary[even] += oddImaginary;
          const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
          twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
          twiddleReal = nextReal;
        }
      }
    }
  }

  function createOfflineAudioAnalyzer(audioBuffer, fps) {
    const fftSize = 2048;
    const sampleRate = audioBuffer.sampleRate;
    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) => audioBuffer.getChannelData(index));
    const real = new Float64Array(fftSize);
    const imaginary = new Float64Array(fftSize);
    const rawWindow = new Float32Array(fftSize);
    const magnitudes = new Float32Array(fftSize / 2);
    const responseAtFps = (responseAt60) => 1 - Math.pow(1 - responseAt60, 60 / fps);

    const sampleAt = (index) => {
      if (index < 0 || index >= audioBuffer.length) return 0;
      let sample = 0;
      for (const channel of channels) sample += channel[index] || 0;
      return sample / channels.length;
    };
    const averageHz = (lowHz, highHz) => {
      const lowBin = clamp(Math.floor(lowHz * fftSize / sampleRate), 0, magnitudes.length - 1);
      const highBin = clamp(Math.ceil(highHz * fftSize / sampleRate), lowBin + 1, magnitudes.length);
      let sum = 0;
      for (let bin = lowBin; bin < highBin; bin++) sum += magnitudes[bin];
      return sum / Math.max(1, highBin - lowBin);
    };

    return (timeSeconds) => {
      const centerSample = Math.round(timeSeconds * sampleRate);
      let squareSum = 0;
      for (let index = 0; index < fftSize; index++) {
        const sample = sampleAt(centerSample - fftSize / 2 + index);
        rawWindow[index] = sample;
        squareSum += sample * sample;
        const windowValue = .5 - .5 * Math.cos(2 * Math.PI * index / (fftSize - 1));
        real[index] = sample * windowValue;
        imaginary[index] = 0;
      }
      fftInPlace(real, imaginary);
      for (let bin = 0; bin < magnitudes.length; bin++) {
        const amplitude = Math.hypot(real[bin], imaginary[bin]) / (fftSize * .5);
        const decibels = 20 * Math.log10(Math.max(1e-8, amplitude));
        magnitudes[bin] = clamp((decibels + 90) / 70, 0, 1);
      }
      const bands = getActiveFrequencyBands();
      const rawBass = averageHz(bands.floor, bands.lowMid) * 1.6 * state.analysisBassGain;
      const rawMids = averageHz(bands.lowMid, bands.midHigh) * 1.45 * state.analysisMidGain;
      const rawHighs = averageHz(bands.midHigh, bands.ceiling) * 1.8 * state.analysisHighGain;
      const rawPeak = Math.max(rawBass, rawMids, rawHighs);
      if (state.autoReactivity && rawPeak > .03) {
        const desiredGain = clamp(state.autoReactivityTarget / Math.max(.03, rawPeak * state.reactivity), .25, 3);
        const baseResponse = desiredGain < state.autoReactivityGain ? .18 : .015;
        state.autoReactivityGain += (desiredGain - state.autoReactivityGain) * responseAtFps(baseResponse);
      } else if (!state.autoReactivity) state.autoReactivityGain += (1 - state.autoReactivityGain) * responseAtFps(.08);
      const effectiveGain = state.reactivity * (state.autoReactivity ? state.autoReactivityGain : 1);
      const maximumLevel = state.autoReactivity ? .96 : 1;
      const spectrumCeiling = Math.min(20000, sampleRate / 2);
      for (let index = 0; index < 64; index++) {
        const lowHz = 20 * Math.pow(spectrumCeiling / 20, index / 64);
        const highHz = 20 * Math.pow(spectrumCeiling / 20, (index + 1) / 64);
        const spectrumTarget = Math.min(maximumLevel, averageHz(lowHz, highHz) * 1.55 * effectiveGain);
        state.spectrumData[index] += (spectrumTarget - state.spectrumData[index]) * responseAtFps(.22);
        const timeIndex = Math.round(index / 63 * (fftSize - 1));
        const waveformTarget = clamp(rawWindow[timeIndex] * effectiveGain, -1, 1);
        state.waveformData[index] += (waveformTarget - state.waveformData[index]) * responseAtFps(.42);
      }
      const bass = Math.min(maximumLevel, rawBass * effectiveGain);
      const mids = Math.min(maximumLevel, rawMids * effectiveGain);
      const highs = Math.min(maximumLevel, rawHighs * effectiveGain);
      state.bass += (bass - state.bass) * responseAtFps(.24);
      state.mids += (mids - state.mids) * responseAtFps(.18);
      state.highs += (highs - state.highs) * responseAtFps(.2);
      const rms = Math.sqrt(squareSum / fftSize);
      state.rms += (Math.min(maximumLevel, rms * 3.2 * effectiveGain) - state.rms) * responseAtFps(.2);
      const colorEnergy = state.bass + state.mids + state.highs;
      if (colorEnergy > .035) {
        const targetHue = (state.bass * .06 + state.mids * .45 + state.highs * .88) / colorEnergy;
        state.frequencyHue += (targetHue - state.frequencyHue) * responseAtFps(.04 + (1 - state.analysisSmoothing) * .28);
        const strongest = Math.max(state.bass, state.mids, state.highs);
        state.dominantBand = strongest === state.bass ? 'bass' : (strongest === state.mids ? 'mids' : 'highs');
      } else state.dominantBand = 'silence';
      const beatLow = averageHz(30, 190) * 1.35;
      const beatLowMid = averageHz(150, 520) * 1.18;
      updateAdaptiveBeatDetector(beatLow, beatLowMid, 1 / fps, { register: false });
      createMusicPulseEvents([bass, mids, highs]);
    };
  }

  const songMapCacheStorageKey = 'quarticPulseSongMapsV1';
  const songMapCacheVersion = songMapDataEngine.diagnostics.cacheVersion;
  const songMapSectionColors = ['#45ddcf', '#826dff', '#ed68df', '#f2bd59', '#55a8ff', '#78df78'];
  let activeSongMap = null;
  let songMapAnalyzing = false;
  let songMapAnalysisJob = 0;
  let songMapInitialized = false;
  let songMapRefreshTimer = 0;
  let activeSongDirectorPlan = [];
  const songDirectorOverridesStorageKey = 'quarticPulseDirectorOverridesV1';

  const songDirectorStyles = songDirectorEngine.styles;
  const songDirectorBehaviors = songDirectorEngine.behaviors;
  const songDirectorTransitions = songDirectorEngine.transitions;

  function resolveSongDirectorBehavior(map = activeSongMap) {
    return songDirectorEngine.resolveBehavior(state.songDirectorBehavior, map);
  }

  function readSongDirectorOverrides() {
    return songMapDataEngine.parseOverrides(localStorage.getItem(songDirectorOverridesStorageKey) || '[]');
  }

  function songDirectorOverrideFor(index) {
    return songMapDataEngine.overrideFor(readSongDirectorOverrides(), activeSongMap?.key, index);
  }

  function writeSongDirectorOverride(index, override) {
    if (!activeSongMap?.key || index < 0) return;
    const entries = songMapDataEngine.updateOverride(readSongDirectorOverrides(), activeSongMap.key, index, override);
    try { localStorage.setItem(songDirectorOverridesStorageKey, JSON.stringify(entries)); }
    catch (_) { /* Cue edits remain optional if local storage is unavailable. */ }
  }

  function generateSongDirectorPlan(map = activeSongMap) {
    return songDirectorEngine.generatePlan(map, state.songDirectorBehavior);
  }

  function updateSongDirector(time) {
    if (isObsOutput) return state.songDirectorValues || {};
    if (!state.songDirectorEnabled || !activeSongMap || !activeSongDirectorPlan.length) {
      state.songDirectorValues = {};
      updateSongDirectorNow(null, {}, time);
      return state.songDirectorValues;
    }
    const result = songDirectorEngine.evaluate({
      plan: activeSongDirectorPlan,
      map: activeSongMap,
      time,
      styleId: state.songDirectorStyle,
      transitionId: state.songDirectorTransition,
      intensity: state.songDirectorIntensity,
      getOverride: songDirectorOverrideFor,
      dimensionalEnabled: state.fractalDimensional,
      foldingEnabled: state.equationFolding
    });
    state.songDirectorValues = result.values;
    updateSongDirectorNow(result.cue, result.values, result.songTime, result.dynamics);
    return result.values;
  }

  function updateSongDirectorNow(cue, values, time, dynamics = null) {
    songDirectorController.updateNow(cue, values, time, dynamics);
  }

  function renderSongDirector() {
    songDirectorController.render();
  }

  function initializeSongDirector() {
    songDirectorController.initialize();
  }

  function hashSongMapText(text) {
    return songMapDataEngine.hashText(text);
  }

  function songMapProfileSignature() {
    const bands = getActiveFrequencyBands();
    return songMapDataEngine.profileSignature({
      personality: state.musicPersonality,
      bands,
      bassGain: state.analysisBassGain,
      midGain: state.analysisMidGain,
      highGain: state.analysisHighGain,
      smoothing: state.analysisSmoothing,
      beatSensitivity: state.beatSensitivity,
      beatCooldownMs: state.beatCooldownMs
    });
  }

  function songMapKey(item = currentPlaylistItem()) {
    return songMapDataEngine.mapKey(item, songMapProfileSignature());
  }

  function validSongMap(map) {
    return songMapDataEngine.isValidMap(map);
  }

  function readSongMapCache() {
    return songMapDataEngine.parseCache(localStorage.getItem(songMapCacheStorageKey) || '[]');
  }

  function writeSongMapCache(entries) {
    const ordered = songMapDataEngine.prepareCache(entries);
    try {
      localStorage.setItem(songMapCacheStorageKey, JSON.stringify(ordered));
    } catch (_) {
      try { localStorage.setItem(songMapCacheStorageKey, JSON.stringify(ordered.slice(0, 4))); }
      catch (_) { /* Song maps remain usable for the current session. */ }
    }
  }

  function cacheSongMap(map) {
    writeSongMapCache(songMapDataEngine.upsertCache(readSongMapCache(), map));
  }

  function percentile(values, amount) {
    const sorted = Array.from(values || []).filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * amount)))];
  }

  function estimateSongMapBpm(beatTimes) {
    if (beatTimes.length < 4) return { bpm: 0, confidence: 0 };
    const candidates = [];
    for (let index = 1; index < beatTimes.length; index++) {
      const gap = beatTimes[index] - beatTimes[index - 1];
      if (gap < .18 || gap > 2.2) continue;
      let bpm = 60 / gap;
      while (bpm < 72) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      candidates.push(bpm);
    }
    if (candidates.length < 3) return { bpm: 0, confidence: 0 };
    const histogram = new Float32Array(181);
    for (const bpm of candidates) {
      const center = Math.round(bpm);
      for (let offset = -2; offset <= 2; offset++) {
        const bin = center + offset;
        if (bin >= 0 && bin < histogram.length) histogram[bin] += 1 - Math.abs(offset) * .17;
      }
    }
    let bestBin = 0;
    for (let bin = 1; bin < histogram.length; bin++) if (histogram[bin] > histogram[bestBin]) bestBin = bin;
    const close = candidates.filter((bpm) => Math.abs(bpm - bestBin) <= 3);
    const bpm = close.length ? close.reduce((sum, value) => sum + value, 0) / close.length : bestBin;
    return { bpm: Math.round(bpm), confidence: clamp(close.length / candidates.length, 0, 1) };
  }

  function averageSongMapRange(values, from, to) {
    let total = 0;
    const end = Math.min(values.length, Math.max(from + 1, to));
    for (let index = from; index < end; index++) total += values[index] || 0;
    return total / Math.max(1, end - from) / 255;
  }

  function deriveSongMapSections(series, duration, interval) {
    const pointCount = series.energy.length;
    if (!pointCount) return [];
    const chunkPoints = Math.max(2, Math.round(6 / interval));
    const chunks = [];
    for (let start = 0; start < pointCount; start += chunkPoints) {
      const end = Math.min(pointCount, start + chunkPoints);
      chunks.push({
        time: start * interval,
        energy: averageSongMapRange(series.energy, start, end),
        bass: averageSongMapRange(series.bass, start, end),
        mids: averageSongMapRange(series.mids, start, end),
        highs: averageSongMapRange(series.highs, start, end)
      });
    }
    if (chunks.length < 2) return [{ start: 0, end: duration, label: 'Full Track', kind: 'steady', energy: chunks[0]?.energy || 0 }];
    const novelty = chunks.map((chunk, index) => {
      if (!index) return 0;
      const previous = chunks[index - 1];
      return Math.abs(chunk.energy - previous.energy) * 1.25
        + Math.abs(chunk.bass - previous.bass) * .75
        + Math.abs(chunk.mids - previous.mids) * .62
        + Math.abs(chunk.highs - previous.highs) * .68;
    });
    const threshold = percentile(novelty.slice(1), .68);
    const candidates = [];
    for (let index = 1; index < novelty.length - 1; index++) {
      if (novelty[index] >= threshold && novelty[index] >= novelty[index - 1] && novelty[index] >= novelty[index + 1]) {
        candidates.push({ time: chunks[index].time, strength: novelty[index] });
      }
    }
    candidates.sort((a, b) => b.strength - a.strength);
    const boundaries = [0, duration];
    const minimumGap = Math.min(14, Math.max(8, duration / 16));
    for (const candidate of candidates) {
      if (boundaries.length >= 10) break;
      if (candidate.time < minimumGap || duration - candidate.time < minimumGap) continue;
      if (boundaries.every((time) => Math.abs(time - candidate.time) >= minimumGap)) boundaries.push(candidate.time);
    }
    if (boundaries.length < 4 && duration >= 60) {
      for (const fraction of [1 / 3, 2 / 3]) {
        const target = duration * fraction;
        const nearby = candidates.filter((candidate) => Math.abs(candidate.time - target) <= duration * .14)
          .sort((a, b) => Math.abs(a.time - target) - Math.abs(b.time - target))[0];
        const time = nearby?.time || target;
        if (boundaries.every((boundary) => Math.abs(boundary - time) >= minimumGap)) boundaries.push(time);
      }
    }
    boundaries.sort((a, b) => a - b);
    const sections = [];
    for (let index = 0; index < boundaries.length - 1; index++) {
      const start = boundaries[index];
      const end = boundaries[index + 1];
      const from = Math.max(0, Math.floor(start / interval));
      const to = Math.min(pointCount, Math.ceil(end / interval));
      sections.push({
        start, end,
        energy: averageSongMapRange(series.energy, from, to),
        bass: averageSongMapRange(series.bass, from, to),
        mids: averageSongMapRange(series.mids, from, to),
        highs: averageSongMapRange(series.highs, from, to)
      });
    }
    const globalEnergy = sections.reduce((sum, section) => sum + section.energy, 0) / Math.max(1, sections.length);
    let peakIndex = 0;
    for (let index = 1; index < sections.length; index++) if (sections[index].energy > sections[peakIndex].energy) peakIndex = index;
    let movementNumber = 1;
    sections.forEach((section, index) => {
      const from = Math.max(0, Math.floor(section.start / interval));
      const to = Math.min(pointCount, Math.ceil(section.end / interval));
      const midpoint = Math.floor((from + to) / 2);
      const early = averageSongMapRange(series.energy, from, midpoint);
      const late = averageSongMapRange(series.energy, midpoint, to);
      if (sections.length > 1 && index === 0) {
        section.label = 'Intro'; section.kind = 'intro';
      } else if (sections.length > 1 && index === sections.length - 1) {
        section.label = 'Outro'; section.kind = 'outro';
      } else if (index === peakIndex && section.energy >= globalEnergy * 1.04) {
        section.label = 'Peak'; section.kind = 'peak';
      } else if (section.energy < globalEnergy * .72) {
        section.label = 'Breakdown'; section.kind = 'breakdown';
      } else if (late - early > .11) {
        section.label = 'Build'; section.kind = 'build';
      } else if (section.bass > Math.max(section.mids, section.highs) * 1.16) {
        section.label = 'Bass Drive'; section.kind = 'bass';
      } else if (section.highs > Math.max(section.bass, section.mids) * 1.14) {
        section.label = 'Lift'; section.kind = 'lift';
      } else {
        section.label = `Movement ${movementNumber++}`; section.kind = 'steady';
      }
    });
    if (sections.length === 1) {
      sections[0].label = 'Full Track';
      sections[0].kind = 'steady';
    }
    return sections;
  }

  async function analyzeSongBuffer(audioBuffer, job, onProgress) {
    const fftSize = 2048;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const interval = Math.max(.2, duration / 1400);
    const pointCount = Math.max(2, Math.ceil(duration / interval));
    const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) => audioBuffer.getChannelData(index));
    const real = new Float64Array(fftSize);
    const imaginary = new Float64Array(fftSize);
    const magnitudes = new Float32Array(fftSize / 2);
    const energyRaw = new Float32Array(pointCount);
    const bassRaw = new Float32Array(pointCount);
    const midsRaw = new Float32Array(pointCount);
    const highsRaw = new Float32Array(pointCount);
    const beatEnergy = new Float32Array(pointCount);
    const bands = { ...getActiveFrequencyBands() };
    const gains = [state.analysisBassGain, state.analysisMidGain, state.analysisHighGain];
    const sampleAt = (sampleIndex) => {
      if (sampleIndex < 0 || sampleIndex >= audioBuffer.length) return 0;
      let value = 0;
      for (const channel of channels) value += channel[sampleIndex] || 0;
      return value / channels.length;
    };
    const averageHz = (lowHz, highHz) => {
      const lowBin = clamp(Math.floor(lowHz * fftSize / sampleRate), 0, magnitudes.length - 1);
      const highBin = clamp(Math.ceil(highHz * fftSize / sampleRate), lowBin + 1, magnitudes.length);
      let total = 0;
      for (let bin = lowBin; bin < highBin; bin++) total += magnitudes[bin];
      return total / Math.max(1, highBin - lowBin);
    };
    for (let point = 0; point < pointCount; point++) {
      if (job !== songMapAnalysisJob) throw new Error('SONG_MAP_CANCELLED');
      const centerSample = Math.round(Math.min(duration, point * interval) * sampleRate);
      let squareSum = 0;
      for (let index = 0; index < fftSize; index++) {
        const sample = sampleAt(centerSample - fftSize / 2 + index);
        squareSum += sample * sample;
        const windowValue = .5 - .5 * Math.cos(2 * Math.PI * index / (fftSize - 1));
        real[index] = sample * windowValue;
        imaginary[index] = 0;
      }
      fftInPlace(real, imaginary);
      for (let bin = 0; bin < magnitudes.length; bin++) {
        const amplitude = Math.hypot(real[bin], imaginary[bin]) / (fftSize * .5);
        const decibels = 20 * Math.log10(Math.max(1e-8, amplitude));
        magnitudes[bin] = clamp((decibels + 90) / 70, 0, 1);
      }
      bassRaw[point] = averageHz(bands.floor, bands.lowMid) * 1.6 * gains[0];
      midsRaw[point] = averageHz(bands.lowMid, bands.midHigh) * 1.45 * gains[1];
      highsRaw[point] = averageHz(bands.midHigh, bands.ceiling) * 1.8 * gains[2];
      const rms = Math.sqrt(squareSum / fftSize) * 3.1;
      energyRaw[point] = rms * .52 + bassRaw[point] * .2 + midsRaw[point] * .17 + highsRaw[point] * .11;
      beatEnergy[point] = bassRaw[point] * .74 + midsRaw[point] * .26;
      if (point % 18 === 0 || point === pointCount - 1) {
        onProgress?.((point + 1) / pointCount);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    const bandScale = Math.max(.05, percentile([...bassRaw, ...midsRaw, ...highsRaw], .96));
    const energyScale = Math.max(.05, percentile(energyRaw, .96));
    const quantize = (values, scale) => Array.from(values, (value) => Math.round(Math.pow(clamp(value / scale, 0, 1), .82) * 255));
    const series = {
      energy: quantize(energyRaw, energyScale),
      bass: quantize(bassRaw, bandScale),
      mids: quantize(midsRaw, bandScale),
      highs: quantize(highsRaw, bandScale)
    };
    const onset = new Float32Array(pointCount);
    let fast = 0;
    let slow = 0;
    for (let index = 0; index < pointCount; index++) {
      fast += (beatEnergy[index] - fast) * (1 - Math.exp(-interval / .055));
      slow += (beatEnergy[index] - slow) * (1 - Math.exp(-interval / .62));
      onset[index] = Math.max(0, fast - slow);
    }
    const onsetThreshold = Math.max(.004, percentile(onset, .7) * (1.22 - state.beatSensitivity * .5));
    const energyGate = percentile(beatEnergy, .34);
    const cooldownPoints = Math.max(1, Math.round(state.beatCooldownMs / 1000 / interval));
    const beats = [];
    let lastBeatPoint = -cooldownPoints;
    for (let index = 1; index < pointCount - 1; index++) {
      if (index - lastBeatPoint < cooldownPoints) continue;
      if (onset[index] >= onsetThreshold && onset[index] >= onset[index - 1] && onset[index] > onset[index + 1] && beatEnergy[index] >= energyGate) {
        beats.push(Number((index * interval).toFixed(3)));
        lastBeatPoint = index;
      }
    }
    const tempo = estimateSongMapBpm(beats);
    const sections = deriveSongMapSections(series, duration, interval);
    return {
      version: songMapCacheVersion,
      duration,
      interval,
      ...series,
      beats,
      bpm: tempo.bpm,
      bpmConfidence: tempo.confidence,
      sections
    };
  }

  function songMapStatus(message, tone = '') {
    const status = $('#songMapStatus');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function updateSongMapProgress(progress, message) {
    $('#songMapProgress').hidden = false;
    $('#songMapProgressFill').style.width = `${clamp(progress, 0, 1) * 100}%`;
    $('#songMapProgressText').textContent = message;
  }

  function drawSongMap() {
    const canvasElement = $('#songMapCanvas');
    const map = activeSongMap;
    if (!canvasElement || !map || $('#songMapResults').hidden) return;
    const rect = canvasElement.getBoundingClientRect();
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(2, Math.round(rect.width * scale));
    const height = Math.max(2, Math.round(rect.height * scale));
    if (canvasElement.width !== width || canvasElement.height !== height) {
      canvasElement.width = width;
      canvasElement.height = height;
    }
    const context = canvasElement.getContext('2d');
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const w = rect.width;
    const h = rect.height;
    context.clearRect(0, 0, w, h);
    context.fillStyle = '#05070d';
    context.fillRect(0, 0, w, h);
    map.sections.forEach((section, index) => {
      const x = section.start / map.duration * w;
      const sectionWidth = Math.max(1, (section.end - section.start) / map.duration * w);
      const color = songMapSectionColors[index % songMapSectionColors.length];
      context.globalAlpha = .055 + (index % 2) * .025;
      context.fillStyle = color;
      context.fillRect(x, 0, sectionWidth, h);
      context.globalAlpha = .42;
      context.fillRect(x, 0, 1, h);
      if (sectionWidth > 58) {
        context.globalAlpha = .56;
        context.fillStyle = '#c3ccdc';
        context.font = '700 7px Segoe UI';
        context.fillText(section.label.toUpperCase(), x + 5, 11);
      }
    });
    context.globalAlpha = 1;
    context.strokeStyle = 'rgba(122,137,169,.11)';
    context.lineWidth = 1;
    for (let row = 1; row < 4; row++) {
      context.beginPath();
      context.moveTo(0, h * row / 4);
      context.lineTo(w, h * row / 4);
      context.stroke();
    }
    const linePath = (values, color, amplitude, offset = 0) => {
      context.beginPath();
      values.forEach((value, index) => {
        const x = index / Math.max(1, values.length - 1) * w;
        const y = h - 8 - (value / 255) * amplitude + offset;
        if (!index) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = color;
      context.lineWidth = 1.15;
      context.stroke();
    };
    context.beginPath();
    context.moveTo(0, h);
    map.energy.forEach((value, index) => {
      const x = index / Math.max(1, map.energy.length - 1) * w;
      const y = h - (value / 255) * (h - 18);
      context.lineTo(x, y);
    });
    context.lineTo(w, h);
    context.closePath();
    const energyGradient = context.createLinearGradient(0, 18, 0, h);
    energyGradient.addColorStop(0, 'rgba(132,98,255,.42)');
    energyGradient.addColorStop(1, 'rgba(56,37,115,.04)');
    context.fillStyle = energyGradient;
    context.fill();
    linePath(map.bass, 'rgba(66,228,208,.92)', h * .42, h * .49);
    linePath(map.mids, 'rgba(232,108,240,.88)', h * .35, h * .29);
    linePath(map.highs, 'rgba(245,199,93,.88)', h * .28, h * .12);
    context.strokeStyle = 'rgba(248,250,255,.42)';
    context.lineWidth = 1;
    for (const beat of map.beats) {
      const x = beat / map.duration * w;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 6);
      context.stroke();
    }
  }

  function updateSongMapPlayhead(time = audio.currentTime) {
    if (!songMapInitialized || !activeSongMap) return;
    const progress = clamp((Number(time) || 0) / activeSongMap.duration, 0, 1);
    $('#songMapPlayhead').style.left = `${progress * 100}%`;
    $('#songMapCanvas').setAttribute('aria-valuemax', String(Math.round(activeSongMap.duration)));
    $('#songMapCanvas').setAttribute('aria-valuenow', String(Math.round(progress * activeSongMap.duration)));
    $('#songMapCanvas').setAttribute('aria-valuetext', `${formatTime(progress * activeSongMap.duration)} of ${formatTime(activeSongMap.duration)}`);
  }

  function renderSongMap() {
    if (!songMapInitialized) return;
    const item = currentPlaylistItem();
    const map = activeSongMap;
    $('#songMapEmpty').hidden = Boolean(map);
    $('#songMapResults').hidden = !map;
    $('#clearSongMapButton').disabled = !map || songMapAnalyzing;
    $('#analyzeSongButton').disabled = !item?.file || state.exporting;
    $('#analyzeSongButton').textContent = songMapAnalyzing ? 'CANCEL ANALYSIS' : (map ? 'REANALYZE SONG' : 'ANALYZE SONG');
    if (!item?.file) songMapStatus('LOAD A SONG');
    else if (!map && !songMapAnalyzing) songMapStatus('READY');
    renderSongDirector();
    if (showComposerController.initialized) renderShowComposer();
    if (!map) return;
    const profile = musicPersonalityProfiles[map.personality]?.label || (map.personality === 'custom' ? 'Custom' : 'Analyzer');
    songMapStatus(`CACHED · ${profile}`);
    const bpmText = map.bpm ? `${map.bpm}` : '--';
    $('#songMapStats').innerHTML = `
      <div class="song-map-stat"><strong>${formatTime(map.duration)}</strong><small>DURATION</small></div>
      <div class="song-map-stat"><strong>${bpmText}</strong><small>EST. BPM</small></div>
      <div class="song-map-stat"><strong>${map.beats.length}</strong><small>BEATS</small></div>
      <div class="song-map-stat"><strong>${map.sections.length}</strong><small>SECTIONS</small></div>`;
    const sectionList = $('#songMapSections');
    sectionList.replaceChildren(...map.sections.map((section, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'song-map-section';
      button.style.setProperty('--section-color', songMapSectionColors[index % songMapSectionColors.length]);
      button.innerHTML = `<i></i><span><strong>${section.label}</strong><small>${formatTime(section.start)}-${formatTime(section.end)}</small></span><time>${formatTime(section.start)}</time>`;
      button.addEventListener('click', () => {
        if (state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
        audio.currentTime = Math.min(audio.duration, section.start);
        updateSongMapPlayhead(audio.currentTime);
      });
      return button;
    }));
    requestAnimationFrame(() => {
      drawSongMap();
      updateSongMapPlayhead();
    });
  }

  function loadSongMapForCurrentTrack() {
    if (!songMapInitialized) return;
    const key = songMapKey();
    activeSongMap = key ? readSongMapCache().find((entry) => entry.key === key) || null : null;
    if (!activeSongMap) tryRestorePendingPerformanceMap();
    $('#songMapProgress').hidden = true;
    renderSongMap();
  }

  function scheduleSongMapRefresh() {
    if (!songMapInitialized) return;
    if (songMapAnalyzing) {
      songMapAnalysisJob += 1;
      songMapAnalyzing = false;
      $('#songMapProgress').hidden = true;
    }
    clearTimeout(songMapRefreshTimer);
    songMapRefreshTimer = window.setTimeout(loadSongMapForCurrentTrack, 0);
  }

  async function analyzeCurrentSongMap() {
    const item = currentPlaylistItem();
    if (!item?.file) return showToast('Load a local song before creating a Song Map.', true);
    if (songMapAnalyzing) {
      songMapAnalysisJob += 1;
      songMapAnalyzing = false;
      songMapStatus('CANCELLED');
      $('#songMapProgress').hidden = true;
      loadSongMapForCurrentTrack();
      return;
    }
    const key = songMapKey(item);
    const job = ++songMapAnalysisJob;
    songMapAnalyzing = true;
    activeSongMap = null;
    songMapStatus('ANALYZING', 'active');
    updateSongMapProgress(0, 'DECODING AUDIO');
    renderSongMap();
    try {
      createAudioGraph();
      const audioBuffer = await audioContext.decodeAudioData((await item.file.arrayBuffer()).slice(0));
      if (job !== songMapAnalysisJob) throw new Error('SONG_MAP_CANCELLED');
      const map = await analyzeSongBuffer(audioBuffer, job, (progress) => {
        updateSongMapProgress(progress, `ANALYZING ${Math.round(progress * 100)}%`);
      });
      map.key = key;
      map.trackName = item.name;
      map.personality = state.musicPersonality;
      map.profileSignature = songMapProfileSignature();
      map.updatedAt = new Date().toISOString();
      cacheSongMap(map);
      if (job === songMapAnalysisJob && songMapKey() === key) activeSongMap = map;
      songMapStatus('MAP COMPLETE');
      updateSongMapProgress(1, 'MAP COMPLETE');
      showToast(`${item.name} Song Map created and cached`);
      window.setTimeout(() => { if (job === songMapAnalysisJob) $('#songMapProgress').hidden = true; }, 900);
    } catch (error) {
      if (error.message !== 'SONG_MAP_CANCELLED') {
        songMapStatus('ANALYSIS FAILED', 'error');
        showToast(`Song analysis failed: ${error.message}`, true);
      }
      $('#songMapProgress').hidden = true;
    } finally {
      if (job === songMapAnalysisJob) songMapAnalyzing = false;
      renderSongMap();
    }
  }

  function clearCurrentSongMap() {
    const key = songMapKey();
    if (!key) return;
    writeSongMapCache(readSongMapCache().filter((entry) => entry.key !== key));
    activeSongMap = null;
    renderSongMap();
    showToast('Cached Song Map cleared');
  }

  function initializeSongMap() {
    songMapInitialized = true;
    $('#analyzeSongButton').addEventListener('click', () => analyzeCurrentSongMap().catch((error) => showToast(error.message, true)));
    $('#clearSongMapButton').addEventListener('click', clearCurrentSongMap);
    const timeline = $('#songMapCanvas');
    let pointerId = null;
    const seek = (event) => {
      if (!activeSongMap || state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
      const rect = timeline.getBoundingClientRect();
      const progress = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      audio.currentTime = Math.min(audio.duration, progress * activeSongMap.duration);
      updateSongMapPlayhead(audio.currentTime);
    };
    timeline.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      timeline.setPointerCapture(pointerId);
      seek(event);
    });
    timeline.addEventListener('pointermove', (event) => { if (pointerId === event.pointerId) seek(event); });
    const finish = (event) => {
      if (pointerId !== event.pointerId) return;
      if (event.type === 'pointerup') seek(event);
      if (timeline.hasPointerCapture(pointerId)) timeline.releasePointerCapture(pointerId);
      pointerId = null;
    };
    timeline.addEventListener('pointerup', finish);
    timeline.addEventListener('pointercancel', finish);
    timeline.addEventListener('keydown', (event) => {
      if (!activeSongMap || state.audioMode !== 'deck' || !Number.isFinite(audio.duration)) return;
      let target = audio.currentTime;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target -= event.shiftKey ? 15 : 5;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') target += event.shiftKey ? 15 : 5;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = activeSongMap.duration;
      else return;
      event.preventDefault();
      audio.currentTime = clamp(target, 0, Math.min(audio.duration, activeSongMap.duration));
      updateSongMapPlayhead(audio.currentTime);
    });
    new ResizeObserver(() => drawSongMap()).observe($('#songMapTimeline'));
    loadSongMapForCurrentTrack();
  }

  function requestOfflineVisualFrame() {
    if (pendingOfflineRender) return Promise.reject(new Error('The previous offline frame is still rendering.'));
    return new Promise((resolve) => { pendingOfflineRender = resolve; });
  }

  if (isSmokeTest) {
    window.__quarticTestExportSampling = () => exportSamplingEngine.selfTest();
  }

  function createOfflineExportJob(options = {}) {
    const item = currentPlaylistItem();
    return {
      prepare: async () => {
        if (state.audioMode !== 'deck') stopLiveAudio();
        audio.pause();
        const settings = currentExportSettings();
        exportController.renderOfflineState('preparing');
        createAudioGraph();
        return exportPreparationEngine.prepareOffline({
          item,
          settings,
          audioName: state.audioName,
          test: options.test,
          durationLimit: options.durationLimit,
          preflight: options.preflight
        }, {
          readAudioData: (track) => track.file.arrayBuffer(),
          decodeAudioData: (bytes) => audioContext.decodeAudioData(bytes)
        });
      },
      beginSession: (context) => window.quarticDesktop.beginOfflineExport(context.sessionRequest),
      activate: ({ context }) => {
        const {
          width, height, fps, format, frameCount, hdrProfile, tenBitProfile,
          supersampling, exportDetail, exportIterations
        } = context;
        if (tenBitProfile && !ensureHdrExportTarget(width, height)) {
          throw new Error('This GPU/driver could not create the required 10-bit RGB export framebuffer. Use a lossless RGB profile or update the graphics driver.');
        }
        context.frameCapture = exportFrameCaptureEngine.createCapture({
          width,
          height,
          tenBit: tenBitProfile,
          supersampling
        });
        exportRuntimeStateCoordinator.activate('offline', {
          width, height, fps, hdrProfile, tenBitProfile, exportDetail, exportIterations
        }, { loopPlayback: audio.loop });
        resetPulseEvents();
        state.spectrumData.fill(0);
        state.waveformData.fill(0);
        renderPlaylist();
        exportResultWorkflowEngine.reset();
        exportController.renderOfflineState('rendering', { hidePreview: !context.showPreview });
        exportProgressCoordinator.begin(`Rendering frames 0 / ${frameCount} | overall 0%`, 'Rendering frames 0% | overall 0%');
        audioController.renderLiveStatus('OFFLINE RENDER', true);
        setCanvasSize();
        const exportProfile = exportProfileCatalog.profiles[format];
        exportProgressCoordinator.update(
          0,
          hdrProfile
            ? '10-bit Rec.2020 HLG target ready | HEVC Main 10 pipeline | rendering next'
            : `${exportProfile.container} | ${exportProfile.videoCodec} | rendering next`,
          hdrProfile
            ? 'YouTube HDR master ready | quality-priority HEVC'
            : `${exportProfile.label} ready`
        );
      },
      render: ({ context, session }) => {
        const { fps, frameCount, supersampling, audioBuffer, frameCapture } = context;
        const analyzeFrame = createOfflineAudioAnalyzer(audioBuffer, fps);
        return exportRenderCoordinator.renderFrames({
          sessionEngine: exportSessionEngine,
          frameCount,
          fps,
          supersampling,
          sampleOffsets: exportSamplingEngine.offsets,
          onFrameStart: ({ time }) => {
            state.offlineCurrentTime = time;
            state.visualTime = time;
            analyzeFrame(time);
            state.offlineBaseModulation = null;
            frameCapture.beginFrame();
          },
          onSample: (sample) => frameCapture.captureSample(sample),
          onFrameReady: () => frameCapture.resolveFrame(),
          onAppendFrame: () => window.quarticDesktop.appendOfflineFrame(session.id, frameCapture.outputBytes),
          onFrameEnd: () => frameCapture.cleanup(),
          onProgress: ({ renderedFrameCount, progress, overallProgress }) => {
            exportProgressCoordinator.update(
              overallProgress,
              `Rendering frames ${renderedFrameCount} / ${frameCount} | render ${Math.round(progress * 100)}% | overall ${Math.round(overallProgress * 100)}%`,
              `Rendering frames ${Math.round(progress * 100)}% | overall ${Math.round(overallProgress * 100)}%`
            );
          }
        });
      },
      beforeFinalize: () => {
        exportProgressCoordinator.update(.80, 'Frames rendered | closing the quality master and audio | overall 80%', 'Frames rendered | finalizing master | overall 80%');
        exportProgressCoordinator.update(.85, 'Encoded frames written | preparing final video | overall 85%', 'Encoded frames written | finalizing next | overall 85%');
        exportRuntimeStateCoordinator.markFinalizing('offline');
        exportController.renderOfflineState('finalizing', { shortened: exportSessionEngine.finishRequested });
        exportProgressCoordinator.update(.85, 'Frames complete | finalizing and saving | overall 85%', 'Frames complete | finalizing 0% | overall 85%');
      },
      complete: ({ context, renderedFrameCount, result }) => completeExportResult(result, {
          mode: options.test ? 'test' : 'offline',
          width: context.width,
          height: context.height,
          fps: context.fps,
          duration: renderedFrameCount / context.fps
        }, () => exportController.renderOfflineState('completed')),
      cancelled: () => {
        exportController.renderOfflineState('cancelled');
        showToast('Offline export cancelled and temporary files discarded');
      },
      failed: () => exportController.renderOfflineState('failed'),
      restore: ({ context, completed }) => {
        pendingOfflineRender = null;
        context?.frameCapture?.cleanup();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (context?.tenBitProfile) releaseHdrExportTarget();
        exportRuntimeStateCoordinator.restore('offline');
        resetPulseEvents();
        exportController.renderOfflineState('restored', { completed });
        updateUnleashedMode(state.unleashedMode);
        audioController.renderLiveStatus('IDLE');
        updateTrackControls();
        renderPlaylist();
        setCanvasSize();
        setPlayState();
      }
    };
  }

  async function startOfflineExport(options = {}) {
    return exportJobCoordinator.startOffline(options);
  }

  async function startExport() {
    return exportWorkflowEngine.run({
      requestChoice: () => exportController.requestPreflightChoice({
        load: () => requestExportPreflight(),
        loaded: (preflight) => {
          lastExportPreflight = preflight;
          populateExportPreflight(preflight);
        },
        loadTest: (preflight) => requestExportPreflight(Math.min(5, preflight.duration)),
        failed: (error) => showToast(error.message, true)
      }),
      startOffline: startOfflineExport,
      failed: () => {
        if (!state.exporting) exportController.renderOfflineState('restored', { completed: false });
      }
    });
  }

  function createLiveExportJob(options = {}) {
    const settings = currentExportSettings();
    return {
      prepare: async () => {
        exportController.renderLiveState('preparing');
        if (state.audioMode !== 'deck') stopLiveAudio();
        createAudioGraph();
        await audioContext.resume();
        return exportPreparationEngine.prepareLive({
          settings,
          audioName: state.audioName,
          preflight: options.preflight
        });
      },
      beginSession: (context) => window.quarticDesktop.beginExport(context.sessionRequest),
      activate: async ({ context }) => {
        exportRuntimeStateCoordinator.activate('live', context, { loopPlayback: audio.loop });
        resetPulseEvents();
        renderPlaylist();
        audio.loop = false;
        exportResultWorkflowEngine.reset();
        exportController.renderLiveState('recording', { hidePreview: !context.showPreview });
        exportProgressCoordinator.begin('Live recording 0% | overall 0%', 'Live recording 0% | overall 0%');
        setCanvasSize();
      },
      record: async ({ context, session }) => {
        liveExportCapture = exportLiveCaptureEngine.createCapture({
          canvas,
          audioStream: recordingDestination.stream,
          width: context.width,
          height: context.height,
          fps: context.fps,
          onChunk: (bytes) => window.quarticDesktop.appendExport(session.id, bytes),
          onError: (error) => showToast(`Recorder error: ${error?.message || 'unknown error'}`, true),
          onStop: finishLiveExport
        });
        audio.currentTime = 0;
        liveExportCapture.start(1000);
        await audio.play();
      },
      started: async ({ context }) => {
        audioController.renderLiveStatus('RECORDING', true);
        showToast(`Recording ${context.width}×${context.height} at ${context.fps} FPS for ${context.format.toUpperCase()} export`);
      },
      finishing: () => exportController.renderLiveState('stopping'),
      cancelling: () => exportController.renderLiveState('cancelling'),
      beforeFinalize: async () => {
        if (!exportSessionEngine.cancelRequested) exportController.renderLiveState('finalizing');
        await liveExportCapture?.drain();
      },
      finalize: async ({ session }) => {
        exportProgressCoordinator.update(.80, 'Recording complete | finalizing and saving | overall 80%', 'Recording complete | finalizing 0% | overall 80%');
        return window.quarticDesktop.finishExport(session.id);
      },
      complete: ({ context, result }) => completeExportResult(
        result,
        { mode: 'live', width: context.width, height: context.height, fps: context.fps, duration: audio.currentTime },
        () => exportController.renderLiveState('completed')
      ),
      cancelled: async () => {
        exportController.renderLiveState('cancelled');
        showToast('Live export cancelled and temporary files discarded');
      },
      failed: async ({ error }) => {
        exportController.renderLiveState('failed');
        showToast(error?.message || 'Video export failed.', true);
      },
      restore: async ({ completed }) => {
        const runtime = exportRuntimeStateCoordinator.restore('live');
        if (runtime.restored) audio.loop = runtime.loopPlayback;
        await liveExportCapture?.dispose();
        liveExportCapture = null;
        exportController.renderLiveState('restored', { completed });
        updateTrackControls();
        renderPlaylist();
        updateUnleashedMode(state.unleashedMode);
        audioController.renderLiveStatus('IDLE');
        setCanvasSize();
        setPlayState();
      }
    };
  }

  async function startLiveExport(options = {}) {
    return exportJobCoordinator.startLive(options);
  }

  function togglePauseExport() {
    return exportCommandCoordinator.togglePause({
      offlineRendering: state.offlineExporting,
      paused: (view) => exportController.setPaused(true, view),
      resumed: ({ progress, percent }) => {
        exportController.setPaused(false, { note: 'Offline rendering resumed from the next exact frame.' });
        exportProgressCoordinator.update(progress, exportController.getPanelText(), `Rendering resumed · overall ${percent}%`);
      }
    });
  }

  function endAndFinishExport() {
    return exportCommandCoordinator.finish({
      offlineRendering: state.offlineExporting,
      resumed: () => exportController.setPaused(false),
      offlineFinishing: () => exportController.renderOfflineState('ending'),
      liveCaptureActive: () => Boolean(liveExportCapture && liveExportCapture.state !== 'inactive'),
      pauseAudio: () => audio.pause(),
      stopLiveCapture: () => liveExportCapture?.stop()
    });
  }

  async function cancelExport() {
    return exportCommandCoordinator.cancel({
      exporting: state.exporting,
      offlineRendering: state.offlineExporting,
      confirm: () => window.confirm('Cancel this export and permanently discard its temporary output?'),
      cancelling: ({ mode }) => {
        if (mode !== 'offline') exportController.setNote('Cancelling the export and discarding its temporary output.');
      },
      offlineCancelling: () => exportController.renderOfflineState('cancelling'),
      resumed: () => exportController.setPaused(false),
      abortOffline: (id) => window.quarticDesktop.abortOfflineExport(id),
      liveCaptureActive: () => Boolean(liveExportCapture && liveExportCapture.state !== 'inactive'),
      pauseAudio: () => audio.pause(),
      stopLiveCapture: () => liveExportCapture?.stop()
    });
  }

  function stopExport() {
    endAndFinishExport();
  }

  async function finishLiveExport() {
    return exportLiveLifecycle.finish().catch(() => {});
  }

  $('#loadButton').addEventListener('click', () => $('#audioInput').click());
  $('#useAudioSourceButton').addEventListener('click', () => useSelectedAudioSource().catch((error) => showToast(error.message, true)));
  $('#refreshAudioSourcesButton').addEventListener('click', () => refreshAllAudioDevices().catch((error) => showToast(error.message, true)));
  $('#audioSourceSelect').addEventListener('pointerdown', () => {
    if (!$('#audioOutputOptions').children.length) refreshWindowsOutputs({ silent: true }).catch(() => {});
  });
  $('#audioSourceSelect').addEventListener('change', () => {
    if (state.audioMode !== 'live') setAudioSourceStatus('READY', false);
  });
  $('#deckOutputSelect').addEventListener('change', (event) => {
    applyDeckOutput(event.target.value).catch((error) => {
      event.target.value = deckOutputDeviceId;
      showToast(`Playback output: ${error.message}`, true);
    });
  });
  $('#audioInput').addEventListener('change', async (event) => {
    await loadAudio(event.target.files[0]);
    event.target.value = '';
  });
  $('#playlistFilesButton').addEventListener('click', () => $('#playlistFilesInput').click());
  $('#playlistFolderButton').addEventListener('click', () => $('#playlistFolderInput').click());
  $('#playlistFilesInput').addEventListener('change', async (event) => {
    await addLocalFiles(event.target.files, { activate: state.playlistIndex < 0 });
    event.target.value = '';
  });
  $('#playlistFolderInput').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files).sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name));
    await addLocalFiles(files, { activate: state.playlistIndex < 0 });
    event.target.value = '';
  });
  $('#playlistPreviousButton').addEventListener('click', () => changePlaylistTrack(-1).catch((error) => showToast(error.message, true)));
  $('#playlistNextButton').addEventListener('click', () => changePlaylistTrack(1).catch((error) => showToast(error.message, true)));
  $('#playlistMoveUpButton').addEventListener('click', () => movePlaylistItem(-1));
  $('#playlistMoveDownButton').addEventListener('click', () => movePlaylistItem(1));
  $('#playlistRemoveButton').addEventListener('click', removeCurrentPlaylistItem);
  $('#playlistClearButton').addEventListener('click', clearPlaylist);
  audioController.bind();
  $('#frequencyColor').addEventListener('change', (event) => { state.frequencyColorEnabled = event.target.checked; });
  $('#frequencyColorAmount').addEventListener('input', (event) => {
    state.frequencyColorAmount = Number(event.target.value);
    $('#frequencyColorAmountValue').value = normalizedPercent('frequencyColorAmount', state.frequencyColorAmount);
  });
  $('#analysisSmoothing').addEventListener('input', (event) => {
    state.analysisSmoothing = Number(event.target.value);
    $('#analysisSmoothingValue').value = `${Math.round(state.analysisSmoothing * 100)}%`;
    if (analyser) analyser.smoothingTimeConstant = state.analysisSmoothing;
    setMusicPersonalityCustom();
  });
  $('#beatSensitivity').addEventListener('input', (event) => {
    state.beatSensitivity = Number(event.target.value);
    $('#beatSensitivityValue').value = `${Math.round(state.beatSensitivity * 100)}%`;
    resetBeatDetector({ keepTotal: true });
    setMusicPersonalityCustom();
  });
  $('#beatCooldown').addEventListener('input', (event) => {
    state.beatCooldownMs = Number(event.target.value);
    $('#beatCooldownValue').value = `${Math.round(state.beatCooldownMs)} ms`;
    state.beatCooldownRemaining = Math.min(state.beatCooldownRemaining, state.beatCooldownMs / 1000);
    setMusicPersonalityCustom();
  });
  $('#musicPersonality').addEventListener('change', (event) => applyMusicPersonality(event.target.value));
  $('#frequencyBandMode').addEventListener('change', (event) => {
    state.frequencyBandMode = event.target.value;
    setMusicPersonalityCustom({ preserveProfileBands: false });
    updateFrequencyBandUi();
  });
  ['frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling'].forEach((id) => {
    $(`#${id}`).addEventListener('input', (event) => {
      setMusicPersonalityCustom();
      setFrequencyBoundary(id, Number(event.target.value));
    });
  });
  $('#autoReactivity').addEventListener('change', (event) => {
    state.autoReactivity = event.target.checked;
    if (!state.autoReactivity) state.autoReactivityGain = 1;
    updateUiMeters();
  });
  audio.addEventListener('play', setPlayState);
  audio.addEventListener('pause', setPlayState);
  audio.addEventListener('ended', () => {
    setPlayState();
    if (state.exporting) stopExport();
    else if (currentPlaylistIndex() < state.playlist.length - 1) changePlaylistTrack(1, true).catch((error) => showToast(error.message, true));
  });
  audio.addEventListener('loadedmetadata', () => {
    updateUiMeters();
    coordinateExportSettingsChange('audio');
  });
  audio.addEventListener('error', () => {
    showToast('The local audio file could not be decoded.', true);
  });

  $('#iterations').addEventListener('input', (event) => {
    state.iterations = Number(event.target.value);
    $('#iterationsValue').value = state.iterations;
    coordinateExportSettingsChange('visual');
  });
  $('#visualStyle').addEventListener('change', (event) => {
    state.visualStyle = Number(event.target.value);
    document.body.dataset.visualStyle = String(state.visualStyle);
    updateVisualStyleOptions();
    coordinateExportSettingsChange('visual');
    showToast(`${visualCatalog.get(state.visualStyle).name} selected`);
  });
  $('#experiencePresetGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-experience-preset]');
    if (button) applyExperiencePreset(button.dataset.experiencePreset);
  });
  $('#showAdvancedControlsButton').addEventListener('click', () => {
    setInterfaceMode('advanced');
    showToast('Advanced controls enabled');
  });
  const visualStylePicker = $('#visualStylePicker');
  visualStylePicker.addEventListener('click', (event) => {
    const button = event.target.closest('[data-visual-style]');
    if (!button) return;
    const control = $('#visualStyle');
    if (control.value === button.dataset.visualStyle) return;
    control.value = button.dataset.visualStyle;
    control.dispatchEvent(new Event('change', { bubbles: true }));
  });
  visualStylePicker.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const buttons = [...visualStylePicker.querySelectorAll('[data-visual-style]')];
    const current = Math.max(0, buttons.indexOf(document.activeElement));
    const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
    const next = buttons[(current + direction + buttons.length) % buttons.length];
    event.preventDefault();
    next.focus();
    next.click();
  });
  $('#fractalType').addEventListener('change', (event) => {
    state.fractalType = Number(event.target.value);
    const preset = fractalPresets[state.fractalType] || fractalPresets[0];
    $('#formulaLabel').textContent = preset.formula;
    resetFractalView();
    if (state.interfaceMode === 'basic') applyFractalRecommendedPreset(preset);
    renderFractalLibrary();
    showToast(`${preset.name} selected${state.interfaceMode === 'basic' ? ' · recommended preset loaded' : ''}`);
  });
  $('#flow').addEventListener('input', (event) => {
    state.flow = Number(event.target.value);
    $('#flowValue').value = normalizedPercent('flow', state.flow);
  });
  ['coreCStrength', 'coreBiasReal', 'coreBiasImag'].forEach((id) => {
    $(`#${id}`).addEventListener('input', (event) => {
      state[id] = Number(event.target.value);
      $(`#${id}Value`).value = normalizedPercent(id, state[id]);
    });
  });
  $('#reactivity').addEventListener('input', (event) => {
    state.reactivity = Number(event.target.value);
    $('#reactivityValue').value = normalizedPercent('reactivity', state.reactivity);
  });
  $('#motion').addEventListener('input', (event) => {
    state.motion = Number(event.target.value);
    $('#motionValue').value = normalizedPercent('motion', state.motion);
  });
  $('#pulseDensity').addEventListener('input', (event) => {
    state.pulseDensity = Number(event.target.value);
    $('#pulseDensityValue').value = `${Math.round(state.pulseDensity * 100)}%`;
    if (state.pulseDensity === 0) state.pulseEvents.length = 0;
    else if (state.pulseEvents.length > activePulseEventLimit()) {
      state.pulseEvents.splice(0, state.pulseEvents.length - activePulseEventLimit());
    }
    markPulsePresetCustom();
  });
  $('#pulseSize').addEventListener('input', (event) => {
    state.pulseSize = Number(event.target.value);
    $('#pulseSizeValue').value = normalizedPercent('pulseSize', state.pulseSize);
    markPulsePresetCustom();
  });
  $('#pulseCooldown').addEventListener('input', (event) => {
    state.pulseCooldown = Number(event.target.value);
    $('#pulseCooldownValue').value = normalizedPercent('pulseCooldown', state.pulseCooldown);
    markPulsePresetCustom();
  });
  $('#pulseJagged').addEventListener('input', (event) => {
    state.pulseJagged = Number(event.target.value);
    $('#pulseJaggedValue').value = normalizedPercent('pulseJagged', state.pulseJagged);
    markPulsePresetCustom();
  });
  $('#pulseTrail').addEventListener('input', (event) => {
    state.pulseTrail = Number(event.target.value);
    $('#pulseTrailValue').value = normalizedPercent('pulseTrail', state.pulseTrail);
    markPulsePresetCustom();
  });
  $('#pulseDetail').addEventListener('input', (event) => {
    state.pulseDetail = Number(event.target.value);
    $('#pulseDetailValue').value = normalizedPercent('pulseDetail', state.pulseDetail);
    markPulsePresetCustom();
  });
  $('#pulsePresetGrid').addEventListener('click', (event) => {
    const button = event.target.closest('.pulse-preset');
    if (button) applyPulsePreset(button.dataset.pulsePreset);
  });
  $('#spin').addEventListener('input', (event) => {
    state.spin = Number(event.target.value);
    $('#spinValue').value = normalizedPercent('spin', state.spin);
  });
  $('#equationSmoothing').addEventListener('input', (event) => {
    state.equationSmoothing = Number(event.target.value);
    $('#equationSmoothingValue').value = normalizedPercent('equationSmoothing', state.equationSmoothing);
  });
  $('#equationMod').addEventListener('input', (event) => {
    state.equation = Number(event.target.value);
    $('#equationValue').value = normalizedPercent('equationMod', state.equation);
  });
  $('#adaptiveQuality').addEventListener('change', (event) => {
    state.adaptiveQuality = event.target.checked;
    if (!state.adaptiveQuality) state.performanceScale = 1;
  });
  $('#fractalDimensional').addEventListener('change', (event) => {
    state.fractalDimensional = event.target.checked;
    updateFractalDimensionalUi();
    if (state.fractalDimensional) showToast('Dimensional Rotation enabled · GPU intensive');
  });
  $('#equationFolding').addEventListener('change', (event) => {
    state.equationFolding = event.target.checked;
    updateEquationFoldingUi();
    if (state.equationFolding) showToast('Equation Fold & Warp enabled · GPU intensive');
  });
  $('#zoom').addEventListener('input', (event) => {
    state.zoom = Math.pow(10, Number(event.target.value) / 25 - .4);
    $('#zoomValue').value = `${state.zoom < 10 ? state.zoom.toFixed(2) : state.zoom.toFixed(0)}×`;
  });
  $('#beatPulse').addEventListener('change', (event) => { state.beatPulse = event.target.checked; });
  $('#autoDrift').addEventListener('change', (event) => { state.autoDrift = event.target.checked; });
  $('#paletteGrid').addEventListener('click', (event) => {
    const button = event.target.closest('.palette');
    if (!button) return;
    document.querySelectorAll('.palette').forEach((item) => item.classList.toggle('active', item === button));
    state.palette = Number(button.dataset.palette);
    $('#customPaletteEditor').hidden = state.palette !== 4;
  });

  workspaceShell.bindNavigation(activateTab);
  $('#showExportPreview').addEventListener('change', (event) => {
    if (state.exporting) document.body.classList.toggle('hide-export-preview', !event.target.checked);
  });
  const savedExportCompleteSound = localStorage.getItem('quarticPulseExportCompleteSound');
  if (savedExportCompleteSound !== null) $('#exportCompleteSound').checked = savedExportCompleteSound === 'true';
  $('#exportCompleteSound').addEventListener('change', (event) => {
    localStorage.setItem('quarticPulseExportCompleteSound', String(event.target.checked));
  });
  state.exportSupersampling = $('#exportSupersampling').checked;
  function updateExportHdrAvailability() {
    const available = exportController.readSettings().format === 'youtube_hdr';
    exportController.setHdrAvailability(available);
    return available;
  }
  $('#obsOutputButton').addEventListener('click', () => toggleObsOutput().catch((error) => showToast(`OBS output: ${error.message}`, true)));
  $('#obsResolution').addEventListener('change', () => applyObsWindowOptions().catch((error) => showToast(error.message, true)));
  $('#obsFps').addEventListener('change', () => applyObsWindowOptions().catch((error) => showToast(error.message, true)));
  $('#obsAlwaysOnTop').addEventListener('change', () => applyObsWindowOptions().catch((error) => showToast(error.message, true)));
  $('#obsChromaKey').addEventListener('change', (event) => {
    state.obsChromaKey = event.target.checked;
    updateObsChromaUi();
    if (state.obsChromaKey) showToast('Chroma-safe green screen enabled · subject greens are shifted away from the OBS key');
  });
  $('#obsChromaThreshold').addEventListener('input', (event) => {
    state.obsChromaThreshold = Number(event.target.value);
    $('#obsChromaThresholdValue').value = `${Math.round(state.obsChromaThreshold / .5 * 100)}%`;
  });

  function currentFractalDragTransform() {
    const modulation = combinedRenderModulation(state.modulationValues || {}, state.songDirectorValues || {});
    const motion = clamp(state.motion + (modulation.motion || 0), 0, 4);
    const zoom = Math.max(.15, 1 + (modulation.zoom || 0));
    const cameraMotion = cameraPresetTransform();
    const beat = state.beatPulse ? state.beat : 0;
    const breathing = Math.sin(state.visualTime * (.72 + .16 * state.mids)) * .012 * motion;
    const pulse = 1 - .105 * beat * motion - .026 * state.bass * motion + breathing;
    const motionEnergy = motion * (.32 + state.rms * .34 + state.mids * .26);
    const orbitRadius = state.autoDrift
      ? (.012 + .022 * state.mids) * motionEnergy / Math.sqrt(state.zoom * zoom)
      : 0;
    const orbitAngle = state.visualTime * (.21 + .12 * state.mids) * Math.sign(state.spin || 1);
    const depthAudio = 1 + state.fractalAudioDepth * (.22 * state.bass + .16 * state.mids + .12 * beat);
    const depthPhase = state.visualTime * state.fractalDepthSpeed
      * (.55 + .28 * state.mids * state.fractalAudioDepth);
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

  let dragDepth = 0;
  window.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragDepth += 1;
    $('#dropOverlay').classList.add('visible');
  });
  window.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragDepth -= 1;
    if (dragDepth <= 0) $('#dropOverlay').classList.remove('visible');
  });
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    dragDepth = 0;
    $('#dropOverlay').classList.remove('visible');
    addLocalFiles(event.dataTransfer.files, { activate: true }).catch((error) => showToast(error.message, true));
  });

  $('#exportButton').addEventListener('click', () => {
    if (state.exporting) endAndFinishExport();
    else startExport().catch((error) => showToast(error.message, true));
  });
  exportController.bind();
  $('#revealButton').addEventListener('click', () => {
    exportResultWorkflowEngine.reveal({
      reveal: (outputPath) => window.quarticDesktop.revealExport(outputPath),
      failed: ({ error }) => showToast(error?.message || String(error), true)
    }).catch(() => {});
  });

  window.addEventListener('keydown', (event) => {
    const focusedControl = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName);
    if (state.operatorMode && !focusedControl && !event.repeat) {
      if (event.code === 'Escape') {
        event.preventDefault();
        setPerformanceMode(false);
        return;
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        advanceShow(-1);
        return;
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        advanceShow(1);
        return;
      }
      if (event.code === 'KeyB') {
        event.preventDefault();
        setPerformanceBlackout(!state.performanceBlackout);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        $('#showPlayButton').click();
        return;
      }
    }
    if (event.code === 'Space' && !focusedControl) {
      event.preventDefault();
      togglePlayback().catch((error) => showToast(error.message, true));
    }
    if (event.code === 'KeyR' && !state.exporting) {
      resetFractalView();
    }
  });

  window.addEventListener('beforeunload', () => {
    stopLiveAudio({ restoreDeck: false });
    closeObsAutomation({ quiet: true });
    if (oscRunning) window.quarticDesktop.stopOsc();
  });
  window.quarticDesktop.onOutputAudio((bytes) => {
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
  });
  window.quarticDesktop.onOutputError((message) => {
    if (!nativeOutputActive) return;
    stopLiveAudio();
    showToast(`Windows output capture stopped: ${message}`, true);
  });
  window.quarticDesktop.onOutputStopped(() => {
    if (!nativeOutputActive) return;
    stopLiveAudio();
    showToast('The selected Windows output device stopped or was disconnected.', true);
  });
  navigator.mediaDevices?.addEventListener?.('devicechange', () => {
    refreshAudioInputs({ requestPermission: false, silent: true }).catch(() => {});
    refreshWindowsOutputs({ silent: true }).catch(() => {});
    refreshDeckOutputs({ silent: true }).catch(() => {});
  });

  bindCustomPalette();
  renderPlaylist();
  loadExportHistory();
  if (!isObsOutput) refreshRecoverableExports();
  initializeVisualEffectControls();
  visualCatalog.decorate();
  initializeFractalLibrary();
  initializeNumericSliders();
  initializeSettingTools();
  initializePaletteTools();
  initializeInterfaceMode();
  activateTab(document.querySelector('.tab-panel.active')?.dataset.tabPanel || 'music');
  initializeMusicPersonality();
  initializeSongMap();
  initializeSongDirector();
  updateFrequencyBandUi();
  updateVisualStyleOptions();
  updateFractalDimensionalUi();
  updateEquationFoldingUi();
  const normalizedStateControls = {
    frequencyColorAmount: 'frequencyColorAmount',
    beatSensitivity: 'beatSensitivity',
    flow: 'flow', reactivity: 'reactivity', motion: 'motion', spin: 'spin', equationSmoothing: 'equationSmoothing', equationMod: 'equation',
    coreCStrength: 'coreCStrength', coreBiasReal: 'coreBiasReal', coreBiasImag: 'coreBiasImag',
    pulseDensity: 'pulseDensity', pulseSize: 'pulseSize', pulseCooldown: 'pulseCooldown',
    pulseJagged: 'pulseJagged', pulseTrail: 'pulseTrail', pulseDetail: 'pulseDetail',
    bulbDetail: 'bulbDetail', bulbAudio: 'bulbAudio', bulbOrbit: 'bulbOrbit',
    bulbFold: 'bulbFold', bulbGlow: 'bulbGlow', bulbCamera: 'bulbCamera'
  };
  Object.entries(normalizedStateControls).forEach(([id, stateKey]) => {
    const outputId = id === 'equationMod' ? 'equationValue' : `${id}Value`;
    $(`#${outputId}`).value = normalizedPercent(id, state[stateKey]);
  });
  coordinateExportSettingsChange('initialize', { refreshEncoder: !isObsOutput });
  updateObsChromaUi();
  updateObsOutputUi(false);
  initializePanelResizer();
  if (!isObsOutput) {
    initializeModulationMatrix();
    initializeProfileManager();
    initializeShowSequencer();
    initializeShowComposer();
    initializePerformanceMode();
    initializePerformancePackages();
    initializeObsAutomation();
    initializeAdvancedOutput();
    initializeLiveControls();
    initializeCameraTools();
    initializeCreativeTools();
    initializePerformanceAssistant();
    initializeReportCenter();
    initializeSessionAutosave();
    refreshAudioInputs({ requestPermission: false, silent: true }).catch(() => {});
    refreshWindowsOutputs({ silent: true }).catch(() => {});
    refreshDeckOutputs({ silent: true }).catch(() => {});
    window.quarticDesktop.onObsOutputStatus(updateObsOutputUi);
    window.quarticDesktop.getObsOutputStatus().then(updateObsOutputUi).catch(() => {});
    initializeVisualSafety();
  }
  activateTab('music');
  requestAnimationFrame(render);
})();
