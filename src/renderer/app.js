(() => {
  'use strict';

  const pageParameters = new URLSearchParams(window.location.search);
  const isObsOutput = pageParameters.get('obs') === '1';
  const isSmokeTest = pageParameters.get('smoke') === '1';
  if (isObsOutput) {
    document.body.classList.add('obs-output');
    const obsDragStrip = document.createElement('div');
    obsDragStrip.className = 'obs-window-drag-strip';
    obsDragStrip.title = 'Drag to move the OBS output window';
    document.body.appendChild(obsDragStrip);
    document.title = 'Quartic Pulse — OBS Output';
  }

  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#fractalCanvas');
  const stage = $('#stage');
  const audio = $('#audio');
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    document.body.innerHTML = '<div style="padding:40px;font-family:Segoe UI;color:white">Quartic Pulse requires a WebGL2-capable graphics driver.</div>';
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
    uniform float uBulbDetail;
    uniform float uBulbAudio;
    uniform float uBulbOrbit;
    uniform float uBulbFold;
    uniform float uBulbGlow;
    uniform float uBulbCamera;
    uniform float uBulbYaw;
    uniform float uBulbPitch;
    uniform int uBulbSteps;
    uniform int uPulseEventCount;
    uniform float uPulseEventAge[16];
    uniform float uPulseEventStrength[16];
    uniform float uPulseEventBand[16];
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

    vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(6.2831853 * (c * t + d));
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
        return cosinePalette(t, vec3(.48,.42,.56), vec3(.52,.48,.50), vec3(1.0,.82,.64), vec3(.62,.12,.90));
      }
      if (uPalette == 1) {
        return cosinePalette(t, vec3(.52,.34,.23), vec3(.48,.42,.30), vec3(1.0,.88,.62), vec3(.02,.06,.12));
      }
      if (uPalette == 2) {
        return cosinePalette(t, vec3(.36,.52,.38), vec3(.34,.48,.40), vec3(.72,1.0,.68), vec3(.48,.08,.30));
      }
      if (uPalette == 3) {
        float mono = .12 + .88 * pow(.5 + .5 * cos(6.2831853 * t), 1.45);
        return vec3(mono * .88, mono * .93, mono);
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

    float mandelbulbDistance(vec3 point) {
      float audioPower = (.34 * uEquationBass + .20 * uEquationMids + .18 * uEquationBeat) * uBulbAudio;
      float power = clamp(uBulbPower + audioPower, 2.0, 10.0);
      float foldAmount = clamp(uBulbFold + (.10 * uEquationMids + .07 * uEquationBeat) * uBulbAudio, 0.0, 1.0);
      vec3 z = point;
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
        z = radiusPower * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + point;
        vec3 folded = abs(z) - vec3(.16 + .10 * sin(uTime * .21), .12, .18);
        z = mix(z, folded, foldAmount * .32);
      }
      return .5 * log(max(radius, 0.00001)) * radius / max(derivative, 0.00001);
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
      float angleBands = atan(point.y, point.x) / 6.2831853;
      float surfaceBands = length(point) * (.52 + .12 * uEquationHighs) + angleBands
        + uTime * uFlow * .018 + frequencyShift;
      vec3 surface = palette(surfaceBands);
      vec3 secondary = palette(surfaceBands + .31 + .08 * uEquationMids);
      vec3 color = surface * (.12 + diffuse * 1.05 + fill * .28) * occlusion;
      color += secondary * rim * (.18 + .42 * uBulbGlow + .12 * uEquationHighs);
      color += vec3(.88, .96, 1.0) * specular * (.22 + .75 * uBulbGlow);
      color += palette(surfaceBands + .58) * (.035 * uEquationBass + .055 * uEquationBeat) * uBulbAudio;
      float fog = 1.0 - exp(-travel * .045);
      return mix(color, background, fog);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - .5 * uResolution.xy) / uResolution.y;
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

      float trapAngle = uTime * (.12 + .12 * uEquationHighs) * uMotion;
      vec2 trapDir = vec2(cos(trapAngle), sin(trapAngle));
      vec2 equationMu = uEquation * vec2(
        (.070 * uEquationBass + .025 * uEquationBeat) * cos(uTime * .43),
        .060 * uEquationMids * sin(uTime * .59)
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

      vec2 screenUv = gl_FragCoord.xy / uResolution.xy;
      vec2 visualPoint = (gl_FragCoord.xy - .5 * uResolution.xy) / uResolution.y;
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
  for (const name of ['uResolution','uCenter','uScale','uTime','uBass','uMids','uHighs','uRms','uBeat','uFlow','uMotion','uFractalDimensional','uFractalTilt','uFractalDepthSpeed','uFractalPerspective','uFractalSlice','uFractalLighting','uFractalAudioDepth','uEquationFolding','uEquationFold','uEquationWarp','uEquationFoldMotion','uEquationFoldOffset','uEquationWarpScale','uEquationFoldAudio','uCoreCStrength','uCoreBias','uBarWidth','uBarGlow','uBarReflection','uBarMotion','uBarEcho','uBarGrid','uBarStyle','uRadialSize','uRadialGlow','uRadialWaves','uRadialTwist','uRadialSpokes','uRadialAtmosphere','uPulseJagged','uPulseTrail','uPulseDetail','uPulseSize','uPulseEventCount','uBulbPower','uBulbDetail','uBulbAudio','uBulbOrbit','uBulbFold','uBulbGlow','uBulbCamera','uBulbYaw','uBulbPitch','uBulbSteps','uRotation','uEquation','uFrequencyHue','uFrequencyColor','uFractalType','uVisualStyle','uCustom0','uCustom1','uCustom2','uCustom3','uIterations','uPalette','uChromaKey','uChromaThreshold']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  for (const name of ['uEquationBass','uEquationMids','uEquationHighs','uEquationBeat']) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  uniforms.uSpectrum = gl.getUniformLocation(program, 'uSpectrum[0]');
  uniforms.uWaveform = gl.getUniformLocation(program, 'uWaveform[0]');
  uniforms.uPulseEventAge = gl.getUniformLocation(program, 'uPulseEventAge[0]');
  uniforms.uPulseEventStrength = gl.getUniformLocation(program, 'uPulseEventStrength[0]');
  uniforms.uPulseEventBand = gl.getUniformLocation(program, 'uPulseEventBand[0]');

  const defaultFrequencyBands = Object.freeze({
    floor: 25,
    lowMid: 180,
    midHigh: 2400,
    ceiling: 12000
  });
  const maximumPulseEvents = 16;

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
    autoDrift: true,
    beatPulse: true,
    drag: null,
    lastFrame: performance.now(),
    audioName: '',
    playlist: [],
    playlistIndex: -1,
    playlistId: 0,
    audioMode: 'deck',
    liveAudioLabel: '',
    exportedPath: null,
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
    offlineFps: 60,
    nowPlayingEnabled: false,
    nowPlayingTitle: '',
    nowPlayingArtist: 'Tempest Mainframe',
    nowPlayingPosition: 'bottom-left',
    customColors: [
      [20 / 255, 15 / 255, 45 / 255],
      [123 / 255, 44 / 255, 1],
      [241 / 255, 75 / 255, 203 / 255],
      [92 / 255, 245 / 255, 220 / 255]
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
    'bass', 'mids', 'highs', 'rms', 'beat', 'autoDrift', 'beatPulse', 'obsChromaKey', 'obsChromaThreshold',
    'modulationEnabled', 'showTransitionBlack',
    'nowPlayingEnabled', 'nowPlayingTitle', 'nowPlayingArtist', 'nowPlayingPosition', 'cameraMotionPreset'
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
    obsRemoteAudioActive = Boolean(snapshot.audioActive);
    if (isObsOutput) {
      $('#showTransitionOverlay')?.classList.toggle('visible', Boolean(state.showTransitionBlack));
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
    equation: { label: 'Equation Modulation', scale: .35 },
    equationFold: { label: 'Equation Fold', scale: .75 },
    equationWarp: { label: 'Equation Warp', scale: 1.0 },
    fractalTilt: { label: 'Dimensional Tilt', scale: .7 },
    fractalSlice: { label: 'Dimensional Slice', scale: .7 },
    zoom: { label: 'Camera Zoom', scale: .45 },
    rotation: { label: 'Rotation', scale: .8 },
    frequencyHue: { label: 'Color Position', scale: .55 },
    flow: { label: 'Color Flow', scale: .55 },
    motion: { label: 'Visual Motion', scale: 1.0 },
    pulseJagged: { label: 'Pulse Jaggedness', scale: .9 },
    bulbPower: { label: '3D Fractal Power', scale: 1.5 },
    bulbFold: { label: '3D Volumetric Fold', scale: .7 },
    bulbGlow: { label: '3D Surface Glow', scale: 1.0 }
  });
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
      amount: clamp(finiteOr(values.amount, 35), -100, 100),
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
      storm: { label: 'Storm Fold', values: { bulbPower: 4.35, bulbDetail: .7, bulbAudio: 1, bulbOrbit: .42, bulbFold: .72, bulbGlow: 1.5, bulbCamera: 3.85 } },
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
    bulbPower: { defaultRange: 4, min: 2, max: 10, step: .1, decimals: 1, tip: 'The exponent used by the 3D Mandelbulb recurrence. Power 4 is the Quartic Pulse signature shape.' },
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
    obsChromaThreshold: { defaultRange: .08, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / .5 * 100, toRange: (value) => value / 100 * .5, tip: 'Higher values replace more dark pixels with pure key green. Chroma-safe mode automatically shifts green subject colors away from the OBS key.' }
    ,beatBpm: { defaultRange: 120, min: 60, max: 200, step: .1, decimals: 1, tip: 'Manual tempo used when Automatic BPM is off or has not found a reliable beat.' }
    ,beatOffset: { defaultRange: 0, min: -500, max: 500, step: 5, decimals: 0, tip: 'Moves the beat grid earlier or later in milliseconds so visual changes land on the music.' }
  };

  const selectSettingConfigs = {
    playbackRate: { defaultValue: '1', tip: 'Changes live playback and export speed while preserving pitch when supported.' },
    frequencyBandMode: { defaultValue: 'basic', tip: 'Basic uses the recommended frequency bands. Advanced enables custom continuous boundaries for low, mid, and high analysis.' },
    visualStyle: { defaultValue: '0', tip: 'Chooses the GPU-rendered visual composition. Every style uses the active palette and music analysis and is included in video exports.' },
    fractalType: { defaultValue: '0', tip: 'Selects the equation used for the live view and exported video.' },
    resolution: { defaultValue: '1920x1080', tip: 'Sets exported frame size. Higher resolutions require substantially more GPU work.' },
    fps: { defaultValue: '60', tip: 'Sets captured frames per second. 90 and 120 FPS require a fast GPU and storage.' },
    videoFormat: { defaultValue: 'mp4', tip: 'Offline export uses FFmpeg to combine exact video frames with the selected song.' },
    exportMode: { defaultValue: 'offline', tip: 'Offline completes every requested frame before advancing. Live records wall-clock playback and is available only in Unleashed mode.' },
    exportDetail: { defaultValue: '1.6', tip: 'Multiplies iteration detail during export without changing live preview quality.' },
    obsResolution: { defaultValue: '1920x1080', tip: 'Sets the exact client size of the clean window selected by OBS Window Capture.' },
    obsFps: { defaultValue: '60', tip: 'Sets how often the control window sends visual and music-analysis state to the OBS output.' }
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
    autoReactivity: true,
    adaptiveQuality: true,
    beatPulse: true,
    autoDrift: true,
    fractalDimensional: false,
    equationFolding: false,
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
  let frequencyData;
  let beatFrequencyData;
  let timeData;
  let mediaRecorder;
  let exportSession;
  let exportProgressHideTimer;
  let exportProgressOverall = 0;
  let liveExportCompleted = false;
  let appendQueue = Promise.resolve();
  let pendingOfflineRender = null;
  let offlineExportCancelled = false;
  let offlineExportFinishRequested = false;
  let offlineExportPaused = false;
  let liveExportCancelled = false;
  let exportStartedAt = 0;
  let exportPauseStartedAt = 0;
  let exportPausedDuration = 0;
  let lastExportPreflight = null;
  let toastTimer;
  const applyingEffectPreset = { fractal: false, fold: false, spectrum: false, radial: false, bulb: false };
  let applyingPulsePreset = false;

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
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    beatFrequencyData = new Uint8Array(beatAnalyser.frequencyBinCount);
    timeData = new Uint8Array(analyser.fftSize);
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

  function averageBand(lowHz, highHz) {
    if (!frequencyData || !audioContext) return 0;
    const nyquist = audioContext.sampleRate / 2;
    const low = Math.max(0, Math.floor(lowHz / nyquist * frequencyData.length));
    const high = Math.min(frequencyData.length - 1, Math.ceil(highHz / nyquist * frequencyData.length));
    let total = 0;
    for (let i = low; i <= high; i++) total += frequencyData[i];
    return total / Math.max(1, high - low + 1) / 255;
  }

  function averageBeatBand(lowHz, highHz) {
    if (!beatFrequencyData || !audioContext) return 0;
    const nyquist = audioContext.sampleRate / 2;
    const low = Math.max(0, Math.floor(lowHz / nyquist * beatFrequencyData.length));
    const high = Math.min(beatFrequencyData.length - 1, Math.ceil(highHz / nyquist * beatFrequencyData.length));
    let total = 0;
    for (let index = low; index <= high; index++) total += beatFrequencyData[index];
    return total / Math.max(1, high - low + 1) / 255;
  }

  function getActiveFrequencyBands() {
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
    resetBeatDetector();
  }

  function resetBeatDetector({ keepTotal = false } = {}) {
    state.beatFastEnvelope = 0;
    state.beatSlowEnvelope = 0;
    state.beatOnsetAverage = .008;
    state.beatCooldownRemaining = 0;
    state.beatDetectorArmed = true;
    if (!keepTotal) state.beatDetectedTotal = 0;
  }

  function updateAdaptiveBeatDetector(lowEnergy, lowMidEnergy, delta, { register = true } = {}) {
    const frameDelta = clamp(Number(delta) || 1 / 60, 1 / 240, .1);
    const sensitivity = clamp(Number(state.beatSensitivity) || 0, 0, 1);
    const energy = clamp(lowEnergy * .72 + lowMidEnergy * .28, 0, 1);
    const fastTime = energy > state.beatFastEnvelope ? .022 : .115;
    const slowTime = energy > state.beatSlowEnvelope ? .46 : .78;
    state.beatFastEnvelope += (energy - state.beatFastEnvelope) * (1 - Math.exp(-frameDelta / fastTime));
    state.beatSlowEnvelope += (energy - state.beatSlowEnvelope) * (1 - Math.exp(-frameDelta / slowTime));
    const onset = Math.max(0, state.beatFastEnvelope - state.beatSlowEnvelope);
    state.beatOnsetAverage += (onset - state.beatOnsetAverage) * (1 - Math.exp(-frameDelta / .68));
    state.beatCooldownRemaining = Math.max(0, state.beatCooldownRemaining - frameDelta);

    const minimumEnergy = .13 - sensitivity * .095;
    const thresholdFloor = .024 - sensitivity * .017;
    const adaptiveThreshold = thresholdFloor + state.beatOnsetAverage * (2.45 - sensitivity * 1.55);
    if (!state.beatDetectorArmed && (onset < adaptiveThreshold * .52 || energy < state.beatSlowEnvelope * 1.025)) {
      state.beatDetectorArmed = true;
    }
    const detectedBeat = state.beatDetectorArmed
      && state.beatCooldownRemaining <= 0
      && energy >= minimumEnergy
      && onset >= adaptiveThreshold;
    if (detectedBeat) {
      state.beatDetectorArmed = false;
      state.beatCooldownRemaining = clamp(Number(state.beatCooldownMs) || 150, 80, 300) / 1000;
      state.beatDetectedTotal += 1;
      if (register) registerDetectedBeat();
      if (state.beatPulse) state.beat = clamp(.28 + energy * .54 + onset * 3.2, .35, 1);
    } else state.beat *= Math.exp(-frameDelta / .105);
    window.__quarticPulseBeatDetectedTotal = state.beatDetectedTotal;
    window.__quarticPulseBeatEnergy = energy;
    window.__quarticPulseBeatOnset = onset;
    window.__quarticPulseBeatThreshold = adaptiveThreshold;
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
    state.pulseEvents.push({ age: 0, band: chosen.band, strength: chosen.intensity });
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
    if (!analyser || !audioIsActive()) {
      state.bass *= .94;
      state.mids *= .94;
      state.highs *= .94;
      state.rms *= .94;
      state.beat *= .86;
      for (let band = 0; band < 3; band++) state.pulsePreviousLevels[band] *= .94;
      for (let index = 0; index < 64; index++) {
        state.spectrumData[index] *= .94;
        state.waveformData[index] *= .88;
      }
      if (state.bass + state.mids + state.highs < .035) {
        state.dominantBand = 'silence';
        state.frequencyHue *= .97;
      }
      return;
    }
    analyser.getByteFrequencyData(frequencyData);
    beatAnalyser?.getByteFrequencyData(beatFrequencyData);
    analyser.getByteTimeDomainData(timeData);
    let squareSum = 0;
    for (const sample of timeData) {
      const normalized = (sample - 128) / 128;
      squareSum += normalized * normalized;
    }
    const rms = Math.sqrt(squareSum / timeData.length);
    const manualGain = state.reactivity;
    const bands = getActiveFrequencyBands();
    const rawBass = averageBand(bands.floor, bands.lowMid) * 1.6;
    const rawMids = averageBand(bands.lowMid, bands.midHigh) * 1.45;
    const rawHighs = averageBand(bands.midHigh, bands.ceiling) * 1.8;
    const rawPeak = Math.max(rawBass, rawMids, rawHighs);
    if (state.autoReactivity && rawPeak > .03) {
      const desiredGain = clamp(state.autoReactivityTarget / Math.max(.03, rawPeak * manualGain), .25, 3);
      const response = desiredGain < state.autoReactivityGain ? .18 : .015;
      state.autoReactivityGain += (desiredGain - state.autoReactivityGain) * response;
    } else if (!state.autoReactivity) {
      state.autoReactivityGain += (1 - state.autoReactivityGain) * .08;
    }
    const effectiveGain = manualGain * (state.autoReactivity ? state.autoReactivityGain : 1);
    const maximumLevel = state.autoReactivity ? .96 : 1;
    const spectrumFloor = 20;
    const spectrumCeiling = Math.min(20000, audioContext.sampleRate / 2);
    for (let index = 0; index < 64; index++) {
      const lowPosition = index / 64;
      const highPosition = (index + 1) / 64;
      const lowHz = spectrumFloor * Math.pow(spectrumCeiling / spectrumFloor, lowPosition);
      const highHz = spectrumFloor * Math.pow(spectrumCeiling / spectrumFloor, highPosition);
      const spectrumTarget = Math.min(maximumLevel, averageBand(lowHz, highHz) * 1.55 * effectiveGain);
      state.spectrumData[index] += (spectrumTarget - state.spectrumData[index]) * .22;
      const timeIndex = Math.min(timeData.length - 1, Math.round(index / 63 * (timeData.length - 1)));
      const waveformTarget = clamp((timeData[timeIndex] - 128) / 128 * effectiveGain, -1, 1);
      state.waveformData[index] += (waveformTarget - state.waveformData[index]) * .42;
    }
    const bass = Math.min(maximumLevel, rawBass * effectiveGain);
    const mids = Math.min(maximumLevel, rawMids * effectiveGain);
    const highs = Math.min(maximumLevel, rawHighs * effectiveGain);
    state.bass += (bass - state.bass) * .24;
    state.mids += (mids - state.mids) * .18;
    state.highs += (highs - state.highs) * .2;
    state.rms += (Math.min(maximumLevel, rms * 3.2 * effectiveGain) - state.rms) * .2;
    const colorEnergy = state.bass + state.mids + state.highs;
    if (colorEnergy > .035) {
      const targetHue = (state.bass * .06 + state.mids * .45 + state.highs * .88) / colorEnergy;
      const hueResponse = .04 + (1 - state.analysisSmoothing) * .28;
      state.frequencyHue += (targetHue - state.frequencyHue) * hueResponse;
      const strongest = Math.max(state.bass, state.mids, state.highs);
      state.dominantBand = strongest === state.bass ? 'bass' : (strongest === state.mids ? 'mids' : 'highs');
    } else state.dominantBand = 'silence';
    const beatLow = averageBeatBand(30, 190) * 1.35;
    const beatLowMid = averageBeatBand(150, 520) * 1.18;
    updateAdaptiveBeatDetector(beatLow, beatLowMid, delta);
    createMusicPulseEvents([bass, mids, highs]);
  }

  function updateEquationAudioEnvelope(delta) {
    const smoothing = clamp(Number(state.equationSmoothing) || 0, 0, 1);
    const smoothingCurve = smoothing * smoothing;
    const frameDelta = clamp(Number(delta) || 0, 1 / 240, .1);
    const shaped = (value) => Math.pow(clamp(Number(value) || 0, 0, 1), 1.45);
    const follow = (current, target, attackBase, releaseBase) => {
      const timeConstant = target > current
        ? attackBase + .32 * smoothingCurve
        : releaseBase + .58 * smoothingCurve;
      return current + (target - current) * (1 - Math.exp(-frameDelta / timeConstant));
    };
    state.equationBass = follow(state.equationBass, shaped(state.bass), .045, .12);
    state.equationMids = follow(state.equationMids, shaped(state.mids), .050, .14);
    state.equationHighs = follow(state.equationHighs, shaped(state.highs), .055, .16);
    state.equationBeat = follow(state.equationBeat, shaped(state.beat) * .55, .035, .18);
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

  function serializeShowEntry(entry) {
    return {
      id: entry.id,
      profileId: entry.profileId,
      advance: entry.advance === 'time' ? 'time' : 'beats',
      value: clamp(Math.round(Number(entry.value) || 1), 1, 3600),
      transition: entry.transition === 'cut' ? 'cut' : 'black'
    };
  }

  function persistShowSequence() {
    try {
      localStorage.setItem('quarticPulseShowSequenceV1', JSON.stringify({
        entries: state.showSequence.map(serializeShowEntry),
        loop: state.showLoop,
        shuffle: state.showShuffle,
        autoBpm: state.autoBpm,
        manualBpm: state.manualBpm,
        beatOffsetMs: state.beatOffsetMs
      }));
    } catch (_) { /* Show persistence is optional. */ }
  }

  function showProfileForEntry(entry) {
    return savedProfiles.find((profile) => profile.id === entry?.profileId) || null;
  }

  function resetShowEntryClock() {
    state.showEntryStartTime = beatClock();
    state.showEntryStartBeat = state.beatGridIndex;
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
    $('#showCurrentLabel').textContent = profile ? `${state.showIndex + 1}/${state.showSequence.length} · ${profile.name}` : 'Nothing queued';
    document.querySelectorAll('.show-entry').forEach((element) => {
      element.classList.toggle('active', Number(element.dataset.index) === state.showIndex);
    });
  }

  function applyShowEntry(index, forceCut = false) {
    if (!state.showSequence.length || state.showTransitioning) return;
    const safeIndex = ((index % state.showSequence.length) + state.showSequence.length) % state.showSequence.length;
    const entry = state.showSequence[safeIndex];
    const profile = showProfileForEntry(entry);
    if (!profile) return;
    const finish = () => {
      state.showIndex = safeIndex;
      applySavedProfile(profile);
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
    if (state.showShuffle && state.showSequence.length > 1 && direction > 0) {
      let next = state.showIndex;
      while (next === state.showIndex) next = Math.floor(Math.random() * state.showSequence.length);
      applyShowEntry(next);
      return;
    }
    const next = state.showIndex + direction;
    if (next >= state.showSequence.length && !state.showLoop) {
      state.showPlaying = false;
      updateShowUi();
      return;
    }
    applyShowEntry(next);
  }

  function updateShowSequencer(beatChanged) {
    if (!state.showPlaying || state.showIndex < 0 || state.showTransitioning) return;
    const entry = state.showSequence[state.showIndex];
    if (!entry) return;
    let progress = 0;
    if (entry.advance === 'time') progress = (beatClock() - state.showEntryStartTime) / entry.value;
    else progress = (state.beatGridIndex - state.showEntryStartBeat + state.beatGridPhase) / entry.value;
    $('#showProgressFill').style.width = `${clamp(progress * 100, 0, 100)}%`;
    if (progress >= 1 && (entry.advance === 'time' || beatChanged)) advanceShow(1);
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

  function render(now) {
    const rawDelta = Math.max(0, (now - state.lastFrame) / 1000);
    if (state.offlineExporting && !pendingOfflineRender) {
      state.lastFrame = now;
      requestAnimationFrame(render);
      return;
    }
    const delta = state.offlineExporting ? 1 / state.offlineFps : Math.min(.05, rawDelta);
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
    advancePulseEvents(delta);
    if (!isObsOutput && !state.offlineExporting) updateAudioAnalysis(delta);
    updateEquationAudioEnvelope(delta);

    if (!state.offlineExporting) state.visualTime = state.exporting
      ? audio.currentTime
      : state.visualTime + delta * ((isObsOutput ? obsRemoteAudioActive : audioIsActive()) ? 1 : .18);
    const modulation = updateAudioModulation(delta);
    const cameraMotion = cameraPresetTransform();
    const beatChanged = (isObsOutput || state.offlineExporting) ? false : updateBeatGrid();
    if (!isObsOutput && !state.offlineExporting) updateShowSequencer(beatChanged);
    if (!isObsOutput && !state.offlineExporting && obsOutputOpen && now - obsLastStateSent >= 1000 / obsSyncFps) {
      window.quarticDesktop.publishObsVisualState(createObsVisualSnapshot());
      obsLastStateSent = now;
    }
    const modulatedMotion = clamp(state.motion + (modulation.motion || 0), 0, 4);
    const modulatedZoom = Math.max(.15, 1 + (modulation.zoom || 0));
    const motionEnergy = modulatedMotion * (.32 + state.rms * .34 + state.mids * .26);
    const orbitRadius = state.autoDrift ? (.012 + .022 * state.mids) * motionEnergy / Math.sqrt(state.zoom * modulatedZoom) : 0;
    const orbitAngle = state.visualTime * (.21 + .12 * state.mids) * Math.sign(state.spin || 1);
    const renderCenterX = state.center.x + Math.cos(orbitAngle) * orbitRadius + cameraMotion.x;
    const renderCenterY = state.center.y + Math.sin(orbitAngle * 1.17) * orbitRadius + cameraMotion.y;
    if (!isObsOutput) {
      const nextModulationRotationPhase = state.modulationRotationPhase + (modulation.rotation || 0) * delta;
      state.modulationRotationPhase = Math.atan2(Math.sin(nextModulationRotationPhase), Math.cos(nextModulationRotationPhase));
    }
    const rotation = state.visualTime * state.spin * modulatedMotion
      + Math.sin(state.visualTime * .63) * .035 * state.mids * modulatedMotion
      + state.modulationRotationPhase;
    if (Number.isFinite(window.__quarticPulseRotation)) {
      const rotationDelta = Math.atan2(Math.sin(rotation - window.__quarticPulseRotation), Math.cos(rotation - window.__quarticPulseRotation));
      window.__quarticPulseMaxRotationStep = Math.max(Number(window.__quarticPulseMaxRotationStep || 0), Math.abs(rotationDelta));
    }
    window.__quarticPulseRotation = rotation;

    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.uCenter, renderCenterX, renderCenterY);
    gl.uniform1f(uniforms.uScale, 3.15 / (state.zoom * modulatedZoom * cameraMotion.zoom));
    gl.uniform1f(uniforms.uTime, state.visualTime);
    gl.uniform1f(uniforms.uBass, state.bass);
    gl.uniform1f(uniforms.uMids, state.mids);
    gl.uniform1f(uniforms.uHighs, state.highs);
    gl.uniform1f(uniforms.uRms, state.rms);
    gl.uniform1f(uniforms.uBeat, state.beatPulse ? state.beat : 0);
    gl.uniform1f(uniforms.uEquationBass, state.equationBass);
    gl.uniform1f(uniforms.uEquationMids, state.equationMids);
    gl.uniform1f(uniforms.uEquationHighs, state.equationHighs);
    gl.uniform1f(uniforms.uEquationBeat, state.beatPulse ? state.equationBeat : 0);
    gl.uniform1f(uniforms.uFlow, clamp(state.flow + (modulation.flow || 0), 0, 2));
    gl.uniform1f(uniforms.uMotion, modulatedMotion);
    gl.uniform1f(uniforms.uFractalDimensional, state.fractalDimensional ? 1 : 0);
    gl.uniform1f(uniforms.uFractalTilt, clamp(state.fractalTilt + (modulation.fractalTilt || 0), 0, 2));
    gl.uniform1f(uniforms.uFractalDepthSpeed, state.fractalDepthSpeed);
    gl.uniform1f(uniforms.uFractalPerspective, state.fractalPerspective);
    gl.uniform1f(uniforms.uFractalSlice, clamp(state.fractalSlice + (modulation.fractalSlice || 0), 0, 2));
    gl.uniform1f(uniforms.uFractalLighting, state.fractalLighting);
    gl.uniform1f(uniforms.uFractalAudioDepth, state.fractalAudioDepth);
    gl.uniform1f(uniforms.uEquationFolding, state.equationFolding ? 1 : 0);
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
    gl.uniform1f(uniforms.uBulbPower, clamp(state.bulbPower + (modulation.bulbPower || 0), 2, 10));
    gl.uniform1f(uniforms.uBulbDetail, state.bulbDetail);
    gl.uniform1f(uniforms.uBulbAudio, state.bulbAudio);
    gl.uniform1f(uniforms.uBulbOrbit, state.bulbOrbit);
    gl.uniform1f(uniforms.uBulbFold, clamp(state.bulbFold + (modulation.bulbFold || 0), 0, 1));
    gl.uniform1f(uniforms.uBulbGlow, clamp(state.bulbGlow + (modulation.bulbGlow || 0), 0, 2));
    gl.uniform1f(uniforms.uBulbCamera, state.bulbCamera);
    gl.uniform1f(uniforms.uBulbYaw, state.bulbYaw);
    gl.uniform1f(uniforms.uBulbPitch, state.bulbPitch);
    let bulbSteps = 42 + state.bulbDetail * 54;
    if (state.exporting) bulbSteps *= 1.12 + Math.min(2.5, state.exportDetail) * .32;
    else bulbSteps *= (.74 + state.performanceScale * .26) * state.bulbLiveBudget * (state.unleashedMode ? 1.24 : 1);
    gl.uniform1i(uniforms.uBulbSteps, Math.min(state.unleashedMode || state.exporting ? 192 : 112, Math.max(36, Math.round(bulbSteps))));
    state.pulseEventAges.fill(-1);
    state.pulseEventStrengths.fill(0);
    state.pulseEventBands.fill(0);
    const pulseEventCount = Math.min(maximumPulseEvents, state.pulseEvents.length);
    for (let index = 0; index < pulseEventCount; index++) {
      const event = state.pulseEvents[index];
      state.pulseEventAges[index] = event.age;
      state.pulseEventStrengths[index] = event.strength;
      state.pulseEventBands[index] = event.band;
    }
    gl.uniform1i(uniforms.uPulseEventCount, pulseEventCount);
    gl.uniform1fv(uniforms.uPulseEventAge, state.pulseEventAges);
    gl.uniform1fv(uniforms.uPulseEventStrength, state.pulseEventStrengths);
    gl.uniform1fv(uniforms.uPulseEventBand, state.pulseEventBands);
    window.__quarticPulseEventCount = pulseEventCount;
    window.__quarticPulseEventLimit = activePulseEventLimit();
    window.__quarticPulseAcceptedTotal = state.pulseAcceptedTotal;
    gl.uniform1f(uniforms.uRotation, rotation);
    gl.uniform1f(uniforms.uEquation, clamp(state.equation + (modulation.equation || 0), 0, 2.5));
    gl.uniform1f(uniforms.uFrequencyHue, state.frequencyHue + (modulation.frequencyHue || 0));
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
    gl.uniform1i(uniforms.uIterations, Math.min(state.unleashedMode ? 2400 : 1200, Math.round(state.iterations * detailMultiplier)));
    gl.uniform1i(uniforms.uPalette, state.palette);
    gl.uniform1f(uniforms.uChromaKey, isObsOutput && state.obsChromaKey ? 1 : 0);
    gl.uniform1f(uniforms.uChromaThreshold, state.obsChromaThreshold);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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
      ? `Target 74% · ${state.autoReactivityGain.toFixed(2)}× gain`
      : 'Manual sensitivity only';
    $('#frequencyColorMarker').style.left = `${Math.max(0, Math.min(100, state.frequencyHue * 100))}%`;
    $('#dominantFrequencyValue').textContent = state.dominantBand.toUpperCase();
    updateModulationUiMeters();
    updateBeatGridUi();
    updateCameraUi();
    updatePerformanceAssistantUi();
    updateVisualIntensityMeter();
    if (state.audioMode === 'deck' && Number.isFinite(audio.duration)) {
      const offlineSessionActive = state.exporting && exportSession?.mode === 'offline';
      const displayTime = offlineSessionActive ? (state.offlineCurrentTime || 0) : audio.currentTime;
      const progress = audio.duration ? displayTime / audio.duration : 0;
      $('#timelineFill').style.width = `${Math.min(100, progress * 100)}%`;
      $('#timeReadout').textContent = `${formatTime(displayTime)} / ${formatTime(audio.duration)}`;
      const liveRecordingActive = state.exporting
        && exportSession?.mode === 'live'
        && mediaRecorder?.state === 'recording';
      if (liveRecordingActive) {
        $('#exportProgressFill').style.width = `${progress * 100}%`;
        $('#exportProgressText').textContent = `Rendering ${Math.round(progress * 100)}% · ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        $('#stageRenderFill').style.width = `${progress * 100}%`;
        $('#stageRenderText').textContent = `Rendering ${Math.round(progress * 100)}%`;
        const overall = progress * .80;
        setExportProgress(
          overall,
          `Live recording ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}% | ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`,
          `Live recording ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}%`
        );
      }
    }
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
    const score = clamp(
      reactivity * .26 + motion * .18 + equation * .21 + folding * .16 + color * .08 + liveEnergy * .11 + beatWeight,
      0,
      1
    );
    const percent = Math.round(score * 100);
    let level = 'calm';
    let label = 'CALM';
    let description = 'Current motion and audio response are unlikely to create rapid flashes.';
    if (score >= .68) {
      level = 'intense';
      label = 'INTENSE';
      description = 'Strong motion or rapid color/math changes are active. Consider Low Flash for sensitive viewers.';
    } else if (score >= .38) {
      level = 'active';
      label = 'ACTIVE';
      description = 'Moderate movement and music response are active; review before streaming to a broad audience.';
    }
    card.dataset.level = level;
    $('#visualIntensityLabel').textContent = `${label} · ${percent}%`;
    $('#visualIntensityFill').style.width = `${Math.max(3, percent)}%`;
    $('#visualIntensityText').textContent = description;
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

  function setExportProgress(overall, panelText, stageText = panelText) {
    exportProgressOverall = clamp(Number(overall) || 0, 0, 1);
    const percent = exportProgressOverall >= 1 ? 100 : Math.min(99, Math.floor(exportProgressOverall * 100));
    $('#exportProgressFill').style.width = `${exportProgressOverall * 100}%`;
    $('#exportProgressText').textContent = panelText;
    $('#stageRenderFill').style.width = `${exportProgressOverall * 100}%`;
    $('#stageRenderText').textContent = stageText || `Exporting ${percent}%`;
    if (exportStartedAt) {
      const now = performance.now();
      const paused = exportPausedDuration + (exportPauseStartedAt ? now - exportPauseStartedAt : 0);
      const elapsedSeconds = Math.max(0, (now - exportStartedAt - paused) / 1000);
      if (offlineExportPaused) $('#stageRenderMeta').textContent = `Paused · elapsed ${formatTime(elapsedSeconds)}`;
      else if (exportProgressOverall > .01 && exportProgressOverall < .995) {
        const remainingSeconds = elapsedSeconds * (1 - exportProgressOverall) / exportProgressOverall;
        $('#stageRenderMeta').textContent = `Elapsed ${formatTime(elapsedSeconds)} · estimated remaining ${formatTime(remainingSeconds)}`;
      } else $('#stageRenderMeta').textContent = `Elapsed ${formatTime(elapsedSeconds)}`;
    }
  }

  function beginExportProgress(panelText, stageText = panelText) {
    clearTimeout(exportProgressHideTimer);
    exportStartedAt = performance.now();
    exportPauseStartedAt = 0;
    exportPausedDuration = 0;
    $('#exportProgress').hidden = false;
    setExportProgress(0, panelText, stageText);
  }

  function setStageExportMode(mode) {
    const offline = mode === 'offline';
    $('#stageRenderMode').textContent = offline ? 'OFFLINE MASTER EXPORT' : 'LIVE VIDEO EXPORT';
    $('#stageRenderNote').textContent = offline
      ? 'Every frame is being completed independently for maximum detail and consistency.'
      : 'Quartic Pulse is recording in real time. Keep the visualizer running until the track finishes.';
    $('#pauseExportButton').hidden = !offline;
    $('#pauseExportButton').disabled = !offline;
    $('#pauseExportButton').textContent = 'PAUSE';
    setExportActionButtons(true, true);
  }

  function setExportActionButtons(endEnabled, cancelEnabled) {
    $('#endExportButton').disabled = !endEnabled;
    $('#cancelExportButton').disabled = !cancelEnabled;
    if (!$('#pauseExportButton').hidden) $('#pauseExportButton').disabled = !endEnabled;
  }

  function completeExportProgress(outputPath) {
    setExportProgress(1, `Saved 100% | ${exportedFileName(outputPath)}`, 'Export saved 100%');
    $('#stageRenderNote').textContent = 'The finished video has been saved successfully.';
    const elapsedSeconds = exportStartedAt ? Math.max(0, (performance.now() - exportStartedAt - exportPausedDuration) / 1000) : 0;
    $('#stageRenderMeta').textContent = `Completed in ${formatTime(elapsedSeconds)}`;
    setExportActionButtons(false, false);
    playExportCompleteStinger();
    clearTimeout(exportProgressHideTimer);
    exportProgressHideTimer = setTimeout(() => {
      if (!state.exporting) $('#exportProgress').hidden = true;
    }, 2200);
  }

  function playExportCompleteStinger() {
    if (!$('#exportCompleteSound')?.checked) return;
    const stinger = $('#exportCompleteStinger');
    if (!stinger) return;
    stinger.pause();
    stinger.currentTime = 0;
    stinger.volume = 0.7;
    const playback = stinger.play();
    playback?.catch?.((error) => console.warn('Export completion stinger could not play:', error));
  }

  window.quarticDesktop.onExportProgress?.((update) => {
    if (!update || !exportSession || update.id !== exportSession.id) return;
    const phaseProgress = clamp(Number(update.progress) || 0, 0, 1);
    const renderShare = exportSession.mode === 'offline' ? .85 : .80;
    let overall;
    let phaseLabel;
    if (update.stage === 'saving') {
      const start = Math.max(renderShare, exportProgressOverall);
      overall = start + (.995 - start) * phaseProgress;
      phaseLabel = `Saving ${Math.round(phaseProgress * 100)}%`;
    } else {
      overall = renderShare + (.99 - renderShare) * phaseProgress;
      phaseLabel = `Finalizing ${Math.round(phaseProgress * 100)}%`;
    }
    const overallPercent = overall >= 1 ? 100 : Math.min(99, Math.floor(overall * 100));
    const detail = String(update.message || phaseLabel).replace(/\.{3}$/, '');
    $('#stageRenderNote').textContent = update.stage === 'saving'
      ? 'The completed video is being written to the selected destination.'
      : 'All visual frames are complete; audio and the final video container are being finished.';
    setExportProgress(overall, `${phaseLabel} | overall ${overallPercent}% | ${detail}`, `${phaseLabel} | overall ${overallPercent}%`);
  });

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

  function updateExportPerformanceNote() {
    const [width, height] = $('#resolution').value.split('x').map(Number);
    const fps = Number($('#fps').value);
    const detail = Number($('#exportDetail').value);
    const note = $('#exportPerformanceNote');
    const load = width * height * fps;
    const offline = $('#exportMode')?.value !== 'live';
    const masterMbps = Math.round(offlineVideoBitrate(width, height, fps, detail) / 1000000);
    let message = offline
      ? `Offline · ${width}×${height} at ${fps} FPS · ~${masterMbps} Mb/s quality master`
      : `Live · ${width}×${height} at ${fps} FPS · real-time frame rate required`;
    let warning = false;
    if (load >= 3840 * 2160 * 90) {
      message = offline
        ? `Offline · ${width}×${height} at ${fps} FPS · ~${masterMbps} Mb/s master · extreme load`
        : `Live · ${width}×${height} at ${fps} FPS · extreme GPU and storage load`;
      warning = true;
    } else if (load >= 2560 * 1440 * 60) {
      message = offline
        ? `Offline · ${width}×${height} at ${fps} FPS · ~${masterMbps} Mb/s master · high load`
        : `Live · ${width}×${height} at ${fps} FPS · high GPU load`;
      warning = true;
    } else if (load <= 1280 * 720 * 30) {
      message = offline
        ? `Offline · ${width}×${height} at ${fps} FPS · ~${masterMbps} Mb/s master · light load`
        : `Live · ${width}×${height} at ${fps} FPS · light export load`;
    }
    note.textContent = message;
    note.classList.toggle('warning', warning);
  }

  function formatByteSize(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value >= 1073741824) return `${(value / 1073741824).toFixed(value >= 10737418240 ? 1 : 2)} GB`;
    if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
    return `${Math.round(value / 1024)} KB`;
  }

  async function requestExportPreflight(durationOverride = null, refreshEncoder = false) {
    const [width, height] = $('#resolution').value.split('x').map(Number);
    const fps = Number($('#fps').value);
    const detail = Number($('#exportDetail').value);
    const mode = $('#exportMode').value;
    const duration = Math.max(.1, Number(durationOverride) || Number(audio.duration) || 0);
    const masterBitrate = offlineVideoBitrate(width, height, fps, detail);
    const result = await window.quarticDesktop.getExportPreflight({
      width, height, fps, detail, mode, duration, masterBitrate,
      format: $('#videoFormat').value,
      refreshEncoder
    });
    return { ...result, width, height, fps, detail, mode, duration, masterBitrate };
  }

  function updateEncoderStatus(preflight) {
    if (!preflight?.encoder) return;
    const status = $('#exportEncoderStatus');
    status.classList.add('ready');
    status.querySelector('strong').textContent = preflight.encoder.label.toUpperCase();
    status.querySelector('small').textContent = preflight.encoder.hardware
      ? 'Hardware acceleration verified; CPU x264 remains available as an automatic fallback'
      : 'Universal CPU fallback selected for compatibility and consistent quality';
  }

  function populateExportPreflight(preflight) {
    $('#preflightVideo').textContent = `${preflight.width}×${preflight.height} · ${preflight.fps} FPS · ${$('#videoFormat').value.toUpperCase()}`;
    $('#preflightEncoder').textContent = preflight.encoder.label;
    $('#preflightOutput').textContent = `About ${formatByteSize(preflight.estimatedOutputBytes)}`;
    $('#preflightSpace').textContent = formatByteSize(preflight.requiredBytes);
    $('#preflightFree').textContent = preflight.freeBytes ? `${formatByteSize(preflight.freeBytes)} · Videos drive` : 'Checked after destination selection';
    $('#preflightDuration').textContent = formatTime(preflight.duration);
    $('#exportPreflightSummary').textContent = preflight.mode === 'offline'
      ? 'Exact-frame rendering with a high-quality master and verified final encoder.'
      : 'Real-time capture requires Quartic Pulse to maintain the selected frame rate.';
    const lowSpace = preflight.freeBytes > 0 && preflight.freeBytes < preflight.requiredBytes;
    $('#preflightWarning').hidden = !lowSpace;
    $('#preflightWarning').textContent = lowSpace
      ? 'The default Videos drive may not have enough space. Choose another destination when prompted.'
      : '';
    $('#preflightTestButton').disabled = state.audioMode !== 'deck' || !currentPlaylistItem()?.filePath;
    updateEncoderStatus(preflight);
  }

  async function showExportPreflight() {
    const dialog = $('#exportPreflightDialog');
    $('#exportPreflightSummary').textContent = 'Testing encoders and estimating storage…';
    dialog.hidden = false;
    const preflight = await requestExportPreflight();
    lastExportPreflight = preflight;
    populateExportPreflight(preflight);
    return new Promise((resolve) => {
      const close = (choice) => {
        dialog.hidden = true;
        resolve(choice);
      };
      $('#preflightCancelButton').onclick = () => close(null);
      $('#preflightStartButton').onclick = () => close({ preflight, test: false });
      $('#preflightTestButton').onclick = async () => {
        $('#preflightTestButton').disabled = true;
        try {
          const testPreflight = await requestExportPreflight(Math.min(5, preflight.duration));
          close({ preflight: testPreflight, test: true });
        } catch (error) {
          $('#preflightTestButton').disabled = false;
          showToast(error.message, true);
        }
      };
    });
  }

  async function refreshExportEncoderStatus() {
    try {
      updateEncoderStatus(await requestExportPreflight(1));
    } catch (error) {
      const status = $('#exportEncoderStatus');
      status.querySelector('strong').textContent = 'ENCODER CHECK FAILED';
      status.querySelector('small').textContent = error.message;
    }
  }

  const exportHistoryStorageKey = 'quarticPulseExportHistoryV1';
  let exportHistory = [];

  function loadExportHistory() {
    try {
      const stored = JSON.parse(localStorage.getItem(exportHistoryStorageKey) || '[]');
      exportHistory = Array.isArray(stored) ? stored.slice(0, 30) : [];
    } catch (_) { exportHistory = []; }
    renderExportHistory();
  }

  function renderExportHistory() {
    const list = $('#exportHistoryList');
    list.replaceChildren();
    if (!exportHistory.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No completed exports yet.';
      list.appendChild(empty);
      return;
    }
    for (const entry of exportHistory.slice(0, 12)) {
      const row = document.createElement('div');
      row.className = 'export-history-entry';
      const details = document.createElement('div');
      const name = document.createElement('strong');
      const meta = document.createElement('small');
      name.textContent = exportedFileName(entry.outputPath);
      meta.textContent = `${String(entry.mode || 'offline').toUpperCase()} · ${entry.width || '?'}×${entry.height || '?'} · ${entry.fps || '?'} FPS · ${formatByteSize(entry.sizeBytes)} · ${entry.encoderLabel || 'encoder unknown'}`;
      details.append(name, meta);
      const actions = document.createElement('div');
      actions.className = 'export-entry-actions';
      for (const [action, label] of [['open', 'OPEN'], ['reveal', 'FOLDER']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.exportAction = action;
        button.dataset.exportId = entry.id;
        button.textContent = label;
        actions.appendChild(button);
      }
      row.append(details, actions);
      list.appendChild(row);
    }
  }

  function recordExportResult(result, details = {}) {
    if (!result?.outputPath) return;
    const [width, height] = $('#resolution').value.split('x').map(Number);
    const entry = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      outputPath: result.outputPath,
      sizeBytes: Number(result.sizeBytes) || 0,
      encoderLabel: result.encoderLabel || details.encoderLabel || '',
      mode: details.mode || exportSession?.mode || 'offline',
      width: details.width || width,
      height: details.height || height,
      fps: details.fps || Number($('#fps').value),
      duration: details.duration || 0,
      partial: Boolean(result.partial),
      recovered: Boolean(result.recovered)
    };
    exportHistory.unshift(entry);
    exportHistory = exportHistory.slice(0, 30);
    localStorage.setItem(exportHistoryStorageKey, JSON.stringify(exportHistory));
    renderExportHistory();
  }

  async function refreshRecoverableExports() {
    const recoveries = await window.quarticDesktop.getRecoverableExports().catch(() => []);
    const card = $('#exportRecoveryCard');
    const list = $('#exportRecoveryList');
    list.replaceChildren();
    card.hidden = !recoveries.length;
    for (const entry of recoveries) {
      const row = document.createElement('div');
      row.className = 'export-recovery-entry';
      const details = document.createElement('div');
      const name = document.createElement('strong');
      const meta = document.createElement('small');
      name.textContent = exportedFileName(entry.outputPath);
      meta.textContent = `${entry.width}×${entry.height} · ${entry.fps} FPS · ${entry.encodedFrames || 0} saved frames · ${formatByteSize(entry.tempBytes)}`;
      details.append(name, meta);
      const actions = document.createElement('div');
      actions.className = 'export-entry-actions';
      for (const [action, label] of [['recover', 'FINISH'], ['discard', 'DISCARD']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.recoveryAction = action;
        button.dataset.recoveryId = entry.id;
        button.textContent = label;
        actions.appendChild(button);
      }
      row.append(details, actions);
      list.appendChild(row);
    }
  }

  async function recoverInterruptedExport(id) {
    state.exporting = true;
    exportSession = { id, mode: 'offline' };
    document.body.classList.add('exporting', 'hide-export-preview');
    setStageExportMode('offline');
    setExportActionButtons(false, false);
    beginExportProgress('Recovering interrupted export | overall 0%', 'Inspecting saved frames…');
    $('#stageRenderNote').textContent = 'Quartic Pulse is validating the saved master and finishing the interrupted video.';
    try {
      const result = await window.quarticDesktop.recoverExport(id);
      recordExportResult(result, { mode: 'recovered' });
      completeExportProgress(result.outputPath);
      $('#revealButton').hidden = false;
      state.exportedPath = result.outputPath;
      showToast(`Recovered export complete: ${result.outputPath}`);
    } finally {
      state.exporting = false;
      exportSession = null;
      document.body.classList.remove('exporting', 'hide-export-preview');
      await refreshRecoverableExports();
    }
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
  let quickCaptureActive = false;
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
    if (quickCaptureActive || state.exporting) return showToast('A recording is already active.', true);
    const duration = clamp(Number($('#quickClipDuration').value) || 10, 5, 15);
    const session = await window.quarticDesktop.beginExport({ suggestedName: `${state.audioName || 'Quartic-Pulse'}-clip`, format: 'mp4' });
    if (!session) return;
    let recorder;
    let captureStream;
    let progressTimer;
    try {
      createAudioGraph();
      await audioContext.resume();
      const canvasStream = canvas.captureStream(60);
      captureStream = new MediaStream([...canvasStream.getVideoTracks(), ...recordingDestination.stream.getAudioTracks()]);
      recorder = new MediaRecorder(captureStream, { mimeType: chooseRecorderType(), videoBitsPerSecond: Math.round(canvas.width * canvas.height * 60 * .1) });
      let queue = Promise.resolve();
      quickCaptureActive = true;
      $('#quickCaptureStatus').textContent = `RECORDING ${duration}s`;
      $('#captureClipButton').disabled = true;
      const startedAt = performance.now();
      progressTimer = setInterval(() => {
        $('#quickCaptureProgress').style.width = `${clamp((performance.now() - startedAt) / (duration * 10), 0, 100)}%`;
      }, 100);
      recorder.addEventListener('dataavailable', (event) => {
        if (!event.data.size) return;
        queue = queue.then(async () => window.quarticDesktop.appendExport(session.id, await event.data.arrayBuffer()));
      });
      await new Promise((resolve, reject) => {
        recorder.addEventListener('error', (event) => reject(event.error || new Error('Quick recorder failed.')), { once: true });
        recorder.addEventListener('stop', resolve, { once: true });
        recorder.start(1000);
        setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), duration * 1000);
      });
      clearInterval(progressTimer);
      await queue;
      const result = await window.quarticDesktop.finishExport(session.id);
      $('#quickCaptureProgress').style.width = '100%';
      $('#quickCaptureStatus').textContent = 'SAVED';
      showToast(result.warning || `Quick clip saved: ${result.outputPath}`, Boolean(result.warning));
    } catch (error) {
      if (recorder?.state !== 'inactive') recorder.stop();
      await window.quarticDesktop.abortExport(session.id).catch(() => {});
      $('#quickCaptureStatus').textContent = 'FAILED';
      throw error;
    } finally {
      clearInterval(progressTimer);
      quickCaptureActive = false;
      captureStream?.getVideoTracks().forEach((track) => track.stop());
      $('#captureClipButton').disabled = false;
      setTimeout(() => { if (!quickCaptureActive) $('#quickCaptureProgress').style.width = '0%'; }, 1200);
    }
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
    const liveOption = $('#exportMode').querySelector('option[value="live"]');
    liveOption.disabled = !state.unleashedMode;
    if (!state.unleashedMode) {
      if (Number($('#iterations').value) > 500) {
        $('#iterations').value = '500';
        $('#iterations').dispatchEvent(new Event('input', { bubbles: true }));
        $('#iterations')._syncNumericValue?.();
      }
      if (Number($('#exportDetail').value) > 2.3) $('#exportDetail').value = '2.3';
      if ($('#exportMode').value === 'live') $('#exportMode').value = 'offline';
    }
    updateExportPerformanceNote();
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

  function activateTab(tabName) {
    if (tabName === 'live') tabName = 'show';
    const musicTabNames = ['music', 'playlist', 'frequency-color'];
    const appearanceTabNames = ['appearance', 'reactivity', 'dimensional', 'folding', 'mapping'];
    const liveTabNames = ['show', 'controls', 'camera', 'tools'];
    if (state.interfaceMode === 'basic' && ['reactivity', 'dimensional', 'folding', 'mapping'].includes(tabName)) {
      tabName = 'appearance';
    }
    const inMusicGroup = musicTabNames.includes(tabName);
    const inAppearanceGroup = appearanceTabNames.includes(tabName);
    const inLiveGroup = liveTabNames.includes(tabName);
    document.body.classList.toggle('appearance-active', inAppearanceGroup);
    const topLevelTab = inMusicGroup ? 'music' : (inAppearanceGroup ? 'appearance' : (inLiveGroup ? 'live' : tabName));
    document.querySelectorAll('.settings-tab').forEach((button) => {
      const active = button.dataset.tab === topLevelTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const musicSubtabs = document.querySelector('.music-subtabs');
    musicSubtabs.hidden = !inMusicGroup;
    document.querySelectorAll('.music-subtab').forEach((button) => {
      const active = inMusicGroup && button.dataset.musicTab === tabName;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const appearanceSubtabs = document.querySelector('.appearance-subtabs');
    appearanceSubtabs.hidden = !inAppearanceGroup;
    document.querySelectorAll('.appearance-subtab').forEach((button) => {
      const active = inAppearanceGroup && button.dataset.appearanceTab === tabName;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const liveSubtabs = document.querySelector('.live-subtabs');
    liveSubtabs.hidden = !inLiveGroup;
    document.querySelectorAll('.live-subtab').forEach((button) => {
      const active = inLiveGroup && button.dataset.liveTab === tabName;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const active = panel.dataset.tabPanel === tabName;
      panel.classList.toggle('active', active);
      if (active) panel.scrollTop = 0;
    });
  }

  function updateVisualStyleOptions() {
    const names = ['Fractal', 'Spectrum Bars', 'Radial Spectrum', 'Pulse Rings', 'Waveform Field', '3D Mandelbulb'];
    document.querySelectorAll('[data-visual-style]').forEach((button) => {
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
    $('#formulaLabel').textContent = state.visualStyle === 5 ? 'POWER-4 · 3D DE' : (conventional ? names[state.visualStyle].toUpperCase() : preset.formula);
  }

  const interfaceModeStorageKey = 'quarticPulseInterfaceModeV1';

  function setInterfaceMode(requestedMode, persist = true) {
    const mode = requestedMode === 'advanced' ? 'advanced' : 'basic';
    state.interfaceMode = mode;
    document.body.dataset.interfaceMode = mode;
    document.querySelectorAll('[data-interface-mode]').forEach((button) => {
      const active = button.dataset.interfaceMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('#interfaceModeDescription').textContent = mode === 'advanced'
      ? 'Fine tuning, equation controls, and music mapping'
      : 'Visuals, presets, colors, and quick controls';
    const basic = mode === 'basic';
    document.querySelectorAll('.advanced-ui-only, .advanced-ui-control').forEach((element) => {
      element.hidden = basic;
      if (basic && element.matches('details')) element.open = false;
    });
    if (basic && document.querySelector('.tab-panel.active')?.dataset.tabPanel !== 'appearance'
      && ['reactivity', 'dimensional', 'folding', 'mapping'].includes(document.querySelector('.tab-panel.active')?.dataset.tabPanel)) {
      activateTab('appearance');
    }
    if (persist) {
      try { localStorage.setItem(interfaceModeStorageKey, mode); } catch (_) { /* Storage is optional. */ }
    }
  }

  function initializeInterfaceMode() {
    let mode = 'basic';
    try { mode = localStorage.getItem(interfaceModeStorageKey) || mode; } catch (_) { /* Use Basic mode. */ }
    setInterfaceMode(mode, false);
    document.querySelector('.interface-mode-switch').addEventListener('click', (event) => {
      const button = event.target.closest('[data-interface-mode]');
      if (!button || button.dataset.interfaceMode === state.interfaceMode) return;
      setInterfaceMode(button.dataset.interfaceMode);
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
    return id === 'bulbPower' ? Number(rangeValue).toFixed(1) : normalizedPercent(id, rangeValue);
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
    showToast('Waveform Field quick controls reset');
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
      const defaults = [[20, 15, 45], [123, 44, 255], [241, 75, 203], [92, 245, 220]];
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
    'iterations', 'resolution', 'fps', 'videoFormat', 'exportDetail', 'showExportPreview', 'exportCompleteSound',
    'obsResolution', 'obsFps', 'obsAlwaysOnTop', 'obsChromaKey', 'obsChromaThreshold'
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
    return Boolean(profile
      && typeof profile === 'object'
      && typeof profile.name === 'string'
      && ['colors', 'settings'].includes(profile.kind)
      && profile.data
      && typeof profile.data === 'object');
  }

  function loadSavedProfiles() {
    try {
      const parsed = JSON.parse(localStorage.getItem(profileStorageKey) || '[]');
      savedProfiles = Array.isArray(parsed) ? parsed.filter(validProfile).slice(0, 100) : [];
    } catch (_) {
      savedProfiles = [];
    }
  }

  function persistSavedProfiles() {
    localStorage.setItem(profileStorageKey, JSON.stringify(savedProfiles));
  }

  function setProfileStatus(message) {
    $('#profileStatus').textContent = message;
  }

  function selectedSavedProfile() {
    const id = $('#savedProfileSelect').value;
    return savedProfiles.find((profile) => profile.id === id) || null;
  }

  function renderSavedProfiles(preferredId = '') {
    const select = $('#savedProfileSelect');
    const previousId = preferredId || select.value;
    const query = $('#profileSearch')?.value.trim().toLowerCase() || '';
    const visibleProfiles = savedProfiles
      .filter((profile) => !query || profile.name.toLowerCase().includes(query) || profile.kind.includes(query))
      .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    select.replaceChildren();
    if (!visibleProfiles.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = query ? 'No matching profiles' : 'No saved profiles';
      select.appendChild(option);
    } else {
      for (const profile of visibleProfiles) {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = `${profile.favorite ? '★ ' : ''}${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`;
        select.appendChild(option);
      }
      select.value = visibleProfiles.some((profile) => profile.id === previousId) ? previousId : visibleProfiles[0].id;
    }
    const hasSelection = Boolean(selectedSavedProfile());
    $('#applyProfileButton').disabled = !hasSelection;
    $('#favoriteProfileButton').disabled = !hasSelection;
    $('#deleteProfileButton').disabled = !hasSelection;
    $('#exportProfileButton').disabled = !hasSelection;
    if (hasSelection) {
      const profile = selectedSavedProfile();
      $('#favoriteProfileButton').textContent = `${profile.favorite ? '★' : '☆'} FAVORITE`;
      setProfileStatus(`${profile.kind === 'colors' ? 'Color Palette' : 'Full Visual Settings'} · saved ${new Date(profile.updatedAt || profile.createdAt).toLocaleString()}`);
    } else {
      $('#favoriteProfileButton').textContent = '☆ FAVORITE';
      setProfileStatus(query ? 'No saved profile matches this search.' : 'Profiles are saved locally as JSON-compatible data.');
    }
    renderShowProfileOptions();
    renderObsProfileOptions();
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
    const visualNames = ['Fractal', 'Spectrum Bars', 'Radial Spectrum', 'Pulse Rings', 'Waveform Field', '3D Mandelbulb'];
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19).replaceAll(':', '-');
    $('#profileName').value = `${visualNames[state.visualStyle] || visualNames[0]} · ${stamp}`.slice(0, 60);
    $('#profileKind').value = 'settings';
    saveCurrentProfile();
  }

  async function exportSelectedProfile() {
    const profile = selectedSavedProfile();
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

  function initializeProfileManager() {
    loadSavedProfiles();
    renderSavedProfiles();
    $('#profileSearch').addEventListener('input', () => renderSavedProfiles());
    $('#savedProfileSelect').addEventListener('change', () => renderSavedProfiles($('#savedProfileSelect').value));
    $('#saveProfileButton').addEventListener('click', () => {
      try { saveCurrentProfile(); }
      catch (error) { showToast(`Profile could not be saved: ${error.message}`, true); }
    });
    $('#quickSaveProfileButton').addEventListener('click', () => {
      try { quickSaveCurrentVisualProfile(); }
      catch (error) { showToast(`Preset could not be saved: ${error.message}`, true); }
    });
    $('#resetActiveVisualButton').addEventListener('click', resetActiveVisual);
    $('#applyProfileButton').addEventListener('click', () => {
      try { applySavedProfile(selectedSavedProfile()); }
      catch (error) { showToast(error.message, true); }
    });
    $('#favoriteProfileButton').addEventListener('click', () => {
      const profile = selectedSavedProfile();
      if (!profile) return;
      profile.favorite = !profile.favorite;
      profile.updatedAt = new Date().toISOString();
      persistSavedProfiles();
      renderSavedProfiles(profile.id);
    });
    $('#deleteProfileButton').addEventListener('click', () => {
      const profile = selectedSavedProfile();
      if (!profile || !window.confirm(`Delete the saved profile "${profile.name}"?`)) return;
      savedProfiles = savedProfiles.filter((item) => item.id !== profile.id);
      persistSavedProfiles();
      renderSavedProfiles();
      showToast(`${profile.name} deleted`);
    });
    $('#exportProfileButton').addEventListener('click', () => exportSelectedProfile().catch((error) => showToast(error.message, true)));
    $('#importProfileButton').addEventListener('click', () => $('#importProfileInput').click());
    $('#importProfileInput').addEventListener('change', async (event) => {
      try { await importProfileFile(event.target.files[0]); }
      catch (error) { showToast(`Import failed: ${error.message}`, true); }
      finally { event.target.value = ''; }
    });
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
      showToast('Previous Quartic Pulse session restored');
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
        ${modulationControlMarkup('AMOUNT (− / +)', 'amount', mapping.amount, -100, 100, 35, 'Negative values reverse the source response. Positive values add to the target.')}
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
      amount: [-100, 100], attack: [0, 100], release: [0, 100], floor: [0, 99], ceiling: [1, 100]
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
      if (selectField === 'target' && Object.hasOwn(modulationTargets, event.target.value)) mapping.target = event.target.value;
      const title = event.target.closest('.modulation-route').querySelector('.modulation-route-title');
      title.textContent = `${modulationSources[mapping.source].label} → ${modulationTargets[mapping.target].label}`;
      persistModulationMatrix();
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
        <div class="show-entry-body" data-show-action="select" tabindex="0"><strong>${profile?.name || 'Missing profile'}</strong><small>${entry.advance === 'time' ? `${entry.value} seconds` : `${entry.value} beats`} · ${entry.transition === 'cut' ? 'Cut' : 'Fade through black'}</small></div>
        <button type="button" data-show-action="up" title="Move up">↑</button>
        <button type="button" data-show-action="down" title="Move down">↓</button>
        <button type="button" data-show-action="delete" title="Remove">×</button>`;
      list.appendChild(element);
    });
    $('#showSequenceEmpty').hidden = state.showSequence.length > 0;
    updateShowUi();
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
    try {
      const stored = JSON.parse(localStorage.getItem('quarticPulseShowSequenceV1') || 'null');
      if (stored && typeof stored === 'object') {
        state.showSequence = Array.isArray(stored.entries)
          ? stored.entries.slice(0, 100).map((entry) => ({ ...serializeShowEntry(entry), id: String(entry.id || crypto.randomUUID?.() || Date.now()) }))
          : [];
        state.showLoop = stored.loop !== false;
        state.showShuffle = Boolean(stored.shuffle);
        state.autoBpm = stored.autoBpm !== false;
        state.manualBpm = clamp(Number(stored.manualBpm) || 120, 60, 200);
        state.beatOffsetMs = clamp(Math.round(Number(stored.beatOffsetMs) || 0), -500, 500);
      }
    } catch (_) {
      state.showSequence = [];
    }
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
    $('#timeReadout').textContent = Number.isFinite(audio.duration)
      ? `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
      : '00:00 / 00:00';
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
    $('#timelineFill').style.width = '100%';
    $('#timeReadout').textContent = 'LIVE';
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
    $('#timelineFill').style.width = '100%';
    $('#timeReadout').textContent = 'LIVE';
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

  async function refreshAllAudioDevices() {
    const [outputs, inputs] = await Promise.all([
      refreshWindowsOutputs({ silent: true }),
      refreshAudioInputs({ requestPermission: true, silent: true })
    ]);
    showToast(`${outputs} playback endpoints and ${inputs} input devices found`);
  }

  function currentPlaylistItem() {
    return state.playlist[state.playlistIndex] || null;
  }

  function updateTrackControls() {
    const hasTrack = Boolean(currentPlaylistItem());
    const deckAvailable = hasTrack && state.audioMode === 'deck';
    $('#playButton').disabled = !deckAvailable;
    $('#restartButton').disabled = !deckAvailable;
    $('#skipBackButton').disabled = !deckAvailable;
    $('#skipForwardButton').disabled = !deckAvailable;
    $('#exportButton').disabled = !hasTrack;
    updateNowPlayingOverlay();
  }

  function updatePlaylistControls() {
    const count = state.playlist.length;
    const selected = state.playlistIndex >= 0 && state.playlistIndex < count;
    $('#playlistCount').textContent = `${count} ${count === 1 ? 'TRACK' : 'TRACKS'}`;
    $('#playlistEmpty').hidden = count > 0;
    $('#playlistCurrentLabel').textContent = selected ? `SELECTED ${state.playlistIndex + 1} / ${count}` : 'NOTHING SELECTED';
    $('#playlistPreviousButton').disabled = !selected || state.playlistIndex <= 0 || state.exporting;
    $('#playlistNextButton').disabled = !selected || state.playlistIndex >= count - 1 || state.exporting;
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
      button.className = `playlist-item${index === state.playlistIndex ? ' active' : ''}`;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === state.playlistIndex));
      number.className = 'playlist-item-index';
      number.textContent = String(index + 1).padStart(2, '0');
      copy.className = 'playlist-item-copy';
      title.textContent = item.name;
      meta.textContent = item.meta;
      copy.append(title, meta);
      kind.className = 'playlist-item-kind';
      kind.textContent = 'FILE';
      button.append(number, copy, kind);
      button.addEventListener('click', () => selectPlaylistIndex(index, false).catch((error) => showToast(error.message, true)));
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
    resetPulseEvents();
    state.playlistIndex = index;
    state.audioName = item.name;
    audio.src = item.source;
    audio.load();
    $('#trackName').textContent = item.name;
    $('#trackMeta').textContent = item.meta;
    $('#timelineFill').style.width = '0%';
    $('#timeReadout').textContent = '00:00 / 00:00';
    $('#revealButton').hidden = true;
    updateTrackControls();
    renderPlaylist();
    showToast(`${item.name} selected`);
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
  }

  async function removeCurrentPlaylistItem() {
    const index = state.playlistIndex;
    if (index < 0 || state.exporting) return;
    const [removed] = state.playlist.splice(index, 1);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    URL.revokeObjectURL(removed.source);
    state.playlistIndex = -1;
    if (state.playlist.length) await selectPlaylistIndex(Math.min(index, state.playlist.length - 1), false);
    else resetAudioDeck();
    renderPlaylist();
  }

  function resetAudioDeck() {
    resetPulseEvents();
    state.audioName = '';
    $('#trackName').textContent = 'No audio loaded';
    $('#trackMeta').textContent = 'Drop songs anywhere, choose files, or choose a local folder';
    $('#timelineFill').style.width = '0%';
    $('#timeReadout').textContent = '00:00 / 00:00';
    updateTrackControls();
    setPlayState();
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
    resetAudioDeck();
    renderPlaylist();
    showToast('Playlist cleared');
  }

  async function changePlaylistTrack(direction, forcePlay = false) {
    const nextIndex = state.playlistIndex + direction;
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
    document.body.classList.toggle('playing', playing);
    $('#playIcon').textContent = deckPlaying ? 'Ⅱ' : '▶';
    $('#playButton').setAttribute('aria-label', deckPlaying ? 'Pause' : 'Play');
    if (!state.exporting) {
      $('#liveDot').className = `live-dot${playing ? ' playing' : ''}`;
      $('#liveLabel').textContent = liveInput ? 'LISTENING' : (playing ? 'LIVE' : 'IDLE');
    }
  }

  function chooseRecorderType() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
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
      const rawBass = averageHz(bands.floor, bands.lowMid) * 1.6;
      const rawMids = averageHz(bands.lowMid, bands.midHigh) * 1.45;
      const rawHighs = averageHz(bands.midHigh, bands.ceiling) * 1.8;
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

  function offlineVideoBitrate(width, height, fps, detail = 1.6) {
    const bitsPerPixel = detail >= 3 ? 1.2 : (detail >= 2 ? .95 : (detail >= 1.5 ? .72 : .5));
    return Math.round(clamp(width * height * fps * bitsPerPixel, 12000000, 420000000));
  }

  async function chooseOfflineEncoderConfig(width, height, fps, detail) {
    if (!window.VideoEncoder || !window.VideoFrame) throw new Error('This graphics driver does not expose the offline video encoder.');
    const bitrate = offlineVideoBitrate(width, height, fps, detail);
    const candidates = [
      { codecName: 'vp9', codec: 'vp09.00.10.08', hardwareAcceleration: 'prefer-software' },
      { codecName: 'vp9', codec: 'vp09.00.10.08', hardwareAcceleration: 'prefer-hardware' },
      { codecName: 'vp8', codec: 'vp8', hardwareAcceleration: 'prefer-software' },
      { codecName: 'vp8', codec: 'vp8', hardwareAcceleration: 'prefer-hardware' }
    ];
    for (const candidate of candidates) {
      const config = {
        codec: candidate.codec,
        width,
        height,
        framerate: fps,
        bitrate,
        bitrateMode: 'variable',
        latencyMode: 'quality',
        hardwareAcceleration: candidate.hardwareAcceleration
      };
      try {
        const support = await VideoEncoder.isConfigSupported(config);
        if (support.supported) return { codecName: candidate.codecName, config: support.config || config, bitrate };
      } catch (_) { /* Try the next encoder. */ }
    }
    throw new Error(`No offline VP9/VP8 encoder supports ${width}×${height} at ${fps} FPS.`);
  }

  function requestOfflineVisualFrame() {
    if (pendingOfflineRender) return Promise.reject(new Error('The previous offline frame is still rendering.'));
    return new Promise((resolve) => { pendingOfflineRender = resolve; });
  }

  async function startOfflineExport(options = {}) {
    const item = currentPlaylistItem();
    if (!item?.file || !item.filePath) throw new Error('Offline export requires a local song file. Reload the song if it was added by an older session.');
    if (state.audioMode !== 'deck') stopLiveAudio();
    audio.pause();
    const [width, height] = $('#resolution').value.split('x').map(Number);
    const fps = Number($('#fps').value);
    const format = $('#videoFormat').value;
    const exportDetail = Number($('#exportDetail').value);
    $('#exportLabel').textContent = 'PREPARING OFFLINE AUDIO…';
    $('#exportButton').disabled = true;
    createAudioGraph();
    const audioBuffer = await audioContext.decodeAudioData((await item.file.arrayBuffer()).slice(0));
    const duration = Math.min(audioBuffer.duration, Math.max(.1, Number(options.durationLimit) || audioBuffer.duration));
    const frameCount = Math.max(1, Math.ceil(duration * fps));
    const encoderChoice = await chooseOfflineEncoderConfig(width, height, fps, exportDetail);
    const session = await window.quarticDesktop.beginOfflineExport({
      suggestedName: `${state.audioName || 'quartic-pulse'}${options.test ? '-5-second-test' : ''}`,
      format, width, height, fps, frameCount,
      codec: encoderChoice.codecName, audioPath: item.filePath,
      requiredBytes: options.preflight?.requiredBytes,
      finalEncoder: options.preflight?.encoder?.id
    });
    if (!session) {
      $('#exportButton').disabled = false;
      $('#exportLabel').textContent = 'EXPORT VIDEO';
      return;
    }

    exportSession = session;
    exportSession.mode = 'offline';
    state.loopBeforeExport = audio.loop;
    const previousVisualTime = state.visualTime;
    const previousModulationRotationPhase = state.modulationRotationPhase;
    let encoder = null;
    let encoderError = null;
    let encodedQueue = Promise.resolve();
    let exportCompleted = false;
    let renderedFrameCount = 0;
    offlineExportCancelled = false;
    offlineExportFinishRequested = false;
    offlineExportPaused = false;
    try {
      state.exportWidth = width;
      state.exportHeight = height;
      state.exportDetail = exportDetail;
      state.offlineFps = fps;
      state.offlineExporting = true;
      state.exporting = true;
      state.visualTime = 0;
      state.modulationRotationPhase = 0;
      state.autoReactivityGain = 1;
      resetPulseEvents();
      state.spectrumData.fill(0);
      state.waveformData.fill(0);
      renderPlaylist();
      document.body.classList.add('exporting');
      document.body.classList.toggle('hide-export-preview', !$('#showExportPreview').checked);
      state.exportedPath = null;
      setStageExportMode('offline');
      beginExportProgress(`Rendering frames 0 / ${frameCount} | overall 0%`, 'Rendering frames 0% | overall 0%');
      $('#revealButton').hidden = true;
      $('#exportButton').disabled = false;
      $('#exportButton').classList.add('recording');
      $('#exportLabel').textContent = 'END & FINISH';
      $('#exportIcon').textContent = '■';
      for (const id of ['resolution', 'fps', 'videoFormat', 'exportDetail', 'exportMode']) $(`#${id}`).disabled = true;
      $('#unleashedMode').disabled = true;
      $('#performanceMode').disabled = true;
      $('#liveDot').className = 'live-dot recording';
      $('#liveLabel').textContent = 'OFFLINE RENDER';
      setCanvasSize();
      const analyzeFrame = createOfflineAudioAnalyzer(audioBuffer, fps);
      encoder = new VideoEncoder({
        output: (chunk) => {
          const bytes = new Uint8Array(chunk.byteLength);
          chunk.copyTo(bytes);
          encodedQueue = encodedQueue.then(() => window.quarticDesktop.appendOfflineFrame(session.id, bytes));
        },
        error: (error) => { encoderError = error; }
      });
      encoder.configure(encoderChoice.config);
      setExportProgress(
        0,
        `Quality master ready | ${Math.round(encoderChoice.bitrate / 1000000)} Mb/s | rendering frames next`,
        `Quality master ready | ${Math.round(encoderChoice.bitrate / 1000000)} Mb/s`
      );

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        if (offlineExportCancelled) throw new DOMException('Offline export cancelled.', 'AbortError');
        if (offlineExportFinishRequested && frameIndex > 0) break;
        while (offlineExportPaused && !offlineExportCancelled && !offlineExportFinishRequested) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (offlineExportCancelled) throw new DOMException('Offline export cancelled.', 'AbortError');
        if (offlineExportFinishRequested && frameIndex > 0) break;
        if (encoderError) throw encoderError;
        const time = frameIndex / fps;
        state.offlineCurrentTime = time;
        state.visualTime = time;
        analyzeFrame(time);
        await requestOfflineVisualFrame();
        const videoFrame = new VideoFrame(canvas, {
          timestamp: Math.round(time * 1000000),
          duration: Math.round(1000000 / fps),
          alpha: 'discard'
        });
        encoder.encode(videoFrame, { keyFrame: frameIndex % Math.max(1, fps * 2) === 0 });
        videoFrame.close();
        renderedFrameCount = frameIndex + 1;
        if (encoder.encodeQueueSize > 5) {
          await encoder.flush();
          await encodedQueue;
        }
        const progress = (frameIndex + 1) / frameCount;
        if (frameIndex % Math.max(1, Math.floor(fps / 5)) === 0 || frameIndex + 1 === frameCount) {
          $('#exportProgressFill').style.width = `${progress * 100}%`;
          $('#exportProgressText').textContent = `Offline frame ${frameIndex + 1} / ${frameCount} · ${Math.round(progress * 100)}%`;
          $('#stageRenderFill').style.width = `${progress * 100}%`;
          $('#stageRenderText').textContent = `Offline rendering ${Math.round(progress * 100)}%`;
          const overall = progress * .80;
          setExportProgress(
            overall,
            `Rendering frames ${frameIndex + 1} / ${frameCount} | render ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}%`,
            `Rendering frames ${Math.round(progress * 100)}% | overall ${Math.round(overall * 100)}%`
          );
        }
      }
      setExportProgress(.80, 'Frames rendered | flushing the video encoder | overall 80%', 'Frames rendered | flushing encoder | overall 80%');
      await encoder.flush();
      encoder.close();
      encoder = null;
      await encodedQueue;
      if (offlineExportCancelled) throw new DOMException('Offline export cancelled.', 'AbortError');
      setExportProgress(.85, 'Encoded frames written | preparing final video | overall 85%', 'Encoded frames written | finalizing next | overall 85%');
      state.offlineExporting = false;
      setExportActionButtons(false, true);
      $('#exportLabel').textContent = offlineExportFinishRequested ? 'FINISHING SHORT EXPORT…' : 'MUXING AUDIO…';
      $('#exportButton').disabled = true;
      setExportProgress(.85, 'Frames complete | finalizing and saving | overall 85%', 'Frames complete | finalizing 0% | overall 85%');
      const result = await window.quarticDesktop.finishOfflineExport(session.id, {
        allowPartial: offlineExportFinishRequested,
        renderedFrameCount
      });
      state.exportedPath = result.outputPath;
      exportCompleted = true;
      recordExportResult(result, { mode: options.test ? 'test' : 'offline', width, height, fps, duration: renderedFrameCount / fps });
      completeExportProgress(result.outputPath);
      exportSession = null;
      $('#revealButton').hidden = false;
      showToast(result.warning || `${result.partial ? 'Shortened export' : 'Offline export'} complete: ${result.outputPath}`, Boolean(result.warning));
    } catch (error) {
      if (encoder && encoder.state !== 'closed') encoder.close();
      await encodedQueue.catch(() => {});
      pendingOfflineRender = null;
      if (exportSession?.id) await window.quarticDesktop.abortOfflineExport(exportSession.id).catch(() => {});
      exportSession = null;
      if (error.name === 'AbortError' || offlineExportCancelled) showToast('Offline export cancelled and temporary files discarded');
      else throw error;
    } finally {
      state.offlineExporting = false;
      state.exporting = false;
      state.visualTime = previousVisualTime;
      state.modulationRotationPhase = previousModulationRotationPhase;
      offlineExportCancelled = false;
      offlineExportFinishRequested = false;
      offlineExportPaused = false;
      exportPauseStartedAt = 0;
      resetPulseEvents();
      document.body.classList.remove('exporting', 'hide-export-preview');
      $('#exportButton').classList.remove('recording');
      $('#exportButton').disabled = false;
      $('#exportLabel').textContent = 'EXPORT VIDEO';
      $('#exportIcon').textContent = '●';
      for (const id of ['resolution', 'fps', 'videoFormat', 'exportDetail', 'exportMode']) $(`#${id}`).disabled = false;
      $('#unleashedMode').disabled = false;
      $('#performanceMode').disabled = false;
      updateUnleashedMode(state.unleashedMode);
      if (!exportCompleted) $('#exportProgress').hidden = true;
      $('#liveDot').className = 'live-dot';
      $('#liveLabel').textContent = 'IDLE';
      updateTrackControls();
      renderPlaylist();
      setCanvasSize();
      setPlayState();
    }
  }

  async function startExport() {
    try {
      const choice = await showExportPreflight();
      if (!choice) return;
      if (choice.test) return await startOfflineExport({
        preflight: choice.preflight,
        durationLimit: Math.min(5, choice.preflight.duration),
        test: true
      });
      if ($('#exportMode').value === 'live') return await startLiveExport({ preflight: choice.preflight });
      return await startOfflineExport({ preflight: choice.preflight });
    } catch (error) {
      if (!state.exporting) {
        $('#exportButton').disabled = false;
        $('#exportButton').classList.remove('recording');
        $('#exportLabel').textContent = 'EXPORT VIDEO';
        $('#exportIcon').textContent = '●';
      }
      throw error;
    }
  }

  async function startLiveExport(options = {}) {
    if (!state.unleashedMode) throw new Error('Live export requires Unleashed mode. Use Offline export for exact frames.');
    if (!audio.src) return;
    if (state.audioMode !== 'deck') stopLiveAudio();
    const [width, height] = $('#resolution').value.split('x').map(Number);
    const fps = Number($('#fps').value);
    const format = $('#videoFormat').value;
    const session = await window.quarticDesktop.beginExport({
      suggestedName: state.audioName || 'quartic-pulse', format,
      requiredBytes: options.preflight?.requiredBytes,
      finalEncoder: options.preflight?.encoder?.id
    });
    if (!session) return;
    exportSession = session;
    exportSession.mode = 'live';
    liveExportCompleted = false;
    liveExportCancelled = false;
    state.loopBeforeExport = audio.loop;

    try {
      createAudioGraph();
      await audioContext.resume();
      state.exportWidth = width;
      state.exportHeight = height;
      state.exportDetail = Number($('#exportDetail').value);
      state.visualTime = 0;
      state.modulationRotationPhase = 0;
      resetPulseEvents();
      state.exporting = true;
      renderPlaylist();
      audio.loop = false;
      $('#loopPlayback').disabled = true;
      document.body.classList.add('exporting');
      document.body.classList.toggle('hide-export-preview', !$('#showExportPreview').checked);
      state.exportedPath = null;
      setStageExportMode('live');
      beginExportProgress('Live recording 0% | overall 0%', 'Live recording 0% | overall 0%');
      setCanvasSize();

      const canvasStream = canvas.captureStream(fps);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...recordingDestination.stream.getAudioTracks()
      ]);
      const mimeType = chooseRecorderType();
      const bitsPerPixel = width >= 3840 ? .13 : .1;
      const videoBitsPerSecond = Math.round(width * height * fps * bitsPerPixel);
      mediaRecorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond });
      appendQueue = Promise.resolve();

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (!event.data.size) return;
        appendQueue = appendQueue.then(async () => {
          const bytes = await event.data.arrayBuffer();
          await window.quarticDesktop.appendExport(session.id, bytes);
        });
      });
      mediaRecorder.addEventListener('error', (event) => showToast(`Recorder error: ${event.error?.message || 'unknown error'}`, true));
      mediaRecorder.addEventListener('stop', finishLiveExport, { once: true });

      audio.currentTime = 0;
      mediaRecorder.start(1000);
      await audio.play();
      $('#exportButton').classList.add('recording');
      $('#exportLabel').textContent = 'STOP & SAVE';
      $('#exportIcon').textContent = '■';
      $('#revealButton').hidden = true;
      $('#resolution').disabled = true;
      $('#fps').disabled = true;
      $('#videoFormat').disabled = true;
      $('#exportDetail').disabled = true;
      $('#exportMode').disabled = true;
      $('#unleashedMode').disabled = true;
      $('#performanceMode').disabled = true;
      $('#liveDot').className = 'live-dot recording';
      $('#liveLabel').textContent = 'RECORDING';
      showToast(`Recording ${width}×${height} at ${fps} FPS for ${format.toUpperCase()} export`);
    } catch (error) {
      if (exportSession?.id) await window.quarticDesktop.abortExport(exportSession.id).catch(() => {});
      exportSession = null;
      state.exporting = false;
      renderPlaylist();
      audio.loop = state.loopBeforeExport;
      $('#loopPlayback').disabled = false;
      document.body.classList.remove('exporting', 'hide-export-preview');
      $('#exportProgress').hidden = true;
      setCanvasSize();
      showToast(error.message, true);
    }
  }

  function resumeOfflineExportClock() {
    if (exportPauseStartedAt) exportPausedDuration += performance.now() - exportPauseStartedAt;
    exportPauseStartedAt = 0;
    offlineExportPaused = false;
    $('#pauseExportButton').textContent = 'PAUSE';
  }

  function togglePauseExport() {
    if (exportSession?.mode !== 'offline' || !state.offlineExporting || offlineExportCancelled) return;
    if (offlineExportPaused) {
      resumeOfflineExportClock();
      $('#stageRenderNote').textContent = 'Offline rendering resumed from the next exact frame.';
      setExportProgress(exportProgressOverall, $('#exportProgressText').textContent, `Rendering resumed · overall ${Math.floor(exportProgressOverall * 100)}%`);
    } else {
      offlineExportPaused = true;
      exportPauseStartedAt = performance.now();
      $('#pauseExportButton').textContent = 'RESUME';
      $('#stageRenderNote').textContent = 'Offline rendering is paused safely between frames.';
      $('#stageRenderText').textContent = `Paused at ${Math.floor(exportProgressOverall * 100)}%`;
      $('#stageRenderMeta').textContent = `Paused · elapsed ${formatTime((performance.now() - exportStartedAt - exportPausedDuration) / 1000)}`;
    }
  }

  function endAndFinishExport() {
    if (exportSession?.mode === 'offline') {
      if (!state.offlineExporting) return;
      resumeOfflineExportClock();
      offlineExportFinishRequested = true;
      $('#stageRenderNote').textContent = 'Stopping after the current frame, then finishing and saving the shortened video.';
      $('#exportLabel').textContent = 'ENDING & FINISHING…';
      $('#exportButton').disabled = true;
      setExportActionButtons(false, true);
      return;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      audio.pause();
      mediaRecorder.stop();
    }
  }

  function cancelExport() {
    if (!state.exporting || !exportSession) return;
    if (!window.confirm('Cancel this export and permanently discard its temporary output?')) return;
    $('#stageRenderNote').textContent = 'Cancelling the export and discarding its temporary output.';
    $('#exportLabel').textContent = 'CANCELLING…';
    $('#exportButton').disabled = true;
    setExportActionButtons(false, false);
    if (exportSession.mode === 'offline') {
      resumeOfflineExportClock();
      offlineExportCancelled = true;
      if (!state.offlineExporting) window.quarticDesktop.abortOfflineExport(exportSession.id).catch(() => {});
      return;
    }
    liveExportCancelled = true;
    audio.pause();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  function stopExport() {
    endAndFinishExport();
  }

  async function finishLiveExport() {
    const session = exportSession;
    $('#exportLabel').textContent = 'FINALIZING…';
    $('#exportButton').disabled = true;
    setExportActionButtons(false, false);
    try {
      await appendQueue;
      if (liveExportCancelled) {
        await window.quarticDesktop.abortExport(session.id).catch(() => {});
        showToast('Live export cancelled and temporary files discarded');
        return;
      }
      setExportProgress(.80, 'Recording complete | finalizing and saving | overall 80%', 'Recording complete | finalizing 0% | overall 80%');
      const result = await window.quarticDesktop.finishExport(session.id);
      state.exportedPath = result.outputPath;
      liveExportCompleted = true;
      recordExportResult(result, { mode: 'live', width: state.exportWidth, height: state.exportHeight, fps: Number($('#fps').value), duration: audio.currentTime });
      completeExportProgress(result.outputPath);
      $('#revealButton').hidden = false;
      showToast(result.warning || `Export complete: ${result.outputPath}`, Boolean(result.warning));
    } catch (error) {
      showToast(error.message || 'Video export failed.', true);
    } finally {
      state.exporting = false;
      audio.loop = state.loopBeforeExport;
      $('#loopPlayback').disabled = false;
      document.body.classList.remove('exporting', 'hide-export-preview');
      exportSession = null;
      mediaRecorder = null;
      $('#exportButton').classList.remove('recording');
      updateTrackControls();
      renderPlaylist();
      $('#exportLabel').textContent = 'EXPORT VIDEO';
      $('#exportIcon').textContent = '●';
      $('#resolution').disabled = false;
      $('#fps').disabled = false;
      $('#videoFormat').disabled = false;
      $('#exportDetail').disabled = false;
      $('#exportMode').disabled = false;
      $('#unleashedMode').disabled = false;
      $('#performanceMode').disabled = false;
      updateUnleashedMode(state.unleashedMode);
      if (!liveExportCompleted) $('#exportProgress').hidden = true;
      liveExportCancelled = false;
      $('#liveDot').className = 'live-dot';
      $('#liveLabel').textContent = 'IDLE';
      setCanvasSize();
      setPlayState();
    }
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
  $('#playlistRemoveButton').addEventListener('click', () => removeCurrentPlaylistItem().catch((error) => showToast(error.message, true)));
  $('#playlistClearButton').addEventListener('click', clearPlaylist);
  $('#playButton').addEventListener('click', () => togglePlayback().catch((error) => showToast(error.message, true)));
  $('#restartButton').addEventListener('click', () => {
    audio.currentTime = 0;
    resetPulseEvents();
  });
  $('#skipBackButton').addEventListener('click', () => {
    if (Number.isFinite(audio.duration) && !state.exporting) audio.currentTime = Math.max(0, audio.currentTime - 10);
  });
  $('#skipForwardButton').addEventListener('click', () => {
    if (Number.isFinite(audio.duration) && !state.exporting) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  });
  $('#volume').addEventListener('input', (event) => {
    state.monitorVolume = Number(event.target.value);
    $('#volumeValue').value = `${Math.round(state.monitorVolume * 100)}%`;
    updateMonitorGain();
  });
  $('#muteButton').addEventListener('click', () => {
    state.monitorMuted = !state.monitorMuted;
    $('#muteButton').setAttribute('aria-pressed', String(state.monitorMuted));
    $('#muteButton').textContent = state.monitorMuted ? 'UNMUTE MONITOR' : 'MUTE MONITOR';
    updateMonitorGain();
  });
  $('#playbackRate').addEventListener('change', (event) => {
    audio.playbackRate = Number(event.target.value);
    audio.defaultPlaybackRate = audio.playbackRate;
  });
  $('#loopPlayback').addEventListener('change', (event) => { audio.loop = event.target.checked; });
  $('#frequencyColor').addEventListener('change', (event) => { state.frequencyColorEnabled = event.target.checked; });
  $('#frequencyColorAmount').addEventListener('input', (event) => {
    state.frequencyColorAmount = Number(event.target.value);
    $('#frequencyColorAmountValue').value = normalizedPercent('frequencyColorAmount', state.frequencyColorAmount);
  });
  $('#analysisSmoothing').addEventListener('input', (event) => {
    state.analysisSmoothing = Number(event.target.value);
    $('#analysisSmoothingValue').value = `${Math.round(state.analysisSmoothing * 100)}%`;
    if (analyser) analyser.smoothingTimeConstant = state.analysisSmoothing;
  });
  $('#beatSensitivity').addEventListener('input', (event) => {
    state.beatSensitivity = Number(event.target.value);
    $('#beatSensitivityValue').value = `${Math.round(state.beatSensitivity * 100)}%`;
    resetBeatDetector({ keepTotal: true });
  });
  $('#beatCooldown').addEventListener('input', (event) => {
    state.beatCooldownMs = Number(event.target.value);
    $('#beatCooldownValue').value = `${Math.round(state.beatCooldownMs)} ms`;
    state.beatCooldownRemaining = Math.min(state.beatCooldownRemaining, state.beatCooldownMs / 1000);
  });
  $('#frequencyBandMode').addEventListener('change', (event) => {
    state.frequencyBandMode = event.target.value;
    updateFrequencyBandUi();
  });
  ['frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling'].forEach((id) => {
    $(`#${id}`).addEventListener('input', (event) => setFrequencyBoundary(id, Number(event.target.value)));
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
    else if (state.playlistIndex < state.playlist.length - 1) changePlaylistTrack(1, true).catch((error) => showToast(error.message, true));
  });
  audio.addEventListener('loadedmetadata', () => {
    updateUiMeters();
  });
  audio.addEventListener('error', () => {
    showToast('The local audio file could not be decoded.', true);
  });

  $('#timeline').addEventListener('pointerdown', (event) => {
    if (!Number.isFinite(audio.duration) || state.exporting) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration;
  });

  $('#iterations').addEventListener('input', (event) => {
    state.iterations = Number(event.target.value);
    $('#iterationsValue').value = state.iterations;
  });
  $('#visualStyle').addEventListener('change', (event) => {
    state.visualStyle = Number(event.target.value);
    document.body.dataset.visualStyle = String(state.visualStyle);
    const names = ['Fractal', 'Spectrum Bars', 'Radial Spectrum', 'Pulse Rings', 'Waveform Field', '3D Mandelbulb'];
    updateVisualStyleOptions();
    showToast(`${names[state.visualStyle] || names[0]} selected`);
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

  document.querySelector('.settings-tabs').addEventListener('click', (event) => {
    const button = event.target.closest('.settings-tab');
    if (button) activateTab(button.dataset.tab);
  });
  document.querySelector('.music-subtabs').addEventListener('click', (event) => {
    const button = event.target.closest('.music-subtab');
    if (button) activateTab(button.dataset.musicTab);
  });
  document.querySelector('.appearance-subtabs').addEventListener('click', (event) => {
    const button = event.target.closest('.appearance-subtab');
    if (button) activateTab(button.dataset.appearanceTab);
  });
  document.querySelector('.live-subtabs').addEventListener('click', (event) => {
    const button = event.target.closest('.live-subtab');
    if (button) activateTab(button.dataset.liveTab);
  });
  $('#showExportPreview').addEventListener('change', (event) => {
    if (state.exporting) document.body.classList.toggle('hide-export-preview', !event.target.checked);
  });
  const savedExportCompleteSound = localStorage.getItem('quarticPulseExportCompleteSound');
  if (savedExportCompleteSound !== null) $('#exportCompleteSound').checked = savedExportCompleteSound === 'true';
  $('#exportCompleteSound').addEventListener('change', (event) => {
    localStorage.setItem('quarticPulseExportCompleteSound', String(event.target.checked));
  });
  $('#resolution').addEventListener('change', updateExportPerformanceNote);
  $('#fps').addEventListener('change', updateExportPerformanceNote);
  $('#exportMode').addEventListener('change', updateExportPerformanceNote);
  $('#exportDetail').addEventListener('change', updateExportPerformanceNote);
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
    const modulation = state.modulationValues || {};
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
        + state.modulationRotationPhase,
      worldScale: 3.15 * pulse / (state.zoom * zoom * cameraMotion.zoom),
      centerOffsetX: Math.cos(orbitAngle) * orbitRadius + cameraMotion.x,
      centerOffsetY: Math.sin(orbitAngle * 1.17) * orbitRadius + cameraMotion.y,
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

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * .001);
    if (state.visualStyle === 5) {
      state.bulbCamera = clamp(state.bulbCamera / factor, 2.25, 5.25);
      $('#bulbCamera').value = String(state.bulbCamera);
      $('#bulbCamera').dispatchEvent(new Event('input', { bubbles: true }));
      $('#bulbCamera')._syncNumericValue?.();
      return;
    }
    state.zoom = Math.max(.4, Math.min(12000, state.zoom * factor));
    updateZoomControls();
  }, { passive: false });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    state.cameraPath = null;
    if (state.visualStyle === 5) {
      state.drag = {
        mode: 'bulb', pointerId: event.pointerId,
        startX: event.clientX, startY: event.clientY,
        yaw: state.bulbYaw, pitch: state.bulbPitch
      };
      return;
    }
    const transform = currentFractalDragTransform();
    const plane = pointerToFractalPlane(event.clientX, event.clientY, transform);
    state.drag = {
      pointerId: event.pointerId,
      anchorX: state.center.x + transform.centerOffsetX + plane.x * transform.worldScale,
      anchorY: state.center.y + transform.centerOffsetY + plane.y * transform.worldScale
    };
  });
  canvas.addEventListener('pointermove', (event) => {
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
  const endCanvasDrag = (event) => {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    state.drag = null;
  };
  canvas.addEventListener('pointerup', endCanvasDrag);
  canvas.addEventListener('pointercancel', endCanvasDrag);

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
  $('#endExportButton').addEventListener('click', endAndFinishExport);
  $('#cancelExportButton').addEventListener('click', cancelExport);
  $('#pauseExportButton').addEventListener('click', togglePauseExport);
  $('#clearExportHistoryButton').addEventListener('click', () => {
    if (!exportHistory.length || !window.confirm('Clear the recent export history? Exported video files will not be deleted.')) return;
    exportHistory = [];
    localStorage.removeItem(exportHistoryStorageKey);
    renderExportHistory();
  });
  $('#exportHistoryList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-export-action]');
    if (!button) return;
    const entry = exportHistory.find((item) => item.id === button.dataset.exportId);
    if (!entry) return;
    const operation = button.dataset.exportAction === 'open'
      ? window.quarticDesktop.openExport(entry.outputPath)
      : window.quarticDesktop.revealExport(entry.outputPath);
    operation.catch((error) => showToast(error.message, true));
  });
  $('#exportRecoveryList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-recovery-action]');
    if (!button || state.exporting) return;
    const id = button.dataset.recoveryId;
    if (button.dataset.recoveryAction === 'recover') {
      recoverInterruptedExport(id).catch((error) => showToast(`Recovery failed: ${error.message}`, true));
    } else if (window.confirm('Discard this interrupted export and its temporary master?')) {
      window.quarticDesktop.discardRecoverableExport(id)
        .then(refreshRecoverableExports)
        .catch((error) => showToast(error.message, true));
    }
  });
  $('#revealButton').addEventListener('click', () => {
    if (state.exportedPath) window.quarticDesktop.revealExport(state.exportedPath);
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName)) {
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
  });

  bindCustomPalette();
  renderPlaylist();
  loadExportHistory();
  if (!isObsOutput) refreshRecoverableExports();
  initializeVisualEffectControls();
  initializeFractalLibrary();
  initializeNumericSliders();
  initializeSettingTools();
  initializePaletteTools();
  initializeInterfaceMode();
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
  updateExportPerformanceNote();
  if (!isObsOutput) refreshExportEncoderStatus();
  updateObsChromaUi();
  updateObsOutputUi(false);
  initializePanelResizer();
  if (!isObsOutput) {
    initializeModulationMatrix();
    initializeProfileManager();
    initializeShowSequencer();
    initializeObsAutomation();
    initializeAdvancedOutput();
    initializeLiveControls();
    initializeCameraTools();
    initializeCreativeTools();
    initializePerformanceAssistant();
    initializeSessionAutosave();
    refreshAudioInputs({ requestPermission: false, silent: true }).catch(() => {});
    refreshWindowsOutputs({ silent: true }).catch(() => {});
    window.quarticDesktop.onObsOutputStatus(updateObsOutputUi);
    window.quarticDesktop.getObsOutputStatus().then(updateObsOutputUi).catch(() => {});
    initializeVisualSafety();
  }
  activateTab('music');
  requestAnimationFrame(render);
})();
